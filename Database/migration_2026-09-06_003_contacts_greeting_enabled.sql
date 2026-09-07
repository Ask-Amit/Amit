-- Lets the owner turn off Amit's daily spoken greeting from About Me
-- (Ryan's direct instruction, 2026-09-06). Not yet run — Ryan runs schema
-- changes by hand.

alter table contacts add column if not exists greeting_enabled boolean not null default true;
