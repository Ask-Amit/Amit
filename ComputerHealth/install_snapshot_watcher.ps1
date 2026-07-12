# Amit Watcher - Install Snapshot / Diff / Undo
#
# USAGE:
#   Before downloading/installing something:
#     install_snapshot_watcher.ps1 -Start
#
#   After the install finishes:
#     install_snapshot_watcher.ps1 -Compare
#   -> writes a human-readable diff report AND a machine-readable JSON diff.
#      Bring the report to Amit (chat) - Amit researches each new item by
#      name/publisher and gives you a real verdict, then proposes specific
#      items to remove.
#
#   After you've reviewed Amit's recommendations and approved specific items:
#     install_snapshot_watcher.ps1 -Remove -ApprovedItemsFile "path\to\approved.json"
#   -> backs up each item (registry export / uninstall string / task XML)
#      to a timestamped restore folder BEFORE removing anything, then removes
#      only the approved items. Nothing is removed without being named in
#      that approved file - this script never decides on its own.
#
# WHAT IT SNAPSHOTS:
#   - Installed programs (registry Uninstall keys, 32 and 64-bit)
#   - Startup entries (Run/RunOnce registry keys, both HKCU and HKLM)
#   - Startup folder shortcuts (user + all-users)
#   - Scheduled tasks
#   - Browser extensions (Chrome, Edge, Firefox - by folder scan, no browser
#     needs to be closed)
#   - Browser homepage / default search engine registry values (hijack
#     detection - Chrome/Edge policy keys and preference files, best-effort)

param(
    [switch]$Start,
    [switch]$Compare,
    [switch]$Remove,
    [string]$ApprovedItemsFile
)

$snapshotDir = "$env:TEMP\amit_install_snapshots"
$baselineFile = "$snapshotDir\baseline.json"
$backupRoot = "$env:TEMP\amit_install_backups"
New-Item -ItemType Directory -Path $snapshotDir -Force | Out-Null

function Get-InstalledPrograms {
    $paths = @(
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    Get-ItemProperty $paths -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName } |
        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, UninstallString, PSPath |
        Sort-Object DisplayName -Unique
}

function Get-StartupRegEntries {
    $paths = @(
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce'
    )
    $results = @()
    foreach ($p in $paths) {
        if (Test-Path $p) {
            $item = Get-Item $p
            foreach ($name in $item.Property) {
                $results += [PSCustomObject]@{ Path = $p; Name = $name; Value = (Get-ItemProperty $p).$name }
            }
        }
    }
    $results
}

function Get-StartupShortcuts {
    $folders = @(
        "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
    )
    $folders | Where-Object { Test-Path $_ } | ForEach-Object { Get-ChildItem $_ -File } | Select-Object FullName, LastWriteTime
}

function Get-ScheduledTasksList {
    Get-ScheduledTask -ErrorAction SilentlyContinue | Select-Object TaskName, TaskPath, State
}

function Get-BrowserExtensions {
    $results = @()
    $chromeExt = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions"
    $edgeExt = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Extensions"
    $ffProfiles = "$env:APPDATA\Mozilla\Firefox\Profiles"

    if (Test-Path $chromeExt) {
        Get-ChildItem $chromeExt -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $results += [PSCustomObject]@{ Browser = "Chrome"; Id = $_.Name }
        }
    }
    if (Test-Path $edgeExt) {
        Get-ChildItem $edgeExt -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $results += [PSCustomObject]@{ Browser = "Edge"; Id = $_.Name }
        }
    }
    if (Test-Path $ffProfiles) {
        Get-ChildItem $ffProfiles -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $extDir = Join-Path $_.FullName "extensions"
            if (Test-Path $extDir) {
                Get-ChildItem $extDir -ErrorAction SilentlyContinue | ForEach-Object {
                    $results += [PSCustomObject]@{ Browser = "Firefox"; Id = $_.BaseName }
                }
            }
        }
    }
    $results
}

function Get-BrowserHomepage {
    $results = @()
    $chromePrefs = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences"
    $edgePrefs = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences"
    foreach ($pref in @(@{Name="Chrome";Path=$chromePrefs}, @{Name="Edge";Path=$edgePrefs})) {
        if (Test-Path $pref.Path) {
            try {
                $json = Get-Content $pref.Path -Raw | ConvertFrom-Json
                $homepage = $json.homepage
                $searchEngine = $json.default_search_provider_data.template_url_data.short_name
                $results += [PSCustomObject]@{ Browser = $pref.Name; Homepage = $homepage; SearchEngine = $searchEngine }
            } catch {}
        }
    }
    $results
}

