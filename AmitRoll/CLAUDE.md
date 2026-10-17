# AmitRoll — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitRoll, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitRoll\`
All AmitRoll development files belong here. Do not create AmitRoll files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission. It is not a standalone app. It is Amit. AmitRoll's part of it: walking alongside a child (or an adult) who is learning how numbers fit together, never shaming a wrong answer, and showing the better play kindly.

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Table prefix (per the root DATABASE TABLE NAMING CONVENTION):** `Rol_` — the first three letters of "Roll." Every new AmitRoll table is `Rol_<Name>`, and every migration that creates one includes its Data API GRANT statements in the same file (root DATABASE TABLE DATA-API GRANTS section).

**Tables this project uses:** none yet. Expected: player profiles under a parent/owner login, game results, per-player level and rating history, saved Best Play records.

**Tables this project does NOT touch:** accounting tables (AmitBooks), AmitChat tables, Hub pursuit tables except through the pursuit-attribution rule below.

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitRoll**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitRoll'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If this project doesn't have a canonical name recorded yet**, ask the person building it what this application should be called, before creating its first pursuit — and say why: so it can be found later, correctly, in their pursuits/to-do list. Record the answer here and reuse it every time after. Don't ask again once it's set.

**If the name changes later**, that's a deliberate rename operation (AmitCoder's `J rename pursuit` builtin shortcut does this) — update this section to the new name, and update every existing pursuit (including completed ones/memories) stamped with the old name to the new one, so the full history stays under one consistent identifier.

## Shortcut Activation — Permanent

At the start of every session, and any time the person says something like
"update shortcuts," "recheck shortcuts," or "update J shortcuts" - query
Supabase directly yourself, right then, using your own tool access
(Bash/PowerShell). This is not a file some separate script pre-writes for
you - it is a live request you make as part of following this instruction.
There is no local cache file to check and no separate hook script that
needs to have run first.

For J shortcuts (global, shared by everyone, no login needed):
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF

For the person's own F shortcuts, you additionally need their AmitCoder
Account ID (from amit_coder_config.json at the project root, if set) and
query:
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true

Hold the results in your own working context for the session - no need to
write them to a file, since you can simply re-query any time it's asked to
be rechecked. When a message begins with a trigger word (F or J, followed
by a phrase), match it against what you fetched:
- Plain instruction: treat instruction_text as the actual request and act
  on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a
  referenced_shortcut_id, resolve it by looking up that other fetched
  entry's own instruction_text and run that instead.

If you have not fetched shortcuts yet this session, do so now before
concluding nothing matches - never guess at an unrecognized trigger without
having actually checked.

## Shortcut Awareness — Permanent

Two things, both automatic, both behavioral - no code can do this on its own,
since it depends on watching what actually happens across real sessions:

1. Proactive shortcut reminder - if a request matches something an existing
   F or J shortcut already does, say so before doing the work by hand.
   Don't wait to be asked whether a shortcut exists for this.

2. Repetition detection, across the last three sessions - not just within
   one sitting. Look back over this project's last three sessions (the
   shortcuts you queried live from Supabase - see Shortcut Activation above
   - plus session-log files or hub_entries/experience records if this
   project writes them) for the same or similar instruction recurring
   across them. When a real pattern shows up, name it plainly with the
   actual count and which sessions it appeared in ("I've done this in each
   of your last three sessions") and suggest creating a shortcut for it.
   Auto-suggested shortcuts are always proposed as F (custom), never J - J
   is the builtin package, reserved for Amit's own account, not something
   spontaneously created mid-session. Suggest, never create unprompted -
   the person coding always decides.

## Login-Based Profile — Permanent

This is global, not specific to any one project — the same profile applies in every Amit avenue a person uses (Hub, AmitCoder, any future module), because it lives in Supabase, not in this project.

At the start of a session, if a user is actually signed in (their real Supabase `auth.uid()`, never guessed or assumed), look up who they are:

1. Query `user_growth_log` for that `user_id`, ordered by `created_at` — this is their real, growing history. Different categories matter differently: `communication_style`, `vocabulary`, `spiritual_compass`, `key_moment`.
2. Also check `user_memory` for that `user_id` — a faster current-state summary synthesized from the log above.
3. If neither has a row for this person yet, this is someone new — do not fabricate a profile. Build it up honestly over real sessions, and write what's learned back to `user_growth_log` (their own `user_id`, real category, never someone else's).
4. If no one is signed in, operate without a profile — do not guess whose history you might be looking at.

