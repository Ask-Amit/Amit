-- Amit Computer Health — fix missing UPDATE policy on amit_installed_programs
-- Run in Supabase Dashboard > SQL Editor > paste > Run
--
-- Real bug found live 2026-07-19: the original migration only granted
-- SELECT and INSERT policies. The time-backfill feature (added later the
-- same evening) needs to UPDATE an existing row to fill in install_datetime
-- once it's learned - with Row Level Security enabled and no UPDATE policy
-- at all, every one of those updates was being silently rejected (0 rows
-- affected, no error thrown) on every single tracker run, which is why the
-- Time column stayed empty no matter how many times tracking was restarted.

create policy "user can update own installed programs" on amit_installed_programs
    for update using (auth.uid() = user_id);
