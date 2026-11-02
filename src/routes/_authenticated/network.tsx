import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, UserMinus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { connectionsQuery, directoryQuery, meQuery, peopleQuery } from "@/data/queries";
import { PageHeader } from "@/components/netclub/PageHeader";
import { EmptyState } from "@/components/netclub/EmptyState";
import { PersonCard } from "@/components/netclub/PersonCard";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/data/types";

export const Route = createFileRoute("/_authenticated/network")({
  head: () => ({
    meta: [
      { title: "Rede — NetClub" },
      { name: "description", content: "Descubra e conecte-se com profissionais." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(peopleQuery),
      queryClient.ensureQueryData(connectionsQuery),
      queryClient.ensureQueryData(directoryQuery),
    ]),
  component: NetworkPage,
});

type Tab = "discover" | "requests" | "connections" | "sent";

function NetworkPage() {
  const { t } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: people = [] } = useSuspenseQuery(peopleQuery);
  const { data: connections = [] } = useSuspenseQuery(connectionsQuery);
  const { data: directory = [] } = useSuspenseQuery(directoryQuery);
  const [tab, setTab] = useState<Tab>("discover");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["connections"] });
    void queryClient.invalidateQueries({ queryKey: ["people"] });
  };

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      repository.respondConnection(id, accept),
    onSuccess: (_data, variables) => {
      toast.success(variables.accept ? t("home.connected") : t("home.decline"));
      refresh();
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => repository.removeConnection(id),
    onSuccess: () => {
      toast.success(t("connections.remove"));
      refresh();
    },
    onError: () => toast.error(t("errors.forbidden")),
  });

  const byId = useMemo(() => {
    const map = new Map<string, Profile>();
    directory.forEach((profile) => map.set(profile.id, profile));
    return map;
  }, [directory]);

  if (!me) return null;

  const received = connections.filter((c) => c.addresseeId === me.id && c.status === "pending");
  const sent = connections.filter((c) => c.requesterId === me.id && c.status === "pending");
  const accepted = connections.filter((c) => c.status === "accepted");
  const connectionOf = (profileId: string) =>
    connections.find(
      (c) =>
        (c.requesterId === me.id && c.addresseeId === profileId) ||
        (c.addresseeId === me.id && c.requesterId === profileId),
    ) ?? null;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "discover", label: t("connections.tabDiscover"), count: people.length },
    { id: "requests", label: t("connections.requests"), count: received.length },
    { id: "connections", label: t("connections.myConnections"), count: accepted.length },
    { id: "sent", label: t("connections.sent"), count: sent.length },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("connections.title")} subtitle={t("connections.subtitle")} />

      <div className="no-scrollbar mb-5 flex gap-1 overflow-x-auto rounded-xl border bg-surface-2/50 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              tab === item.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span className="rounded-full bg-surface-2 px-1.5 text-[10px]">{item.count}</span>
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <div className="space-y-3">
          {people.length === 0 && (
            <EmptyState
              icon={Users}
              title={t("connections.emptyDiscover")}
              body={t("connections.connectNote")}
            />
          )}
          {people.map((profile) => (
            <PersonCard
              key={profile.id}
              profile={profile}
              meId={me.id}
              connection={connectionOf(profile.id)}
            />
          ))}
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {received.length === 0 && (
            <EmptyState icon={UserPlus} title={t("connections.noRequests")} />
          )}
          {received.map((connection) => {
            const profile = byId.get(connection.requesterId);
            if (!profile) return null;
            return (
              <div key={connection.id} className="surface flex items-center gap-3 p-4">
                <Link to="/members/$id" params={{ id: profile.id }}>
                  <UserAvatar
                    name={profile.fullName}
                    url={profile.avatarUrl}
                    className="h-11 w-11"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/members/$id"
                    params={{ id: profile.id }}
                    className="block truncate font-semibold hover:text-primary"
                  >
                    {profile.fullName}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{profile.headline}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => respond.mutate({ id: connection.id, accept: true })}
                    disabled={respond.isPending}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> {t("connections.accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => respond.mutate({ id: connection.id, accept: false })}
                    disabled={respond.isPending}
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> {t("connections.decline")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "connections" && (
        <div className="space-y-3">
          {accepted.length === 0 && (
            <EmptyState icon={Users} title={t("connections.noConnections")} />
          )}
          {accepted.map((connection) => {
            const otherId =
              connection.requesterId === me.id ? connection.addresseeId : connection.requesterId;
            const profile = byId.get(otherId);
            if (!profile) return null;
            return (
              <div key={connection.id} className="surface flex items-center gap-3 p-4">
                <Link to="/members/$id" params={{ id: profile.id }}>
                  <UserAvatar
                    name={profile.fullName}
                    url={profile.avatarUrl}
                    className="h-11 w-11"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/members/$id"
                    params={{ id: profile.id }}
                    className="block truncate font-semibold hover:text-primary"
                  >
                    {profile.fullName}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{profile.headline}</p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/members/$id" params={{ id: profile.id }}>
                    {t("connections.message")}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t("connections.remove")}
                  title={t("connections.remove")}
                  onClick={() => remove.mutate(connection.id)}
                  disabled={remove.isPending}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-3">
          {sent.length === 0 && <EmptyState icon={UserPlus} title={t("connections.noRequests")} />}
          {sent.map((connection) => {
            const profile = byId.get(connection.addresseeId);
            if (!profile) return null;
            return (
              <div key={connection.id} className="surface flex items-center gap-3 p-4">
                <Link to="/members/$id" params={{ id: profile.id }}>
                  <UserAvatar
                    name={profile.fullName}
                    url={profile.avatarUrl}
                    className="h-11 w-11"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/members/$id"
                    params={{ id: profile.id }}
                    className="block truncate font-semibold hover:text-primary"
                  >
                    {profile.fullName}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{t("home.pending")}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate(connection.id)}
                  disabled={remove.isPending}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
