import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import {
  connectionsQuery,
  conversationsQuery,
  directoryQuery,
  meQuery,
  messagesQuery,
} from "@/data/queries";
import { RepositoryError } from "@/data/repository";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$id")({
  head: () => ({ meta: [{ title: "Conversa — NetClub" }] }),
  loader: async ({ context: { queryClient }, params }) => {
    const conversations = await queryClient.ensureQueryData(conversationsQuery);
    const exists = conversations.some((conversation) => conversation.id === params.id);
    if (!exists) throw notFound();
    await Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(messagesQuery(params.id)),
      queryClient.ensureQueryData(directoryQuery),
      queryClient.ensureQueryData(connectionsQuery),
    ]);
    return null;
  },
  component: ConversationPage,
});

function ConversationPage() {
  const { t, formatDate, formatRelative } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { id } = Route.useParams();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: messages = [] } = useSuspenseQuery(messagesQuery(id));
  const { data: directory = [] } = useSuspenseQuery(directoryQuery);
  const { data: conversations = [] } = useSuspenseQuery(conversationsQuery);
  const { data: connections = [] } = useSuspenseQuery(connectionsQuery);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: () => repository.sendMessage(id, draft),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["messages", id] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      if (error instanceof RepositoryError && error.code === "BLOCKED") {
        toast.error(t("chat.blockedNote"));
      } else {
        toast.error(t("errors.generic"));
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!me) return null;

  const conversation = conversations.find((item) => item.id === id);
  const otherId = conversation?.memberIds.find((memberId) => memberId !== me.id) ?? "";
  const other = directory.find((profile) => profile.id === otherId);
  const connected = connections.some(
    (connection) =>
      connection.status === "accepted" &&
      ((connection.requesterId === me.id && connection.addresseeId === otherId) ||
        (connection.addresseeId === me.id && connection.requesterId === otherId)),
  );

  let lastDay = "";

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-2xl flex-col px-4 py-4 md:h-[calc(100dvh-7rem)] md:px-6 md:py-6">
      <header className="flex items-center gap-3 border-b pb-3">
        <Link
          to="/chat"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={t("chat.back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other && (
          <>
            <Link to="/members/$id" params={{ id: other.id }}>
              <UserAvatar name={other.fullName} url={other.avatarUrl} className="h-10 w-10" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to="/members/$id"
                params={{ id: other.id }}
                className="block truncate font-semibold hover:text-primary"
              >
                {other.fullName}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{other.headline}</p>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("chat.noMessages")}</p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === me.id;
          const author = directory.find((profile) => profile.id === message.senderId);
          const day = formatDate(message.createdAt, { dateStyle: "medium" });
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={message.id}>
              {showDay && (
                <p className="my-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                  {day}
                </p>
              )}
              <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                <UserAvatar
                  name={author?.fullName ?? ""}
                  url={author?.avatarUrl}
                  className="h-7 w-7 text-[10px]"
                />
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-sm bg-primary/20 text-foreground"
                      : "rounded-bl-sm bg-surface-2 text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p
                    className="mt-1 text-right text-[10px] text-muted-foreground"
                    title={formatDate(message.createdAt, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  >
                    {formatRelative(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {connected ? (
        <form
          className="flex items-center gap-2 border-t pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) send.mutate();
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("chat.placeholder")}
            aria-label={t("chat.placeholder")}
            maxLength={2000}
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || send.isPending}>
            <Send className="h-4 w-4" />
            <span className="sr-only">{t("chat.send")}</span>
          </Button>
        </form>
      ) : (
        <p className="border-t pt-3 text-center text-xs text-muted-foreground">
          {t("profile.messageUnavailable")}
        </p>
      )}
      <p className="mt-1 text-center text-[10px] text-muted-foreground">{t("chat.demoNote")}</p>
    </div>
  );
}
