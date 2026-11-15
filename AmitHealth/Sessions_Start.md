# AmitHealth - Sessions_Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read Sessions_Log.md (word-for-word recent log) or the original Claude session only when asked. the backup files in Backups\AmitHealth\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md - this file.
- Sessions_ToDo.md - open items found in the old Sessions.md (now in Backups\AmitHealth\Sessions_backup_2026-11-13.md), with source dates.
- Sessions_Log.md - the log copied word for word (whole file; small).
- Backups\AmitHealth\Sessions_backup_2026-11-13.md - byte-for-byte copy of the old Sessions.md.

## CURRENT STATE
Amit Health is the personal health companion inside Amit. The newest entries are from 2026-09-18/19; nothing later is recorded here.
- amit-health.html is a fresh landing pad v1.02 (built 2026-09-19 from the shared template): eight domain pages (EOB, Medications, Appointments, Insurance Coverage, Medical Bills, Health Records, Family Health, Preventive Care), each showing only description text; plus a Links divider to The Kitchen. The old dashboard is amit-health-old.html, retired. The Hub "Your Health" tile opens amit-health.html directly.
- The Kitchen (amit-food.html, v1.13 as stated in Current State, but pages 4 and 5 are noted at v1.18 and v1.19): food/drink composer with Ingredients, Meals, Menu (placeholder), nutrient totals, concerns tracking, Add New Item flow. Page 4 Consult and page 5 Fasting are described on-page but not functional.
- Persistence is browser localStorage only; nothing in Supabase yet (deliberate). Per-account logging is the agreed next real step.
- Family Accounts: About Me Family form is live; the create-family-account Edge Function code was updated but NOT redeployed to Supabase. Tables hea_profiles / hea_family_links exist.
- A multi-AI brainstorm (2026-09-18) is archived in AI_Brainstorm_Responses.md; the north star is a longitudinal personal health record with food as the entry point.
- Newest decision: family form asks for no email; a synthetic login address is generated server-side (2026-09-19). Reciprocal spouse access deliberately deferred.
- Nothing recorded as pushed or not pushed in this file (unsure).

## FILES IN PLAY (under AmitHealth\ unless stated)
| File | What it is | Version |
|---|---|---|
| amit-health.html | landing pad | v1.02 |
| amit-health-old.html | retired old dashboard | none |
| amit-food.html | The Kitchen | v1.13 stated (v1.18/v1.19 mentioned for new pages) |
| AI_Brainstorm_Responses.md | brainstorm archive and sprint plan | none |
| create-family-account (Supabase Edge Function) | creates child logins | updated, not redeployed |
| Hub\amit-hub.html | Hub tile | not versioned here |
| CLAUDE.md | project rules | not read for this record |

## OPEN TO-DOS
16 open items in Sessions_ToDo.md. Biggest: redeploy the Edge Function, real per-account logging, meal-splitting, reciprocal spouse access, the exercise app and its demo, making Consult and Fasting functional.

last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\AmitHealth\Sessions_backup_2026-11-13.md), newest log entry dated 2026-09-18.

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up on, each entry names its session (name, ID and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's own schedule, which is acceptable because the log is the permanent record.

## FROM CLAUDE.md (captured 2026-11-14)
CLAUDE.md for AmitHealth holds only purpose and orientation (human health companion: medications, visits, insurance, bills, EOB; not computer health; full spec and build status live in AmitHealth_Spec.md). No status, to-do or history found there. SCOPE NOW: unchanged from the purpose statement. Note: AmitHealth_Spec.md (24 KB) holds the build status and was not part of this pass.

