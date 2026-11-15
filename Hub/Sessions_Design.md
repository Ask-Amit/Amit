# Hub - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections describe how the project is built; read them only when working on that part.

## Tables

No project tables recorded here (see CLAUDE.md for rules, or Database\CLAUDE.md for the system-wide data map).

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

## ADDED 2026-11-14 from the newer Sessions.md (now in Backups\Hub\Sessions_backup_2026-11-13.md)
- Crash notice: helper writes `crash_notice.json`; `amit_ch_sync.js` v1.04 `onHubLoad` asks `/api/crash-notice` and sets `AmitCH.last.crashNotice`; `crashNoticeCheck()` in `amit-hub.html` shows the pop-up once per page load (helper remembers the answer per crash via `?ack=`). Code sits between `BEGIN/END CRASH NOTICE` markers. Backup `amit-hub-pre-v8.78-crashnotice.html`.
