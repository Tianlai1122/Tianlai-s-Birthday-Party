-- Birthday 2026: sign-up list and scoreboard.
-- Paste this whole file into Supabase > SQL Editor and press Run. Safe to run more than once.

create table if not exists bday_rsvp (
  name text primary key check (char_length(name) between 1 and 24),
  arrive text not null check (arrive in ('14','16','1930','21')),
  mode text not null check (mode in ('dodge','sip','all','sleep')),
  diet text not null default '',
  updated_at timestamptz not null default now()
);
create table if not exists bday_board (
  board text not null check (board in ('drinks','dodges','snacks')),
  name text not null check (char_length(name) between 1 and 24),
  n int not null default 0,
  primary key (board, name)
);

-- Nobody can read or write the tables directly from the web page.
alter table bday_rsvp enable row level security;
alter table bday_board enable row level security;

-- The page can only call these four functions.
create or replace function bday_rsvp_save(p_name text, p_arrive text, p_mode text, p_diet text)
returns void language sql security definer set search_path = public as $$
  insert into bday_rsvp (name, arrive, mode, diet, updated_at)
  values (left(trim(p_name), 24), p_arrive, p_mode, left(coalesce(p_diet, ''), 200), now())
  on conflict (name) do update
    set arrive = excluded.arrive, mode = excluded.mode, diet = excluded.diet, updated_at = now();
$$;

-- Public list: name, arrival and drinking plan. The diet note is left out on purpose.
create or replace function bday_rsvp_list()
returns table (name text, arrive text, mode text)
language sql security definer set search_path = public as $$
  select name, arrive, mode from bday_rsvp order by updated_at;
$$;

create or replace function bday_board_add(p_board text, p_name text, p_delta int)
returns void language sql security definer set search_path = public as $$
  insert into bday_board (board, name, n)
  values (p_board, left(trim(p_name), 24), case when p_delta > 0 then 1 else 0 end)
  on conflict (board, name) do update
    set n = greatest(bday_board.n + case when p_delta > 0 then 1 else -1 end, 0);
$$;

create or replace function bday_board_get()
returns table (board text, name text, n int)
language sql security definer set search_path = public as $$
  select board, name, n from bday_board where n > 0;
$$;

revoke all on function bday_rsvp_save(text, text, text, text), bday_rsvp_list(), bday_board_add(text, text, int), bday_board_get() from public;
grant execute on function bday_rsvp_save(text, text, text, text), bday_rsvp_list(), bday_board_add(text, text, int), bday_board_get() to anon, authenticated;
