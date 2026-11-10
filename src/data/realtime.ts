import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useDataMode } from "./provider";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase-client";

/**
 * Sincronização em tempo real do NetClub.
 *
 * Uma única subscription é aberta por sessão autenticada e montada no
 * `AppShell`. Cada evento apenas invalida as consultas afetadas no React
 * Query — os dados continuam vindo do banco, com RLS aplicado, e a UI se
 * atualiza sem recarregar a página.
 */

/** Tabelas publicadas em `supabase_realtime` pela migration de realtime. */
const TABLES = [
  "profiles",
  "posts",
  "post_likes",
  "post_saves",
  "comments",
  "stories",
  "story_views",
  "connections",
  "conversations",
  "conversation_members",
  "messages",
  "message_reads",
  "clubs",
  "club_members",
  "notifications",
  "recommendations",
  "collaborations",
  "collaboration_participants",
  "match_interests",
  "match_passes",
  "subscriptions",
  "user_settings",
  "saved_searches",
  "blocks",
  "reports",
  "promotions",
  "official_announcements",
  "terms_acceptances",
  "deletion_requests",
] as const;

const ALL: QueryKey[] = [["all"]];

/**
 * Rede de segurança: se a publication `supabase_realtime` ainda não estiver
 * habilitada no projeto, os eventos nunca chegam. Nesse caso mantemos os dados
 * atualizados com uma invalidação periódica das consultas montadas. Quando o
 * Realtime está ativo ele continua entregando as mudanças na hora; o polling
 * só evita que a tela fique congelada.
 */
const POLL_INTERVAL_MS = 20_000;

/** Chaves de consulta que cada tabela pode alterar. */
const TABLE_QUERY_KEYS: Record<string, QueryKey[]> = {
  profiles: [
    ["me"],
    ["people"],
    ["directory"],
    ["profile"],
    ["feed"],
    ["connections"],
    ["netmach"],
    ["recommendations"],
    ["collaborations"],
  ],
  posts: [["feed"], ["club"]],
  post_likes: [["feed"]],
  post_saves: [["feed"]],
  comments: [["comments"], ["feed"]],
  stories: [["stories"]],
  story_views: [["stories"]],
  connections: [["connections"], ["people"], ["netmach"], ["notifications"]],
  conversations: [["conversations"]],
  conversation_members: [["conversations"]],
  messages: [["messages"], ["conversations"]],
  message_reads: [["messages"], ["conversations"]],
  clubs: [["clubs"], ["club"]],
  club_members: [["clubs"], ["club"]],
  notifications: [["notifications"]],
  recommendations: [["recommendations"]],
  collaborations: [["collaborations"]],
  collaboration_participants: [["collaborations"]],
  match_interests: [["netmach"], ["connections"], ["notifications"]],
  match_passes: [["netmach"]],
  subscriptions: [["subscription"]],
  user_settings: [["settings"]],
  saved_searches: [["saved-searches"]],
  blocks: [["blocked"], ["people"], ["feed"], ["netmach"]],
  reports: [["reports"]],
  promotions: [["promotions"]],
  official_announcements: [["official", "announcements"]],
  terms_acceptances: [["terms-acceptances"]],
  deletion_requests: [["deletion-request"]],
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { source } = useDataMode();

  useEffect(() => {
    if (source !== "supabase" || !isSupabaseConfigured()) return;

    let client: ReturnType<typeof getSupabaseClient>;
    try {
      client = getSupabaseClient();
    } catch {
      return;
    }

    const pending = new Set<QueryKey>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      timer = undefined;
      for (const queryKey of pending) {
        void queryClient.invalidateQueries({ queryKey });
      }
      pending.clear();
    };

    const schedule = (table: string) => {
      for (const key of TABLE_QUERY_KEYS[table] ?? ALL) pending.add(key);
      if (timer) return;
      // Agrupa rajadas de eventos (ex.: vários likes) em uma única rodada.
      timer = setTimeout(flush, 180);
    };

    const channel = client.channel("netclub-realtime");

    for (const table of TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () =>
        schedule(table),
      );
    }

    channel.subscribe((status, error) => {
      if (!import.meta.env.DEV) return;
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(
          `[NetClub] Realtime: ${status}. Verifique se as tabelas estão na publication ` +
            `supabase_realtime (migration 20261110000000_netclub_realtime.sql).`,
          error ?? "",
        );
      }
    });

    const refreshActive = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      void queryClient.invalidateQueries({ refetchType: "active" });
    };

    const poll = setInterval(refreshActive, POLL_INTERVAL_MS);

    // Ao voltar para a aba (ou reconectar), atualiza na hora em vez de esperar
    // o próximo ciclo.
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshActive();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", refreshActive);

    return () => {
      if (timer) clearTimeout(timer);
      pending.clear();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", refreshActive);
      void client.removeChannel(channel);
    };
  }, [queryClient, source]);
}
