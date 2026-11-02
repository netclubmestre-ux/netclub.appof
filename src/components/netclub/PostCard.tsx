import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { commentsQuery, directoryQuery, profileQuery } from "@/data/queries";
import type { Post } from "@/data/types";
import { formatCount } from "@/lib/netclub";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { ReportDialog } from "./ReportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PostCard({
  post,
  meId,
  clubName,
}: {
  post: Post;
  meId: string;
  clubName?: string | undefined;
}) {
  const { t, formatRelative } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { data: author } = useQuery(profileQuery(post.authorId));
  const { data: people = [] } = useQuery(directoryQuery);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["feed"] });
    void queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
  };

  const { data: comments = [] } = useQuery({ ...commentsQuery(post.id), enabled: commentsOpen });

  const toggleLike = useMutation({
    mutationFn: () => repository.toggleLike(post.id),
    onSuccess: refresh,
    onError: () => toast.error(t("errors.generic")),
  });

  const toggleSave = useMutation({
    mutationFn: () => repository.toggleSave(post.id),
    onSuccess: refresh,
    onError: () => toast.error(t("errors.generic")),
  });

  const saveEdit = useMutation({
    mutationFn: () => repository.updatePost(post.id, draft),
    onSuccess: () => {
      setEditing(false);
      refresh();
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const remove = useMutation({
    mutationFn: () => repository.deletePost(post.id),
    onSuccess: () => {
      refresh();
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.forbidden")),
  });

  const addComment = useMutation({
    mutationFn: () => repository.addComment(post.id, comment, replyTo),
    onSuccess: () => {
      setComment("");
      setReplyTo(null);
      refresh();
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => repository.deleteComment(id),
    onSuccess: refresh,
    onError: () => toast.error(t("errors.forbidden")),
  });

  const nameOf = (id: string) => people.find((p) => p.id === id)?.fullName ?? "";

  return (
    <article className="surface p-4 fade-up">
      <header className="flex items-start gap-3">
        <Link to="/members/$id" params={{ id: post.authorId }} aria-label={author?.fullName}>
          <UserAvatar name={author?.fullName ?? ""} url={author?.avatarUrl} className="h-11 w-11" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <Link
              to="/members/$id"
              params={{ id: post.authorId }}
              className="truncate font-semibold hover:text-primary"
            >
              {author?.fullName}
            </Link>
            {post.sponsored && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                {t("home.sponsored")}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {[author?.headline, clubName].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-muted-foreground">{formatRelative(post.createdAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label={t("common.moreOptions")}
          >
            <MoreHorizontal className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {post.authorId === meId ? (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setDraft(post.content);
                    setEditing(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate()}>
                  <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => setReporting(true)}>
                <Flag className="mr-2 h-4 w-4" /> {t("common.report")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {editing ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={draft}
            maxLength={3000}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={() => saveEdit.mutate()} disabled={!draft.trim()}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
      )}

      <footer className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggleLike.mutate()}
          disabled={toggleLike.isPending}
          aria-label={t("home.like")}
          aria-pressed={post.likedBy.includes(meId)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
            post.likedBy.includes(meId)
              ? "border-like/40 text-like"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4", post.likedBy.includes(meId) && "fill-like")} />
          {formatCount(post.likedBy.length)}
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((open) => !open)}
          aria-label={t("home.comment")}
          aria-expanded={commentsOpen}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {formatCount(comments.length)}
        </button>
        <button
          type="button"
          onClick={() => toggleSave.mutate()}
          disabled={toggleSave.isPending}
          aria-label={t("home.saved")}
          aria-pressed={post.savedBy.includes(meId)}
          className="ml-auto rounded-full border p-2 text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          <Bookmark
            className={cn("h-4 w-4", post.savedBy.includes(meId) && "fill-primary text-primary")}
          />
        </button>
      </footer>

      {commentsOpen && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("chat.noMessages")}</p>
          )}
          {comments.map((item) => {
            const commentAuthor = people.find((p) => p.id === item.authorId);
            return (
              <div key={item.id} className="flex gap-2">
                <UserAvatar
                  name={commentAuthor?.fullName ?? ""}
                  url={commentAuthor?.avatarUrl}
                  className="h-8 w-8 text-xs"
                />
                <div className="min-w-0 flex-1 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{commentAuthor?.fullName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>
                  {item.parentId && (
                    <p className="text-[11px] text-muted-foreground">
                      <Reply className="mr-1 inline h-3 w-3" />
                      {nameOf(item.parentId)}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{item.content}</p>
                  <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setReplyTo(item.id)}
                    >
                      {t("home.comment")}
                    </button>
                    {item.authorId === meId && (
                      <button
                        type="button"
                        className="hover:text-destructive"
                        onClick={() => deleteComment.mutate(item.id)}
                      >
                        {t("common.delete")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (comment.trim()) addComment.mutate();
            }}
          >
            <Input
              value={comment}
              maxLength={1000}
              placeholder={
                replyTo ? `${t("home.comment")} · ${nameOf(replyTo)}` : t("home.comment")
              }
              aria-label={t("home.comment")}
              onChange={(event) => setComment(event.target.value)}
            />
            {replyTo && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                {t("common.cancel")}
              </Button>
            )}
            <Button size="sm" type="submit" disabled={!comment.trim() || addComment.isPending}>
              {t("common.send")}
            </Button>
          </form>
        </div>
      )}

      <ReportDialog
        open={reporting}
        onOpenChange={setReporting}
        targetType="post"
        targetId={post.id}
      />
    </article>
  );
}
