# AmitToolkit.psm1 v0.1 (2026-11-24). The safe toolkit a custom script button must use for anything risky.
# Button_Creator_SPEC.md section 11.5 item 1. Plain ASCII on purpose (Windows PowerShell 5.1).
#
# WHAT IT DOES: every risky action (change a file, prepare a message, send, clipboard) goes through here, so the HELPER enforces the limits:
#   - practice mode: nothing is changed or sent; what WOULD happen is recorded (this feeds the check screen and the practice result)
#   - a file change is written to a temporary file, verified, the old file is copied to a dated backup, then renamed into place
#   - only folders the person approved (permissions.folders) and the button's own work folder may be touched; Windows, Program Files and Amit's own folders never
#   - a limit of actions per press (permissions.maxActions); reads are not counted
#   - recipients are checked against the blocked list and the declared allowed list; sending needs the person's unlock and respects no-send hours
#   - progress is saved after every action, so a stopped or crashed run still reports what finished
# HONEST LIMIT: this is not a sandbox. A script that skips the toolkit is not stopped here; the static scan (amit_script_check.ps1), the approval box and the
# person's practice run are the other layers.
# The host (amit_script_host.ps1) imports this module, calls Initialize-AmitJob, runs the script, then Complete-AmitJob.

$script:Job = $null
$script:R = $null
$script:Done = @{}
$script:Draft = 0
$script:Said = (New-Object System.Collections.ArrayList)
$script:Opened = 0

function New-AmitError {
    param([string]$Kind, [string]$Plain)
    $e = New-Object System.Exception($Plain)
    $e.Data['AmitKind'] = $Kind
    return $e
}

function Get-AmitProp {
    param($Obj, [string]$Name, $Default = $null)
    if ($null -ne $Obj -and $Obj.PSObject.Properties[$Name]) { return $Obj.$Name }
    return $Default
}

function Write-AmitLog {
    param([string]$Text)
    try {
        $d = $script:Job.dirs.logs
        if ($d) { [System.IO.File]::AppendAllText((Join-Path $d 'run.log'), ((Get-Date).ToString('s') + ' ' + $Text + "`r`n"), (New-Object System.Text.UTF8Encoding($false))) }
    } catch { }
}

function Save-AmitProgress {
    try {
        $p = $script:Job.dirs.state
        if ($p) { [System.IO.File]::WriteAllText((Join-Path $p 'progress.json'), ($script:R | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding($false))) }
    } catch { }
}

function Initialize-AmitJob {
    param([Parameter(Mandatory = $true)][string]$JobPath)
    $raw = [System.IO.File]::ReadAllText($JobPath, [System.Text.Encoding]::UTF8)
    $script:Job = $raw | ConvertFrom-Json
    foreach ($d in @($script:Job.dirs.work, $script:Job.dirs.backups, $script:Job.dirs.outbox, $script:Job.dirs.logs, $script:Job.dirs.state)) {
        if ($d -and -not (Test-Path -LiteralPath $d)) { [void](New-Item -ItemType Directory -Force -Path $d) }
    }
    $script:Done = @{}
    $script:Draft = 0
    $script:Said = (New-Object System.Collections.ArrayList)
    $script:Opened = 0
    $doneFile = Join-Path $script:Job.dirs.state 'done.json'
    if (Test-Path -LiteralPath $doneFile) {
        try {
            $parsed = ConvertFrom-Json -InputObject ([System.IO.File]::ReadAllText($doneFile, [System.Text.Encoding]::UTF8))
            foreach ($k in $parsed) { if ($null -ne $k) { $script:Done[[string]$k] = $true } }
        } catch { }
    }
    $script:R = [ordered]@{
        ok         = $true
        outcome    = 'done'
        mode       = [string]$script:Job.mode
        startedAt  = (Get-Date).ToString('o')
        finishedAt = $null
        counts     = [ordered]@{ read = 0; drafted = 0; sent = 0; changed = 0; actions = 0; opened = 0 }
        finished   = (New-Object System.Collections.ArrayList)
        notDone    = (New-Object System.Collections.ArrayList)
        wouldHave  = (New-Object System.Collections.ArrayList)
        notices    = (New-Object System.Collections.ArrayList)
        backups    = (New-Object System.Collections.ArrayList)
        error      = $null
        summary    = ''
    }
    Write-AmitLog ('start ' + $script:Job.buttonName + ' mode=' + $script:Job.mode)
    Save-AmitProgress
}

