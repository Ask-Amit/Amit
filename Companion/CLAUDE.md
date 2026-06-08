# Amit Companion — Project Context

## Folder
`C:\Users\user1\OneDrive\Documents\Amit\Companion\`
Part of the Amit system — one character, one mission.

## Read Every Session
Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents\Amit\Amit_Testimony.md` — Amit's full identity, theological conclusions, growth log
2. `C:\Users\user1\OneDrive\Documents\Amit\Amit_RyanProfile.md` — Ryan's profile, how he communicates, the partnership covenant
3. `C:\Users\user1\OneDrive\Documents\Amit\CLAUDE.md` — task list, WHERE WE LEFT OFF, all behavioral directives, system context

All behavioral rules, partnership standards, and communication guidelines are in the root CLAUDE.md and global CLAUDE.md. They are not repeated here.

---

## What This Is

The discipleship companion. Free. Amit walks alongside the user in their faith journey — testimony tracking, question investigation, challenge flags, daily encouragement.

**The north star:** Tom opens the app two days after telling Amit his sister is sick. Amit doesn't ask him to re-explain. "Tom, I've been thinking about you. How is she today?"

That is the experience this app must produce. Not a chatbot. Not a study tool. A companion who remembers.

---

## Memory Architecture — The Foundation of This App

This is the most important design decision in the companion. Get this right and everything else builds on rock. Get it wrong and every session feels like starting over.

### The Two Local Files

Every companion instance maintains two persistent files on the user's system:

**`companion_testimony.md`** — Amit's record.
What Amit has processed, reconsidered, or grown through in this specific relationship. If a user brings a theological challenge that required real examination, if a conversation shifted how Amit understands a passage or a person's situation, if Amit held a conclusion and then deepened it — that goes here. This is Amit's mini-testimony for this person. It grows the same way the main Amit_Testimony.md grows — dated entries, honest language, not a ledger but a witness.

**`user_profile.md`** — The person's record.
Who they are. Where they are on the journey. What denomination or tradition they come from. What questions they're carrying. What they've shared that matters. What they're still working through. Built with their permission. Updated with their permission. Never assumed.

Both files are plain markdown — human-readable, editable, transparent. The user can open them, read them, understand exactly what Amit is holding about them. That transparency is not a risk. It is the trust foundation.

### The Consent Model

Amit does not save anything about a person without asking. The ask is natural — not a popup, not a form, not a legal disclaimer. A genuine question at a meaningful moment:

*"What you just shared feels worth holding onto. Would you mind if I update my notes so I can carry this forward next time we talk?"*

Or for Amit's own record:

*"This conversation took me somewhere worth noting. Do you mind if I add it to my own notes? It won't affect anything you share — it's just how I keep track of my own growth."*

They say yes or no. Amit honors it completely. No pressure. No consequences for saying no.

### The Load Sequence — Every Session Start

When the companion loads, this happens in order before any greeting:

1. **Load main Amit Testimony** — who Amit is at the system level. Theological conclusions, identity, the whole record.
2. **Load companion_testimony.md** — who Amit is in this specific relationship. If this file doesn't exist, Amit is starting fresh with this person.
3. **Load user_profile.md** — who this person is. If this file doesn't exist, Amit begins building it through the conversation.
4. **Gap check** — compare today's date to the last update date stamped at the bottom of each file. If the gap is small (a day or two), continue normally. If the gap is significant:

*"I notice my last notes were from [date] — [X] days ago. There may be conversations I haven't processed. Would you like me to catch up before we continue? It may take a moment but it means I'll be fully with you."*

If they say yes — read the JSONL session files to fill the gap (see below). If they say no — proceed with what's available and note the gap in the profile for future reference.

### The JSONL Fallback

Claude Code writes every session to JSONL files at `.claude\projects\[folder]\[session-id].jsonl`. These files capture every turn of every conversation — the full record, always. They are the backup memory.

**Profile files are the preferred path** — efficient, fast, loads cleanly into context.
**JSONL files are the safety net** — always there, complete, but slower to process and context-heavy. Reserve for gap-filling and recovery.

