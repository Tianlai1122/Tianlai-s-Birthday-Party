-- Birthday 2026: everything added since the first big script, in one file.
-- Card photo albums and deleting photos, both boards, no limit on drinks, anonymous taps kept off the boards,
-- and sign-ups that save themselves.
-- Paste into Supabase > SQL Editor and Run. Nothing is deleted. Safe to run more than once,
-- and fine to run even if you already ran an earlier version of this file or one of the smaller ones.

-- recent = drinks in the last 30 minutes. At 12 he is out on the sofa until some of them age out.
-- The host's own taps (name Tianlai) are left out of every count and of the board.
create or replace function bday_poke_state()
returns jsonb language sql security definer set search_path = public as $$
  with p as (select * from bday_poke where lower(who) <> 'tianlai')
  select jsonb_build_object(
    'cakes', (select count(*) from p where kind = 'cake'),
    'drinks', (select count(*) from p where kind = 'drink'),
    'recent', (select count(*) from p where kind = 'drink' and at > now() - interval '30 minutes'),
    'top', (select coalesce(jsonb_agg(jsonb_build_object('who', t.who, 'n', t.n)), '[]'::jsonb)
            from (select who, count(*) as n, min(at) as first from p where kind = 'drink' and who <> '' and who not like '~%'
                  group by who order by count(*) desc, min(at) limit 3) t),
    'ctop', (select coalesce(jsonb_agg(jsonb_build_object('who', t.who, 'n', t.n)), '[]'::jsonb)
             from (select who, count(*) as n, min(at) as first from p where kind = 'cake' and who <> '' and who not like '~%'
                   group by who order by count(*) desc, min(at) limit 3) t),
    'last', (select jsonb_build_object('kind', kind, 'who', who) from p order by id desc limit 1),
    'sofa_at', 12, 'per_person', 0);
$$;

