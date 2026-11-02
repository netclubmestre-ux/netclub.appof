import { createDevRepository } from "./dev-repository";
import { createSupabaseRepository } from "./supabase-repository";
import type { NetclubRepository } from "./repository";

/**
 * Repositório ativo da aplicação.
 *
 * A seleção é explícita por variável de ambiente:
 *   VITE_DATA_SOURCE=supabase  -> usa `supabase-repository` (ainda não configurado)
 *   ausente / "demo"           -> usa o repositório local de demonstração
 *
 * Enquanto o projeto Supabase exclusivo não for autorizado e configurado, o
 * padrão é `demo` — sem nenhuma requisição de rede.
 */
function selectRepository(): NetclubRepository {
  const source = import.meta.env["VITE_DATA_SOURCE"];
  if (source === "supabase") return createSupabaseRepository();
  return createDevRepository();
}

export const repository: NetclubRepository = selectRepository();
