-- Birthday 2026: the host's own cake and drink taps (name Tianlai) no longer count and stay off the board.
-- Paste into Supabase > SQL Editor and Run. Nothing is deleted. Safe to run more than once.

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
