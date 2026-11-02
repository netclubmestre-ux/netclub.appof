import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Flag, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { RepositoryError } from "@/data/repository";
import { directoryQuery, storiesQuery } from "@/data/queries";
import type { Profile, Story } from "@/data/types";
import { UserAvatar } from "./UserAvatar";
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

const BACKGROUNDS = [
  "linear-gradient(135deg, #047857, #064e3b)",
  "linear-gradient(135deg, #0f766e, #134e4a)",
  "linear-gradient(135deg, #7c3aed, #312e81)",
  "linear-gradient(135deg, #b45309, #78350f)",
  "linear-gradient(135deg, #be123c, #4c0519)",
  "linear-gradient(135deg, #1e3a8a, #0f172a)",
];

function useStoryGroups() {
  const { data: stories = [] } = useQuery(storiesQuery);
  return useMemo(() => {
    const groups = new Map<string, Story[]>();
    stories
      .slice()
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .forEach((story) => {
        const list = groups.get(story.authorId) ?? [];
        list.push(story);
        groups.set(story.authorId, list);
      });
    return groups;
  }, [stories]);
}

export function Stories({ me }: { me: Profile }) {
  const { t, formatRelative } = useI18n();
  const queryClient = useQueryClient();
  const groups = useStoryGroups();
  const { data: people = [] } = useQuery(directoryQuery);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reporting, setReporting] = useState<Story | null>(null);

  const flat = useMemo(() => Array.from(groups.values()).flat(), [groups]);

  const authorIds = useMemo(() => {
    const ids = Array.from(groups.keys());
    return ids.sort((a, b) => {
      if (a === me.id) return -1;
      if (b === me.id) return 1;
      const aLast = groups.get(a)?.at(-1)?.createdAt ?? "";
      const bLast = groups.get(b)?.at(-1)?.createdAt ?? "";
      return Date.parse(bLast) - Date.parse(aLast);
    });
  }, [groups, me.id]);

  const person = (id: string) => people.find((p) => p.id === id);

  return (
    <section aria-label={t("stories.title")}>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="flex w-20 shrink-0 flex-col items-center gap-1.5"
        >
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-primary/50 bg-primary-deep/40 text-primary">
            <Plus className="h-6 w-6" />
            {me.avatarUrl ? (
              <UserAvatar
                name={me.fullName}
                url={me.avatarUrl}
                className="absolute inset-0 h-full w-full opacity-40"
              />
            ) : null}
          </span>
          <span className="w-full truncate text-center text-[11px] text-muted-foreground">
            {t("home.yourStory")}
          </span>
        </button>

        {authorIds.map((authorId) => {
          const stories = groups.get(authorId) ?? [];
          const latest = stories.at(-1);
          if (!latest) return null;
          const profile = person(authorId);
          const allViewed = stories.every((s) => s.viewedBy.includes(me.id));
          const firstIndex = flat.findIndex((s) => s.id === stories[0]?.id);
          return (
            <button
              key={authorId}
              type="button"
              onClick={() => setViewerIndex(firstIndex)}
              className="flex w-20 shrink-0 flex-col items-center gap-1.5"
              aria-label={t("stories.by", { name: profile?.fullName ?? "" })}
            >
              <span
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full p-0.5",
                  allViewed ? "bg-border" : "bg-gradient-to-tr from-primary to-gold",
                )}
              >
                <UserAvatar
                  name={profile?.fullName ?? ""}
                  url={profile?.avatarUrl}
                  className="h-full w-full border-2 border-background"
                />
              </span>
              <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                {authorId === me.id ? t("stories.yours") : profile?.fullName}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {formatRelative(latest.createdAt)}
              </span>
            </button>
          );
        })}
      </div>

      {viewerIndex !== null && flat[viewerIndex] && (
        <StoryViewer
          stories={flat}
          index={viewerIndex}
          meId={me.id}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onReport={(story) => setReporting(story)}
          person={person}
        />
      )}

      <StoryComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onPublished={() => queryClient.invalidateQueries({ queryKey: ["stories"] })}
      />

      <ReportDialog
        open={Boolean(reporting)}
        onOpenChange={(open) => !open && setReporting(null)}
        targetType="story"
        targetId={reporting?.id ?? ""}
      />

      {flat.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{t("stories.empty")}</p>
      )}
    </section>
  );
}

