import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Handshake, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import {
  clubsQuery,
  connectionsQuery,
  feedQuery,
  matchStateQuery,
  meQuery,
  peopleQuery,
} from "@/data/queries";
import { connectionState } from "@/lib/netclub";
import type { Profile } from "@/data/types";
import { PostCard } from "@/components/netclub/PostCard";
import { Stories } from "@/components/netclub/Stories";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import markUrl from "@/assets/netclub-mark.png";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Início — NetClub" },
      { name: "description", content: "Seu feed de networking no NetClub." },
      { property: "og:title", content: "Início — NetClub" },
      { property: "og:description", content: "Seu feed de networking no NetClub." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(feedQuery),
      queryClient.ensureQueryData(clubsQuery),
      queryClient.ensureQueryData(peopleQuery),
      queryClient.ensureQueryData(connectionsQuery),
      queryClient.ensureQueryData(matchStateQuery),
    ]),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const { data: me } = useSuspenseQuery(meQuery);
  if (!me) return null;
  return <HomeContent me={me} />;
}

function HomeContent({ me }: { me: Profile }) {
  const { t, formatNumber } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { data: feed = [] } = useSuspenseQuery(feedQuery);
  const { data: clubs = [] } = useSuspenseQuery(clubsQuery);
  const { data: people = [] } = useSuspenseQuery(peopleQuery);
  const { data: connections = [] } = useSuspenseQuery(connectionsQuery);
  const { data: matchState } = useSuspenseQuery(matchStateQuery);
  const [draft, setDraft] = useState("");

  const publish = useMutation({
    mutationFn: () => repository.createPost(draft),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const connect = useMutation({
    mutationFn: (id: string) => repository.sendConnectionRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["connections"] });
      void queryClient.invalidateQueries({ queryKey: ["people"] });
      toast.success(t("home.pending"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const firstName = me.fullName.split(" ")[0] || "";
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("home.greetingMorning", { name: firstName })
      : hour < 18
        ? t("home.greetingAfternoon", { name: firstName })
        : t("home.greetingEvening", { name: firstName });

  const suggestions = people.slice(0, 6);
  const suggestedClubs = clubs.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-6 pt-4 md:px-6 md:pt-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="min-w-0">
          <header className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-deep/45 via-card to-card p-4 fade-up sm:p-5">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary">{greeting}</p>
                <h1 className="mt-1 text-[22px] font-bold leading-tight sm:text-2xl md:text-3xl">
                  {t("common.tagline")}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("home.subtitle")}</p>
              </div>
              <img
                src={markUrl}
                alt=""
                aria-hidden
                width={534}
                height={289}
                className="h-12 w-24 shrink-0 object-contain sm:h-14 sm:w-28"
              />
            </div>
          </header>

          {!me.onboarded && (
            <Link
              to="/onboarding"
              className="mt-5 flex items-center gap-3 rounded-xl border border-gold/35 bg-gold/10 p-4 transition-colors hover:bg-gold/15"
            >
              <Sparkles className="h-5 w-5 shrink-0 text-gold" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gold">
                  {t("home.onboardingTitle")}
                </span>
                <span className="block text-xs text-gold/80">{t("home.onboardingBody")}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-gold" />
            </Link>
          )}

          <div className="mt-5">
            <Stories me={me} />
          </div>

          <section className="surface mt-5 p-4">
            <div className="flex gap-3">
              <UserAvatar name={me.fullName} url={me.avatarUrl} className="h-10 w-10" />
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t("home.composerPlaceholder")}
                aria-label={t("home.composerPlaceholder")}
                className="min-h-[70px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                maxLength={3000}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">{draft.length}/3000</span>
              <Button
                size="sm"
                disabled={!draft.trim() || publish.isPending}
                onClick={() => publish.mutate()}
              >
                {publish.isPending ? t("home.publishing") : t("home.publish")}
              </Button>
            </div>
          </section>

          <section className="surface mt-5 overflow-hidden border-primary/25">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-deep text-primary">
                <Handshake className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{t("home.netmatchTitle")}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t("home.netmatchBody")}</p>
                <p className="mt-1.5 text-[11px] font-medium text-primary">
                  {t("home.netmatchRemaining", {
                    used: formatNumber(matchState.usedToday),
                    limit: formatNumber(matchState.dailyLimit),
                  })}
                </p>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link to="/netmach">
                  {t("home.netmatchCta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <h2 className="mb-3 mt-6 text-lg font-semibold">{t("home.feed")}</h2>
          <div className="space-y-4">
            {feed.length === 0 && (
              <div className="surface flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-deep">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t("home.emptyFeed")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("home.emptyFeedBody")}</p>
                </div>
              </div>
            )}
            {feed.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                meId={me.id}
                clubName={clubs.find((club) => club.id === post.clubId)?.name}
              />
            ))}
          </div>
        </div>

        <aside className="hidden min-w-0 flex-col gap-4 lg:flex">
          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t("home.people")}</h2>
              <Link to="/network" className="text-xs text-primary hover:underline">
                {t("common.seeAll")}
              </Link>
            </div>
            <ul className="mt-3 space-y-3">
              {suggestions.length === 0 && (
                <li className="text-xs text-muted-foreground">{t("home.emptyPeople")}</li>
              )}
              {suggestions.map((person) => {
                const state = connectionState(me.id, person.id, connections);
                return (
                  <li key={person.id} className="flex items-center gap-2.5">
                    <Link to="/members/$id" params={{ id: person.id }}>
                      <UserAvatar
                        name={person.fullName}
                        url={person.avatarUrl}
                        className="h-9 w-9"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/members/$id"
                        params={{ id: person.id }}
                        className="block truncate text-sm font-medium hover:text-primary"
                      >
                        {person.fullName}
                      </Link>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {person.headline}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={state.status !== "none" || connect.isPending}
                      onClick={() => connect.mutate(person.id)}
                      aria-label={t("home.connect")}
                      title={
                        state.status === "connected"
                          ? t("home.connected")
                          : state.status === "sent"
                            ? t("home.pending")
                            : t("home.connect")
                      }
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-primary transition-colors",
                        state.status === "none"
                          ? "border-primary/50 hover:bg-primary/10"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t("home.groups")}</h2>
              <Link to="/clubs" className="text-xs text-primary hover:underline">
                {t("common.seeAll")}
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {suggestedClubs.map((club) => (
                <li key={club.id}>
                  <Link
                    to="/clubs/$slug"
                    params={{ slug: club.slug }}
                    className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-deep text-primary">
                      {club.category === "marketing" || club.category === "paidTraffic" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{club.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {t("clubs.members", { count: club.memberIds.length })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-xs text-gold">
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" /> {t("netmach.premiumTitle")}
            </p>
            <p className="mt-1 text-gold/80">{t("netmach.premiumBody")}</p>
            <Link
              to="/premium"
              className="mt-2 inline-block font-semibold text-gold hover:underline"
            >
              {t("netmach.premiumCta")}
            </Link>
          </section>

          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground/80">
            {t("landing.disclaimer")}
          </p>
        </aside>
      </div>
    </div>
  );
}
