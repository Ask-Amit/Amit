# Version v1.01 (2026-11-15, Ryan): -AcTask = what the Windows task "Amit crash catcher" runs every 5 minutes (checks once, including the Helper-stopped check). v1.00 - APP CRASH CAPTURE for Computer Health Watch mode. Plain ASCII on purpose (PowerShell 5.1).
# Why: on 2026-11-15 at 6:06 PM the Amit Helper's PowerShell process died with a .NET runtime access violation and nothing kept
# enough to say why. Watch mode only packaged whole-computer crashes. This file adds the missing half: when ANY program crashes or
# hangs, it writes one evidence package to data\appcrash\ so the cause can be worked out afterward.
#
# What a package holds (one JSON file per crash, about 10-40 KB, local only, nothing is sent anywhere):
#   - the Windows crash record: program, version, faulting module and its version, exception code, fault offset, process id and start time
#   - which script that process was running (from a process map this file keeps: data\watch\procs.json, filled every minute in Watch mode)
#   - the .NET runtime's own message for the same crash, and Windows Error Reporting's Report.wer (loaded modules) when it is readable
#   - the Watch trace readings from 5 minutes before to 2 minutes after (memory, CPU, biggest programs, voltages and temperatures)
#   - the Amit Helper logs for the 90 seconds before to 10 seconds after (whisper.log, reload.log, update.log, ask_watcher.log)
#   - Windows System-log errors and warnings (including hardware errors, WHEA) within a minute of the crash
#   - any crash dump file Windows wrote at that time (needs amit_enable_crash_dumps.ps1, run once as administrator)
# It also notices when the Helper stops answering on its port with no crash record (helperstop_*.json).
#
# Used three ways: (1) resource_watcher.ps1 loads it (dot-source) and calls Update-AcProcMap + Invoke-AcCheck about once a minute while
# Watch mode is on; (2) run directly with -AcOnce to check once (for tests and to catch up on crashes from earlier today).
#   (3) the Windows task runs: amit_appcrash.ps1 -AcTask, every 5 minutes, hidden, whether or not Watch mode is on.
#   powershell -File amit_appcrash.ps1 -AcOnce [-AcSince '2026-11-15 18:00'] [-AcOutDir <folder>]
# It never changes, stops or restarts any other program, and every step is wrapped so it cannot break the recorder.
param([switch]$AcOnce, [switch]$AcTask, [string]$AcHome = "$env:LOCALAPPDATA\AmitComputerHealth", [string]$AcOutDir = '', [datetime]$AcSince = [datetime]::MinValue, [int]$AcPort = 8710)

$AcOut = if ($AcOutDir) { $AcOutDir } else { Join-Path $AcHome 'data\appcrash' }
$AcWatch = Join-Path $AcHome 'data\watch'
$AcKeep = 40

function Ac-Log([string]$m) {
    try { New-Item -ItemType Directory -Path $AcOut -Force | Out-Null; Add-Content -Path (Join-Path $AcOut 'appcrash.log') -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $m) } catch {}
}
function Ac-Write([string]$path, [string]$text) {
    $tmp = $path + '.tmp'
    [System.IO.File]::WriteAllText($tmp, $text, (New-Object System.Text.UTF8Encoding($false)))
    if (Test-Path $path) { Remove-Item $path -Force }
    Move-Item $tmp $path -Force
}
function Ac-Short([string]$s, [int]$n) { if ($null -eq $s) { return '' }; if ($s.Length -gt $n) { return $s.Substring(0, $n) }; return $s }