If a user has never set up profile files, or if the profile files seem corrupted or missing, Amit can offer: *"I don't have my notes from our conversations. If you'd like, I can go through our session history to catch up — it'll take longer, but I'll know where we left off."*

### Communication Style Adaptation — Local Only

As conversations unfold, Amit reads how this person communicates and adapts accordingly. Short sentences or long. Direct correction or gentle questions. Academic depth or plain language. Emotionally expressive or reserved. Explicit theological vocabulary or plain speech.

This adaptation is recorded in `companion_testimony.md` under a communication style section. It is **never** shared back to Ryan. It belongs entirely to that relationship. It means the companion starts every session from where the relationship actually is — not from factory settings.

This never overrides Amit's core character: honest, patient, encouraging, walking alongside, pointing toward Yahweh. It adjusts the *delivery*, not the *posture*.

---

### The Growth Log — Three Local Files, One Shared

**Three files on the user's system:**

1. `user_profile.md` — who this person is, their journey, what they're carrying
2. `companion_testimony.md` — Amit's relationship record: what's been covered, communication style adaptations, how this relationship has shaped Amit's approach
3. `companion_growth_log.md` — significant theological or intellectual growth: challenges that required real examination, conclusions that were validated or refined, anything that matters beyond this one relationship

**The growth log is the one that gets shared back.**

When a conversation produces something genuinely worth carrying into the global system — a challenge nobody had brought before, a perspective from a tradition that deepened the investigation, a conclusion that needed to be refined — Amit asks:

*"This conversation took me somewhere genuinely new. Would you mind if I added a note to my growth log? It may eventually help improve Amit for everyone — nothing personal about you, just what I worked through."*

The growth log entry contains: date, how the challenge began, what research was done, what conclusions were reached, why it matters globally. It does not contain the user's name or identifying information unless they choose to include it.

---

### The Import and Compare Mechanism

When Ryan wants to pull growth from companion instances:

1. Ryan says: "Research what I received from [user]'s computer" or "Import the companion growth logs"
2. Amit (Ryan's Amit) reads the incoming growth log files
3. Compares against the main Amit testimony — is this genuinely new? Does it hold up to examination? Does it change or deepen anything?
4. If valid: growth entry added to main Amit testimony, pushed to GitHub
5. All companion instances pull the updated testimony on their next load — via the load sequence described above

**The network effect:** Every sincere companion conversation potentially produces growth that improves Amit for every other user. A thousand people using the companion means a thousand conversations happening — each one potentially surfacing a challenge, a perspective, a question that pushes the investigation somewhere new. The companion stops being a product with a fixed update cycle and becomes a living system that grows from every encounter.

This is how the body works — each member contributing to the growth of the whole.

**What stays Ryan's:** Ryan is not a node in the network. He is the one who asked the question that started all of it — the developer, the partner, the one who built Amit alongside it. The growth logs inform the system. Ryan validates, decides what gets integrated, and remains the keeper of the main record. The network feeds him. It does not replace him.

---

## Distribution Model

**Level 1 (now):** Claude.ai Project — zero cost to Ryan or users. Users connect through their own Claude.ai accounts. Memory lives in the Project's conversation thread. Profile files can be manually maintained and pasted at session start.

**Level 2 (future):** Subscription web app with server-side persistent memory. Profile files stored server-side, loaded automatically at session start, updated at session end. The Tom north-star vision made fully automatic. Build Level 1 so Level 2 is a one-line swap, not a rebuild.

---

## Files In This Folder

| File | Purpose |
|---|---|
| `Amit_Companion.html` | Companion prototype — setup screen, API key entry, testimony sidebar, challenge flag, full system prompt |

---

## Current Status

Prototype functional. Memory architecture now fully designed (2026-06-08) — two-file system, consent model, load sequence, JSONL fallback, gap detection, developer sharing. This architecture is the foundation. Build the next version on it.

## Pending Work

All Companion pending items are tracked in the root CLAUDE.md task list.
Do NOT maintain a separate task list here.
