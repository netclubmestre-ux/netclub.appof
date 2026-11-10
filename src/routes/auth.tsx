import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, MailCheck, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useDataMode, useRepository } from "@/data/provider";
import { RepositoryError } from "@/data/repository";
import { checkSupabaseHealth, isSupabaseConfigured } from "@/data/supabase-client";
import { Logo } from "@/components/netclub/Logo";
import { LanguageSelect } from "@/components/netclub/LanguageSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — NetClub" },
      { name: "description", content: "Entre ou crie sua conta no NetClub." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const repository = useRepository();
  const { isDemo } = useDataMode();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const health = useQuery({
    queryKey: ["backend-health"],
    queryFn: ({ signal }) => checkSupabaseHealth(signal),
    enabled: !isDemo && isSupabaseConfigured(),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  function messageFor(error: unknown) {
    if (error instanceof RepositoryError) {
      if (error.code === "INVALID_CREDENTIALS") return t("auth.invalid");
      if (error.code === "EMAIL_NOT_CONFIRMED") return t("auth.emailConfirm");
      if (error.code === "EMAIL_TAKEN") return t("auth.emailInUse");
      if (error.code === "WEAK_PASSWORD") return t("auth.weakPassword");
      if (error.code === "NETWORK") return t("errors.network");
      if (error.code === "BACKEND_REQUIRED") return t("auth.demoUnavailable");
      if (error.code === "INVALID" && error.message === "rate_limit") return t("auth.rateLimit");
    }
    return t("errors.generic");
  }

  async function signInDemo() {
    setLoading(true);
    try {
      await repository.signInDemo();
      queryClient.clear();
      navigate({ to: "/home", replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function signUpDemo() {
    if (!name.trim()) {
      toast.error(t("onboarding.required"));
      return;
    }
    setLoading(true);
    try {
      await repository.signUpDemo(name);
      queryClient.clear();
      navigate({ to: "/onboarding", replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "up" && !name.trim()) {
      toast.error(t("onboarding.required"));
      return;
    }
    if (!email.trim() || !password) {
      toast.error(t("onboarding.required"));
      return;
    }
    if (mode === "up" && password.length < 8) {
      toast.error(t("auth.weakPassword"));
      return;
    }

    setLoading(true);
    try {
      if (mode === "in") {
        await repository.signIn(email.trim(), password);
        queryClient.clear();
        navigate({ to: "/home", replace: true });
        return;
      }

      const result = await repository.signUp({
        email: email.trim(),
        password,
        fullName: name.trim(),
      });
      if (result.needsConfirmation) {
        setConfirmationEmail(email.trim());
        toast.success(t("auth.emailConfirm"));
        return;
      }
      queryClient.clear();
      navigate({ to: "/onboarding", replace: true });
    } catch (error) {
      toast.error(messageFor(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo className="h-8" />
          </Link>
          <div className="w-36">
            <LanguageSelect className="h-8 w-full text-xs" />
          </div>
        </div>

        <div className="surface p-6 fade-up">
          <h1 className="text-2xl font-semibold">
            {mode === "in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "in" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
          </p>

          {!isDemo && health.data === false && (
            <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <WifiOff className="h-4 w-4" /> {t("auth.backendDownTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("auth.backendDownBody")}
              </p>
              <button
                type="button"
                onClick={() => void health.refetch()}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
                disabled={health.isFetching}
              >
                {health.isFetching ? t("common.loading") : t("common.retry")}
              </button>
            </div>
          )}

          {isDemo ? (
            <div className="mt-5 rounded-xl border border-primary/25 bg-primary-deep/25 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-accent-foreground">
                <Info className="h-4 w-4" /> {t("auth.demoTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("auth.demoBody")}
              </p>

              {mode === "up" && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="demo-name">{t("auth.name")}</Label>
                  <Input
                    id="demo-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ana Ribeiro"
                  />
                </div>
              )}

              <Button
                className="mt-3 w-full"
                onClick={mode === "in" ? signInDemo : signUpDemo}
                disabled={loading}
              >
                {mode === "in" ? t("auth.demoSignIn") : t("auth.demoSignUp")}
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">{t("auth.demoNote")}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{t("auth.demoUnavailable")}</p>
            </div>
          ) : confirmationEmail ? (
            <div className="mt-5 rounded-xl border border-primary/25 bg-primary-deep/25 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                <MailCheck className="h-4 w-4" /> {t("auth.confirmEmailTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("auth.confirmEmailBody", { email: confirmationEmail })}
              </p>
              <Button
                className="mt-3 w-full"
                variant="secondary"
                onClick={() => {
                  setConfirmationEmail(null);
                  setMode("in");
                  setPassword("");
                }}
              >
                {t("auth.signIn")}
              </Button>
            </div>
          ) : (
            <form className="mt-5 space-y-3" onSubmit={submit}>
              {mode === "up" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder={t("auth.name")}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="voce@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {mode === "in" ? t("auth.signIn") : t("auth.signUp")}
              </Button>
              <p className="text-[11px] text-muted-foreground">{t("auth.backendNote")}</p>
            </form>
          )}

          <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => toast.info(t("auth.googleUnavailable"))}
              className="text-left hover:text-primary"
            >
              {t("auth.google")}
            </button>
            <Link to="/reset-password" className="hover:text-primary">
              {t("auth.forgot")}
            </Link>
            <p className="leading-relaxed">{t("auth.termsNotice")}</p>
          </div>

          <button
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setConfirmationEmail(null);
            }}
          >
            {mode === "in" ? t("auth.noAccount") : t("auth.haveAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
