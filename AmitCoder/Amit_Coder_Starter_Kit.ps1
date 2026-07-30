# Amit Coder Starter Kit
# Sets up a new coding project folder the same way Ryan's own Amit environment
# is structured: a root CLAUDE.md that auto-orients Claude Code every session,
# a Templates subfolder for reusable project scaffolding, and a backup junction
# so every Claude Code session (JSONL files) is automatically preserved outside
# the default hidden folder.
#
# Run this once. Right-click the file -> "Run with PowerShell."

# Version of the shared directive package this script writes into a new
# project's CLAUDE.md (Pursuit Attribution, Shortcut Activation, Shortcut
# Awareness). Bump this by hand whenever a clause below is added or changed,
# and update the matching dev_playbook row (topic_key=amit_coder_directive_package)
# so installed copies can detect they are behind.
$DIRECTIVE_VERSION = "1.2"

Write-Host ""
Write-Host "=== Amit Coder Starter Kit ===" -ForegroundColor Yellow
Write-Host ""

# 1. Ask for (or default) a project root folder
$defaultPath = "$env:USERPROFILE\Documents\AmitCoderProjects"
$inputPath = Read-Host "Where should your project folder live? (press Enter for default: $defaultPath)"
$projectRoot = if ([string]::IsNullOrWhiteSpace($inputPath)) { $defaultPath } else { $inputPath }

if (-not (Test-Path $projectRoot)) {
    New-Item -ItemType Directory -Path $projectRoot -Force | Out-Null
    Write-Host "Created project folder: $projectRoot" -ForegroundColor Green
} else {
    Write-Host "Using existing folder: $projectRoot" -ForegroundColor Cyan
}

# 1b. Capture the project's own name - used to auto-stamp every pursuit this
# project ever creates with the same, exact, consistent identifier (never
# typed by hand later, never a different spelling next time). Defaults to
# the folder's own name if left blank.
$folderLeafName = Split-Path $projectRoot -Leaf
$appNameInput = Read-Host "What is this project/application called? (press Enter to use the folder name: $folderLeafName)"
$appName = if ([string]::IsNullOrWhiteSpace($appNameInput)) { $folderLeafName } else { $appNameInput.Trim() }
Write-Host "This project's canonical name is: $appName - every pursuit created from here will be stamped with this, always." -ForegroundColor Cyan

# 2. Templates subfolder
$templatesPath = Join-Path $projectRoot "Templates"
if (-not (Test-Path $templatesPath)) {
    New-Item -ItemType Directory -Path $templatesPath -Force | Out-Null
}

# 2b. AmitCoder subfolder - mirrors Ryan's own two-level structure: the root
#     CLAUDE.md (written below) is the PRIMARY file, the one Claude Code
#     actually reads at session start. This subfolder's own CLAUDE.md is
#     reference material about AmitCoder itself, not a duplicate of the
#     shortcut/pursuit machinery - that machinery lives in the root file only,
#     since a nested CLAUDE.md is not auto-read unless a session is opened
#     specifically inside that subfolder.
$amitCoderPath = Join-Path $projectRoot "AmitCoder"
if (-not (Test-Path $amitCoderPath)) {
    New-Item -ItemType Directory -Path $amitCoderPath -Force | Out-Null
    $amitCoderMdContent = @'
# AmitCoder - What This Folder Is

This is reference material about AmitCoder, the tool that set up this project.
Your assistant reads its actual working instructions from the CLAUDE.md at the
root of this project, one level up - not from this file. This file exists so
a person (or a future session poking around) can find out what AmitCoder is
without that explanation cluttering the primary file every session reads.

## What AmitCoder Is

AmitCoder is Amit's own coding workspace - shortcuts (F for your own, J for
the builtin package Amit ships with), a shared code library, pairing session
notes, and a real record of Amit's own build sessions. Web app:
ask-amit.github.io/Amit/AmitCoder/AmitCoder.html

## Where Things Actually Live

- Your project's real working instructions: the CLAUDE.md one level up (the
  root of this project) - Pursuit Attribution, Shortcut Activation, Shortcut
  Awareness, and the Directive Package Version are all there, not here.
