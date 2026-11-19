-- Tianlai 生日派对 2026：全部脚本，一次补齐。
-- 把这一整份贴进 Supabase 的 SQL Editor，点 Run。
-- 不管之前哪几个跑过、哪几个没跑，跑这一份就全了；重复跑不会丢数据，也不会改后台口令。
-- 跑完最下面会显示一行字：两个 Sophia 合并的结果。

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
                  group by who order by count(*) desc, min(at) limit 100) t),
    'ctop', (select coalesce(jsonb_agg(jsonb_build_object('who', t.who, 'n', t.n)), '[]'::jsonb)
             from (select who, count(*) as n, min(at) as first from p where kind = 'cake' and who <> '' and who not like '~%'
                   group by who order by count(*) desc, min(at) limit 100) t),
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

revoke all on function bday_rsvp_save3(text, text, text, text, text, text, text), bday_rsvp_list3(), bday_known(text),
  bday_card_photo(text, text), bday_react_toggle(text, text, text), bday_react_list(),
  bday_note_add(text, text, text), bday_notes_list(), bday_admin_note_delete(text, bigint), bday_admin_rename(text, text, text),
  bday_poke_state(), bday_poke_add(text, text) from public;
grant execute on function bday_rsvp_save3(text, text, text, text, text, text, text), bday_rsvp_list3(),
  bday_card_photo(text, text), bday_react_toggle(text, text, text), bday_react_list(),
  bday_note_add(text, text, text), bday_notes_list(), bday_admin_note_delete(text, bigint), bday_admin_rename(text, text, text),
  bday_poke_state(), bday_poke_add(text, text) to anon, authenticated;

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

-- ---------- a browser that signed up finds its entry again after the host changed the name ----------
-- The token is the private random id each browser keeps; it gives back only the name of its own entry.
create or replace function bday_whoami(p_token text)
returns text language sql security definer set search_path = public as $$
  select name from bday_rsvp where char_length(coalesce(p_token, '')) >= 16 and token = p_token limit 1;
$$;
revoke all on function bday_whoami(text) from public;
grant execute on function bday_whoami(text) to anon, authenticated;

