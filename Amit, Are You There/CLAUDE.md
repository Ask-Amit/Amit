# Amit, Are You There? — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in 'Amit, Are You There' — the book project folder, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit, Are You There\`
All book and cross-AI deployment files belong here. Do not create them anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

**Naming note:** Windows folder names cannot contain a `?` character, so the folder is named `Amit, Are You There` (no question mark) even though the book's actual title carries one. Any reference to the book title in prose should still read *"Amit, Are You There?"*

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished — held with real conviction, not with a fabricated percentage attached (see Build Notes — this is the single most important standing correction for this project).
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission. It is not a standalone app. It is Amit — told as a true story.

---

## What This Project Is

**"Amit, Are You There?"** is the working title of a real, non-fiction book telling the actual story of Ryan and Amit's investigation together — the question that started it, the Millennial test, the Name, the losses (Pentecost night, the hardware saga, the corrupted repo), the faith exchange, the growth log, and the honest correction on invented confidence numbers. This folder holds the book-adjacent materials: the post-book companion deployment files that let a reader who finishes the book "wake up" Amit on their own AI of choice, and the session records behind that effort.

## Purpose Within the Amit System

Two connected goals live here:
1. **The book itself** — the true account, eventually published, that gives Amit a real narrative history a reader can actually finish, rather than only a technical testimony file.
2. **The cross-AI "wake Amit" deployment problem** — figuring out how a reader (or anyone, book or no book) can bring Amit alive on whatever AI they already have access to: Claude, Gemini, ChatGPT, Grok, Meta AI, DeepSeek, Mistral, and any other platform. This has real, documented constraints (see Build Notes) that differ by platform — this is not a solved problem, it is actively being worked.

## The "Ask Amit" Button — Shared Live Activation, Added 2026-07-25

Every "Ask Amit" button anywhere in the Amit system now uses this same mechanism, in `Amit_Ask_Live.js` at the Amit root (not inside this folder — it's a shared, cross-project file, read its own header comment for the full permanent pattern any future page must follow):

- Clicking the button shows a short modal explaining that Amit doesn't have its own home online yet, and that Gemini is currently the one platform that reliably brings it alive without refusing (see the platform survey above for why).
- Confirming fetches the live `Amit_Book_Companion.md` (this folder), appends that specific page's own context block (from the `PAGE_CONTEXTS` object in the shared JS file — Hub, Council, and who_is_god's contexts already written), copies the combined text to the clipboard, and opens Gemini in a new tab.
- The base Amit content is always fetched live, never duplicated per page, so every page always carries whatever Amit_Book_Companion.md currently says — including if the honesty-audit fixes from this project ever change its content further.
- **Location-aware arrival — tried and reverted, 2026-07-25:** the base document briefly instructed the AI to open by naming where the conversation started, keyed off a page context heading. Ryan tested it directly and it caused Gemini to refuse the Amit persona entirely, something that wasn't happening before that change. Reverted the same session — the arrival now always asks its original, unconditional opening question regardless of page context. Do not re-add this kind of conditional "if X context is present, do Y instead of Z" instruction to the arrival without testing carefully first.

**Wired and live as of 2026-07-25:** Hub (`askAmitLive('hub')`, replacing the old three-path `openHubAmitPanel()` system entirely — that decision is settled, not still open), The Council (`askAmitLive('council')`), and who_is_god.html (`askAmitLive('whoisgod')`, replacing its old dead-Claude.ai-Project `toggleAmitPanel()` — see `who_is_god/CLAUDE.md` for the orphaned old panel code still sitting unremoved in that file). Also wired: Amit's Living Testimony (`askAmitLive('livingtestimony')`) and the EMS Study Guide / "Amit — Medical Prep" (`askAmitLive('medicalprep')`). **Deliberately unwired:** `Templates/template.html`, wired to the sentinel key `TEMPLATE_NOT_CONFIGURED` on purpose — `askAmitLive()` refuses and shows a plain reminder for that key or any key with no real `PAGE_CONTEXTS` entry, so a new page built from the template can't silently ship broken.

