/**
 * Implementação futura sobre o Supabase exclusivo do netclub.app.
 *
 * Estado atual: NÃO CONFIGURADA. Nenhuma tabela foi criada e nenhuma migração
 * foi executada. Enquanto isso, `client.ts` usa o repositório de demonstração.
 *
 * Ao autorizar a Opção B (Supabase exclusivo), esta classe deve ser preenchida
 * mapeando o contrato `NetclubRepository` para as tabelas definidas na Fase 1.
 * As telas não mudam: elas só conhecem o contrato.
 *
 * Mapa previsto (ver docs/fase-0-auditoria.md):
 *   getSession            -> supabase.auth.getSession()
 *   getCurrentProfile     -> profiles (id = auth.uid())
 *   getFeed               -> posts + post_likes + post_comments (cursor pagination)
 *   listStories           -> stories where expires_at > now()
 *   getMatchState         -> match_interests + connections + blocks
 *   listClubs/getClub     -> clubs + club_members
 *   listConversations     -> conversations + conversation_members
 *   listMessages          -> messages (RLS: apenas membros)
 *   listNotifications     -> notifications (RLS: apenas o dono)
 *   getQuotes/getNews     -> Edge Function com cache (nunca no cliente)
 *   getSubscription       -> subscriptions (status controlado no servidor)
 *
 * Regras de segurança obrigatórias na implementação:
 *   - service_role apenas em server functions.
 *   - RLS em todas as tabelas; sem policy = sem acesso.
 *   - uploads validados (tipo/tamanho) e buckets privados.
 *   - pagamentos e promoções validados no servidor.
 */
import type { NetclubRepository } from "./repository";

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase ainda não configurado para o netclub.app. Defina VITE_DATA_SOURCE=demo ou conclua a Fase 1.",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

function notConfigured(): never {
  throw new SupabaseNotConfiguredError();
}

/**
 * Placeholder seguro: qualquer acesso a método falha com erro explícito, em vez
 * de devolver dados falsos silenciosamente.
 */
export function createSupabaseRepository(): NetclubRepository {
  const base = { source: "supabase" as const, isDemo: false };
  return new Proxy(base as unknown as NetclubRepository, {
    get(target, prop, receiver) {
      if (prop === "source" || prop === "isDemo") return Reflect.get(target, prop, receiver);
      return notConfigured;
    },
  });
}
