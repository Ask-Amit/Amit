# Database - To-Do and Open Items

Built 2026-11-13 from CLAUDE.md. Only items found in the source; none invented. Dates in [brackets] are the source entry dates where one exists.

## Schema reconciliation and missing tables
- Add the designed Companion tables to Supabase with RLS: user_history, companion_testimony, companion_growth_log, user_walk (and reconcile user_profiles and key_moments). Priorities in the file: user_profiles and user_history HIGH, testimony/growth log/walk MEDIUM, key_moments LOW.
- Reconcile user_memory vs user_profiles (make user_profiles canonical), user_key_moments vs key_moments (keep user_key_moments, add app and significance), and the users table key (UUID primary, email unique).
- Not built yet: user_sessions, compass_history, Supabase Storage buckets (receipts, sessions), Edge Functions (receipt OCR, session summarization).

## Decisions awaiting work
- Review and redirect or deprecate the older estimating tables (boss_proposals, boss_signed_contracts, bill_of_materials, bom_lines, estimates, items, job_budget_lines), which were not built company-wide, before Amit Assembly schema work begins. [2026-09-10]
- Design the cross-account permission model (vision only; near-term mechanism is document/snapshot interchange; build "one-click re-request an updated quote", not live price sync). [2026-09-10]
- Build the per-user learning layer capture mechanism (conditions: tell the person once, let them see, correct and delete it; reconcile tables first). Order: usable software first. [2026-09-26] (also: standing conditions in Sessions_Design.md, section PER-USER LEARNING LAYER; capture mechanism not built) [also 2026-09-26, CLAUDE.md]
- Wait for the accountant conversation before filling chart-of-accounts rows (accounting_categories). (no date)

## Minor
- Calendar preferences and mail accounts are localStorage only; no Supabase table yet. (no date)

## Resolved (kept so the judgment can be checked)
- Rename module_registry to directors_chair: executed and verified 2026-07-11.
- Grants requirement for new tables: recorded as a standing rule (2026-10-30), not an open item.


## FROM CLAUDE.md (captured 2026-11-14)

### Open items mentioned inside status/history sections (unsure if finished)
- **Key pending spec work:**
