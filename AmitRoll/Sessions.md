# AmitRoll — Sessions

## Current State

Playable prototype, **PUSHED 2026-10-16 as AmitRoll v1.02** (commit 72a19b2; v1.01 was e9b7678) and live at https://ask-amit.github.io/Amit/AmitRoll/AmitRoll.html . Pushed files: AmitRoll.html, amitroll.css, amitroll_engine.js, amitroll_ui.js, amit_icon.ico (not the tests or the notes). `AmitRoll.html` badge v1.01; script cache numbers v=0.12. Files: `AmitRoll.html`, `amitroll_engine.js` (all rules, 39 passing tests in `amitroll_engine.test.js`), `amitroll_ui.js` (screens), `amitroll.css`. Built: drag-and-drop covers, wild cards, Accept pop-up next to the cards when every die is used, changeable covers, stack of covered cards, self-scoring from level 4, Best Play review, Amit opponents (levels 1–6), Learn walkthrough, challenge links, per-roll clock with the table in the entry "Card numbers and clocks — the chart and the logic" (tops 8-9-10-12-14-15-16-16, timeout banks only covered cards). Progress saved in the browser only; no `Rol_` tables yet; friends/groups/open matchmaking/block-report, class tables for teachers, watching others' hands and stealing missed points are designed but not built. Open: jokers per deck / wild points, rounds per game, level-relative score display for mixed-level games, how Amit Games hosts it (`Games\` folder).

## Log

### 2026-10-15 — Project created
Ryan has a dice-and-card arithmetic game he made about 15 years ago for his daughter, called "Ready, Set, Roll." Everyone who played it said it should reach more kids. Adults play it too. Name settled through J New: "Ready, Set, Roll" was spared (common phrase, says nothing about the math, does not match Amit naming); Ryan chose AmitRoll and "Ready, Set, Roll!" stays as the in-game start call. A web search found no existing AmitRoll app. The dice-cover idea exists in teacher handouts (Dice Dilemmas, Roll and Cover) but none has the stop-or-press-on risk, the matching-dice multiplier, or the fresh-cards sweep. Full rules, the Best Play replay, the beginner help buttons, and the open questions are in CLAUDE.md.

### 2026-10-15 (later) — Design agreed, nothing built
Ryan approved the plan: reuse AmitChat friends and invites (including groups of friends); open games at my level, any level, a friend or a group; block and report on the game screen; no minors-only matching; asynchronous first with live head-to-head designed in now; Learn page skippable at any time; timer per roll, restarting when all dice are used or all cards covered; a win over Amit counts at a very reduced amount; teachers get classes made of tables with leaders and a replay mode (future stage). Full list in CLAUDE.md "Decisions Made 2026-10-15, later in the same session". Next: screen sketch for Ryan's approval (Sample First), then Stage 1 (tested scoring engine, then solo Addition). Open: how AmitRoll sits inside Amit Games (move into `Games\` or be linked from a front-door page).

### 2026-10-15 (build) — First playable prototype, v1.01, NOT pushed
Ryan asked for something playable and "inspire me." Built, locally only: `amitroll_engine.js` (the rules; 20 passing tests in `amitroll_engine.test.js`, including a brute-force check of the best-play solver on 300 random hands), `amitroll.css`, `amitroll_ui.js`, and `AmitRoll.html` v1.01 now loading them. Pages on the left: Play, Learn, Friends & Games, Progress. Play has the felt table with rolling dice, flipping cards, per-roll clock, a risk readout, the 💡 help button, a Best Play review after each round, and games against Amit levels 1–6. Challenge links work with no account (same five cards each round). Progress and XP are saved in this browser only; no database tables yet; friends, groups, open matchmaking and block/report are shown as "next stage." Checked in headless Chrome (a turn played through the real screens, screenshots reviewed); not yet played by a person.
Rules Ryan should confirm (all one-line changes): (1) a mixed cover such as 5+1+1 on a 7 counts the pair of 1s as a doublet and doubles the card (that is how "4+4+2+2 = doublet" was read); (2) after a fresh five-dice re-roll, a bust still loses the whole turn (`sweepBanks` switch in the engine); (3) a roll that runs out of time with something already covered stops and banks, otherwise it busts; (4) game length is 5 rounds; (5) XP per game = score/4 + 5, a quarter of that against Amit.

### 2026-10-15 (correction + wild cards)
Ryan corrected a wrong assumption: everyone is dealt their OWN five cards, not a shared deal. Prototype and notes fixed: challenge links now carry only the level, and Amit plays on its own cards. Ryan also added **wild cards (jokers)**: a wild can rescue a roll that could not cover anything so the player can roll again. Details (what a wild is, how it is dealt, what it scores) recorded as open in CLAUDE.md; not built.

### 2026-10-15 (build 2) — wild cards, Accept, must-keep-covering, dragging; still not pushed
Engine: wild cards dealt among the five cards (any dice, disappears when used), must-keep-covering rule, assist flag per level; 29 passing tests. Screens (amitroll_ui.js v0.02): drag dice onto cards (mouse and touch), dice rest on a card until the total matches, wild staging with Accept, "Accept & roll" and "Complete & bank" buttons, hints only at levels 1–3 and in Practice. Checked in headless Chrome with simulated drags (numeric cover x2 and x3 scored correctly, wild staging and Accept re-rolled all five); screenshots reviewed. Planned and written down: watching other players' hands, stealing missed covers at the same level. Open: wild points, jokers per deck, rounds per game, timeout rule.

### 2026-10-15 (build 3) — self-scoring, changeable covers, stack of covered cards; still not pushed
Engine: uncover(), scorecard (every cover of the turn, survives new deals), multWord (DOUBLED/TRIPLED...), selfScore flag (levels 4+); 34 passing tests. Screens: covered cards stay face-up with number, dice and a DOUBLED/TRIPLED ribbon; tap a die on a provisional cover to take it back off; a stack of little covered cards collects along the bottom for adding up; from level 4 the score numbers hide and the player types their own turn total (Amit checks, two tries, then shows the breakdown); Progress shows adding accuracy. Verified in headless Chrome: drag cover, pull a die off, re-cover, DOUBLED ribbon, complete, add-up prompt, wrong/wrong/breakdown. Cache numbers v=0.04.

### 2026-10-16 — Research: is there already a game called "Ready, Set, Roll"?
Web search (not a legal clearance). Yes, the name is in use: a dice game "Ready Set Roll" by Chuckle & Roar (2–20 players, ages 8+, 40 dice, eBay listing); Hasbro's "Sorry! Diced Game" is listed on eBay with the title "Ready, Set, Roll!"; a USPTO application for READY SET ROLL (Serial No. 97138968, filed Nov 2021, original applicant Buffalo Games, covering board games, dice games, and card-based trivia games) — current status not verified; "Ready, Set, ROLL!" is also a tagline in the arcade app Rolly Hills. No app or math game with that exact name was found. Conclusion: keep AmitRoll as the name; use "Ready, Set, Roll!" only as the spoken start call inside the game.

### 2026-10-16 — automatic fresh roll
Ryan's screenshot showed all five dice used on three cards with nothing happening. Fixed: using the last die (or covering every card) now auto-rolls all five dice again after a 1.5 s pause, covered cards stay covered/locked with their dice, the clock restarts. Verified in headless Chrome (wild with every die -> 5 fresh dice, card still covered and locked, stack still holds it). Cache numbers v=0.05. Not pushed.

### 2026-10-16 (later) — Accept pops up, auto-roll off
Ryan tried the automatic fresh roll and decided the manual Accept was right; asked for the Accept button to pop up when the dice are all used. Built: pulsing gold "Accept & re-roll all 5" button appears in the dice row (or "get 5 new cards & roll all 5" when every card is covered); AUTO_ROLL switch false. Verified in headless Chrome with screenshot. Ryan: "what you gave me works out real good." Cache v=0.06, not pushed.

### 2026-10-16 (revert) — back to the Accept-in-the-row version
Ryan: "go back to the previous version. It worked better." Removed the pop-up Accept button, its styles and the (switched-off) automatic-roll code; banner and Learn wording restored. Verified in headless Chrome: wild with every die -> no pop-up, dice wait; Accept in the row rolls five fresh dice. Cache v=0.07. Not pushed.

### 2026-10-16 (Accept, final form) — pop-up next to the cards, only when all dice are used
From Ryan's screenshot: the bottom-row "Accept & roll 3 remaining" was wrong (with every card covered it actually deals five new cards and rolls all five). Now: special gold Accept pops up in the cards row only when every die is used or every card is covered ("re-roll all 5" / "get 5 new cards"); bottom row has Complete & bank, Help, and a plain "Roll N remaining" for partial rolls. Verified in headless Chrome + screenshot. Cache v=0.08, not pushed. Open question to Ryan: how a player rolls just the remaining dice (kept as the bottom-row "Roll N remaining").

### 2026-10-16 (cap at 16, clock rule)
Applied: card numbers cap at 16 (levels 5 and 8 changed: L5 13->14, L8 18->16); when the clock runs out only covered cards count (new `timeoutStop`), replacing the Amit-finishes-the-covers rule. 38 passing tests. Verified in headless Chrome at level 8: one cover made, clock expired, only that one covered card counted. Cache v=0.09, not pushed. Clock table to equalize the squeeze proposed (see CLAUDE.md), waiting for Ryan.

### 2026-10-16 — Card numbers and clocks: the chart and the logic

> **Revised later the same day:** the "Top card number" column in section 1 and the 9-10-12-13-14-15-16-16 sequence in this entry were replaced by 8-9-10-12-14-15-16-16 (tops that can be made from matching dice). See the entry "Top card numbers now follow 'can be made from matching dice'" below. Everything else here still stands.

**Purpose of this entry:** so that when we come back and review, we can say *this is why and how we came up with these card numbers and clock times*, and change them on purpose, not by guessing. Applied in `amitroll_engine.js` → `LEVELS`. Cache v=0.10. Not pushed.

#### 1. What is in the game now

| Level | Top card number | Lowest card | Clock per roll | Helps per game | Hints (running total, matching glow, risk line) | Who keeps score |
|---|---|---|---|---|---|---|
| 1 | 9 | 1 | none | 5 | yes | Amit |
| 2 | 10 | 1 | 120 s | 5 | yes | Amit |
| 3 | 12 | 1 | 90 s | 4 | yes | Amit |
| 4 | 13 (the king) | 1 | 70 s | 3 | no | the player |
| 5 | 14 | 1 | 55 s | 2 | no | the player |
| 6 | 15 | 2 | 45 s | 1 | no | the player |
| 7 | 16 | 2 | 36 s | 1 | no | the player |
| 8 | 16 | 2 | 30 s | 0 | no | the player |

Rules that go with it: the clock is **per roll** and restarts when all five dice are used or all five cards are covered. **When the clock runs out only the cards already covered count** (minus the dice still unused, as for any bank); nothing is finished for the player; if nothing was covered the turn scores 0. Everyone is dealt their own cards; about 4% of cards are wild.

#### 2. How we got here (Ryan's direction, in order)

1. The original paper game used a deck, Ace = 1 up to King = 13, so the numbers stopped at 13. AmitRoll uses plain numbers, so the range can grow. Ryan: small numbers in the early levels, climbing with the level; "maybe we increase it to 16."
2. Ryan asked for the chance of busting as the top number rises, "all the way down to 31," and asked for **calculated probability, not simulation** (his point: with five dice the most you can make is 30, so a card of 31 can never be covered).
3. Ryan asked where the **expert** level should top out so it is still fun but the expert must **bank more often**, to even things out against a novice who only sees numbers up to 9.
4. Ryan decided: **cap at 16**, and use the **clock** together with the card numbers to level the field: an expert with 30 seconds against a novice's 90 will cover less of what is possible, so will bank more often; they will score more by covering more, but run out of time more; and if time runs out, only covered cards count.
5. Ryan approved the proposed clock table below "for right now … we can make adjustments if we need to."

#### 3. The exact odds (calculated, not simulated)

