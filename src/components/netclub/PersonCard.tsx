import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import type { Connection, Profile } from "@/data/types";
import { connectionState } from "@/lib/netclub";
import { UserAvatar } from "./UserAvatar";
import { Tag } from "./Tag";
import { Button } from "@/components/ui/button";

export function PersonCard({
  profile,
  meId,
  connection,
  compact = false,
}: {
  profile: Profile;
  meId: string;
  connection?: Connection | null;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const state = connectionState(meId, profile.id, connection ? [connection] : []);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["connections"] });
    void queryClient.invalidateQueries({ queryKey: ["people"] });
  };

  const connect = useMutation({
    mutationFn: () => repository.sendConnectionRequest(profile.id),
    onSuccess: () => {
      toast.success(t("home.pending"));
      refresh();
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const accept = useMutation({
    mutationFn: () => repository.respondConnection(state.connectionId!, true),
    onSuccess: () => {
      toast.success(t("home.connected"));
      refresh();
    },
    onError: () => toast.error(t("errors.generic")),
  });

  return (
    <div className="surface flex items-start gap-3 p-4">
      <Link to="/members/$id" params={{ id: profile.id }} aria-label={profile.fullName}>
        <UserAvatar name={profile.fullName} url={profile.avatarUrl} className="h-12 w-12" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to="/members/$id"
          params={{ id: profile.id }}
          className="block truncate font-semibold hover:text-primary"
        >
          {profile.fullName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {profile.headline || t("common.member")}
        </p>
        {!compact && profile.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.skills.slice(0, 3).map((skill) => (
              <Tag key={skill}>{t(`skill.${skill}`)}</Tag>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0">
        {state.status === "none" && (
          <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
            {t("home.connect")}
          </Button>
        )}
        {state.status === "received" && (
          <Button size="sm" onClick={() => accept.mutate()} disabled={accept.isPending}>
            {t("home.accept")}
          </Button>
        )}
        {state.status === "sent" && (
          <span className="text-xs text-muted-foreground">{t("home.pending")}</span>
        )}
        {state.status === "connected" && (
          <Link
            to="/members/$id"
            params={{ id: profile.id }}
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("home.connected")}
          </Link>
        )}
      </div>
    </div>
  );
}
