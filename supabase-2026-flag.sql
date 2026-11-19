-- Birthday 2026: nationality flags. Safe to run more than once.

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
