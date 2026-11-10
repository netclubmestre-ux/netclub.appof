/**
 * Cliente Supabase do netclub.app.
 *
 * Usa apenas a chave publishable (segura no navegador). A service_role nunca
 * entra no bundle: operações privilegiadas vivem em funções SQL `security
 * definer` ou em Edge Functions.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "./repository";

function env(key: string): string | undefined {
  const values = import.meta.env as Record<string, string | undefined>;
  return values[key];
}

/** `true` quando URL e chave publishable estão presentes no bundle. */
export function isSupabaseConfigured(): boolean {
  return Boolean(env("VITE_SUPABASE_URL") && env("VITE_SUPABASE_PUBLISHABLE_KEY"));
}

/**
 * Verifica se o projeto Supabase responde. Não usa o cliente autenticado para
 * funcionar antes do login e não lança: retorna `false` em qualquer falha.
 */
export async function checkSupabaseHealth(signal?: AbortSignal): Promise<boolean> {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return false;
  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: signal ?? null,
    });
    return response.ok;
  } catch {
    return false;
  }
}

function createFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    if (init?.headers) {
      new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    }

    // Chaves novas (sb_publishable_*) são opacas: não são JWTs. O PostgREST
    // espera `apikey`; um `Authorization: Bearer <chave>` faria a requisição
    // falhar antes mesmo do RLS.
    if (headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);

    return fetch(input, { ...init, headers });
  };
}

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !key) {
    throw new RepositoryError("BACKEND_REQUIRED", "supabase_env_missing");
  }

  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: createFetch(key),
    },
  });

  return client;
}
