import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import type { Club } from "@/data/types";
import { Button } from "@/components/ui/button";

export function ClubCard({ club, meId }: { club: Club; meId: string }) {
  const { t, formatNumber } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const joined = club.memberIds.includes(meId);

  const toggle = useMutation({
    mutationFn: () => (joined ? repository.leaveClub(club.id) : repository.joinClub(club.id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clubs"] });
      void queryClient.invalidateQueries({ queryKey: ["club", club.slug] });
      toast.success(joined ? t("clubs.leave") : t("clubs.joined"));
    },
    onError: () => toast.error(t("clubs.leaveError")),
  });

  return (
    <div className="surface overflow-hidden">
      <Link to="/clubs/$slug" params={{ slug: club.slug }} className="block">
        <div className="relative h-28 w-full overflow-hidden">
          {club.coverUrl ? (
            <img
              src={club.coverUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-80"
            />
          ) : (
            <div className="h-full w-full bg-primary-deep" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
            {t(`category.${club.category}`)}
          </span>
        </div>
      </Link>
      <div className="p-4">
        <Link to="/clubs/$slug" params={{ slug: club.slug }}>
          <h3 className="font-semibold hover:text-primary">{club.name}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{club.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />{" "}
            {t("clubs.members", { count: formatNumber(club.memberIds.length) })}
          </span>
          <Button
            size="sm"
            variant={joined ? "secondary" : "default"}
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
          >
            {joined ? t("clubs.leave") : t("clubs.join")}
          </Button>
        </div>
      </div>
    </div>
  );
}
