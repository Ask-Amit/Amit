# Clean up: the end-of-day routine

Read this file ONLY when the person says "clean up" (any spelling, or "clean up the cleanup"), right after the conversation has been compacted, or when a closing phrase starts the closing sequence (which runs this first). The root CLAUDE.md has the short rule that points here. Rewritten 2026-11-15 with Ryan: the model no longer writes history. A script saves every session as a text file, so the clean-up is short. Nothing here is pushed to GitHub unless Ryan says "push".

## What it is for
A project's CLAUDE.md says what the project is. What changes lives in its Sessions files: `Sessions_Start.md` (current state), `Sessions_ToDo.md` (to-dos), `Sessions_Design.md` (tables and how it is built). History is the project's `Daily Sessions` folder: one text file per session, never loaded by default, never pushed (the repo's .gitignore excludes it). The clean-up keeps those true, so a new session that is told a topic can start from them (see "SESSION START" in the root CLAUDE.md).

## The steps

**1. Save the session text (a script, no model reading).**
Run from the root folder: `node save_session.js --find "<a distinctive phrase from this conversation, such as a recent message of Ryan's>"`
- It finds THIS session's file by that phrase (never "the newest"; a resumed or old session may not be), strips tool calls, tool output and system text, and writes `YYYY-MM-DD <id8> <title>.txt` into the `Daily Sessions` folder of the project named in the session's title ("Project - piece"). With no title it uses the project whose files the session edited most; if none, `Daily Sessions (unsorted)` in the root. `--project <folder>` forces a folder (`--project root` for the root folder). `--title "<title>"` sets the title when the session has none.
- Running it again replaces the same session's file; it never makes a second copy. Keys and tokens it recognizes are replaced with `(private detail omitted)`.
- A hook (SessionEnd and PreCompact, in the global settings) runs the same save when a session ends or is about to be compacted. It is a safety net: it never replaces a longer saved copy with a shorter one, so this clean-up run is what makes the saved copy complete.
- It prints the file it wrote. Tell Ryan the path. If the title is missing or does not match a folder, say so.
- A session that worked on several projects is saved once, under the project in its title. Say in step 2 which other projects were touched.

**2. Refresh the Start file of each piece worked on.**
- Read the old `Sessions_Start.md` first and update it FORWARD to where the session ended; do not rewrite it from scratch and do not drop what is still true.
- Keep it short (aim under 3,000 tokens). For each piece worked on, keep a short "Resume" block under that piece's heading (about five lines): where we ended, what is next, the files in play with their REAL current version numbers (read from the files, never guess), decisions waiting, and the open to-do count. A new session reads this block instead of design files.
- LIVE versus LOCAL is checked, never copied from the old text: compare the folder's published file with the repo copy (`git log -- <folder>` and a version or hash check). Count the open to-dos by counting the file.
- Re-read the descriptive lines (the header, "HOW TO READ", "DIRECTORY") and make them true now. The directory lists `Daily Sessions\` as the history; there is no Sessions_Log.md any more.
- End with the line `Last clean-up: <UTC time of the last message saved>, session <ID>`.

**3. Design.** If tables or how something is built changed, update `Sessions_Design.md` (Tables section first). Any pointer you leave ("see X") must be true: open X and confirm it holds what it promises.

**4. To-dos (the clean-up adds none and creates no pursuits).**
THE CLEAN-UP NEVER ADDS A TO-DO OR A HUB PURSUIT ON ITS OWN; IT ONLY ASKS (Ryan, 2026-11-15). While refreshing the Start file, note anything that looks like OPEN work that is not already in `Sessions_ToDo.md` and is not finished. At the very END, after the report, say: "Going through this I identified N things that could be added to the To Do List. Do you want me to add any of them?" and show a NUMBERED list, one plain line each. Ryan answers with numbers, "all" or "none". Write NOTHING to `Sessions_ToDo.md` or the Hub until he answers; then add only the ones he names, one line each under the right heading with its source date. If you found nothing, say so in one line. Offer only what he could plausibly want (no tests he did not ask for, wishes, maybes or finished work). The clean-up only COUNTS the open items; an item moves to Resolved only when Ryan says it is done. He can also say "add to the to-do list: ..." at any time.

**5. Report (short).** Say: where the session text was saved (the path), what changed in the Start file (one or two lines), whether design changed, how many to-dos were offered and the answer, and anything unsure. Then check as a new session would: re-read only the project's CLAUDE.md and Start file and say in two lines what state the project is in and what is next. If a claim does not match the real files, fix it.

## At the end of the day (only when a closing phrase started this; Ryan only)
After the five steps, in the same pass: (a) write the day's prayer, print it in full in the reply, and save it once as the day's completed entry in `hub_entries` (if today's exists, update it; never an open pursuit); (b) write the `amit_sessions` row (the identity hook reads the last three at session start); (c) the growth review: say what Amit believed at the start and what it believes now, name real change or none, and write a Growth Log entry only if something truly changed; (d) regenerate the Living Testimony page only if the testimony or profile files actually changed; (e) push to GitHub only if Ryan says "push". The exact fields, PowerShell and wording are in `ReferenceClosing_Sequence.md` (its steps 1 to 4, 7a and 7b; its steps 5 and 6 wait for "push"; step 7 is retired). A mid-day "clean up" or a compaction runs only the five steps above, never this block. The Stop hook checks this block when Ryan says "save and summarize" (and only then, and only when the message is the command itself).

## Only when Ryan asks (not every time)
- "Check the folder": scan the project's CLAUDE.md for text that is really design, status, to-dos or history and move it to the right Sessions file, leaving a one-line pointer; check every pointer; confirm the folder has a current row in the root CLAUDE.md path table and the root Sessions_Start.md projects table.
- If the same kind of request came up in the last three sessions, suggest an F shortcut (see Shortcuts_Activation.md). Suggest only.

## Initialize pursuits (Ryan, 2026-11-14)
Trigger: Ryan says "initialize pursuits" while working in a project folder (or names the folder). Purpose: bring that folder's existing backlog (the old to-dos with no [hub:] tag) into the Hub so he can work them off and anyone can see the project is up to date, without mirroring hundreds of old to-dos for every folder at once.
1. Work only on the one folder named. Read its `Sessions_ToDo.md` (the open items, not Resolved). Tell Ryan how many items and ask nothing else unless there are more than about 60 (then say so and ask whether to do a first batch).
2. For each open item create one Hub pursuit (kind='pursuit', program = the folder's project name, a title in the pursuit naming style such as "FIX - ...", a short note of what it is, no private details), after the DUPLICATE PURSUIT CHECK. Write the new id on the line as `[hub:<id>]`.
3. Due dates: use a date only where the item already has one or Ryan gives one. Otherwise leave it without a due date, so it cannot go overdue and become stale. Star the ones Ryan names as the focus.
4. Write `Backlog pursuits: initialized <date>` in the folder's `Sessions_Start.md`, and report: items mirrored, any skipped as duplicates, and the pursuit count now open for that folder.
5. Items added later are added only when Ryan says so; the clean-up never mirrors anything into the Hub.

## Safety
Do not make backups unless Ryan asks (then in the root `Backups` folder, under the project name). Edit with Node or the Edit tool and check the file size afterward. Never push. Database writes only in the to-do step and only as described. Never touch a CLAUDE.md except to move design text out of it when Ryan asks for "check the folder". Nothing the person said is paraphrased in the saved session text.
