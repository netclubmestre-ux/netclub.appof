import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Bookmark, Lock, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import {
  clubsQuery,
  feedQuery,
  meQuery,
  peopleQuery,
  savedSearchesQuery,
  subscriptionQuery,
} from "@/data/queries";
import {
  EXPERIENCES,
  GOALS,
  SKILLS,
  type Experience,
  type GoalId,
  type SkillId,
} from "@/data/types";
import { RepositoryError } from "@/data/repository";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { PersonCard } from "@/components/netclub/PersonCard";
import { ClubCard } from "@/components/netclub/ClubCard";
import { PostCard } from "@/components/netclub/PostCard";
import { Tag } from "@/components/netclub/Tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Busca — NetClub" },
      { name: "description", content: "Busque pessoas, grupos e publicações no NetClub." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(peopleQuery),
      queryClient.ensureQueryData(clubsQuery),
      queryClient.ensureQueryData(feedQuery),
      queryClient.ensureQueryData(subscriptionQuery),
      queryClient.ensureQueryData(savedSearchesQuery),
    ]),
  component: SearchPage,
});

type Tab = "people" | "clubs" | "posts";

function SearchPage() {
  const { t } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: people = [] } = useSuspenseQuery(peopleQuery);
  const { data: clubs = [] } = useSuspenseQuery(clubsQuery);
  const { data: posts = [] } = useSuspenseQuery(feedQuery);
  const { data: subscription } = useSuspenseQuery(subscriptionQuery);
  const { data: savedSearches = [] } = useSuspenseQuery(savedSearchesQuery);

  const [term, setTerm] = useState("");
  const [tab, setTab] = useState<Tab>("people");
  const [skills, setSkills] = useState<SkillId[]>([]);
  const [goals, setGoals] = useState<GoalId[]>([]);
  const [experience, setExperience] = useState<Experience | "any">("any");
  const [saveOpen, setSaveOpen] = useState(false);
  const [searchName, setSearchName] = useState("");

  const isPremium = subscription.tier === "premium";
  const normalized = term.trim().toLowerCase();
  const hasFilters = skills.length > 0 || goals.length > 0 || experience !== "any";

  const filteredPeople = useMemo(() => {
    if (!me) return [];
    return people.filter((person) => {
      const matchesTerm =
        !normalized ||
        person.fullName.toLowerCase().includes(normalized) ||
        person.username.toLowerCase().includes(normalized) ||
        person.headline.toLowerCase().includes(normalized) ||
        person.area.toLowerCase().includes(normalized) ||
        person.skills.some(
          (skill) =>
            t(`skill.${skill}`).toLowerCase().includes(normalized) ||
            skill.toLowerCase().includes(normalized),
        ) ||
        person.goals.some((goal) => t(`goal.${goal}`).toLowerCase().includes(normalized));
      const matchesSkills =
        skills.length === 0 || skills.some((skill) => person.skills.includes(skill));
      const matchesGoals = goals.length === 0 || goals.some((goal) => person.goals.includes(goal));
      const matchesExperience = experience === "any" || person.experience === experience;
      return matchesTerm && matchesSkills && matchesGoals && matchesExperience;
    });
  }, [people, normalized, skills, goals, experience, me, t]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      if (!normalized) return true;
      return (
        club.name.toLowerCase().includes(normalized) ||
        club.description.toLowerCase().includes(normalized) ||
        t(`category.${club.category}`).toLowerCase().includes(normalized)
      );
    });
  }, [clubs, normalized, t]);

  const filteredPosts = useMemo(() => {
    if (!normalized) return posts;
    return posts.filter((post) => post.content.toLowerCase().includes(normalized));
  }, [posts, normalized]);

  const save = useMutation({
    mutationFn: () => repository.saveSearch({ name: searchName, skills, goals, experience }),
    onSuccess: () => {
      setSaveOpen(false);
      setSearchName("");
      void queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast.success(t("common.success"));
    },
    onError: (error) => {
      if (error instanceof RepositoryError && error.code === "PREMIUM_REQUIRED") {
        toast.error(t("search.advancedLocked"));
      } else {
        toast.error(t("errors.generic"));
      }
    },
  });

  function toggleSkill(skill: SkillId) {
    setSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    );
  }

  function toggleGoal(goal: GoalId) {
    setGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  }

  if (!me) return null;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "people", label: t("search.users"), count: filteredPeople.length },
    { id: "clubs", label: t("search.clubs"), count: filteredClubs.length },
    { id: "posts", label: t("search.posts"), count: filteredPosts.length },
  ];

  const results =
    tab === "people"
      ? filteredPeople.length
      : tab === "clubs"
        ? filteredClubs.length
        : filteredPosts.length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("search.title")} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          type="search"
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className="pl-9"
        />
      </div>

      <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto rounded-xl border bg-surface-2/50 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors sm:py-1.5",
              tab === item.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span className="rounded-full bg-surface-2 px-1.5 text-[10px]">{item.count}</span>
          </button>
        ))}
      </div>

      <section className="surface mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> {t("search.filters")}
            {!isPremium && <Lock className="h-3.5 w-3.5 text-gold" />}
          </h2>
          {isPremium ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSaveOpen(true)}
              disabled={!hasFilters}
              title={!hasFilters ? t("search.clearFilters") : t("premium.saveSearch")}
            >
              <Bookmark className="mr-1.5 h-3.5 w-3.5" /> {t("premium.saveSearch")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-gold/40 text-gold hover:bg-gold/10"
              disabled
              title={t("search.advancedLocked")}
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" /> {t("premium.locked")}
            </Button>
          )}
        </div>

        {!isPremium ? (
          <p className="mt-2 rounded-xl border border-gold/25 bg-gold/5 p-3 text-[11px] text-gold">
            {t("search.advancedLocked")}{" "}
            <Link to="/premium" className="font-semibold underline">
              {t("premium.upgrade")}
            </Link>
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("search.skills")}
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SKILLS.map((skill) => (
                  <Tag
                    key={skill}
                    active={skills.includes(skill)}
                    onClick={() => toggleSkill(skill)}
                  >
                    {t(`skill.${skill}`)}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("search.goals")}
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {GOALS.map((goal) => (
                  <Tag key={goal} active={goals.includes(goal)} onClick={() => toggleGoal(goal)}>
                    {t(`goal.${goal}`)}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("search.experience")}
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Tag active={experience === "any"} onClick={() => setExperience("any")}>
                  {t("common.all")}
                </Tag>
                {EXPERIENCES.map((item) => (
                  <Tag key={item} active={experience === item} onClick={() => setExperience(item)}>
                    {t(`experience.${item}`)}
                  </Tag>
                ))}
              </div>
            </div>
            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSkills([]);
                  setGoals([]);
                  setExperience("any");
                }}
              >
                <X className="mr-1.5 h-3.5 w-3.5" /> {t("search.clearFilters")}
              </Button>
            )}
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-muted-foreground">
        {normalized || hasFilters
          ? t("search.results", { count: results })
          : t("search.emptyQuery")}
      </p>

      <div className="mt-3 space-y-3">
        {!normalized && !hasFilters && <EmptyState icon={Search} title={t("search.emptyQuery")} />}

        {tab === "people" && (normalized || hasFilters) && (
          <>
            {filteredPeople.length === 0 ? (
              <EmptyState icon={Users} title={t("search.empty", { query: term })} />
            ) : (
              filteredPeople.map((person) => (
                <PersonCard key={person.id} profile={person} meId={me.id} />
              ))
            )}
          </>
        )}

        {tab === "clubs" && normalized && (
          <>
            {filteredClubs.length === 0 ? (
              <EmptyState icon={Users} title={t("search.empty", { query: term })} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredClubs.map((club) => (
                  <ClubCard key={club.id} club={club} meId={me.id} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "posts" && normalized && (
          <>
            {filteredPosts.length === 0 ? (
              <EmptyState icon={Search} title={t("search.empty", { query: term })} />
            ) : (
              filteredPosts.map((post) => <PostCard key={post.id} post={post} meId={me.id} />)
            )}
          </>
        )}
      </div>

      {isPremium && savedSearches.length > 0 && (
        <section className="surface mt-6 p-4">
          <h2 className="text-sm font-semibold">{t("premium.savedSearchesTitle")}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {savedSearches.map((saved) => (
              <button
                key={saved.id}
                type="button"
                onClick={() => {
                  setSkills(saved.skills);
                  setGoals(saved.goals);
                  setExperience(saved.experience);
                  setTerm("");
                }}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {saved.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("premium.saveSearch")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="search-name">{t("premium.searchName")}</Label>
            <Input
              id="search-name"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              maxLength={80}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => save.mutate()} disabled={!searchName.trim() || save.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
