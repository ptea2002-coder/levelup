-- LevelUP LFG & Squad system. Additive production-ready migration; RLS is enabled on both tables.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null constraint squads_owner_id_fkey references public.profiles(id) on delete cascade,
  game_id uuid not null constraint squads_game_id_fkey references public.games(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 5 and 80),
  description text not null default '' check (char_length(description) <= 600),
  platform text not null check (platform in ('PC','Mobile','PlayStation','Xbox','Cross-platform')),
  region text not null check (region in ('Vietnam','Southeast Asia','Asia','North America','Europe')),
  rank_label text not null default 'Mọi rank' check (rank_label in ('Mọi rank','Mới chơi','Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant','Unranked')),
  max_members smallint not null default 5 check (max_members between 2 and 8),
  voice_chat boolean not null default false,
  scheduled_at timestamptz,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.squad_memberships (
  squad_id uuid not null constraint squad_memberships_squad_id_fkey references public.squads(id) on delete cascade,
  user_id uuid not null constraint squad_memberships_user_id_fkey references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','left')),
  role text not null default 'member' check (role in ('leader','member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (squad_id,user_id)
);
create index if not exists squads_browse_idx on public.squads(status,created_at desc);
create index if not exists squads_owner_idx on public.squads(owner_id,created_at desc);
create index if not exists squads_game_idx on public.squads(game_id,status);
create index if not exists squad_memberships_user_idx on public.squad_memberships(user_id,status,created_at desc);
create index if not exists squad_memberships_squad_status_idx on public.squad_memberships(squad_id,status);
alter table public.squads enable row level security;
alter table public.squad_memberships enable row level security;

drop policy if exists "Anyone can discover open squads" on public.squads;
create policy "Anyone can discover open squads" on public.squads for select to anon,authenticated using (status='open' or owner_id=(select auth.uid()));
drop policy if exists "Players create their own squads" on public.squads;
create policy "Players create their own squads" on public.squads for insert to authenticated with check (owner_id=(select auth.uid()) and status='open');
drop policy if exists "Owners manage their squads" on public.squads;
create policy "Owners manage their squads" on public.squads for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
drop policy if exists "Owners delete their squads" on public.squads;
create policy "Owners delete their squads" on public.squads for delete to authenticated using (owner_id=(select auth.uid()));

drop policy if exists "Public sees accepted roster of open squads" on public.squad_memberships;
create policy "Public sees accepted roster of open squads" on public.squad_memberships for select to anon,authenticated
using (status='accepted' and exists(select 1 from public.squads s where s.id=squad_id and s.status='open'));
drop policy if exists "Participants and hosts read membership requests" on public.squad_memberships;
create policy "Participants and hosts read membership requests" on public.squad_memberships for select to authenticated
using (user_id=(select auth.uid()) or exists(select 1 from public.squads s where s.id=squad_id and s.owner_id=(select auth.uid())));
drop policy if exists "Players request to join open squads" on public.squad_memberships;
create policy "Players request to join open squads" on public.squad_memberships for insert to authenticated with check (
  user_id=(select auth.uid()) and role='member' and status='pending'
  and exists(select 1 from public.squads s where s.id=squad_id and s.owner_id<>(select auth.uid()) and s.status='open')
);
drop policy if exists "Players manage their own membership request" on public.squad_memberships;
create policy "Players manage their own membership request" on public.squad_memberships for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and role='member' and status in ('pending','left'));
drop policy if exists "Squad owners review membership requests" on public.squad_memberships;
create policy "Squad owners review membership requests" on public.squad_memberships for update to authenticated
using (exists(select 1 from public.squads s where s.id=squad_id and s.owner_id=(select auth.uid())))
with check (role='member' and status in ('accepted','rejected','left') and exists(select 1 from public.squads s where s.id=squad_id and s.owner_id=(select auth.uid())));

create or replace function private.set_squad_updated_at() returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at:=pg_catalog.now(); return new; end; $$;
revoke all on function private.set_squad_updated_at() from public,anon,authenticated;
create or replace function private.add_squad_leader() returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.squad_memberships(squad_id,user_id,status,role) values(new.id,new.owner_id,'accepted','leader')
  on conflict(squad_id,user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.add_squad_leader() from public,anon,authenticated;
create or replace function private.enforce_squad_capacity() returns trigger language plpgsql security definer set search_path=''
as $$
declare room_status text; capacity integer; accepted_count integer;
begin
  if new.status not in ('pending','accepted') then return new; end if;
  select s.status,s.max_members into room_status,capacity from public.squads s where s.id=new.squad_id for update;
  if room_status is null or room_status<>'open' then raise exception using errcode='23514',message='SQUAD_NOT_OPEN'; end if;
  select count(*)::integer into accepted_count from public.squad_memberships m where m.squad_id=new.squad_id and m.status='accepted' and m.user_id<>new.user_id;
  if accepted_count>=capacity then raise exception using errcode='23514',message='SQUAD_FULL'; end if;
  return new;
end;
$$;
revoke all on function private.enforce_squad_capacity() from public,anon,authenticated;
create or replace function private.enforce_squad_size_not_below_roster() returns trigger language plpgsql security definer set search_path=''
as $$
declare accepted_count integer;
begin
  if new.max_members<old.max_members then
    select count(*)::integer into accepted_count from public.squad_memberships m where m.squad_id=new.id and m.status='accepted';
    if accepted_count>new.max_members then raise exception using errcode='23514',message='SQUAD_SIZE_BELOW_ROSTER'; end if;
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_squad_size_not_below_roster() from public,anon,authenticated;
drop trigger if exists squads_set_updated_at on public.squads;
create trigger squads_set_updated_at before update on public.squads for each row execute function private.set_squad_updated_at();
drop trigger if exists squad_memberships_set_updated_at on public.squad_memberships;
create trigger squad_memberships_set_updated_at before update on public.squad_memberships for each row execute function private.set_squad_updated_at();
drop trigger if exists squads_add_leader on public.squads;
create trigger squads_add_leader after insert on public.squads for each row execute function private.add_squad_leader();
drop trigger if exists squad_memberships_enforce_capacity on public.squad_memberships;
create trigger squad_memberships_enforce_capacity before insert or update of status on public.squad_memberships for each row execute function private.enforce_squad_capacity();
drop trigger if exists squads_enforce_size_not_below_roster on public.squads;
create trigger squads_enforce_size_not_below_roster before update of max_members on public.squads for each row execute function private.enforce_squad_size_not_below_roster();
grant select on public.squads to anon,authenticated;
grant insert,delete on public.squads to authenticated;
grant update(title,description,platform,region,rank_label,max_members,voice_chat,scheduled_at,status) on public.squads to authenticated;
grant select on public.squad_memberships to anon,authenticated;
grant insert on public.squad_memberships to authenticated;
grant update(status) on public.squad_memberships to authenticated;

notify pgrst, 'reload schema';