Method: list all 6^5 = 7,776 equally likely ways five dice can land; for each, list every total that any group of the dice can make (e.g. dice 2,2,5,6,1 can make 1, 2, 3, 4, 5, 6, … up to 16). A card is coverable if its number is one of those totals. Cards are independent, each uniform from 1 to the top number (a wild is always coverable). Then:
- chance one card can be covered = average over the dice outcomes of (number of reachable totals ≤ top) ÷ top;
- chance a roll covers nothing = average over the dice outcomes of [(1 − wild chance) × (top − reachable totals ≤ top) ÷ top] ^ (number of cards).

**3a. First roll of a turn (five dice, five cards):**

| Top | One card coverable | First roll covers nothing (4% wilds) | Same, no wilds | Every card = top |
|---|---|---|---|---|
| 9 | 84.0% | 0.58% | 0.71% | 9.3% |
| 10 | 84.9% | 0.44% | 0.54% | 7.4% |
| 11 | 85.2% | 0.45% | 0.56% | 11.8% |
| 12 | 85.6% | 0.33% | 0.41% | 10.1% |
| 13 | 85.1% | 0.39% | 0.48% | 20.8% |
| 14 | 84.3% | 0.39% | 0.47% | 26.6% |
| 15 | 82.9% | 0.40% | 0.49% | 35.9% |
| 16 | 81.2% | 0.40% | 0.49% | 44.2% |
| 17 | 79.1% | 0.47% | 0.57% | 55.3% |
| 18 | 76.6% | 0.48% | 0.59% | 64.8% |
| 19 | 73.9% | 0.60% | 0.74% | 74.7% |
| 20 | 71.1% | 0.71% | 0.87% | 81.6% |
| 21 | 68.4% | 0.87% | 1.07% | 87.3% |
| 22 | 65.6% | 1.06% | 1.30% | 91.6% |
| 23 | 63.0% | 1.29% | 1.58% | 94.9% |
| 24 | 60.5% | 1.55% | 1.90% | 97.0% |
| 25 | 58.2% | 1.86% | 2.29% | 98.4% |
| 26 | 56.0% | 2.21% | 2.71% | 99.1% |
| 27 | 53.9% | 2.59% | 3.18% | 99.5% |
| 28 | 52.0% | 3.00% | 3.68% | 99.8% |
| 29 | 50.2% | 3.45% | 4.23% | 99.9% |
| 30 | 48.5% | 3.91% | 4.80% | 100.0% |
| 31 | 47.0% | 4.40% | 5.40% | 100.0% |

Reading it: one card's chance of being coverable peaks around 12–13 (about 85%) and then falls steadily. The first roll almost never covers nothing (under 1% up to a top of 21), because with five cards at least one is usually small. "Every card = top" is Ryan's thought experiment: at 31 it is 100% (five 6s only make 30), at 30 about 100%, and it passes 50% at 17.

**3b. A re-roll in the middle of a turn (this is the real pressure):** chance the re-roll covers none of the remaining cards, no wilds, by dice left.

3 cards still to cover:

| Top | 5 dice | 4 dice | 3 dice | 2 dice | 1 die | Average card |
|---|---|---|---|---|---|---|
| 9 | 2.5% | 5.6% | 13.7% | 35.8% | 70.2% | 5.0 |
| 12 | 1.8% | 5.0% | 16.8% | 44.8% | 77.0% | 6.5 |
| 13 | 1.9% | 5.7% | 19.2% | 48.0% | 78.7% | 7.0 |
| 16 | 2.2% | 8.2% | 26.6% | 55.9% | 82.4% | 8.5 |
| 18 | 2.8% | 10.9% | 31.5% | 59.9% | 84.2% | 9.5 |
| 20 | 4.0% | 14.2% | 36.1% | 63.3% | 85.7% | 10.5 |
| 24 | 7.7% | 21.1% | 43.7% | 68.7% | 88.0% | 12.5 |

2 cards still to cover:

| Top | 5 dice | 4 dice | 3 dice | 2 dice | 1 die |
|---|---|---|---|---|---|
| 9 | 5.6% | 11.2% | 24.3% | 49.9% | 79.0% |
| 12 | 4.4% | 11.2% | 29.5% | 58.4% | 84.0% |
| 13 | 4.6% | 12.4% | 32.5% | 61.2% | 85.2% |
| 16 | 5.7% | 17.2% | 40.9% | 67.8% | 87.9% |
| 18 | 7.4% | 21.5% | 45.9% | 71.0% | 89.2% |
| 20 | 10.0% | 26.2% | 50.4% | 73.7% | 90.3% |
| 24 | 16.8% | 34.8% | 57.4% | 77.8% | 91.8% |

#### 4. Why the cap is 16

- At 16, rolling with 3 dice left and 3 cards to cover busts **26.6%**, against **13.7%** at 9: nearly double. That is the "expert must bank sooner" effect Ryan wanted.
- A fresh five-dice roll at 16 still busts only about 2%, so the **start** of a turn feels as good as a novice's. The squeeze is in the middle of a turn.
- Above about 20 it stops being fun: with 2 cards left, a fresh five-dice roll at 20 already busts 10%, at 24 almost 17%.
- 16 was also Ryan's own number. The earlier table ended at 18 at level 8; it now ends at 16 (levels 5 and 8 changed).

*Context from a simulation (not exact — a perfect-play bot, 3,000 turns each, whole turns, 4% wilds):* turns that ended in a bust and average points per turn were 10% / 19.7 at 1–9, 8% / 23.7 at 1–10, 6% / 32.1 at 1–13, 6% / 36.2 at 1–16, 5% / 38.8 at 2–16, 7% / 37.1 at 1–18. Takeaway: bigger numbers do not make a perfect player bust more; they raise the points per cover. Strategy outcomes cannot be calculated in closed form, which is why this one was simulated and the table in section 3 was calculated.

#### 5. Why the clocks are what they are

**What the card numbers alone cannot do:** a bigger card is worth more points (average card 5 at a top of 9, 8.5 at 16 — about 1.7× per cover), so an expert on bigger cards will usually still out-score a novice if raw totals are compared. Ryan accepted this: *"Yes, they're going to score more, by covering more, but they're going to bank more often as well."* The levelling comes from the clock and from matching players by level.

**The rule used for the clock:** **clock ≈ 4 × the seconds a player at that level needs to find and place one cover.** A typical roll offers about 2–3 covers, so 4× leaves some slack: a normal-speed player gets through a roll with a little room; the clock runs out when the position is hard or the player hesitates. Using the same multiple at every level gives every level roughly the same squeeze, so nobody is rushed more than anybody else *relative to their own speed*.

**The assumed seconds per cover (these are GUESSES, not measurements):**

| Level | Top | Assumed seconds to find and place one cover | × 4 = clock | Rounded to |
|---|---|---|---|---|
| 2 | 10 | 25 | 100 | **120** (more room for beginners) |
| 3 | 12 | 20 | 80 | **90** |
| 4 | 13 | 16 | 64 | **70** |
| 5 | 14 | 13 | 52 | **55** |
| 6 | 15 | 11 | 44 | **45** |
| 7 | 16 | 9 | 36 | **36** |
| 8 | 16 | 8 | 32 | **30** (Ryan's expert example: 30 s against a novice's 90) |

Why the clock shrinks more slowly than skill grows: bigger cards take longer to add up (finding 14 from five dice is harder than finding 7), so the seconds-per-cover falls from 25 to 8 (about a third) while the top number nearly doubles. Level 1 has no clock, on purpose.

#### 6. The assumptions to check when we review

1. The seconds-per-cover numbers above were not measured. Everything in section 5 stands on them.
2. "A typical roll offers 2–3 covers" was an estimate.
3. The ×4 slack was a judgment, not derived.
4. The exact odds in section 3 assume cards are uniform from 1 to the top number and independent, no repeated-card rules, and (3a, column 3) 4% wild cards; the wild chance is also a guess awaiting Ryan's number for jokers per deck.
5. Each player is dealt their own cards, so luck differs between players; five rounds per game is also a placeholder.

#### 7. How to tune it (the plan, already built)

The game now records, for every roll in a real game (not Practice with Amit): the level, the seconds to the **first** cover, the **full** roll time (dice settle → Accept / Complete / clock runs out), and whether the clock ran out. It is saved in this browser (`amitroll_profile_v1` → `rolls`: `[level, firstCoverMs, fullRollMs, ranOut]`) and summarized on the **Progress page** under "The level table": rolls recorded, typical (median) roll, the time that **1 roll in 4 takes longer than** (75th percentile), and the percentage of rolls that ran out of time.

**The tuning rule:** set each level's clock at about the **75th-percentile full-roll time** observed for players at that level — one roll in four runs over, the same at every level, by construction. Then the "4× assumed seconds" guess is replaced by real data. Review steps: (1) play or collect at least ~20 rolls per level; (2) read the Progress table; (3) compare "1 in 4 take longer than" with the clock now; (4) where they differ a lot, move the clock toward the observed number; (5) re-check that the share of rolls that run out of time is about the same at every level. When the Rol_ database tables exist this record moves from the browser to the player's login so data from many players can be combined.

#### 8. Open items that touch this

- Does a timeout still subtract the unused dice? (Built: yes, as for any bank.)
- How many jokers per deck / how often a wild appears (built: about 4% per card).
- Whether mixed-level games need a level-relative score display, since a higher level scores more per cover (not decided; Ryan earlier said "the score is the score").
- Rounds per game (built: 5).

### 2026-10-16 (revision, same day) — Top card numbers now follow "can be made from matching dice"

**This revision replaces the card-number column of the chart in the entry above** ("Card numbers and clocks — the chart and the logic"). The clocks, the timeout rule and the tuning plan in that entry are unchanged. Cache v=0.11, 39 passing tests, not pushed.

**Ryan's direction:** level 1 should start at a top card of **8**, and each level's top card should be a number that **can be achieved within one roll as a double, triple or quadruple** — "a 13 would never be able to be achieved … a 12 could, a 14 could, a 15 could, and a 16 could" — so the sequence of top numbers is built from how matching dice can add up.

