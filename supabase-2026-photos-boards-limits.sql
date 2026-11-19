-- Birthday 2026: photos anyone can add to a card, the cake board, and looser drink limits
-- (each person 5 drinks per 30 minutes instead of 2; sofa at 12 instead of 8).
-- Paste into Supabase > SQL Editor and Run. Nothing is deleted. Safe to run more than once.

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
    'ctop', (select coalesce(jsonb_agg(jsonb_build_object('who', t.who, 'n', t.n)), '[]'::jsonb)
             from (select who, count(*) as n, min(at) as first from p where kind = 'cake' and who <> ''
                   group by who order by count(*) desc, min(at) limit 3) t),
    'last', (select jsonb_build_object('kind', kind, 'who', who) from p order by id desc limit 1),
    'sofa_at', 12, 'per_person', 5);
$$;

-- Each person: at most 5 drinks per 30 minutes, so nobody takes every round. The host's own taps are not recorded.
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
    if (select count(*) from bday_poke where kind = 'drink' and lower(who) <> 'tianlai' and at > now() - interval '30 minutes') >= 12 then
      return bday_poke_state() || jsonb_build_object('refused', 'sofa');
    end if;
    if (select count(*) from bday_poke where kind = 'drink' and who = w and at > now() - interval '30 minutes') >= 5 then
      return bday_poke_state() || jsonb_build_object('refused', 'slow');
    end if;
    insert into bday_poke (kind, who) values ('drink', w);
  end if;
  return bday_poke_state();
end $$;

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
