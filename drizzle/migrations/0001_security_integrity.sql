-- NetClub — correções de segurança e integridade
-- Idempotente: pode ser reaplicada sem erro.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) connections: o destinatário só pode aceitar/recusar, não reescrever a linha
-- ─────────────────────────────────────────────────────────────────────────────
-- A policy original tinha USING sem WITH CHECK, então um PATCH podia alterar
-- requester_id / addressee_id da própria linha.
drop policy if exists "conn accept" on public.connections;
create policy "conn accept" on public.connections
  for update to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- Reforço no nível de coluna: apenas `status` é atualizável pelo cliente.
revoke update on public.connections from authenticated;
grant update (status) on public.connections to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) connections: impede convites duplicados (A→B e B→A simultâneos)
-- ─────────────────────────────────────────────────────────────────────────────
-- A constraint UNIQUE original é direcional, então A→B e B→A podiam coexistir.
-- Remove duplicatas pré-existentes mantendo a linha mais antiga.
delete from public.connections c
using public.connections d
where c.ctid < d.ctid
  and least(c.requester_id, c.addressee_id) = least(d.requester_id, d.addressee_id)
  and greatest(c.requester_id, c.addressee_id) = greatest(d.requester_id, d.addressee_id);

create unique index if not exists connections_unique_pair
  on public.connections (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index if not exists connections_addressee_idx
  on public.connections (addressee_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) profiles: WITH CHECK explícito na atualização
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) notifications: o usuário só pode marcar como lida
-- ─────────────────────────────────────────────────────────────────────────────
-- Sem restrição de coluna, o dono podia reescrever `kind`, `post_id` ou `actor_id`.
drop policy if exists "notif mark read" on public.notifications;
create policy "notif mark read" on public.notifications
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) Índices para as consultas quentes do app
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists posts_created_at_idx
  on public.posts (created_at desc);

create index if not exists posts_author_idx
  on public.posts (author_id, created_at desc);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at);

create index if not exists post_likes_user_idx
  on public.post_likes (user_id);

create index if not exists post_saves_user_idx
  on public.post_saves (user_id);

create index if not exists group_members_user_idx
  on public.group_members (user_id);
