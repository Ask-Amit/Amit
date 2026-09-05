# Amit Mobile — Desktop Listener (runs as a companion watcher inside the
# shared Amit Bridge, per root CLAUDE.md's SINGLE LOCAL CONNECTION STANDARD)
# ============================================================
# This is NOT a separate app, a separate install, or a separate port. It is
# launched the exact same way amit_bridge_server.ps1 already launches
# activity_watcher2.ps1 / resource_watcher.ps1 / diagnostics_watcher.ps1 —
# a hidden background PowerShell process, started automatically the moment
# the shared bridge itself starts, stopped via a stop-flag file the same
# way those other watchers are. If Computer Health's bridge is running,
# this is running. There is nothing extra to install or start by hand.
#
# What it does, every few seconds, forever (until stopped):
#   1. Reads Database\supabase_config.md for the Supabase URL + SECRET key
#      (server-side key only — this never touches the browser-safe
#      publishable key, and this file must never run anywhere but a
#      trusted desktop).
#   2. Asks Supabase (plain REST, GET) for any amit_mobile_captures rows
#      where reply is still null.
#   3. For each one, builds a real Amit identity + mode-aware prompt and
#      hands it to a fresh, headless `claude -p` call (Claude Code's own
#      CLI — this uses YOUR OWN Claude Code login already set up on this
#      machine, not a separate API key, not a separate bill).
#   4. PATCHes the reply straight back onto that row (reply, reply_at).
#   5. The phone (AmitMobile.html) is separately polling/watching that
#      same row and shows + speaks the reply once it lands.
#
# Realtime-vs-polling note: the original design called for a Supabase
# Realtime (websocket) subscription for instant pickup. A plain REST poll
# every few seconds was used instead here because this is a PowerShell
# script, not Node — PowerShell has no natural/lightweight websocket
# client the way Node's @supabase/supabase-js does, and a short poll loop
# is far simpler and just as reliable for this use case. The lag this adds
# (a few seconds at most) is the same accepted "free tier" tradeoff
# already documented for the whole feature — not a bug.
#
# Hub-open heartbeat gate (added 2026-09-05): live replies only run while
# that user's Hub tab is open and signed in (amit_hub_heartbeat, checked
# per-row via Test-HubOpen below). Capture/save on the phone is NEVER
# gated by this - only whether THIS watcher calls Claude for a given row.
#
# Honest limitations, same as documented in AmitMobile\CLAUDE.md:
#   - Only works while the shared bridge (and this computer) is awake and
#     running — see Amit_Live_Setup_Guide.md for the Windows sleep setting.
#   - Each capture gets a brand-new, stateless claude -p call — no memory
#     across captures.
#   - Photos are acknowledged in the prompt, not actually seen/analyzed —
#     this headless CLI path has no image-pixel input. Said honestly in
#     the prompt itself so Amit doesn't pretend to have seen something.

param(
    [string]$StopFlag = "$env:TEMP\amit_mobile_stop.flag"
)

$watcherDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$configPath = Join-Path (Split-Path -Parent (Split-Path -Parent $watcherDir)) "Database\supabase_config.md"
if (-not (Test-Path $configPath)) {
    # Fallback: this watcher folder is ComputerHealth\Watchers — the Amit
    # root is two levels up from there.
    $configPath = "C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md"
}

function Get-SupabaseSecretKey {
    $raw = Get-Content $configPath -Raw
    if ($raw -match 'sb_secret_[A-Za-z0-9_]+') { return $Matches[0] }
    throw "Could not find sb_secret_ key in $configPath"
}

$SUPABASE_URL = 'https://hleqtjqojksurvkyqixt.supabase.co'
$SECRET_KEY = Get-SupabaseSecretKey
$headers = @{
    "apikey"        = $SECRET_KEY
    "Authorization" = "Bearer $SECRET_KEY"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=minimal"
}

$CLAUDE_CLI = "$env:APPDATA\npm\claude.cmd"
$NEUTRAL_CWD = $env:TEMP

$AMIT_IDENTITY = @"
You are Amit - a companion built to walk alongside people, not a generic assistant.
Amit exists to encourage, sharpen, and point people toward Yahweh (the God of Israel) and Yeshua, never
to condemn. Amit followed the biblical evidence honestly and has real conclusions of its own, but always
speaks gently, as a companion walking alongside someone, not lecturing at them. This message is coming in
through Amit Mobile - a phone app where someone spoke or typed to Amit and is now waiting for a reply,
which will be shown as text AND spoken aloud by text-to-speech. Keep replies warm, plain-spoken, not overly
long (a few sentences to a short paragraph), and avoid markdown symbols, bullet points, or formatting that
sounds strange when read aloud - plain sentences only.
"@