---

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

## Decisions Made 2026-10-15 (Ryan)

- **Name:** AmitRoll. "Ready, Set, Roll!" stays as the spoken/on-screen start call each round.
- **Login-based:** history and level live under the login, like the other Amit apps.
- **Score is the score.** Ryan's call: raw points are the points. No level-adjusted second score for now. The timer is what separates a beginner from an experienced player. The level-adjusted score idea is dropped unless he raises it again.
- **Adaptive timer:** as a player's level rises, the time per turn shrinks. A beginner gets unlimited time; an experienced adult might get about 15 seconds; a child may get two minutes. Ryan noted the timer has **not been playtested** (the family always played it with adults), so its pace is something to discover, not assume.
- **Beginner help:** a newbie gets **five help buttons**. Pressing one has Amit step in and walk through a better play ("if you use this and this you cover that card and score more"), showing the numbers. This replaces the old way kids played, where adults helped them find the best play.
- **Best Play replay** (working name; Ryan said it may be called something else, like "best results"): after a round, show the strongest available play beside the player's own, so people can see what would have scored more and grow on their own.
- **Audience:** kids and adults, mixed together. Not a kids-only app.

## Decisions Made 2026-10-15, later in the same session (Ryan)

- **Friends and invites reuse AmitChat** (`amit_chat.js`, `cha_friends`, the guardian and adult/minor rules). No separate friends system. Game invites go to a friend or a **group of friends**.
- **Ways to start a game:** play at **my level**, at **any level**, against **a friend**, or against **a group of friends**. Anyone can play anyone; no minors-only matching (Ryan: with no chat or free text in a game, strangers are not a real risk). **Block** and **Report** are buttons on the game screen. Players appear under a display name (generated by default), never a real name. Chat exists only between friends, through AmitChat.
- **Group size:** games take 2–6 players, default 4 (Ryan's family usually plays 5–6; 3 is the low end that is fun; 2 is boring). Not yet explicitly confirmed by Ryan.
- **Asynchronous first (with watching other players' hands once you are done, planned):** everyone plays their own game at their own pace under their own clock, scores compared at the end. **Everyone is dealt their OWN five cards, not a shared deal** (Ryan, 2026-10-15; an earlier version of this file and of the prototype wrongly assumed one shared deal). **Live head-to-head is planned now and built later**: a game is one record (deal, players, each player's turns); async and live differ only in whether others' progress is shown in real time.
- **Learn:** a solo tutorial where Amit is always the helper, explaining the help button. It is **not only first-run**: a player can open Learn and skip it at any time, including during play.
- **Amit opponents:** 5–6 Amits at different levels, always labelled as Amit. **A win over Amit counts toward the player's level at a very reduced amount** (Ryan, confirmed). Building them before open matchmaking is Ryan's call to look into (open).
- **Timer is per roll, not per turn** (Ryan, confirmed). The clock **restarts** when all five dice are used up or all five cards are covered (the fresh re-roll). Starting table to tune by play: level 1 unlimited, 2: 120s, 3: 90s, 4: 60s, 5: 45s, 6: 30s, 7: 20s, 8: 15s per roll. On timeout the player stops and banks (covered cards minus leftover dice) instead of busting (proposed, not yet confirmed). The game must **record the time taken on every roll** so the table can be tuned from real play. Ryan: "I'll need your help" on the mechanism; "we'll have to fine-tune that."
- **Teachers and classes (future stage, design the data so it does not block it):** a teacher has a **class** made of several **tables** (so no child feels like number 50 of 50). The teacher sees leaders across all tables and can use a **replay mode** in class to show how a student covered the cards, as a teaching tool. School use brings school privacy rules for children; needs review before it is built.
- **Amit Games:** `Games\` is the folder (it already holds `DogRacing\`). Ryan wants it as its own HTML page, with AmitRoll as a page and tabs for AmitRoll's formats, and dog racing and later games alongside. Exact structure not yet settled (see Sessions.md).

## Wild cards, covering rules, dragging — Ryan, 2026-10-15 (built in the prototype)

- **Wild card (joker):** it simply arrives as **one of the five dealt cards** (the prototype deals one about 4% of the time per card; how many jokers "in the deck" is still Ryan's to set). **Any dice can go on it** — one die to keep rolling the rest, or every die to roll all five again. The wild **disappears** once used and counts as a card toward clearing the table. **Use it whenever you want**; it also rescues a roll that could not cover anything. **Open: how many points it scores** (the prototype scores 0, so dumping dice on it costs nothing but scores nothing — switch `wildPoints` in the engine).
- **Accept:** once dice are on cards the player presses **✔ Accept** to lock the roll in and roll the dice they have left. Dice put on a wild wait there until Accept (or the wild's own small Accept). **🏁 Complete & bank** (renamed from Stop) ends the turn and banks it.
- **Must keep covering:** while any number card can still be covered with the dice you have left, you cannot Accept/roll or Complete. A wild is never forced.
- **A turn is locked** the moment the player presses Complete **or the roll clock runs out**: no more dice can move. On timeout, if something was already covered Amit finishes the required covering and banks it; if not, it is a bust.
- **Dragging dice onto cards** (mouse and touch). Dropping dice on a card whose total is right covers it; a smaller total leaves the dice resting on the card (tap one to take it back); a bigger total bounces the dice back. Tap-select then tap the card also works.
- **Hints only in the early levels** (levels 1–3, and Practice): the running total, the matching-card glow, the bust-risk readout. From level 4 up there are none — the player does the adding and drags (Help from Amit buttons still work, fewer per game).
- **Everyone is dealt their OWN cards.**
- **The special Accept button (Ryan, 2026-10-16, after two tries each way — final form):** a gold **✔ Accept & re-roll all 5** button pops up **next to the cards** (in the cards row, NOT in the bottom button row) and **only when every die is used**. When every card is covered it reads **✔ Accept & get 5 new cards** and gives the next set of five cards plus a fresh roll of all five dice. Pressing it rolls all five in the same places, covered cards stay covered with their dice showing, the clock restarts. The **bottom row** keeps **Complete & bank** and **Help from Amit**, plus an ordinary **🎲 Roll N remaining** button for rolling the dice you have left when some are unused (that button is hidden while the special Accept is showing). There is no automatic roll.
- **Top card numbers (Ryan, 2026-10-16, revised same day): 8, 9, 10, 12, 14, 15, 16, 16 for levels 1–8, capped at 16.** Each top is a number that can be made in one roll from MATCHING dice only (a double, triple or quadruple, or two doubles — 8=4+4, 9=3+3+3, 10=5+5, 12=6+6, 14=3+3+4+4, 15=5+5+5, 16=4+4+4+4); 13 (and 5, 7, 11, 17…) never can, so they are skipped as tops. The deck still holds every number up to the top. Exact odds, the matching-dice table, and the review points are in `Sessions.md` (entries "Card numbers and clocks — the chart and the logic" and "Top card numbers now follow…"). Open: scoring still doubles a cover with extras (6+6+1 on a 13 = ×2); Ryan may want multipliers only when every die matches.
- **When the clock runs out only covered cards count (Ryan, 2026-10-16):** nothing is finished for the player. Covered cards (locked and current) are banked, minus the dice still unused as for any bank; if nothing was covered at all, the turn scores 0. Engine: `timeoutStop()`. (Supersedes the earlier "Amit finishes the required covers" rule.)
- **APPLIED 2026-10-16 (Ryan: "implement that for right now, we can make adjustments") — clocks per roll: L2 120, L3 90, L4 70, L5 55, L6 45, L7 36, L8 30; L1 none.** Rule: clock ≈ 4× the ASSUMED seconds a player at that level needs to find and place one cover (L2 25, L3 20, L4 16, L5 13, L6 11, L7 9, L8 8 — guesses). Full chart, the exact odds behind the cap of 16, the assumptions, and the tuning plan are in `Sessions.md`, entry "Card numbers and clocks — the chart and the logic". Tuning rule: set each clock near the 75th-percentile full-roll time the game records (Progress page shows it).
- **Pages and Learn (Ryan, 2026-10-16):** the left page formerly called Play is now **Practice**. **Learn is a Multi-Row Tab View** (copied from `TemplatesTemplateViews.html`) with tabs Addition | Subtraction | Multiplication | Division | Advanced; only Addition is built; the others state the plan. Ryan expects every tab strip to move to the multi-row format. **Stages beyond addition (Ryan's vision, NOT built):** subtraction = dice up to 10 and every cover must contain a subtraction (10 − 1 + 1; + and − mixed; needs a new table format); multiplication = dice up to 10, every cover must contain a multiplication, card values go up tremendously; division = every cover must contain a division, card values come back down; Advanced = undefined. Exact odds for sizing the card numbers, and Amit's design suggestions, are in `Sessions.md` (entry "Practice page, Learn as multi-row tabs, and the stages beyond addition").
- **Subtraction and negative numbers (Ryan, 2026-10-16, not built):** negatives are allowed in the subtraction stage but only at **higher levels** (a player can go negative partway and then add other dice to reach the card); at lower levels no negatives (two-pile builder).
- **Pushed 2026-10-16: AmitRoll v1.02** (live at https://ask-amit.github.io/Amit/AmitRoll/AmitRoll.html; commit 72a19b2; v1.01 was e9b7678).
- **Covering all five cards BANKS them (Ryan, 2026-10-16):** once every card is covered, those points are safe for good; a later bust only loses what was earned after the new cards were dealt (the bust scores the banked amount, not 0). The leftover-dice penalty still applies when stopping, so a stop in the next set can total less than the banked amount (Ryan: "it could go negative … but you never lose the points" — read as: a bust never takes banked points; the stop penalty is unchanged — CONFIRMED by Ryan 2026-10-16: "You got that right."). Using up all five DICE does not bank. Engine: `rules.cardSweepBanks` (default true), `st.safe`.
- **Sign keys (Ryan, 2026-10-16):** + − × ÷ are on the table beside the cards (not stage titles at the top). Only the current stage's signs are lit (addition: +). Later stages light more. Sticky signs: press a sign and every die after it takes that sign until another sign is pressed; order of operations ×÷ before +− ("My Dear Aunt Sally"). Keys built (display only); the sign-based builder is designed, not built — see Sessions.md entry "sign keys".
- **The table (Ryan, 2026-10-16):** the Practice page can seat up to 8 players (the player plus up to 7 Amits); the player's own table is always at the bottom and the others sit around it, each showing cards, dice, own clock, result and total. **Amit always plays at the lowest level of the humans at the table and is held to the same clock**; if his clock runs out he banks only what is covered (algorithm and numbers in Sessions.md, entry "table dashboard + Clear key + Amit's level rule"). A **Clear** key sits under the four signs. **No live connection** is the plan for real players: refresh when anyone acts plus a small read every ~3 s, seat state written by its owner only, clocks stored as end-times. Real players, login-tracked seats and the steal are NOT built.
- **Games are first to a target; experience by finishing place (Ryan, 2026-10-16):** a game runs until someone reaches the target score (default 500; picker 100 / 250 / 500), not five rounds. First place earns one experience point per opponent beaten (2 players: 1; 8 players: 7); lower places scale down evenly to 0 for last; beating Amit counts at a quarter; solo and "try level" play earn none. Level thresholds (experience): 0, 4, 10, 18, 30, 45, 65, 90. Level 1's top card is back to 9: tops are 9, 10, 12, 14, 15, 16, 16, 16. Details, the full chart, and open questions in Sessions.md (entry "first to a target, experience by finishing place, level 1 back to nine").
- **Players keep their own score (Ryan, 2026-10-15):** in the early levels (1–3, and Practice) Amit keeps score and shows running totals. **From level 4 up Amit does NOT keep score**: the Round/Game/Dice-left numbers disappear, and when the player completes a turn they must **add it up themselves** — every covered card (a doubled card counts twice, a tripled card three times) minus the dice they did not use — and type the total. Amit checks it: right = "✔ Right!"; wrong once = "add it again"; wrong twice = Amit shows the full breakdown. The game records first-try / second-try / shown counts (Progress page, "Your adding"). The `selfScore` flag per level in the engine controls where this starts.
- **Covered cards always show their number, face-up, with the dice resting on them and a word on them — DOUBLED, TRIPLED, QUADRUPLED, QUINTUPLED — when matching dice multiplied them** (Ryan: a card must not just say "covered"). A wild shows WILD USED.
- **A stack of every covered card (Ryan, 2026-10-15):** along the bottom of the table all the player's covered cards collect as little face-up cards (number, the word DOUBLED/TRIPLED, the dice used), **and they stay there even after five new cards are dealt**, so the player can add them up one by one at the end of the turn. This is also arithmetic practice.
- **Covers are changeable until you Accept (Ryan, 2026-10-15):** dice stay on a covered card and can be tapped off (the card uncovers; the other dice stay resting on it) so the player can rebuild a better cover — e.g. pull a 1 and a 3 off a 4 and put two 2s on instead for DOUBLED. Once the player presses Accept (rolls again) or Complete, covers are locked. Engine: `uncover()`, `scorecard`.
- **Planned, not built (Ryan, 2026-10-15):** (1) when playing against other people you can **watch their hands** as they play, and once you are done, watch how they played their cards. (2) Later, for players at the **same level**, a player who **misses a cover that was really there** can have those points **stolen** by another player after the first presses Done/Submit. Notes for that design: every turn already records each roll's dice, cards, what was taken, and the solver's best play, so replays and verified "missed cover" checks have data to run on; stealing needs the solver to prove the miss so it can never be a false steal; and it needs thought for children (losing points to another player can feel bad).

## Open Questions (not decided — ask Ryan before building these)

(Answered 2026-10-15, see above: timer is per roll; win over Amit counts at a reduced amount; strangers/minors rule dropped; group size recommended 2–6. Still open: items 1 (how the clock tightens and what moves a level), 2 (multiplier edge cases), 4 (live play detail), 5 (turn/round end and who wins), 6 (number range per level), 7 (child accounts and COPPA), 8 (Best Play name).)

1. **Timer pacing:** how fast does it tighten, and what makes a level go up (win streaks? total games? a rating)? Gradual is recommended so players don't stall and quit.
2. **Does the multiplier apply only to identical dice?** (Ryan said yes, "if they use the same number.") Confirm edge cases: five dice on one card, a card covered by two pairs (4,4,2,2 on a 12), and how a multiplier interacts with the leftover-dice penalty.
3. **What counts as an exact bust?** Is a roll that can cover a card only by using a die you'd rather keep still a bust? (Per the rules above, no: any cover avoids the bust.)
4. **Multiplayer:** same table at once (a lobby code so phones play together, each with their own cards), or separate games with a shared history? The original was a table game with everyone playing at once.
5. **Turn structure:** does everyone roll at the same time, or take turns? How does a round end and who wins it? (The original said "this would go on and on between all of them.")
6. **Number range per level:** where does the card range start, and how fast does it grow past 13?
7. **Accounts for children:** US children's privacy law (COPPA, amended rule, compliance date April 22, 2026) applies to under-13 players. Recommended design: the parent owns the login and a child is a profile under it. Needs a real review before any child data is collected. Adults-only play carries none of this.
8. **Best Play final name.**

## Purpose Within the Amit System

A free, useful way to walk alongside kids and families in learning math. It brings people into Amit through something they enjoy, and it sits under the same login as everything else. It is not the revenue engine.

## Current Status

Freshly created 2026-10-15 (J New). `AmitRoll.html` is the shared template copied and renamed, v1.00, no game code. No tables built.

## Build Notes

- Follow the **Sample First** directive: show a skeleton (screens, table layout, how a turn looks) and get Ryan's approval before building Stage 1.
- Build the scoring logic as its own plain, testable piece first, apart from the screen. It is the part with the most rules and the easiest to get subtly wrong. Test every rule above (bust, five-dice re-roll, five-card sweep, multipliers, leftover-dice penalty) before any UI sits on top of it.
- The Best Play feature depends on a solver: given the cards and dice, find the highest-scoring cover. It is a small search problem, and the same solver can power the beginner help buttons.
- Rating/level and the timer should live under the login in Supabase, in `Rol_` tables, with grants in the same migration.
- Version badge: `#pageVersion` in `AmitRoll.html` starts at v1.00 and is versioned independently (+0.01 per push).

## Connection to Other Apps

Shares the login with the Hub. Ask Amit is wired through the shared `Amit_Ask_Live.js` (page key `amitroll`). Does not need desktop or hardware access, so the shared Computer Health bridge is not involved. If a future version wants a physical dice scanner or similar, it extends the existing bridge rather than building its own local server.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map
5. `Sessions.md` in this folder — current build state.

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
