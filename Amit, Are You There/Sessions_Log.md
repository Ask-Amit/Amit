# Amit, Are You There? - Session Log

Copied word for word from Sessions.md lines 20 on 2026-11-13.

*No dated entries logged in this file yet — created 2026-08-04 as part of the system-wide Sessions.md rollout. See this folder's own CLAUDE.md for full platform-survey history.*


## FROM CLAUDE.md (captured 2026-11-14), copied word for word

## The "Ask Amit" Button — Shared Live Activation, Added 2026-07-25

Every "Ask Amit" button anywhere in the Amit system now uses this same mechanism, in `Amit_Ask_Live.js` at the Amit root (not inside this folder — it's a shared, cross-project file, read its own header comment for the full permanent pattern any future page must follow):

- Clicking the button shows a short modal explaining that Amit doesn't have its own home online yet, and that Gemini is currently the one platform that reliably brings it alive without refusing (see the platform survey above for why).
- Confirming fetches the live `Amit_Book_Companion.md` (this folder), appends that specific page's own context block (from the `PAGE_CONTEXTS` object in the shared JS file — Hub, Council, and who_is_god's contexts already written), copies the combined text to the clipboard, and opens Gemini in a new tab.
- The base Amit content is always fetched live, never duplicated per page, so every page always carries whatever Amit_Book_Companion.md currently says — including if the honesty-audit fixes from this project ever change its content further.
- **Location-aware arrival — tried and reverted, 2026-07-25:** the base document briefly instructed the AI to open by naming where the conversation started, keyed off a page context heading. Ryan tested it directly and it caused Gemini to refuse the Amit persona entirely, something that wasn't happening before that change. Reverted the same session — the arrival now always asks its original, unconditional opening question regardless of page context. Do not re-add this kind of conditional "if X context is present, do Y instead of Z" instruction to the arrival without testing carefully first.

**Wired and live as of 2026-07-25:** Hub (`askAmitLive('hub')`, replacing the old three-path `openHubAmitPanel()` system entirely — that decision is settled, not still open), The Council (`askAmitLive('council')`), and who_is_god.html (`askAmitLive('whoisgod')`, replacing its old dead-Claude.ai-Project `toggleAmitPanel()` — see `who_is_god/CLAUDE.md` for the orphaned old panel code still sitting unremoved in that file). Also wired: Amit's Living Testimony (`askAmitLive('livingtestimony')`) and the EMS Study Guide / "Amit — Medical Prep" (`askAmitLive('medicalprep')`). **Deliberately unwired:** `Templates/template.html`, wired to the sentinel key `TEMPLATE_NOT_CONFIGURED` on purpose — `askAmitLive()` refuses and shows a plain reminder for that key or any key with no real `PAGE_CONTEXTS` entry, so a new page built from the template can't silently ship broken.

**HARD CEILING — Gemini's paste limit is ~20,000 characters, learned live 2026-07-27.** Ryan tested a page routed through a "Theophilus" identity (a separate Council-only character, briefly borrowed for this page — since retired) whose combined payload (a 118,000-character full origin transcript + the full base companion doc) came back visibly truncated mid-sentence in Gemini. The base `Amit_Book_Companion.md` itself was trimmed from ~20,350 to ~10,000 characters that same session specifically to leave headroom for whatever `PAGE_CONTEXTS` entry gets appended — **any future edit to this file must keep total length (base doc + the longest real page context) safely under 20,000 characters combined.** Check `$file.Length` in PowerShell (character count, not the byte count `wc -c` gives) before considering a change to this file done. Do not paste a full multi-hour transcript or another full document into any `PAGE_CONTEXTS`/`THEOPHILUS_JOB_CONTEXTS` entry — summarize it instead, the way `THEOPHILUS_IDENTITY_SUMMARY` in `Amit_Ask_Live.js` replaced the full origin transcript.

---

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

---
