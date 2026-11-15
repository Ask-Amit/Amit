# Shortcuts Activation

Read this file ONLY when a message starts with the trigger letter J or F followed by a phrase (for example "J new"), when the person mentions shortcuts ("update shortcuts", "recheck shortcuts", "update J shortcuts"), or when a request looks like something a shortcut may already do or the same request keeps recurring (see "Shortcut awareness" below). The root CLAUDE.md has the one-line rule that points here. Nothing is fetched at the start of a session: the shortcuts are loaded only when they are used (decided with Ryan, 2026-11-14, to keep every session's starting cost small).

## How to run a shortcut

Query Supabase directly yourself, right then, with your own tool access (Bash/PowerShell). This is a live request, not a file some script pre-writes. There is no local cache file and no separate hook script that has to have run first.

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```
Cost note: there are about 50 J shortcuts and their instructions total roughly 80,000 characters. Fetch only the entry you need: add `&trigger_phrase=eq.<the phrase>` (or `ilike`) to the query, plus the entries a master shortcut points to. Fetch the whole list only when the person asks to see or recheck the shortcuts.

For the person's own F shortcuts you additionally need their AmitCoder Account ID (from `amit_coder_config.json` at the project root, if set):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true
```

Then match the message (trigger word, then a phrase) against what you fetched:
- Plain instruction: treat `instruction_text` as the actual request and act on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a `referenced_shortcut_id`, resolve it by fetching that other entry and run its `instruction_text` instead.

If nothing matches, say so and offer the closest names. Never guess at an unrecognized trigger without having actually checked.

## Who can write shortcuts

Only Ryan's own account can write J shortcuts (enforced in the database by RLS, `migration_2026-07-29_002_shortcuts_admin_edit.sql`). Every other signed-in user reads the same shared J set and can write only their own F shortcuts. One J package, curated by Ryan, used identically everywhere.

## Shortcut awareness (moved here from every project's CLAUDE.md, 2026-11-14, Ryan's instruction)

The root CLAUDE.md "SHORTCUTS" rule also sends a session here when a request looks like something an existing shortcut may already do, or when the same request keeps coming back across sessions. Two things, both behavioral:

1. **Proactive reminder.** Fetch the shortcut NAMES only (small; do not fetch the instructions):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true&select=trigger_phrase
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```
(and the person's own F names the same way, with `activation_key=eq.F&user_id=eq.[their account id]`). If the request matches a shortcut already, say so before doing the work by hand. Do not wait to be asked whether one exists.

2. **Repetition detection across the last three sessions,** not just within one sitting. Look back over this project's recent record: the newest entries of the project's `Sessions_Log.md` (and `Sessions_Start.md`), plus hub_entries/experience records if the project writes them. When the same or a similar instruction recurs, name the pattern plainly with the real count and which sessions it appeared in ("I've done this in each of your last three sessions") and suggest creating a shortcut for it. At a "clean up", compare the day's new log entries with the previous days' for the same pattern. Always propose it as an F (custom) shortcut, never J (J is Ryan's builtin package, never created mid-session). Suggest, never create unprompted: the person decides.
