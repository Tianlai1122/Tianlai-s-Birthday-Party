-- Birthday 2026: what is still to run. No limit on drinks, deleting photos from the page,
-- a heart between two people, and putting a name on an unsigned note.
-- Paste into Supabase > SQL Editor and Run. Nothing is deleted. Safe to run more than once.

-- ---------- drinks: no limit ----------
-- He still lands on the sofa after 12 drinks in 30 minutes, but people can keep going.
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
