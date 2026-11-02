import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
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

function ResetPasswordPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface w-full max-w-sm p-7 fade-up">
        <Link to="/">
          <Logo className="text-2xl" />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">{t("auth.resetTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.resetSubtitle")}</p>

        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            toast.info(t("auth.backendRequired"));
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
            <Input id="new-password" type="password" disabled placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
            <Input id="confirm-password" type="password" disabled placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled>
            {t("auth.updatePassword")}
          </Button>
        </form>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          {t("auth.backendRequired")}
        </p>

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
