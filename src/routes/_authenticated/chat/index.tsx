import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/i18n";
import { conversationSummariesQuery, directoryQuery, meQuery } from "@/data/queries";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import type { Profile } from "@/data/types";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({
    meta: [
      { title: "Chat — NetClub" },
      { name: "description", content: "Conversas privadas com suas conexões." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(conversationSummariesQuery),
      queryClient.ensureQueryData(directoryQuery),
    ]),
  component: ChatListPage,
});

function ChatListPage() {
  const { t, formatRelative } = useI18n();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: summaries = [] } = useSuspenseQuery(conversationSummariesQuery);
  const { data: directory = [] } = useSuspenseQuery(directoryQuery);

  if (!me) return null;

  const byId = new Map<string, Profile>();
  directory.forEach((profile) => byId.set(profile.id, profile));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("chat.title")} subtitle={t("chat.subtitle")} />

      {summaries.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={t("chat.noConversations")}
          action={
            <Link to="/netmach" className="text-sm text-primary hover:underline">
              {t("netmach.title")}
            </Link>
          }
        />
      ) : (
        <ul className="surface divide-y divide-border">
          {summaries.map(({ conversation, last }) => {
            const otherId = conversation.memberIds.find((id) => id !== me.id) ?? me.id;
            const other = byId.get(otherId);
            const unread = last && last.senderId !== me.id && !last.readBy.includes(me.id);
            return (
              <li key={conversation.id}>
                <Link
                  to="/chat/$id"
                  params={{ id: conversation.id }}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/60"
                >
                  <UserAvatar
                    name={other?.fullName ?? ""}
                    url={other?.avatarUrl}
                    className="h-11 w-11"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{other?.fullName}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {last ? formatRelative(last.createdAt) : ""}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {last ? last.content : t("chat.noMessages")}
                    </p>
                  </div>
                  {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