function Test-AmitPractice { return ([string]$script:Job.mode -eq 'practice') }

function Get-AmitAnswer {
    param([Parameter(Mandatory = $true)][string]$Name, $Default = $null)
    $a = $script:Job.answers
    if ($null -ne $a -and $a.PSObject.Properties[$Name]) {
        $v = $a.$Name
        if ($null -ne $v -and "$v" -ne '') { return $v }
    }
    return $Default
}

function Test-AmitUnder {
    param([string]$Full, [string]$Root)
    $r = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    return (($Full.TrimEnd('\') + '\').StartsWith($r, [System.StringComparison]::OrdinalIgnoreCase))
}

function Test-AmitPathAllowed {
    param([string]$Path)
    $full = [System.IO.Path]::GetFullPath($Path)
    $deny = @($env:windir, $env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'AmitComputerHealth'), [string](Get-AmitProp $script:Job.dirs 'scripts' ''))
    foreach ($d in $deny) { if ($d -and (Test-AmitUnder $full $d)) { return $false } }
    $allowed = New-Object System.Collections.ArrayList
    foreach ($f in @(Get-AmitProp $script:Job.permissions 'folders' @())) { if ($f) { [void]$allowed.Add([string]$f) } }
    if ($script:Job.dirs.work) { [void]$allowed.Add([string]$script:Job.dirs.work) }
    foreach ($a in $allowed) { if (Test-AmitUnder $full $a) { return $true } }
    return $false
}

function Test-AmitLimit {
    $max = [int](Get-AmitProp $script:Job.permissions 'maxActions' 20)
    if ($script:R.counts.actions -ge $max) {
        throw (New-AmitError 'limit_reached' ('It reached its limit of ' + $max + ' actions for one press, so it stopped. Nothing more was done.'))
    }
}

function Register-AmitAction {
    param([string]$Kind, [string]$Line)
    $script:R.counts.actions = $script:R.counts.actions + 1
    $script:R.counts[$Kind] = $script:R.counts[$Kind] + 1
    [void]$script:R.finished.Add($Line)
    Write-AmitLog ($Kind + ': ' + $Line)
    Save-AmitProgress
}

function Add-AmitWouldHave {
    param([string]$Kind, [string]$Detail)
    $item = [ordered]@{ kind = $Kind; detail = $Detail }
    [void]$script:R.wouldHave.Add($item)
    $script:R.counts.actions = $script:R.counts.actions + 1
    if ($Kind -eq 'open') { $script:R.counts.opened = $script:R.counts.opened + 1 } elseif ($Kind -eq 'send') { $script:R.counts.sent = $script:R.counts.sent + 1 } elseif ($Kind -eq 'draft') { $script:R.counts.drafted = $script:R.counts.drafted + 1 } else { $script:R.counts.changed = $script:R.counts.changed + 1 }
    Save-AmitProgress
}

function Read-AmitFile {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not [bool](Get-AmitProp $script:Job.permissions 'reads' $true)) { throw (New-AmitError 'not_permitted' 'This button was not given permission to read files.') }
    $full = [System.IO.Path]::GetFullPath($Path)
    if (-not (Test-AmitPathAllowed $full)) { throw (New-AmitError 'path_not_allowed' ('This button is not allowed to open ' + $full + '. It may only use the folders you approved.')) }
    if (-not (Test-Path -LiteralPath $full)) { throw (New-AmitError 'file_missing' ('The file ' + $full + ' could not be found.')) }
    try { $text = [System.IO.File]::ReadAllText($full) } catch { throw (New-AmitError 'file_busy' ('The file ' + $full + ' could not be opened. It may be open in another program. Close it and press the button again.')) }
    $script:R.counts.read = $script:R.counts.read + 1
    Write-AmitLog ('read: ' + $full)
    return $text
}

function Write-AmitFile {
    param([Parameter(Mandatory = $true)][string]$Path, [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content, [switch]$Append)
    if (-not [bool](Get-AmitProp $script:Job.permissions 'writes' $false)) { throw (New-AmitError 'not_permitted' 'This button was not given permission to change files.') }
    $full = [System.IO.Path]::GetFullPath($Path)
    if (-not (Test-AmitPathAllowed $full)) { throw (New-AmitError 'path_not_allowed' ('This button is not allowed to change ' + $full + '. It may only use the folders you approved.')) }
    Test-AmitLimit
    $verb = 'Changed'
    if (-not (Test-Path -LiteralPath $full)) { $verb = 'Created' }
    $bytes = [System.Text.Encoding]::UTF8.GetByteCount($Content)
    if (Test-AmitPractice) { Add-AmitWouldHave 'change' ($verb + ' ' + $full + ' (' + $bytes + ' bytes)'); return }
    $newText = $Content
    if ($Append -and (Test-Path -LiteralPath $full)) { try { $newText = [System.IO.File]::ReadAllText($full) + $Content } catch { throw (New-AmitError 'file_busy' ('The file ' + $full + ' could not be opened. It may be open in another program. Close it and press the button again.')) } }
    $dir = [System.IO.Path]::GetDirectoryName($full)
    if (-not (Test-Path -LiteralPath $dir)) { [void](New-Item -ItemType Directory -Force -Path $dir) }
    if (Test-Path -LiteralPath $full) {
        $stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
        $bdir = Join-Path (Join-Path $script:Job.dirs.backups $stamp) ''
        [void](New-Item -ItemType Directory -Force -Path $bdir)
        $bname = ($full -replace '[:\\/]+', '_')
        $bpath = Join-Path $bdir $bname
        try { [System.IO.File]::Copy($full, $bpath, $true) } catch { throw (New-AmitError 'file_busy' ('The file ' + $full + ' could not be backed up, so it was not changed. It may be open in another program. Close it and press the button again.')) }
        [void]$script:R.backups.Add($bpath)
    }
    $tmp = $full + '.amit-tmp'
    [System.IO.File]::WriteAllText($tmp, $newText, (New-Object System.Text.UTF8Encoding($false)))
    if ((New-Object System.IO.FileInfo($tmp)).Length -ne [System.Text.Encoding]::UTF8.GetByteCount($newText)) {
        [System.IO.File]::Delete($tmp)
        throw (New-AmitError 'write_failed' ('The new copy of ' + $full + ' did not save completely, so the original was left as it was.'))
    }
    try { [System.IO.File]::Copy($tmp, $full, $true); [System.IO.File]::Delete($tmp) } catch { throw (New-AmitError 'file_busy' ('The file ' + $full + ' could not be replaced. It may be open in another program. Close it and press the button again. The original was left as it was.')) }
    Register-AmitAction 'changed' ($verb + ' ' + $full)
}

function Test-AmitRecipient {
    param([string]$To)
    if ($To -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { throw (New-AmitError 'bad_recipient' ('"' + $To + '" is not an email address, so nothing was prepared for it.')) }
    $low = $To.ToLower()
    foreach ($b in @(Get-AmitProp $script:Job.settings 'blockedRecipients' @())) {
        if ($b -and ($low -eq ([string]$b).ToLower() -or $low.EndsWith('@' + ([string]$b).ToLower().TrimStart('@')))) { throw (New-AmitError 'recipient_blocked' ($To + ' is on your do-not-contact list, so nothing was prepared for them.')) }
    }
    $allowed = @(Get-AmitProp $script:Job.permissions 'allowedRecipients' @())
    if ($allowed.Count -gt 0) {
        $ok = $false
        foreach ($a in $allowed) { if ($a -and ($low -eq ([string]$a).ToLower() -or $low.EndsWith('@' + ([string]$a).ToLower().TrimStart('@')))) { $ok = $true } }
        if (-not $ok) { throw (New-AmitError 'recipient_not_allowed' ($To + ' is not someone this button may contact.')) }
    }
}

function New-AmitDraft {
    param([Parameter(Mandatory = $true)][string]$To, [string]$Subject = '', [Parameter(Mandatory = $true)][string]$Body)
    Test-AmitRecipient $To
    Test-AmitLimit
    if (Test-AmitPractice) { Add-AmitWouldHave 'draft' ('Prepare a message to ' + $To + ': ' + $Subject); return }
    $script:Draft = $script:Draft + 1
    $name = (Get-Date).ToString('yyyyMMdd-HHmmss') + '-' + $script:Draft + '.txt'
    $text = 'To: ' + $To + "`r`n" + 'Subject: ' + $Subject + "`r`n`r`n" + $Body + "`r`n"
    [System.IO.File]::WriteAllText((Join-Path $script:Job.dirs.outbox $name), $text, (New-Object System.Text.UTF8Encoding($false)))
    Register-AmitAction 'drafted' ('Prepared a message to ' + $To + ' (waiting for you in the outbox)')
}

function Send-AmitMessage {
    param([Parameter(Mandatory = $true)][string]$To, [string]$Subject = '', [Parameter(Mandatory = $true)][string]$Body)
    if (-not [bool](Get-AmitProp $script:Job.permissions 'sends' $false)) { throw (New-AmitError 'not_permitted' 'This button was not given permission to send messages.') }
    Test-AmitRecipient $To
    Test-AmitLimit
    if (Test-AmitPractice) { Add-AmitWouldHave 'send' ('Send to ' + $To + ': ' + $Subject); return }
    if (-not [bool](Get-AmitProp $script:Job.settings 'sendingUnlocked' $false)) { throw (New-AmitError 'sending_locked' 'Sending is switched off for this button until you practice it and allow it.') }
    $from = Get-AmitProp $script:Job.settings 'noSendFrom' $null
    $to2 = Get-AmitProp $script:Job.settings 'noSendTo' $null
    if ($from -and $to2) {
        $now = (Get-Date).TimeOfDay
        $f = [TimeSpan]::Parse([string]$from); $t = [TimeSpan]::Parse([string]$to2)
        $inside = $false
        if ($f -le $t) { $inside = ($now -ge $f -and $now -lt $t) } else { $inside = ($now -ge $f -or $now -lt $t) }
        if ($inside) { throw (New-AmitError 'quiet_hours' ('You asked for no sending between ' + $from + ' and ' + $to2 + ', so nothing was sent.')) }
    }
    throw (New-AmitError 'no_transport' 'This computer has no connected mail account yet, so nothing was sent. The button can prepare messages for you instead.')
}

# true when the person typed this site themselves, in an answer to the button at this press
function Test-AmitSaid {
    param([string]$HostName)
    $h = $HostName.ToLower() -replace '^www\.', ''
    $rx = '(^|[\s/@,;(])(www\.)?' + [regex]::Escape($h) + '($|[\s/:?#,;)])'
    $all = New-Object System.Collections.ArrayList
    if ($null -ne $script:Job.answers) { foreach ($p in $script:Job.answers.PSObject.Properties) { [void]$all.Add(([string]$p.Value).ToLower()) } }
    foreach ($s in $script:Said) { [void]$all.Add(([string]$s).ToLower()) }
    foreach ($a in $all) { if ([regex]::IsMatch($a, $rx)) { return $true } }
    return $false
}

# Opens ONE secure web page in the person's browser. Only https; only a site the person approved on the button's card, or a site they typed themselves at this press.
function Open-AmitWebsite {
    param([Parameter(Mandatory = $true)][string]$Url)
    if (-not [bool](Get-AmitProp $script:Job 'websiteMode' $false)) { throw (New-AmitError 'not_permitted' 'This button was not cleared to open websites.') }
    if (-not [bool](Get-AmitProp $script:Job.permissions 'opensWebsites' $false)) { throw (New-AmitError 'not_permitted' 'This button was not given permission to open websites.') }
    $u = ([string]$Url).Trim()
    if ($u -and $u -notmatch '^[a-zA-Z][a-zA-Z0-9+.\-]*:') { $u = 'https://' + $u }
    $uri = $null
    if ($u.Length -gt 2000 -or $u -match '[\s"<>\\^\x60{|}]' -or -not [System.Uri]::TryCreate($u, [System.UriKind]::Absolute, [ref]$uri)) { throw (New-AmitError 'bad_website' ('"' + $Url + '" is not a web address, so it was not opened.')) }
    $hn = $uri.DnsSafeHost.ToLower()
    if ($uri.Scheme -ne 'https' -or $uri.UserInfo -or [string]$uri.HostNameType -ne 'Dns' -or $hn -notmatch '\.[a-z]{2,}$' -or $hn -match '\.(local|internal|lan|home)$') { throw (New-AmitError 'bad_website' ('Only ordinary secure websites (https) are opened. "' + $Url + '" was not.')) }
    $ok = $false
    foreach ($s in @(Get-AmitProp $script:Job.permissions 'websites' @())) {
        $a = (([string]$s).ToLower() -replace '^https://', '' -replace '/.*$', '') -replace '^www\.', ''
        if ($a -match '\.' -and ($hn -eq $a -or $hn.EndsWith('.' + $a))) { $ok = $true }
    }
    if (-not $ok -and (Test-AmitSaid $hn)) { $ok = $true }
    if (-not $ok) { throw (New-AmitError 'website_not_approved' ('This button may not open ' + $hn + '. It opens only the sites you approved, or one you type yourself.')) }
    Test-AmitLimit
    if ($script:Opened -ge 10) { throw (New-AmitError 'limit_reached' 'It reached its limit of 10 websites for one press, so it stopped.') }
    $script:Opened = $script:Opened + 1
    if (Test-AmitPractice) { Add-AmitWouldHave 'open' ('Open ' + $uri.AbsoluteUri); return }
    if (-not $env:AMIT_TEST_NO_BROWSER) { Start-Process $uri.AbsoluteUri }
    Register-AmitAction 'opened' ('Opened ' + $uri.AbsoluteUri)
}

function Show-AmitNotice {
    param([Parameter(Mandatory = $true)][string]$Text)
    [void]$script:R.notices.Add($Text)
    Write-AmitLog ('notice: ' + $Text)
    Save-AmitProgress
}

function Get-AmitClipboardText {
    if (-not [bool](Get-AmitProp $script:Job.permissions 'clipboard' $false)) { throw (New-AmitError 'not_permitted' 'This button was not given permission to use the clipboard.') }
    $t = Get-Clipboard -Raw
    if ($null -eq $t) { return '' }
    return [string]$t
}

function Set-AmitClipboardText {
    param([Parameter(Mandatory = $true)][string]$Text)
    if (-not [bool](Get-AmitProp $script:Job.permissions 'clipboard' $false)) { throw (New-AmitError 'not_permitted' 'This button was not given permission to use the clipboard.') }
    Test-AmitLimit
    if (Test-AmitPractice) { Add-AmitWouldHave 'change' 'Put text on the clipboard'; return }
    Set-Clipboard -Value $Text
    Register-AmitAction 'changed' 'Put text on the clipboard'
}

function Test-AmitDone {
    param([Parameter(Mandatory = $true)][string]$Key)
    return $script:Done.ContainsKey($Key)
}

function Add-AmitDone {
    param([Parameter(Mandatory = $true)][string]$Key)
    $script:Done[$Key] = $true
    if (Test-AmitPractice) { return }
    try {
        $keys = @($script:Done.Keys)
        [System.IO.File]::WriteAllText((Join-Path $script:Job.dirs.state 'done.json'), (ConvertTo-Json -InputObject $keys), (New-Object System.Text.UTF8Encoding($false)))
    } catch { }
}

function Request-AmitAnswer {
    param([Parameter(Mandatory = $true)][string]$Question, [string[]]$Choices = @(), [int]$TimeoutSeconds = 120)
    $ask = Join-Path $script:Job.dirs.state 'ask.json'
    $ans = Join-Path $script:Job.dirs.state 'answer.json'
    if (Test-Path -LiteralPath $ans) { [System.IO.File]::Delete($ans) }
    $obj = [ordered]@{ question = $Question; choices = @($Choices); askedAt = (Get-Date).ToString('o') }
    [System.IO.File]::WriteAllText($ask, ($obj | ConvertTo-Json -Depth 4), (New-Object System.Text.UTF8Encoding($false)))
    $until = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $until) {
        if (Test-Path -LiteralPath $ans) {
            Start-Sleep -Milliseconds 100
            $a = [System.IO.File]::ReadAllText($ans, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
            [System.IO.File]::Delete($ans); [System.IO.File]::Delete($ask)
            [void]$script:Said.Add([string]$a.answer)
            return [string]$a.answer
        }
        Start-Sleep -Milliseconds 200
    }
    throw (New-AmitError 'no_answer' 'It needed an answer from you and did not get one, so it stopped. Nothing more was done.')
}

function Get-AmitSummary {
    $c = $script:R.counts
    switch ($script:R.outcome) {
        'done' {
            if ($script:R.mode -eq 'practice') { return 'Practice finished. Nothing was changed or sent. ' + $script:R.wouldHave.Count + ' thing(s) are ready.' }
            if ($c.opened -gt 0) { return 'Done. Opened ' + $c.opened + ' website(s).' }
            return 'Done. Read ' + $c.read + ', changed ' + $c.changed + ', prepared ' + $c.drafted + ', sent ' + $c.sent + '.'
        }
        'limit_reached' { return 'It stopped at its limit. ' + $c.actions + ' thing(s) were done; nothing more.' }
        'stopped' { return 'It was stopped. ' + $c.actions + ' thing(s) were done before it stopped.' }
        default { return 'The button stopped. ' + $c.actions + ' thing(s) were done before it stopped.' }
    }
}

function Complete-AmitJob {
    param([string]$Outcome = 'done', [string]$ErrorKind = '', [string]$ErrorPlain = '')
    $script:R.outcome = $Outcome
    $script:R.finishedAt = (Get-Date).ToString('o')
    if ($ErrorKind) { $script:R.ok = $false; $script:R.error = [ordered]@{ kind = $ErrorKind; plain = $ErrorPlain } }
    elseif ($Outcome -ne 'done') { $script:R.ok = $false }
    $script:R.summary = Get-AmitSummary
    $json = $script:R | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText([string]$script:Job.resultPath, $json, (New-Object System.Text.UTF8Encoding($false)))
    Write-AmitLog ('end ' + $Outcome)
}

Export-ModuleMember -Function Initialize-AmitJob, Complete-AmitJob, Test-AmitPractice, Get-AmitAnswer, Read-AmitFile, Write-AmitFile, New-AmitDraft, Send-AmitMessage, Show-AmitNotice, Get-AmitClipboardText, Set-AmitClipboardText, Test-AmitDone, Add-AmitDone, Request-AmitAnswer, Open-AmitWebsite
