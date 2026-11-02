import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, Flag, LogOut, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { clubQuery, clubsQuery, directoryQuery, feedQuery, meQuery } from "@/data/queries";
import { RepositoryError } from "@/data/dev-repository";
import { EmptyState } from "@/components/netclub/EmptyState";
import { PostCard } from "@/components/netclub/PostCard";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { ReportDialog } from "@/components/netclub/ReportDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/clubs/$slug")({
  head: () => ({ meta: [{ title: "Grupo — NetClub" }] }),
  loader: async ({ context: { queryClient }, params }) => {
    const [club] = await Promise.all([
      queryClient.ensureQueryData(clubQuery(params.slug)),
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(feedQuery),
      queryClient.ensureQueryData(directoryQuery),
    ]);
    if (!club) throw notFound();
    return club;
  },
  component: ClubPage,
});

type Tab = "posts" | "members" | "about";

function ClubPage() {
  const { t, formatNumber, formatDate } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { slug } = Route.useParams();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: club } = useSuspenseQuery(clubQuery(slug));
  const { data: posts = [] } = useSuspenseQuery(feedQuery);
  const { data: directory = [] } = useQuery(directoryQuery);
  const [tab, setTab] = useState<Tab>("posts");
  const [draft, setDraft] = useState("");
  const [reporting, setReporting] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["clubs"] });
    void queryClient.invalidateQueries({ queryKey: ["club", slug] });
    void queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const join = useMutation({
    mutationFn: () => repository.joinClub(club!.id),
    onSuccess: () => {
      refresh();
      toast.success(t("clubs.joined"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const leave = useMutation({
    mutationFn: () => repository.leaveClub(club!.id),
    onSuccess: () => {
      refresh();
      toast.success(t("clubs.leave"));
    },
    onError: (error) => {
      if (error instanceof RepositoryError && error.message === "admin_cannot_leave") {
        toast.error(t("clubs.leaveError"));
      } else {
        toast.error(t("errors.generic"));
      }
    },
  });

  const publish = useMutation({
    mutationFn: () => repository.createPost(draft, club!.id),
    onSuccess: () => {
      setDraft("");
      refresh();
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  if (!me || !club) return null;

  const joined = club.memberIds.includes(me.id);
  const isAdmin = club.adminIds.includes(me.id);
  const clubPosts = posts.filter((post) => post.clubId === club.id);
  const members = club.memberIds
    .map((id) => directory.find((profile) => profile.id === id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "posts", label: t("clubs.postsTab"), count: clubPosts.length },
    { id: "members", label: t("clubs.membersTab"), count: club.memberIds.length },
    { id: "about", label: t("clubs.aboutTab") },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <Link
        to="/clubs"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("clubs.back")}
      </Link>

      <div className="surface overflow-hidden">
        <div className="relative h-40 w-full overflow-hidden">
          {club.coverUrl ? (
            <img src={club.coverUrl} alt="" className="h-full w-full object-cover opacity-80" />
          ) : (
            <div className="h-full w-full bg-primary-deep" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-medium backdrop-blur">
            {t(`category.${club.category}`)}
          </span>
        </div>

        <div className="p-5 pt-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{club.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {t("clubs.members", { count: formatNumber(club.memberIds.length) })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={joined ? "secondary" : "default"}
                onClick={() => (joined ? leave.mutate() : join.mutate())}
                disabled={join.isPending || leave.isPending || (joined && isAdmin)}
                title={joined && isAdmin ? t("clubs.leaveError") : undefined}
              >
                {joined ? (
                  <>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" /> {t("clubs.leave")}
                  </>
                ) : (
                  t("clubs.join")
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("common.report")}
                title={t("common.report")}
                onClick={() => setReporting(true)}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{club.description}</p>
          {joined && isAdmin && (
            <p className="mt-2 text-[11px] text-gold">{t("clubs.leaveError")}</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-1 rounded-xl border bg-surface-2/50 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
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

      <div className="mt-5">
        {tab === "posts" && (
          <div className="space-y-4">
            {joined ? (
              <div className="surface p-4">
                <div className="flex gap-3">
                  <UserAvatar name={me.fullName} url={me.avatarUrl} className="h-10 w-10" />
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={t("clubs.postPlaceholder")}
                    aria-label={t("clubs.postPlaceholder")}
                    className="min-h-[64px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                    maxLength={3000}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!draft.trim() || publish.isPending}
                    onClick={() => publish.mutate()}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> {t("clubs.createPost")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">
                {t("clubs.join")} · {t("clubs.discussion")}
              </p>
            )}

            {clubPosts.length === 0 ? (
              <EmptyState icon={Users} title={t("clubs.noPosts")} />
            ) : (
              clubPosts.map((post) => (
                <PostCard key={post.id} post={post} meId={me.id} clubName={club.name} />
              ))
            )}
          </div>
        )}

        {tab === "members" && (
          <div className="surface divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3">
                <Link to="/members/$id" params={{ id: member.id }}>
                  <UserAvatar name={member.fullName} url={member.avatarUrl} className="h-10 w-10" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/members/$id"
                    params={{ id: member.id }}
                    className="flex items-center gap-1.5 truncate text-sm font-medium hover:text-primary"
                  >
                    {member.fullName}
                    {club.adminIds.includes(member.id) && (
                      <Crown className="h-3.5 w-3.5 text-gold" aria-label={t("clubs.admin")} />
                    )}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{member.headline}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "about" && (
          <div className="surface space-y-5 p-5">
            <div>
              <h2 className="text-sm font-semibold">{t("clubs.category")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`category.${club.category}`)}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("clubs.rules")}</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {club.rules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("clubs.admin")}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {club.adminIds.map((id) => {
                  const admin = directory.find((profile) => profile.id === id);
                  if (!admin) return null;
                  return (
                    <Link
                      key={id}
                      to="/members/$id"
                      params={{ id }}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs hover:border-primary/40"
                    >
                      <UserAvatar
                        name={admin.fullName}
                        url={admin.avatarUrl}
                        className="h-5 w-5 text-[9px]"
                      />
                      {admin.fullName}
                    </Link>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("profile.memberSince", {
                date: formatDate(club.createdAt, { dateStyle: "medium" }),
              })}
            </p>
          </div>
        )}
      </div>

      <ReportDialog
        open={reporting}
        onOpenChange={setReporting}
        targetType="club"
        targetId={club.id}
      />
    </div>
  );
}
