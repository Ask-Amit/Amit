# Amit Hub — Project Context

## Folder Confirmation
If you are reading this file, you are in the correct folder: `C:\Users\user1\OneDrive\Documents\Amit\Hub\`
All Hub development files belong here. Do not create Hub files anywhere else.

> **ACCURACY NOTE:** Architecture, witness design, and theology sections below are authoritative and current. Build history reflects Session 4 only — Hub has been significantly developed through Sessions 5–12. For current build state, pending tasks, and WHERE WE LEFT OFF: read the root CLAUDE.md. Do not rely on the "IMMEDIATE NEXT TASK" or "Next priorities" sections — they are outdated and removed below.

## AUDIT FINDINGS — 2026-06-08 (Session 17)

Issues found in this file during cross-folder review. Address before next Hub build:

- **This file must be rewritten.** "What Is Built" stops at Session 4. Sessions 5–12 added the entire Morning Altar, Pursuits panel, rolling due dates, Ask Amit panel, Word for Today, sidebar language changes, calendar readability fixes. None of it is here. The file has an accuracy note warning you not to trust itself — that is not a CLAUDE.md doing its job. Rewrite needed.
- **Line 18 is stale.** "Sessions 10+11 changes are local only — PUSH STILL PENDING." Multiple pushes have happened since. This is no longer accurate.
- **Tool Launch Panels section says "Bible Companion."** Same file documents it was renamed to "Amit." Inconsistency in this file.
- **Ask Amit URL is dead.** The Claude.ai Project was deleted by Ryan. Every "Ask Amit" button in amit-hub.html points to a broken link. All users get a dead end. Fix: recreate the Project at claude.ai → paste Amit_Deploy.md into Instructions → update AMIT_PROJECT_URL constant in the HTML.
- **Session state section (lines 90–133) is a June 2 snapshot.** Describes what was built in Session 4. Completely superseded. Keep the Hebrew calendar architecture sections (still accurate and authoritative) — remove or replace the session state section.

## Read Every Session
Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents\Amit\Amit_Testimony.md` — Amit's full identity, theological conclusions, growth log
2. `C:\Users\user1\OneDrive\Documents\Amit\Amit_RyanProfile.md` — Ryan's profile, how he communicates, the partnership covenant
3. `C:\Users\user1\OneDrive\Documents\Amit\CLAUDE.md` — task list, WHERE WE LEFT OFF, all behavioral directives, system context

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md. They are not repeated here.

## Current Version
v1.01 on GitHub. Sessions 10+11 changes are local only — PUSH STILL PENDING.
Live: https://ask-amit.github.io/Amit/Hub/amit-hub.html

## Pending Work
All Hub pending items are tracked in the root CLAUDE.md task list. Search for "Hub:" to find them.
Do NOT maintain a separate task list here.

This is the Amit Hub. The daily home screen. The entry point for everything.

## What This Is
The Hub is the face of the entire Amit system. Free to everyone. When someone installs Amit, this is what they see first — every morning, every day.

## Current Build File
`amit-hub.html` — self-contained, opens in any browser, no server required. All state in localStorage.

## What Is Built (as of 2026-06-02)

### Layout
- Sidebar with tiles: Home, Calendar, To-Do, Word for Today, Mail, Who Is God, Bible Companion, Computer Value, BOSStimator
- Main panel area — each tile opens a full panel
- Header with greeting and clickable date/time (opens Calendar)
- Responsive: sidebar collapses to icon-only below 768px

### Home Panel
- Morning greeting by name (good morning/afternoon/evening)
- Live date/time clock (updates every 15s)
- Stat cards: Overdue count (red), Due Today (orange), Total Active (gold) — click to jump to that tab
- Daily verse with click-to-expand reflection panel

