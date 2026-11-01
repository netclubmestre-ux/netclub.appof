import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  authorPostsQuery,
  connectionState,
  connectionsQuery,
  connectWith,
  meQuery,
  profileQuery,
  timeAgo,
} from "@/lib/netclub";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/members/$id")({
  head: () => ({
    meta: [
      { title: "Perfil — NetClub" },
      { name: "description", content: "Perfil de um membro do NetClub." },
      { property: "og:title", content: "Perfil — NetClub" },
      { property: "og:description", content: "Perfil de um membro do NetClub." },
    ],
  }),
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(profileQuery(params.id)),
      queryClient.ensureQueryData(connectionsQuery),
      queryClient.ensureQueryData(authorPostsQuery(params.id)),
    ]),
  component: MemberPage,
});

function MemberPage() {
  const { id } = Route.useParams();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: person } = useSuspenseQuery(profileQuery(id));
  const { data: posts } = useSuspenseQuery(authorPostsQuery(id));
  const { data: conns } = useSuspenseQuery(connectionsQuery);
  const qc = useQueryClient();

  const refresh = () => qc.invalidateQueries({ queryKey: ["connections"] });

  const connect = useMutation({
    mutationFn: () => connectWith(me.id, id, conns),
    onSuccess: (outcome) => {
      toast.success(outcome === "accepted" ? "Conexão aceita" : "Convite enviado");
      refresh();
    },
    onError: () => toast.error("Não foi possível conectar"),
  });

  const accept = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conexão aceita");
      refresh();
    },
    onError: () => toast.error("Não foi possível aceitar o convite"),
  });

  if (!person) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-24 text-center">
        <h1 className="text-xl font-semibold">Perfil não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Este membro pode ter saído do NetClub.</p>
        <Button asChild variant="secondary" className="mt-6">
          <Link to="/network">Voltar para a rede</Link>
        </Button>
      </div>
    );
  }

  const { status, row } = connectionState(me.id, id, conns);

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 md:pt-10">
      <Link to="/network" className="text-sm text-muted-foreground hover:text-primary">
        ← Voltar para a rede
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <UserAvatar
          name={person.full_name}
          url={person.avatar_url}
          className="h-20 w-20 border-2 border-primary/50 text-2xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{person.full_name}</h1>
          <p className="text-sm text-muted-foreground">{person.headline || "Membro NetClub"}</p>
          <div className="mt-3">
            {me.id === id && (
              <Button asChild size="sm" variant="secondary">
                <Link to="/profile">Editar perfil</Link>
              </Button>
            )}
            {me.id !== id && status === "none" && (
              <Button size="sm" disabled={connect.isPending} onClick={() => connect.mutate()}>
                Conectar
              </Button>
            )}
            {me.id !== id && status === "received" && row && (
              <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate(row.id)}>
                Aceitar convite
              </Button>
            )}
            {me.id !== id && status === "sent" && (
              <span className="text-xs text-muted-foreground">Convite pendente</span>
            )}
            {me.id !== id && status === "connected" && (
              <span className="text-xs text-primary">Você está conectado</span>
            )}
          </div>
        </div>
      </div>

      {person.bio && (
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">{person.bio}</p>
      )}

      {person.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {person.skills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold">Publicações</h2>
      <div className="space-y-3">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
        )}
        {posts.map((p) => (
          <article key={p.id} className="surface p-4">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{p.content}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {[p.group?.name, timeAgo(p.created_at)].filter(Boolean).join(" • ")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
