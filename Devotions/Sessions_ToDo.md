# Devotions - Sessions_ToDo
Items found in the old Sessions.md (now in Backups\Devotions\Sessions_backup_2026-11-13.md) only. Source entry date in [brackets].

## Push and run
- Push the local Devotions work (v1.36 to v1.44) when Ryan says "push" (live is v1.29). [2026-10-15, 2026-10-16] (unsure if pushed since)
- Run migration _013 (Who_Custom_Churches etc.) in the Supabase SQL editor. [2026-10-16]
- Run migration _014 (Who_Researched_Churches). [2026-10-16]
- Real-table test of the fellowship features (only tested against a stand-in database). [2026-10-16]

## Who Is God / fellowships
- Decide whether The Appointed Times also moves into Feasts as an introduction (shifts tab numbers for existing #page=2&tab=N links). [2026-10-15] (the later entry put it as first tab of Feasts; unsure if settled)
- Port remaining interactive pieces and data as needed; sign-in saving/sharing for Add my fellowship superseded by the request flow. [2026-10-15 later]
- "Why did we land here" explanations and challenge flow; language study page. [2026-10-15 later] (unsure if finished: v1.43 added "Why did we land here" and challenge)
- No real fellowship has been researched yet; build a screen for Ryan to review challenges; pro-account gating. [2026-10-16 v1.44]
- Retiring who_is_god.html: not planned. [2026-10-15 later]
- A hand-edited wig-app\blk3.js would be lost if the generator is re-run. [2026-10-16]

## Studies and content
- Decide whether the Passover study names the Exodus 12:48 stranger-circumcision requirement. [Current State]
- Importing the paired study content for "Blow the Shofar" (Feast of Trumpets conversation). [2026-09-11] (unsure if finished; all seven feasts now have studies) (also CLAUDE.md: finish the Feast of Trumpets tab, import the paired video/song)
- Colossians reply form's live insert was not test-fired. [2026-10-10]
- Phone width: the Devotions shell keeps its full sidebar and right rail, leaving page content narrow (pre-existing, untouched). [2026-10-10 later]

## Resolved (kept so the judgment can be checked)
- Four spring feast studies added and pushed (11eb52b). [2026-10-10]
- Difficult Passages page; Colossians rewritten from the Word and 2:16-17 corrected, pushed (1ec4021, 74b5f2d). [2026-10-10]
- "When I See the Blood" added; first-tab song button bug fixed. [2026-10-10]
- Blank-page outage from colxEye defined after first use: fixed v1.36. [2026-10-15]
- Double-encoded local Devotions.html repaired. [2026-10-16]
- Rename AmitSongs to Devotions done before any push. [2026-09-11]

## FROM CLAUDE.md (captured 2026-11-14)
### Feast of Trumpets and tabs
- Real browser sign-in/out pass to confirm the re-enabled auth listener causes no regression. (unsure if finished)
- Tab-view system: one tab per song-and-study pair (Ryan's stated direction, not built as of the CLAUDE.md note); once it exists, adding a song becomes "create a tab, drop assets, fill OG tags".
- Speaker icon is only on Trumpets; extend per tab by adding to FEASTS_WITH_SPEAKER.
- Caution: do not re-add AmitSpeak.mount() calls without Ryan asking; verify any future JS fix by running the file through node vm.Script, and use real headless screenshots (not --dump-dom) for layout bugs.



## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)

### Songs and AmitMusic
- TRAINING — Write the Tabernacles (Sukkot) full study and add its song to SONGS_BY_FEAST + AmitMusic once ready [P5] [hub:983fd917-1556-4ef3-b5fa-29189cb5a3d4]
- APP — Extend AmitMusic.html's SONGS registry and add a new stub file for each future song as it's written [P5] [hub:0a0c2fea-fb01-45cb-8a80-2ecba0cad01e]
- Generate Shut The Door in Suno with the corrected Hebraic (not-metal) style prompt and the drawn-out Yeshua cry in the chorus [due 2026-09-13] [P5] [hub:4d514628-f102-495d-ae26-805ece0769fd]
- Once downloaded, build the cover art and wire the song into AmitMusic.html the same way Blow the Shofar went in [due 2026-09-13] [P5] [hub:457b6927-e266-4a2a-97b8-0f86755f1900]

### Studies and Difficult Passages
- FIX — Live-check Devotions v1.25 Difficult Passages page and the TJ reply form [P5] [hub:7d839123-dee6-4b84-b5e3-55fa4abdc7df]
- RESEARCH — Next Difficult Passages tab: Hebrews 7-8, Ephesians 2:15, Romans 14, Galatians 4 [P5] [hub:ba00aebd-1671-4d36-b4b9-8951d09fde78]
- SPEC - Orthodox Judaism row for Church Comparisons (draft 131 of 170 at Devotions\Orthodox_Judaism_scorecard_DRAFT.md): verify the Talmud and Rambam references, write the eye notes, decide the Seven Churches entry [due 2026-10-27] [P5] [hub:fc242877-98bf-49a4-84da-81546581f56f]
