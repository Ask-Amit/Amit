@echo off
REM Amit - process the local inbox once, triggered by AmitBooks' Send
REM Selected to Local Processing button. Event-triggered, not a timer -
REM this only ever runs because something was just sent. See
REM ComputerHealth\CLAUDE.md for the full design.
REM
REM SECURITY: each item's own .json metadata carries that USER's own
REM Supabase access token - never the service-role key. Results get
REM written back scoped to that one user's own data, via the normal
REM anon-key + user-JWT pattern (same as the browser itself uses),
REM enforced by the same Row Level Security every other AmitBooks write
REM already relies on.
REM
REM REQUIRES Claude Code's CLI installed as claude on this computer,
REM AND a one-time claude auth login plus claude setup-token already
REM run by the account owner (see ComputerHealth\CLAUDE.md).
REM
REM Uses the FULL PATH to the compiled claude.exe directly - NOT
REM claude.cmd (the npm shim wrapper). Confirmed live 2026-08-01: calling
REM claude.exe directly with these exact arguments works cleanly; calling
REM it through claude.cmd from this same automated context failed with
REM "the system cannot find the file specified" for reasons not fully
REM root-caused (possibly the shim's own relative-path resolution
REM behaving differently in a non-interactive/hidden-window context) -
REM the direct .exe path sidesteps the wrapper entirely and is proven to
REM work, so that's what's used here rather than chasing the shim issue
REM further. Separately, also confirmed: the bridge process that launches
REM this .bat may have been started long before Node/npm were installed,
REM so it can carry a stale PATH that never picks up a new install - using
REM any full path here (exe or shim) avoids depending on PATH at all.
set "CLAUDE_EXE=%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe"
REM
REM --safe-mode, not --bare: confirmed live 2026-08-01 via claude --help
REM that --bare strictly requires an ANTHROPIC_API_KEY and NEVER reads a
REM signed-in subscription (OAuth/keychain are explicitly never read in
REM that mode) - wrong for our model, which is built entirely around
REM using the customer's OWN Claude Pro/Max subscription, not an API key.
REM --safe-mode still skips CLAUDE.md/hooks/plugins/etc. for a clean,
REM minimal run, but auth/model/tools/permissions all work normally,
REM meaning it correctly uses the signed-in subscription.
REM
REM --allowedTools restricts it to reading local files and running Bash
REM (for the curl calls that write results back and clean up) - nothing
REM else; per Anthropic's own docs, an attempt to use anything outside
REM this list aborts the run rather than silently doing something
REM unauthorized.
REM
REM MODE (added 2026-08-02): first argument selects which prompt file
REM runs - light for the quick whole-receipt-only pass
REM (process_inbox_prompt_light.txt, no line items, no multi-Scope
REM breakdown), anything else (including no argument at all) for the
REM full Detailed pass (process_inbox_prompt.txt). Detailed is the safe
REM default when no mode is given, since it captures strictly more.
set "PROMPT_FILE=process_inbox_prompt.txt"
if /I "%~1"=="light" set "PROMPT_FILE=process_inbox_prompt_light.txt"

echo.
echo ================================================================
echo  Amit - Local Receipt Processing
echo ================================================================
echo  This reads what was just sent from AmitBooks, proposes vendor,
echo  date, amount, and Scope for each item, and writes the proposal
echo  back for you to review - nothing posts automatically.
echo  This uses YOUR OWN Claude account. Amit never sees or stores it.
echo ================================================================
echo.

REM Check sign-in status first and speak plainly if it's not ready yet,
REM instead of letting the actual claude call fail with a cryptic error.
if not exist "%CLAUDE_EXE%" (
    echo  Claude Code CLI not found at %CLAUDE_EXE%
    echo  This computer needs it installed first - see ComputerHealth\CLAUDE.md.
    echo ================================================================
    exit /b 1
)
for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "try { (& '%CLAUDE_EXE%' auth status | ConvertFrom-Json).loggedIn } catch { 'false' }"`) do set CLAUDE_LOGGED_IN=%%A

if /I not "%CLAUDE_LOGGED_IN%"=="True" (
    echo  NOT CONNECTED YET.
    echo.
    echo  To process receipts on this computer, AmitBooks needs to connect
    echo  to your own Claude account - this is separate from your Amit
    echo  sign-in. Your Claude credentials go straight to Anthropic,
    echo  never through Amit or stored anywhere here. This only needs to
    echo  happen once on this computer.
    echo.
    echo  To connect now, open a terminal and run:
    echo      claude auth login
    echo  Then, once that finishes:
    echo      claude setup-token
    echo.
    echo  After that, just send receipts from AmitBooks again - this
    echo  will run on its own from here on.
    echo ================================================================
    exit /b 1
)

echo  Connected. Processing now...
echo ================================================================
echo.

REM The prompt lives in its own text file (same folder) and gets piped
REM in via stdin, NOT passed as a command-line argument. Confirmed live
REM 2026-08-01: embedding this prompt directly on the command line
REM failed ("the system cannot find the file specified") because it
REM contains literal escaped-quote sequences (JSON syntax) that cmd.exe's
REM own argument-boundary parsing doesn't handle the way a Win32
REM program's argv parser would - a real, documented mismatch between
REM batch-level quoting and child-process quoting, not something worth
REM fighting further. Piping via stdin (claude -p with no inline prompt
REM argument) sidesteps cmd.exe's parsing entirely - confirmed working
REM with this exact flag combination.
type "%~dp0%PROMPT_FILE%" | "%CLAUDE_EXE%" --safe-mode -p --allowedTools "Read,Bash" --output-format json
