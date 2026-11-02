import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Heart,
  Handshake,
  MessageCircle,
  MessageSquare,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useI18n, type TranslationKey } from "@/i18n";
import { useRepository } from "@/data/provider";
import { directoryQuery, meQuery, notificationsQuery } from "@/data/queries";
import type { NotificationKind } from "@/data/types";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notificações — NetClub" },
      { name: "description", content: "Atividades da sua rede no NetClub." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(notificationsQuery),
      queryClient.ensureQueryData(directoryQuery),
    ]),
  component: NotificationsPage,
});

const KIND_META: Record<NotificationKind, { icon: typeof Bell; labelKey: TranslationKey }> = {
  like: { icon: Heart, labelKey: "notifications.like" },
  comment: { icon: MessageSquare, labelKey: "notifications.comment" },
  connection: { icon: UserPlus, labelKey: "notifications.connection" },
  match: { icon: Handshake, labelKey: "notifications.match" },
  message: { icon: MessageCircle, labelKey: "notifications.message" },
  club: { icon: Users, labelKey: "notifications.club" },
  recommendation: { icon: Sparkles, labelKey: "notifications.recommendation" },
};

function NotificationsPage() {
  const { t, formatRelative } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: notifications = [] } = useSuspenseQuery(notificationsQuery);
  const { data: directory = [] } = useSuspenseQuery(directoryQuery);

  const markAll = useMutation({
    mutationFn: () => repository.markNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!me) return null;
  const unread = notifications.filter((item) => !item.read).length;

  function linkFor(kind: NotificationKind, entityId?: string | null, actorId?: string | null) {
    switch (kind) {
      case "message":
        return entityId
          ? ({ to: "/chat/$id", params: { id: entityId } } as const)
          : ({ to: "/chat" } as const);
      case "connection":
      case "match":
        return actorId
          ? ({ to: "/members/$id", params: { id: actorId } } as const)
          : ({ to: "/network" } as const);
      case "recommendation":
        return actorId
          ? ({ to: "/members/$id", params: { id: actorId } } as const)
          : ({ to: "/profile" } as const);
      case "club":
        return { to: "/clubs" } as const;
      default:
        return { to: "/home" } as const;
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader
        title={t("notifications.title")}
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || unread === 0}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" /> {t("notifications.markAllRead")}
          </Button>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t("notifications.empty")} />
      ) : (
        <ul className="surface divide-y divide-border">
          {notifications.map((notification) => {
            const meta = KIND_META[notification.kind];
            const Icon = meta.icon;
            const actor = directory.find((profile) => profile.id === notification.actorId);
            const link = linkFor(notification.kind, notification.entityId, notification.actorId);
            return (
              <li key={notification.id}>
                <Link
                  {...link}
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors hover:bg-secondary/60",
                    !notification.read && "bg-primary/5",
                  )}
                >
                  <div className="relative shrink-0">
                    {actor ? (
                      <UserAvatar
                        name={actor.fullName}
                        url={actor.avatarUrl}
                        className="h-10 w-10"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-deep text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                    )}
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-surface-2 text-primary">
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      {actor && <span className="font-semibold">{actor.fullName} </span>}
                      <span className="text-muted-foreground">{t(meta.labelKey)}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label={t("notifications.unread")}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
