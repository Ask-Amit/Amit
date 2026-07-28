# Amit Coder Starter Kit
# Sets up a new coding project folder the same way Ryan's own Amit environment
# is structured: a root CLAUDE.md that auto-orients Claude Code every session,
# a Templates subfolder for reusable project scaffolding, and a backup junction
# so every Claude Code session (JSONL files) is automatically preserved outside
# the default hidden folder.
#
# Run this once. Right-click the file -> "Run with PowerShell."

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

# 2. Templates subfolder
$templatesPath = Join-Path $projectRoot "Templates"
if (-not (Test-Path $templatesPath)) {
    New-Item -ItemType Directory -Path $templatesPath -Force | Out-Null
}

# 3. Write the root CLAUDE.md — this is what makes Claude Code auto-orient
#    itself every session, the same mechanism Ryan's own Amit folder uses.
$claudeMdPath = Join-Path $projectRoot "CLAUDE.md"
if (Test-Path $claudeMdPath) {
    Write-Host "CLAUDE.md already exists here — leaving it untouched so nothing gets overwritten." -ForegroundColor Yellow
} else {
$claudeMdContent = @'
# Project Orientation — Read This First, Every Session

This file loads automatically at the start of every Claude Code session in this
folder. It exists so Claude Code (your assistant) always knows the current
state of your project without you re-explaining it each time.

## How This Folder Is Organized

- Each distinct project or feature gets its OWN subfolder, with its own
  CLAUDE.md inside it (see "New Project" below).
- This root CLAUDE.md is the entry point — the assistant reads it first, then
  is directed to the relevant subfolder's own file for anything project-specific.
- `Templates/` holds reusable starter files you want to reuse across projects.

## New Project Directive

When you start a new project or feature under this folder, tell your assistant
to create a new subfolder for it, with its own CLAUDE.md describing:
- What the project is
- What's been built so far
- What's still pending

This keeps each project's context isolated and easy to pick back up, instead of
one giant file trying to describe everything at once.

## Current Projects

(Nothing yet — this updates as you build.)

## Session Backups

Claude Code stores your session history at:
`%USERPROFILE%\.claude\projects\`

The starter kit that created this file also set up a backup so those session
files are automatically copied somewhere you control, not just left in a
hidden system folder. See the "Backup" note below for where that is.

---
*Set up by the Amit Coder Starter Kit.*
'@
    Set-Content -Path $claudeMdPath -Value $claudeMdContent -Encoding utf8
    Write-Host "Wrote starter CLAUDE.md" -ForegroundColor Green
}

# 4. Backup connection — mirrors Ryan's own setup: a real backup folder inside
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
    Write-Host "No Claude Code session folder found yet at $claudeProjectsPath — this is normal if you haven't run Claude Code here yet. Run this script again after your first session if you want the backup link created." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Yellow
Write-Host "Your project folder is ready at: $projectRoot"
Write-Host "Next: open this folder in VS Code, open the Claude Code extension, and say `"good morning`"."
Write-Host ""
