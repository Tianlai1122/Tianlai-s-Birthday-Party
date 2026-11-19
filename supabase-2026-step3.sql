-- 2026 birthday page, step 3: allow "joining remotely" as an arrival option.
-- Run once in the Supabase SQL editor. Existing sign-ups are not touched.
alter table bday_rsvp drop constraint if exists bday_rsvp_arrive_check;
alter table bday_rsvp add constraint bday_rsvp_arrive_check
  check (arrive in ('14','16','1930','21','remote'));
