-- Birthday 2026: everything new in one go. Reactions, one-liners on cards, "talk to me about",
-- your own card photo, and the Tianlai toy (cake / drinks).
-- Paste into Supabase > SQL Editor and Run. Safe to run more than once. Existing sign-ups and cards are kept.

-- ---------- sign-up: "talk to me about" (shown on your card) ----------
alter table bday_rsvp add column if not exists talk text not null default '';

create or replace function bday_rsvp_save3(p_name text, p_arrive text, p_mode text, p_diet text, p_role text, p_dish text, p_talk text)
returns void language sql security definer set search_path = public as $$
  insert into bday_rsvp (name, arrive, mode, diet, role, dish, talk, updated_at)
  values (left(trim(p_name), 24), p_arrive, p_mode, left(coalesce(p_diet, ''), 200),
          case when p_role in ('chef', 'helper') then p_role else '' end, left(coalesce(p_dish, ''), 40),
          left(trim(coalesce(p_talk, '')), 40), now())
  on conflict (name) do update
    set arrive = excluded.arrive, mode = excluded.mode, diet = excluded.diet,
        role = excluded.role, dish = excluded.dish, talk = excluded.talk, updated_at = now();
$$;

create or replace function bday_rsvp_list3()
returns table (name text, arrive text, mode text, role text, talk text)
language sql security definer set search_path = public as $$
  select name, arrive, mode, role, talk from bday_rsvp order by updated_at;
$$;

-- A card exists for everyone who signed up and for everyone the host added.
create or replace function bday_known(p_name text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from bday_rsvp where name = p_name) or exists (select 1 from bday_guest where name = p_name);
$$;

