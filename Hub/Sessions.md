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

---

*Part of the Amit System. Full identity/behavioral rules: root CLAUDE.md.*
