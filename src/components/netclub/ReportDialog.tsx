import { useState } from "react";
import { toast } from "sonner";
import { useI18n, type TranslationKey } from "@/i18n";
import { useRepository } from "@/data/provider";
import type { ReportTarget } from "@/data/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASONS: { value: string; key: TranslationKey }[] = [
  { value: "spam", key: "report.reasonSpam" },
  { value: "harassment", key: "report.reasonHarassment" },
  { value: "hate", key: "report.reasonHate" },
  { value: "nudity", key: "report.reasonNudity" },
  { value: "violence", key: "report.reasonViolence" },
  { value: "misinformation", key: "report.reasonMisinformation" },
  { value: "scam", key: "report.reasonScam" },
  { value: "other", key: "report.reasonOther" },
];

const TARGET_KEYS: Record<ReportTarget, TranslationKey> = {
  user: "report.targetUser",
  post: "report.targetPost",
  comment: "report.targetComment",
  story: "report.targetStory",
  club: "report.targetClub",
};

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTarget;
  targetId: string;
}) {
  const { t } = useI18n();
  const repository = useRepository();
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      await repository.report({ targetType, targetId, category: reason, description });
      toast.success(t("report.success"));
      setDescription("");
      onOpenChange(false);
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
          <DialogDescription>
            {t("report.reason")} · {t(TARGET_KEYS[targetType])}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("report.reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {t(item.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description">{t("report.description")}</Label>
            <Textarea
              id="report-description"
              value={description}
              maxLength={500}
              placeholder={t("report.descriptionPlaceholder")}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("report.cancel")}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={sending}>
            {t("report.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
