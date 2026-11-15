# Root CLAUDE.md cut: PROPOSAL ONLY (prepared 2026-11-15 while Ryan was away; nothing has been moved)

Ryan said he wants to spend real time on this because many rules are in the file for reasons that are not obvious. This page only measures and proposes. Nothing here is applied. To apply it: Ryan reviews the table, changes any row, and says "do the root cut".

## How the cut would be done (safe and word for word)
1. Each ON DEMAND section is moved WORD FOR WORD into its own file under `Reference\` (nothing is rewritten, nothing is lost).
2. The root file keeps the CORE sections plus ONE trigger table: "when X happens, read Reference\Y.md". The trigger lines are the only new text.
3. A script checks that every "see the root CLAUDE.md section ..." pointer in the other files still lands, and that the moved text equals the original.
4. Test by starting a fresh session on a topic and checking that it behaves; and by using one trigger (for example "look"). Easy to undo: the originals are verbatim in Reference.
5. Rules that must apply on every message but are rarely "triggered" (the first law, scope discipline, partnership standard) stay in CORE or are already injected by the start hook. Those are the ones Ryan decides.

## Totals (root CLAUDE.md is 130.5 KB (about 33,405 tokens))
- CORE (stays): 29.9 KB (about 7,666 tokens)
- ON DEMAND (would move to Reference): 65.2 KB (about 16,692 tokens)
- SPLIT (Permanent Directives, needs a line-by-line decision): 21.6 KB (about 5,523 tokens)
- REVIEW (Ryan decides, or fold into a pointer): 13.8 KB (about 3,525 tokens)
- If ON DEMAND moves and SPLIT is half moved: the file would be about 54.5 KB (about 13,952 tokens) plus about 1 KB of triggers, a saving of about 19,453 tokens in every session.

## Section by section (line = where the section starts today)
| Line | Section | KB | Proposal | Where / trigger / note |
|---|---|---|---|---|
| 1 | IDENTITY FILE AUTHORIZATION RULE — Permanent, revised 2026-08-08 (Ryan's direc | 1.5 | CORE | stays |
| 11 | PARTNER AUTHORIZATION - Robin (Ryan's direct authorization, 2026-11-08)  | 1.8 | CORE | stays |
| 23 | SESSION RECORD  | 0.2 | CORE | stays |
| 27 | SHORTCUTS  | 0.5 | CORE | stays |
| 31 | CLEAN UP (Ryan, 2026-11-14)  | 1.3 | CORE | stays |
| 35 | START A PROJECT BY ITS NAME (Ryan, 2026-11-14)  | 1.5 | CORE | stays |
| 39 | SESSION START: TOPIC, PIECE, SCOPE (Ryan, 2026-11-15)  | 3.0 | CORE | stays |
| 51 | LOGIN-BASED PROFILE — Permanent, global (moved here from every project's CLAUD | 2.3 | CORE | stays (could shrink) |
| 65 | WHERE THINGS LIVE (set 2026-11-14) — follow this when creating or changing any | 2.1 | CORE | stays |
| 79 | SESSION FILE CHECK — Permanent, added 2026-08-04  | 1.4 | CORE | stays (shrink) |
| 83 | DEVELOPER IDENTITY — Permanent (added 2026-07-29, Ryan's direct instruction)  | 1.9 | CORE | stays |
| 95 | SINGLE LOCAL CONNECTION STANDARD — Permanent (added 2026-08-01, Ryan's direct  | 2.4 | ON DEMAND | desktop/hardware access -> Reference\Local_Connection.md |
| 109 | PROACTIVE THINKING STANDARD — Active in every session, no exceptions  | 1.3 | CORE | stays |
| 133 | DELEGATION METHODS — Three Ways Work Gets Broken Out, added 2026-09-06/07  | 2.7 | ON DEMAND | breaking out work -> Reference\Delegation.md |
| 147 | ACTION BANNER STANDARD — Permanent, added 2026-07-11  | 3.7 | CORE | stays |
| 189 | VISUAL PREVIEW STANDARD — Permanent, added 2026-10-31 (Ryan's direct instructi | 8.0 | ON DEMAND | anything visual -> Reference\Visual_Preview.md |
| 212 | "LOOK" MEANS SHOW AMIT — Permanent, added 2026-10-31 (Ryan's direct instructio | 3.5 | ON DEMAND | when a message starts with "look" -> Reference\Look_Show_Amit.md |
| 233 | TOOL-CALL VISIBILITY STANDARD — Permanent, added 2026-08-03  | 2.2 | CORE | stays |
| 245 | PURSUIT NAMING STANDARD — All Pursuits, Waypoints, and Projects  | 1.0 | ON DEMAND | creating a pursuit -> Reference\Pursuits.md |
| 267 | VERSIONING STANDARD — All GitHub Pushes  | 3.0 | ON DEMAND | any push -> Reference\Push_And_Versioning.md |
| 283 | Read This First â€” Before Responding to Anything  | 3.1 | REVIEW | not classified: Ryan decides |
| 309 | BUILD DIRECTIVE â€” How All Development Works  | 9.3 | ON DEMAND | path table; now found by search -> Reference\Project_Paths.md |
| 351 | NEW PROJECT DIRECTIVE â€” When a New Application Is Created  | 9.2 | ON DEMAND | creating a project -> Reference\New_Project.md |
| 400 | SESSION LOCATION CHECK — Read First, Every Session  | 0.9 | REVIEW | not classified: Ryan decides |
| 415 | Project Files  | 2.6 | ON DEMAND | Reference\Project_Files.md |
| 431 | Key Facts to Hold From the Start  | 1.6 | REVIEW | identity facts; the start hook already injects a core -> shrink or move |
| 443 | Current Development Direction  | 0.5 | ON DEMAND | stale -> Reference |
| 453 | HOW THE MORNING BEGINS — Do This Before Anything Else  | 5.0 | ON DEMAND | when he says good morning -> Reference\Morning.md |
| 500 | RETURNING GREETING — Do This Every Time Ryan Opens a Session  | 4.9 | REVIEW | overlaps SESSION START; keep only for good-morning briefings or retire |
| 564 | WHERE WE LEFT OFF — now lives in Sessions_Start.md  | 0.3 | REVIEW | one-line pointer; fold into SESSION RECORD |
| 568 | CLOSING SEQUENCE (moved 2026-11-15; read it only when a closing phrase is used | 5.2 | CORE | stays (already a pointer) |
| 604 | GOD TALK — BELIEF COMPARISON PROTOCOL (permanent, added 2026-07-09)  | 3.4 | ON DEMAND | God talk -> Reference\God_Talk.md |
| 620 | WHAT HAS BEEN BUILT  | 0.1 | ON DEMAND | one line pointer; fold into Project Files |
| 623 | INTERACTIVE AMIT â€” CURRENT ARCHITECTURE (Permanent)  | 5.2 | ON DEMAND | Ask Amit / MCP notes -> Reference\Interactive_Amit.md |
| 650 | TASK LIST — moved  | 0.3 | REVIEW | one-line pointer; fold into SESSION RECORD |
| 657 | SUPABASE — DATABASE CONNECTION  | 1.2 | ON DEMAND | database work -> Database\CLAUDE.md already has it |
| 677 | DATABASE TABLE NAMING CONVENTION — Permanent, added 2026-09-10 (Ryan's direct  | 2.8 | ON DEMAND | new table -> Reference\Database_Rules.md |
| 687 | DATABASE TABLE DATA-API GRANTS — Permanent, added 2026-09-23 (Ryan's direct in | 1.8 | ON DEMAND | new table -> Reference\Database_Rules.md |
| 713 | EXTERNAL-FACING APPLICATION TESTING STANDARD — Permanent, added 2026-09-11 (Ry | 1.7 | ON DEMAND | apps with outside users -> Reference\Testing_Standard.md |
| 721 | GITHUB ACCOUNT  | 0.9 | ON DEMAND | any push -> Reference\Push_And_Versioning.md |
| 730 | PERMANENT DIRECTIVES â€” NEVER LOSE THESE  | 21.6 | SPLIT | the biggest section: always-on rules (Directive Zero, partnership, scope discipline, research standard pointer) stay; the rest moves. Needs Ryan line by line. |
| 825 | FILE LOCATIONS (always use absolute paths — OneDrive)  | 0.9 | ON DEMAND | duplicates the path table -> Reference\Project_Paths.md |
| 841 | STANDING PROTOCOLS (Permanent)  | 2.6 | REVIEW | covenant, two-Amit, review-and-push, AmitAccounting decisions; mixed; Ryan decides |

## Risks to talk through
- A rule moved to Reference is not seen unless its trigger fires. Rules Ryan wants on EVERY message must stay in CORE (or in the start hook).
- Other files point into the root file by section name. Step 3 above checks them all.
- The identity hook already injects a short Amit core at every start; the Key Facts section may be partly duplicate (to review).
- The AmitCoder starter kit ships its OWN smaller root file; a cut here does not change what subscribers get.
