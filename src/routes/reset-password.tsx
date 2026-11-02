import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Info, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useDataMode, useRepository } from "@/data/provider";
import { RepositoryError } from "@/data/repository";
import { Logo } from "@/components/netclub/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — NetClub" },
      { name: "description", content: "Redefina a senha da sua conta NetClub." },
    ],
  }),
  component: ResetPasswordPage,
});

/** O Supabase devolve `type=recovery` no hash (fluxo implícito) ou `code` (PKCE). */
function isRecoveryLink() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  const search = window.location.search;
  return (
    hash.includes("type=recovery") || search.includes("code=") || hash.includes("access_token")
  );
}

function ResetPasswordPage() {
  const { t } = useI18n();
  const repository = useRepository();
  const { isDemo } = useDataMode();
  const navigate = useNavigate();
  const [recovery] = useState(isRecoveryLink);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function messageFor(error: unknown) {
    if (error instanceof RepositoryError) {
      if (error.code === "BACKEND_REQUIRED") return t("auth.demoUnavailable");
      if (error.code === "WEAK_PASSWORD") return t("auth.weakPassword");
      if (error.code === "NETWORK") return t("errors.network");
      if (error.code === "INVALID" && error.message === "rate_limit") return t("auth.rateLimit");
    }
    return t("errors.generic");
  }

  async function requestLink(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      toast.error(t("onboarding.required"));
      return;
    }
    setLoading(true);
    try {
      await repository.resetPassword(email.trim());
      setSent(true);
      toast.success(t("auth.checkEmail"));
    } catch (error) {
      toast.error(messageFor(error));
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error(t("auth.weakPassword"));
      return;
    }
    if (password !== confirmation) {
      toast.error(t("auth.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await repository.updatePassword(password);
      toast.success(t("auth.passwordUpdated"));
      navigate({ to: "/home", replace: true });
    } catch (error) {
      toast.error(messageFor(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface w-full max-w-sm p-7 fade-up">
        <Link to="/">
          <Logo className="text-2xl" />
        </Link>

        {recovery ? (
          <>
            <h1 className="mt-6 text-2xl font-semibold">{t("auth.recoveryTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.recoveryBody")}</p>

            <form className="mt-5 space-y-3" onSubmit={savePassword}>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || isDemo}>
                {t("auth.updatePassword")}
              </Button>
            </form>

            {isDemo && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("auth.demoUnavailable")}
              </p>
            )}
          </>
        ) : sent ? (
          <>
            <h1 className="mt-6 flex items-center gap-2 text-2xl font-semibold">
              <MailCheck className="h-6 w-6 text-primary" /> {t("auth.checkEmailTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("auth.checkEmailBody", { email })}
            </p>
            <Button
              className="mt-5 w-full"
              variant="secondary"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              {t("auth.sendResetLink")}
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-semibold">{t("auth.forgot")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.forgotHint")}</p>

            <form className="mt-5 space-y-3" onSubmit={requestLink}>
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
              <Button type="submit" className="w-full" disabled={loading || isDemo}>
                {t("auth.sendResetLink")}
              </Button>
            </form>

            {isDemo ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("auth.demoUnavailable")}
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {t("auth.checkEmail")}
              </p>
            )}
          </>
        )}

        <Link
          to="/auth"
          className="mt-5 block text-center text-sm text-muted-foreground hover:text-primary"
        >
          {t("auth.haveAccount")}
        </Link>
      </div>
    </div>
  );
}
