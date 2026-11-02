import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Eye, Heart, Megaphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { feedQuery, meQuery, promotionsQuery, storiesQuery } from "@/data/queries";
import { RepositoryError } from "@/data/repository";
import type { PromotionStatus, PromotionTarget } from "@/data/types";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { Tag } from "@/components/netclub/Tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/promote")({
  head: () => ({
    meta: [
      { title: "Impulsionar conteúdo — NetClub" },
      {
        name: "description",
        content: "Dê mais visibilidade a uma publicação ou story seu.",
      },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(feedQuery),
      queryClient.ensureQueryData(storiesQuery),
      queryClient.ensureQueryData(promotionsQuery),
    ]),
  component: PromotePage,
});

const PERIODS = [3, 7, 14, 30];

const STATUS_KEY: Record<PromotionStatus, "promote.active" | "promote.draft" | "promote.ended"> = {
  active: "promote.active",
  draft: "promote.draft",
  ended: "promote.ended",
};

function PromotePage() {
  const { t, formatDate, formatNumber, formatCurrency } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: feed = [] } = useSuspenseQuery(feedQuery);
  const { data: stories = [] } = useSuspenseQuery(storiesQuery);
  const { data: promotions = [] } = useSuspenseQuery(promotionsQuery);

  const [targetType, setTargetType] = useState<PromotionTarget>("post");
  const [targetId, setTargetId] = useState<string>("");
  const [days, setDays] = useState(7);
  const [budget, setBudget] = useState("50");

  const submit = useMutation({
    mutationFn: () =>
      repository.createPromotion({
        targetType,
        targetId,
        budget: Number(budget) || 0,
        days,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success(t("common.success"));
    },
    onError: (error) => {
      if (error instanceof RepositoryError && error.code === "PAYMENTS_UNAVAILABLE") {
        toast.error(t("promote.paymentPending"));
      } else {
        toast.error(t("errors.generic"));
      }
    },
  });

  if (!me) return null;

  const myPosts = feed.filter((post) => post.authorId === me.id);
  const myStories = stories.filter((story) => story.authorId === me.id);
  const options = targetType === "post" ? myPosts : myStories;
  const selected = options.find((item) => item.id === targetId) ?? null;
  const validBudget = Number(budget) > 0;
  const canSubmit = Boolean(selected) && validBudget && !submit.isPending;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("promote.title")} subtitle={t("promote.subtitle")} />

      <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-[11px] leading-relaxed text-gold">
        {t("promote.paymentPending")}
      </div>

      <section className="surface mt-5 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Megaphone className="h-4 w-4 text-primary" /> {t("promote.createTitle")}
        </h2>

        <div className="mt-4 space-y-5">
          <div>
            <Label>{t("promote.selectContent")}</Label>
            <div className="mt-2 flex gap-2">
              <Tag active={targetType === "post"} onClick={() => setTargetType("post")}>
                {t("promote.feed")}
              </Tag>
              <Tag active={targetType === "story"} onClick={() => setTargetType("story")}>
                {t("promote.stories")}
              </Tag>
            </div>

            <div className="mt-3 space-y-2">
              {options.length === 0 && (
                <p className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">
                  {t("promote.noContent")}
                </p>
              )}
              {options.map((item) => {
                const content = "content" in item ? item.content : item.text;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTargetId(item.id)}
                    aria-pressed={targetId === item.id}
                    className={cn(
                      "block w-full rounded-xl border p-3 text-left text-sm transition-colors",
                      targetId === item.id
                        ? "border-primary/50 bg-primary/10"
                        : "hover:bg-secondary/60",
                    )}
                  >
                    <span className="line-clamp-2 text-muted-foreground">{content}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>{t("promote.period")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PERIODS.map((period) => (
                <Tag key={period} active={days === period} onClick={() => setDays(period)}>
                  {t("promote.days", { count: period })}
                </Tag>
              ))}
            </div>
          </div>

          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="promote-budget">{t("promote.budget")}</Label>
            <div className="relative">
              <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="promote-budget"
                type="number"
                min={1}
                step={1}
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {validBudget ? formatCurrency(Number(budget)) : t("common.unavailable")}
            </p>
          </div>

          <div className="rounded-xl bg-surface-2 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> {t("promote.estimate")}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("promote.estimateUnavailable")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("promote.rulesTitle")}</h3>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {[t("promote.rule1"), t("promote.rule2"), t("promote.rule3"), t("promote.rule4")].map(
                (rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {rule}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <Button onClick={() => submit.mutate()} disabled={!canSubmit}>
              {t("promote.submit")}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("promote.reviewNote")}</p>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-semibold">{t("promote.campaigns")}</h2>
        {promotions.length === 0 ? (
          <EmptyState icon={Megaphone} title={t("promote.noCampaigns")} />
        ) : (
          <ul className="space-y-3">
            {promotions.map((promotion) => (
              <li key={promotion.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {promotion.targetType === "post" ? t("promote.feed") : t("promote.stories")}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(promotion.startsAt, { dateStyle: "short" })} –{" "}
                      {formatDate(promotion.endsAt, { dateStyle: "short" })}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {t(STATUS_KEY[promotion.status])}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {formatNumber(promotion.views)} {t("promote.views")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {formatNumber(promotion.interactions)}{" "}
                    {t("promote.interactions")}
                  </span>
                  <span>{formatCurrency(promotion.budget)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-[11px] text-muted-foreground">
        <Link to="/premium" className="text-primary hover:underline">
          {t("premium.title")}
        </Link>
      </p>
    </div>
  );
}