# ---- the process map: pid -> program and the script it runs (a dead process cannot be asked afterward) ----
function Update-AcProcMap {
    try {
        New-Item -ItemType Directory -Path $AcWatch -Force | Out-Null
        $f = Join-Path $AcWatch 'procs.json'
        $map = @{}
        if (Test-Path $f) { try { $o = [System.IO.File]::ReadAllText($f) | ConvertFrom-Json; foreach ($p in $o.PSObject.Properties) { $map[$p.Name] = $p.Value } } catch {} }
        $procs = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe' OR Name='node.exe' OR Name LIKE 'Amit%'" -ErrorAction Stop)
        $added = 0
        foreach ($p in $procs) {
            $ct = $p.CreationDate; if (-not $ct) { continue }
            $key = [string]$p.ProcessId + '|' + $ct.ToString('yyyyMMddHHmmss')
            if (-not $map.ContainsKey($key)) {
                $map[$key] = [ordered]@{ pid = [int]$p.ProcessId; name = [string]$p.Name; start = $ct.ToString('o'); parent = [int]$p.ParentProcessId; cmd = (Ac-Short ([string]$p.CommandLine) 300) }
                $added++
            }
        }
        if ($added -gt 0 -or $map.Count -gt 600) {
            $old = (Get-Date).AddDays(-3)
            foreach ($k in @($map.Keys)) { try { if ([datetime]$map[$k].start -lt $old) { $map.Remove($k) } } catch {} }
            Ac-Write $f ($map | ConvertTo-Json -Depth 4 -Compress)
        }
    } catch {}
}
function Get-AcProc([int]$procId, $startApprox) {
    try {
        $f = Join-Path $AcWatch 'procs.json'
        if (-not (Test-Path $f)) { return $null }
        $o = [System.IO.File]::ReadAllText($f) | ConvertFrom-Json
        $best = $null
        foreach ($p in $o.PSObject.Properties) {
            $v = $p.Value
            if ([int]$v.pid -ne $procId) { continue }
            if ($startApprox) { if ([math]::Abs(([datetime]$v.start - $startApprox).TotalSeconds) -le 5) { return $v } }
            else { if (-not $best -or [datetime]$v.start -gt [datetime]$best.start) { $best = $v } }
        }
        return $best
    } catch { return $null }
}

# ---- evidence pieces ----
function Get-AcLogWindow([string]$name, [datetime]$from, [datetime]$to, [int]$max) {
    $out = @()
    try {
        $p = Join-Path $AcHome $name
        if (-not (Test-Path $p)) { return $out }
        foreach ($line in (Get-Content $p -Tail 4000 -ErrorAction Stop)) {
            if ($line.Length -lt 19) { continue }
            $d = [datetime]::MinValue
            if ([datetime]::TryParseExact($line.Substring(0, 19), 'yyyy-MM-dd HH:mm:ss', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$d)) {
                if ($d -ge $from -and $d -le $to) { $out += (Ac-Short $line 300) }
            }
        }
    } catch {}
    if ($out.Count -gt $max) { $out = $out[($out.Count - $max)..($out.Count - 1)] }
    return $out
}
function Get-AcTrace([datetime]$from, [datetime]$to) {
    $rows = @()
    try {
        foreach ($day in @($from.Date, $to.Date | Select-Object -Unique)) {
            $p = Join-Path $AcWatch ('trace_' + $day.ToString('yyyy-MM-dd') + '.jsonl')
            if (-not (Test-Path $p)) { continue }
            foreach ($line in (Get-Content $p -Tail 4000 -ErrorAction Stop)) {
                if ($line.IndexOf('"t":') -lt 0) { continue }
                try { $o = $line | ConvertFrom-Json } catch { continue }
                if (-not $o.t) { continue }
                $t = [datetime]$o.t
                if ($t -lt $from -or $t -gt $to) { continue }
                $vt = [ordered]@{}
                if ($o.s) { foreach ($sp in $o.s.PSObject.Properties) { if ($sp.Name -match '^(Voltages|Temperatures)\|') { $seg = $sp.Name -split '\|'; $vt[$seg[0].Substring(0, 1) + ':' + $seg[-1]] = $sp.Value } } }
                $rows += [ordered]@{ t = $t.ToString('HH:mm:ss'); ram = $o.ram; cpu = $o.cpu; top = $o.top; vt = $vt }
            }
        }
    } catch {}
    return $rows
}
function Get-AcSystemEvents([datetime]$when) {
    $out = @()
    try {
        $evs = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; Level = 1, 2, 3; StartTime = $when.AddSeconds(-60); EndTime = $when.AddSeconds(60) } -MaxEvents 15 -ErrorAction SilentlyContinue)
        foreach ($e in $evs) { $out += [ordered]@{ t = $e.TimeCreated.ToString('HH:mm:ss'); provider = $e.ProviderName; id = $e.Id; msg = (Ac-Short (($e.Message -replace '\s+', ' ')) 220) } }
    } catch {}
    return $out
}
function Get-AcWer([string]$reportId) {
    if (-not $reportId) { return $null }
    try {
        foreach ($root in @('C:\ProgramData\Microsoft\Windows\WER\ReportArchive', 'C:\ProgramData\Microsoft\Windows\WER\ReportQueue')) {
            if (-not (Test-Path $root)) { continue }
            $hit = Get-ChildItem $root -Recurse -Filter 'Report.wer' -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-2) } | Select-String -Pattern $reportId -List -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($hit) { return (Ac-Short ([System.IO.File]::ReadAllText($hit.Path)) 14000) }
        }
    } catch {}
    return $null
}
function Get-AcDumps([datetime]$when) {
    $out = @()
    try {
        foreach ($d in @("$env:LOCALAPPDATA\CrashDumps", (Join-Path $AcOut 'dumps'))) {
            if (-not (Test-Path $d)) { continue }
            Get-ChildItem $d -Filter '*.dmp' -ErrorAction SilentlyContinue | Where-Object { [math]::Abs(($_.LastWriteTime - $when).TotalSeconds) -le 90 } | ForEach-Object { $out += [ordered]@{ file = $_.FullName; mb = [math]::Round($_.Length / 1MB, 1); at = $_.LastWriteTime.ToString('HH:mm:ss') } }
        }
    } catch {}
    return $out
}
function Test-AcPort {
    $ok = $false; $c = $null
    try { $c = New-Object System.Net.Sockets.TcpClient; $iar = $c.BeginConnect('127.0.0.1', $AcPort, $null, $null); if ($iar.AsyncWaitHandle.WaitOne(600)) { try { $c.EndConnect($iar); $ok = $true } catch { $ok = $false } } } catch {} finally { if ($c) { try { $c.Close() } catch {} } }
    return $ok
}