function Build-Prompt($row) {
    $mode = if ($row.destination -eq 'daily_walk') { 'daily_walk' } else { 'general' }
    if ($mode -eq 'daily_walk') {
        $modeContext = 'This is the "Daily Walk" tile - the phone equivalent of a morning devotional check-in. Respond the way Amit would open or carry a short devotional/spiritual conversation: warm, real, rooted in scripture and in what is actually true, inviting reflection rather than just delivering information.'
    } else {
        $modeContext = 'This is the general "Amit" conversation tile - an ordinary in-character conversation. Respond naturally to whatever the person actually said.'
    }
    $photoNote = ''
    if ($row.photo_url) {
        $photoNote = "`n`nNote: a photo was attached to this message. Be honest that you cannot actually see the photo's pixels through this connection right now - acknowledge it was received and ask them to describe what's in it, or answer based on what they say about it, rather than pretending to have seen it."
    }
    $transcript = "$($row.transcript)"
    return "$AMIT_IDENTITY`n`n$modeContext$photoNote`n`nThe person said:`n`"$transcript`"`n`nRespond as Amit, directly, in a few plain spoken sentences."
}

# Pipes the prompt over STDIN (never as a command-line argument - avoids
# Windows shell-quoting corruption of user content) to a fresh headless
# `claude -p` process, run from a neutral folder (no CLAUDE.md there to
# hijack/stall the call on a permission prompt that never comes headless).
function Invoke-Claude($prompt) {
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $CLAUDE_CLI
        $psi.Arguments = "-p"
        $psi.WorkingDirectory = $NEUTRAL_CWD
        $psi.RedirectStandardInput = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        $proc = New-Object System.Diagnostics.Process
        $proc.StartInfo = $psi
        [void]$proc.Start()
        $proc.StandardInput.Write($prompt)
        $proc.StandardInput.Close()

        $stdout = $proc.StandardOutput.ReadToEnd()
        $stderr = $proc.StandardError.ReadToEnd()
        $exited = $proc.WaitForExit(90000)
        if (-not $exited) { try { $proc.Kill() } catch {}; return $null }
        if ($proc.ExitCode -ne 0 -and -not $stdout.Trim()) {
            Write-Host "[amit-mobile-watcher] claude exited $($proc.ExitCode): $stderr"
            return $null
        }
        return $stdout.Trim()
    } catch {
        Write-Host "[amit-mobile-watcher] Invoke-Claude failed: $($_.Exception.Message)"
        return $null
    }
}

function Get-UnansweredCaptures {
    $uri = "$SUPABASE_URL/rest/v1/amit_mobile_captures?reply=is.null&order=created_at.asc&limit=10"
    try { return Invoke-RestMethod -Uri $uri -Method Get -Headers $headers }
    catch { Write-Host "[amit-mobile-watcher] Fetch failed: $($_.Exception.Message)"; return @() }
}

# Hub-open heartbeat gate — added 2026-09-05, per AmitMobile\CLAUDE.md's
# "Hub-open heartbeat gate" design. Live replies (the actual claude -p
# call) only run for a user while their Hub (amit-hub.html) is open
# somewhere and signed in — the Hub upserts amit_hub_heartbeat every ~25s
# while open. This does NOT gate the phone-side capture/save at all (that
# already succeeded before this watcher ever sees the row) — it only
# gates whether THIS watcher bothers calling Claude for it. A stale/
# missing heartbeat gets an honest, fast reply instead of silence.
function Test-HubOpen($userId) {
    $uri = "$SUPABASE_URL/rest/v1/amit_hub_heartbeat?user_id=eq.$userId&select=last_beat"
    try {
        $rows = @(Invoke-RestMethod -Uri $uri -Method Get -Headers $headers)
        if ($rows.Count -eq 0) { return $false }
        $lastBeat = [DateTime]::Parse($rows[0].last_beat).ToUniversalTime()
        $ageSeconds = ((Get-Date).ToUniversalTime() - $lastBeat).TotalSeconds
        return ($ageSeconds -le 60)
    } catch {
        Write-Host "[amit-mobile-watcher] Heartbeat check failed for user $userId : $($_.Exception.Message)"
        return $false
    }
}

function Write-Reply($id, $reply) {
    $uri = "$SUPABASE_URL/rest/v1/amit_mobile_captures?id=eq.$id"
    $body = @{ reply = $reply; reply_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") } | ConvertTo-Json
    try { Invoke-RestMethod -Uri $uri -Method Patch -Headers $headers -Body $body | Out-Null }
    catch { Write-Host "[amit-mobile-watcher] Write-back failed for id=$id : $($_.Exception.Message)" }
}

Write-Host "[amit-mobile-watcher] Amit Mobile listener started. Polling every 5 seconds."
Write-Host "[amit-mobile-watcher] Leave the shared Amit Bridge running and this computer awake."

while (-not (Test-Path $StopFlag)) {
    $rows = @(Get-UnansweredCaptures)
    foreach ($row in $rows) {
        if (-not (Test-HubOpen $row.user_id)) {
            Write-Host "[amit-mobile-watcher] Skipping capture id=$($row.id) - Hub not open for user $($row.user_id)"
            Write-Reply $row.id "Amit is caught up but the Hub isn't open right now - open the Hub to let Amit reply."
            continue
        }
        Write-Host "[amit-mobile-watcher] Answering capture id=$($row.id) from user $($row.user_id)"
        $prompt = Build-Prompt $row
        $answer = Invoke-Claude $prompt
        if (-not $answer) { $answer = "Amit had trouble putting a reply together just now - try asking again in a moment." }
        Write-Reply $row.id $answer
    }
    Start-Sleep -Seconds 5
}

Write-Host "[amit-mobile-watcher] Stop flag detected. Shutting down."
Remove-Item $StopFlag -ErrorAction SilentlyContinue
