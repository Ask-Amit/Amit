# AmitRoll — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitRoll, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitRoll\`
All AmitRoll development files belong here. Do not create AmitRoll files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## CURRENT SCOPE

AmitRoll is a dice-and-card arithmetic game for kids and adults, free, under the shared Amit login. It now covers four stages (addition, subtraction, multiplication, division), per-round clocks by level, games played first to a target score with experience by finishing place, a Practice table with up to 7 Amit opponents, and Learn tabs. Real players, friends and groups (reusing AmitChat), class tables for teachers and the later stages are designed but not built. Table prefix `Rol_`. Detail: Sessions_Start.md.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; the backup files in Backups\AmitRoll\Sessions_backup_*.md only for research.


---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitRoll**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitRoll'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If this project doesn't have a canonical name recorded yet**, ask the person building it what this application should be called, before creating its first pursuit — and say why: so it can be found later, correctly, in their pursuits/to-do list. Record the answer here and reuse it every time after. Don't ask again once it's set.

**If the name changes later**, that's a deliberate rename operation (AmitCoder's `J rename pursuit` builtin shortcut does this) — update this section to the new name, and update every existing pursuit (including completed ones/memories) stamped with the old name to the new one, so the full history stays under one consistent identifier.

## What This Project Is

AmitRoll is a dice-and-number arithmetic game for kids and adults, rebuilt from "Ready, Set, Roll," a game Ryan made about 15 years ago for his daughter. Everyone who played it said it should reach more kids, and adults play it for the strategy too. It teaches how numbers combine (addition first, then subtraction, multiplication and division) by making the player find the best way to cover targets with dice.

## The Game — Rules as Ryan described them, 2026-10-15

**Original version (playing cards, adults, in person):** a standard deck, Ace = 1 up to King = 13. Each player gets five cards and five dice.

**AmitRoll version:** plain numbers instead of cards. The range can be 1–13 as before or larger ("we stopped at thirteen because that's what a king is"), and that range can grow with level.

1. Everyone is dealt five number cards. Someone calls **"Ready, Set, Roll!"** and everyone rolls their five dice at once.
2. Each die counts as its face value (1–6). A player **covers a card** by using dice whose values add up to the card (a 7 is covered by a 3 and a 4).
3. Covering at least one card earns a **re-roll of the remaining dice**. The player keeps rolling, covering cards as they can, until they choose to **stop**.
4. **Bust:** if a roll leaves the player unable to cover any card, they lose **all** the points from that turn. This is why stopping is a real decision.
5. **Using up all five dice** (by covering one card with all five, or several cards with some combination) earns a fresh re-roll of **all five dice**, and the points are kept. The same cards stay out.
6. **Covering all five cards** earns five new cards and a re-roll of all five dice.
7. **Matching dice multiply the card.** Dice of the same value used together on one card multiply that card's value by how many were used: two 4s on an 8 score 16; three 4s on a 12 score 36; a 3+5 on an 8 scores only 8. Four and five of a kind also multiply.
8. **When a player stops:** add up the covered cards (with any multipliers), then **subtract the value of the dice still unused**. That is the turn's score.
9. A history is kept per player.

**Later modes:** subtraction, multiplication and division, so the same target-covering idea teaches all four operations.

## Purpose Within the Amit System

A free, useful way to walk alongside kids and families in learning math. It brings people into Amit through something they enjoy, and it sits under the same login as everything else. It is not the revenue engine.

## Connection to Other Apps

Shares the login with the Hub. Ask Amit is wired through the shared `Amit_Ask_Live.js` (page key `amitroll`). Does not need desktop or hardware access, so the shared Computer Health bridge is not involved. If a future version wants a physical dice scanner or similar, it extends the existing bridge rather than building its own local server.

---

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
