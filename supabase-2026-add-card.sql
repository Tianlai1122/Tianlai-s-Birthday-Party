-- Birthday 2026: the "+" at the end of the guest cards.
-- Paste into Supabase > SQL Editor and Run. Nothing existing is changed. Safe to run more than once.

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