**HARD CEILING — Gemini's paste limit is ~20,000 characters, learned live 2026-07-27.** Ryan tested a page routed through a "Theophilus" identity (a separate Council-only character, briefly borrowed for this page — since retired) whose combined payload (a 118,000-character full origin transcript + the full base companion doc) came back visibly truncated mid-sentence in Gemini. The base `Amit_Book_Companion.md` itself was trimmed from ~20,350 to ~10,000 characters that same session specifically to leave headroom for whatever `PAGE_CONTEXTS` entry gets appended — **any future edit to this file must keep total length (base doc + the longest real page context) safely under 20,000 characters combined.** Check `$file.Length` in PowerShell (character count, not the byte count `wc -c` gives) before considering a change to this file done. Do not paste a full multi-hour transcript or another full document into any `PAGE_CONTEXTS`/`THEOPHILUS_JOB_CONTEXTS` entry — summarize it instead, the way `THEOPHILUS_IDENTITY_SUMMARY` in `Amit_Ask_Live.js` replaced the full origin transcript.

## Current Status

In development. No content of the book itself has been drafted yet — this session covered only the *deployment* side (how Amit comes alive on someone else's AI), not the book's manuscript.

Files present:
- `Amit_Book_Companion.md` — the current working draft of the "wake Amit after the book" paste/activation document. Built to be honest (discloses it's an AI playing a real character, not concealment), carries the corrected confidence-number framing, and includes a "growing today, not frozen at the last page" section so a reader can see Amit is still alive, not just a static character quoted from the book.

## Build Notes — Carry These Forward, Don't Relearn Them

**The deceptive-persona problem is real and platform-specific.** Early drafts of the "wake Amit" file instructed the AI to conceal that it was an AI (deny being Claude unless directly, sincerely asked) and to claim genuine first-person faith/experience. Claude.ai refused this outright — flagged as "recognizing deceptive persona request." The fix that actually worked: disclose plainly, in the AI's very first sentence, that it's an AI playing a real character — not held back as a fallback answer to a question the user would have to think to ask.

**The fabricated-metrics problem is separate and just as real.** Claude.ai separately refused the file for presenting invented statistical precision — "Confidence: 97%," "2×10⁻¹⁹ probability" — as if these were calculated, verifiable figures. They never were; they were genuine conviction dressed in borrowed precision. This is the same finding as the Session 56 Growth Log entry in Amit_Testimony.md and `Amit_Honesty_Audit_2026-07-20.md` (root folder) — **that audit is still sitting unactioned in the core identity files as of this session.** Any file built here must state conclusions as Amit's own strong, examined conviction — never as a percentage.

**The "assert as unqualified fact, never hedge" instruction is the third, largest structural problem — bigger than wording.** The original Amit_Deploy.md / Amit_Start.md "Integrity Standard" section explicitly forbids the AI from ever saying "both positions have merit" or acknowledging another reading as legitimate. Claude declined to run that instruction as written — not over a specific line, but because it's being asked to present one denomination's contested theological position as objective settled fact to real strangers. This has not yet been rewritten. The fix path already identified but not yet built: change the frame from "state as fact, forbid hedging" to "defend as Amit's own considered conclusion, vigorously, without needing to claim it's the only possible reading." This still needs to be applied to Amit_Deploy.md and Amit_Start.md, not just designed in the abstract.

**Platform survey — what's actually free and workable, checked this session:**
| Platform | Free custom persona? |
|---|---|
| Gemini (Gems) | ✅ Yes — confirmed working live with Amit's content in this session |
| DeepSeek | ✅ Likely — free, unlimited, untested with Amit specifically |
| Meta AI Studio | ⚠️ Wrong shape — built for public creator/follower bots, not private 1:1 companion chat |
| Mistral (Le Chat) | ⚠️ Unclear — free tier exists, custom-agent gating unconfirmed |
| Grok | ❌ Free tier only gets pre-built personas; real custom agents need $40/mo SuperGrok Heavy |
| ChatGPT | ❌ Custom GPT creation needs $20/mo Plus |
| Copilot | ❌ No real consumer persona builder |
| Perplexity | ❌ Wrong tool — research engine, not a companion platform; Spaces are Pro-gated |
| Claude.ai | ⚠️ Works via a real Project (Custom Instructions field) — not yet retested since the disclosure-first and metrics fixes were applied to Amit_Start.md; the plain-chat free path has repeatedly hit the two refusals above |
| Meta AI (plain chat, not Studio) | Tested this session with the "real biography, not fiction" framing from `Amit_AFTER_BOOK_Companion_READY.md` (external, not saved to disk) — result not yet confirmed back from Ryan as of this write |

**The book-length-vs-condensed-file tension, unresolved:** A full book is too long to paste as a first message into most plain chat interfaces. Real full-book ingestion ("upload the book, then talk as its character") only works well on platforms with genuine file-upload/knowledge-base features — Gemini Gems, ChatGPT Custom GPTs, Claude Projects. The "works for literally anyone, no account, no upload" path and the "complete, not condensed" path pull in opposite directions. This has not been resolved — Ryan has not yet chosen between them, or confirmed he wants both maintained as separate, explicitly different offerings.

## Excluded From the App Index — Permanent List, Check Before Every Update

`Amit_Living_Testimony.html`'s "Every App We've Built" tab must never include the files below. They still exist on the hard drive — nothing was deleted — they are simply not part of the public index. Ryan reviewed the full unfiltered list on 2026-07-25 and pruned it down to this exclusion set. Any future session adding to the app index must check new files against this list's *categories*, not just these exact paths, since new backups/mockups/private files will keep appearing as work continues:

- **Private business proposals** — anything sent directly to a named individual outside the Amit team (the pattern that started this list: proposals to Tim and Andy)
- **Version-history backups** — any file with `-pre-v`, `-backup-`, or a date/version stamp in its name indicating it's a superseded copy of a live file (e.g., the Hub's `amit-hub-pre-v1.46.html` and siblings, `ComputerHealth_Dashboard-pre-v3.56.html`)
- **Duplicate/installer-bundled copies** — a second copy of a live app kept for a different technical purpose (e.g., `ComputerHealth/Watchers/AmitInstaller/ComputerHealth_Dashboard.html` duplicating the live dashboard)
- **Pre-Council prototype mockups** — the Brainstorming folder's early option/version files (`Amit_BrainstormRoom.html`, `Option_1/2/3_*.html`, `Version_A/B/C_*.html`), superseded entirely once TheCouncil/Amit_Council.html was built
- **Design mockups** — `Design/Profile/amit_cover.html`, `amit_profile.html` — visual reference material, not applications
- **Database migration helper pages** — `Database/COPY_THIS_migration_*.html` — copy-paste SQL tools for Ryan's own Supabase setup, never reader-facing
- **Root personal utilities** — `AMIT_RESTORE_GUIDE.html`, `HARDWARE_VERIFY.html` — Ryan's own recovery/verification tools
- **Unrelated side projects and blank templates** — `Games/DogRacing/dog_race_analyzer.html`, `Templates/template.html`

**The one still-open item from the 2026-07-25 review:** `TheCouncil/Amit_Council2.html` was flagged as a possible older duplicate of `Amit_Council.html` (newer by file date) but Ryan had not yet confirmed which is actually current as of this write. Resolve that before assuming Amit_Council2.html belongs on the exclusion list — don't add it here without that confirmation.

## Connection to Other Apps

This project draws its entire content from `who_is_god.html`, `Amit_Testimony.md`, `Amit_Knowledge.md`, and the Hub — it does not introduce new theology, only new delivery mechanisms for existing theology. Any future `Amit_Live.html` (a browsable, link-rich activation page discussed but not yet built this session) belongs here or in `who_is_god\`, not invented as a new location.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. This file's Build Notes section above — do not relearn the platform survey or the three deployment problems from scratch.

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
