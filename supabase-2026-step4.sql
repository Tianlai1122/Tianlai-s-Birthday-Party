-- Birthday 2026, step 4: emoji reactions under the guest cards.
-- Paste into Supabase > SQL Editor and Run. Safe to run more than once. Nothing existing is changed.

create table if not exists bday_react (
  guest text not null references bday_guest(name) on delete cascade,
  emoji text not null check (emoji in ('like', 'lol', 'love')),
  who text not null check (char_length(who) between 1 and 24),
  at timestamptz not null default now(),
  primary key (guest, emoji, who)
);
alter table bday_react enable row level security;

-- Tap once to react, tap again to take it back.
create or replace function bday_react_toggle(p_guest text, p_emoji text, p_who text)
returns void language plpgsql security definer set search_path = public as $$
declare w text := left(trim(coalesce(p_who, '')), 24);
begin
  if w = '' then raise exception 'name needed'; end if;
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

revoke all on function bday_react_toggle(text, text, text), bday_react_list() from public;
grant execute on function bday_react_toggle(text, text, text), bday_react_list() to anon, authenticated;
