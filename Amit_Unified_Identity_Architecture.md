# Amit Unified Identity Architecture — One Login, Tied Together

**Origin:** Ryan's direct instruction, 2026-08-10, during the AmitBooks/New session covering the company→books hierarchy, delete/backup safety, and shared contacts. Captured here in full so the vision survives past one conversation, per Ryan's explicit request to "title it, tie it altogether."

**Status: vision, partially built.** This document names what's real today versus what's still ahead — do not read anything here as already live unless marked ✅.

---

## The core principle

**A person's Amit login is the one thread everything else hangs from.** Not a dozen disconnected copies of "who this person is" scattered across apps — one identity, referenced everywhere, remembered consistently, the same way Amit already remembers someone spiritually (the compass, `KNOWN_PERSONS`, `user_profiles`) extended now into the practical, everyday layer: contacts, companies, books, subscriptions, calendar.

Ryan's own words, worth keeping verbatim: *"I may be a client to somebody. I may be a vendor to somebody else. That's their login category of me. But my login name on Amit is how it's connected."*

That's the whole architecture in one sentence: **other people's records about you point back to your own canonical identity — they never hold a second copy of you.**

---

## The three layers, named separately (they are not the same thing)

### 1. Your own canonical identity — ✅ built (2026-08-10)
`account_profiles` — one row per real, signed-in Amit user, primary-keyed on `user_id`, editable only by that person (RLS: `auth.uid() = user_id`). This is the live, self-maintained "who I actually am" record: name, email, phone, address.

