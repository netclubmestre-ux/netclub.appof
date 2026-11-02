import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Crown, Lock, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { meQuery, savedSearchesQuery, subscriptionQuery } from "@/data/queries";
import { PageHeader } from "@/components/netclub/PageHeader";
import { Tag } from "@/components/netclub/Tag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({
    meta: [
      { title: "NetClub Premium" },
      { name: "description", content: "NetMach avançado, pesquisas salvas e recursos Premium." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(subscriptionQuery),
      queryClient.ensureQueryData(savedSearchesQuery),
    ]),
  component: PremiumPage,
});

function PremiumPage() {
  const { t, formatDate } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: subscription } = useSuspenseQuery(subscriptionQuery);
  const { data: savedSearches = [] } = useSuspenseQuery(savedSearchesQuery);

  const removeSearch = useMutation({
    mutationFn: (id: string) => repository.deleteSavedSearch(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  if (!me) return null;

  const isPremium = subscription.tier === "premium";
  const statusLabel = isPremium
    ? subscription.status === "active"
      ? t("premium.statusActive")
      : t("premium.statusCanceled")
    : t("premium.statusNone");

  const benefits = [
    {
      icon: Sparkles,
      title: t("premium.benefit1Title"),
      body: t("premium.benefit1Body"),
    },
    {
      icon: Check,
      title: t("premium.benefit2Title"),
      body: t("premium.benefit2Body"),
    },
    {
      icon: Crown,
      title: t("premium.benefit3Title"),
      body: t("premium.benefit3Body"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("premium.title")} subtitle={t("premium.subtitle")} />

      <section className="surface mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("premium.currentPlan")}
          </p>
          <p className="mt-0.5 flex items-center gap-2 font-display text-lg font-semibold">
            {isPremium ? (
              <Crown className="h-5 w-5 text-gold" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            {isPremium ? t("premium.premium") : t("premium.free")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("premium.planStatus")}
          </p>
          <span
            className={cn(
              "mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
              isPremium
                ? "border border-gold/30 bg-gold/10 text-gold"
                : "border bg-surface-2 text-muted-foreground",
            )}
          >
            {statusLabel}
          </span>
          {subscription.renewsAt && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("premium.renewsAt", {
                date: formatDate(subscription.renewsAt, { dateStyle: "medium" }),
              })}
            </p>
          )}
        </div>
      </section>

      {!isPremium && (
        <p className="mb-5 rounded-xl border bg-surface-2/60 p-3 text-xs text-muted-foreground">
          {t("premium.freePlanNote")}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="surface p-5">
          <h2 className="font-display text-lg font-semibold">{t("premium.free")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("premium.freeIncludes")}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              t("nav.home"),
              t("nav.network"),
              t("nav.clubs"),
              t("nav.chat"),
              t("nav.official"),
              t("nav.netmach"),
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-primary" /> {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-muted-foreground">{t("premium.freePlanNote")}</p>
        </article>

        <article className="surface border-gold/40 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-gold">
            <Crown className="h-5 w-5" /> {t("premium.premium")}
          </h2>
          <p className="mt-1 text-xs text-gold/80">{t("premium.premiumIncludes")}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {benefits.map(({ title }) => (
              <li key={title} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-gold" /> {title}
              </li>
            ))}
          </ul>
          <Button
            className="mt-5 w-full bg-gold text-gold-foreground hover:bg-gold/90"
            disabled
            title={t("premium.paymentPending")}
          >
            <Crown className="mr-2 h-4 w-4" /> {t("premium.cta")}
          </Button>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {t("premium.paymentPending")}
          </p>
        </article>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          {t("premium.benefitsTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {benefits.map(({ icon: Icon, title, body }) => (
            <article key={title} className="surface p-4">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              {t("premium.savedSearchesTitle")}
              {!isPremium && <Lock className="h-4 w-4 text-gold" />}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("premium.savedSearchesBody")}</p>
          </div>
          {isPremium ? (
            <Button asChild size="sm" variant="secondary">
              <Link to="/search">{t("search.title")}</Link>
            </Button>
          ) : (
            <Tag className="border-gold/30 bg-gold/10 text-gold">{t("premium.locked")}</Tag>
          )}
        </div>

        {!isPremium ? (
          <div className="mt-4 rounded-xl border border-gold/25 bg-gold/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-gold">
              <Lock className="h-4 w-4" /> {t("premium.locked")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("premium.lockedBody")}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("search.advancedLocked")}</p>
          </div>
        ) : savedSearches.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("premium.noSavedSearches")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {savedSearches.map((search) => (
              <li key={search.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{search.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[
                      ...search.skills.map((skill) => t(`skill.${skill}`)),
                      ...search.goals.map((goal) => t(`goal.${goal}`)),
                      search.experience === "any"
                        ? t("common.all")
                        : t(`experience.${search.experience}`),
                    ].join(" · ")}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("premium.deleteSearch")}
                  title={t("premium.deleteSearch")}
                  onClick={() => removeSearch.mutate(search.id)}
                  disabled={removeSearch.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="font-display text-lg font-semibold">{t("promote.title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("promote.subtitle")}</p>
        <Button asChild size="sm" variant="secondary" className="mt-3">
          <Link to="/promote">{t("promote.createTitle")}</Link>
        </Button>
      </section>

      <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("common.demoNotice")}
      </p>
    </div>
  );
}