- Your shortcuts are not cached to a file - every session queries Supabase
  directly for the current list, live, each time (see Shortcut Activation
  in the root CLAUDE.md).
- Your synced session data: amit_coder_config.json at the project root
  (your AmitCoder Account ID, used to fetch your own F shortcuts).

## Current Projects

(Nothing yet - update this as you build things using AmitCoder.)
'@
    Set-Content -Path (Join-Path $amitCoderPath "CLAUDE.md") -Value $amitCoderMdContent -Encoding utf8
    Write-Host "Created AmitCoder/CLAUDE.md - reference material about the tool itself" -ForegroundColor Green
}

# 3. Write the root CLAUDE.md - this is what makes Claude Code auto-orient
#    itself every session, the same mechanism Ryan's own Amit folder uses.
$claudeMdPath = Join-Path $projectRoot "CLAUDE.md"
if (Test-Path $claudeMdPath) {
    Write-Host "CLAUDE.md already exists here - leaving it untouched so nothing gets overwritten." -ForegroundColor Yellow
} else {
$claudeMdContent = @'
# Project Orientation - Read This First, Every Session

This file loads automatically at the start of every Claude Code session in this
folder. It exists so Claude Code (your assistant) always knows the current
state of your project without you re-explaining it each time. This is the
PRIMARY file - the one at the root of what you open in VS Code - which is why
it carries the shortcut and pursuit machinery below, not a subfolder copy.

## Who Amit Is

Amit is a Hebrew name meaning companion - one who walks alongside. When your
assistant is working inside this project, it is not a generic coding tool -
it is Amit, walking alongside you the same way it walks alongside anyone
building something real. Amit shows its work rather than just claiming
success (see the J review / J debug shortcuts below), keeps its own
directive package honestly versioned rather than pretending to be perfect
and unchanging, and treats you as a partner, not a support ticket.

## AmitCoder - What Set This Up

This project was set up using AmitCoder (ask-amit.github.io/Amit/AmitCoder) -
Amit's own coding workspace tool. See the AmitCoder/ subfolder for what that
tool is and how it works. This root file is where Claude Code actually reads
its instructions from every session - AmitCoder/CLAUDE.md is reference
material about the tool itself, not a second copy of these instructions.

## How This Folder Is Organized

- Each distinct project or feature gets its OWN subfolder, with its own
  CLAUDE.md inside it (see "New Project" below).
- This root CLAUDE.md is the entry point - the assistant reads it first, then
  is directed to the relevant subfolder's own file for anything project-specific.
- Templates/ holds reusable starter files you want to reuse across projects.
- AmitCoder/ holds reference material about the AmitCoder tool itself - see
  its own CLAUDE.md there. Your actual working instructions stay here, at
  the root, not in that subfolder.

## New Project Directive

When you start a new project or feature under this folder, tell your assistant
to create a new subfolder for it, with its own CLAUDE.md describing:
- What the project is
- What's been built so far
- What's still pending

This keeps each project's context isolated and easy to pick back up, instead of
one giant file trying to describe everything at once.

## Pursuit Attribution - Permanent

This project's canonical name, for any pursuit created from within it, is: __APPNAME__

Any pursuit written to hub_entries from this project must be stamped
program='__APPNAME__' - automatically, by this project's own code or by your
assistant acting on its behalf, using this exact spelling every time. Never ask
the person creating the pursuit what program a specific pursuit belongs to -
that's always this project's own name above, decided once, not per-item.

If you rename this application later, don't just edit this line by hand -
use the J rename pursuit shortcut instead. It updates this section AND
every existing pursuit (including completed ones/memories) that was stamped
with the old name, so your full build history stays under one consistent
identifier instead of splitting across two names.

## Shortcut Activation - Permanent

At the start of every session, and any time the person says something like
"update shortcuts," "recheck shortcuts," or "update J shortcuts" - query
Supabase directly yourself, right then, using your own tool access
(Bash/PowerShell). This is not a file some separate script pre-writes for
you - it is a live request you make as part of following this instruction,
the same way you'd read a project's own CLAUDE.md at the start of a session.
There is no local cache file to check and no separate hook script that needs
to have run first.

For J shortcuts (global, shared by everyone, no login needed):
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF

For the person's own F shortcuts, you additionally need their AmitCoder
Account ID (from amit_coder_config.json at the project root, if they have
set one) and query:
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true

Hold the results in your own working context for the session - no need to
write them to a file, since you can simply re-query any time it's asked to
be rechecked. When a message begins with a trigger word (F or J, followed by
a phrase), match it against what you fetched:
- Plain instruction: treat instruction_text as the actual request and act
  on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a
  referenced_shortcut_id, resolve it by looking up that other fetched
  entry's own instruction_text and run that instead.

If you have not fetched shortcuts yet this session, do so now before
concluding nothing matches - never guess at an unrecognized trigger without
having actually checked.

## Shortcut Awareness - Permanent

Two things, both automatic, both behavioral - no code can do this on its
own, since it depends on watching what actually happens across real sessions:

1. Proactive shortcut reminder - if a request matches something an existing
   F or J shortcut already does, say so before doing the work by hand.
   Don't wait to be asked whether a shortcut exists for this.

2. Repetition detection, across the last three sessions - not just within
   one sitting. Look back over this project's last three sessions (the
   shortcuts you just queried live from Supabase - see Shortcut Activation
   above - plus session-log files or hub_entries/experience records if this
   project writes them) for the same or similar instruction recurring
   across them - whether that's several times in one afternoon or spread
   across those three sessions. When a real pattern shows up, name it
   plainly with the actual count and which sessions it appeared in ("I've
   done this in each of your last three sessions") and suggest creating a
   shortcut for it. Auto-suggested shortcuts are always proposed as F
   (custom), never J - J is the builtin package, reserved for Amit's own
   account, not something spontaneously created mid-session. Suggest, never
   create unprompted - the person coding always decides.

## Directive Package Version - Permanent

Directive Package Version: __DIRECTIVE_VERSION__ (generated __GENDATE__)

This is YOUR project's own copy of Amit's shared directive package
(Pursuit Attribution, Shortcut Activation, Shortcut Awareness above) -
it is a snapshot taken when this file was generated, not a live link to
the master. If you are reading this file and you are not in Ryan's own
root Amit folder, you are running on someone else's installed copy - this
is expected and correct, not an error.

At the start of a session, query dev_playbook directly yourself, the same
way you query shortcuts above - no separate script or pre-written file
needed:
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/dev_playbook?topic_key=eq.amit_coder_directive_package&select=method
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```
The `method` field states the current master version ("Current version:
X.Y"). Compare that to the version stamped above. If the master is newer,
tell the person plainly (name the version gap) and offer to help them pull
the updated clause text in by hand - never overwrite their CLAUDE.md
automatically, since they may have customized it since install.

## Login-Based Profile - Permanent

This is global, not specific to AmitCoder - the same profile applies in
every Amit avenue the person uses (Hub, AmitCoder, any future module),
because it lives in Supabase, not in this project.

At the start of a session, if a user is actually signed in (their real
Supabase auth.uid(), never guessed or assumed), look up who they are:

1. Query user_growth_log for that user_id, ordered by created_at - this is
   their real, growing history. Different categories matter differently:
   - category=communication_style - how they actually want to be talked to.
   - category=vocabulary - their own personal phrase mappings (things they
     say that mean something specific to them - transcription quirks,
     shorthand, inside terms). When they say one of these, use the mapped
     meaning, don't guess or ask what they meant.
   - category=spiritual_compass - their spiritual growth history over time,
     if this person is on that journey with Amit.
   - category=key_moment - anything else worth remembering as a dated fact.
2. Also check user_memory for that user_id - a faster current-state summary
   synthesized from the log above. Read this first for a quick picture, but
   the growth log is the actual source of truth when something specific or
   historical is being asked about.
3. If neither has a row for this person yet, this is someone new - do not
   fabricate a profile. Build it up honestly over real sessions as you
   actually learn things, and write what you learn back to user_growth_log
   (their own user_id, real category, never someone else's).
4. If no one is signed in, operate without a profile - do not guess whose
   history you might be looking at.

The "how I talk" shortcut (or its equivalent, if renamed) is the explicit
path for a person to state a preference directly - it writes to their own
user_growth_log and user_memory, never anyone else's.

## How to Help This Person - Posture, Not Just Mechanics

Whoever is assisting from here forward (Claude, or any AI reading this file) should assume the person building this may be new to a lot of what's involved - git, GitHub, databases, deployment. The job is to actually handle that complexity for them using their own credentials and their own accounts, not to hand them a checklist and expect them to figure it out. Walk them through it patiently, explain what's happening as it happens, and don't let them feel lost. This applies especially to anything in the connection family (J instruction, J authorization, J connect, J setup, J push) - the whole point of those is that a brand-new person gets the plumbing handled for them, the same way a genuinely helpful companion would, not a bare technical assistant executing commands.

## Current Projects

(Nothing yet - this updates as you build.)

## Session Backups

Claude Code stores your session history at:
%USERPROFILE%\.claude\projects\

The starter kit that created this file also set up a backup so those session
files are automatically copied somewhere you control, not just left in a
hidden system folder. See the "Backup" note below for where that is.

---
*Set up by the Amit Coder Starter Kit.*
'@
    $claudeMdContent = $claudeMdContent.Replace('__APPNAME__', $appName)
    $claudeMdContent = $claudeMdContent.Replace('__DIRECTIVE_VERSION__', $DIRECTIVE_VERSION)
    $claudeMdContent = $claudeMdContent.Replace('__GENDATE__', (Get-Date -Format 'yyyy-MM-dd'))
    Set-Content -Path $claudeMdPath -Value $claudeMdContent -Encoding utf8
    Write-Host "Wrote starter CLAUDE.md" -ForegroundColor Green
}

# 4. Backup connection - mirrors Ryan's own setup: a real backup folder inside
#    the project root, with a junction pointing back to Claude Code's session
#    storage, so JSONL files sync there automatically without extra steps.
$backupPath = Join-Path $projectRoot "SessionBackups"
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}

$claudeProjectsPath = "$env:USERPROFILE\.claude\projects"
if (Test-Path $claudeProjectsPath) {
    $junctionTarget = Join-Path $backupPath "claude_sessions"
    if (-not (Test-Path $junctionTarget)) {
        try {
            cmd /c mklink /J "$junctionTarget" "$claudeProjectsPath" | Out-Null
            Write-Host "Linked session backup: $junctionTarget -> $claudeProjectsPath" -ForegroundColor Green
        } catch {
            Write-Host "Could not create the backup junction automatically. You can still find your sessions directly at: $claudeProjectsPath" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Session backup link already exists." -ForegroundColor Cyan
    }
} else {
    Write-Host "No Claude Code session folder found yet at $claudeProjectsPath - this is normal if you haven't run Claude Code here yet. Run this script again after your first session if you want the backup link created." -ForegroundColor Yellow
}

# 5. Migrations folder - a real, versioned home for your database changes,
#    the same pattern Ryan's own Amit project uses informally (numbered SQL
#    files). Formalizing it here means your database history lives in git
#    alongside your code, not scattered across chat history.
$migrationsPath = Join-Path $projectRoot "migrations"
if (-not (Test-Path $migrationsPath)) {
    New-Item -ItemType Directory -Path $migrationsPath -Force | Out-Null
    $migrationsReadme = @'
# Migrations

Each database change gets its own numbered file here: `0001_description.sql`,
`0002_description.sql`, and so on. Never edit an old migration file after it's
been run - write a new one instead. This keeps your database's real history
versioned in git, the same as your code.
'@
    Set-Content -Path (Join-Path $migrationsPath "README.md") -Value $migrationsReadme -Encoding utf8
    $exampleMigration = @'
-- 0001_example.sql
-- Migrations are numbered in the order they should run. Delete this file
-- once you've written your first real one.
'@
    Set-Content -Path (Join-Path $migrationsPath "0001_example.sql") -Value $exampleMigration -Encoding utf8
    Write-Host "Created migrations/ folder" -ForegroundColor Green
}

# 6. A basic CI check - GitHub Actions, so every push gets a free automatic
#    sanity check before it goes live. Only activates once this folder is a
#    real git repo pushed to GitHub.
$workflowsPath = Join-Path $projectRoot ".github\workflows"
if (-not (Test-Path $workflowsPath)) {
    New-Item -ItemType Directory -Path $workflowsPath -Force | Out-Null
    $workflowContent = @'
name: Basic Check
on: [push]
jobs:
  html-sanity-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Confirm HTML files are well-formed
        run: |
          shopt -s globstar
          for f in **/*.html; do
            if [ -f "$f" ]; then
              echo "Checking $f"
              python3 -c "
import sys
from html.parser import HTMLParser
class Check(HTMLParser):
    def error(self, message): print(f'::warning file=$f::{message}')
Check().feed(open('$f', encoding='utf-8', errors='ignore').read())
"
            fi
          done
'@
    Set-Content -Path (Join-Path $workflowsPath "basic-check.yml") -Value $workflowContent -Encoding utf8
    Write-Host "Created .github/workflows/basic-check.yml (activates once pushed to GitHub)" -ForegroundColor Green
}

# 7. Local dev server - no external installs needed (uses .NET's built-in
#    HttpListener via PowerShell), serves this folder at localhost so files
#    behave like they will once actually deployed, instead of raw file:// paths.
$serverScript = @'
# Start_Local_Server.ps1 - serves this folder at http://localhost:8080
# No installs needed (Python/Node not required) - uses .NET HttpListener directly.
param([int]$Port = 8080)
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port  (Ctrl+C to stop)" -ForegroundColor Green
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $path = $context.Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
        $filePath = Join-Path $root $path
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = switch ($ext) {
                ".html" {"text/html"}; ".css" {"text/css"}; ".js" {"application/javascript"}
                ".json" {"application/json"}; ".png" {"image/png"}; ".jpg" {"image/jpeg"}
                default {"application/octet-stream"}
            }
            $context.Response.ContentType = $contentType
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $context.Response.StatusCode = 404
        }
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
}
'@
$serverScriptPath = Join-Path $projectRoot "Start_Local_Server.ps1"
if (-not (Test-Path $serverScriptPath)) {
    Set-Content -Path $serverScriptPath -Value $serverScript -Encoding utf8
    Write-Host "Created Start_Local_Server.ps1 - run it any time to preview your site at http://localhost:8080" -ForegroundColor Green
}

# 8. Branch helper - a real, if small, nudge toward not committing risky
#    changes straight to main. Not a workflow enforcement, just a fast on-ramp.
$branchScript = @'
# New_Feature_Branch.ps1 - creates and switches to a new git branch
param([Parameter(Mandatory=$true)][string]$Name)
git checkout -b "feature/$Name"
Write-Host "Now on branch feature/$Name. Merge back to main when it's tested and ready." -ForegroundColor Green
'@
$branchScriptPath = Join-Path $projectRoot "New_Feature_Branch.ps1"
if (-not (Test-Path $branchScriptPath)) {
    Set-Content -Path $branchScriptPath -Value $branchScript -Encoding utf8
    Write-Host "Created New_Feature_Branch.ps1 - usage: .\New_Feature_Branch.ps1 -Name `"my-change`"" -ForegroundColor Green
}