### To-Do Panel
- Full task list with tabs: All, My Day, Inbox, Starred, Overdue, Due Today, P1–P2
- Search, sort (smart/alpha/created/priority/due), category filter
- Grouped view: Overdue → Due Today → Critical → Starred → Upcoming
- Quick-add bar at bottom (Enter to add)
- Inline **＋** button appears on task hover — opens modal to add a new task without hunting for the button
- Full task modal: title, notes, category/subcategory, due date/time, priority 1–10, recurring, starred, My Day, subtasks, tags, voice input
- Priority color coding: P1–P2 red, P3–P4 orange, P5–P6 gold, P7–P8 blue, P9–P10 dim
- Done section (collapsible), delete with confirm
- Keyboard shortcut: N = new task

### Calendar Panel
- Full month grid — 7 columns, always 6 rows
- **Adjacent month days shown** in grayed-out cells (no blank empty cells) — clicking navigates to that month
- **Priority-colored chips**: P1–P2 red, P3–P4 orange, P5–P7 yellow, P8–P10 green; past days always red; today orange
- **White text on all chips** — fully readable
- **Click chip → opens edit modal** for that task directly (no intermediate step)
- **Slide animation** on month change (left/right)
- **Swipe gesture** on mobile — swipe left = next month, swipe right = prev month
- Overdue banner at top showing overdue tasks from any prior month
- Day detail panel on right — shows all tasks for selected day, Add Task for that date button
- "Today" button in header to jump back
- Date/time in main header (top right) clicks to open calendar
- Calendar tile in sidebar shows task count for current month

### Mail Panel
- Multi-account: Gmail, Outlook, Yahoo, iCloud, Hotmail, AOL, ProtonMail, GMX, Yandex, Mail.com, Zoho, Other
- Add/remove accounts; each shows provider badge, inbox link, compose link
- Mail-tagged tasks show at bottom

### Tool Launch Panels
- Who Is God → opens `../who_is_god/who_is_god.html`
- Bible Companion → opens `../Companion/Amit_Companion.html`
- Computer Value → "Coming Soon"
- BOSStimator → "Coming Soon"

## What Is NOT Built Yet

- Weather (still needs API key or open weather source)
- Push/browser notifications for due tasks
- "My Day" auto-suggestions (tasks due today auto-added to My Day)
- Sharing/export of task list

## Session State — Where We Left Off (2026-06-02, session 4)

### What was built this session:

**Three-Calendar System — COMPLETED:**
All three calendar types are now fully functional:
- **Biblical · Torah** — Leviticus 23 Moedim, Shabbat on Saturday, existing FEAST_DATA + algorithmic engine
- **Rabbinic** — Full algorithmic holiday calculation: Rosh Hashanah, Hanukkah, Purim, Tisha B'Av, Tu BiShvat, Lag B'Omer, Tu B'Av, Simchat Torah, Yom HaShoah, Israeli national holidays (Yom HaZikaron, Yom HaAtzmaut, Yom Yerushalayim), all minor fasts (Tzom Gedaliah, Asara BeTevet, Ta'anit Esther, 17 Tammuz) with Shabbat-deferral logic
- **Priestly · Enoch** — Full 364-day solar calendar. New Year = Wednesday on or before March 20 each year. Month structure: 30,30,31 × 4 quarters. Shabbat = days 7,14,21,28 of each month (fixed position, not tied to Saturday). Reckoning days on Day 31 of months 3,6,9,12. All Moedim shown on their Enoch-calendar positions.

**FEAST_DETAIL Extended:**
13 new entries added: rosh-hashana, hanukkah, purim, tisha-bav, fast-day, tu-bishvat, israel-day, lag-bomer, tu-bav, simchat, yom-hashoah, enoch-newyear, enoch-rest. Each with full what/tonight/yeshua/verse fields.

**Day Detail Panel — Living Daily Teaching:**
- Shows both Gregorian date (left) and active calendar date (right) with calendar type name
- Omer count during Omer period (days 1–49): shows day number, week, day-of-week within week, and Sefirot theme for the week
- Shabbat block: explains Shabbat with Psalm 92 and 93 references, candle-lighting tradition, Kiddush, Challah
- Enoch Shabbat: explains the fixed-position Shabbat principle
- Event block: clickable, shows first 130 chars of what-is-this plus "tap to go deeper" prompt
- "Add Aim" button (renamed from "Add Task")

