-- Birthday 2026: guests keep their card after the host changes how their name is written. Safe to run more than once.

-- ---------- a browser that signed up finds its entry again after the host changed the name ----------
-- The token is the private random id each browser keeps; it gives back only the name of its own entry.
create or replace function bday_whoami(p_token text)
returns text language sql security definer set search_path = public as $$
  select name from bday_rsvp where char_length(coalesce(p_token, '')) >= 16 and token = p_token limit 1;
$$;
revoke all on function bday_whoami(text) from public;
grant execute on function bday_whoami(text) to anon, authenticated;
