-- NetClub — schema inicial do MVP (Supabase exclusivo do netclub.app)
-- Idempotente: pode ser reaplicado com segurança.
--
-- Este schema é a contraparte de src/data/types.ts. Nenhum dado fictício é
-- inserido aqui: o modo demonstração continua vivendo apenas no frontend.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

create or replace function public.is_conversation_member(conv uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.conversation_members
    where conversation_id = conv and user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_club_admin(cid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.club_members
    where club_id = cid and user_id = auth.uid() and role = 'admin'
  );
end;
$$;

create or replace function public.is_club_creator(cid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.clubs
    where id = cid and created_by = auth.uid()
  );
end;
$$;

create or replace function public.is_collaboration_participant(cid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.collaboration_participants
    where collaboration_id = cid and user_id = auth.uid()
  );
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.is_club_admin(uuid) to authenticated;
grant execute on function public.is_club_creator(uuid) to authenticated;
grant execute on function public.is_collaboration_participant(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  full_name text not null default '',
  headline text not null default '',
  area text not null default '',
  bio text not null default '',
  avatar_url text,
  location text not null default '',
  country text not null default '',
  experience text not null default 'beginner'
    check (experience in ('beginner', 'intermediate', 'advanced')),
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  goals text[] not null default '{}',
  looking_for text not null default '',
  offering text not null default '',
  portfolio jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  onboarded boolean not null default false,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9._]{3,30}$')
);

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles readable by signed-in" on public.profiles;
create policy "profiles readable by signed-in"
  on public.profiles for select to authenticated using (true);

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (
  id, username, full_name, headline, area, bio, avatar_url, location, country,
  experience, skills, interests, goals, looking_for, offering, portfolio, links,
  onboarded
) on public.profiles to authenticated;
grant update (
  username, full_name, headline, area, bio, avatar_url, location, country,
  experience, skills, interests, goals, looking_for, offering, portfolio, links,
  onboarded
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Bloqueios (precisa existir antes das policies de conexões)
-- ---------------------------------------------------------------------------

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_not_self check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "blocks own read" on public.blocks;
create policy "blocks own read"
  on public.blocks for select to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists "blocks own insert" on public.blocks;
create policy "blocks own insert"
  on public.blocks for insert to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists "blocks own delete" on public.blocks;
create policy "blocks own delete"
  on public.blocks for delete to authenticated
  using (auth.uid() = blocker_id);

revoke all on public.blocks from anon, authenticated;
grant select, insert, delete on public.blocks to authenticated;

-- ---------------------------------------------------------------------------
-- Configurações, assinatura e LGPD
-- ---------------------------------------------------------------------------

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  language text not null default 'pt-BR' check (language in ('pt-BR', 'en', 'es')),
  profile_visibility text not null default 'members'
    check (profile_visibility in ('public', 'members')),
  show_goals boolean not null default true,
  allow_messages_from text not null default 'connections'
    check (allow_messages_from in ('connections', 'everyone')),
  email_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

drop policy if exists "settings own" on public.user_settings;
create policy "settings own"
  on public.user_settings for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "settings own insert" on public.user_settings;
create policy "settings own insert"
  on public.user_settings for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "settings own update" on public.user_settings;
create policy "settings own update"
  on public.user_settings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.user_settings from anon, authenticated;
grant select, insert on public.user_settings to authenticated;
grant update (language, profile_visibility, show_goals, allow_messages_from, email_notifications)
  on public.user_settings to authenticated;

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  status text not null default 'active' check (status in ('active', 'canceled', 'none')),
  started_at timestamptz,
  renews_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "subscription own" on public.subscriptions;
create policy "subscription own"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create table if not exists public.terms_acceptances (
  user_id uuid not null references public.profiles(id) on delete cascade,
  document text not null check (document in ('terms', 'privacy', 'guidelines')),
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, document)
);

alter table public.terms_acceptances enable row level security;

