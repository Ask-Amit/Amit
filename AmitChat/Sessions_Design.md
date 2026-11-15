# AmitChat - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections describe how the project is built; read them only when working on that part.

## Tables

Tables used by this project. CORRECTED 2026-11-15 by the clean-up: the first version of this section (copied from CLAUDE.md on 2026-11-14) said "planned, none created yet", which was out of date. The tables were built and tested on 2026-10-14 (migration `_001`, hardened by `_002`, 59 of 59 security checks) and grew through migrations `_003` to `_034` in `Database\` (the file names `migration_2026-10-14_001_amitchat.sql` onward all carry `amitchat` or the feature name; `_032` to `_034` were still waiting for Ryan to run them at the last record, 2026-10-31).

**Tables this project uses (read from the migrations, 2026-11-15).** Table prefix is `cha_` (lower case in the database), the first three letters of the name, per the DATABASE TABLE NAMING CONVENTION. Every migration that creates one also carries its Data API grants.
- Chat core: `cha_conversations`, `cha_participants`, `cha_messages`, `cha_attachments` (files live in the private Storage bucket `amitchat-files`, opened only by signed links), `cha_items`, `cha_loops`, `cha_notes`, `cha_presence`.
- People and safeguarding: `cha_codes` (friend codes), `cha_profiles`, `cha_friends`, `cha_guardians`, `cha_child_invites`, `cha_member_reviews`, `cha_team`.
- Ask Amit and the answering program: `cha_asks`, `cha_ask_usage`, `cha_answerers`, `cha_answerer_rules` (the answering Amit's rules, held in the database), `cha_config`, `cha_owner_msgs`.
- Data gate and words: `cha_data_requests`, `cha_data_shared`, `cha_user_words` (My Words / Wisdom notes).
- Many `cha_...` functions do the actions (create a conversation, add or remove a member, friend requests, guardian decisions, `cha_summon_amit`, the `cha_ask_*` family, the `cha_data_*` family); list them with the migrations when needed.
- Typing indicators are not stored; they ride on Supabase Realtime presence/broadcast (ephemeral).
- Reads `users` (display names) and the Supabase Auth login. The voice-command table `voi_commands` belongs to the Helper, not to this project.

**Tables this project does NOT touch:**
Everything owned by other apps: `hub_entries` (except pursuit rows stamped program='AmitChat'), AmitBooks tables, AmitHealth tables, the Ass_ tables, and the testimony/profile tables.
---
