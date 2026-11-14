import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Send, Video, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { RepositoryError, type PostMediaInput } from "@/data/repository";
import type { PostCategory, Profile } from "@/data/types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

const CATEGORIES: PostCategory[] = [
  "question",
  "experience",
  "knowledge",
  "project",
  "discussion",
  "achievement",
  "other",
];

interface DraftMedia {
  id: string;
  type: "image" | "video";
  url: string;
}

export function PostComposer({ me }: { me: Profile }) {
  const { t } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<PostCategory | "">("");
  const [media, setMedia] = useState<DraftMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const publish = useMutation({
    mutationFn: () => {
      const payload: PostMediaInput[] = media.map((item) => ({
        type: item.type,
        url: item.url,
      }));
      return repository.createPost(text, null, {
        category: category || null,
        media: payload,
      });
    },
    onSuccess: () => {
      setText("");
      setCategory("");
      setMedia([]);
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success(t("home.postPublished"));
    },
    onError: (error) => {
      if (error instanceof RepositoryError && error.message === "media_unavailable") {
        toast.error(t("home.mediaUnavailable"));
      } else {
        toast.error(t("errors.generic"));
      }
    },
  });

  function uploadErrorMessage(error: unknown) {
    if (error instanceof RepositoryError) {
      if (error.message === "file_too_large") return t("errors.fileTooLarge");
      if (error.message === "video_too_large") return t("errors.videoTooLarge");
      if (error.message === "invalid_video_type") return t("errors.invalidVideoType");
      if (error.message === "invalid_file_type") return t("errors.invalidFileType");
      // Bucket ausente no Storage (migração ainda não aplicada).
      if (/bucket/i.test(error.message)) return t("errors.mediaUnavailable");
    }
    return t("errors.upload");
  }

  async function pickImages(files: File[]) {
    if (files.length === 0) return;
    if (media.some((item) => item.type === "video")) {
      toast.error(t("errors.mediaMixed"));
      return;
    }
    const currentImages = media.filter((item) => item.type === "image").length;
    const remaining = MAX_IMAGES - currentImages;
    if (remaining <= 0) {
      toast.error(t("errors.mediaLimit", { count: MAX_IMAGES }));
      return;
    }
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(t("errors.mediaLimit", { count: MAX_IMAGES }));
    }

    for (const file of accepted) {
      if (!IMAGE_TYPES.includes(file.type)) {
        toast.error(t("errors.invalidFileType"));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(t("errors.fileTooLarge"));
        continue;
      }
      setUploading(true);
      try {
        const url = await repository.uploadMedia(file, "post");
        setMedia((previous) => [...previous, { id: crypto.randomUUID(), type: "image", url }]);
      } catch (error) {
        toast.error(uploadErrorMessage(error));
      } finally {
        setUploading(false);
      }
    }
  }

  async function pickVideo(file: File | undefined) {
    if (!file) return;
    if (media.some((item) => item.type === "image")) {
      toast.error(t("errors.mediaMixed"));
      return;
    }
    if (!VIDEO_TYPES.includes(file.type)) {
      toast.error(t("errors.invalidVideoType"));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(t("errors.videoTooLarge"));
      return;
    }
    setUploading(true);
    try {
      const url = await repository.uploadMedia(file, "post");
      setMedia([{ id: crypto.randomUUID(), type: "video", url }]);
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(id: string) {
    setMedia((previous) => previous.filter((item) => item.id !== id));
  }

  const canPublish = text.trim().length > 0 && !uploading && !publish.isPending;

  return (
    <section className="surface mt-5 p-4">
      <div className="flex gap-3">
        <UserAvatar name={me.fullName} url={me.avatarUrl} className="h-10 w-10" />
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("home.composerPlaceholder")}
          aria-label={t("home.composerTitle")}
          className="min-h-[70px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
          maxLength={3000}
        />
      </div>

      {media.length > 0 && (
        <div
          className={cn(
            "mt-3 grid gap-2",
            media.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-2",
          )}
        >
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border bg-surface-2"
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={t("home.mediaAlt")}
                  className="max-h-56 w-full object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-64 w-full bg-black"
                >
                  {t("home.videoUnsupported")}
                </video>
              )}
              <button
                type="button"
                onClick={() => removeMedia(item.id)}
                aria-label={t("home.removeMedia")}
                title={t("home.removeMedia")}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
            (uploading || media.some((item) => item.type === "video")) &&
              "pointer-events-none opacity-50",
          )}
        >
          <ImagePlus className="h-4 w-4" />
          {t("home.addPhotos")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              void pickImages(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </label>

        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
            (uploading || media.some((item) => item.type === "image")) &&
              "pointer-events-none opacity-50",
          )}
        >
          <Video className="h-4 w-4" />
          {t("home.addVideo")}
          <input
            type="file"
            accept="video/mp4,video/webm"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              void pickVideo(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>

        {uploading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("home.uploadingMedia")}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <label htmlFor="post-category" className="shrink-0 text-[11px] text-muted-foreground">
            {t("home.categoryLabel")}
          </label>
          <select
            id="post-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as PostCategory | "")}
            className="h-8 min-w-0 flex-1 rounded-lg border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-56"
          >
            <option value="">{t("home.categoryPlaceholder")}</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {t(`home.category.${item}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-[11px] text-muted-foreground">{text.length}/3000</span>
          <Button size="sm" disabled={!canPublish} onClick={() => setConfirmOpen(true)}>
            {publish.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {publish.isPending ? t("home.publishing") : t("home.publish")}
          </Button>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {t("home.mediaHint")} {t("home.mediaLimit", { count: MAX_IMAGES })}
      </p>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("home.relevanceTitle")}</DialogTitle>
            <DialogDescription>{t("home.relevanceBody")}</DialogDescription>
          </DialogHeader>
          {category && (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
              {t("home.categoryLabel")}: {t(`home.category.${category}`)}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t("home.reviewPost")}
            </Button>
            <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
              {publish.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("home.publishConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
