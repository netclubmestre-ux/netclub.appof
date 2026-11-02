import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useI18n } from "@/i18n";
import { clubsQuery, meQuery } from "@/data/queries";
import { CLUB_CATEGORIES, type ClubCategory } from "@/data/types";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { ClubCard } from "@/components/netclub/ClubCard";
import { Tag } from "@/components/netclub/Tag";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/clubs/")({
  head: () => ({
    meta: [
      { title: "Grupos — NetClub" },
      { name: "description", content: "Comunidades de networking por área do mercado digital." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(meQuery), queryClient.ensureQueryData(clubsQuery)]),
  component: ClubsPage,
});

function ClubsPage() {
  const { t } = useI18n();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: clubs = [] } = useSuspenseQuery(clubsQuery);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ClubCategory | "all">("all");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return clubs.filter((club) => {
      const matchesTerm =
        !term ||
        club.name.toLowerCase().includes(term) ||
        club.description.toLowerCase().includes(term);
      const matchesCategory = category === "all" || club.category === category;
      return matchesTerm && matchesCategory;
    });
  }, [clubs, query, category]);

  if (!me) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("clubs.title")} subtitle={t("clubs.subtitle")} />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder={t("clubs.searchPlaceholder")}
          aria-label={t("clubs.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Tag active={category === "all"} onClick={() => setCategory("all")}>
          {t("common.all")}
        </Tag>
        {CLUB_CATEGORIES.map((item) => (
          <Tag
            key={item}
            active={category === item}
            onClick={() => setCategory(item)}
            className={cn("shrink-0")}
          >
            {t(`category.${item}`)}
          </Tag>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={t("clubs.noClubs")} body={t("common.noResults")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} meId={me.id} />
          ))}
        </div>
      )}
    </div>
  );
}