-- ---------- your own card photo ----------
create or replace function bday_card_photo(p_name text, p_photo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not bday_known(p_name) then raise exception 'unknown guest'; end if;
  if p_photo is null or char_length(p_photo) > 400000 or p_photo !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' then
    raise exception 'bad photo';
  end if;
  insert into bday_guest (name, photo) values (p_name, p_photo)
  on conflict (name) do update set photo = excluded.photo;
end $$;

-- ---------- emoji reactions on cards ----------
create table if not exists bday_react (
  guest text not null,
  emoji text not null check (emoji in ('like', 'lol', 'love')),
  who text not null check (char_length(who) between 1 and 24),
  at timestamptz not null default now(),
  primary key (guest, emoji, who)
);
alter table bday_react enable row level security;

create or replace function bday_react_toggle(p_guest text, p_emoji text, p_who text)
returns void language plpgsql security definer set search_path = public as $$
declare w text := left(trim(coalesce(p_who, '')), 24);
begin
  if w = '' then raise exception 'name needed'; end if;
  if not bday_known(p_guest) then raise exception 'unknown guest'; end if;
  delete from bday_react where guest = p_guest and emoji = p_emoji and who = w;
  if not found then
    insert into bday_react (guest, emoji, who) values (p_guest, p_emoji, w);
  end if;
end $$;

create or replace function bday_react_list()
returns table (guest text, emoji text, who text)
language sql security definer set search_path = public as $$
  select guest, emoji, who from bday_react order by at;
$$;

-- ---------- one-liners friends leave on a card (signed or anonymous) ----------
create table if not exists bday_note (
  id bigint generated always as identity primary key,
  guest text not null,
  body text not null check (char_length(body) between 1 and 80),
  who text not null default '',
  at timestamptz not null default now()
);
alter table bday_note enable row level security;

create or replace function bday_note_add(p_guest text, p_body text, p_who text)
returns void language plpgsql security definer set search_path = public as $$
declare b text := left(trim(coalesce(p_body, '')), 80);
begin
  if b = '' then raise exception 'empty'; end if;
  if not bday_known(p_guest) then raise exception 'unknown guest'; end if;
  if (select count(*) from bday_note where guest = p_guest) >= 40 then raise exception 'card full'; end if;
  insert into bday_note (guest, body, who) values (p_guest, b, left(trim(coalesce(p_who, '')), 24));
end $$;

create or replace function bday_notes_list()
returns table (id bigint, guest text, body text, who text)
language sql security definer set search_path = public as $$
  select id, guest, body, who from bday_note order by id;
$$;

create or replace function bday_admin_note_delete(p_pass text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  delete from bday_note where id = p_id;
end $$;

-- ---------- back office: rename a guest everywhere ----------
create or replace function bday_admin_rename(p_pass text, p_old text, p_new text)
returns void language plpgsql security definer set search_path = public as $$
declare n text := left(trim(coalesce(p_new, '')), 24);
begin
  perform bday_admin_check(p_pass);
  if n = '' then raise exception 'name needed'; end if;
  if n = p_old then return; end if;
  if bday_known(n) then raise exception 'name taken'; end if;
  update bday_rsvp set name = n where name = p_old;
  update bday_guest set name = n where name = p_old;
  update bday_react set guest = n where guest = p_old;
  update bday_note set guest = n where guest = p_old;
end $$;

-- ---------- the Tianlai toy: cake in the face, drinks ----------
create table if not exists bday_poke (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('cake', 'drink')),
  who text not null default '',
  at timestamptz not null default now()
);
alter table bday_poke enable row level security;
create index if not exists bday_poke_at on bday_poke (at);

-- recent = drinks in the last 30 minutes. At 8 he is out on the sofa until some of them age out.
-- The host's own taps (name Tianlai) are left out of every count and of the board.
create or replace function bday_poke_state()
returns jsonb language sql security definer set search_path = public as $$
  with p as (select * from bday_poke where lower(who) <> 'tianlai')
  select jsonb_build_object(
    'cakes', (select count(*) from p where kind = 'cake'),
    'drinks', (select count(*) from p where kind = 'drink'),
    'recent', (select count(*) from p where kind = 'drink' and at > now() - interval '30 minutes'),
    'top', (select coalesce(jsonb_agg(jsonb_build_object('who', t.who, 'n', t.n)), '[]'::jsonb)
            from (select who, count(*) as n, min(at) as first from p where kind = 'drink' and who <> ''
                  group by who order by count(*) desc, min(at) limit 3) t),
    'last', (select jsonb_build_object('kind', kind, 'who', who) from p order by id desc limit 1));
$$;

-- Each person: at most 2 drinks per 30 minutes, so nobody takes every round. The host's own taps are not recorded.
create or replace function bday_poke_add(p_kind text, p_who text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w text := left(trim(coalesce(p_who, '')), 24);
begin
  if p_kind not in ('cake', 'drink') then raise exception 'bad kind'; end if;
  if lower(w) = 'tianlai' then return bday_poke_state(); end if;
  if p_kind = 'cake' then
    insert into bday_poke (kind, who) values ('cake', w);
  else
    if w = '' then raise exception 'name needed'; end if;
    if (select count(*) from bday_poke where kind = 'drink' and lower(who) <> 'tianlai' and at > now() - interval '30 minutes') >= 8 then
      return bday_poke_state() || jsonb_build_object('refused', 'sofa');
    end if;
    if (select count(*) from bday_poke where kind = 'drink' and who = w and at > now() - interval '30 minutes') >= 2 then
      return bday_poke_state() || jsonb_build_object('refused', 'slow');
    end if;
    insert into bday_poke (kind, who) values ('drink', w);
  end if;
  return bday_poke_state();
end $$;

revoke all on function bday_rsvp_save3(text, text, text, text, text, text, text), bday_rsvp_list3(), bday_known(text),
  bday_card_photo(text, text), bday_react_toggle(text, text, text), bday_react_list(),
  bday_note_add(text, text, text), bday_notes_list(), bday_admin_note_delete(text, bigint), bday_admin_rename(text, text, text),
  bday_poke_state(), bday_poke_add(text, text) from public;
grant execute on function bday_rsvp_save3(text, text, text, text, text, text, text), bday_rsvp_list3(),
  bday_card_photo(text, text), bday_react_toggle(text, text, text), bday_react_list(),
  bday_note_add(text, text, text), bday_notes_list(), bday_admin_note_delete(text, bigint), bday_admin_rename(text, text, text),
  bday_poke_state(), bday_poke_add(text, text) to anon, authenticated;