drop policy if exists "terms own" on public.terms_acceptances;
create policy "terms own"
  on public.terms_acceptances for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "terms own insert" on public.terms_acceptances;
create policy "terms own insert"
  on public.terms_acceptances for insert to authenticated
  with check (auth.uid() = user_id);

revoke all on public.terms_acceptances from anon, authenticated;
grant select, insert on public.terms_acceptances to authenticated;

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'completed'))
);

alter table public.deletion_requests enable row level security;

drop policy if exists "deletion own" on public.deletion_requests;
create policy "deletion own"
  on public.deletion_requests for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "deletion own insert" on public.deletion_requests;
create policy "deletion own insert"
  on public.deletion_requests for insert to authenticated
  with check (auth.uid() = user_id);

revoke all on public.deletion_requests from anon, authenticated;
grant select, insert on public.deletion_requests to authenticated;

-- ---------------------------------------------------------------------------
-- Feed
-- ---------------------------------------------------------------------------

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid,
  content text not null check (char_length(content) between 1 and 3000),
  sponsored boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

drop policy if exists "posts readable" on public.posts;
create policy "posts readable"
  on public.posts for select to authenticated using (true);

drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own"
  on public.posts for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "posts update own" on public.posts;
create policy "posts update own"
  on public.posts for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own"
  on public.posts for delete to authenticated
  using (auth.uid() = author_id);

revoke all on public.posts from anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_saves (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;

drop policy if exists "likes readable" on public.post_likes;
create policy "likes readable"
  on public.post_likes for select to authenticated using (true);

drop policy if exists "like self" on public.post_likes;
create policy "like self"
  on public.post_likes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "unlike self" on public.post_likes;
create policy "unlike self"
  on public.post_likes for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "saves own read" on public.post_saves;
create policy "saves own read"
  on public.post_saves for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "save self" on public.post_saves;
create policy "save self"
  on public.post_saves for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "unsave self" on public.post_saves;
create policy "unsave self"
  on public.post_saves for delete to authenticated
  using (auth.uid() = user_id);

revoke all on public.post_likes, public.post_saves from anon, authenticated;
grant select, insert, delete on public.post_likes, public.post_saves to authenticated;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "comments readable" on public.comments;
create policy "comments readable"
  on public.comments for select to authenticated using (true);

drop policy if exists "comment self" on public.comments;
create policy "comment self"
  on public.comments for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "uncomment self" on public.comments;
create policy "uncomment self"
  on public.comments for delete to authenticated
  using (auth.uid() = author_id);

revoke all on public.comments from anon, authenticated;
grant select, insert, delete on public.comments to authenticated;

-- ---------------------------------------------------------------------------
-- Stories
-- ---------------------------------------------------------------------------

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text,
  text text not null default '' check (char_length(text) <= 1000),
  background text not null default '',
  sponsored boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.stories enable row level security;

drop policy if exists "stories readable" on public.stories;
create policy "stories readable"
  on public.stories for select to authenticated
  using (expires_at > now());

drop policy if exists "story insert own" on public.stories;
create policy "story insert own"
  on public.stories for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "story delete own" on public.stories;
create policy "story delete own"
  on public.stories for delete to authenticated
  using (auth.uid() = author_id);

revoke all on public.stories from anon, authenticated;
grant select, insert, delete on public.stories to authenticated;

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

alter table public.story_views enable row level security;

drop policy if exists "story views readable" on public.story_views;
create policy "story views readable"
  on public.story_views for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = story_id and s.author_id = auth.uid()
    )
  );

drop policy if exists "story view self" on public.story_views;
create policy "story view self"
  on public.story_views for insert to authenticated
  with check (auth.uid() = user_id);

revoke all on public.story_views from anon, authenticated;
grant select, insert on public.story_views to authenticated;

-- ---------------------------------------------------------------------------
-- Conexões
-- ---------------------------------------------------------------------------

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint connections_not_self check (requester_id <> addressee_id)
);

