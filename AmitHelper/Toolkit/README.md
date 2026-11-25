# Custom script buttons: the Toolkit (2026-11-24, v0.1, development, NOT released, NOT installed)

Spec: `..\Button_Creator_SPEC.md` section 11. Builder rules: `..\Button_Builder_Rules_DRAFT.md`. Press-time pop-up preview: `..\Previews\AmitHelper_buttonpopup_preview.html`.

## What is here
| File | Job |
|---|---|
| `never_list.json` | THE never list: one file, regex rules with a plain sentence each. Read by the Helper (authority) and, later, by the Hub (light pre-check). Delivered by the updater so it can improve. |
| `amit_script_check.ps1` | Static scan of a script against the never list, plus a "does it parse" check. One json line out; exit 0 ok, 2 not ok. Run before a script is saved AND before every run. Not a sandbox. |
| `AmitToolkit.psm1` | The safe toolkit a script must use for anything risky: `Read-AmitFile`, `Write-AmitFile` (temp file, verify, dated backup, rename), `New-AmitDraft`, `Send-AmitMessage` (locked, no transport yet), `Show-AmitNotice`, `Get/Set-AmitClipboardText`, `Get-AmitAnswer`, `Test/Add-AmitDone`, `Request-AmitAnswer` (mid-run question), `Test-AmitPractice`. Enforces: practice mode, folder jail, actions per press, recipients, no-send hours, sending unlock. Saves progress after every action. |
| `amit_script_host.ps1` | Runs ONE script inside the toolkit and always writes the result file; maps technical errors to a plain sentence. |
| `amit_run_script.ps1` | The RUNNER the Helper calls: fingerprint check, scan, starts the host hidden, owns the time limit and Stop (`stop.flag`), kills the process tree, builds the result from progress if stopped or crashed. |
| `tests\test_toolkit.ps1` | Proves all of the above in a temp folder (about 40 checks). Run it after any change here. |

## Added later the same day (see the spec, section 11.11)
| File | Job |
|---|---|
| `amit_script_routes.ps1` | The Helper bridge's `/api/script/*` routes (Hub: sync, place, neverlist, source, inbox, inbox-done; local: open, stopall, status; pop-up with a one-time token: popup-config, run, result, stop, answer, answers). Loaded by `amit_bridge_server.ps1` only when such a request arrives. |
| `AmitScriptPopup.html` | The real pop-up window (the approved look). Opened by the Helper beside the bar when a `run_script` step is pressed. |
| `sync_to_watchers.ps1` | Copies the runtime files flat into `ComputerHealth\Watchers\` (the Helper is delivered flat) (does not install or release). |
| `tests\test_routes.ps1`, `test_popup.js`, `test_hub_module.js` (+ `route_test_server.ps1`, `hub_stub.html`) | Route tests (35), the pop-up driven in a hidden browser, the Hub module with a fake database. |
Outside this folder: `Amit\amit_script_buttons.js` and `Amit\amit_button_build.js` (the Hub module and the shared reply reader), `AskAmit\engine\rules\BUTTON_BUILD_MODE.md` + engine v1.08 (build mode), `Database\migration_..._051/_052/_053` (run) and `_054` (draft), the J shortcut `make button`.
To run everything: `powershell -File tests\test_toolkit.ps1`, `powershell -File tests\test_routes.ps1`, `node tests\test_popup.js`, `node tests\test_hub_module.js`, `node ..\..\AskAmit\engine\button_build_test.js`. Run the long ones in the background.

## The press flow these pieces serve
1. Person presses the button; the pop-up asks the questions (the Helper pop-up, to be built from the approved preview).
2. The Helper writes a JOB file and runs the script in PRACTICE mode first; the result's `wouldHave` list is the content of the CHECK SCREEN (what will be changed or prepared or sent).
3. On Go (after the countdown) the Helper writes a new job with `mode: real` and runs it. Stop / STOP ALL create `dirs.state\stop.flag`. Mid-run questions appear as `dirs.state\ask.json` and are answered by writing `answer.json`.
4. The result file drives the result card (what finished, what did not, what next) and a one-line summary row in `hel_button_runs`. Message text, recipients and file contents stay in the local `run.log` and the outbox, never in the shared database.

## The job file (json, written by the Helper)
`buttonId, buttonName, mode (practice|real), scriptPath, expectedHash (SHA256 of the approved script, or empty), answers {variable: value}, permissions {reads, writes, sends, clipboard, folders[], allowedRecipients[], maxActions, maxSeconds}, settings {blockedRecipients[], noSendFrom, noSendTo, sendingUnlocked, scriptTimeLimitSec}, dirs {work, backups, outbox, logs, state, scripts}, resultPath`

## The result file (json, always written)
`ok, outcome (done|stopped|failed|limit_reached), mode, startedAt, finishedAt, counts {read, drafted, sent, changed, actions}, finished[], notDone[], wouldHave[{kind, detail}], notices[], backups[], error {kind, plain} | null, summary`
Error kinds: `refused, script_changed, script_missing, script_crashed, script_error, limit_reached, time_limit, stopped_by_user, path_not_allowed, not_permitted, file_missing, file_busy, write_failed, bad_recipient, recipient_blocked, recipient_not_allowed, sending_locked, quiet_hours, no_transport, no_answer`. The `plain` sentence is what the person sees.

## Honest limits
- Not a sandbox. A script that skips the toolkit is not stopped by it; the scan, the approval box and the practice run are the other layers.
- Real sending is not available: there is no connected mail account (the sign-in store is separate research). `New-AmitDraft` prepares messages in the outbox for the person to send.
- Not yet connected to anything: the Helper bar (the "Run script" step), the Hub, Ask Amit builder mode, the pop-up window. Installing needs the Helper release rules (`..\HELPER_RELEASE_RULES.md`): new files must be named in the updater and installer lists.
- Windows PowerShell 5.1 only. Scripts are written ASCII (or UTF-8 with BOM when they contain other characters).
