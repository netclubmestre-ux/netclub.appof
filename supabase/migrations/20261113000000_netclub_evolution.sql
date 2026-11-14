-- ---------------------------------------------------------------------------
-- NetClub — evolução do MVP (NetMatch, Stories e feed com mídia)
--
-- Esta migração é aditiva: não remove tabelas, colunas nem dados existentes.
-- Aplicar no Supabase do netclub.app (SQL Editor ou `supabase db push`).
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- Feed: categoria opcional na publicação
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists category text;

alter table public.posts
  drop constraint if exists posts_category_check;

alter table public.posts
  add constraint posts_category_check
  check (
    category is null
    or category in (
      'question',
      'experience',
      'knowledge',
      'project',
      'discussion',
      'achievement',
      'other'
    )
  );

-- ---------------------------------------------------------------------------
-- Feed: mídia (fotos e vídeos) vinculada à publicação
-- ---------------------------------------------------------------------------

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists post_media_post_idx
  on public.post_media (post_id, position);

alter table public.post_media enable row level security;

drop policy if exists "post media readable" on public.post_media;
create policy "post media readable"
  on public.post_media for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.hidden = false
    )
  );

drop policy if exists "post media insert own" on public.post_media;
create policy "post media insert own"
  on public.post_media for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

drop policy if exists "post media delete own" on public.post_media;
create policy "post media delete own"
  on public.post_media for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

revoke all on public.post_media from anon, authenticated;
grant select, insert, delete on public.post_media to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket público de mídia do feed (mesmo modelo de avatars/stories)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

drop policy if exists "netclub posts read" on storage.objects;
create policy "netclub posts read"
  on storage.objects for select
  using (bucket_id = 'posts');

drop policy if exists "netclub posts write" on storage.objects;
create policy "netclub posts write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "netclub posts delete" on storage.objects;
create policy "netclub posts delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- NetMatch: match mútuo vira conexão profissional aceita, sem duplicidade
-- ---------------------------------------------------------------------------

create or replace function public.link_match_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing uuid;
begin
  if exists (
    select 1 from public.match_interests
    where from_id = new.to_id and to_id = new.from_id
  ) then
    select id into existing
    from public.connections
    where (requester_id = new.from_id and addressee_id = new.to_id)
       or (requester_id = new.to_id and addressee_id = new.from_id)
    limit 1;

    if existing is null then
      begin
        insert into public.connections (requester_id, addressee_id, status)
        values (new.from_id, new.to_id, 'accepted');
      exception when unique_violation then
        update public.connections
          set status = 'accepted'
          where (requester_id = new.from_id and addressee_id = new.to_id)
             or (requester_id = new.to_id and addressee_id = new.from_id);
      end;
    else
      update public.connections
        set status = 'accepted'
        where id = existing and status <> 'accepted';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_link_match_connection on public.match_interests;
create trigger trg_link_match_connection
  after insert on public.match_interests
  for each row execute function public.link_match_connection();

-- Chamada opcional pelo cliente para garantir a conexão de um match já mútuo.
create or replace function public.confirm_match(target uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if target = me then
    raise exception 'self';
  end if;
  if not exists (select 1 from public.match_interests where from_id = me and to_id = target)
     or not exists (select 1 from public.match_interests where from_id = target and to_id = me) then
    raise exception 'not_mutual';
  end if;
  if public.is_blocked_between(me, target) then
    raise exception 'blocked';
  end if;

  select id into existing
  from public.connections
  where (requester_id = me and addressee_id = target)
     or (requester_id = target and addressee_id = me)
  limit 1;

  if existing is null then
    begin
      insert into public.connections (requester_id, addressee_id, status)
      values (me, target, 'accepted')
      returning id into existing;
    exception when unique_violation then
      select id into existing
      from public.connections
      where (requester_id = me and addressee_id = target)
         or (requester_id = target and addressee_id = me)
      limit 1;
      update public.connections
        set status = 'accepted'
        where id = existing and status <> 'accepted';
    end;
  else
    update public.connections
      set status = 'accepted'
      where id = existing and status <> 'accepted';
  end if;

  return existing;
end;
$$;

grant execute on function public.confirm_match(uuid) to authenticated;

-- Evita notificação duplicada de "conexão" quando o par já deu match:
-- nesse caso a notificação de match (trg_notify_match) é a relevante.
create or replace function public.notify_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.match_interests mi
    where mi.from_id = new.requester_id and mi.to_id = new.addressee_id
  ) and exists (
    select 1 from public.match_interests mi
    where mi.from_id = new.addressee_id and mi.to_id = new.requester_id
  ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, actor_id, kind, entity_id)
    values (new.addressee_id, new.requester_id, 'connection', new.id);
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.notifications (user_id, actor_id, kind, entity_id)
    values (new.requester_id, new.addressee_id, 'connection', new.id);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stories: índice para leitura de visualizações por usuário
-- ---------------------------------------------------------------------------

create index if not exists story_views_user_idx
  on public.story_views (user_id, story_id);

commit;