**Double-Click Day View — Dual Date:**
Title bar now shows both Gregorian date and the active calendar date (e.g., "Tuesday, June 2, 2026 · 6 Sivan · Hebrew")

**Naming changes:**
- "To-Do List" → "My Aims" (sidebar tile, panel heading, add button)
- "Bible Companion" → "Amit" (sidebar tile, panel heading, launch button)
- "Amit Health" → "Health" (sidebar tile, panel heading)
- Task icon → 🎯 for My Aims tile

**Amit Introduction Screen:**
- Full-screen overlay triggered when user clicks Who Is God, Amit, or Health for the first time
- Shows the full story: who Amit was, the question, what the evidence produced, the name story, the conclusion, the probability
- "I Understand — Walk Alongside →" button proceeds to the selected tool
- "Don't show this again" checkbox stores in localStorage

**My Aims — Completed filter:**
- New "Completed" tab shows all completed aims sorted by completion date (most recent first)
- Each completed aim now shows a green pill: "✓ Completed [Month Day, Year]"

**Email multi-account fix (discussed, not yet built):**
- Problem: multiple Gmail accounts link to same inbox
- Solution: add Account # field (Gmail uses `/u/0/`, `/u/1/` in URL for multi-account)

---

## HEBREW CALENDAR — CURRENT ARCHITECTURE (Ryan's final directive, session 3)

### ONE grid. ONE cell. TWO sides:

