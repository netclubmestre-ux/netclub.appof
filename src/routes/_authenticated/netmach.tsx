import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Crown, MessageCircle, RefreshCw, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { matchStateQuery, meQuery } from "@/data/queries";
import { RepositoryError } from "@/data/repository";
import type { Profile } from "@/data/types";
import { featuredCandidate } from "@/lib/netmach";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { NetMatchDeck, NetMatchIntro } from "@/components/netclub/NetMatchDeck";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/netmach")({
  head: () => ({
    meta: [
      { title: "NetMatch — NetClub" },
      { name: "description", content: "Encontre profissionais com interesses complementares." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(matchStateQuery),
    ]),
  component: NetMachPage,
});

function NetMachPage() {
  const { t, formatNumber } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: state } = useSuspenseQuery(matchStateQuery);
  const [matchedWith, setMatchedWith] = useState<Profile | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["netmach"] });
    void queryClient.invalidateQueries({ queryKey: ["connections"] });
    void queryClient.invalidateQueries({ queryKey: ["people"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const like = useMutation({
    mutationFn: (id: string) => repository.likeProfile(id),
    onSuccess: (result, id) => {
      const candidate = state.candidates.find((item) => item.id === id);
      refresh();
      if (result.matched) {
        if (candidate) setMatchedWith(candidate);
      } else {
        toast.success(t("netmach.interestSent"));
      }
    },
    onError: (error) => {
      if (error instanceof RepositoryError && error.code === "DAILY_LIMIT") {
        toast.error(t("netmach.limitReached"));
      } else if (error instanceof RepositoryError && error.code === "BLOCKED") {
        toast.error(t("errors.blocked"));
      } else {
        toast.error(t("errors.generic"));
      }
    },
  });

  const pass = useMutation({
    mutationFn: (id: string) => repository.passProfile(id),
    onSuccess: () => {
      refresh();
      toast.success(t("netmach.passDone"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const startChat = useMutation({
    mutationFn: (id: string) => repository.startConversation(id),
    onSuccess: (conversationId) => {
      setMatchedWith(null);
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/chat/$id", params: { id: conversationId } });
    },
    onError: () => toast.error(t("errors.generic")),
  });

  if (!me) return null;

  const limitReached = state.usedToday >= state.dailyLimit;
  const featured = featuredCandidate(me, state.candidates);
  const pending = like.isPending || pass.isPending;

  function startDiscovery() {
    deckRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader
        title={t("netmach.title")}
        subtitle={t("netmach.subtitle")}
        actions={
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            {t("netmach.remaining", {
              used: formatNumber(state.usedToday),
              limit: formatNumber(state.dailyLimit),
            })}
          </span>
        }
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-3">
        <Crown className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gold">{t("netmach.premiumTitle")}</p>
          <p className="text-[11px] text-gold/80">{t("netmach.premiumNote")}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 border-gold/40 text-[11px] text-gold hover:bg-gold/10"
          disabled
          title={t("netmach.filtersLocked")}
        >
          {t("netmach.filters")}
        </Button>
      </div>

      {state.matches.length > 0 && (
        <section className="surface mb-5 p-4">
          <h2 className="text-sm font-semibold">{t("netmach.matchList")}</h2>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
            {state.matches.map((profile) => (
              <div key={profile.id} className="flex w-24 shrink-0 flex-col items-center gap-1.5">
                <Link to="/members/$id" params={{ id: profile.id }}>
                  <UserAvatar
                    name={profile.fullName}
                    url={profile.avatarUrl}
                    className="h-14 w-14 border-2 border-primary/60"
                  />
                </Link>
                <span className="w-full truncate text-center text-[11px]">{profile.fullName}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-full text-[10px]"
                  onClick={() => startChat.mutate(profile.id)}
                  disabled={startChat.isPending}
                >
                  {t("netmach.startChat")}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {limitReached && (
        <div className="surface mb-5 border-primary/30 p-5">
          <h2 className="font-display text-lg font-semibold">{t("netmach.limitReached")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("netmach.limitBody", { limit: formatNumber(state.dailyLimit) })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/premium">{t("netmach.premiumCta")}</Link>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["netmach"] })}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> {t("common.next")}
            </Button>
          </div>
        </div>
      )}

      {!limitReached && (
        <>
          {featured ? (
            <NetMatchIntro me={me} profile={featured} onStartDiscovery={startDiscovery} />
          ) : (
            <EmptyState
              icon={Sparkles}
              title={t("netmach.empty")}
              body={`${t("netmach.emptyBody")} ${t("netmach.newCandidates")}`}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild size="sm">
                    <Link to="/profile">{t("home.onboardingCta")}</Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/network">{t("nav.network")}</Link>
                  </Button>
                </div>
              }
            />
          )}

          <div ref={deckRef} className="scroll-mt-20">
            {state.candidates.length > 0 && (
              <NetMatchDeck
                me={me}
                candidates={state.candidates}
                onLike={(id) => like.mutate(id)}
                onPass={(id) => pass.mutate(id)}
                pending={pending}
              />
            )}
          </div>
        </>
      )}

      <Dialog open={Boolean(matchedWith)} onOpenChange={(open) => !open && setMatchedWith(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("netmach.matchTitle")}</DialogTitle>
            <DialogDescription>
              {t("netmach.matchBody", { name: matchedWith?.fullName ?? "" })}
            </DialogDescription>
          </DialogHeader>
          {matchedWith && (
            <div className="flex flex-col items-center gap-2 py-2">
              <UserAvatar
                name={matchedWith.fullName}
                url={matchedWith.avatarUrl}
                className="h-20 w-20 border-2 border-primary/60 netmach-pop"
              />
              <p className="font-semibold">{matchedWith.fullName}</p>
              <p className="text-xs text-muted-foreground">{matchedWith.headline}</p>
              <p className="mt-1 flex items-center gap-1.5 text-center text-[11px] text-primary">
                <Users className="h-3.5 w-3.5" /> {t("netmach.matchConnection")}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setMatchedWith(null)}>
              {t("netmach.keepExploring")}
            </Button>
            <Button
              onClick={() => matchedWith && startChat.mutate(matchedWith.id)}
              disabled={startChat.isPending}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> {t("netmach.startChat")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
