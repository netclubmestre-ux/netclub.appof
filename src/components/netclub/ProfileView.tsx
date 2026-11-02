import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Briefcase,
  ExternalLink,
  Flag,
  Handshake,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  ShieldOff,
  Sparkles,
  ThumbsUp,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import {
  collaborationsQuery,
  connectionsQuery,
  directoryQuery,
  feedQuery,
  recommendationsQuery,
} from "@/data/queries";
import type { Profile } from "@/data/types";
import { connectionState } from "@/lib/netclub";
import { Tag } from "./Tag";
import { PostCard } from "./PostCard";
import { UserAvatar } from "./UserAvatar";
import { EmptyState } from "./EmptyState";
import { ReportDialog } from "./ReportDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tab = "posts" | "portfolio" | "recommendations" | "collaborations";

export function ProfileView({
  profile,
  me,
  onEdit,
}: {
  profile: Profile;
  me: Profile;
  onEdit?: () => void;
}) {
  const { t, formatDate } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const isOwn = profile.id === me.id;
  const [tab, setTab] = useState<Tab>("posts");
  const [reporting, setReporting] = useState(false);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendText, setRecommendText] = useState("");

  const { data: connections = [] } = useQuery(connectionsQuery);
  const { data: feed = [] } = useQuery(feedQuery);
  const { data: directory = [] } = useQuery(directoryQuery);
  const { data: recommendations = [] } = useQuery(recommendationsQuery(profile.id));
  const { data: collaborations = [] } = useQuery(collaborationsQuery(profile.id));

  const state = connectionState(me.id, profile.id, connections);
  const blocked = directory.every((item) => item.id !== profile.id);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["connections"] });
    void queryClient.invalidateQueries({ queryKey: ["recommendations", profile.id] });
    void queryClient.invalidateQueries({ queryKey: ["profile", profile.id] });
  };

  const connect = useMutation({
    mutationFn: () => repository.sendConnectionRequest(profile.id),
    onSuccess: () => {
      refresh();
      toast.success(t("home.pending"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const acceptConnection = useMutation({
    mutationFn: () => repository.respondConnection(state.connectionId!, true),
    onSuccess: () => {
      refresh();
      toast.success(t("home.connected"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const startChat = useMutation({
    mutationFn: () => repository.startConversation(profile.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success(t("chat.start"));
    },
    onError: () => toast.error(t("errors.notConnected")),
  });

  const block = useMutation({
    mutationFn: () => repository.blockUser(profile.id),
    onSuccess: () => {
      toast.success(t("profile.blocked"));
      refresh();
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const unblock = useMutation({
    mutationFn: () => repository.unblockUser(profile.id),
    onSuccess: () => {
      toast.success(t("profile.unblocked"));
      refresh();
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const recommend = useMutation({
    mutationFn: () => repository.requestRecommendation(profile.id, recommendText),
    onSuccess: () => {
      setRecommendOpen(false);
      setRecommendText("");
      refresh();
      toast.success(t("profile.recommendationSent"));
    },
    onError: () => toast.error(t("errors.notConnected")),
  });

  const respondRecommendation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      repository.respondRecommendation(id, accept),
    onSuccess: (_data, variables) => {
      refresh();
      toast.success(
        variables.accept
          ? t("profile.recommendationAccepted")
          : t("profile.recommendationDeclined"),
      );
    },
    onError: () => toast.error(t("errors.forbidden")),
  });

  const confirmCollaboration = useMutation({
    mutationFn: (id: string) => repository.confirmCollaboration(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["collaborations", profile.id] });
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.forbidden")),
  });

  const posts = feed.filter((post) => post.authorId === profile.id);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "posts", label: t("profile.posts"), count: posts.length },
    { id: "portfolio", label: t("profile.portfolio"), count: profile.portfolio.length },
    {
      id: "recommendations",
      label: t("profile.recommendations"),
      count: recommendations.length,
    },
    {
      id: "collaborations",
      label: t("profile.collaborations"),
      count: collaborations.length,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="surface overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary-deep via-card to-gold/20" />
        <div className="-mt-12 px-5 pb-5">
          <div className="flex flex-wrap items-end gap-3">
            <UserAvatar
              name={profile.fullName}
              url={profile.avatarUrl}
              className="h-24 w-24 border-4 border-card text-2xl"
            />
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="flex items-center gap-1.5 truncate text-2xl font-bold">
                {profile.fullName}
                {profile.role === "admin" && (
                  <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-label="NetClub" />
                )}
              </h1>
              <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
              <p className="mt-0.5 truncate text-sm">{profile.headline}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwn && onEdit && (
                <Button size="sm" variant="secondary" onClick={onEdit}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> {t("profile.editProfile")}
                </Button>
              )}
              {!isOwn && (
                <>
                  {state.status === "none" && (
                    <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" /> {t("profile.connect")}
                    </Button>
                  )}
                  {state.status === "received" && (
                    <Button
                      size="sm"
                      onClick={() => acceptConnection.mutate()}
                      disabled={acceptConnection.isPending}
                    >
                      {t("connections.accept")}
                    </Button>
                  )}
                  {state.status === "sent" && (
                    <Button size="sm" variant="secondary" disabled>
                      {t("home.pending")}
                    </Button>
                  )}
                  {state.status === "connected" && (
                    <Button
                      size="sm"
                      onClick={() => startChat.mutate()}
                      disabled={startChat.isPending}
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> {t("profile.message")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReporting(true)}
                    aria-label={t("profile.reportUser")}
                    title={t("profile.reportUser")}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => (blocked ? unblock.mutate() : block.mutate())}
                    aria-label={blocked ? t("profile.unblockUser") : t("profile.blockUser")}
                    title={blocked ? t("profile.unblockUser") : t("profile.blockUser")}
                  >
                    <ShieldOff className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {profile.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {profile.location}
              </span>
            )}
            {profile.area && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {profile.area}
              </span>
            )}
            <span>{t(`experience.${profile.experience}`)}</span>
            <span>{t("profile.memberSince", { date: formatDate(profile.createdAt) })}</span>
          </div>

          {profile.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("profile.lookingFor")}
              </p>
              <p className="mt-1 text-sm">{profile.lookingFor || "—"}</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("profile.offering")}
              </p>
              <p className="mt-1 text-sm">{profile.offering || "—"}</p>
            </div>
          </div>

          {profile.skills.length > 0 && (
            <div className="mt-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("profile.skills")}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <Tag key={skill}>{t(`skill.${skill}`)}</Tag>
                ))}
              </div>
            </div>
          )}

          {profile.interests.length > 0 && (
            <div className="mt-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("profile.interests")}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <Tag key={interest}>{t(`skill.${interest}`)}</Tag>
                ))}
              </div>
            </div>
          )}

          {profile.goals.length > 0 && (
            <div className="mt-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("profile.goals")}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.goals.map((goal) => (
                  <Tag key={goal} className="border-gold/30 bg-gold/10 text-gold">
                    {t(`goal.${goal}`)}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {profile.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Link2 className="h-3 w-3" /> {link.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border bg-surface-2/50 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              tab === item.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px]">{item.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <EmptyState icon={Sparkles} title={t("home.emptyFeed")} />
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} meId={me.id} />)
          )}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.portfolio.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState icon={Briefcase} title={t("profile.noPortfolio")} />
            </div>
          ) : (
            profile.portfolio.map((item) => (
              <article key={item.id} className="surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.year && (
                    <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.year}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {t("common.open")} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {tab === "recommendations" && (
        <div className="space-y-3">
          {!isOwn && state.status === "connected" && (
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setRecommendOpen(true)}>
                <ThumbsUp className="mr-1.5 h-3.5 w-3.5" /> {t("profile.requestRecommendation")}
              </Button>
            </div>
          )}
          {recommendations.length === 0 && (
            <EmptyState icon={ThumbsUp} title={t("profile.noRecommendations")} />
          )}
          {recommendations.map((recommendation) => {
            const author = directory.find((item) => item.id === recommendation.authorId);
            const pending = recommendation.status === "pending";
            return (
              <article key={recommendation.id} className="surface p-4">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={author?.fullName ?? ""}
                    url={author?.avatarUrl}
                    className="h-9 w-9"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/members/$id"
                      params={{ id: recommendation.authorId }}
                      className="block truncate text-sm font-semibold hover:text-primary"
                    >
                      {author?.fullName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {pending ? t("profile.pending") : t("profile.confirmed")}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  “{recommendation.content}”
                </p>
                {pending && isOwn && (
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        respondRecommendation.mutate({ id: recommendation.id, accept: false })
                      }
                    >
                      {t("profile.declineRecommendation")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        respondRecommendation.mutate({ id: recommendation.id, accept: true })
                      }
                    >
                      {t("profile.acceptRecommendation")}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {tab === "collaborations" && (
        <div className="space-y-3">
          {collaborations.length === 0 && (
            <EmptyState icon={Handshake} title={t("profile.noCollaborations")} />
          )}
          {collaborations.map((collaboration) => {
            const confirmed = collaboration.confirmedIds.includes(profile.id);
            const canConfirm =
              isOwn &&
              collaboration.participantIds.includes(me.id) &&
              !collaboration.confirmedIds.includes(me.id);
            return (
              <article key={collaboration.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{collaboration.title}</h3>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {collaboration.year}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{collaboration.description}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t("profile.collaborationConfirmed", {
                    count: collaboration.confirmedIds.length,
                    total: collaboration.participantIds.length,
                  })}
                </p>
                {canConfirm && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => confirmCollaboration.mutate(collaboration.id)}
                    disabled={confirmCollaboration.isPending}
                  >
                    {t("profile.confirmCollaboration")}
                  </Button>
                )}
                {confirmed && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t("profile.confirmed")}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ReportDialog
        open={reporting}
        onOpenChange={setReporting}
        targetType="user"
        targetId={profile.id}
      />

      <Dialog open={recommendOpen} onOpenChange={setRecommendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.writeRecommendation")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={recommendText}
            onChange={(event) => setRecommendText(event.target.value)}
            placeholder={t("profile.recommendationPlaceholder")}
            maxLength={600}
            aria-label={t("profile.writeRecommendation")}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRecommendOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => recommend.mutate()}
              disabled={!recommendText.trim() || recommend.isPending}
            >
              {t("common.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