create unique index if not exists connections_unique_pair
  on public.connections (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

alter table public.connections enable row level security;

drop policy if exists "conn read own" on public.connections;
create policy "conn read own"
  on public.connections for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "conn request" on public.connections;
create policy "conn request"
  on public.connections for insert to authenticated
  with check (
    auth.uid() = requester_id
    and status = 'pending'
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = addressee_id)
         or (b.blocker_id = addressee_id and b.blocked_id = auth.uid())
    )
  );

drop policy if exists "conn accept" on public.connections;
create policy "conn accept"
  on public.connections for update to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

drop policy if exists "conn delete" on public.connections;
create policy "conn delete"
  on public.connections for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

revoke all on public.connections from anon, authenticated;
grant select, insert, delete on public.connections to authenticated;
grant update (status) on public.connections to authenticated;

-- ---------------------------------------------------------------------------
-- Conversas e mensagens
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;

drop policy if exists "conversation member read" on public.conversations;
create policy "conversation member read"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id));

drop policy if exists "conversation member read members" on public.conversation_members;
create policy "conversation member read members"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));

revoke all on public.conversations, public.conversation_members from anon, authenticated;
grant select on public.conversations, public.conversation_members to authenticated;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 3000),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "messages read member" on public.messages;
create policy "messages read member"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists "messages send member" on public.messages;
create policy "messages send member"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id)
  );

revoke all on public.messages from anon, authenticated;
grant select, insert on public.messages to authenticated;

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_reads enable row level security;

drop policy if exists "message reads own" on public.message_reads;
create policy "message reads own"
  on public.message_reads for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_member(m.conversation_id)
    )
  );

drop policy if exists "message read self" on public.message_reads;
create policy "message read self"
  on public.message_reads for insert to authenticated
  with check (auth.uid() = user_id);

revoke all on public.message_reads from anon, authenticated;
grant select, insert on public.message_reads to authenticated;

create or replace function public.start_conversation(target uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conv uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if target = auth.uid() then
    raise exception 'self';
  end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'not_found';
  end if;
  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = target)
       or (b.blocker_id = target and b.blocked_id = auth.uid())
  ) then
    raise exception 'blocked';
  end if;

  select c.id into conv
  from public.conversations c
  join public.conversation_members m1
    on m1.conversation_id = c.id and m1.user_id = auth.uid()
  join public.conversation_members m2
    on m2.conversation_id = c.id and m2.user_id = target
  where (select count(*) from public.conversation_members m where m.conversation_id = c.id) = 2
  limit 1;

  if conv is not null then
    return conv;
  end if;

  insert into public.conversations default values returning id into conv;
  insert into public.conversation_members (conversation_id, user_id)
  values (conv, auth.uid()), (conv, target);
  return conv;
end;
$$;

grant execute on function public.start_conversation(uuid) to authenticated;

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation on public.messages;
create trigger trg_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- Clubes
-- ---------------------------------------------------------------------------

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name text not null,
  description text not null default '',
  category text not null,
  cover_url text,
  rules text[] not null default '{}',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_clubs_updated_at on public.clubs;
create trigger trg_clubs_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

alter table public.posts
  drop constraint if exists posts_club_id_fkey;
alter table public.posts
  add constraint posts_club_id_fkey
  foreign key (club_id) references public.clubs(id) on delete set null;

alter table public.clubs enable row level security;

drop policy if exists "clubs readable" on public.clubs;
create policy "clubs readable"
  on public.clubs for select to authenticated using (true);

drop policy if exists "clubs create" on public.clubs;
create policy "clubs create"
  on public.clubs for insert to authenticated
  with check (auth.uid() = created_by);

revoke all on public.clubs from anon, authenticated;
grant select, insert, update, delete on public.clubs to authenticated;

create table if not exists public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.club_members enable row level security;

drop policy if exists "club members readable" on public.club_members;
create policy "club members readable"
  on public.club_members for select to authenticated using (true);