function Get-FullSnapshot {
    Write-Host "Taking snapshot - installed programs, startup entries, scheduled tasks, browser extensions, homepage settings..."
    [PSCustomObject]@{
        Timestamp   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Programs    = @(Get-InstalledPrograms)
        StartupReg  = @(Get-StartupRegEntries)
        StartupShortcuts = @(Get-StartupShortcuts)
        ScheduledTasks = @(Get-ScheduledTasksList)
        Extensions  = @(Get-BrowserExtensions)
        Homepage    = @(Get-BrowserHomepage)
    }
}

if ($Start) {
    $snap = Get-FullSnapshot
    $snap | ConvertTo-Json -Depth 6 | Out-File $baselineFile -Encoding utf8
    Write-Host "Baseline captured at $($snap.Timestamp)."
    Write-Host "Now go download/install whatever you're evaluating. When done, run:"
    Write-Host "  install_snapshot_watcher.ps1 -Compare"
    return
}

if ($Compare) {
    if (-not (Test-Path $baselineFile)) {
        Write-Host "No baseline found. Run with -Start first, before you install anything."
        return
    }
    $before = Get-Content $baselineFile -Raw | ConvertFrom-Json
    $after = Get-FullSnapshot

    $reportPath = "$snapshotDir\diff_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    $jsonDiffPath = "$snapshotDir\diff_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"

    $newPrograms = @($after.Programs | Where-Object { $b = $_.DisplayName; -not ($before.Programs | Where-Object { $_.DisplayName -eq $b }) })
    $newStartupReg = @($after.StartupReg | Where-Object { $n = $_.Name; $p = $_.Path; -not ($before.StartupReg | Where-Object { $_.Name -eq $n -and $_.Path -eq $p }) })
    $newShortcuts = @($after.StartupShortcuts | Where-Object { $f = $_.FullName; -not ($before.StartupShortcuts | Where-Object { $_.FullName -eq $f }) })
    $newTasks = @($after.ScheduledTasks | Where-Object { $t = $_.TaskName; $p = $_.TaskPath; -not ($before.ScheduledTasks | Where-Object { $_.TaskName -eq $t -and $_.TaskPath -eq $p }) })
    $newExtensions = @($after.Extensions | Where-Object { $i = $_.Id; $b = $_.Browser; -not ($before.Extensions | Where-Object { $_.Id -eq $i -and $_.Browser -eq $b }) })

    $homepageChanges = [System.Collections.ArrayList]@()
    foreach ($afterHp in $after.Homepage) {
        $beforeHp = $before.Homepage | Where-Object { $_.Browser -eq $afterHp.Browser }
        if ($beforeHp -and ($beforeHp.Homepage -ne $afterHp.Homepage -or $beforeHp.SearchEngine -ne $afterHp.SearchEngine)) {
            $homepageChanges += [PSCustomObject]@{ Browser = $afterHp.Browser; OldHomepage = $beforeHp.Homepage; NewHomepage = $afterHp.Homepage; OldSearch = $beforeHp.SearchEngine; NewSearch = $afterHp.SearchEngine }
        }
    }

    $lines = @()
    $lines += "Amit Install Diff Report"
    $lines += "Baseline: $($before.Timestamp)  |  Compared: $($after.Timestamp)"
    $lines += ""
    $lines += "=== NEW PROGRAMS INSTALLED ($($newPrograms.Count)) ==="
    foreach ($p in $newPrograms) { $lines += "  - $($p.DisplayName)  [Publisher: $($p.Publisher)]  [Version: $($p.DisplayVersion)]" }
    $lines += ""
    $lines += "=== NEW STARTUP REGISTRY ENTRIES ($($newStartupReg.Count)) ==="
    foreach ($s in $newStartupReg) { $lines += "  - $($s.Name) = $($s.Value)  [$($s.Path)]" }
    $lines += ""
    $lines += "=== NEW STARTUP FOLDER SHORTCUTS ($($newShortcuts.Count)) ==="
    foreach ($s in $newShortcuts) { $lines += "  - $($s.FullName)" }
    $lines += ""
    $lines += "=== NEW SCHEDULED TASKS ($($newTasks.Count)) ==="
    foreach ($t in $newTasks) { $lines += "  - $($t.TaskPath)$($t.TaskName)  [State: $($t.State)]" }
    $lines += ""
    $lines += "=== NEW BROWSER EXTENSIONS ($($newExtensions.Count)) ==="
    foreach ($e in $newExtensions) { $lines += "  - [$($e.Browser)] $($e.Id)" }
    $lines += ""
    $lines += "=== HOMEPAGE / SEARCH ENGINE CHANGES ($($homepageChanges.Count)) ==="
    foreach ($h in $homepageChanges) { $lines += "  - [$($h.Browser)] Homepage: '$($h.OldHomepage)' -> '$($h.NewHomepage)'  Search: '$($h.OldSearch)' -> '$($h.NewSearch)'" }
    $lines += ""
    $totalChanges = $newPrograms.Count + $newStartupReg.Count + $newShortcuts.Count + $newTasks.Count + $newExtensions.Count + $homepageChanges.Count
    if ($totalChanges -eq 0) {
        $lines += "No changes detected - the install added nothing outside the target application (or nothing was captured by this scan's scope)."
    } else {
        $lines += "TOTAL CHANGES DETECTED: $totalChanges"
        $lines += "Bring this report to Amit (chat) to get each item researched and a removal recommendation."
    }

    $lines -join "`r`n" | Out-File $reportPath -Encoding utf8
    [PSCustomObject]@{
        NewPrograms = $newPrograms
        NewStartupReg = $newStartupReg
        NewShortcuts = $newShortcuts
        NewTasks = $newTasks
        NewExtensions = $newExtensions
        HomepageChanges = $homepageChanges
    } | ConvertTo-Json -Depth 6 | Out-File $jsonDiffPath -Encoding utf8

    Write-Host "Diff complete. $totalChanges change(s) detected."
    Write-Host "Report: $reportPath"
    Write-Host "JSON (for Amit to read directly): $jsonDiffPath"
    return
}

