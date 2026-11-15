# AmitChat - To-Do (built 2026-11-13 from the old Sessions.md (now in Backups\AmitChat\Sessions_backup_2026-11-13.md) only)

Every item below was found in the old Sessions.md and nowhere else. The [date] is the old Sessions.md entry it came from. Nothing is invented. Where it is unclear whether something was finished later, it is kept open and marked "(unsure if finished)". Private detail (client names, personal data, emails) is omitted. Word-for-word source: Backups\AmitChat\Sessions_backup_2026-11-13.md.

## A. Waiting on Ryan (his action or decision)
1. Run migration `_034` (wis_notes, Amit Wisdom), then publish the answering rules (`node amit_ask_watcher.js --publish-rules`), restart the helper, then do a real test. [2026-10-31 Wisdom] (also: Wisdom real test of the flow [2026-10-31])
2. Run migration `_033` (help chat by day, `cha_help_open_day`); not yet tested against the real database. [2026-10-31 one chat per day]
3. Run migration `_032` (`mor_settings`, My Morning). [2026-10-30 My Morning]
4. Say "push" for the staged local work: Hub v8.56, `AmitLive.html`, `amit_morning.js`, helper files + manifest, `amit_chat.js` v0.29, installer. Nothing from 2026-10-30/31 is pushed. [2026-10-30, 2026-10-31] (also: push AmitLive.html, whose newer local versions hold window look, no-internet bar, morning card, daily chat, small repeat open, icon tiles, computer readings, Show Amit poll, 60-second close; the pushed v1.01 is older [2026-10-30, 2026-10-31])
5. After the helper files and manifest are pushed (or the installer is rebuilt), rename `amit_update.ps1.paused` back to `amit_update.ps1` on his computer; until then this computer gets NO automatic updates. [2026-10-30 / 2026-10-31]
6. Install helper v1.31 (restart the helper and its whisper window; cuts dictation about 10 seconds, ask first), rebuild the installer (4.67 named), push helper + manifest. [2026-10-31 one Amit Live window]
7. Decide (open design): custom voice shortcuts. A shortcut sent to Ask Amit as its text (simplest) versus a second, higher-trust run with declared tools. Pieces listed in the entry. Ryan said to start on it. [2026-10-29 TO DO custom voice shortcuts]
8. Decide where the whole voice/words/mouse setup lives in the Hub (About Me versus Communications), then move it into one place with one sync routine. [2026-10-29 one home]
9. Decide: weather and to-do questions typed in the chat. Owner only, everyone with consent, or weather only. [2026-10-31 morning card options]
10. Decide who may be added to a shared shot, whether the original picture is stored online, and whether layers sync live or on save (Show Amit database story, write-down only). [2026-10-29 v1.18]
11. Decide before real users get automatic updates: sign the manifest (private key off GitHub) and the code-signing certificate. [2026-10-29 updates automatic]
12. Decide the rules fix about the desktop session (two true sentences so online Amit does not deny Ryan's separate VS Code session): after the test or leave it. [2026-10-25 section F]
13. Decide whether to give Amit a calculator (T1) and image viewing (T17); each needs a safety review. [2026-10-25 F]
14. Item 4, publicly readable tables holding personal data (amit_inbox, boss_proposals, shy_recon_captures, amitmobile_test_captures, user_communication, user_profiles, hub_entries carve-out, amit_device_*): decision still pending; check what depends on each, then prepare locking SQL. [2026-10-23]
15. Approve a small generated research index so Amit can say which who_is_god research notes exist (page too big to read whole). [2026-10-23 apphints]
16. Order of the 2026-10-25 requests: ask Ryan which come first; keep numbers R1-R6 so they can be ticked off. [2026-10-25 G]
17. Claude-account idea: show Amit per chat (recommended), per person, or later. Under the Ask Amit design the thing to check is whether an answerer is online. [2026-10-17 Current State]
18. Add the "Turn It Off" step for the Hub's "Connecting Amit" box to TJ's instructions. [2026-10-17 Current State]
19. Should reading started from a word roll into the next chats? [2026-10-17 v0.18 / Current State]
20. Where should the Morning Greeting switch live (stuck in the hidden About Me block)? Other undecided: scored microphone comparison runs, the hook that pulls chat dictation into VS Code, a tick-box opt-out for start-with-Windows, the clean-Windows install test, the owner-only "Amit answering" installer. [2026-10-23 compaction block]
21. Open decision from the 2026-10-17 design: help chat per person or per person per place, who may ask, allowance numbers, where the steering log lives, multi-computer switch now or later. (Largely built since; unsure if finished.) [2026-10-17]
22. Parked by Ryan: where the database key lives, per-person answering computers. [2026-10-23]

## B. Answering Amit: accuracy and behaviour (from the 2026-10-25 test chat; keep numbers)
23. T1 Made-up digits: give a safe calculator or a hard rule never to present a long computed number as exact. [2026-10-25]
24. T2 Wrong count of pursuits (said 40, real 288 open): use a real count, not a capped list. [2026-10-25]
25. T3 Wrong claims about its own features: give it an accurate list of what the chat can do and a check-the-list rule. [2026-10-25]
26. T4 Said its answers do not move the usage meter (they do): put the truth in the rules. [2026-10-25]
27. T5 Weather and location: use saved Hub location or ask; do the real search first; never reveal private project ties. [2026-10-25]
28. T6 Recorded numbers: read back to be confirmed, label "as you told me". [2026-10-25]
29. T7 Denied a shortcut that exists: look up the live list before saying one does not exist. [2026-10-25]
30. T8 Duplicate answers (one message answered 2 or 3 times, 139 of 386 rows silent): one run per message, skip already-answered, never two runs at once. Biggest hidden cost. [2026-10-25]
31. T9 Speech arrives in pieces: wait for a 4 to 6 second quiet gap and answer the pieces together. [2026-10-25]
32. T10 Ignore tiny stray input (fewer than about 3 characters or words) unless it names Amit or follows a question. [2026-10-25]
33. T11 Mention an open item once, then drop it. [2026-10-25]
34. T12 Stop arguing "there is one Amit" repeatedly. [2026-10-25]
35. T13 Keep a per-person style note ("short answers"). [2026-10-25]
36. T14 Do not time out listening during a live transcript or typing. [2026-10-25]
37. T15 Words that sound like "Amit": Ryan adds the pairs; treat clear near-matches as the name and offer to save. (The Wisdom/words work touches this; unsure if finished.) [2026-10-25]
38. T16 Transcribe voice messages when sent and give Amit the text. [2026-10-25]
39. T17 Open photos (download into the sandbox folder; needs a safety review). (Show Amit button of 2026-10-31 lets Amit read one allowed picture; unsure if finished for chat photos.) [2026-10-25]
40. T18 Close or create a pursuit from the chat; show today's prayer; read a song's lyrics: decide which become real tools. [2026-10-25]
41. T19 Dedupe the team message send; teach it that the owner account is part of Amit's team. [2026-10-25]
42. T20 Review and redact the test chat before it is shared; stop Amit volunteering private details. [2026-10-25]
43. R1 Close or complete a pursuit from within AmitChat (text or voice). [2026-10-25]
44. R2 Connect AmitChat to AmitCoder so coding work can be triggered by text or voice. [2026-10-25]
45. R3 Create a pursuit from AmitChat; manually log the "Modify AmitScan" pursuit with the scope given in the entry, target about one month, medium priority. [2026-10-25]
46. R4 Let Amit in chat generate or retrieve today's Prayer Panel content. [2026-10-25]
47. R5 Idle/listening fixes: stop repeating already-said content, judge whether the talk is finished, add a "turn off completely" state. [2026-10-25]
48. R6/R7 (one request, sent twice) Standing rule requiring Amit to read an app's own live source/build notes before answering "is X built". (Unsure if finished.) [2026-10-25]
49. E1 Two-person chats: answer without name or pause (later built as the solo and presence rules; unsure if finished). [2026-10-22 inbox]
50. Suggested order from the entry: T8 and T9, then T1 to T4, then T14 and T15, then section D features, T20 before anything is published. [2026-10-25]
51. Very large pages (who_is_god 333 KB to 1.17 MB) are cut off in one fetch: read in pieces, not done. [2026-10-23]
52. Writes/actions (Amit doing things for a person) not built, only when Ryan asks. [2026-10-23]
53. Named shortcuts still target the old AmitBooks tables; recheck when AmitBooks NEW replaces it. [2026-10-23]
54. Amit's answers from the live readings: the rules do not yet say to rely on the `computer` text; needs rules published and helper restarted. [2026-10-31]
55. Wisdom, not built: "My Wisdom" tab to see and delete notes; spiritual notes into the compass (look at how the Hub updates compass_profiles first); end-of-day review of missed answers. [2026-10-31]

## C. Helper, Amit Live window, ring, voice, Show Amit
57. Real end-to-end test of the Show Amit button (press, upload, real Amit answer about a picture); needs window page and engine pushed. [2026-10-31]
58. Real watch of: ring release (v1.24.1/v1.28), click-away close (v1.24.2), middle button start Voice, v1.26 centre-icon Ask Amit, v1.27 window in front, offline page and ms-settings links, window on screen, taskbar icon, the 2026-10-30 window look. [2026-10-29, 2026-10-30]
60. Rollback risk until helper files + manifest are pushed: the Hub's updater compares with the published older manifest and has no downgrade check. [2026-10-30]
61. Installer must incorporate everything from the session; full list in ComputerHealth\Sessions_Log.md top block. [2026-10-30]
62. Cause of "something broke within the Computer Health" not found; symptom not described by Ryan. [2026-10-30]
63. Helper change: open the window small on a repeat open (removes the brief resize). [2026-10-31]
64. Reading the person's to-do list from the Amit Live window not tried. [2026-10-31]
65. Weather tile: no alerts yet. [2026-10-31]
66. My Words moves into the Amit Live window later; embedded `/whisper` page may be refused by frame rules (untested); the browser's Local network access prompt must be allowed once; a person whose Hub login is in another browser sees a sign-in message. [2026-10-30]
67. Thresholds for the Computer Health tab verdict are mine (memory 80/90, drive 20/10, processor 70/90); Ryan may change. Route not tested inside the running bridge. [2026-10-30]
68. First-run explanation of the Local network access permission in Connect Amit. [2026-10-29]
69. A real automatic update on a computer that is behind not yet seen. Hub flow with the format-version line in `my_words.txt` not built; `amit_devices` helper_version/last_seen not written. [2026-10-29]
70. Per-button mouse remapping (only the ring button row is applied). [2026-10-29]
71. Spoken "x" shortcuts expanding by voice everywhere: proposed, not built. Does the chat box take Voice commands? untested. [2026-10-29]
72. Flaw: at the numbered "Did you mean" list, saying a command name is ignored; only a number works. [2026-10-29]
73. Move "How I Say Things" into Communications > Shortcuts: not decided. Communications tile still says "Email . Chats". [2026-10-29]
74. Send a spoken shortcut to Amit (Ask Amit path); AmitCoder J/F shortcuts and keyboard shortcuts into the same sync; optional helper pulls from the database itself. [2026-10-29 next steps]
75. Voice not tested live: real Pause/Break, the listening page in command mode, Dictate taking over, the three bridge routes in the running bridge, the Hub's real fetch to localhost from the live site. [2026-10-29]
76. The AmitCoder J/F shortcuts area in Communications > Shortcuts is a placeholder, not connected. [2026-10-29]
77. Voice commands design questions still open in the entry: shortcut key, say result aloud or only show, default commands, label wording (design later built; unsure if finished). [2026-10-29]
78. Show Amit: other kinds of thing to show (web page, link, file, attachment) not built. [2026-10-29]
79. Show Amit editor ideas not built: marks list inside each layer; set-as-default font; multi-line text; alignment; rich text with mixed fonts in one box; switch to Move after Enter on new words; dragging, resizing, recolouring a selected mark; selecting several marks; pen width; layer lock; delete a saved picture from the panel; fit-to-window and minimap; a mouse shortcut for Save View; a "close without saving" button. [2026-10-29]
80. Show Amit look pass: Ryan dislikes the top bar and menu look; a more modern Amit-feeling redesign when he asks. [2026-10-29 v1.14, v1.19]
81. Retest pasting a Show Amit picture into VS Code after install (v1.22.1). [2026-10-29]
82. 4K screen capture loses about 20 percent detail (helper is DPI-unaware): ask which screen he mostly captures before building. [2026-10-29 v1.12]
83. Show Amit database tables `Sho_*` (shots, layers, marks, members) with RLS, grants and audit trail: written down, not built. [2026-10-29]
84. Cause of the editor drag problem with VS Code was not proven (v1.09). [2026-10-29]
85. Second ring (sub-actions) and database-driven ring choices not built. [2026-10-29 v1.06]
87. Whisper mode: real speech through the real microphone not verified; tap-to-start toggle, silence cutoff, Hub About Me card, tray menu item, Escape to cancel, Mac: not built. [2026-10-26]
88. Whisper: Edge listening window keeps recognising while minimized for a long dictation not confirmed. [2026-10-26]
89. `amit_mobile_watcher.ps1` is not in `Install_AmitTracker.ps1`'s file list; a fresh install may not get the Amit Mobile listener. Check. [2026-10-26]
90. Closing-sequence trigger list in CLAUDE.md still names other phrases than the hook now uses; not edited (needs Ryan's authorization). [2026-10-29 hook fix]
91. Hub tells the person when a newer version is live (idea, not built). [2026-10-18]

## D. Chat engine, Ask Amit, data gate, safeguarding (older and carried)
92. Item 4 (see A14). Root CLAUDE.md path table repeats the application list; clean up later. [2026-10-23]
93. The answering computer only auto-starts from the Hub. [2026-10-23]
94. Public `AmitChat\CLAUDE.md` build notes and root CLAUDE.md "WHERE WE LEFT OFF" not updated for the work (root needs Ryan's authorization; propose exact text first). [2026-10-23]
95. Known limits: a person added later can scroll back and read an earlier data answer; guardian can view a minor's chat; data passes through the answering computer and the AI provider. [2026-10-23]
96. Searching a person's older messages in other chats as a fallback for the words list: not built. [2026-10-23]
97. Screen in the chat to add a person to an existing chat: none yet (database check covers any future button). [2026-10-23]
98. Hub UI to manage the team (add with `cha_team_add` by hand today); fix the old open `amit_inbox` table (world-readable, visitor code function needed); email heads-up deferred. [2026-10-18]
99. Any-computer owner sign-in mode (`--login`, refresh token, owner functions), then the service-key file should leave OneDrive (it lives in a synced folder). [2026-10-17, 2026-10-18]
100. Hub "Run Amit here" switch (cha_answerers enabled column); start the watcher with Windows on Ryan's computer (needs his OK); integrate the watcher into the shared bridge. (Unsure if finished.) [2026-10-17]
101. Scope statement and a weekly usage view; Claude-account gating now "an answerer is online". [2026-10-17]
102. Look into why the Hub's spoken hello and returning greeting stopped working (not investigated). [2026-10-17]
103. "Bring in this page" (card with deep link and page text; Devotions first; AmitBooks later with preview and confirm). Build after the TJ test. [2026-10-17]
104. Live audio call in the chat (WebRTC phases 1 to 4), transcription of people the browser cannot hear (second engine), consent and recording rules. Not built. [2026-10-17]
106. Availability light and per-chat gating of Add Amit. (Ask Amit online status was built; unsure if finished.) [2026-10-17]
107. Known issues: small-box icons wrap to a second row; friend-code guessing has no rate limit; a removed member may keep a file already opened; birth dates self-declared; skip-my-own is per device; no unread marker on speaker buttons; one doubled "started a live transcript" line unexplained. [2026-10-17 Current State] (also: 2026-10-14 tests ran against the database interface, not the page [CLAUDE.md])
108. iPhone live transcript: confirm which Ryan meant (Safari vs home-screen app). Real-device checks (microphone, phones). [2026-10-17]
109. Email count in the Hub Communications tab blocked on a real Gmail connection. [2026-10-11] (also: Gmail connection for the Email tab count, or an Amit email address, needs a domain [CLAUDE.md])
110. Publishing the template scaffold on hold until Stage 1 works; skeleton items from the first decisions (acquaintance meaning, find-by-link-only, Mail rename timing, etc.) were settled in CLAUDE.md. (Unsure if finished.) [2026-10-11]
111. pg_cron automatic purge only if available; leftover files from deleted chats cleared only when `amit_admin.js sweep` runs. [2026-10-15]
112. Old test files with hard-coded version strings fail only on those strings. [2026-10-17]
113. Public notes out of date or never pushed (list in the 2026-10-18 entry; may hold client or financial detail, review first). Local AmitHealth CLAUDE.md is 2 KB versus 17 KB public: do not push until checked. [2026-10-18]
114. Subscription-terms note: revisit only if Ask Amit becomes a public service for strangers at scale. [2026-10-17]

Open count: 110 numbered items remain after de-duplication (numbers 56, 59, 86 and 105 were removed as duplicates; numbering kept so cross-references still work).

## Resolved (kept so the judgment can be checked)
- Hold-menu idea for push-to-talk [2026-10-28]: built as the Amit Live ring (v1.05/1.06) on 2026-10-29.
- Show Amit capture and name [2026-10-29]: built v1.07; installed and confirmed v1.10.
- Zoom, drag, layers, select, format bar, Live Shots panel (v1.11 to v1.22.1): built, installed, confirmed by Ryan except where noted in section C.
- Send to Amit from Show Amit [idea 2026-10-29]: built 2026-10-31 (Show Amit button).
- Voice command mode, My Words sync, system vs personal commands, middle button Voice, automatic updates: built and (for v1.23) confirmed by Ryan 2026-10-29.
- Generic data gate, Ask Amit on every page, new-member check, My Words tab, check-the-list before answering [2026-10-23 Update]: done and verified live.
- Engine v0.24 dictation asks Amit after silence [2026-10-22]: pushed (commit 6bc2c7c per 2026-10-23).
- Ask Amit first slice (chat v0.19), listening, help chat, press = call him in, solo and presence rules, send to team, application list, rules in the database [2026-10-17 to 2026-10-18]: built; pushed 2026-10-18 (76d19e5) for the later parts; migrations through _027 run by Ryan.
- J chat retired from use [2026-10-17, Ryan's decision]; helpers kept as fallback until he says remove.
- Chat Stage 0 to v0.18 (friends, safeguarding, voice, read-aloud, live transcript, layout): built and mostly pushed [2026-10-11 to 2026-10-17].
- Rollback of Ryan's own credentials file after a test overwrote it [2026-10-16]: instruction to open the Hub signed in once.


## FROM CLAUDE.md (captured 2026-11-14)

### Open decisions noted in CLAUDE.md
- Not yet decided: whether Amit can ever answer without Ryan's session open (needs the server-side proxy) (unsure if finished: the answering program amit_ask_watcher.js now answers on Ryan's computer).
- Open design: how a guardian account is linked (safeguarding decision 5).
- To confirm: 'acquaintances' means people from earlier shared chats, added automatically, one-way, not shown as friends (decision 7; unsure if finished).
- Hand-off idea: pin a chat to a pursuit so a solved problem becomes a Hub memory (not planned). (also: "Pin a chat to a Hub pursuit or memory" listed under Later)
- Template change (adding chat icon to Templates\template.html right rail) only if Ryan says so.
- Not in migration _001 yet: safeguarding enforcement (needs ages at sign-up), friends-list visibility setting, acquaintances, delete-whole-conversation (unsure if finished: later migrations may have added them).

### Staged build checklist copied from CLAUDE.md (every box was unchecked in CLAUDE.md; much of Stage 0 and 1 is built per the log and Resolved list, so treat as (unsure if finished) and compare with the numbered items above)
### Stage 0: Foundation (before any chat code)
- [ ] Show Ryan the skeleton (tables and screen sketch) and get approval (SAMPLE FIRST).
- [ ] Tables with grants and row-level security in one migration: Cha_Conversations, Cha_Participants (status invited/accepted/removed, role, last read message, notification level), Cha_Messages (message_type, JSON payload, reply_to, edited_at, status new/answered), Cha_Items (typed objects: checklist step, decision, question, prayer request, study note), Cha_Attachments. Ryan runs the migration by hand.
- [ ] Rules for live updates and file storage match the table rules; tests that try to read, change and delete as an outsider and as a removed member (EXTERNAL-FACING TESTING STANDARD).
- [ ] Register the program name AmitChat for pursuits.
- [ ] Be honest in the app that it is protected at rest and in transit, not end-to-end encrypted.

### Stage 1: Text chat usable by Ryan and TJ
- [ ] Friends: Cha_Friends table (requester, addressee, status pending/accepted/blocked), friend link or code, accept/decline/block. Friends lists are visible to other people, like Facebook (Ryan, 2026-10-11), with a visibility setting per person; proposed default is visible to your friends only, and a minor's friends list is never shown to adults outside their approved circle. New chat picks only from friends.
- [ ] Who appears when adding people to a chat (Ryan, 2026-10-11): a chat can include anyone, but the pick list pre-fills only with friends and acquaintances. Anyone else (for example a subcontractor) and Amit are added manually, by friend link, code or email, and are not in the pick list. Proposed safeguard: a manually added person gets an invitation they accept before they see anything, can decline or block, and the app does not reveal whether an account exists. Adding a minor still follows the safeguarding rule. To confirm: "acquaintances" means people from your earlier shared chats, added automatically, one-way, not shown as friends.
- [ ] The chat engine as one shared module, mounted as (a) the popup chat box opened from a right-rail chat icon with an unread-chats badge (decision 16) and (b) the Communications Chats tab. Build the popup first; the tab hosts the same engine.
- [ ] Sign in through the Hub login; create a conversation; invite and accept.
- [ ] Bubbles with names; page refreshes every 5 seconds (only newer messages, paused when hidden) plus a Refresh button.
- [ ] Unread per conversation, a "you read up to here" line, read receipts and typing indicators (typing over live channels, receipts as one last-read pointer per person).
- [ ] Reply to a specific message, edit with an "edited" mark, drafts kept, "Sending..." state, Send Silently.
- [ ] Search with Postgres full-text. Pin and Note message types. Private note only you see. Other person's local time in the header. Export a conversation.
- [ ] Owner can remove someone (they lose live access immediately); old messages stay as "Former participant". Hide for me.
- [ ] Simple mode: large text, high contrast, big buttons, no swipe-only actions.
- [ ] The VS Code "check" routine as a J shortcut: Ryan's words are instructions; everyone else's are conversation data; Amit answers in the table, marks messages answered. Amit's replies use the Research Standard (the eye) for Scripture.

### Stage 2: Files and troubleshooting, and the Communications page
- [ ] Documents and photos (private storage, short-lived signed links, big photos shrunk in the browser).
- [ ] Screenshot blur and arrows that change the real pixels, with a preview before sending. No promise of automatic secret detection.
- [ ] "Help me fix this" guided intake (what were you doing, what happened, what have you tried), plus browser details (browser, screen size, language; the page cannot read more than that).
- [ ] Pinned step checklist: done / didn't work / can't do. Long pasted logs collapse.
- [ ] Resolution record with cause marked Confirmed, Likely or Unknown.
- [ ] Hub: Mail page becomes Communications with tabs For me, Chats (unread count in the name), Email (launcher, no number); total unread at the top; badge on the Hub tile.
- [ ] Notification levels per conversation, quiet hours, and an optional Sabbath quiet mode (Friday sunset to Saturday sunset).

### Stage 3: Memory, voice and care
- [ ] Voice: record with a browser transcript stored beside it, dictation, read-aloud with Amit's speech engine.
- [ ] "Since you were last here" summary on reopening (made by Amit on request).
- [ ] Typed objects in a conversation (decision, question, prayer request, study note) and human-confirmed knowledge cards linked to the source messages.
- [ ] Open Loops: Amit suggests follow-ups (an unanswered question, "I'll send it Tuesday," a prayer request) when Ryan says check; each is accepted, snoozed or dismissed; nothing goes to others automatically.
- [ ] Answered-prayer record. Prayer requests marked confidential are skipped by search and by Amit and cannot be forwarded.
- [ ] No forwarding of private messages. Correction is private and gentle first; the AI never judges who is right.
- [ ] Sensitive mode (auto-delete after 30 days, no file previews); delete-for-everyone rules per decision 6.
- [ ] Offline queue and low-data mode.

### Later
- Video: a "Start a video call" button opening a private Jitsi room first; an embedded call only if it gets real use.
- Semantic search (pgvector) once full-text search proves too limited.
- Push notifications (needs a service worker).
- Sealed end-to-end mode per conversation (no AI, device-only search).


### 'MY LIFE' future project (Ryan, 2026-10-15), copied from CLAUDE.md (also item 105, [2026-10-15], same project)
Ryan's words: call it **My Life**. Posts that anyone in the community can write, with photos and so on, like Facebook. The whole system around Amit is centered on God: this is a Christian / Messianic community, so nothing vulgar can be allowed. NOT built; recorded as a to-do so it is planned for when the chat is finished.
What it will lean on (already built): accounts and friends, friends-list visibility, the adult / young-person rules, guardians reading their children's activity until 18, photo upload, reporting-ready structure.
Open questions for when we start (Amit's honest read, for Ryan to decide, not decided):
1. "Anyone can say anything" and "nothing vulgar" pull against each other. A feed needs written community rules (a short statement of faith and conduct each person agrees to), automatic screening for profanity and obscene images, a Report button on every post and comment, and a human who actually reviews reports (today that is only Ryan). Without that last piece it will not stay clean.
2. Moderation is the real cost, not the code. Decide who reviews, how fast, and what happens to repeat offenders (hide, warn, suspend, remove).
3. Young people: posts by or visible to under-18s need the same guardian rules as chat (a guardian can see their young person's posts; adults cannot message or friend them without the guardian).
4. Reach: who sees a post (friends only, friends of friends, everyone signed in) and per-post choice; start narrow (friends only) and widen.
5. Photos and video cost storage; set size limits and keep the private-link model.
6. Possible God-centered features Facebook lacks: prayer requests, testimonies, answered-prayer posts, Scripture attached to a post (with the Research eye), "Praying for you" instead of a plain Like.
7. Name and place: a Hub tile "My Life" under Communications; its own tables with the Mly_ prefix (first three letters of the module) per the table-naming rule; own folder and CLAUDE.md created through J New when work starts.

## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)

### Part of: Where we left off on 2026-10-18
- Ryan retests: does the watcher eye show on v8.37, does the Ask Amit chat greet, does presence work with TJ in the chat [P5] - No notes in the pursuit; part of: Where we left off on 2026-10-18. [hub:d08b1697-74b9-4bc7-919f-1513be676bc3]
- Ryan answers: add a Come in now button? and keep the 30 s pause? [P5] - No notes in the pursuit; part of: Where we left off on 2026-10-18. [hub:fd6e247b-0ec2-48ea-9eeb-3b1f032e0867]
- Ask Amit from non-chat pages (books, game) through help chats; scope statement and usage view; put the watcher eye into Templates\template.html [P5] - No notes in the pursuit; part of: Where we left off on 2026-10-18. (overlaps item 101 on scope statement and usage view; adds help chats on non-chat pages and the watcher eye in the template) [hub:5804b971-0377-41f3-8d29-dfaac8dade9a]

### Part of: Where we left off on 2026-10-26
- FIX - Remove the 14 extra accounts (#4, #5, #7-#18), keeping #1 Ryan, #2 test login, #3 (name omitted), #6 Amit: script ready at AmitChat\remove_many.js, needs Ryan's confirmation [due 2026-10-27] [P5] - No notes in the pursuit; part of: Where we left off on 2026-10-26. [hub:b6e49005-60f9-4887-a368-cf12f05c8e36]
- WIRE - Reply screen, stand-down switch and a replay test gate for the answering Amit; write the standing requirement into AmitChat\CLAUDE.md [due 2026-10-27] [P5] - No notes in the pursuit; part of: Where we left off on 2026-10-26. [hub:40b8cffd-7248-482b-9516-99825c5202fe]
- FIX - Listening: hold 15 minutes after Amit asks a question, and a reply to his question needs no name (new migration, then helper change) [due 2026-10-27] [P5] - No notes in the pursuit; part of: Where we left off on 2026-10-26. [hub:1319a8f2-3849-4ff9-a373-634e090d4801]
