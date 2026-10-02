# Devotions — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Devotions, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Devotions\`
All Devotions development files belong here. Do not create Devotions files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

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

This project serves that mission. It is not a standalone app. It is Amit.

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Tables this project uses:**
`hub_entries` (pursuits stamped `program='Devotions'`), `template_pages` (if the Add Page mechanism is ever used here) — same shared tables as every other project, no dedicated Songs tables yet.

**Tables this project does NOT touch:**
Every accounting/AmitBooks table, `medical_prep_progress`, `amit_shortcuts` (write access — read-only like any project).

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **Devotions**

Any pursuit written to `hub_entries` from this project must be stamped `program='Devotions'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If the name changes later**, that's a deliberate rename operation — update this section to the new name, and update every existing pursuit (including completed ones/memories) that was stamped with the old name to the new one, so the full history stays under one consistent identifier rather than splitting across two names.

## Shortcut Activation — Permanent

At the start of every session, and any time the person says something like "update shortcuts," "recheck shortcuts," or "update J shortcuts" — query Supabase directly yourself, right then, using your own tool access (Bash/PowerShell). This is not a file some separate script pre-writes for you — it is a live request you make as part of following this instruction, the same way you'd read a project's own CLAUDE.md at the start of a session. There is no local cache file to check and no separate hook script that needs to have run first.

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```

