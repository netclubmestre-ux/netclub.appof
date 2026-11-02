import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Crown, Heart, MapPin, MessageCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { matchStateQuery, meQuery } from "@/data/queries";
import { RepositoryError } from "@/data/repository";
import type { Profile } from "@/data/types";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { Tag } from "@/components/netclub/Tag";
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
      { title: "NetMach — NetClub" },
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

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["netmach"] });
    void queryClient.invalidateQueries({ queryKey: ["connections"] });
  };

  const like = useMutation({
    mutationFn: (id: string) => repository.likeProfile(id),
    onSuccess: (result, id) => {
      refresh();
      if (result.matched) {
        const candidate = state.candidates.find((item) => item.id === id);
        if (candidate) setMatchedWith(candidate);
      } else {
        toast.success(t("common.success"));
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
    onSuccess: refresh,
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

  const candidate = state.candidates[0];
  const limitReached = state.usedToday >= state.dailyLimit;

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

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4">
        <Crown className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gold">{t("netmach.premiumTitle")}</p>
          <p className="text-xs text-gold/80">{t("netmach.premiumBody")}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-gold/40 text-gold hover:bg-gold/10"
          disabled
          title={t("netmach.filtersLocked")}
        >
          {t("netmach.filters")}
        </Button>
      </div>
      <p className="mb-5 text-[11px] text-muted-foreground">{t("netmach.filtersLocked")}</p>

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
          <Button asChild size="sm" className="mt-4">
            <Link to="/premium">{t("netmach.premiumCta")}</Link>
          </Button>
        </div>
      )}

      {!candidate && !limitReached && (
        <EmptyState
          icon={Sparkles}
          title={t("netmach.empty")}
          body={t("netmach.emptyBody")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link to="/network">{t("nav.network")}</Link>
            </Button>
          }
        />
      )}

      {candidate && !limitReached && (
        <article className="surface overflow-hidden fade-up">
          <div className="h-24 bg-gradient-to-r from-primary-deep via-card to-gold/20" />
          <div className="-mt-10 px-5 pb-5">
            <div className="flex items-end gap-3">
              <UserAvatar
                name={candidate.fullName}
                url={candidate.avatarUrl}
                className="h-20 w-20 border-4 border-card text-xl"
              />
              <div className="min-w-0 flex-1 pb-1">
                <h2 className="truncate text-xl font-bold">{candidate.fullName}</h2>
                <p className="truncate text-sm text-muted-foreground">{candidate.headline}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {candidate.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {candidate.location}
                </span>
              )}
              <span>{t(`experience.${candidate.experience}`)}</span>
              {candidate.area && <span>· {candidate.area}</span>}
            </div>

            {candidate.bio && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{candidate.bio}</p>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("netmach.skills")}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <Tag key={skill}>{t(`skill.${skill}`)}</Tag>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("netmach.goals")}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {candidate.goals.map((goal) => (
                    <Tag key={goal}>{t(`goal.${goal}`)}</Tag>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("netmach.lookingFor")}
                  </p>
                  <p className="mt-1 text-sm">{candidate.lookingFor || "—"}</p>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("netmach.offering")}
                  </p>
                  <p className="mt-1 text-sm">{candidate.offering || "—"}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                className="flex-1"
                onClick={() => like.mutate(candidate.id)}
                disabled={like.isPending}
              >
                <Heart className="mr-2 h-4 w-4" /> {t("netmach.like")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => pass.mutate(candidate.id)}
                disabled={pass.isPending}
              >
                <X className="mr-2 h-4 w-4" /> {t("netmach.pass")}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/members/$id" params={{ id: candidate.id }}>
                  {t("netmach.viewProfile")}
                </Link>
              </Button>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">{t("netmach.demoNote")}</p>
          </div>
        </article>
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
                className="h-20 w-20 border-2 border-primary/60"
              />
              <p className="font-semibold">{matchedWith.fullName}</p>
              <p className="text-xs text-muted-foreground">{matchedWith.headline}</p>
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
