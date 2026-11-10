-- NetClub — Supabase Realtime
-- Idempotente. Publica as tabelas usadas pelo app na publication do Realtime.
--
-- A RLS continua valendo para o Realtime: cada usuário só recebe eventos de
-- linhas que poderia ler via PostgREST. Não é necessário desabilitar RLS nem
-- expor a service_role.

begin;

do $$
declare
  target text;
  tables text[] := array[
    'profiles',
    'posts',
    'post_likes',
    'post_saves',
    'comments',
    'stories',
    'story_views',
    'connections',
    'conversations',
    'conversation_members',
    'messages',
    'message_reads',
    'clubs',
    'club_members',
    'notifications',
    'recommendations',
    'collaborations',
    'collaboration_participants',
    'match_interests',
    'match_passes',
    'subscriptions',
    'user_settings',
    'saved_searches',
    'blocks',
    'reports',
    'promotions',
    'official_announcements',
    'terms_acceptances',
    'deletion_requests'
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
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end;
$$;

commit;