drop policy if exists "club join self" on public.club_members;
create policy "club join self"
  on public.club_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and (role = 'member' or public.is_club_creator(club_id))
  );

drop policy if exists "club leave self" on public.club_members;
create policy "club leave self"
  on public.club_members for delete to authenticated
  using (
    user_id = auth.uid()
    and not public.is_club_admin(club_id)
  );

drop policy if exists "club admin update roles" on public.club_members;
create policy "club admin update roles"
  on public.club_members for update to authenticated
  using (public.is_club_admin(club_id))
  with check (public.is_club_admin(club_id));

revoke all on public.club_members from anon, authenticated;
grant select, insert, delete on public.club_members to authenticated;
grant update (role) on public.club_members to authenticated;

drop policy if exists "clubs admin update" on public.clubs;
create policy "clubs admin update"
  on public.clubs for update to authenticated
  using (public.is_club_admin(id))
  with check (public.is_club_admin(id));

drop policy if exists "clubs admin delete" on public.clubs;
create policy "clubs admin delete"
  on public.clubs for delete to authenticated
  using (public.is_club_admin(id));

create or replace function public.prevent_last_club_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if old.role = 'admin' and new.role <> 'admin' and not exists (
      select 1 from public.club_members
      where club_id = old.club_id and user_id <> old.user_id and role = 'admin'
    ) then
      raise exception 'last_admin';
    end if;
    return new;
  end if;

  -- DELETE: a policy de RLS já impede que um admin saia por conta própria.
  -- Exclusões em cascata (clube apagado) precisam continuar funcionando.
  return old;
end;
$$;

drop trigger if exists trg_prevent_last_club_admin on public.club_members;
create trigger trg_prevent_last_club_admin
  before delete or update of role on public.club_members
  for each row execute function public.prevent_last_club_admin();

-- ---------------------------------------------------------------------------
-- Notificações
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  kind text not null check (kind in (
    'like', 'comment', 'connection', 'match', 'message', 'club', 'recommendation'
  )),
  entity_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notif own" on public.notifications;
create policy "notif own"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notif mark read" on public.notifications;
create policy "notif mark read"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Recomendações e colaborações
-- ---------------------------------------------------------------------------

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint recommendations_not_self check (author_id <> target_id)
);

alter table public.recommendations enable row level security;

drop policy if exists "recommendations read involved" on public.recommendations;
create policy "recommendations read involved"
  on public.recommendations for select to authenticated
  using (auth.uid() in (author_id, target_id) or public.is_admin());

drop policy if exists "recommendation request" on public.recommendations;
create policy "recommendation request"
  on public.recommendations for insert to authenticated
  with check (auth.uid() = author_id and status = 'pending');

drop policy if exists "recommendation respond" on public.recommendations;
create policy "recommendation respond"
  on public.recommendations for update to authenticated
  using (auth.uid() = target_id)
  with check (auth.uid() = target_id);

revoke all on public.recommendations from anon, authenticated;
grant select, insert on public.recommendations to authenticated;
grant update (status) on public.recommendations to authenticated;

