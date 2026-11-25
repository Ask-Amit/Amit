# Handoff: custom script buttons (2026-11-24, from Ryan's session to Robin's)

READ THIS FIRST, then `Sessions_Start.md` in this folder: the block called "RESUME: AmitHelper - Custom script buttons (2026-11-24, session cf3ab537)". Nothing else needs reading to start.

## Where things stand (one minute)
- Helper 2.23 and installer 5.31 are pushed and live. Ryan's computer is on 2.23.
- The first real button, "Quick note", is built, approved and on Ryan's bar. It is not yet confirmed that Ryan pressed it.
- NOT PUSHED yet (push only when Ryan or Robin says "push"): the fingerprint fix in `amit_script_buttons.js`, Hub v9.08, the test fix, migration 055's file, the notes, Living Testimony v1.72. Until pushed, the Hub's "Ask Amit to create" fails at the save step. The repo copies of `amit_script_buttons.js` and `Hub\amit-hub.html` are the OLD ones: copy the local files over, check `git diff --cached --name-only`, commit, push once.
- Migrations 051 to 055 are all run.

## First things to do, in order
1. Ask Ryan or Robin whether the Quick note pop-up worked (press the tile on the bar: practice run, then run).
2. Push the unpushed items together when told "push", then check Hub v9.08 is live.
3. Build your first real button from the Hub (Helper tab, Custom script buttons, + New script button). The spreadsheet job still needs the file's location, the tab and the second value.

## The plan, and where it is written
- The end state and its stepping stones: `AskAmit\Sessions_Design.md`, "THE END STATE AND THE STEPPING STONES" and "THE GATE". Next step in that plan: survey how each program handles permissions, then a written design (cost at 1, 100 and 10,000 people), no building until read.
- The button builder's design: `Button_Creator_SPEC.md`, sections 11 to 11.15.
- Not verified: whether a person's own Claude plan allows the Helper to run Claude Code in the background; the Claude sign-up link for the gate screen.
- Only the owner can build buttons until the own-Claude connection exists.

## Rules that apply
HELPER_RELEASE_RULES.md for any Helper release; migrations are run by hand in the Supabase SQL editor (give the SQL in an action banner); never push without "push".
