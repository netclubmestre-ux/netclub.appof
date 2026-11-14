# Supabase — NetClub

Este documento descreve como o NetClub usa o Supabase e o que precisa ser
aplicado no projeto para que persistência, RLS e Realtime funcionem.

Projeto configurado em `.env`:

```env
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_<chave>"
VITE_DATA_SOURCE="supabase"
```

A chave publishable é pública por design. A `service_role` **nunca** entra no
bundle nem no repositório: operações privilegiadas ficam em funções SQL
`security definer` ou em Edge Functions.

## 1. Migrations

Aplique os arquivos de `supabase/migrations/` **na ordem**:

| Arquivo | Conteúdo |
| --- | --- |
| `20261102000000_netclub_mvp.sql` | schema, RLS, grants, triggers |
| `20261102001000_netclub_hardening.sql` | reforço de policies e integridade |
| `20261110000000_netclub_realtime.sql` | publication do Realtime |
| `20261113000000_netclub_evolution.sql` | mídia/categoria do feed, bucket `posts` e conexão automática de match |

Via CLI:

```sh
supabase link --project-ref <project-ref>
supabase db push
```

Ou cole cada arquivo no **SQL Editor** do dashboard, em ordem.

## 2. Realtime

O app assina as tabelas públicas em uma única subscription montada no
`AppShell` (`src/data/realtime.ts`). Cada evento apenas invalida as consultas
afetadas no React Query; os dados continuam vindo do banco com RLS aplicado.

Para o Realtime entregar eventos, as tabelas precisam estar na publication
`supabase_realtime`. Rode no SQL Editor:

```sql
do $$
declare
  target text;
  tables text[] := array[
    'profiles', 'posts', 'post_likes', 'post_saves', 'comments', 'stories',
    'story_views', 'connections', 'conversations', 'conversation_members',
    'messages', 'message_reads', 'clubs', 'club_members', 'notifications',
    'recommendations', 'collaborations', 'collaboration_participants',
    'match_interests', 'match_passes', 'subscriptions', 'user_settings',
    'saved_searches', 'blocks', 'reports', 'promotions',
    'official_announcements', 'terms_acceptances', 'deletion_requests'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach target in array tables loop
    if to_regclass(format('public.%I', target)) is null then
      continue;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end;
$$;
```

> A RLS continua valendo para o Realtime: cada usuário só recebe eventos de
> linhas que poderia ler via PostgREST. Não desabilite RLS nem use a
> `service_role` no cliente.

### Fallback

Enquanto a publication não estiver habilitada, `useRealtimeSync` invalida as
consultas ativas a cada 20 s (somente com a aba visível e online). Isso mantém
as telas atualizadas entre usuários, mas com latência de até 20 s. Com o SQL
acima aplicado, as mudanças passam a chegar em tempo real.

## 3. Mídia do feed

A migration `20261113000000_netclub_evolution.sql` cria:

- `public.posts.category` (categoria opcional da publicação);
- `public.post_media` (fotos/vídeos com RLS: leitura para membros, escrita
  apenas pelo autor da publicação);
- bucket `posts` no Storage, com escrita restrita à pasta `<uid>/`.

Sem essa migration, o feed continua funcionando apenas com texto: a leitura
faz fallback para as colunas antigas e o envio de mídia retorna um erro claro
em vez de gravar uma publicação incompleta.

A mesma migration cria a função `public.confirm_match(uuid)` e o trigger
`trg_link_match_connection`: quando dois interesses mútuos existem, a conexão
profissional é gravada como `accepted` sem duplicar pares. As notificações de
match continuam vindo do trigger `notify_match`.

## 4. Verificação rápida

1. Crie duas contas e publique com uma delas.
2. Abra o feed com a outra: a publicação deve aparecer sem recarregar.
3. Confirme no console do navegador que o WebSocket
   `wss://<project-ref>.supabase.co/realtime/v1/websocket` conecta com status
   101.
4. Confirme que um usuário **não** consegue alterar o perfil de outro
   (`PATCH /rest/v1/profiles?id=eq.<outro>` retorna 0 linhas).

## 5. Segurança

- RLS habilitada em todas as tabelas de domínio.
- `anon` sem acesso às tabelas; `authenticated` recebe apenas os grants
  necessários por migration.
- Storage com buckets/policies próprios para avatares e capas.
- Nenhuma chave secreta no front-end.