function StoryViewer({
  stories,
  index,
  meId,
  onIndexChange,
  onClose,
  onReport,
  person,
}: {
  stories: Story[];
  index: number;
  meId: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onReport: (story: Story) => void;
  person: (id: string) => Profile | undefined;
}) {
  const { t, formatRelative } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const story = stories[index];
  const author = story ? person(story.authorId) : undefined;

  useEffect(() => {
    if (!story) return;
    repository.markStoryViewed(story.id).catch(() => undefined);
  }, [repository, story]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && index < stories.length - 1) onIndexChange(index + 1);
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, stories.length, onClose, onIndexChange]);

  const remove = useMutation({
    mutationFn: () => repository.deleteStory(story!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success(t("stories.deleted"));
      if (index >= stories.length - 1) onClose();
      else onIndexChange(index);
    },
    onError: () => toast.error(t("errors.forbidden")),
  });

  if (!story) return null;
  const mine = story.authorId === meId;
  const hoursLeft = Math.max(0, Math.round((Date.parse(story.expiresAt) - Date.now()) / 3600_000));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={t("stories.by", { name: author?.fullName ?? "" })}
    >
      <div className="relative flex h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card">
        <div
          className="absolute inset-0"
          style={{ background: story.imageUrl ? undefined : story.background }}
        >
          {story.imageUrl && (
            <img src={story.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
        </div>

        <div className="relative z-10 flex gap-1 p-3">
          {stories.map((item, i) => (
            <span
              key={item.id}
              className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/30")}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-2 px-3">
          <UserAvatar name={author?.fullName ?? ""} url={author?.avatarUrl} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{author?.fullName}</p>
            <p className="text-[11px] text-white/70">
              {formatRelative(story.createdAt)} · {t("stories.expires", { time: `${hoursLeft}h` })}
            </p>
          </div>
          {mine && (
            <button
              type="button"
              onClick={() => remove.mutate()}
              className="rounded-full p-2 text-white/80 hover:text-white"
              aria-label={t("stories.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {!mine && (
            <button
              type="button"
              onClick={() => onReport(story)}
              className="rounded-full p-2 text-white/80 hover:text-white"
              aria-label={t("stories.report")}
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:text-white"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <p className="whitespace-pre-wrap text-center font-display text-xl font-semibold leading-snug text-white drop-shadow">
            {story.text}
          </p>
        </div>

        {mine && (
          <p className="relative z-10 px-4 pb-3 text-center text-[11px] text-white/70">
            {t("stories.viewed", { count: story.viewedBy.length })}
          </p>
        )}

        <button
          type="button"
          onClick={() => index > 0 && onIndexChange(index - 1)}
          disabled={index === 0}
          className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-30"
          aria-label={t("stories.prev")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => (index < stories.length - 1 ? onIndexChange(index + 1) : onClose())}
          className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white"
          aria-label={t("stories.next")}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function StoryComposer({
  open,
  onOpenChange,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
}) {
  const { t } = useI18n();
  const repository = useRepository();
  const [text, setText] = useState("");
  const [background, setBackground] = useState(BACKGROUNDS[0] ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const publish = useMutation({
    mutationFn: () => repository.createStory({ text, background, imageUrl }),
    onSuccess: () => {
      onPublished();
      setText("");
      setImageUrl(null);
      onOpenChange(false);
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  async function pickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("errors.invalidFileType"));
      return;
    }
    setUploading(true);
    try {
      const url = await repository.uploadImage(file, "story");
      setImageUrl(url);
    } catch (error) {
      if (error instanceof RepositoryError && error.message === "file_too_large") {
        toast.error(t("errors.fileTooLarge"));
      } else if (error instanceof RepositoryError && error.message === "invalid_file_type") {
        toast.error(t("errors.invalidFileType"));
      } else {
        toast.error(t("errors.upload"));
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("stories.createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border"
            style={{ background: imageUrl ? undefined : background }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <p className="max-w-[80%] text-center font-display text-lg font-semibold text-white">
                {text || t("stories.textPlaceholder")}
              </p>
            )}
          </div>
          <Textarea
            value={text}
            maxLength={280}
            placeholder={t("stories.textPlaceholder")}
            aria-label={t("stories.textLabel")}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {BACKGROUNDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setBackground(item);
                    setImageUrl(null);
                  }}
                  className={cn(
                    "h-6 w-6 rounded-full border",
                    background === item && !imageUrl && "ring-2 ring-primary",
                  )}
                  style={{ background: item }}
                  aria-label={t("stories.background")}
                />
              ))}
            </div>
            <label
              aria-disabled={uploading}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-primary",
                uploading && "cursor-wait opacity-60",
              )}
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? t("auth.uploading") : t("stories.chooseImage")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  void pickImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("stories.uploadNote")}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => publish.mutate()}
            disabled={publish.isPending || uploading || (!text.trim() && !imageUrl)}
          >
            {uploading ? t("auth.uploading") : t("stories.publish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
