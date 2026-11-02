import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LineChart, MessageCircle, Sparkles, Users } from "lucide-react";
import { useI18n } from "@/i18n";
import { sessionQuery } from "@/data/queries";
import { Logo } from "@/components/netclub/Logo";
import { LanguageSelect } from "@/components/netclub/LanguageSelect";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NetClub — Conecte-se. Compartilhe. Cresça junto." },
      {
        name: "description",
        content: "A rede social de networking para quem vive o mercado digital.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const { data: session } = useQuery(sessionQuery);

  const features = [
    {
      icon: Users,
      title: t("landing.featurePeopleTitle"),
      body: t("landing.featurePeopleBody"),
    },
    {
      icon: Sparkles,
      title: t("landing.featureClubsTitle"),
      body: t("landing.featureClubsBody"),
    },
    {
      icon: LineChart,
      title: t("landing.featureMarketTitle"),
      body: t("landing.featureMarketBody"),
    },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <div className="hidden w-36 sm:block">
            <LanguageSelect className="h-8 w-full text-xs" />
          </div>
          {session ? (
            <Button asChild size="sm">
              <Link to="/home">{t("landing.ctaOpen")}</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">{t("landing.ctaSignIn")}</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center py-12 fade-up md:py-16">
        <p className="text-sm font-medium text-primary">{t("landing.eyebrow")}</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          {t("landing.heroTitle")} <span className="text-primary">{t("landing.heroAccent")}</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          {t("landing.heroSubtitle")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">{t("landing.ctaCreate")}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/premium">{t("nav.premium")}</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="surface mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <MessageCircle className="h-5 w-5 text-gold" />
          <div className="flex-1">
            <h2 className="font-semibold">{t("landing.whyTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("landing.whyBody")}</p>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          {t("landing.disclaimer")}
        </p>
      </main>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t py-5 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} NetClub</span>
        <Link to="/legal/$doc" params={{ doc: "terms" }} className="hover:text-primary">
          {t("legal.termsTitle")}
        </Link>
        <Link to="/legal/$doc" params={{ doc: "privacy" }} className="hover:text-primary">
          {t("legal.privacyTitle")}
        </Link>
        <Link to="/legal/$doc" params={{ doc: "guidelines" }} className="hover:text-primary">
          {t("legal.guidelinesTitle")}
        </Link>
        <Link to="/legal/$doc" params={{ doc: "contact" }} className="hover:text-primary">
          {t("legal.contactTitle")}
        </Link>
      </footer>
    </div>
  );
}