### 2. Someone else referencing you, not copying you — ✅ built (2026-08-10)
`contacts.linked_user_id` (nullable, on AmitBooks' existing per-book `contacts` table) — when set, points at another real Amit user's own `account_profiles` row. If Ryan is a vendor in someone else's books, their `contacts` row for "Ryan" links to Ryan's own `account_profiles` row instead of storing a second, staleable copy of his address. When Ryan updates his own profile, everyone who's linked him sees the update automatically — nobody re-syncs anything by hand.

This is also the technical seed of the "submit a bill directly to the other Amit" flow Ryan described — a linked contact isn't just read-only data, it's a real connection to another account that can eventually push things back (a submitted bill, an updated address) through their own login, not through yours.

### 3. Your own master address book, shared across your own apps — ❌ not yet built
The piece still ahead: **your own** contacts (vendors, clients, whoever) currently live only inside AmitBooks' own `contacts` table, invisible to any other app under your login. Ryan's example: when AmitHealth exists, clicking into it should draw from the same address book, not start a second, disconnected one.

Real shape when this gets built: a `people` table owned by `user_id` (the login, not any one app), holding the shared base facts (name, email, phone, address). AmitBooks' own `contacts` table gains a `person_id` link into it — additive only, same pattern as everything else built tonight, nothing existing touched or backfilled. AmitBooks keeps its own accounting-specific fields (vendor role flags, payment terms, tax ID, default account) layered on top of the shared base record, the same way AmitHealth would layer its own provider/insurance fields on top of that same shared person later.

---

## Authorization stays local to each app, deliberately

Ryan's own words: *"The authorization level at each application is within that application. He can say these people have access to it or not. Each owner of their own piece of the pot."*

The shared identity layer above is **not** a single shared permission system — it doesn't grant access to anything by itself. Each app keeps its own gating over its own data:
- AmitBooks already has this shape started: `book_members` (who's invited onto a book) + `book_role_permissions` (view/modify/full, per role, per area — banking/payroll/bills/contacts/reports/setup). **Real but genuinely unenforced today** — the tables exist, nothing reads them yet (named as an open gap earlier this same session).
- A future AmitHealth would have its own equivalent — its own owner, its own invited team, its own role schedule — never inherited wholesale from AmitBooks just because the same person is involved.

Linking to a shared identity means "this is genuinely the same person," not "this person now has access to everything I own." Those are two different questions, answered by two different systems.

---

## The wider hub connection — pursuits, calendar, subscriptions

Ryan's description: *"It's kind of an intertwined hub with their own pursuit, with everyone's working based on a calendar connected together by their login... each app can now go to and say, yes, I purchased — give me all of my current subscriptions, and that lives in one spot because everything's hooked back to that login name, the master."*

This is the same principle as layer 3 above, applied beyond contacts — subscriptions, pursuits, calendar entries, all already loosely following this shape in the existing Hub (`hub_entries`, `amit_sessions`, `amit_daily` are already login-scoped, already the "one spot" for pursuits and daily walk). What's still open is extending that same one-spot principle to AmitBooks-specific data (a subscription tracked in Books, a contact tracked in Books) so every app can query "give me everything under this login" and get a complete, non-duplicated answer — not just the Hub's own native data.

---

## Where the spiritual side connects — how the profile actually accumulates

Ryan's own words, across two passes at this (2026-08-10) — worth keeping both, they're one thought:

> "That login connection has to be to the person in the database that you're tracking from the standpoint of a spiritual walk as well. So you can create that profile of him. So it's all linked together. So when they come in next time, you know who they are."

> "When they're logged in, they're gonna be pressing Ask Amit to help them get through it, because you know what's actually there in front of them. You're watching where they're going. You can see how things are operating, and you can see where they travel. If they travel to anything that has something to do with the religious nature — well, that's when you start to say, okay, they visited it. And so we start to accumulate the data by how he interacts. If he comes there and asks questions, or has information that's like him pursuing what's truth on how he's talking — then you start to gather that information very, very slowly, unless you're in that one-to-one discussion with them in that Amit session where you guys are going back and forth, as you see it."

**This describes two distinct accumulation channels, both tied to the same login, both feeding one growing per-person record:**

1. **Passive signal — where they go.** Every logged-in touchpoint across any Amit app is a potential data point, gathered without the person doing anything deliberate: which tabs they open, what they linger on, whether they visit something with real spiritual weight to it (the Yeshua tab, a feast day, the Ancient Hebrew section) versus never touching it at all. Slow, quiet, accumulated over many visits — not a survey, not a quiz, just noticing.

2. **Active signal — what they actually say.** Real one-to-one Ask Amit conversations: the questions someone asks, the positions they take, whether they're pushing back or genuinely searching, what they're pursuing when they talk about truth. Richer than the passive signal, gathered specifically inside real dialogue, not inferred from clicks.

**What already exists, real and live today (this is not hypothetical — see root `CLAUDE.md`'s COMPASS ARCHITECTURE section):** the passive-signal half is partially built. `amit_userProfile` already tracks weighted signals per action — `feast_click`, `torah_walk`, `reflection`, `whoisgod`, `daily_walk` — each nudging a person's compass score up as they engage with spiritual content, tiered (0–3) with a 25% humility discount applied before Amit ever acts on it. `KNOWN_PERSONS` and `user_profiles` hold the deliberately hand-built version of this for Ryan specifically — Amit_RyanProfile.md, the Growth Log, session history read at the start of every session.

**What has to generalize for Ryan's description to be true of every person, not just him:** right now the compass tracks *engagement level* (a number, a tier) — it doesn't yet write a growing, readable *narrative* the way Amit_RyanProfile.md does for Ryan. The gap is the difference between "this person's compass score is 4.1" and "this person has asked about the Sabbath twice, seemed to be wrestling with a specific verse on their third visit, and hasn't come back to the Yeshua tab since." The second one is what lets Amit actually *react* to someone the way it reacts to Ryan — not just gate content by a score, but genuinely remember them. That requires real Ask Amit conversation content (not just clicks) to get captured and summarized back into that person's own growing record, the same way a session's real growth gets written into Ryan's own Growth Log today — just generalized to run for everyone, not hand-curated for one person.

The login is what makes any of this possible at all: without it, none of this data has anywhere consistent to accumulate. With it, "when they come in next time, you know who they are" stops being aspirational and becomes just... Tuesday.

---

## The synthesis — "One Thread, Many Doors" — ✅ first slice built (2026-08-10)

Ryan's instruction, verbatim: *"So combine it together to be better than what maybe either one of us had by each other. Be creative, inspire me... go ahead and create it. Make that happen. Make that ability for Amit to start to pay attention and to modify that and keep track of who they are."*

The synthesis: rather than two separate filing cabinets for the same person (a spiritual compass score, a business contact record), **one continuous thread per person, tagged by which door they came through** (`Spiritual` / `Business` / `Personal` / `Craft` — the same categories already used for Amit's own pursuits, not a new vocabulary). A Scripture question and a submitted bill are both just entries in the same thread. When someone returns, through any app, Amit reads the thread and picks the conversation back up — it doesn't consult a score.

**Real, live as of tonight:** `amit_threads` table (`migration_2026-08-10_002_amit_threads.sql`) — `user_id`, `domain`, `source_app`, `entry_text`, plus `status`/`corroboration_count` carrying forward the "two or more witnesses" principle already governing how Amit reviews its own Growth Log (root `CLAUDE.md`'s Companion Growth Log Intake System) — a single observed signal isn't treated as settled truth about someone; a corroborated pattern is. New.html now writes a real, confirmed thread entry every time a book or company is genuinely created (`logThreadEntry()`, wired into `saveNewBook`/`saveCompanyForm`).

**Deliberately not built yet, named plainly so it isn't lost or assumed done:**
- The actual `'signal'` → `'confirmed'` promotion logic (bump `corroboration_count`, flip status once a real pattern emerges) — the table supports it; nothing computes it yet.
- Passive click/navigation tracking (the "watching where they travel" half of Ryan's description) — only explicit, deliberate actions (creating a book/company) write to the thread right now, not browsing behavior.
- Anything actually *reading* the thread back — no app, including New.html itself, yet opens a session by pulling someone's own thread and greeting them from it. Writing came before reading; reading is the next real step, and arguably the one that makes this feel alive rather than just logged.
- Any app beyond AmitBooks writing to it — `source_app` is free text, ready for AmitHealth/who_is_god/the Hub itself to write into the same table whenever they're ready to.

This is a first real slice, not the finished mechanism — the honest next session's work is teaching Amit to actually *read* a thread back to someone, not just keep writing to it.

---

## What this document is and isn't

This is a **named vision, not a build plan.** Layers 1 and 2 above are real and live as of 2026-08-10. Layer 3 (the shared master `people` table), the authorization-enforcement gap, and the cross-app "give me everything under this login" query are all real, still-open work — each deserving its own dedicated session, not a rushed addition stacked onto whatever else is already mid-build. Read this document before starting any of that work, so it isn't reinvented or contradicted piecemeal.
