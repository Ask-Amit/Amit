@echo off
REM Amit — process the local inbox once, triggered by AmitBooks' "Send
REM Selected to Local Processing" button. Event-triggered, not a timer —
REM this only ever runs because something was just sent. See
REM ComputerHealth\CLAUDE.md for the full design.
REM
REM SECURITY: each item's own .json metadata carries that USER's own
REM Supabase access token — never the service-role key. Results get
REM written back scoped to that one user's own data, via the normal
REM anon-key + user-JWT pattern (same as the browser itself uses),
REM enforced by the same Row Level Security every other AmitBooks write
REM already relies on.
REM
REM REQUIRES Claude Code's CLI installed as "claude" on this computer,
REM AND a one-time "claude auth login" + "claude setup-token" already
REM run by the account owner (see ComputerHealth\CLAUDE.md).
REM
REM --safe-mode, not --bare: confirmed live 2026-08-01 via "claude --help"
REM that --bare strictly requires an ANTHROPIC_API_KEY and NEVER reads a
REM signed-in subscription (OAuth/keychain are explicitly never read in
REM that mode) - wrong for our model, which is built entirely around
REM using the customer's OWN Claude Pro/Max subscription, not an API key.
REM --safe-mode still skips CLAUDE.md/hooks/plugins/etc. for a clean,
REM minimal run, but auth/model/tools/permissions all work normally,
REM meaning it correctly uses the signed-in subscription.
REM
REM --allowedTools restricts it to reading local files and running Bash
REM (for the curl calls that write results back and clean up) — nothing
REM else; per Anthropic's own docs, an attempt to use anything outside
REM this list aborts the run rather than silently doing something
REM unauthorized.

echo.
echo ================================================================
echo  Amit — Local Receipt Processing
echo ================================================================
echo  This reads what was just sent from AmitBooks, proposes vendor,
echo  date, amount, and Scope for each item, and writes the proposal
echo  back for you to review — nothing posts automatically.
echo  This uses YOUR OWN Claude account. Amit never sees or stores it.
echo ================================================================
echo.

REM Check sign-in status first and speak plainly if it's not ready yet,
REM instead of letting the actual claude call fail with a cryptic error.
for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "try { (claude auth status 2>$null | ConvertFrom-Json).loggedIn } catch { 'false' }"`) do set CLAUDE_LOGGED_IN=%%A

if /I not "%CLAUDE_LOGGED_IN%"=="True" (
    echo  NOT CONNECTED YET.
    echo.
    echo  To process receipts on this computer, AmitBooks needs to connect
    echo  to your own Claude account — this is separate from your Amit
    echo  sign-in. Your Claude credentials go straight to Anthropic,
    echo  never through Amit or stored anywhere here. This only needs to
    echo  happen once on this computer.
    echo.
    echo  To connect now, open a terminal and run:
    echo      claude auth login
    echo  Then, once that finishes:
    echo      claude setup-token
    echo.
    echo  After that, just send receipts from AmitBooks again — this
    echo  will run on its own from here on.
    echo ================================================================
    exit /b 1
)

echo  Connected. Processing now...
echo ================================================================
echo.

claude --safe-mode -p "Process every image file in C:\Users\user1\AmitInbox that has a matching .json metadata file. For each pair: (1) Read the image directly and extract what's actually on it - vendor/business name, date, total amount, and every individual line item if it's an itemized receipt or invoice. (2) A single receipt can span more than one trade or Scope at once - do not force everything into one bucket. In this system, 'Scope' is the established term for what a QuickBooks user might call a cost code - the umbrella grouping a line item belongs to. Group the line items into as many distinct Scopes as the content actually supports (for example: a hardware store run might genuinely contain both plumbing materials - PVC pipe, fittings, valves - AND framing materials - 2x4 lumber, joist hangers - on the same receipt, which is two separate Scopes). For each group, propose a Scope and Cost Type from what's actually written, plus a subtotal for that group if it can be determined. Anything that doesn't clearly fit an identifiable Scope goes into its own 'Unidentified materials' group rather than being force-fit into the wrong one or silently dropped - an honest 'unidentified' is more useful than a wrong guess. Only propose what the content actually supports. (3) Build a JSON object with fields: vendor, date, amount, line_items (array), scope_breakdown (array of objects: {scope, cost_type, items, subtotal, confidence_note}), confidence_note (overall honest note on how confident this whole proposal is and why). (4) Write that JSON back to Supabase using curl: PATCH https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/scan_captures?id=eq.SCAN_ID (SCAN_ID from that item's .json metadata 'scan_id' field), headers: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF, Authorization: Bearer ACCESS_TOKEN (ACCESS_TOKEN from that item's .json metadata 'access_token' field), Content-Type: application/json, Prefer: return=minimal, body: {\"extracted_data\": <your JSON object>, \"processed_at\": \"<current ISO timestamp>\"}. Never use any other credential for this - only the access_token found in that specific item's own metadata file, which is scoped to that one user's own data. (5) Only after the curl call succeeds, delete both that item's image file and its .json metadata file from the inbox. (6) Report a plain-language summary at the end: how many processed, how many failed and why, and for each one, what Scopes were found." --allowedTools "Read,Bash" --output-format json
