import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Bitcoin,
  ExternalLink,
  Landmark,
  LineChart,
  Megaphone,
  Newspaper,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useI18n, type TranslationKey } from "@/i18n";
import { announcementsQuery, meQuery, newsQuery, quotesQuery } from "@/data/queries";
import type { MarketKind, MarketQuote, NewsItem } from "@/data/types";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { Tag } from "@/components/netclub/Tag";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/official")({
  head: () => ({
    meta: [
      { title: "Canal Oficial — NetClub" },
      { name: "description", content: "Mercado financeiro e digital, com fonte e horário." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(quotesQuery),
      queryClient.ensureQueryData(newsQuery),
      queryClient.ensureQueryData(announcementsQuery),
    ]),
  component: OfficialPage,
});

type Tab = "stocks" | "crypto" | "fx" | "news";

const TABS: { id: Tab; labelKey: TranslationKey; icon: typeof LineChart }[] = [
  { id: "stocks", labelKey: "official.stocks", icon: LineChart },
  { id: "crypto", labelKey: "official.crypto", icon: Bitcoin },
  { id: "fx", labelKey: "official.fx", icon: Landmark },
  { id: "news", labelKey: "official.news", icon: Newspaper },
];

const NEWS_CATEGORIES: { id: NewsItem["category"] | "all"; labelKey: TranslationKey }[] = [
  { id: "all", labelKey: "official.allCategories" },
  { id: "finance", labelKey: "landing.featureMarketTitle" },
  { id: "digital", labelKey: "category.digitalBusiness" },
  { id: "technology", labelKey: "skill.programming" },
  { id: "ai", labelKey: "skill.ai" },
  { id: "entrepreneurship", labelKey: "category.entrepreneurship" },
];

function OfficialPage() {
  const { t, formatNumber, formatDate } = useI18n();
  const { data: quotes = [] } = useSuspenseQuery(quotesQuery);
  const { data: news = [] } = useSuspenseQuery(newsQuery);
  const { data: announcements = [] } = useSuspenseQuery(announcementsQuery);
  const [tab, setTab] = useState<Tab>("stocks");
  const [category, setCategory] = useState<NewsItem["category"] | "all">("all");

  const kindByTab: Record<Exclude<Tab, "news">, MarketKind> = {
    stocks: "stock",
    crypto: "crypto",
    fx: "fx",
  };

  const filteredNews =
    category === "all" ? news : news.filter((item) => item.category === category);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("official.title")} subtitle={t("official.subtitle")} />

      <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-[11px] leading-relaxed text-gold">
        {t("official.disclaimer")}
      </div>

      <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto rounded-xl border bg-surface-2/50 p-1">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={cn(
              "flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              tab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {t(labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab !== "news" ? (
          <QuotePanel
            quotes={quotes.filter((quote) => quote.kind === kindByTab[tab])}
            emptyLabel={t(TABS.find((item) => item.id === tab)!.labelKey)}
            formatNumber={formatNumber}
            formatDate={formatDate}
            t={t}
          />
        ) : (
          <div className="space-y-4">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {NEWS_CATEGORIES.map((item) => (
                <Tag
                  key={item.id}
                  active={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className="shrink-0"
                >
                  {t(item.labelKey)}
                </Tag>
              ))}
            </div>

            {filteredNews.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={t("official.noNews")}
                body={t("official.unavailableBody")}
              />
            ) : (
              <ul className="space-y-3">
                {filteredNews.map((item) => (
                  <li key={item.id} className="surface p-4">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{t("official.source", { source: item.source })}</span>
                      <span>{formatDate(item.publishedAt, { dateStyle: "medium" })}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {t("official.readMore")} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Megaphone className="h-4 w-4 text-gold" /> {t("official.announcements")}
        </h2>
        {announcements.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("official.noAnnouncements")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {announcements.map((item) => (
              <li key={item.id} className="surface p-4">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.body}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {formatDate(item.createdAt, { dateStyle: "medium" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
        {t("official.configNote")}
      </p>
    </div>
  );
}

function QuotePanel({
  quotes,
  emptyLabel,
  formatNumber,
  formatDate,
  t,
}: {
  quotes: MarketQuote[];
  emptyLabel: string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  if (quotes.length === 0) {
    return (
      <div className="surface flex flex-col items-center px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
          <LineChart className="h-7 w-7 text-gold" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold">
          {t("official.unavailableTitle")}
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {t("official.unavailableBody")}
        </p>
        <span className="mt-4 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] text-gold">
          {emptyLabel} · {t("official.providerPending")}
        </span>
      </div>
    );
  }

  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">{t("official.asset")}</th>
            <th className="px-4 py-3">{t("official.price")}</th>
            <th className="px-4 py-3">{t("official.updated")}</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => {
            const positive = (quote.changePercent ?? 0) >= 0;
            return (
              <tr key={`${quote.kind}-${quote.symbol}`} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold">{quote.name}</p>
                  <p className="text-[11px] text-muted-foreground">{quote.symbol}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {quote.price === undefined
                      ? t("common.unavailable")
                      : formatNumber(quote.price, {
                          style: "currency",
                          currency: quote.currency ?? "BRL",
                          maximumFractionDigits: 2,
                        })}
                  </p>
                  {quote.changePercent !== undefined && (
                    <p
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px]",
                        positive ? "text-primary" : "text-destructive",
                      )}
                    >
                      {positive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatNumber(quote.changePercent, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      %
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-[11px] text-muted-foreground">
                  {quote.updatedAt
                    ? formatDate(quote.updatedAt, { dateStyle: "short", timeStyle: "short" })
                    : t("common.unavailable")}
                  {quote.source && (
                    <span className="block">{t("official.source", { source: quote.source })}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