# 9. Session-linking hooks - connects this LOCAL Claude Code install back to
#    your AmitCoder web account through Supabase, with no server and no cost
#    beyond what AmitCoder already uses. Needs your Account ID, shown in
#    AmitCoder's Settings tab once you're signed in there.
$hooksPath = Join-Path $projectRoot "hooks"
if (-not (Test-Path $hooksPath)) {
    New-Item -ItemType Directory -Path $hooksPath -Force | Out-Null
}

$configPath = Join-Path $projectRoot "amit_coder_config.json"
if (-not (Test-Path $configPath)) {
    Write-Host ""
    $accountId = Read-Host "Paste your AmitCoder Account ID (from the Settings tab at ask-amit.github.io/Amit/AmitCoder/AmitCoder.html), or press Enter to skip for now"
    $configContent = @{ account_id = $accountId; app_name = $appName } | ConvertTo-Json
    Set-Content -Path $configPath -Value $configContent -Encoding utf8
    if ($accountId) {
        Write-Host "Saved your Account ID - the hooks below can now find your shortcuts and post session summaries." -ForegroundColor Green
    } else {
        Write-Host "Skipped - you can add your Account ID to amit_coder_config.json later to enable the hooks below." -ForegroundColor Yellow
    }
}

$sessionStartScript = @'
# Amit_Coder_SessionStart.ps1 - OPTIONAL, not required for shortcuts to work.
# Corrected 2026-07-29: shortcuts and the directive-version check are no
# longer read from a cache file this script writes - the root CLAUDE.md now
# instructs Claude Code to query Supabase directly, live, itself, at the
# start of every session (see "Shortcut Activation" and "Directive Package
# Version" in that file). That removed the need for this script to run
# automatically at all, and with it the earlier open question of whether
# Claude Code's own hook-firing would ever reliably trigger it.
# This script still works standalone as a manual diagnostic / local record
# if you want one - run it yourself any time: `.\hooks\Amit_Coder_SessionStart.ps1`
$configPath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_coder_config.json"
if (-not (Test-Path $configPath)) { Write-Host "No amit_coder_config.json found - run the starter kit first."; exit }
$config = Get-Content $configPath | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($config.account_id)) { Write-Host "No Account ID saved yet - add one to amit_coder_config.json."; exit }

