import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/netclub/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — NetClub" },
      { name: "description", content: "Defina uma nova senha para sua conta NetClub." },
      { property: "og:title", content: "Redefinir senha — NetClub" },
      { property: "og:description", content: "Defina uma nova senha para sua conta NetClub." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    // Fluxo PKCE devolve ?code=... em vez de tokens no hash.
    const code = new URLSearchParams(window.location.search).get("code");
    const bootstrap = code
      ? supabase.auth.exchangeCodeForSession(code).then(({ data }) => Boolean(data.session))
      : supabase.auth.getSession().then(({ data }) => Boolean(data.session));

    bootstrap
      .then((hasSession) => {
        if (active) setReady(hasSession);
      })
      .catch(() => {
        if (active) setReady(false);
      });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres");
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada. Entre com a nova senha.");
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar a senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface w-full max-w-sm p-7 fade-up">
        <Logo className="text-3xl" />
        <h1 className="mt-6 text-2xl font-semibold">Definir nova senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Escolha uma nova senha para acessar sua conta."
            : "Abra o link enviado por e-mail para continuar. Se ele expirou, solicite outro na tela de login."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={!ready}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmation">Confirme a nova senha</Label>
            <Input
              id="confirmation"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={!ready}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={!ready || loading}>
            Salvar nova senha
          </Button>
        </form>

        <button
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-primary"
          onClick={() => navigate({ to: "/auth" })}
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}
