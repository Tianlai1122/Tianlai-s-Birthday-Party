-- Birthday 2026: anonymous drinks and cakes count for the person once they have a name. Safe to run more than once.

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