create table if not exists public.collaborations (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  year text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.collaboration_participants (
  collaboration_id uuid not null references public.collaborations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (collaboration_id, user_id)
);

alter table public.collaborations enable row level security;
alter table public.collaboration_participants enable row level security;

drop policy if exists "collaborations read participants" on public.collaborations;
create policy "collaborations read participants"
  on public.collaborations for select to authenticated
  using (public.is_collaboration_participant(id));

drop policy if exists "collaboration participants read" on public.collaboration_participants;
create policy "collaboration participants read"
  on public.collaboration_participants for select to authenticated
  using (public.is_collaboration_participant(collaboration_id));

drop policy if exists "collaboration confirm self" on public.collaboration_participants;
create policy "collaboration confirm self"
  on public.collaboration_participants for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.collaborations, public.collaboration_participants from anon, authenticated;
grant select on public.collaborations to authenticated;
grant select on public.collaboration_participants to authenticated;
grant update (confirmed) on public.collaboration_participants to authenticated;

create or replace function public.create_collaboration(
  title text,
  description text,
  year text,
  participant_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  pid uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.collaborations (title, description, year, created_by)
  values (title, coalesce(description, ''), coalesce(year, ''), auth.uid())
  returning id into cid;

  for pid in
    select distinct unnest(array_append(coalesce(participant_ids, '{}'::uuid[]), auth.uid()))
  loop
    if exists (select 1 from public.profiles where id = pid) then
      insert into public.collaboration_participants (collaboration_id, user_id, confirmed)
      values (cid, pid, pid = auth.uid())
      on conflict do nothing;
    end if;
  end loop;

  return cid;
end;
$$;

grant execute on function public.create_collaboration(text, text, text, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Moderação e privacidade
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('user', 'post', 'comment', 'story', 'club')),
  target_id uuid not null,
  category text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "reports read admin" on public.reports;
create policy "reports read admin"
  on public.reports for select to authenticated
  using (public.is_admin());

drop policy if exists "reports update admin" on public.reports;
create policy "reports update admin"
  on public.reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.reports from anon, authenticated;
grant insert on public.reports to authenticated;
grant select on public.reports to authenticated;
grant update (status) on public.reports to authenticated;

-- ---------------------------------------------------------------------------
-- NetMach
-- ---------------------------------------------------------------------------

create table if not exists public.match_interests (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  constraint match_interests_not_self check (from_id <> to_id)
);

create table if not exists public.match_passes (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  constraint match_passes_not_self check (from_id <> to_id)
);

alter table public.match_interests enable row level security;
alter table public.match_passes enable row level security;

drop policy if exists "match interests own read" on public.match_interests;
create policy "match interests own read"
  on public.match_interests for select to authenticated
  using (auth.uid() in (from_id, to_id));

drop policy if exists "match interest self" on public.match_interests;
create policy "match interest self"
  on public.match_interests for insert to authenticated
  with check (auth.uid() = from_id);

drop policy if exists "match passes own" on public.match_passes;
create policy "match passes own"
  on public.match_passes for select to authenticated
  using (auth.uid() = from_id);

drop policy if exists "match pass self" on public.match_passes;
create policy "match pass self"
  on public.match_passes for insert to authenticated
  with check (auth.uid() = from_id);

revoke all on public.match_interests, public.match_passes from anon, authenticated;
grant select, insert on public.match_interests, public.match_passes to authenticated;

-- ---------------------------------------------------------------------------
-- Monetização
-- ---------------------------------------------------------------------------

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'story')),
  target_id uuid not null,
  budget numeric(12, 2) not null check (budget > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  views integer not null default 0,
  interactions integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.promotions enable row level security;

drop policy if exists "promotions own read" on public.promotions;
create policy "promotions own read"
  on public.promotions for select to authenticated
  using (auth.uid() = owner_id or public.is_admin());

drop policy if exists "promotions own insert" on public.promotions;
create policy "promotions own insert"
  on public.promotions for insert to authenticated
  with check (auth.uid() = owner_id);

revoke all on public.promotions from anon, authenticated;
grant select, insert on public.promotions to authenticated;

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  skills text[] not null default '{}',
  goals text[] not null default '{}',
  experience text not null default 'any'
    check (experience in ('any', 'beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

alter table public.saved_searches enable row level security;

drop policy if exists "saved searches own read" on public.saved_searches;
create policy "saved searches own read"
  on public.saved_searches for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "saved searches own insert" on public.saved_searches;
create policy "saved searches own insert"
  on public.saved_searches for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "saved searches own delete" on public.saved_searches;
create policy "saved searches own delete"
  on public.saved_searches for delete to authenticated
  using (auth.uid() = user_id);

revoke all on public.saved_searches from anon, authenticated;
grant select, insert, delete on public.saved_searches to authenticated;

-- ---------------------------------------------------------------------------
-- Canal Oficial (somente conteúdo editorial; cotações/notícias vêm de provedor)
-- ---------------------------------------------------------------------------

create table if not exists public.official_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.official_announcements enable row level security;

drop policy if exists "announcements readable" on public.official_announcements;
create policy "announcements readable"
  on public.official_announcements for select to authenticated using (true);

drop policy if exists "announcements admin write" on public.official_announcements;
create policy "announcements admin write"
  on public.official_announcements for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.official_announcements from anon, authenticated;
grant select, insert, update, delete on public.official_announcements to authenticated;

-- ---------------------------------------------------------------------------
-- Trigger de criação de perfil
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix integer := 0;
begin
  base := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email, ''), '@', 1), 'membro'),
    '[^a-z0-9._]', '', 'g'
  ));
  if length(base) < 3 then
    base := 'membro';
  end if;
  base := left(base, 24);
  candidate := base;

  while exists (select 1 from public.profiles where lower(username) = candidate) loop
    suffix := suffix + 1;
    candidate := left(base, 24) || suffix::text;
  end loop;

  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Membro'
    ),
    candidate,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, tier, status, started_at)
  values (new.id, 'free', 'active', now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Notificações automáticas
-- ---------------------------------------------------------------------------

create or replace function public.notify_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, kind, entity_id)
    values (owner, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_like on public.post_likes;
create trigger trg_notify_like
  after insert on public.post_likes
  for each row execute function public.notify_like();

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, actor_id, kind, entity_id)
    values (owner, new.author_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment
  after insert on public.comments
  for each row execute function public.notify_comment();

create or replace function public.notify_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists trg_notify_connection on public.connections;
create trigger trg_notify_connection
  after insert or update of status on public.connections
  for each row execute function public.notify_connection();

create or replace function public.notify_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, kind, entity_id)
  select m.user_id, new.sender_id, 'message', new.conversation_id
  from public.conversation_members m
  where m.conversation_id = new.conversation_id
    and m.user_id <> new.sender_id;
  return new;
