# AmitChat - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections describe how the project is built; read them only when working on that part.

## Tables

Tables used by this project (copied from CLAUDE.md 2026-11-14)

**Tables this project uses:**
Planned, none created yet (schema runs by hand after Ryan approves the skeleton). Table prefix is `Cha_`, the first three letters of the name, per the DATABASE TABLE NAMING CONVENTION. Every migration that creates one of these also carries its Data API grants, per the DATABASE TABLE DATA-API GRANTS rule.
- `Cha_Conversations` - one row per chat: title, who started it, created time.
- `Cha_Participants` - who is in which conversation (conversation_id, user_id, role of owner or member, added by, last read message for read receipts).
- `Cha_Messages` - the messages: conversation_id, sender user_id, text, time, status (new or answered, used by the VS Code check routine).
- `Cha_Attachments` - documents, photos and voice recordings attached to a message. Files themselves live in a private Supabase Storage bucket, opened only through signed links.
- Typing indicators are not stored; they ride on Supabase Realtime presence/broadcast (ephemeral).
- Reads `users` (display names) and the Supabase Auth login.

**Tables this project does NOT touch:**
Everything owned by other apps: `hub_entries` (except pursuit rows stamped program='AmitChat'), AmitBooks tables, AmitHealth tables, the Ass_ tables, and the testimony/profile tables.
---