-- No limit on drinks: anyone can keep going, even while he is out on the sofa. The host's own taps are not recorded.
create or replace function bday_poke_add(p_kind text, p_who text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w text := left(trim(coalesce(p_who, '')), 24);
begin
  if p_kind not in ('cake', 'drink') then raise exception 'bad kind'; end if;
  if lower(w) = 'tianlai' then return bday_poke_state(); end if;
  if p_kind = 'drink' and w = '' then raise exception 'name needed'; end if;
  insert into bday_poke (kind, who) values (p_kind, w);
  return bday_poke_state();
end $$;

-- ---------- anyone can add a card for a friend who is coming (name only; the host can remove it) ----------
create or replace function bday_card_add(p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare n text := left(trim(coalesce(p_name, '')), 24);
begin
  if n = '' then raise exception 'name needed'; end if;
  if bday_known(n) then return; end if;
  if (select count(*) from bday_guest) >= 80 then raise exception 'full'; end if;
  insert into bday_guest (name) values (n);
end $$;
revoke all on function bday_card_add(text) from public;
grant execute on function bday_card_add(text) to anon, authenticated;

-- ---------- photos anyone can add to a card (besides the cover photo) ----------
create table if not exists bday_pic (
  id bigint generated always as identity primary key,
  guest text not null,
  photo text not null,
  who text not null default '',
  at timestamptz not null default now()
);
alter table bday_pic enable row level security;
create index if not exists bday_pic_guest on bday_pic (guest);

create or replace function bday_pic_add(p_guest text, p_photo text, p_who text)
returns bigint language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  if not bday_known(p_guest) then raise exception 'unknown guest'; end if;
  if p_photo is null or char_length(p_photo) > 500000 or p_photo !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' then
    raise exception 'bad photo';
  end if;
  if (select count(*) from bday_pic where guest = p_guest) >= 12 then raise exception 'card full'; end if;
  if (select count(*) from bday_pic) >= 300 then raise exception 'album full'; end if;
  insert into bday_pic (guest, photo, who) values (p_guest, p_photo, left(trim(coalesce(p_who, '')), 24)) returning id into new_id;
  return new_id;
end $$;

create or replace function bday_pics_list(p_guest text)
returns table (id bigint, photo text, who text)
language sql security definer set search_path = public as $$
  select id, photo, who from bday_pic where guest = p_guest order by id;
$$;

create or replace function bday_pics_count()
returns table (guest text, n bigint)
language sql security definer set search_path = public as $$
  select guest, count(*) from bday_pic group by guest;
$$;

create or replace function bday_admin_pic_delete(p_pass text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  delete from bday_pic where id = p_id;
end $$;

-- renaming a guest now carries their photos along too
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
  update bday_pic set guest = n where guest = p_old;
end $$;

revoke all on function bday_pic_add(text, text, text), bday_pics_list(text), bday_pics_count(), bday_admin_pic_delete(text, bigint) from public;
grant execute on function bday_pic_add(text, text, text), bday_pics_list(text), bday_pics_count(), bday_admin_pic_delete(text, bigint) to anon, authenticated;

-- ---------- sign-ups save themselves as people fill them in ----------
-- Each browser keeps a private token, so an entry can be saved before it is finished, corrected later,
-- and even renamed, without leaving half-typed copies behind. Someone who comes back in another browser
-- and types the same name picks their entry up again; a null diet or dish means "leave what is there".
alter table bday_rsvp add column if not exists token text;
create unique index if not exists bday_rsvp_token on bday_rsvp (token) where token is not null;

-- unfinished entries have no arrival time or drinking plan yet
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.bday_rsvp'::regclass and contype = 'c'
             and (pg_get_constraintdef(oid) ilike '%arrive%' or pg_get_constraintdef(oid) ilike '%mode%')
  loop
    execute format('alter table public.bday_rsvp drop constraint %I', c);
  end loop;
end $$;
alter table bday_rsvp add constraint bday_rsvp_arrive_check check (arrive in ('', '14', '16', '1930', '21', 'remote'));
alter table bday_rsvp add constraint bday_rsvp_mode_check check (mode in ('', 'dodge', 'sip', 'all', 'sleep'));

create or replace function bday_rsvp_auto(p_token text, p_name text, p_arrive text, p_mode text, p_diet text, p_role text, p_dish text)
returns text language plpgsql security definer set search_path = public as $$
declare
  n text := left(trim(coalesce(p_name, '')), 24);
  tk text := left(coalesce(p_token, ''), 64);
  old text;
  full_entry boolean := coalesce(p_arrive, '') <> '' and coalesce(p_mode, '') <> '';
begin
  if n = '' then return ''; end if;
  if char_length(tk) < 16 then tk := null; end if;
  if tk is not null then
    select name into old from bday_rsvp where token = tk;
    if old is not null and old <> n then
      if bday_known(n) then
        delete from bday_rsvp where token = tk;          -- that name is already signed up: this entry joins it
      else
        update bday_rsvp set name = n where token = tk;  -- same person fixing their name: everything follows
        update bday_guest set name = n where name = old;
        update bday_react set guest = n where guest = old;
        update bday_note set guest = n where guest = old;
        update bday_pic set guest = n where guest = old;
      end if;
    end if;
  end if;
  insert into bday_rsvp as r (name, arrive, mode, diet, role, dish, token, updated_at)
  values (n, coalesce(p_arrive, ''), coalesce(p_mode, ''), left(coalesce(p_diet, ''), 200),
          case when p_role in ('chef', 'helper') then p_role else '' end, left(coalesce(p_dish, ''), 40), tk, now())
  on conflict (name) do update
    set arrive = case when excluded.arrive <> '' then excluded.arrive else r.arrive end,
        mode = case when excluded.mode <> '' then excluded.mode else r.mode end,
        diet = case when p_diet is null then r.diet when full_entry or excluded.diet <> '' then excluded.diet else r.diet end,
        role = case when full_entry or excluded.role <> '' then excluded.role else r.role end,
        dish = case when p_dish is null then r.dish when full_entry or excluded.dish <> '' then excluded.dish else r.dish end,
        token = coalesce(excluded.token, r.token), updated_at = now();
  return n;
end $$;

revoke all on function bday_rsvp_auto(text, text, text, text, text, text, text) from public;
grant execute on function bday_rsvp_auto(text, text, text, text, text, text, text) to anon, authenticated;

-- ---------- deleting photos from the page ----------
-- An album photo can be removed by whoever added it or by the person whose card it is on.
create or replace function bday_pic_delete(p_id bigint, p_who text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_who, '') = '' then raise exception 'not yours'; end if;
  delete from bday_pic where id = p_id and (who = p_who or guest = p_who);
  if not found then raise exception 'not yours'; end if;
end $$;

-- Your own cover photo: '' takes it off again.
create or replace function bday_card_photo(p_name text, p_photo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not bday_known(p_name) then raise exception 'unknown guest'; end if;
  if p_photo is null or (p_photo <> '' and (char_length(p_photo) > 400000 or p_photo !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$')) then
    raise exception 'bad photo';
  end if;
  insert into bday_guest (name, photo) values (p_name, p_photo)
  on conflict (name) do update set photo = excluded.photo;
end $$;

revoke all on function bday_pic_delete(bigint, text) from public;
grant execute on function bday_pic_delete(bigint, text), bday_card_photo(text, text) to anon, authenticated;

-- ---------- a heart between two people, set by the host ----------
alter table bday_admin add column if not exists hearts jsonb not null default '[]'::jsonb;

create or replace function bday_hearts_get()
returns jsonb language sql security definer set search_path = public as $$
  select hearts from bday_admin where id = 1;
$$;

create or replace function bday_admin_set_hearts(p_pass text, p_hearts jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  update bday_admin set hearts = coalesce(p_hearts, '[]'::jsonb) where id = 1;
end $$;

-- ---------- the host can put a name on a note that was left unsigned (or correct one) ----------
create or replace function bday_admin_note_who(p_pass text, p_id bigint, p_who text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  update bday_note set who = left(trim(coalesce(p_who, '')), 24) where id = p_id;
end $$;

revoke all on function bday_hearts_get(), bday_admin_set_hearts(text, jsonb), bday_admin_note_who(text, bigint, text) from public;
grant execute on function bday_hearts_get(), bday_admin_set_hearts(text, jsonb), bday_admin_note_who(text, bigint, text) to anon, authenticated;

-- ---------- nationality: one or two flags next to a name ----------
-- Kept as region codes: 'CN', or 'CN,US'. '' takes the flag off.
alter table bday_guest add column if not exists flag text not null default '';

create or replace function bday_flags_get()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(name, flag), '{}'::jsonb) from bday_guest where flag <> '';
$$;

create or replace function bday_flag_set(p_name text, p_flag text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not bday_known(p_name) then raise exception 'unknown guest'; end if;
  if p_flag is null or p_flag !~ '^([A-Z]{2}(,[A-Z]{2})?)?$' then raise exception 'bad flag'; end if;
  insert into bday_guest (name, flag) values (p_name, p_flag)
  on conflict (name) do update set flag = excluded.flag;
end $$;

-- Taking a card off the page keeps the flag of someone who signed up.
create or replace function bday_admin_guest_delete(p_pass text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  if exists (select 1 from bday_rsvp where name = p_name) then
    update bday_guest set title = '', line = '', photo = '' where name = p_name;
    delete from bday_guest where name = p_name and flag = '';
  else
    delete from bday_guest where name = p_name;
  end if;
end $$;

revoke all on function bday_flags_get(), bday_flag_set(text, text) from public;
grant execute on function bday_flags_get(), bday_flag_set(text, text) to anon, authenticated;