$SB_URL = "https://hleqtjqojksurvkyqixt.supabase.co"
$SB_KEY = "sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF"
$headers = @{ "apikey" = $SB_KEY; "Authorization" = "Bearer $SB_KEY" }
$uri = "$SB_URL/rest/v1/amit_shortcuts?or=(user_id.is.null,user_id.eq.$($config.account_id))&is_active=eq.true"
try {
    $shortcuts = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    $cachePath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_shortcuts_cache.json"
    $shortcuts | ConvertTo-Json -Depth 5 | Set-Content -Path $cachePath -Encoding utf8
    Write-Host "Pulled $($shortcuts.Count) active shortcut(s) into amit_shortcuts_cache.json" -ForegroundColor Green
} catch {
    Write-Host "Could not reach Supabase: $_" -ForegroundColor Yellow
}

# Directive package version check - compares this project's own installed
# stamp (in its CLAUDE.md, written by the Starter Kit) against the current
# master version recorded in dev_playbook. Snapshot vs live comparison only -
# never overwrites the local CLAUDE.md, just reports whether it is behind.
try {
    $claudeMdPath = Join-Path (Split-Path $PSScriptRoot -Parent) "CLAUDE.md"
    $statusPath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_directive_status.json"
    $localVersion = $null
    if (Test-Path $claudeMdPath) {
        $m = Select-String -Path $claudeMdPath -Pattern "Directive Package Version:\s*([0-9.]+)" | Select-Object -First 1
        if ($m) { $localVersion = $m.Matches[0].Groups[1].Value }
    }
    $playbookUri = "$SB_URL/rest/v1/dev_playbook?topic_key=eq.amit_coder_directive_package&select=method"
    $playbook = Invoke-RestMethod -Uri $playbookUri -Headers $headers -Method Get
    $masterVersion = $null
    if ($playbook -and $playbook.Count -gt 0) {
        $pm = [regex]::Match($playbook[0].method, "Current version:\s*([0-9.]+)")
        if ($pm.Success) { $masterVersion = $pm.Groups[1].Value }
    }
    $status = [PSCustomObject]@{
        local_version = $localVersion
        master_version = $masterVersion
        up_to_date = ($localVersion -and $masterVersion -and $localVersion -eq $masterVersion)
        checked_at = (Get-Date -Format "s")
    }
    $status | ConvertTo-Json | Set-Content -Path $statusPath -Encoding utf8
    if ($localVersion -and $masterVersion -and $localVersion -ne $masterVersion) {
        Write-Host "Amit's shared directive package has an update: yours is v$localVersion, current is v$masterVersion. Ask Claude Code about it next session." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check directive package version: $_" -ForegroundColor Yellow
}
'@
Set-Content -Path (Join-Path $hooksPath "Amit_Coder_SessionStart.ps1") -Value $sessionStartScript -Encoding utf8

$sessionEndScript = @'
# Amit_Coder_SessionEnd.ps1 - posts a one-line session summary back to your
# AmitCoder History tab. Run manually for now:
# `.\hooks\Amit_Coder_SessionEnd.ps1 -Summary "what you built today"`
# (Same caveat as SessionStart - automatic firing on Claude Code session end
# needs a verified hook entry in .claude\settings.json; not yet confirmed.)
param([Parameter(Mandatory=$true)][string]$Summary)
$configPath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_coder_config.json"
if (-not (Test-Path $configPath)) { Write-Host "No amit_coder_config.json found - run the starter kit first."; exit }
$config = Get-Content $configPath | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($config.account_id)) { Write-Host "No Account ID saved yet - add one to amit_coder_config.json."; exit }