end;
$$;

drop trigger if exists trg_notify_message on public.messages;
create trigger trg_notify_message
  after insert on public.messages
  for each row execute function public.notify_message();

create or replace function public.notify_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.match_interests
    where from_id = new.to_id and to_id = new.from_id
  ) then
    insert into public.notifications (user_id, actor_id, kind, entity_id)
    values
      (new.to_id, new.from_id, 'match', new.from_id),
      (new.from_id, new.to_id, 'match', new.to_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_match on public.match_interests;
create trigger trg_notify_match
  after insert on public.match_interests
  for each row execute function public.notify_match();

create or replace function public.notify_recommendation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, kind, entity_id)
  values (new.target_id, new.author_id, 'recommendation', new.id);
  return new;
end;
$$;

drop trigger if exists trg_notify_recommendation on public.recommendations;
create trigger trg_notify_recommendation
  after insert on public.recommendations
  for each row execute function public.notify_recommendation();

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('portfolio', 'portfolio', true),
  ('stories', 'stories', true)
on conflict (id) do nothing;

drop policy if exists "netclub avatars read" on storage.objects;
create policy "netclub avatars read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "netclub avatars write" on storage.objects;
create policy "netclub avatars write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "netclub avatars update" on storage.objects;
create policy "netclub avatars update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "netclub avatars delete" on storage.objects;
create policy "netclub avatars delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "netclub portfolio read" on storage.objects;
create policy "netclub portfolio read"
  on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "netclub portfolio write" on storage.objects;
create policy "netclub portfolio write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "netclub portfolio delete" on storage.objects;
create policy "netclub portfolio delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "netclub stories read" on storage.objects;
create policy "netclub stories read"
  on storage.objects for select
  using (bucket_id = 'stories');

drop policy if exists "netclub stories write" on storage.objects;
create policy "netclub stories write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "netclub stories delete" on storage.objects;
create policy "netclub stories delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Grants para service_role (server-side apenas)
-- ---------------------------------------------------------------------------

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

commit;
