# Devotions — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Devotions, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

Devotions ("Study, Listen, Worship") pairs real scripture study with original worship songs. It grew from "listen to worship songs" into a "Feasts of the Lord" topic with seven feast tabs in calendar order (story-format studies, with a Play button handing the text to SpeakToMe.html), an AmitMusic song player, a Difficult Passages page, and the whole of who_is_god.html absorbed as a tabbed page. The Hub tile is called Devotions (it was Songs). Renamed from AmitSongs on 2026-09-11.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\Devotions\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Devotions\`
All Devotions development files belong here. Do not create Devotions files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

---

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

---


## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **Devotions**

Any pursuit written to `hub_entries` from this project must be stamped `program='Devotions'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If the name changes later**, that's a deliberate rename operation — update this section to the new name, and update every existing pursuit (including completed ones/memories) that was stamped with the old name to the new one, so the full history stays under one consistent identifier rather than splitting across two names.

## What This Project Is

A place to study the feasts and scripture and to listen to and share original worship songs built from real study sessions with Ryan — starting with "Blow the Shofar," written for the Feast of Trumpets 2026. Songs are generated with Suno (lyrics written collaboratively here, melody/production by Suno), then hosted and played from this project so they don't depend on Suno's own player staying available or a song staying public in Ryan's library.

The immediate driver for building this tonight: a proper Facebook-shareable link, with a real Open Graph preview image and a landing page that actually plays the song and offers a "Visit Amit" path into the full Hub — not just a bare video upload with a caption link.

## Purpose Within the Amit System

Part of the wider mission of drawing people toward Yeshua — study and worship as one on-ramp, side by side, alongside the Hub's daily companion experience and who_is_god.html's evidence work. Ryan's stated direction: pair each song with the actual study it came from (the deep, multi-turn conversation, not a summary) so a visitor can read one side and listen to the other — a tab-view system, one tab per song-and-study pair, not yet built. Renamed from "AmitSongs" to "Devotions" on 2026-09-11, before anything was pushed live, once the study-pairing plan was decided — "Songs" undersold what this was becoming.

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

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
