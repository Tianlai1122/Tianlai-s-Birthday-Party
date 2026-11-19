-- Birthday 2026, step 3: "joining remotely" and guest cards.
-- Paste into Supabase > SQL Editor and Run. Safe to run more than once. Existing sign-ups are kept.

-- 1. Allow "remote" as an arrival option.
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.bday_rsvp'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%arrive%'
  loop
    execute format('alter table public.bday_rsvp drop constraint %I', c);
  end loop;
end $$;
alter table bday_rsvp add constraint bday_rsvp_arrive_check check (arrive in ('14','16','1930','21','remote'));

-- 2. Guest cards: written by the host in the back office, shown to everyone on the page.
create table if not exists bday_guest (
  name text primary key check (char_length(name) between 1 and 24),
  title text not null default '',
  line text not null default '',
  photo text not null default '',
  added_at timestamptz not null default now()
);
alter table bday_guest enable row level security;

create or replace function bday_guests_get()
returns table (name text, title text, line text, photo text)
language sql security definer set search_path = public as $$
  select name, title, line, photo from bday_guest order by added_at;
$$;

-- p_photo: null keeps the current photo, '' removes it, otherwise a small image as a data URL.
create or replace function bday_admin_guest_save(p_pass text, p_name text, p_title text, p_line text, p_photo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  if p_photo is not null and p_photo <> ''
     and (char_length(p_photo) > 400000 or p_photo !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$') then
    raise exception 'bad photo';
  end if;
  insert into bday_guest as g (name, title, line, photo)
  values (left(trim(p_name), 24), left(coalesce(p_title, ''), 40), left(coalesce(p_line, ''), 120), coalesce(p_photo, ''))
  on conflict (name) do update
    set title = excluded.title, line = excluded.line,
        photo = case when p_photo is null then g.photo else excluded.photo end;
end $$;

create or replace function bday_admin_guest_delete(p_pass text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform bday_admin_check(p_pass);
  delete from bday_guest where name = p_name;
end $$;

revoke all on function bday_guests_get(),
  bday_admin_guest_save(text, text, text, text, text), bday_admin_guest_delete(text, text) from public;
grant execute on function bday_guests_get(),
  bday_admin_guest_save(text, text, text, text, text), bday_admin_guest_delete(text, text) to anon, authenticated;