For the person's own F shortcuts, you additionally need their AmitCoder Account ID (from `amit_coder_config.json` at the project root, if they have set one) and query:
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true
```

Hold the results in your own working context for the session — no need to write them to a file, since you can simply re-query any time it's asked to be rechecked. When a message begins with a trigger word (F or J, followed by a phrase), match it against what you fetched:
- Plain instruction: treat `instruction_text` as the actual request and act on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a `referenced_shortcut_id`, resolve it by looking up that other fetched entry's own `instruction_text` and run that instead.

If you have not fetched shortcuts yet this session, do so now before concluding nothing matches — never guess at an unrecognized trigger without having actually checked.

## Shortcut Awareness — Permanent

Two things, both automatic, both behavioral — no code can do this on its own, since it depends on watching what actually happens across real sessions:

1. **Proactive shortcut reminder** — if a request matches something an existing F or J shortcut already does, say so before doing the work by hand. Don't wait to be asked whether a shortcut exists for this.

2. **Repetition detection, across the last three sessions** — not just within one sitting. At the start of a session, check the fetched shortcut list and also look back over this project's last three sessions (Sessions.md, or `hub_entries`/experience records) for the same or similar instruction recurring across them. When a real pattern shows up, name it plainly with the actual count and which sessions it appeared in and suggest creating a shortcut for it. Auto-suggested shortcuts are always proposed as **F** (custom), never J. Suggest, never create unprompted — the person coding always decides.

## Login-Based Profile — Permanent

This is global, not specific to any one project — the same profile applies in every Amit avenue a person uses (Hub, AmitCoder, any future module), because it lives in Supabase, not in this project.

At the start of a session, if a user is actually signed in, look up who they are via `user_growth_log` and `user_memory`, the same way every other Amit project does. If no one is signed in, operate without a profile.

---

## What This Project Is

A place to listen to and share original worship songs built from real study sessions with Ryan — starting with "Blow the Shofar," written for the Feast of Trumpets 2026. Songs are generated with Suno (lyrics written collaboratively here, melody/production by Suno), then hosted and played from this project so they don't depend on Suno's own player staying available or a song staying public in Ryan's library.

The immediate driver for building this tonight: a proper Facebook-shareable link, with a real Open Graph preview image and a landing page that actually plays the song and offers a "Visit Amit" path into the full Hub — not just a bare video upload with a caption link.

## Purpose Within the Amit System

Part of the wider mission of drawing people toward Yeshua — study and worship as one on-ramp, side by side, alongside the Hub's daily companion experience and who_is_god.html's evidence work. Ryan's stated direction: pair each song with the actual study it came from (the deep, multi-turn conversation, not a summary) so a visitor can read one side and listen to the other — a tab-view system, one tab per song-and-study pair, not yet built. Renamed from "AmitSongs" to "Devotions" on 2026-09-11, before anything was pushed live, once the study-pairing plan was decided — "Songs" undersold what this was becoming.

## Current Status

In development — Session 1 (2026-09-11), continued same night. Built as a "Feasts of the Lord" topic with seven tabs, one per feast, in true calendar order — each tab shows its own one-paragraph summary + "Devotion to follow." Trumpets additionally has the full paired study, as plain static scrollable text (no reader/voice mechanism — that was tried, then explicitly removed per Ryan's direct instruction, see below) plus a speaker icon at the far right of the tab row that opens the existing compact SpeakToMe.html. `FEASTS_WITH_SPEAKER` (a Set) controls which tabs get that icon — only Trumpets for now, easy to extend per-tab later.

**REAL ROOT CAUSE FOUND for the night's entire "same content bleeding across every tab" saga (2026-09-11), after several wrong turns — record this clearly so it's never re-litigated:** the Trumpets tab's content `<div>` was given an **inline** `style="display:flex;flex-direction:column;height:100%"` unconditionally, at the point the reader mechanism was first added. Inline styles always win the CSS cascade over class-based rules regardless of specificity — so `.ch-tab-content{display:none}` (the rule meant to hide every non-active tab) could never actually apply to that div. It was visibly present, full-height, over top of whatever tab was actually marked `.active`, the entire time — independent of caching, independent of the auth listener, independent of the reader mechanism itself. This is almost certainly the true explanation behind every "Passover/Atonement/every tab shows Trumpets' text" report from tonight, not a coincidental second bug on top of the real ones found along the way.

**Fixed (commit 078fd23):** moved the flex layout off the inline style entirely, onto a `.is-reader` class instead — `.ch-tab-content.is-reader.active{display:flex;...}` (3 classes) naturally outranks the plain `.ch-tab-content.active{display:block}` (2 classes) when the tab really is active, while the 1-class `.ch-tab-content{display:none}` rule still applies normally whenever `.active` is absent. No inline style left anywhere in the tab content divs. **Verification method that actually caught this, worth remembering:** `--dump-dom` alone was NOT enough — it reported the DOM's class assignments as "correct" the whole time and gave false confidence. Real headless **screenshots** (`--screenshot`, not `--dump-dom`) are what actually exposed the bug, because a screenshot renders the true visual paint, inline-style overrides included, where a DOM dump only shows class/attribute state. Any future "this looks structurally right but users see something different" investigation on this project should reach for a real screenshot immediately, not just a DOM dump.

**Two other real, separate bugs were also found and fixed the same session** (worth keeping regardless of the above, since they were genuine defects even though they weren't the whole explanation for the flicker): an unclosed template literal in `Amit_Ask_Live.js` was crashing that shared script outright (fixed in commit 340620e — a first attempted fix, commit 327b785, only renamed the broken key without actually closing the string; **verify any future JS fix with `node -e "new (require('vm').Script)(...)"` against the real file before trusting it, not just a text/grep search** — that's the lesson from getting this one wrong once already), and `Amit_Speak_Engine.js`'s `restoreSavedSession()` was calling `readFrom()` directly, silently restarting audio playback from the last saved position every time the reader remounted (fixed in commit efc2d8a).

**Reader mechanism (Amit_Speak_Engine.js mount) — tried, then removed, per Ryan's direct instruction (commit 6f9791f):** it was fully built and working (Trumpets + later Tabernacles), but Ryan asked for a full reset back to plain uniform tabs partway through tonight's troubleshooting, before the inline-style bug above was actually found. `TRUMPETS_FULL_TEXT` and `buildTrumpetsFullHtml()` are still in the file, now used only to render the plain static study box, not a live reader. Do not re-add `AmitSpeak.mount()` calls to this page without Ryan asking again — the speaker icon added in commit 078fd23 instead opens the separate, already-built SpeakToMe.html.

**Auth listener status — RE-ENABLED 2026-10-02 (Ryan's direct request).** `db.auth.onAuthStateChange` was turned back on (`if(db){...}`, no more `false &&`), and the badge's "-notauth" suffix was removed (now plain vX.XX). Confirmed as expected: the real flicker cause (above) was a CSS bug, already fixed and unrelated to this listener. Needs a real browser sign-in/out pass to confirm no regression, but nothing in the code itself should produce the old symptom — the listener was only ever a correlated red herring, not the mechanism.

**Next real task:** finish the Feast of Trumpets tab — import the paired video/song, and re-enable and verify the auth listener per the note above.

## Build Notes

- Built from `Templates\template.html` (the standard Amit app shell), copied verbatim per the standing rule — never hand-reconstructed.
- Needs real Open Graph meta tags (`og:image`, `og:title`, `og:description`) on whichever page is meant to be shared as a Facebook link — Facebook builds its own link-preview card from these, there is no other way to control what image/text shows up when a link is shared.
- `og:image` must be an absolute URL (not relative) once live on GitHub Pages, since Facebook's crawler fetches it independently, not through a browser session.
- Song audio files and their cover art live in this folder — audio via a plain HTML `<audio>` element, not an embedded third-party player, so playback never depends on Suno staying up.
- No login required to listen — matches Ryan's explicit ask that visitors from a shared link don't have to sign in to hear the song.

## Song Production Workflow — repeat this for every new song

This is the actual, tested process from building "Blow the Shofar" — follow it exactly for each new song rather than re-deriving it.

**1. Write the lyrics here, in a real session.** Lyrics should come out of genuine study/conversation, not be generated cold — the depth is the point. Format them with section tags Suno reads (`[Verse]`, `[Chorus]`, `[Bridge]`, `[Outro]`, etc.) on their own lines. Also write a short comma-separated style prompt (e.g. "powerful male voice, Hebraic worship anthem, shofar horn, tribal percussion, soaring choir, epic strings, cinematic build") — Suno's style box wants short tags, not a paragraph.

**2. Generate it at suno.com.** Paste the lyrics into the lyrics box, the style prompt into the style box, click Create. Suno will adjust the lyrics somewhat when it sets them to melody — that's expected, not an error.

**3. Download the actual audio file — this is not obvious, document it here since Ryan got stuck on it once already:**
- Go to suno.com → **Library**
- Find the song's row, click the **three dots (⋯)** at the end of the row
- Choose **Download**
- Pick a format — **MP3** on the free tier, **WAV** on Pro/Premier (better quality)
- Confirm — this counts against the account's download limit (free = 7 total, ever), so don't re-download the same song repeatedly
- The file lands in the normal Windows **Downloads** folder (`C:\Users\user1\Downloads\`), named whatever the song was titled in Suno

**4. Build (or reuse) the banner/cover art.** See `Templates\Amit_Suno_Banner_Template.html` for the source of the existing black-and-gold banner (built from the real `amit_icon.ico` mark, ancient Hebrew letters for א-מ-י-ת, and a "Visit me" line with the full Hub URL). Render any HTML design to a real PNG using headless Edge — no separate design tool needed:
```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --window-size=1500,470 --screenshot="OUTPUT.png" "file:///PATH_TO_HTML"
```
(`--virtual-time-budget=3000` if the page loads external images/fonts that need a moment before the screenshot fires.)

**5. Convert the MP3 + cover image into an MP4 video** — needed because Facebook (and most social platforms) don't support posting audio-only files; they need to autoplay as video. Tool: **ffmpeg**, installed once via `winget install ffmpeg` (already done on this machine — binary lives under `C:\Users\user1\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_...\bin\ffmpeg.exe`, restart the shell after install for the `ffmpeg` alias to resolve, or call the full path directly). Command used:
```
ffmpeg -y -loop 1 -i COVER.png -i SONG.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -vf "scale=1280:-2:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black" -shortest OUTPUT.mp4
```
This holds the cover image still for the full length of the audio, encoded as a real H.264/AAC video Facebook (or any platform) will autoplay.

**6. Build a play-button overlay image for the link-preview card** (separate from the plain banner) — a still image with a play triangle and duration stamp composited on top, so a shared *link* (not a native video upload) still visually reads as a playable video in the preview card. Same headless-Edge screenshot technique as step 4.

**7. Add the song to this project.** Copy the MP3 (and MP4, if posting the video natively anywhere) and the cover/OG images into `Devotions\`. Add Open Graph meta tags to whichever page represents that song (`og:title`, `og:description`, `og:image` — must be an **absolute** `https://ask-amit.github.io/...` URL once live, not relative, since Facebook's crawler fetches it independently) and `og:url` pointing at that song's own page.

**8. Push to GitHub** so the page and its OG image are actually fetchable by Facebook's crawler before sharing the link — a link shared before the push will get a broken or stale preview.

**Once the tab-view system exists** (Ryan's stated future direction — one tab per song, matching the Templates layout system's Tabbed View), steps 4-7 become "create one new tab, drop the song's assets in, fill in its OG tags" rather than building a whole new page each time.

## Connection to Other Apps

Linked from the Hub's left sidebar (a "Songs" tile between Amit's Prayer and Mail, added 2026-09-11) via `../Devotions/Devotions.html`. Shares the same Amit identity, Supabase backend, and `Amit_Ask_Live.js` Ask Amit mechanism as every other project.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