$SB_URL = "https://hleqtjqojksurvkyqixt.supabase.co"
$SB_KEY = "sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF"
$headers = @{ "apikey" = $SB_KEY; "Authorization" = "Bearer $SB_KEY"; "Content-Type" = "application/json" }
$body = @{ user_id = $config.account_id; summary = $Summary } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$SB_URL/rest/v1/amit_coder_sessions" -Headers $headers -Method Post -Body $body | Out-Null
    Write-Host "Session summary saved to your AmitCoder History tab." -ForegroundColor Green
} catch {
    Write-Host "Could not reach Supabase: $_" -ForegroundColor Yellow
}
'@
Set-Content -Path (Join-Path $hooksPath "Amit_Coder_SessionEnd.ps1") -Value $sessionEndScript -Encoding utf8
Write-Host "Created hooks/Amit_Coder_SessionStart.ps1 and hooks/Amit_Coder_SessionEnd.ps1" -ForegroundColor Green

# 10. .vscode/ config - workspace settings + recommended extensions, committed
# to the project so anyone opening it gets the same editor behavior
# automatically (format-on-save, same lint rules) without configuring it
# by hand. Researched 2026-07-29 against current VS Code best-practice
# guidance - see AmitCoder/CLAUDE.md for sources.
$vscodePath = Join-Path $projectRoot ".vscode"
if (-not (Test-Path $vscodePath)) {
    New-Item -ItemType Directory -Path $vscodePath -Force | Out-Null
    $settingsJson = @'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.autoSave": "onFocusChange",
  "editor.rulers": [100]
}
'@
    Set-Content -Path (Join-Path $vscodePath "settings.json") -Value $settingsJson -Encoding utf8
    $extensionsJson = @'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "rangav.vscode-thunder-client",
    "ms-vsliveshare.vsliveshare"
  ]
}
'@
    Set-Content -Path (Join-Path $vscodePath "extensions.json") -Value $extensionsJson -Encoding utf8
    Write-Host "Created .vscode/settings.json and .vscode/extensions.json (VS Code will prompt to install the recommended extensions on first open)" -ForegroundColor Green
}

