-- Birthday 2026, step 2: kitchen question, kitchen teams, and the host-only back office.
-- Paste into Supabase > SQL Editor and Run. Safe to run more than once.

alter table bday_rsvp add column if not exists role text not null default '';
alter table bday_rsvp add column if not exists dish text not null default '';

create table if not exists bday_admin (
  id int primary key default 1 check (id = 1),
  pass text not null default '',
  teams jsonb not null default '[]'::jsonb
);
alter table bday_admin enable row level security;
insert into bday_admin (id) values (1) on conflict (id) do nothing;

-- Sign-up with the kitchen question.
create or replace function bday_rsvp_save2(p_name text, p_arrive text, p_mode text, p_diet text, p_role text, p_dish text)
returns void language sql security definer set search_path = public as $$
  insert into bday_rsvp (name, arrive, mode, diet, role, dish, updated_at)
  values (left(trim(p_name), 24), p_arrive, p_mode, left(coalesce(p_diet, ''), 200),
          case when p_role in ('chef', 'helper') then p_role else '' end, left(coalesce(p_dish, ''), 40), now())
  on conflict (name) do update
    set arrive = excluded.arrive, mode = excluded.mode, diet = excluded.diet,
        role = excluded.role, dish = excluded.dish, updated_at = now();
$$;

-- Public list. Still no diet notes.
create or replace function bday_rsvp_list2()
returns table (name text, arrive text, mode text, role text)
language sql security definer set search_path = public as $$
  select name, arrive, mode, role from bday_rsvp order by updated_at;
$$;

create or replace function bday_teams_get()
returns jsonb language sql security definer set search_path = public as $$
  select teams from bday_admin where id = 1;
$$;

-- Host-only functions. They work only with the passcode you set at the bottom of this file.
create or replace function bday_admin_check(p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from bday_admin where id = 1 and char_length(pass) >= 6 and pass = p_pass) then
    perform pg_sleep(1);
    raise exception 'bad passcode';
  end if;
end $$;

create or replace function bday_admin_list(p_pass text)
returns table (name text, arrive text, mode text, role text, dish text, diet text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  return query select r.name, r.arrive, r.mode, r.role, r.dish, r.diet, r.updated_at from bday_rsvp r order by r.updated_at;
end $$;

create or replace function bday_admin_delete(p_pass text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  delete from bday_rsvp where name = p_name;
end $$;

create or replace function bday_admin_set_teams(p_pass text, p_teams jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  update bday_admin set teams = coalesce(p_teams, '[]'::jsonb) where id = 1;
end $$;

revoke all on function bday_rsvp_save2(text, text, text, text, text, text), bday_rsvp_list2(), bday_teams_get(),
  bday_admin_check(text), bday_admin_list(text), bday_admin_delete(text, text), bday_admin_set_teams(text, jsonb) from public;
grant execute on function bday_rsvp_save2(text, text, text, text, text, text), bday_rsvp_list2(), bday_teams_get(),
  bday_admin_list(text), bday_admin_delete(text, text), bday_admin_set_teams(text, jsonb) to anon, authenticated;

-- LAST STEP: pick your own back-office passcode (6 characters or more), put it between the quotes, then Run.
-- update bday_admin set pass = 'your-passcode-here' where id = 1;