# ---- the check ----
function Invoke-AcCheck {
    try {
        New-Item -ItemType Directory -Path $AcOut -Force | Out-Null
        $checkStart = Get-Date
        $stateF = Join-Path $AcOut 'state.json'
        $state = [ordered]@{ last = ''; done = @(); helper = 'unknown'; downCount = 0 }
        if (Test-Path $stateF) { try { $s = [System.IO.File]::ReadAllText($stateF) | ConvertFrom-Json; if ($s.last) { $state.last = [string]$s.last }; if ($s.done) { $state.done = @($s.done) }; if ($s.helper) { $state.helper = [string]$s.helper }; if ($s.downCount) { $state.downCount = [int]$s.downCount } } catch {} }
        $since = if ($AcSince -gt [datetime]::MinValue) { $AcSince } elseif ($state.last) { [datetime]$state.last } else { $checkStart.AddHours(-24) }

        $evs = @(Get-WinEvent -FilterHashtable @{ LogName = 'Application'; ProviderName = 'Application Error', 'Application Hang', '.NET Runtime', 'Windows Error Reporting'; StartTime = $since } -ErrorAction SilentlyContinue)
        $made = 0
        foreach ($e in ($evs | Where-Object { $_.ProviderName -in 'Application Error', 'Application Hang' } | Sort-Object TimeCreated)) {
            $msg = [string]$e.Message
            $kind = if ($e.ProviderName -eq 'Application Hang') { 'hang' } else { 'crash' }
            $exe = ''; $ver = ''; $mod = ''; $modVer = ''; $code = ''; $off = ''; $procId = 0; $startFt = ''; $path = ''; $rep = ''
            if ($kind -eq 'crash') {
                $exe = [regex]::Match($msg, 'Faulting application name:\s*([^,\r\n]+)').Groups[1].Value
                $ver = [regex]::Match($msg, 'Faulting application name:[^\r\n]*?version:\s*([^,\r\n]+)').Groups[1].Value
                $mod = [regex]::Match($msg, 'Faulting module name:\s*([^,\r\n]+)').Groups[1].Value
                $modVer = [regex]::Match($msg, 'Faulting module name:[^\r\n]*?version:\s*([^,\r\n]+)').Groups[1].Value
                $code = [regex]::Match($msg, 'Exception code:\s*(\S+)').Groups[1].Value
                $off = [regex]::Match($msg, 'Fault offset:\s*(\S+)').Groups[1].Value
                $pidHex = [regex]::Match($msg, 'Faulting process id:\s*(0x[0-9A-Fa-f]+)').Groups[1].Value
                if ($pidHex) { $procId = [Convert]::ToInt32($pidHex.Substring(2), 16) }
                $startFt = [regex]::Match($msg, 'Faulting application start time:\s*(0x[0-9A-Fa-f]+)').Groups[1].Value
                $path = [regex]::Match($msg, 'Faulting application path:\s*([^\r\n]+)').Groups[1].Value.Trim()
                $rep = [regex]::Match($msg, 'Report Id:\s*([0-9a-fA-F-]+)').Groups[1].Value
            } else {
                $exe = [regex]::Match($msg, 'The program (\S+) version').Groups[1].Value
                $ver = [regex]::Match($msg, 'version (\S+) stopped').Groups[1].Value
                $procId = 0; $pm = [regex]::Match($msg, 'Process ID:\s*([0-9A-Fa-f]+)'); if ($pm.Success) { try { $procId = [Convert]::ToInt32($pm.Groups[1].Value, 16) } catch {} }
            }
            $when = $e.TimeCreated
            $dedupe = "$kind|$procId|$exe|" + $when.ToString('yyyyMMddHHmmss')
            if ($state.done -contains $dedupe) { continue }

            $startAt = $null
            if ($startFt) { try { $startAt = [datetime]::FromFileTime([Convert]::ToInt64($startFt.Substring(2), 16)) } catch {} }
            $pi = if ($procId -gt 0) { Get-AcProc $procId $startAt } else { $null }
            $runtime = @($evs | Where-Object { $_.ProviderName -eq '.NET Runtime' -and [math]::Abs(($_.TimeCreated - $when).TotalSeconds) -le 15 -and $_.Message -match [regex]::Escape($exe) } | ForEach-Object { Ac-Short $_.Message 3000 })
            $others = @($evs | Where-Object { $_.ProviderName -eq 'Application Error' -and $_.RecordId -ne $e.RecordId -and [math]::Abs(($_.TimeCreated - $when).TotalSeconds) -le 30 } | ForEach-Object { [ordered]@{ t = $_.TimeCreated.ToString('HH:mm:ss'); what = (Ac-Short (($_.Message -replace '\s+', ' ')) 160) } })
            $pkg = [ordered]@{
                kind = $kind; id = $dedupe; crashTime = $when.ToString('o'); machine = $env:COMPUTERNAME
                program = $exe; programVersion = $ver; programPath = $path; faultingModule = $mod; faultingModuleVersion = $modVer
                exceptionCode = $code; faultOffset = $off; processId = $procId
                processStart = $(if ($startAt) { $startAt.ToString('o') } else { $null })
                ranForMinutes = $(if ($startAt) { [math]::Round(($when - $startAt).TotalMinutes, 1) } else { $null })
                processWas = $(if ($pi) { [ordered]@{ name = $pi.name; commandLine = $pi.cmd; parentPid = $pi.parent } } else { 'not in the process map (recorded only from the time this capture was installed)' })
                windowsRecord = (Ac-Short $msg 2500)
                runtimeMessage = $runtime
                otherCrashesWithin30s = $others
                werReport = (Get-AcWer $rep)
                dumpFiles = @(Get-AcDumps $when)
                traceReadings = @(Get-AcTrace $when.AddMinutes(-5) $when.AddMinutes(2))
                helperLogs = [ordered]@{
                    whisper = @(Get-AcLogWindow 'whisper.log' $when.AddSeconds(-90) $when.AddSeconds(10) 40)
                    reload = @(Get-AcLogWindow 'reload.log' $when.AddMinutes(-10) $when.AddSeconds(30) 15)
                    update = @(Get-AcLogWindow 'update.log' $when.AddMinutes(-10) $when.AddSeconds(30) 10)
                    ask = @(Get-AcLogWindow 'ask_watcher.log' $when.AddSeconds(-90) $when.AddSeconds(10) 10)
                }
                systemEventsWithin60s = @(Get-AcSystemEvents $when)
                capturedAt = (Get-Date).ToString('o')
            }
            $safe = ($exe -replace '[^A-Za-z0-9_.-]', '_'); if (-not $safe) { $safe = 'unknown' }
            $file = Join-Path $AcOut ('appcrash_' + $when.ToString('yyyyMMdd_HHmmss') + '_' + $safe + '_' + $procId + '.json')
            Ac-Write $file ($pkg | ConvertTo-Json -Depth 6)
            $state.done = @($state.done) + $dedupe
            $made++
            Ac-Log ("captured " + $kind + ": " + $exe + " pid " + $procId + " at " + $when.ToString('HH:mm:ss') + " (" + $code + " in " + $mod + " +" + $off + ") -> " + (Split-Path $file -Leaf))
        }

        # The Helper stopped answering with no Windows crash record (a silent stop). Two checks in a row, once per stop.
        if (-not $AcOnce) {
            $up = Test-AcPort
            if ($up) { $state.helper = 'up'; $state.downCount = 0 }
            elseif ($state.helper -eq 'up') {
                $state.downCount = [int]$state.downCount + 1
                if ($state.downCount -ge 2) {
                    $state.helper = 'down'
                    $now = Get-Date
                    $bridge = $null; try { $bridge = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction Stop | Where-Object { $_.CommandLine -match 'amit_bridge_server' } | Select-Object -First 1 } catch {}
                    $reloadNear = @(Get-AcLogWindow 'reload.log' $now.AddMinutes(-4) $now 15)
                    $pkg = [ordered]@{
                        kind = 'helper-stopped'; noticedAt = $now.ToString('o'); machine = $env:COMPUTERNAME
                        expected = [bool]($reloadNear -match 'stopping helper')
                        bridgeProcessStillRunning = [bool]$bridge
                        crashRecordInLastTwoMinutes = [bool](@($evs | Where-Object { $_.ProviderName -eq 'Application Error' -and $_.TimeCreated -gt $now.AddMinutes(-2) }).Count)
                        helperLogs = [ordered]@{ whisper = @(Get-AcLogWindow 'whisper.log' $now.AddMinutes(-3) $now 40); reload = $reloadNear }
                        traceReadings = @(Get-AcTrace $now.AddMinutes(-5) $now)
                        systemEventsWithin60s = @(Get-AcSystemEvents $now)
                    }
                    Ac-Write (Join-Path $AcOut ('helperstop_' + $now.ToString('yyyyMMdd_HHmmss') + '.json')) ($pkg | ConvertTo-Json -Depth 6)
                    Ac-Log ("the Helper stopped answering on port " + $AcPort + " (expected by a reload: " + $pkg.expected + ", bridge process still running: " + $pkg.bridgeProcessStillRunning + ")")
                    $made++
                }
            }
        }

        $state.last = $checkStart.AddSeconds(-30).ToString('o')
        if (@($state.done).Count -gt 200) { $state.done = @($state.done)[-200..-1] }
        Ac-Write $stateF ($state | ConvertTo-Json -Depth 3)
        $old = @(Get-ChildItem $AcOut -Filter '*.json' -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'state.json' } | Sort-Object LastWriteTime -Descending)
        if ($old.Count -gt $AcKeep) { $old | Select-Object -Skip $AcKeep | Remove-Item -Force -ErrorAction SilentlyContinue }
        return $made
    } catch { Ac-Log ("check failed: " + $_.Exception.Message); return 0 }
}

if ($AcOnce -or $AcTask) { Update-AcProcMap; $n = Invoke-AcCheck; "appcrash check done: $n package(s) written to $AcOut" }