-- ---------- drinks and cakes given before a name was known ----------
-- A browser without a name gives them under its own anonymous id ('~' plus the start of its private token).
-- Once that browser has a name, everything it gave anonymously moves onto the name and counts on the boards.
create or replace function bday_poke_claim(p_token text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n text := left(trim(coalesce(p_name, '')), 24);
begin
  if char_length(coalesce(p_token, '')) >= 16 and n <> '' and left(n, 1) <> '~' then
    update bday_poke set who = n where who = '~' || left(p_token, 12);
  end if;
  return bday_poke_state();
end $$;
revoke all on function bday_poke_claim(text, text) from public;
grant execute on function bday_poke_claim(text, text) to anon, authenticated;

-- ---------- two entries that are the same person ----------
-- For the host, from the SQL Editor only (the page cannot call it):  select bday_merge('Sophia', 'Sooooophia');
-- Everything under the first name moves onto the second: the sign-up (the newer answers win, and the newer
-- browser keeps the card), the card, reactions, notes, photos, drinks and cakes, hearts and pins.
create or replace function bday_merge(p_from text, p_to text)
returns text language plpgsql security definer set search_path = public as $$
declare
  f bday_rsvp; t bday_rsvp; n bday_rsvp; o bday_rsvp;
  close_names text; c_react int := 0; c_note int := 0; c_pic int := 0; c_poke int := 0; k int;
  had_rsvp boolean; had_card boolean;
begin
  if p_from is null or p_to is null or p_from = p_to then return '两个名字一样，不用合并。'; end if;
  select string_agg(name, '、' order by name) into close_names
    from (select name from bday_rsvp union select name from bday_guest) x
    where lower(name) like lower(left(p_from, 2)) || '%' or lower(name) like lower(left(p_to, 2)) || '%';
  if not bday_known(p_to) then
    return '没找到叫「' || p_to || '」的人。名字相近的有：' || coalesce(close_names, '（没有）') || '。把名字改成一模一样的再跑一次。';
  end if;
  if not bday_known(p_from)
     and not exists (select 1 from bday_react where who = p_from) and not exists (select 1 from bday_note where who = p_from)
     and not exists (select 1 from bday_pic where who = p_from) and not exists (select 1 from bday_poke where who = p_from) then
    return '没找到叫「' || p_from || '」的人（可能已经合并过了）。名字相近的有：' || coalesce(close_names, '（没有）') || '。';
  end if;

  -- the sign-up
  select * into f from bday_rsvp where name = p_from;
  select * into t from bday_rsvp where name = p_to;
  had_rsvp := f.name is not null;
  if f.name is not null and t.name is null then
    update bday_rsvp set name = p_to where name = p_from;
  elsif f.name is not null then
    if f.updated_at > t.updated_at then n := f; o := t; else n := t; o := f; end if;
    delete from bday_rsvp where name = p_from;
    update bday_rsvp set
      arrive = case when n.arrive <> '' then n.arrive else o.arrive end,
      mode   = case when n.mode <> '' then n.mode else o.mode end,
      role   = case when n.arrive <> '' and n.mode <> '' then n.role when n.role <> '' then n.role else o.role end,
      dish   = case when n.arrive <> '' and n.mode <> '' then n.dish when n.dish <> '' then n.dish else o.dish end,
      diet   = case when n.diet <> '' then n.diet else o.diet end,
      talk   = case when coalesce(n.talk, '') <> '' then n.talk else o.talk end,
      token  = coalesce(n.token, o.token),
      updated_at = greatest(n.updated_at, o.updated_at)
    where name = p_to;
  end if;

  -- the card: what the kept card already has stays; gaps are filled from the other one
  had_card := exists (select 1 from bday_guest where name = p_from);
  if had_card and not exists (select 1 from bday_guest where name = p_to) then
    update bday_guest set name = p_to where name = p_from;
  elsif had_card then
    update bday_guest g set
      title = case when g.title <> '' then g.title else x.title end,
      line  = case when g.line <> '' then g.line else x.line end,
      photo = case when g.photo <> '' then g.photo else x.photo end,
      flag  = case when g.flag <> '' then g.flag else x.flag end
    from bday_guest x where g.name = p_to and x.name = p_from;
    delete from bday_guest where name = p_from;
  end if;

  -- what others left on the card, and what this person did under the other name
  insert into bday_react (guest, emoji, who, at) select p_to, emoji, who, at from bday_react where guest = p_from on conflict do nothing;
  delete from bday_react where guest = p_from; get diagnostics k = row_count; c_react := c_react + k;
  insert into bday_react (guest, emoji, who, at) select guest, emoji, p_to, at from bday_react where who = p_from on conflict do nothing;
  delete from bday_react where who = p_from; get diagnostics k = row_count; c_react := c_react + k;
  update bday_note set guest = p_to where guest = p_from; get diagnostics k = row_count; c_note := c_note + k;
  update bday_note set who = p_to where who = p_from; get diagnostics k = row_count; c_note := c_note + k;
  update bday_pic set guest = p_to where guest = p_from; get diagnostics k = row_count; c_pic := c_pic + k;
  update bday_pic set who = p_to where who = p_from; get diagnostics k = row_count; c_pic := c_pic + k;
  update bday_poke set who = p_to where who = p_from; get diagnostics c_poke = row_count;

  -- hearts and pins are kept by name
  update bday_admin set hearts = replace(hearts::text, to_jsonb(p_from)::text, to_jsonb(p_to)::text)::jsonb
    where hearts is not null and position(to_jsonb(p_from)::text in hearts::text) > 0;

  return '合并好了：「' || p_from || '」并进了「' || p_to || '」。报名 ' || case when had_rsvp then '1' else '0' end || '，卡片 ' || case when had_card then '1' else '0' end ||
         '，表情 ' || c_react || '，留言 ' || c_note || '，照片 ' || c_pic || '，碰杯和蛋糕 ' || c_poke || '。';
end $$;
revoke all on function bday_merge(text, text) from public;
revoke all on function bday_merge(text, text) from anon, authenticated;

-- ==================== 合并两个 Sophia ====================
-- 把「Sophia」并进「Sooophia」（三个 o）。名字要和后台里显示的一模一样；对不上的话，结果里会列出相近的名字。
select bday_merge('Sophia', 'Sooophia') as "结果";
