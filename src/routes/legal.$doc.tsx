import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { useI18n } from "@/i18n";
import { getLegalSections, LEGAL_VERSION, type LegalDocumentId } from "@/i18n/legal-content";
import { Logo } from "@/components/netclub/Logo";

const DOCS = ["terms", "privacy", "guidelines", "contact"] as const;
type DocParam = (typeof DOCS)[number];

const TITLES: Record<
  DocParam,
  "legal.termsTitle" | "legal.privacyTitle" | "legal.guidelinesTitle" | "legal.contactTitle"
> = {
  terms: "legal.termsTitle",
  privacy: "legal.privacyTitle",
  guidelines: "legal.guidelinesTitle",
  contact: "legal.contactTitle",
};

export const Route = createFileRoute("/legal/$doc")({
  head: () => ({
    meta: [{ title: "Documentos legais — NetClub" }],
  }),
  component: LegalPage,
});

function LegalPage() {
  const { doc } = Route.useParams();
  const { t, language, formatDate } = useI18n();
  const valid = DOCS.includes(doc as DocParam);

  if (!valid) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("errors.notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.notFoundBody")}</p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          {t("errors.goHome")}
        </Link>
      </div>
    );
  }

  const key = doc as DocParam;
  const sections = key === "contact" ? [] : getLegalSections(language, key as LegalDocumentId);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/">
          <Logo className="text-xl" />
        </Link>
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("legal.backToApp")}
        </Link>
      </header>

      <main className="surface mt-6 p-6 sm:p-8">
        <h1 className="text-3xl font-bold">{t(TITLES[key])}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("legal.lastUpdated", { date: formatDate(new Date(), { dateStyle: "long" }) })} ·{" "}
          {t("legal.version", { version: LEGAL_VERSION })}
        </p>

        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs leading-relaxed text-gold">
          {t("legal.draftNotice")}
        </div>

        {key === "contact" ? (
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>{t("legal.contactBody")}</p>
            <a
              href={`mailto:${t("legal.contactEmail")}`}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 font-medium text-primary hover:bg-primary/15"
            >
              <Mail className="h-4 w-4" /> {t("legal.contactEmail")}
            </a>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-lg font-semibold">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