**How the rule was read (and checked against Ryan's own list):** a number qualifies if one roll can make it using **only matching dice**: a double, a triple or a quadruple of one number (2, 3 or 4 dice), or **two doubles** (e.g. 3+3+4+4), at most 4 dice. Worked out for every number, that rule gives exactly Ryan's list — 13 never; 12, 14, 15, 16 yes:

| Number | Made from matching dice only? | Examples |
|---|---|---|
| 8 | yes | 4+4, 2+2+2+2, 1+1+3+3 |
| 9 | yes | 3+3+3 |
| 10 | yes | 5+5, 1+1+4+4, 2+2+3+3 |
| 11 | never | |
| 12 | yes | 6+6, 4+4+4, 3+3+3+3, 1+1+5+5 |
| 13 | never | |
| 14 | yes (only as two doubles) | 3+3+4+4, 2+2+5+5, 1+1+6+6 |
| 15 | yes | 5+5+5 |
| 16 | yes | 4+4+4+4, 2+2+6+6, 3+3+5+5 |
| 18 | yes | 6+6+6, 3+3+6+6, 4+4+5+5 |
| 5, 7, 17, 19, 21, 23 | never | |

(Also yes: 2, 3, 4, 6, 20, 22, 24. Never as a top: any number that is an odd prime-like value such as 5, 7, 11, 13, 17.) Because 5, 7, 11 and 13 are skipped, the tops go 8 → 9 → 10 → 12 → 14 → 15 → 16.

**The new chart (applied in `LEVELS`):**

| Level | Top card | A top card made from matching dice, e.g. | Chance one five-dice roll offers it that way (exact) | Clock per roll |
|---|---|---|---|---|
| 1 | 8 | 4+4 | 21.8% | none |
| 2 | 9 | 3+3+3 | 3.5% | 120 s |
| 3 | 10 | 5+5 | 23.2% | 90 s |
| 4 | 12 | 6+6 | 26.9% | 70 s |
| 5 | 14 | 3+3+4+4 | 5.4% | 55 s |
| 6 | 15 | 5+5+5 | 3.5% | 45 s |
| 7 | 16 | 4+4+4+4 | 3.9% | 36 s |
| 8 | 16 | 4+4+4+4 | 3.9% | 30 s |

(For comparison: 13 = 0.0%, 18 = 7.0%.) The "chance a roll offers it" column is calculated by listing all 7,776 five-dice outcomes and checking whether any group of matching dice (as defined above) adds to that number. It shows doubling the top card is a real but modest chance each roll, not a freebie.

**The deck still holds every number from the lowest card to the top**, so at a top of 14 a 13 can still be dealt — it simply cannot be made from matching dice only.

**Exact odds for the new level-1 top of 8** (same method as the entry above): one card coverable 83.2%; first roll covers nothing 0.61% (4% wilds); a re-roll with 3 cards left busts 2.7% with 5 dice, 5.7% with 4, 12.9% with 3, 32.7% with 2, 67.0% with 1.

**Things to review / confirm with Ryan:**
1. **How scoring treats a "double with extras".** The engine's multiplier is the largest group of identical dice in a cover, so **6+6+1 on a 13 IS doubled (26 points)** even though 13 cannot be made from matching dice only. The new top-number rule is about which numbers are *natural* doubles/triples; the scoring rule is unchanged. If Ryan wants multipliers only when **every** die in the cover matches (so 13 can never be doubled), that is a one-line change in `multiplier()` — not decided.
2. The "at most 4 dice, no double-plus-triple" limit is a reading of Ryan's list. Allowing a double plus a triple (5 dice) would let 13 = 5+5+1+1+1; Ryan's list excludes 13, so that format was left out.
3. The assumed seconds-per-cover table for the clocks (previous entry) was written for the old tops; the differences are small (levels 2–4 are 1–2 lower, level 1 is 1 lower) and the clocks were left as they were.
4. Level 1 now tops out at 8, which also means the "Practice at level 1" start is slightly easier than before (exact odds above).

### 2026-10-16 — Practice page, Learn as multi-row tabs, and the stages beyond addition (Ryan's vision + Amit's suggestions)

**Built now (cache v=0.12, 39 passing tests, not pushed):**
- The left page called **Play** is now **Practice** ("that's what that is"). The words "practice" and "tutorial" were sorted out so they don't collide: the level picker says "Try level N", the Amit-shows-every-play turn is the "tutorial"/"walk through a turn with Amit".
- **Learn** is now a **Multi-Row Tab View** (copied verbatim from `Templates\TemplateViews.html` v1.04 into `AmitRoll.html`, sample tabs left out), with tabs **Addition | Subtraction | Multiplication | Division | Advanced**. Addition holds the existing step-by-step walkthrough. The other four are labelled "COMING — not built yet" and describe the plan. Ryan: "We're probably going to be changing all of them to a multi-tab format anyways" — so tab strips elsewhere in AmitRoll should use this layout.

**Ryan's vision for the stages (his words, summarised):**
- **Subtraction:** dice go up to **10**; **every cover must contain a subtraction** (e.g. 10 − 1 + 1); plus and minus may be mixed; it needs a **new table format** to build a cover.
- **Multiplication:** same premise (dice up to 10, every cover must contain a multiplication); the **card values go up tremendously**, which makes it harder.
- **Division:** every cover must contain a division; the card values probably **come back down** again.
- **Advanced:** not described yet.
- The novice → expert levels would apply inside each stage. "That way they can see how it would work" in the learning process.

**Exact odds calculated to help size the card numbers** (all exact enumerations, 5 dice with faces 1–10, cards uniform from 1 to the top; "one card coverable" = chance a random card can be made by some cover that obeys the stage's required operation):

| Stage (assumed rule) | Top card | One card coverable |
|---|---|---|
| Subtraction (signed sum of 2+ dice, each die + or −, at least one −) | 5 / 8 / 10 / 12 | 96.6% / 96.8% / 96.4% / 95.7% |
| | 15 / 18 / 20 | 93.4% / 89.2% / 85.3% |
| | 25 / 30 / 35 | 73.9% / 62.9% / 54.1% |
| Multiplication (terms are products of dice, + / − allowed, at least one real ×) | 10 / 20 / 30 / 40 | 86.9% / 87.6% / 87.3% / 86.5% |
| | 50 / 60 / 70 / 80 | 85.0% / 83.0% / 80.6% / 77.9% |
| | 100 / 120 / 150 | 71.5% / 64.4% / 55.3% |

Largest top that still leaves at least 85% / 80% / 70% / 60% coverable: **subtraction 20 / 22 / 26 / 31; multiplication 49 / 72 / 103 / 133.** For comparison the addition design sits at about 83% (novice, top 8) and 81% (expert, top 16).
**Division:** a five-dice roll with faces 1–10 contains at least one exact division of one die by another **99.5%** of the time, so "every cover must include a division" is satisfiable almost every roll; card tops depend on the exact rule (not yet calculated).

**What the numbers mean:** in subtraction a top of 8–12 would be far too easy (96%); the ladder should start around 12–15 and reach about 22 (80%) to 26 (70%). In multiplication the card numbers really do have to climb "tremendously", to roughly 40 at the start and 70–100 at the top, to keep the same feel. This confirms Ryan's instinct that card values rise for multiplication and fall back for division.

**Amit's suggestions (for Ryan's decision — none built):**
1. Keep Ryan's central rule: **every cover must use the stage's operation.** It makes each stage practice exactly that operation.
2. **Each stage gets its own 8-level ladder** (card range, clock, hints, helps), starting at level 1 in that stage; unlock the next stage by reaching a set level in the previous one (e.g. level 4 or 5), while the Learn tab stays readable.
3. **Dice faces:** d6 for addition, **d10 (1–10, no zero)** for later stages; d10 faces must show numerals, not pips.
4. **Subtraction builder:** give each card two zones, a **+ pile** and a **− pile** (take away); result = pile one minus pile two, at least one die in the − pile. Avoids negative intermediate numbers and is easy for children.
5. **Order of operations:** Subtraction uses only + and − (no precedence issue). Multiplication introduces ×; show the evaluated expression after a cover and use true order of operations (× before + / −). Division requires **whole-number results**. **Advanced** = all four mixed, with parentheses.
6. **Scoring rules that need a new decision per stage:** (a) the **matching-dice multiplier** was designed for addition (5−5 = 0 breaks it); (b) the **leftover-dice penalty** subtracts face values, which with d10 averages 5.5 per die (up to 50) against cards of ~20 in subtraction, so it must be rescaled (e.g. a fixed amount per unused die).
7. **Build order:** Subtraction first (same signed-sum structure, simplest), then Multiplication, then Division; leave Advanced until the first three have been played.
8. **The engine becomes stage-aware:** dice faces, allowed operations, required operation, card range, penalty rule are parameters of a stage; the Best Play solver, the risk line and the Amit opponents each need the stage's enumeration (the calculations above already use it). Database: `Rol_` tables need a `stage` column and per-stage level.

### 2026-10-16 (push + subtraction rule) — v1.01 live
Ryan: "let me see what it looks like. Go ahead and push it." Pushed **AmitRoll v1.01** (commit e9b7678): AmitRoll.html, amitroll.css, amitroll_engine.js, amitroll_ui.js (script cache v=0.12). All five files return 200 on GitHub Pages; the live page renders with Practice / Learn / Friends & Games / Progress and the Ready, Set, Roll! start screen. Progress is still saved in each browser only. Not pushed: the tests, these notes, and the local TemplateViews.html v1.04 edit.
**Ryan's subtraction rule (recorded, not built):** negative numbers are fine in subtraction, but only at **higher levels** — at lower levels there are no negatives along the way (the two-pile "add pile minus take-away pile" builder suggested above); at higher levels a player can go negative and then add other dice to land on the card.

### 2026-10-16 (banking) — covering all five cards banks the set
Ryan: once you cover all five cards that value is always banked; only the next set can be lost; the next set can go negative from leftover dice but you never lose the banked points. Built (local, not pushed; cache v=0.13): cover-all-five now banks (`cardSweepBanks`, default true; bust scores `st.safe` instead of 0; undo of the last cover undoes the bank); using up all five dice still does not bank; bust sheet says "You keep the N points you banked by covering all five cards"; Learn text updated; 4 new tests (43 passing). **Confirmed by Ryan ("You got that right"):** the leftover-dice penalty still applies when you stop in the next set, so that stop can end below the banked amount; only a bust is protected.

### 2026-10-16 (push v1.02) — banking rule live
Ryan: "push it, and then give me the link." Pushed **AmitRoll v1.02** (commit 72a19b2): covering all five cards banks the set; bust keeps banked points; Learn and bust-sheet wording. Files pushed: AmitRoll.html, amitroll_engine.js, amitroll_ui.js (amitroll.css unchanged since v1.01). Verified live: page badge v1.02, engine contains the banking rule, all five files 200. Cache v=0.13. Link: https://ask-amit.github.io/Amit/AmitRoll/AmitRoll.html

### 2026-10-16 (vision) — The shared table: a Hearts-style live view for games with other players
Ryan (with a picture of an online Hearts table): when playing against other people, Amit, or the computer, he wants an **interactive dashboard: the player's own seat is always at the bottom, whoever that player is, and everyone else sits around them** (as in four-player Hearts), in the Ready, Set, Roll theme: each seat shows that player's **five cards, with their dice in front of them** when they roll, so everyone can **see how the others are playing their numbers**. If a player misses a cover, others can **steal the points**: when a player says they're done, or their timer runs out, and you still have time left on your own timer, you can say "if you had put these two dice on that card you'd have covered it", do it, and **steal those points** from them. Everyone sees it **simultaneously on their own computer** (five computers = five live views). **Practice rounds stay as they are.**
Not built yet; options and questions are in the entry that follows once Ryan has answered. Earlier notes already planned: watching other players' hands once you are done, and stealing missed covers between same-level players.

### 2026-10-16 (sign keys) — + − × ÷ on the table, and the sticky-sign way of building a cover
**Ryan's direction:** the four signs belong **on the screen next to the cards**, not as stage titles at the top of the page. In addition (arithmetic) only **+** is lit; the other signs are shown but cannot be used. In subtraction **+ and −** are lit; multiplication **+, − and ×**; division all four. A player builds a cover by pressing dice and signs — e.g. a die, the + sign, the next die; or a die, a × sign, another die; with × a player can also use minus "to get another card". Order of operations is **"My Dear Aunt Sally": multiplication and division first, then addition and subtraction.** **Sticky signs:** press **+** then dice 2, 3 and 5 and that means 2 + 3 + 5; press **−** and every die after it is a minus until the player presses + (or × or ÷) again — "the current identification can be used over multiple dice quickly." The steal rules are being deferred: "we'll go over the steal."
**Built now (cache v=0.14, local, not pushed; the next push would be v1.03):** the four stage titles are gone from the top of the Practice page (the level bar stays); the four sign keys (+ − × ÷) sit in a 2×2 block on the table to the left of the cards, with **+ lit and − × ÷ dimmed** ("not used until a later stage"); the start panel shows the same keys with the line "This stage uses: Addition". They are display only for now; addition play is unchanged. `STAGE_OPS` in amitroll_ui.js lists which signs each stage lights.
**Design proposed for the sign-based cover builder (not built, awaiting Ryan):** the lit sign you pressed is the current sign (each cover starts on +); tapping or dragging a die adds it under the current sign, so the cover reads like 2 + 3 + 5 − 4; × and ÷ bind first (true order of operations), shown as a worked line after a cover (2 + 3 × 4 → 2 + 12 = 14); division must come out a whole number and never by zero; the built expression is checked against the card when dropped on it, and a cover must contain at least one of the stage's required operation; a negative first term (pressing − before the first die) only at higher levels, per Ryan.

### 2026-10-16 (table dashboard + Clear key + Amit's level rule) — built locally, cache v=0.18, not pushed (next push would be v1.03)
**Ryan's directions:** (1) add a **Clear** key by the four signs so a player can start over after pressing a lot; (2) build the **dashboard for up to eight players at once**, each tracked by login and level, with the player's own seat at the bottom; (3) **no real-time connection** — refresh the screen when someone presses a sign, a card or a die, to use less memory ("that's the right way to do it, right?"); (4) **anyone can add Amit; Amit always plays at the LOWEST level of the people at the table and is restricted by time too** — "come up with some sort of algorithm."
**Built:**
- **Clear key** under the signs (CLEAR): takes back every die that is picked or resting on a card but not yet a finished cover. It does not undo a finished (but not yet accepted) cover; tapping its dice does that.
- **The table** (Practice page, "Players" picker = Just me, or Me + 1 to 7 Amits = up to 8 players): my table is the existing one at the bottom with a "YOU · LEVEL n" caption; the Amit seats sit around it (layouts for 1 to 7 others: left / top / right), each showing its five cards (covered ones green with the dice used and ×N badge), its dice, a countdown of its own clock, its round result and its total. Amit seats play their turns visibly, a move at a time. When I finish a round the round sheet shows the whole table's scores and the Next button waits for the Amits to finish (they speed up once I am done). Game over ranks everyone; XP against Amit seats is a quarter of the usual. Practice/solo play is unchanged. Tested in a real browser: 4 players and 8 players, all five rounds, no errors.
- **Amit's level algorithm** (engine: `amitLevelFor`, `botPlan`, `botApply`, `amitCost`, `amitTurn`; LEVELS gained `amitSecs` and `amitSkill`): Amit's level = the **lowest level among the human players** (today, the level the player is playing at; with several players pass every human's level). His **skill** (how often he spots the best cover; how well he judges roll vs bank) rises with that level: 0.30, 0.42, 0.54, 0.66, 0.77, 0.86, 0.93, 0.98 for levels 1–8 (each Amit seat gets a small random variation of about ±0.04 and a pace of 0.9–1.1). His **time**: each move costs seconds out of the roll's clock = the level's "seconds to find and place one cover" (30, 25, 20, 16, 13, 11, 9, 8; the same assumed figures the clocks were built from) × a factor for the move (a cover 0.7 + 0.25 per die, a roll 0.4, a wild or stop 0.5) × random 0.75–1.25. If a move would take him past the clock he **banks only what is covered**, exactly as a person. A new roll resets his clock. On screen his clock runs 6× faster than real time so a game does not drag. There is no Amit-level picker any more; the start panel says Amit plays at the lowest level at the table.
- **What Amit scores by level** (400 turns each, from the test): level 1: 13.8 per turn, 0% clock ran out, 18% bust; L2: 18.5, 0%, 14%; L3: 19.6, 1%, 13%; L4: 23.7, 2%, 9%; L5: 31.5, 1%, 8%; L6: 33.9, 1%, 6%; L7: 34.8, 2%, 5%; L8: 37.4, 6%, 4%. His clock almost never binds, which is what the "clock = 4× the assumed time per cover" design predicts; real players' times will show whether the assumed seconds are right.
**Answer given to Ryan on refreshing instead of real time:** refresh-on-action is a sound first version — simpler, cheaper, easier to test — but a viewer who is not pressing anything would see a frozen table, so the plan is: each client writes only its own seat's state when it acts, and every client re-reads all seats on its own action AND every ~3 seconds while a game is open (one small read). Clocks are stored once as an end-time and counted down locally by every screen, so nothing updates every second. A live connection costs very little memory; the reasons for not using one are simplicity and server limits, and it can be added later if a 3-second delay makes stealing feel slow. Not built: real players, login-tracked seats, invites — they need the Rol_ database tables (a game row, one row per seat, grants and access rules; a migration for Ryan to run), the friends/invites from AmitChat, and the steal rules Ryan deferred ("we'll go over the steal").

### 2026-10-16 (first to a target, experience by finishing place, level 1 back to nine) — built locally, cache v=0.19, not pushed (next push would be v1.03)
**Ryan's directions:**
1. **A game is not five rounds.** It ends when someone reaches a target score first — "we've been playing at 500," so it may take 20 rounds or 5.
2. **Experience by finishing place, scaled by how many players:** first place earns one point for every opponent beaten — against one person, 1; against seven, 7 — and lower places scale down ("if there are three players, then we can divide that total by half and use some sort of scaling system"). Nothing for coming second of two. Logged against the player's account; reaching the next level's experience moves them up.
3. **Level one goes to nine.** ("I notice in the practice rounds that it only goes up to number six. I thought we decided that it goes always up to number nine is where it starts from… Bring pull out that chart. And adjust the numbers accordingly.")
**What was found about the "six":** level 1's top card had been set to **8** (Ryan asked for eight earlier the same day), and with five random cards from 1–8 all five come out 6 or lower **24%** of the time (13% with 1–9), so the deal he saw was most likely luck. The dice only go to six in addition by design (ten-sided dice come in the later stages).
**Built:**
- **First to the target.** A "Play to" picker (100 / 250 / 500 points, default 500) on the Practice start screen. The round counter no longer says "of 5"; the table shows the target; after every round (once all players have finished it) the game checks whether anyone has reached the target; the most points wins. Solo games also play to the target (a solo run to 500 at level 1 takes about 20+ rounds; pick 100 for a short one). For challenge links the comparison is now **how many rounds it took to reach the target**.
- **Experience** (engine `placeXp(place, nPlayers, factor)`): experience = (players − place) × factor. 2 players: 1 and 0; 3 players: 2, 1, 0; 8 players: 7, 6, 5, 4, 3, 2, 1, 0. **Beating Amit counts at a quarter** (factor 0.25, Ryan's earlier "very reduced amount"), so a win at a four-player Amit table is worth 0.75. **Solo play earns nothing** (no opponents), and **trying a different level earns nothing**. Ties share the better place. Shown on the game-over screen ("2nd of 2 — +0 experience") and in Recent games (place of N).
- **Level thresholds** (experience needed, first guess): 0, 4, 10, 18, 30, 45, 65, 90 for levels 1–8 — chosen so level 2 takes about five wins at a four-player Amit table; they will need tuning. Experience now shows to two decimals ("4 experience to level 2").
- **Old experience is not carried over:** the earlier points came from a different formula (score ÷ 4 + 5 per game), so profiles saved before this change start again at 0 experience (`xpUnit: 2` marker).
**The chart now** (replaces the card-number column of the two earlier chart entries):

| Level | Top card | Lowest card | Clock per roll | Experience needed | Helps per game | Hints | Who keeps score |
|---|---|---|---|---|---|---|---|
| 1 | 9 | 1 | none | 0 | 5 | yes | Amit |
| 2 | 10 | 1 | 120 s | 4 | 5 | yes | Amit |
| 3 | 12 | 1 | 90 s | 10 | 4 | yes | Amit |
| 4 | 14 | 1 | 70 s | 18 | 3 | no | the player |
| 5 | 15 | 1 | 55 s | 30 | 2 | no | the player |
| 6 | 16 | 2 | 45 s | 45 | 1 | no | the player |
| 7 | 16 | 2 | 36 s | 65 | 1 | no | the player |
| 8 | 16 | 2 | 30 s | 90 | 0 | no | the player |

Level 1 is back to **9** and the rest shifted up one step so each top is still a number that can be made from matching dice (9 = 3+3+3, 10 = 5+5, 12 = 6+6, 14 = 3+3+4+4, 15 = 5+5+5, 16 = 4+4+4+4). Because the cap is 16, levels 6, 7 and 8 now share a top of 16 and differ by clock, hints, helps and the lowest card (2). The clock table and Amit's pace were not changed.
**Open / to confirm with Ryan:** (a) the scale below first place — built as a straight line (each place one less than the one above), so second of eight earns 6; Ryan's "divide by half" would give 7, 3.5, 1.75…; (b) whether solo practice should earn a little experience; (c) the thresholds; (d) whether a game that nobody can finish quickly at level 1 needs a shorter default target for solo.

## 2026-10-16 — Stages: subtraction, multiplication, division (built locally as v1.03, not pushed)
**Ryan's directions:** addition card tops climb 9,10,11…16 whether or not matching dice can make them; subtraction, multiplication and division stages; Practice lets the player pick the stage and each stage turns on its own signs plus every earlier stage's (subtraction → + −, multiplication → + − ×, division → all four); sign keys beside the cards that **stick** (press a sign, then dice, until another is pressed), a Clear key, × ÷ before + − ("My Dear Aunt Sally"); dice go to 10; every cover must contain the stage's own sign; negatives only at higher levels; the solver should be simple: try expressions with the same evaluator and see if the result matches.
**Built:**
- Engine: `STAGES`, `STAGE_TOPS`, `STAGE_PACE`, `rulesFor/levelsFor`, `evalItems`, brute-force `stageSets/stageExpr` (same evaluator as the game, per Ryan), stage-aware `tryCover`, `bestPlan`, `rollOutlook`, bot plans and Amit's cost. 57 node tests pass.
- Card tops: addition 9–16; subtraction 12,14,…,26; multiplication 30,40,…,100; division 24,28,32,36,40,44,50,60. Chosen from exact odds with five d10 dice so each level's top card can be covered about 70–95% of first rolls (subtraction 12→95.7%, 26→71.6%; multiplication 30→87.3%, 100→71.5%; division 24→94.6%, 60→70.2%).
- Stage pace (`STAGE_PACE`, first guess): clocks and Amit's speed stretch 1 / 1.3 / 1.6 / 1.8 for addition / subtraction / multiplication / division.
- Negatives: levels 1–4 the running total may not dip below zero and a cover starts with +; from level 5 both are allowed.
- UI: stage buttons on the Practice start panel; clickable sign keys with sticky sign and Clear; numeral dice (1–10) in later stages; a sign badge on picked dice and small signs between dice on a card; expression line (and its value when hints are on); experience and levels kept per stage (`P.xps`); Learn tabs for Subtraction, Multiplication, Division; Progress shows a per-stage table; challenge links carry `&stage=`; Amit seats play the chosen stage. The tutorial stays addition.
- Tested in headless Chrome: for every stage at levels 3 and 6 the solver found a cover and it was made through real sign-key and die clicks, no script errors; one screenshot reviewed.
**Open / to confirm with Ryan:** matching-dice multiplier is addition-only in later stages; leftover-dice penalty is the sum of unused faces (bigger with d10); stage clock stretch and Amit pace; the scale below first place; steal rules; real players and Rol_ tables.

## 2026-10-16 (later) — Walk-through and Learn for every stage (local v1.04, not pushed)
Ryan: practice should offer addition, subtraction, multiplication and division, the chosen one should be clearly highlighted on the first page, and Learn should explain each type as a tutorial.
- Stage buttons on the Practice start panel now show the chosen stage with a gold fill, ring and check mark.
- New "Walk through a (stage) turn with Amit" button on the start panel; `AR.practice(stage)` starts the guided turn at level 1 of any stage. Sign keys are now clickable in the walk-through too (they were wrongly locked there).
- Learn: Subtraction, Multiplication and Division tabs are now step-by-step lessons like Addition (7, 6 and 6 steps: dice to 10, the required sign, the sign keys, signs stick, order of operations, not-below-zero, Clear), each ending in the walk-through button.
- Checked in headless Chrome: the walk-through runs in all three stages with hints and live sign keys, no script errors.

## 2026-10-16 (later still) — the stage sign is needed once per five cards (local v1.06, not pushed)
**Ryan's rule change:** in subtraction, multiplication and division the stage's sign no longer has to be in every cover. It has to appear **at least once in each set of five cards** (one division on one card, and the others can be plain addition or subtraction). Once it has been used, the player can bank that round's points. If the sign is never used in the five cards, that set scores nothing.
**Built (my reading of "per five cards" = one set of five cards; a fresh five cards owes the sign again):**
- Engine: `rules.required` is now null (any legal cover is fine); `rules.turnSign` is the stage's sign. `st.signUsed` tracks it per set (`setNo`, `setStartPoints`). `canStop` (bank) needs the sign; `canRoll` does not, so a player can keep rolling to find one. Clearing all five cards without it forfeits that set (points back to where the set started, nothing banked; taking the last cover back undoes this). A clock timeout without it scores the points from before the set. A bust is unchanged. Amit goes after a sign-using cover first and never banks without it.
- UI: a red "÷ needed" chip under the sign keys that turns green with a check once used; the bank button message explains; Amit's hint and Help point to a sign-using cover first (shortest one); a forfeit banner; result sheet explains a timed-out set that scored nothing; Learn lessons and start-panel text reworded.
- Tests: 61 pass (old per-cover tests adjusted, four new ones for the once-per-set rule, bank gating, forfeit/undo, and the bot).
**Open:** the card tops (STAGE_TOPS) were tuned when every cover needed the sign; with the sign needed once, covers are easier, so tops could go higher. A set cleared by single-die covers with no sign scores nothing (rare). The odds tables and Amit's pace were not re-measured.

## 2026-10-16 (night) — Advanced tab lists the future stages (local v1.07, not pushed)
Ryan asked for the next steps after division to be listed under Learn → Advanced as future advancements: **fractions** (÷ no longer has to be exact, fractional cards), **parentheses**, **exponents and square roots**, **decimals and percent**, **algebra** (probably its own mode). Text only, marked planned, not built. Amit's suggested order: fractions or parentheses first.

## 2026-10-17 — Cards with dice that do not make them (local v1.08, not pushed)
Ryan's report from playing: a stray die left resting on a card made him think he was done, and he banked by mistake; the sum line on the card ("9 = 9 / 18") was confusing; three dice stacked over the card hid it.
- A card with dice on it that do not cover it now **blinks red** around its edge until the cover works (every level, not just with hints). A correct cover covers automatically, so the red gives away nothing.
- The dice now sit **under the card** (covered cards too), not on it, so the card number stays visible. Dropping dice onto that row still counts as dropping on the card.
- The sum line (hints levels) reads plainly: "9 ≠ 18", or "1 + 2 = 3 ≠ 9", with the "≠" part in red. Later stages show the expression the same way.
- Not done (suggested to Ryan): stopping Complete & bank while dice are still resting on an uncovered card.
- Added (v1.09, Ryan approved): **Complete & bank is blocked while any die is resting on an uncovered card**, with a message naming the card(s) and telling the player to tap the dice back or finish the cover. Tested: a stray die on a 7 blocks banking and no result sheet opens.

## 2026-10-17 — The all-signs bonus and the Amit-icon wild (local v1.10, not pushed)
**Sparred with Ryan.** Idea: a cover that uses every sign the stage offers earns a bonus; harder as the stages go up. Ryan's decisions: addition has no bonus (it only has +); subtraction is where it starts (+ and −), multiplication needs + − ×, division needs all four. **Not a score multiplier** (a ×2 on a 100-point card could hand a last-place player the game). The reward is a **wild card in the next set of five cards**, delivered once the player banks, or straight away when all five cards are cleared. It must be earned on a **real number card**: a wild can never earn it. The wild card's face changes from the joker to the **Amit icon**.
**Rules as built:** a sign counts only when it is applied to a die after the first (the invisible leading + does not count), so the minimum is 3 dice in subtraction, 4 in multiplication, 5 (every die) in division. Earned wild: on banking (or a clock timeout) `turn.bonusNext` carries to the next round; when all five cards are cleared mid-turn the new set is dealt with a wild. A bust loses it; taking the bonus cover back removes it. One earned wild per set.
**Odds measured first** (exact, 5 dice, first roll): a bonus cover exists for at least one card on 98–100% of subtraction rolls, 91–97% of multiplication, 69–80% of division, but in division usually only 1–2 cards and it takes all five dice. With the sign needed only once per five cards, 4.5–4.9 of 5 cards are now coverable, so card tops could rise (still open).
**Built:** engine `isBonus`, `stageBonusExpr`, `cover.bonus`, `turn.setBonus/bonusNext`, `roll()` asks `dealFn(wild)`; Amit chases the bonus with probability skill² (almost never at level 1, nearly always at level 8). UI: gold "ALL SIGNS ★" ribbon, banner, sign keys get a tick when used in the cover being built, a gold "★ ALL SIGNS" chip when the cover has every sign, seats and the player's next round deal the earned wild, result sheet note, lessons for each stage, Amit-icon wild everywhere the joker was. Tests: 64 pass; browser test drove a real bonus cover, banked, and the next round had the Amit-icon wild.
**Open:** the clock-seconds idea is parked; whether the Amit icon (`../amit_icon.png`) reads well at every size.
- v1.11 (Ryan: put the bonus wild into Learn and the other teaching places): each stage lesson ends with a gold line pointing to the "all-signs bonus" step (which already explains the signs, the minimum dice and that a wild cannot earn it); the addition lesson's wild step now says the later stages can earn an extra wild; Amit's hints and Help (and the walk-through) add a "★ Bonus play: …" sentence whenever one exists; start panel blurbs mention it. Tested: 12 of 12 walk-throughs in the three later stages showed a bonus tip; no script errors; cover regression passes.

## 2026-10-17 (later) — picked dice line up as a group (local v1.12, not pushed)
Ryan (from the video): when a die is picked it should move to the left, then the sign and the next die, so the arithmetic shows in the dice; or better, drop them below as smaller dice in order and let the whole group be grabbed and dropped on a card.
- Built the second way. A picked die leaves the dice row (its slot stays empty) and joins a group under the table: smaller dice in the order picked, each after its sign (`9 + 5 − 4`), with `= 10` after it at the hint levels (and the matching-dice ×N in addition). The group is dashed-outlined and **dragged as one** onto a card (or tap the card as before). Tapping a die in the group puts just that die back. A leading − shows only where a leading minus is allowed.
- Tested in headless Chrome: picking 3 dice with signs builds the group in order; dragging the group onto the card covers it and clears the group; cover regression passes in every stage.

## 2026-10-17 (later) — gold BONUS label on the earned wild (local v1.13, not pushed)
Ryan: the wild earned with the all-signs bonus should look different, with a gold label saying BONUS above it, so players see why they got it.
- The earned wild now carries a gold "★ BONUS" ribbon above the Amit icon (the icon sits lower on that card), with a tooltip "Bonus wild: you earned it by using every sign". A wild that arrives by chance has no label.
- The earned wild is now an **extra** wild: it takes the place of a number card, so a set can hold a chance wild and the bonus wild together (before, a chance wild could stand in for it and hide the reward).
- Engine: cards can carry `bonus: true` (the dealer names the card with `cards.bonusIdx`), also through a mid-turn re-deal. Tests: 65 pass.

## 2026-10-17 (later) — build row moved above the covered cards (local v1.14, not pushed)
Ryan: the calculation row should sit right under the remaining dice and above "Your covered cards", so it is clear which dice are still in play to drag onto a card. Order on the table is now: cards, remaining dice, the calculation (picked dice with signs), then the covered-cards tray. Only the order changed.

## 2026-10-17 (later still) — calculation row above the dice (local v1.15, not pushed)
Ryan reversed the last placement: the calculation row sits **above the dice and below the cards**, so the player always sees what is being used in the calculation. Order now: cards, calculation (picked dice with signs), remaining dice, covered-cards tray. Only the order changed.

## 2026-10-17 (night) — the clock is per ROUND (local v1.16, not pushed)
Ryan corrected my reading of the timer: it is **one clock for the whole round**, however many throws of the dice or sets of five cards fit in it. An expert at 30 s may finish one set or less, which is what evens the field against a novice with no clock. I had built it per throw (refilled on every re-roll) because I read "roll" as a throw of the dice.
- Built: the clock is filled once when the round begins and only runs down (paused while dice tumble); re-rolls and new sets no longer refill it. Amit's seats and the engine's `amitTurn` are held to the same whole-round budget. The clock numbers are unchanged but now mean the whole round: L2 120 s, L3 90, L4 70, L5 55, L6 45, L7 36, L8 30; L1 none. Text updated (start panel, level-up message, Progress table). Tested: a 120 s clock read 118, 109, 108 and still 108 after a re-roll (no refill).
- **Effect measured (Amit):** with the old numbers as round totals the clock runs out in 32–54% of Amit's turns from level 2 up, and average points per turn fall to about 12–19 (before: 17–37). At 500 points that is roughly 30 rounds per game, so the default target or the clocks will need tuning.
- Next: the time bonus (earn by all five dice on one card; +50% of the allowance for yourself or −50% of someone's remaining time) is now much stronger; its open questions are with Ryan.

## 2026-10-17 (night) — The chart and calculations redone for the per-round clock, with the bonus columns
Ryan: redo the calculations with the clock now whole-round, and add columns that show what the bonuses add or take away. **How these were made:** Amit (the engine's bot, same decisions and costs as the table) played whole rounds at every level and stage, with the same dice and cards in every scenario. Columns: **base** = the round as it now works; **time bonus on yourself** = the clock ×1.5 (+50% of the allowance); **time bonus used on you** = the clock ×0.5 (−50%, used at the start of the round); **all-signs bonus wild** = one of the first five cards is a wild. Samples: addition 1,500 rounds per cell, subtraction 200, multiplication 90, division 60, so the later stages are rough (a difference of a few points can be noise). Amit's pace ("assumed s per cover") is a guess, not measured from people. The first-roll odds tables and the card-top tables did not change (they do not depend on the clock).
**Before, for comparison (old per-throw clock, addition, points per round):** L1 16.7, L2 20.1, L3 24.6, L4 23.7, L5 29.7, L6 35.0, L7 35.1, L8 37.4; the clock ran out in 0–6% of rounds. **Now:** see the first table (L8: 17.4 points, clock runs out in about half of rounds).

### Addition

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 30 | — | 3.1 | 1.1 | 15.2 | 0% | 17% | 33 | 70.4 | — | — | — | — | — | — |
| 2 | 120 s | 25 | 4.8 | 2.5 | 1.0 | 12.2 | 29% | 11% | 41 | 60.1 | +60 s | +3.3 | −60 s | −7.5 | — | — |
| 3 | 90 s | 20 | 4.5 | 2.3 | 1.0 | 12.9 | 37% | 8% | 39 | 43.9 | +45 s | +5.1 | −45 s | −8.2 | — | — |
| 4 | 70 s | 16 | 4.4 | 2.2 | 1.0 | 13.8 | 41% | 8% | 36 | 31.6 | +35 s | +7.0 | −35 s | −7.8 | — | — |
| 5 | 55 s | 13 | 4.2 | 2.1 | 1.0 | 14.9 | 45% | 6% | 34 | 23.2 | +28 s | +9.4 | −28 s | −8.1 | — | — |
| 6 | 45 s | 11 | 4.1 | 2.0 | 1.0 | 16.1 | 51% | 5% | 31 | 17.4 | +23 s | +11.6 | −23 s | −7.2 | — | — |
| 7 | 35 s | 9 | 3.9 | 1.8 | 1.0 | 17.0 | 53% | 4% | 29 | 12.9 | +18 s | +12.8 | −18 s | −7.3 | — | — |
| 8 | 30 s | 8 | 3.8 | 1.7 | 1.0 | 17.4 | 51% | 3% | 29 | 10.7 | +15 s | +13.2 | −15 s | −6.9 | — | — |

### Subtraction (this stage's clocks and Amit pace include its stretch factor)

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 39 | — | 2.8 | 1.2 | 13.0 | 0% | 29% | 39 | 127.5 | — | — | — | — | +9.5 | −12 pts |
| 2 | 155 s | 32.5 | 4.8 | 1.9 | 1.0 | 2.6 | 52% | 25% | 190 | 342.9 | +78 s | +5.7 | −78 s | −3.8 | −3.6 | −19 pts |
| 3 | 115 s | 26 | 4.4 | 1.6 | 1.0 | 2.9 | 48% | 20% | 172 | 219.1 | +58 s | +7.4 | −58 s | −1.5 | −4.8 | −19 pts |
| 4 | 90 s | 20.8 | 4.3 | 1.5 | 1.0 | 1.4 | 51% | 11% | 350 | 344.7 | +45 s | +9.4 | −45 s | +0.5 | −7.4 | −11 pts |
| 5 | 70 s | 16.9 | 4.1 | 1.4 | 1.0 | 2.9 | 52% | 12% | 173 | 134.0 | +35 s | +10.0 | −35 s | +0.8 | −7.6 | −12 pts |
| 6 | 60 s | 14.3 | 4.2 | 1.4 | 1.0 | 4.5 | 49% | 8% | 112 | 73.6 | +30 s | +9.2 | −30 s | +0.8 | −8.4 | −5 pts |
| 7 | 45 s | 11.7 | 3.8 | 1.2 | 1.0 | 1.5 | 54% | 5% | 337 | 166.3 | +23 s | +11.9 | −23 s | +3.3 | −9.0 | −5 pts |
| 8 | 40 s | 10.4 | 3.8 | 1.2 | 1.0 | 3.6 | 49% | 9% | 138 | 61.5 | +20 s | +11.0 | −20 s | +3.2 | −9.5 | −6 pts |

### Multiplication (this stage's clocks and Amit pace include its stretch factor)

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 48 | — | 2.9 | 1.2 | 40.9 | 0% | 18% | 12 | 58.8 | — | — | — | — | +19.3 | −9 pts |
| 2 | 190 s | 40 | 4.8 | 1.6 | 1.0 | 24.4 | 44% | 11% | 20 | 45.7 | +95 s | +5.7 | −95 s | −11.5 | −2.3 | −10 pts |
| 3 | 145 s | 32 | 4.5 | 1.5 | 1.0 | 32.2 | 59% | 6% | 16 | 26.7 | +73 s | +11.1 | −73 s | −11.9 | +0.6 | −4 pts |
| 4 | 110 s | 25.6 | 4.3 | 1.4 | 1.0 | 33.4 | 64% | 6% | 15 | 19.6 | +55 s | +16.6 | −55 s | −14.2 | −4.4 | −3 pts |
| 5 | 90 s | 20.8 | 4.3 | 1.4 | 1.0 | 43.8 | 60% | 4% | 11 | 11.7 | +45 s | +18.3 | −45 s | −12.2 | −8.1 | −3 pts |
| 6 | 70 s | 17.6 | 4.0 | 1.2 | 1.0 | 39.0 | 66% | 3% | 13 | 9.9 | +35 s | +25.3 | −35 s | −12.6 | −8.1 | −1 pts |
| 7 | 60 s | 14.4 | 4.2 | 1.4 | 1.0 | 46.9 | 70% | 4% | 11 | 7.7 | +30 s | +23.4 | −30 s | −14.5 | −8.2 | −2 pts |
| 8 | 50 s | 12.8 | 3.9 | 1.1 | 1.0 | 39.8 | 69% | 6% | 13 | 7.0 | +25 s | +33.6 | −25 s | −15.0 | −7.6 | −2 pts |

### Division (this stage's clocks and Amit pace include its stretch factor)

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 54 | — | 3.1 | 1.3 | 34.8 | 0% | 13% | 14 | 81.0 | — | — | — | — | +12.5 | −3 pts |
| 2 | 215 s | 45 | 4.8 | 1.9 | 1.0 | 12.3 | 63% | 10% | 41 | 111.7 | +108 s | +8.8 | −108 s | −8.3 | −0.8 | −8 pts |
| 3 | 160 s | 36 | 4.4 | 1.7 | 1.0 | 14.5 | 73% | 5% | 35 | 69.9 | +80 s | +13.1 | −80 s | −8.2 | −3.6 | −5 pts |
| 4 | 125 s | 28.8 | 4.3 | 1.5 | 1.0 | 13.1 | 73% | 3% | 38 | 59.5 | +63 s | +12.5 | −63 s | −6.0 | −3.3 | −3 pts |
| 5 | 100 s | 23.4 | 4.3 | 1.4 | 1.0 | 13.1 | 78% | 0% | 38 | 44.9 | +50 s | +17.8 | −50 s | −3.8 | −4.2 | +0 pts |
| 6 | 80 s | 19.8 | 4.0 | 1.3 | 1.0 | 14.0 | 87% | 3% | 36 | 33.9 | +40 s | +15.1 | −40 s | −2.1 | −1.7 | −2 pts |
| 7 | 65 s | 16.2 | 4.0 | 1.4 | 1.0 | 18.6 | 83% | 0% | 27 | 21.1 | +33 s | +15.0 | −33 s | −6.7 | −7.5 | +0 pts |
| 8 | 55 s | 14.4 | 3.8 | 1.1 | 1.0 | 9.6 | 87% | 5% | 52 | 31.8 | +28 s | +27.0 | −28 s | +3.8 | −2.4 | −2 pts |

**What the tables show**
- **Sets per round is about 1.0 from level 2 up:** at these clocks Amit almost never finishes even one full set of five cards before the clock runs out or he banks. A set needs five covers, and the clock only fits about four covers at his assumed pace (clock ÷ assumed seconds ≈ 4 by construction). Ryan's picture (an expert at 30 s gets a few sets; at 15 s about one) needs a pace of roughly 3 seconds per cover, not the 8 s assumed at level 8. Either the clocks should roughly double or triple, or the assumed pace is wrong; real timing from people is needed.
- **Games are long:** a 500-point game is 29–41 rounds in addition and often 100+ in subtraction, because points per round fell (addition L8: 37 → 17) and because the once-per-five-cards sign rule wipes a set when the clock runs out before the sign is used (most of the later-stage rounds score 0–5). Lower the default target or lengthen the clocks.
- **Time bonus value (addition, solid numbers):** +50% on yourself is worth +3 points per round at level 2 up to +13 at level 8 (+27% to +76%); used on you at the start it costs about 7–8 points per round at every level (−40% to −60%). Self-use is worth more than the attack at high levels (more time buys a second batch of covers; losing half the time costs less than that), so as designed the attack is the weaker use unless it is made bigger or lands early.
- **All-signs bonus wild (later stages):** for Amit, a guaranteed wild lowers busts (about 2–19 points of bust rate) but does not raise points; in these runs points per round fell 1–9 because the wild takes a number card's place and Amit only uses it when stuck. Its value is insurance and the all-dice-on-the-wild reroll, not points.
- Engine support added for this: `amitTurn(..., clockScale)` and it now also returns sets, covers and seconds. Local v1.16.

## 2026-10-17 (night, later) — Clocks recalibrated so every level scores about the same (local v1.17, not pushed)
**Ryan's goal:** an expert (level 8) and a mid-level player (level 4–5) should be equally competitive: the clocks shrink with level so higher skill does not turn into a runaway score. Ryan also pointed out the table rule that goes with it: **at a mixed table everyone plays the lowest stage present** (the expert plays subtraction if someone at the table is on subtraction), because multiplication and division carry bigger numbers; so equality only has to hold *within a stage*. That table rule is **not built yet** (today the Amit seats just play the stage the host picks).
**Method:** for every stage and level 2–8, Amit played whole rounds at eight clock sizes (0.1× to 4× the old clock), same dice and cards each time; the clock was solved so his points per round equal what the same stage gives at **level 1 with no clock** (the target). Clocks rounded to 5 s, kept shrinking as the level rises. Stored per stage in the engine (`STAGE_CLOCKS`).
**New round clocks (seconds):**

| Stage | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 |
|---|---|---|---|---|---|---|---|---|
| Addition | none | 190 | 120 | 80 | 60 | 45 | 30 | 25 |
| Subtraction | none | 290 | 200 | 135 | 100 | 80 | 65 | 55 |
| Multiplication | none | 280 | 150 | 90 | 60 | 40 | 30 | 25 |
| Division | none | 330 | 195 | 155 | 110 | 90 | 80 | 70 |

(Before: addition 120, 90, 70, 55, 45, 36, 30 for L2–L8; the later stages were the addition clocks stretched by 1.3 / 1.6 / 1.8.)
**Verification run at the new clocks (same method as above; samples: addition 1,500 rounds per cell, subtraction 200, multiplication 90, division 60):**

### Addition

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 30 | — | 3.1 | 1.1 | 15.2 | 0% | 17% | 33 | 70.4 | — | — | — | — | — | — |
| 2 | 190 s | 25 | 7.6 | 2.8 | 1.1 | 15.9 | 12% | 12% | 31 | 53.9 | +95 s | +2.8 | −95 s | −5.3 | — | — |
| 3 | 120 s | 20 | 6.0 | 2.7 | 1.0 | 17.7 | 19% | 9% | 28 | 37.0 | +60 s | +2.5 | −60 s | −6.7 | — | — |
| 4 | 80 s | 16 | 5.0 | 2.4 | 1.0 | 16.7 | 35% | 9% | 30 | 28.3 | +40 s | +4.4 | −40 s | −6.9 | — | — |
| 5 | 60 s | 13 | 4.6 | 2.2 | 1.0 | 17.1 | 42% | 7% | 29 | 21.3 | +30 s | +7.2 | −30 s | −8.2 | — | — |
| 6 | 45 s | 11 | 4.1 | 2.0 | 1.0 | 16.1 | 51% | 5% | 31 | 17.4 | +23 s | +11.6 | −23 s | −7.2 | — | — |
| 7 | 30 s | 9 | 3.3 | 1.7 | 1.0 | 16.8 | 58% | 4% | 30 | 12.0 | +15 s | +8.6 | −15 s | −11.1 | — | — |
| 8 | 25 s | 8 | 3.1 | 1.6 | 1.0 | 18.2 | 58% | 3% | 28 | 9.3 | +13 s | +5.9 | −13 s | −12.8 | — | — |

### Subtraction (this stage's clocks and Amit pace include its stretch factor)

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 39 | — | 2.8 | 1.2 | 13.0 | 0% | 29% | 39 | 127.5 | — | — | — | — | +9.5 | −12 pts |
| 2 | 290 s | 32.5 | 8.9 | 2.5 | 1.1 | 12.8 | 17% | 28% | 39 | 98.0 | +145 s | +1.6 | −145 s | −13.9 | +5.8 | −13 pts |
| 3 | 200 s | 26 | 7.7 | 2.1 | 1.0 | 13.1 | 13% | 22% | 38 | 67.8 | +100 s | +1.6 | −100 s | −15.0 | +7.0 | −15 pts |
| 4 | 135 s | 20.8 | 6.5 | 2.0 | 1.0 | 10.8 | 26% | 12% | 46 | 63.7 | +68 s | +7.1 | −68 s | −10.5 | +2.7 | −7 pts |
| 5 | 100 s | 16.9 | 5.9 | 1.9 | 1.0 | 13.0 | 32% | 13% | 39 | 41.0 | +50 s | +6.9 | −50 s | −11.5 | +2.0 | −11 pts |
| 6 | 80 s | 14.3 | 5.6 | 1.8 | 1.0 | 13.6 | 32% | 10% | 37 | 32.1 | +40 s | +5.8 | −40 s | −10.0 | +1.1 | −4 pts |
| 7 | 65 s | 11.7 | 5.6 | 1.7 | 1.0 | 13.6 | 28% | 6% | 37 | 25.6 | +33 s | +5.8 | −33 s | −9.7 | +0.5 | −5 pts |
| 8 | 55 s | 10.4 | 5.3 | 1.6 | 1.0 | 14.8 | 30% | 10% | 34 | 20.0 | +28 s | +5.9 | −28 s | −7.3 | −0.6 | −5 pts |

### Multiplication (this stage's clocks and Amit pace include its stretch factor)

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 48 | — | 2.9 | 1.2 | 40.9 | 0% | 18% | 12 | 58.8 | — | — | — | — | +19.3 | −9 pts |
| 2 | 280 s | 40 | 7.0 | 2.0 | 1.0 | 29.9 | 23% | 12% | 17 | 45.9 | +140 s | +7.2 | −140 s | −21.3 | +6.7 | −6 pts |
| 3 | 150 s | 32 | 4.7 | 1.6 | 1.0 | 33.5 | 56% | 6% | 15 | 27.0 | +75 s | +13.4 | −75 s | −12.5 | +5.1 | −4 pts |
| 4 | 90 s | 25.6 | 3.5 | 1.1 | 1.0 | 18.9 | 67% | 6% | 26 | 28.2 | +45 s | +24.5 | −45 s | −8.1 | −7.7 | −3 pts |
| 5 | 60 s | 20.8 | 2.9 | 1.0 | 1.0 | 26.4 | 68% | 4% | 19 | 15.1 | +30 s | +17.4 | −30 s | −22.4 | −2.8 | −4 pts |
| 6 | 40 s | 17.6 | 2.3 | 0.9 | 1.0 | 32.6 | 79% | 12% | 15 | 8.0 | +20 s | −3.0 | −20 s | −32.1 | −2.7 | +0 pts |
| 7 | 30 s | 14.4 | 2.1 | 0.7 | 1.0 | 32.4 | 88% | 28% | 15 | 5.1 | +15 s | −3.7 | −15 s | −32.4 | −2.4 | −1 pts |
| 8 | 25 s | 12.8 | 2.0 | 0.5 | 1.0 | 24.7 | 96% | 47% | 20 | 3.9 | +13 s | +6.9 | −13 s | −24.7 | +1.6 | −3 pts |

### Division (this stage's clocks and Amit pace include its stretch factor)

| Level | Round clock | Assumed s per cover | Covers that fit | Amit: covers / round | Amit: sets of 5 cards | Points / round | Clock ran out | Bust | Rounds to 500 | Minutes per 500-pt game | Time bonus on yourself: + seconds | Δ points / round | Time bonus used on you: − seconds | Δ points / round | All-signs bonus wild: Δ points / round | Δ bust |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | none | 54 | — | 3.1 | 1.3 | 34.8 | 0% | 13% | 14 | 81.0 | — | — | — | — | +12.5 | −3 pts |
| 2 | 330 s | 45 | 7.3 | 2.5 | 1.0 | 20.0 | 33% | 15% | 25 | 93.2 | +165 s | +11.2 | −165 s | −19.5 | +5.0 | −12 pts |
| 3 | 195 s | 36 | 5.4 | 2.0 | 1.0 | 19.6 | 62% | 5% | 26 | 61.8 | +98 s | +15.3 | −98 s | −19.4 | +0.4 | −3 pts |
| 4 | 155 s | 28.8 | 5.4 | 1.9 | 1.0 | 21.6 | 65% | 3% | 23 | 45.8 | +78 s | +13.4 | −78 s | −15.8 | +1.4 | −2 pts |
| 5 | 110 s | 23.4 | 4.7 | 1.7 | 1.0 | 21.6 | 78% | 0% | 23 | 33.0 | +55 s | +17.8 | −55 s | −13.3 | −2.4 | +0 pts |
| 6 | 90 s | 19.8 | 4.5 | 1.6 | 1.0 | 21.8 | 83% | 3% | 23 | 26.9 | +45 s | +18.2 | −45 s | −12.4 | −2.7 | −2 pts |
| 7 | 80 s | 16.2 | 4.9 | 1.8 | 1.0 | 31.6 | 75% | 0% | 16 | 17.3 | +40 s | +18.7 | −40 s | −19.5 | −0.9 | +0 pts |
| 8 | 70 s | 14.4 | 4.9 | 1.7 | 1.0 | 40.2 | 85% | 5% | 12 | 11.9 | +35 s | +20.3 | −35 s | −23.2 | −1.9 | −2 pts |

**How well it equalised:** addition 15.2–18.2 points per round across all eight levels (within about 15% of each other, solid sample). Subtraction 10.8–14.8 (decent). **Multiplication and division are not yet equal** (multiplication 19–34 against 41 at level 1; division 20–40), and that is mostly noise: with these sample sizes the level-1 target itself moved between 32 and 41 across two runs. At the shortest multiplication clocks Amit gets only 0.5–1 covers in the round, the clock runs out in 79–96% of rounds, and busts climb to 28–47% (the once-per-five-cards sign rule forces him to keep rolling with few dice). Those cells need a larger run (a few hundred rounds each, about 40 minutes of computing) before the later-stage clocks can be trusted.
**Time bonus (addition, solid):** +50% on yourself adds +2.5 to +11.6 points per round; used on you at the start it costs 5 to 13 points. At the lowest clocks the attack costs more than the self-bonus gains (level 8: +5.9 against −12.8), so the attack becomes the stronger use as the level rises, the opposite of what the first table showed with the old clocks.
**All-signs bonus wild:** for Amit it mostly lowers busts (up to about 15 points of bust rate in subtraction) and adds a few points where clocks are long; where clocks are tight it does not help points.

## 2026-10-17 (night, last) — new clocks live, with the teaching updated (v1.18)
Ryan: implement the new timing, no more calculating, and update the teaching and how-to-play so everyone knows. The clocks above are in the engine (`STAGE_CLOCKS`) and the game uses them; checked in the browser (e.g. addition L2 shows 190 s, multiplication L8 25 s, division L8 70 s). Teaching: a new **"The round clock"** step in the Addition lesson (step 7 of 12) and in the Subtraction, Multiplication and Division lessons, each listing that stage's real clocks, saying the clock is for the whole round and shrinks with level so levels stay fair, what happens when it runs out (covered cards count; a set without the stage's sign scores nothing), and that Complete & bank ends the round early. The Progress page's level table has the same explanation. The "lowest stage at the table" rule is not taught because it is not built yet.

## 2026-10-17 (night) — the time bonus is built (local v1.19, not pushed)
Ryan (from his practice round, where he put all five dice on one card with every sign): the time bonus must appear in practice as well as real play, with a message that it can be used on yourself or against someone else, and Learn must describe it explicitly.
**Rules built (the open questions were answered with the defaults I proposed; tell me if any is wrong):**
- **Earn:** all five dice on one card, a wild included (the wild is then used up, the player's choice). Taking that cover back removes the bonus. One earned per round, one held at a time, kept from round to round until used. Earned at every level and in practice; level 1 has no clock, so the message says it starts to matter at level 2.
- **Message:** "⏱ TIME BONUS initiated" banner plus a line explaining the two uses; a gold **⏱ TIME BONUS** box under the sign keys with **+50% time for me** and **Use on a player…** (only shown to the holder; nobody else's screen shows it).
- **On yourself:** +50% of the round's original allowance, added to the running clock (tested: 286 s became 431 s on subtraction level 2, +145). **On a player:** takes 50% of their remaining time; with several players a chooser lists them (tested). Only while a clock is running.
- **Amit seats** earn bonuses too (all five dice on one card), cancel yours 70% of the time if they hold one (both spent), use theirs on themselves when their clock is low, or on you when they are not behind and you are mid-round. When one is used on you and you hold one, a box lets you **cancel it** (both spent) or take the hit; the clock pauses while it is open.
- **Learn:** a "The time bonus" step in the Addition lesson and in the Subtraction, Multiplication and Division lessons. Engine: `fiveDiceCovers` flag and `timeBonus` result; 66 tests pass.
**Not done / open:** real players cannot be targeted yet (needs the Rol_ tables); the "lowest stage at the table" rule; whether wilds should earn it (built as Ryan said, yes).

## 2026-10-17 (night, later) — the time bonus now depends on the level (local v1.20, not pushed)
**Ryan:** the 50% was not fair across levels (50% more time means a lot more to an expert than to a beginner who just does not know how to add yet). Use my scale, and make the attack its mirror: a hit takes 100% minus that level's gain. At levels 1 and 2 the bonus is an extra hint, and there is nothing to take from them.
| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Using it on yourself: gain, as a share of your round's clock | +1 hint | +1 hint | 85% | 70% | 55% | 45% | 40% | 35% |
| Used on a player of this level: they lose, of their remaining time | nothing | nothing | 15% | 30% | 45% | 55% | 60% | 65% |
- Built (`E.timeBonus(level)`): the button reads "+35% time for me" or "+1 hint for me" by level; a hit takes the share for the *target's* level (the chooser shows each player's share and leaves out level 1–2 players); Amit seats at level 3 and up follow the same table when they use theirs; when a seat hits you it takes your level's share and you can still cancel it with your own. Learn (all four lessons), the Practice start panel and the Progress page (new table) all state the new rules. Tested: level 5 subtraction gained +55 s (96 → 151); level 2 gave +1 hint (5 → 6); 67 engine tests pass.
- Not simulated yet: how much these percentages are worth in points (the earlier sims used a flat 50%); they are Ryan's and my first scale to tune.

## 2026-10-17 (night, last) — Rerun with the level-based time bonus and the wilds: how the bonuses play out
Ryan: rerun the calculations and show how the bonuses (wild, time) work into play, since all five dice cannot go on one card every time. Two measurements, both with Amit and the clocks above. **A** forces the time bonus at the start of a round (with the new level shares) to show what it is worth. **B** plays whole 12-round games with the bonuses off and on, and counts how often Amit actually earns each one. Samples: addition 1,200 rounds per cell (A) / 150 games (B); subtraction 150 / 30; multiplication 70 / 16; division 40 / 10 — the later stages are rough. Amit never hunts the time bonus (he only earns it when his best play happens to use all five dice); he does hunt the all-signs wild at higher skill. Level 1–2 time bonuses are hints, which Amit does not use, so they show no effect here.

#### A. What the time bonus is worth when it is used at the start of a round (Ryan's level-based shares)

**Addition**

| Level | Round clock | Base points / round | On yourself: share of clock → Δ points | Δ as % of base | Used on a player of this level: share of their remaining time → Δ points | Δ as % of base |
|---|---|---|---|---|---|---|
| 3 | 120 s | 18.0 | +85% → +4.2 | +23% | −15% → −3.1 | −17% |
| 4 | 80 s | 16.8 | +70% → +6.0 | +36% | −30% → −3.9 | −23% |
| 5 | 60 s | 16.7 | +55% → +7.1 | +43% | −45% → −4.7 | −28% |
| 6 | 45 s | 15.7 | +45% → +11.4 | +72% | −55% → −9.6 | −61% |
| 7 | 30 s | 16.8 | +40% → +5.8 | +35% | −60% → −15.6 | −93% |
| 8 | 25 s | 17.8 | +35% → +1.9 | +11% | −65% → −18.5 | −104% |

**Subtraction**

| Level | Round clock | Base points / round | On yourself: share of clock → Δ points | Δ as % of base | Used on a player of this level: share of their remaining time → Δ points | Δ as % of base |
|---|---|---|---|---|---|---|
| 3 | 200 s | 11.7 | +85% → +4.6 | +40% | −15% → −3.4 | −29% |
| 4 | 135 s | 11.8 | +70% → +6.3 | +53% | −30% → −6.4 | −54% |
| 5 | 100 s | 12.2 | +55% → +7.1 | +58% | −45% → −12.0 | −98% |
| 6 | 80 s | 12.9 | +45% → +6.1 | +47% | −55% → −6.8 | −53% |
| 7 | 65 s | 14.9 | +40% → +4.1 | +28% | −60% → −7.5 | −51% |
| 8 | 55 s | 14.4 | +35% → +4.2 | +29% | −65% → −9.4 | −65% |

**Multiplication**

| Level | Round clock | Base points / round | On yourself: share of clock → Δ points | Δ as % of base | Used on a player of this level: share of their remaining time → Δ points | Δ as % of base |
|---|---|---|---|---|---|---|
| 3 | 150 s | 33.1 | +85% → +16.5 | +50% | −15% → −16.4 | −50% |
| 4 | 90 s | 25.5 | +70% → +25.0 | +98% | −30% → +4.7 | +18% |
| 5 | 60 s | 28.9 | +55% → +16.8 | +58% | −45% → −18.3 | −63% |
| 6 | 40 s | 38.4 | +45% → −8.0 | −21% | −55% → −38.4 | −100% |
| 7 | 30 s | 33.5 | +40% → −2.0 | −6% | −60% → −33.5 | −100% |
| 8 | 25 s | 28.2 | +35% → +5.7 | +20% | −65% → −28.2 | −100% |

**Division**

| Level | Round clock | Base points / round | On yourself: share of clock → Δ points | Δ as % of base | Used on a player of this level: share of their remaining time → Δ points | Δ as % of base |
|---|---|---|---|---|---|---|
| 3 | 195 s | 13.8 | +85% → +19.8 | +143% | −15% → +1.4 | +10% |
| 4 | 155 s | 22.6 | +70% → +23.2 | +102% | −30% → −15.6 | −69% |
| 5 | 110 s | 22.0 | +55% → +17.2 | +78% | −45% → −17.2 | −78% |
| 6 | 90 s | 27.5 | +45% → +3.8 | +14% | −55% → −14.4 | −52% |
| 7 | 80 s | 42.7 | +40% → +12.5 | +29% | −60% → −29.7 | −70% |
| 8 | 70 s | 30.7 | +35% → +14.4 | +47% | −65% → −25.1 | −82% |

#### B. How the bonuses play out over whole 12-round games (Amit, bonuses off vs on)
Amit earns the time bonus only when his normal best play happens to use all five dice on one card, uses it on himself when under 45% of his clock is left, and earns the all-signs wild only when his normal play finds one (more often at higher skill).

**Addition**

| Level | Points / round, bonuses off | Points / round, bonuses on | Difference | Rounds that earn a time bonus | Rounds that earn the all-signs wild | Time bonus used (rounds) | Average seconds added |
|---|---|---|---|---|---|---|---|
| 1 | 15.6 | 15.6 | +0.0 | 0% | — | 0% | 0 s |
| 2 | 16.0 | 16.0 | +0.0 | 0% | — | 0% | 0 s |
| 3 | 17.6 | 17.9 | +0.3 | 3% | — | 3% | 102 s |
| 4 | 17.0 | 17.1 | +0.1 | 2% | — | 2% | 56 s |
| 5 | 16.9 | 17.2 | +0.3 | 4% | — | 4% | 33 s |
| 6 | 16.4 | 17.3 | +0.8 | 7% | — | 7% | 20 s |
| 7 | 17.2 | 19.2 | +2.0 | 8% | — | 8% | 12 s |
| 8 | 18.7 | 21.2 | +2.6 | 11% | — | 11% | 9 s |

**Subtraction**

| Level | Points / round, bonuses off | Points / round, bonuses on | Difference | Rounds that earn a time bonus | Rounds that earn the all-signs wild | Time bonus used (rounds) | Average seconds added |
|---|---|---|---|---|---|---|---|
| 1 | 12.4 | 22.8 | +10.4 | 0% | 75% | 0% | 0 s |
| 2 | 14.1 | 18.1 | +4.1 | 0% | 66% | 0% | 0 s |
| 3 | 12.9 | 20.5 | +7.6 | 35% | 86% | 35% | 170 s |
| 4 | 10.8 | 20.0 | +9.2 | 32% | 89% | 32% | 94 s |
| 5 | 12.6 | 23.3 | +10.7 | 39% | 83% | 39% | 55 s |
| 6 | 14.6 | 23.0 | +8.3 | 37% | 87% | 37% | 36 s |
| 7 | 14.7 | 25.8 | +11.1 | 44% | 95% | 44% | 26 s |
| 8 | 15.2 | 20.1 | +4.9 | 42% | 96% | 41% | 19 s |

**Multiplication**

| Level | Points / round, bonuses off | Points / round, bonuses on | Difference | Rounds that earn a time bonus | Rounds that earn the all-signs wild | Time bonus used (rounds) | Average seconds added |
|---|---|---|---|---|---|---|---|
| 1 | 32.8 | 51.6 | +18.8 | 0% | 48% | 0% | 0 s |
| 2 | 32.2 | 35.4 | +3.2 | 0% | 55% | 0% | 0 s |
| 3 | 30.4 | 44.0 | +13.6 | 54% | 54% | 53% | 128 s |
| 4 | 21.3 | 35.5 | +14.2 | 52% | 76% | 52% | 63 s |
| 5 | 27.0 | 47.7 | +20.7 | 58% | 78% | 58% | 33 s |
| 6 | 33.2 | 23.8 | −9.4 | 46% | 68% | 46% | 18 s |
| 7 | 34.9 | 24.8 | −10.1 | 39% | 65% | 39% | 12 s |
| 8 | 29.3 | 19.2 | −10.1 | 33% | 46% | 33% | 9 s |

**Division**

| Level | Points / round, bonuses off | Points / round, bonuses on | Difference | Rounds that earn a time bonus | Rounds that earn the all-signs wild | Time bonus used (rounds) | Average seconds added |
|---|---|---|---|---|---|---|---|
| 1 | 21.8 | 28.1 | +6.2 | 0% | 10% | 0% | 0 s |
| 2 | 22.2 | 22.8 | +0.7 | 0% | 24% | 0% | 0 s |
| 3 | 19.5 | 37.5 | +18.0 | 64% | 23% | 64% | 166 s |
| 4 | 19.4 | 42.2 | +22.8 | 68% | 39% | 68% | 108 s |
| 5 | 24.0 | 37.1 | +13.1 | 70% | 58% | 70% | 61 s |
| 6 | 27.4 | 35.4 | +8.0 | 87% | 74% | 87% | 41 s |
| 7 | 31.9 | 50.2 | +18.3 | 86% | 73% | 86% | 32 s |
| 8 | 36.7 | 51.0 | +14.3 | 85% | 65% | 85% | 25 s |

**What it shows**
- **Addition:** all five dice on one card is rare (a first roll can do it 1% of the time at level 1, 3% at level 4, 12% at level 8), and Amit earns the time bonus in only 2–11% of rounds from level 3; the effect is small (+0.1 to +2.6 points per round). There is no all-signs bonus in addition.
- **Later stages:** the five-dice cover is common (a first roll can do it 83–100% of the time), and Amit earns the time bonus in 30–87% of rounds (division 64–87%), plus the all-signs wild in 46–96% of rounds (subtraction 66–96%, because a cover that uses a minus after a plus already earns it). With the bonuses on he scores +4 to +23 points more per round (about +30% to +120%); the exception is multiplication levels 6–8 (about −10) where the tight clocks and the extra wild take time and a number card's place.
- **The level shares:** used on yourself the gain is worth +11% to +72% of base points in addition (more for levels 4–6, little at level 8 where +35% is only 9 seconds); used on a player it costs 17% (level 3) up to the whole round at levels 7–8, so a hit on an expert stops them and a hit on a level 3 barely matters.
- **So:** in addition the bonuses are occasional treats; in the later stages they are close to routine unless earning is made harder.

## 2026-10-17 (night, last) — wild frequency, hints show the combination, all-signs bonus decision (local v1.21, not pushed)
- **Wild frequency:** it was set to 4% **per card**, which is about 18.5% of sets of five cards (a wild in roughly one set in five or six), so Ryan saw one in both his test runs. Now 0.6% per card = **about 3% of sets** (measured 2.95% over 200,000 deals), within the 2–4% Ryan wanted. The earned bonus wild is separate and unchanged. (The clock calibration and bonus simulations above used the old 4% per card; they should shift a little with far fewer wilds.)
- **Hints show how:** Help from Amit (and the walk-through) now put the suggested dice into the calculation row, in order, with their signs and "= value" (for example 7 − 3 − 3 = 1), and light the card, instead of only blinking dice. Works in every stage and also at levels without running totals. Tested in addition, subtraction and division.
- **All-signs bonus: Ryan's decision — keep it as it is, including the easy subtraction version.** He considered removing it for addition and subtraction, then decided against it: at a mixed table the lower-stage players (who all play the lowest stage present) should be able to earn it more often, so they are not left behind by an expert who plays at a higher level. Addition has none because it has only one sign.

## 2026-10-17 (night, last) — practice screen: no target, a level picker, and an hourglass timer (local v1.22, not pushed)
Ryan (from a practice round): practice is not played to 500, so that box goes; show the level and let him choose it, with the restraints of each level; set the signs by level; show a timer by level that looks like an hourglass with a real countdown under it, and bring the time bonus into it so players can see what it does.
- **Built:** a solo practice game has no target (no "Play to" box, header says PRACTICE, rounds go on until you leave; challenge games and games against Amit seats still play to a target). The Play-to picker on the start panel only appears when you pick opponents. A **Level** chip replaces it: in solo practice it is a dropdown (L1–L8; applies right away if you have not covered a card, otherwise from the next round). The start panel's level picker is now "Practise at level" and shows a line for the chosen level (clock, hints on/off, helps, card range, who keeps score).
- **Hourglass:** the ring is gone. A gold hourglass shows the sand running down, with the countdown under it (m:ss); it goes red in the last 10 seconds, and shows "∞" and a static glass at level 1. A time bonus makes it glow gold with a floating "+170 s" and a longer countdown; a hit shows a red "−12 s". Tested: level 5 subtraction showed 1:38, counted to 1:33; choosing level 3 restarted at 3:18; a time bonus of +85% took 3:16 to 6:06.
- **Not built (waiting on Ryan):** choosing which signs you can practise by the level you pick (level 1 cannot use division). That would tie the stage to the level instead of keeping separate levels per stage; options put to Ryan.

## 2026-10-17 (night, last) — one level for everything, a level picker with a box for each level, and a score penalty (local v1.24, not pushed)
**Ryan:** (1) at the self-scoring levels the player is asked "What is your score?" when they bank; a wrong total counts against them by the difference. (2) In practice the player picks the level from tiles across the top; each tile shows what that level offers (signs, time, bonuses and so on). Because a level now has to say which signs it gives, the stage is tied to the level (the option I put to Ryan; his messages assumed it).
- **Score penalty:** from level 4 (`selfScore`) the bank sheet asks "What is your score?" once (the second try is gone); a wrong total costs the difference, subtracted from the game score; the result sheet says "You said X; the real score was Y; the difference, D, counts against you". Progress keeps the right and wrong counts and the points lost. (Also fixed a bug that hid the all-signs note on the result sheet.)
- **One level, signs unlock with it:** levels 1–2 add; 3–4 subtract; 5–6 multiply; 7–8 use all four signs. One experience track for every stage (old per-stage experience is added together on first load). A level 7 player can still practise any earlier stage (the symbol buttons below the tiles, locked above the level's stage). The level-up message names newly unlocked signs. Amit seats still play at the lowest human level. The in-game level chip follows: choosing a level changes the signs.
- **Picker:** eight tiles (L1–L8) with the signs and the round clock on each; pointing at or choosing a tile fills a box with its signs, time, help, card range, scoring and bonuses (the time bonus and the all-signs bonus for that level). Tested: 8 tiles, level 3 locks multiplication and division, level 7 gives all four signs and a 1:18 clock, the in-game chip switches to level 2 addition; the cover test passes at every level. 67 engine tests pass.
- **Still open:** the old per-stage clock calibrations are used unchanged (only the matching level/stage pairs and the lower stages at higher levels are reachable). Real players and the mixed-table rule need the Rol_ tables.

## 2026-10-17 (night, last) — every round starts with an answer (local v1.25, not pushed)
Ryan did a multiplication round where nothing could be covered (dice 1, 1, 1, 4, 6: the most possible was 29, the lowest card 31) and asked that every round, in every stage, always have at least one answer. He then added that the game may already handle it, since he only saw it after the round was over. **What was true before:** the game did notice, but by declaring an immediate **bust** on the opening throw (score 0 for the round), not by preventing it. **Now:** the opening throw of every round, and the throw that comes with every fresh set of five cards after all five are cleared, is rolled again until at least one number card (a wild does not count) can be covered. A later throw you choose to make (re-rolling the dice you have left) can still bust: that is the risk of rolling. Tested in all four stages at all eight levels (25 seeds each) plus fresh sets; 68 engine tests pass. Easy to switch back if Ryan wants opening busts to stay possible.
