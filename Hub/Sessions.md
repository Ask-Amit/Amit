# Amit Hub — Sessions Log

Fast, no-bloat running record of current state. Full behavioral/identity rules come from root CLAUDE.md; this file is state only.

**Update rule:** update Current State continuously while working. At save-and-summarize/compact, add one dated Log entry and refresh Current State.

---

## Current State

- **amit-hub.html** — v1.01 on GitHub as of last confirmed push. Sessions 10+11 changes (Pursuits panel overhaul, rolling due-date model) were built and tested but were LOCAL ONLY as of that point — push status should be reconfirmed before assuming current GitHub version matches local.
- Hebrew calendar built into the Hub (one grid, Gregorian date left / Hebrew date right in the same cell — not two separate panels).
- Compass system (tier 0-3, 25% back rule) live in architecture; several LAUNCH ISSUES remain open (see root CLAUDE.md task list) before promoting to outside users — sync modal too dark, magic link email unbranded, Andy banner stale-load bug, first-authenticated-load has no confirmation UX.
- Root CLAUDE.md carries the full, current task list for this folder (Word for Today three-layer rebuild, Amit panel transformation, sample/demo data system, calendar three-layer display, Pursuits column-header filter row, named saved views) — check there for anything beyond this summary, since Hub's own task backlog is large and lives centrally, not duplicated here.

---

## Log

*No dated entries logged in this file yet — created 2026-08-04 as part of the system-wide Sessions.md rollout. Prior Hub history lives in Amit_Testimony.md Growth Log and root CLAUDE.md's WHERE WE LEFT OFF section.*

**2026-09-05 — Amit Mobile heartbeat added (small, additive change from an AmitMobile session).** `amit-hub.html` now sends a periodic heartbeat (`amit_hub_heartbeat` table, upserted every 25s while signed in) so the Amit Mobile watcher knows whether to run live phone replies, plus a small 🟢/⚪ "Amit Mobile: Listening" header indicator next to the existing SYNC indicator. Version bumped v6.22 → v6.23. Reused the Hub's existing `db`/`currentUser`/`onAuthStateChange` pattern exactly — no new Supabase client, no restructuring. Full detail lives in `AmitMobile\CLAUDE.md`'s "Hub-Open Heartbeat Gate" section, not duplicated here.

**2026-09-05 — Real readiness banner added (from an AmitMobile session, shared mechanism).** `amit-hub.html` now includes the new shared `../amit_readiness_check.js` and shows a banner (`#amitReadinessBanner`, right under the header) whenever any of four things isn't ready: not signed in, local Amit bridge not detected, Claude Code not installed on this computer, or Claude Code installed but not connected. Calls the shared `checkAmitReadiness(db)`/`renderReadinessBanner()` functions — no readiness logic duplicated locally. Refreshed on every auth-state change and once on page load. Banner's action button opens the sign-in modal or the existing Connect Amit modal depending on which condition is unmet. Purely additive — no existing element restructured. Full detail (including the bridge's new `/api/claude-status` endpoint this depends on) lives in `AmitMobile\CLAUDE.md`'s "Readiness Check" section.

**2026-09-06 — "About Me" sidebar panel added: real per-login owner-contact record in AmitBooks, holding name/email/phone + Amit's Voice.** First built as a header-button modal writing to a standalone `amit_voice_prefs` table — Ryan redirected twice, both real corrections, both applied:
1. Voice control is Amit-global, and belongs to a real sidebar destination, not a header popup — new tile `🪪 About Me` (`tile-aboutme` → `openPanel('aboutme')`) replaces the header `🔊 AMIT VOICE` button and `#amitVoiceModal` entirely (both removed, no dead code left behind).
2. AmitBooks already has a real contacts table (customers/vendors/employees/etc., per book) — rather than a second, parallel personal-profile table, the signed-in login gets exactly ONE contact row in that same table (`contacts.is_owner=true`, `contacts.user_id=auth.uid()`), auto-resolved or auto-created (including a lightweight personal book if the person has never touched AmitBooks — `books.entity_type='personal'`, already an anticipated value in that table's own schema). That row now holds name/email/phone AND voice (`voice_name`/`voice_accent`/`voice_rate`) — never shown in AmitBooks' normal selectable contacts list, never something the person toggles by hand.
- New shared file, Amit root: `amit_owner_contact.js` — `getOrCreateOwnerContact(db,userId,fallbackName,fallbackEmail)`, `saveOwnerContactFields(db,contactId,fields)`, `resolveVoiceFromContact(voices,contact,fallbackPicker)`. Supersedes `amit_voice_prefs.js` for this purpose — that file and its table are left in place, unused, not deleted.
- New migration, not yet run: `Database\migration_2026-09-06_002_amitbooks_owner_contact.sql` — adds `contacts.user_id`, `contacts.is_owner` (+ a partial unique index, one owner-contact per book), and the three voice columns.
- Panel (`#panel-aboutme`, opened via the new tile) has two sections: **Your Info** (name/email/phone, `amvSaveMyInfo()`) and **Amit's Voice** (accent/region, voice, speed, test textarea + "Let Me Hear It", a session-only 5-star rating to compare while deciding, and "This Is The Voice For Amit" → `amvSelectThisVoice()`). The accent-grouping logic (small-language "Other" bucket, `<5`-voice threshold) is still copied from `VoiceControl_AskAmit\amit_voice_ARCHIVE_2026-09-05_original.html`, unchanged.
- **Amit Mobile reads the same owner-contact row** — `AmitMobile.html`'s `amSpeak()` now calls `getOrCreateOwnerContact`/`resolveVoiceFromContact` (loaded via `amLoadVoicePref()`, kept its old function name to avoid touching every call site) instead of the earlier `amit_voice_prefs` lookup. Amit Mobile still has no voice-picker UI of its own, per Ryan's standing instruction.
- Hub bumped v6.40 → v6.42 (v6.41 was the now-superseded modal version). AmitMobile.html bumped to v1.11.
- Not yet tested live — both migrations (`...001_amit_voice_prefs.sql`, now superseded but harmless, and `...002_amitbooks_owner_contact.sql`, the one that matters) need to be confirmed run before this works end to end.

---

*Part of the Amit System. Full identity/behavioral rules: root CLAUDE.md.*
