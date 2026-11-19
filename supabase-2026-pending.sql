-- Birthday 2026: what is still to run. No limit on drinks, and deleting photos from the page.
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