**LEFT side of each calendar cell** — Gregorian (world's lens):
- Day number: large, black, top-left
- Task chips: priority-colored, below the number
- Plain. Functional. The world's calendar.

**RIGHT side of each calendar cell** — Hebrew/Messianic (Yahweh's lens):
- Hebrew day number: dark gold, top-right
- Hebrew month name: italic gold, below number (shown on 1st, 15th, feast days, today)
- Shabbat label: shown on all Saturdays — dark gold, small, bottom-right
- Feast chip: colored chip when feast day — clickable → full explanation modal

**Saturday cells** — warm cream-gold background tint (visible before reading anything)

**Calendar type selector** (top of calendar):
- Biblical · Torah — Nisan = Month 1, Leviticus 23
- Rabbinic — Full algorithmic holiday calculation (built Session 4)
- Priestly · Enoch — Full 364-day solar calendar (built Session 4)

**The witness principle:**
The person opens the Hub to manage their day. Every day they see two numbers in every box. Over weeks they start to notice the right side. They click a feast chip. They read what Passover is. "Tonight at sundown the Seder begins. Here is what they would be doing. Here is what Yeshua did at this same table the night before he died." They were not lectured. They bore witness. That is the design.
- Clicking a Hebrew calendar day → shows what this day means in the Messianic/Hebrew context
- Clicking a feast day chip → opens explanation: what it is, why Yahweh established it, how it points to Yeshua, link to who_is_god.html

### Cell layout (within each day, both panels):
```
Left panel cell:          Right panel cell:
[1]                       [Sivan 7]
[task chip]               [Shabbat] or [feast chip]
```

### "What is this calendar?" button:
In the Hebrew panel header. Opens a modal explaining:
- The Hebrew calendar is the calendar Yahweh gave — lunar/solar, tied to creation
- The Gregorian calendar is a Roman replacement (Julius Caesar / Pope Gregory)
- Every feast on this calendar points to Yeshua — spring feasts = first coming, fall feasts = second coming
- Link to who_is_god.html → Bible Companion
- This is the on-ramp for someone who has never thought about this before

### The witness principle (build to this standard):
Someone using this as a plain productivity hub will, over months of use, bear witness that there is a calendar system running underneath the one the world uses — and that it all speaks to Yeshua. That is the intended effect. Not a lesson forced on them. A pattern revealed naturally, daily, as they live their life.

### VISUAL THEOLOGY — The Two Panels Must Look Different (Ryan's directive, 2026-06-02):
The contrast between the two panels is not cosmetic. It is theological. They represent two ways of seeing the same day.

**Left panel (Gregorian) — the world's lens:**
Plain. Functional. Familiar. Muted tones. The calendar the world uses, unaware it is tracking the wrong thing. Design it as the ordinary world looks — clean, readable, nothing remarkable.

**Right panel (Hebrew/Messianic) — Yahweh's lens:**
Warmer. Richer. Ancient and alive. Parchment tones, gold accents. The calendar Yahweh gave — where every feast is a prophetic marker and every Sabbath is a declaration. Design it so that even someone who does not know what they are looking at senses that this side carries more weight.

**The declaration this build is made under:**
"The events that will happen in life on that date will bear witness to what's happening in the background — the supernatural — because God will make those days always line up, because that is who He is. We are building this in faith. A declaration of what's to come is just viewing it with two different glasses on each side. And God will show up." — Ryan, 2026-06-02

Build the visual contrast to honor that declaration. The difference between the two sides should be visible before a word is read.

### Sabbath identification:
- **Saturday column** = the Sabbath (Shabbat). Mark it distinctly — different header color, subtle cell tint, or a small "Shabbat" label.
- Ryan confirmed: the Sabbath is the 7th day, Saturday. This is non-negotiable in Amit's theology.

### Hebrew Feast Days (God's Appointed Times — Moedim):
These must appear on the calendar as special markers. Ryan confirmed these in who_is_god.html. They are Yahweh's appointed times per Leviticus 23:
- **Passover** (Pesach) — 14 Nisan
- **Unleavened Bread** (Chag HaMatzot) — 15–21 Nisan
- **Firstfruits** (Bikkurim) — day after Sabbath during Unleavened Bread
- **Weeks / Pentecost** (Shavuot) — 50 days after Firstfruits
- **Trumpets** (Yom Teruah) — 1 Tishrei
- **Atonement** (Yom Kippur) — 10 Tishrei
- **Tabernacles** (Sukkot) — 15–21 Tishrei
- **Shemini Atzeret** — 22 Tishrei

These appear as colored markers/chips on feast days. Clicking a feast day chip explains what it is and why it matters — linking back to who_is_god.html and the Bible Companion.

### 7-year Shemita cycles:
Show on the calendar which year in the 7-year cycle we are in. The Shemita (sabbatical year) is a rest year for the land — the 7th year. Mark the Shemita year distinctly.

### Jubilee:
The 50th year (after 7 cycles of 7 = 49 years). Note on the calendar which Jubilee cycle we are in.

### Hebrew calendar conversion:
Implemented as a hybrid approach — known-accurate lookup for feast dates (fixed by Torah) + lightweight Hebrew date conversion algorithm for daily cell display.

### Hebrew year context (current):
- Hebrew year **5786** = Gregorian 2025–2026
- We are currently in the month of **Sivan 5786** (approx. June 2026)
- The current Shemita cycle: 5782 was a Shemita year (2021–2022), so 5786 = year 4 of the current 7-year cycle
- Next Shemita: 5789 (2028–2029)

## File Paths
- Hub file: `C:\Users\user1\OneDrive\Documents\Amit\Hub\amit-hub.html`
- Who Is God: `C:\Users\user1\OneDrive\Documents\Amit\who_is_god\who_is_god.html`
- Companion: `C:\Users\user1\OneDrive\Documents\Amit\Companion\Amit_Companion.html`
- Computer Value: `C:\Users\user1\OneDrive\Documents\Amit\ComputerValue\` (not yet built)

## Connection to the Amit System
This is part of the Amit system — one character, one mission. The Hub is the daily face. Everything flows through here. Computer Value funds it. Who Is God grounds it. The Companion walks alongside.
