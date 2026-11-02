-- NetClub — endurecimento do MVP
-- Idempotente. Complementa 20261102000000_netclub_mvp.sql com:
--   * bloqueio bidirecional aplicado nas policies de conteúdo;
--   * RPC atômica para bloquear usuário (remove conexões e matches);
--   * limite diário do NetMach validado no banco;
--   * busca salva restrita a assinantes Premium.

begin;

-- ---------------------------------------------------------------------------
-- Bloqueios
-- ---------------------------------------------------------------------------

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if a is null or b is null then
    return false;
  end if;
  return exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
end;
$$;

grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

drop policy if exists "posts readable" on public.posts;
create policy "posts readable"
  on public.posts for select to authenticated
  using (
    (not hidden or public.is_admin())
    and not public.is_blocked_between(auth.uid(), author_id)
  );

drop policy if exists "comments readable" on public.comments;
create policy "comments readable"
  on public.comments for select to authenticated
  using (not public.is_blocked_between(auth.uid(), author_id));

drop policy if exists "stories readable" on public.stories;
create policy "stories readable"
  on public.stories for select to authenticated
  using (
    expires_at > now()
    and not public.is_blocked_between(auth.uid(), author_id)
  );

create or replace function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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

  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), target)
  on conflict (blocker_id, blocked_id) do nothing;

  delete from public.connections
  where (requester_id = auth.uid() and addressee_id = target)
     or (requester_id = target and addressee_id = auth.uid());

  delete from public.match_interests
  where (from_id = auth.uid() and to_id = target)
     or (from_id = target and to_id = auth.uid());

  delete from public.match_passes
  where (from_id = auth.uid() and to_id = target)
     or (from_id = target and to_id = auth.uid());
end;
$$;

grant execute on function public.block_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- NetMach: bloqueio + limite diário no banco (não só na UI)
-- ---------------------------------------------------------------------------

create or replace function public.enforce_match_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  if public.is_blocked_between(new.from_id, new.to_id) then
    raise exception 'blocked';
  end if;

  select count(*) into used
  from public.match_interests
  where from_id = new.from_id
    and created_at >= date_trunc('day', now());

  if used >= 10 then
    raise exception 'daily_limit';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_match_rules on public.match_interests;
create trigger trg_enforce_match_rules
  before insert on public.match_interests
  for each row execute function public.enforce_match_rules();

-- ---------------------------------------------------------------------------
-- Busca salva é benefício Premium (a UI também avisa antes de tentar)
-- ---------------------------------------------------------------------------

drop policy if exists "saved searches own insert" on public.saved_searches;
create policy "saved searches own insert"
  on public.saved_searches for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions s
      where s.user_id = auth.uid()
        and s.tier = 'premium'
        and s.status = 'active'
    )
  );

commit;