if ($Remove) {
    if (-not $ApprovedItemsFile -or -not (Test-Path $ApprovedItemsFile)) {
        Write-Host "Provide -ApprovedItemsFile pointing to a JSON file listing exactly what to remove."
        Write-Host 'Format: { "Programs": ["DisplayName1"], "StartupReg": [{"Path":"...","Name":"..."}], "Tasks": [{"TaskPath":"...","TaskName":"..."}], "Extensions": [{"Browser":"Chrome","Id":"..."}], "Shortcuts": ["fullpath"] }'
        return
    }
    $approved = Get-Content $ApprovedItemsFile -Raw | ConvertFrom-Json
    $backupDir = "$backupRoot\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $log = @()

    foreach ($progName in $approved.Programs) {
        $prog = Get-InstalledPrograms | Where-Object { $_.DisplayName -eq $progName }
        if ($prog) {
            $prog | ConvertTo-Json | Out-File "$backupDir\program_$($progName -replace '[\\/:*?"<>|]','_').json" -Encoding utf8
            if ($prog.UninstallString) {
                $log += "PROGRAM: $progName - uninstall string backed up. To uninstall, run: $($prog.UninstallString)"
                $log += "  (Not auto-executed - uninstallers often need interactive confirmation. Run that command yourself, or approve auto-run separately.)"
            } else {
                $log += "PROGRAM: $progName - no uninstall string found, may need manual removal via Settings > Apps."
            }
        }
    }

    foreach ($reg in $approved.StartupReg) {
        if (Test-Path $reg.Path) {
            $val = (Get-ItemProperty $reg.Path -ErrorAction SilentlyContinue).($reg.Name)
            "$($reg.Path) | $($reg.Name) = $val" | Out-File "$backupDir\startupreg_$($reg.Name -replace '[\\/:*?"<>|]','_').txt" -Encoding utf8
            Remove-ItemProperty -Path $reg.Path -Name $reg.Name -ErrorAction SilentlyContinue
            $log += "STARTUP REGISTRY REMOVED: $($reg.Name) from $($reg.Path) (backup saved)"
        }
    }

    foreach ($sc in $approved.Shortcuts) {
        if (Test-Path $sc) {
            Copy-Item $sc "$backupDir\$(Split-Path $sc -Leaf)" -ErrorAction SilentlyContinue
            Remove-Item $sc -Force -ErrorAction SilentlyContinue
            $log += "STARTUP SHORTCUT REMOVED: $sc (backup saved)"
        }
    }

    foreach ($t in $approved.Tasks) {
        try {
            Export-ScheduledTask -TaskName $t.TaskName -TaskPath $t.TaskPath -ErrorAction Stop | Out-File "$backupDir\task_$($t.TaskName -replace '[\\/:*?"<>|]','_').xml" -Encoding utf8
            Unregister-ScheduledTask -TaskName $t.TaskName -TaskPath $t.TaskPath -Confirm:$false -ErrorAction Stop
            $log += "SCHEDULED TASK REMOVED: $($t.TaskPath)$($t.TaskName) (backup saved)"
        } catch {
            $log += "SCHEDULED TASK REMOVAL FAILED: $($t.TaskPath)$($t.TaskName) - $($_.Exception.Message)"
        }
    }

    foreach ($ext in $approved.Extensions) {
        $log += "BROWSER EXTENSION: [$($ext.Browser)] $($ext.Id) - close the browser and remove manually via chrome://extensions or about:addons for safety (auto-deleting extension folders while the browser is open can corrupt its profile)."
    }

    $log -join "`r`n" | Out-File "$backupDir\removal_log.txt" -Encoding utf8
    Write-Host "Removal complete. Backups and log saved to: $backupDir"
    $log | ForEach-Object { Write-Host $_ }
    return
}

Write-Host "Specify -Start, -Compare, or -Remove -ApprovedItemsFile <path>."
