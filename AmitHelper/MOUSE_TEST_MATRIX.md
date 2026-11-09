# Amit Mouse: independence test matrix (written 2026-11-08, from Ryan's rule)

Rule (Ryan): the mouse and its functions work no matter what else is running. Dictation and Voice must not stop any mouse function, and a mouse function must not stop dictation or Voice (except the buttons whose job IS to stop them: a plain press of the dictation button stops latched dictation; a second middle press while Voice is listening ends Voice).

Test each row on BOTH mice (main = VID_1EA7&PID_0064, second = VID_046D&PID_C52F) in THREE states:
- A: nothing running
- B: dictation running (started from the Amit Live ring, latched)
- C: Voice listening (the Voice command window)

Mark each cell PASS / FAIL / N/A. After each press the Helper's log (whisper.log) and /api/mouse/status show what it saw.

| # | Function | Expected in A | Expected in B (dictating) | Expected in C (Voice) |
|---|---|---|---|---|
| 1 | Left click, right click (main mouse) | normal | normal, dictation keeps going | normal |
| 2 | Left click on second mouse | normal | normal | normal |
| 3 | Back / forward side buttons (set action) | as set | as set, dictation keeps going | as set |
| 4 | Wheel up / down (set action) | as set | as set | as set |
| 5 | Wheel tilt (set action) | as set | as set | as set |
| 6 | Key action (a set button sends a key) | key sent | key sent to the right program, dictation words not disturbed | key sent |
| 7 | Helper-button action | runs | runs | runs |
| 8 | Single, double, hold on a mapped button | each slot fires | each slot fires | each slot fires |
| 9 | Click and drag (window move, text select) | works | works | works |
| 10 | Middle button on main mouse: opens Amit menu | opens (Voice off) | **opens, dictation keeps listening (CURRENTLY FAILS)** | second press ends Voice (by design) |
| 11 | Middle button on second mouse | opens Amit menu | **opens (CURRENTLY FAILS)** | ends Voice |
| 12 | In the open menu: wheel moves, middle chooses, Esc closes | works | works, dictation keeps going | works |
| 13 | Double right-click opens the bar | opens | DECIDED (Ryan, 2026-11-08, option 1): right press stops latched dictation; the bar opens only when nothing is dictating | same as B: by design, not opened |
| 14 | Right-button hold opens the Aurora ring | opens | plain press stops latched dictation (by design) | as designed |
| 15 | Switch set (mouse set picker / Hub) | switches | switches | switches |
| 16 | Reset a button (from main mouse) | works | works | works |
| 17 | Ctrl+Alt+Shift+M: all sets off / on | works | works | works |
| 18 | Editing pause (page editing) | middle is ordinary while editing | same | same |
| 19 | Test button (30 s) | works | works | works |

Also check, in state B: (a) the menu does not steal the focus away from where dictation is typing, (b) closing the menu with Esc or choosing an item returns the focus and dictation keeps typing there, (c) no stray click lands in the program underneath.

Safeties to re-check after any change: main mouse's left/right/middle never remapped; every other mouse keeps a way to left-click; Reset and Ctrl+Alt+Shift+M work.

Known gating to change (found 2026-11-08, amit_whisper.cs): the middle-button start (`state == ST_IDLE`), `OpenVoiceMenuStandalone` (`state != ST_IDLE` return) and `DoubleRight` (`state != ST_IDLE`). The sets code (MsApply, hook) checks only master on/off and the editing pause, so rows 3-9 and 15-19 should already pass; the test proves it.

Results go here after each run.

## Results
- 2026-11-08, Helper 1.84 (installed here, NOT pushed): row 10 in state B (dictating), main mouse: PASS (log 19:58:23, menu opened by the middle click, dictation running). Row 11 in state B, second mouse: PASS (log 19:58:47 and 19:59:04). Choosing Voice from the menu while dictating ends dictation and starts Voice (by design of the menu). Esc closes the menu and dictation keeps typing: PASS (Ryan confirmed, 20:00). Row 12 menu Cancel while dictating: PASS (closes, runs a Voice cancel). State C (Voice listening): NOT CLEANLY TESTED (20:01:36 the middle press opened the menu with no "Voice ended" line; Voice may already have ended after an empty result at 20:01:29). Helper 1.85 (installed and released 2026-11-08 20:10): wheel opens the menu while Voice is listening: PASS (log 20:12:30 to 20:12:32, Ryan confirmed). SECOND mouse (Logitech; its set is NAMED "Primary", the log's word "Primary" is the set name, not the main mouse) with Voice listening: back button (runs Helper button) PASS x2, forward (keep) PASS x2, left and right clicks PASS (log 20:13; device checked in /api/mouse/status); hold and drag highlighting like normal: PASS (Ryan reported, 20:14; a plain left drag leaves no log line). MAIN mouse (gaming, VID_1EA7&PID_0064) with Voice listening (Voice started 20:17:55): back (runs Helper button) and forward (keep) PASS, device named in /api/mouse/status and log 20:18:00-20:18:03; Voice not ended by them. Still to run: state C with Voice kept listening, and rows 1-9, 12 (wheel and middle inside the menu), 15-19 in states B and C.
