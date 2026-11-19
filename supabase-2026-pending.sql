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
