import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo className="text-2xl" />
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
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {t("auth.or")}{" "}
            <div className="h-px flex-1 bg-border" />
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              toast.info(t("auth.backendRequired"));
            }}
          >
            {mode === "up" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" disabled placeholder={t("auth.name")} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" disabled placeholder="voce@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" disabled placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" variant="secondary" disabled>
              {mode === "in" ? t("auth.signIn") : t("auth.signUp")}
            </Button>
            <p className="text-[11px] text-muted-foreground">{t("auth.backendRequired")}</p>
          </form>

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
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? t("auth.noAccount") : t("auth.haveAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