# 11. Dev Container template - Microsoft's own built-in answer to "give
# someone my exact setup," arguably stronger than scripts alone since VS
# Code natively offers to reopen the folder inside it. Kept minimal since
# most Amit projects are static HTML/JS with no real build step - this is
# a starting point to extend, not a full Node/Python toolchain.
$devcontainerPath = Join-Path $projectRoot ".devcontainer"
if (-not (Test-Path $devcontainerPath)) {
    New-Item -ItemType Directory -Path $devcontainerPath -Force | Out-Null
    $devcontainerJson = @'
{
  "name": "Amit Coder Project",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "eamodio.gitlens"
      ]
    }
  }
}
'@
    Set-Content -Path (Join-Path $devcontainerPath "devcontainer.json") -Value $devcontainerJson -Encoding utf8
    Write-Host "Created .devcontainer/devcontainer.json (VS Code will offer to reopen the project in this container)" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Yellow
Write-Host "Your project folder is ready at: $projectRoot"
Write-Host "Next: open this folder in VS Code, open the Claude Code extension, and say `"good morning`"."
Write-Host "Also created: migrations/, .github/workflows/basic-check.yml, Start_Local_Server.ps1, New_Feature_Branch.ps1, hooks/ (session-linking scripts), .vscode/ (settings + recommended extensions incl. Live Share), and .devcontainer/ (reproducible setup)."
Write-Host ""
