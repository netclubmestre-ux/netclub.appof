import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  connectionState,
  connectionsQuery,
  connectWith,
  meQuery,
  peopleQuery,
} from "@/lib/netclub";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/network")({
  head: () => ({
    meta: [
      { title: "Rede — NetClub" },
      { name: "description", content: "Descubra e conecte-se com profissionais." },
      { property: "og:title", content: "Rede — NetClub" },
      { property: "og:description", content: "Descubra e conecte-se com profissionais." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(peopleQuery),
      queryClient.ensureQueryData(connectionsQuery),
    ]),
  component: NetworkPage,
});

function NetworkPage() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: people } = useSuspenseQuery(peopleQuery);
  const { data: conns } = useSuspenseQuery(connectionsQuery);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["connections"] });

  const connect = useMutation({
    mutationFn: (id: string) => connectWith(me.id, id, conns),
    onSuccess: (outcome) => {
      toast.success(outcome === "accepted" ? "Conexão aceita" : "Convite enviado");
      refresh();
    },
    onError: () => toast.error("Não foi possível conectar"),
  });

  const accept = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conexão aceita");
      refresh();
    },
    onError: () => toast.error("Não foi possível aceitar o convite"),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 md:pt-10">
      <h1 className="text-2xl font-bold">Sua rede</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Profissionais do mercado digital no NetClub.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {people.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há outros membros.</p>
        )}
        {people.map((p) => {
          const { status, row } = connectionState(me.id, p.id, conns);
          return (
            <div key={p.id} className="surface flex items-center gap-3 p-4">
              <Link
                to="/members/$id"
                params={{ id: p.id }}
                aria-label={`Ver perfil de ${p.full_name}`}
              >
                <UserAvatar name={p.full_name} url={p.avatar_url} className="h-12 w-12" />
              </Link>
              <Link to="/members/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                <p className="truncate font-semibold hover:text-primary">{p.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.headline || "Membro NetClub"}
                </p>
              </Link>
              {status === "none" && (
                <Button size="sm" disabled={connect.isPending} onClick={() => connect.mutate(p.id)}>
                  Conectar
                </Button>
              )}
              {status === "received" && row && (
                <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate(row.id)}>
                  Aceitar
                </Button>
              )}
              {status === "sent" && <span className="text-xs text-muted-foreground">Pendente</span>}
              {status === "connected" && <span className="text-xs text-primary">Conectado</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
