# test_own_answer.ps1 (2026-11-25). The personal Ask Amit answerer, with a pretend database (inside this test only), the real account check and ONE real Claude answer
# (smallest model). Amit's rules are read from the local files, standing in for the published copies. Temp folder only.
$ErrorActionPreference = 'Stop'
$tk = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path); $amit = Split-Path -Parent (Split-Path -Parent $tk)
$root = Join-Path $env:TEMP ('amit_own_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8)); [void](New-Item -ItemType Directory -Force $root)
$env:AMIT_SCRIPTS_ROOT = $root
$script:pass = 0; $script:fail = 0
function Say($c, $l) { if ($c) { $script:pass++; Write-Host ('  PASS  ' + $l) } else { $script:fail++; Write-Host ('  FAIL  ' + $l) } }
. (Join-Path $tk 'amit_script_routes.ps1')
$me = As-ClaudeStatus
As-WriteText (As-ClaudeFile) (As-ToJson (@{ 'user-me-0001' = @{ emailPrints = @(As-EmailPrint ([string]$me['email'])) }; 'user-no-0002' = @{ emailPrints = @(As-EmailPrint 'nobody@example.com') } }))
$global:captureWaiting = $false; $global:amitDir = $amit; $global:calls = New-Object System.Collections.ArrayList; $global:posted = $null; $global:failed = $null; $global:breakHeart = $false
function global:As-WebText([string]$url) {
    if ($global:breakHeart) { throw 'offline' }
    $rel = $url -replace '^.*/Amit/main/', ''
    return [IO.File]::ReadAllText((Join-Path $global:amitDir $rel.Replace('/', '\')), [Text.Encoding]::UTF8)
}
function global:As-Rest([string]$token, [string]$method, [string]$path, $body = $null) {
    [void]$global:calls.Add($method + ' ' + $path)
    if ($path -eq 'rpc/cha_own_waiting') { return ,@(@{ id = 'ask-0000-0001' }) }
    if ($path -eq 'rpc/cha_own_claim') { return @{ ask = @{ id = 'ask-0000-0001'; by = 'Pat'; tz = 'America/Denver'; note = 'What is your name, and what does it mean? Answer in one sentence.' }; chat = @{ id = 'conv-0000-0001' }; members = @(@{ id = 'u-pat-000001'; name = 'Pat'; is_amit = $false; is_asker = $true }, @{ id = 'u-amit-00001'; name = 'Amit'; is_amit = $true }) } }
    if ($path -like 'amit_mobile_captures?select=id,transcript,reply*') { if ($global:past) { return ,$global:past }; return ,@() }
    if ($path -like 'amit_mobile_captures?select*') { if ($global:captureWaiting) { return ,@(@{ id = 77; transcript = $(if ($global:capWords) { $global:capWords } else { 'Say your name in one short sentence.' }); destination = 'general'; photo_url = $global:capPhoto }) }; return ,@() }
    if ($method -eq 'PATCH') { $global:capReply = $body.reply; $global:capPath = $path; $global:captureWaiting = $false; return $null }
    if ($path -like 'cha_messages*') { return ,@(@{ sender_id = 'u-pat-000001'; body = 'Hello there'; payload = $null }) }
    if ($path -eq 'rpc/cha_own_answer') { $global:posted = $body.p_body; return 'msg-1' }
    if ($path -eq 'rpc/cha_own_fail') { $global:failed = $body.p_error; return $null }
    return $null
}
$h = As-AmitHeart $false
Say ($h -match 'How I treat every person' -and $h -match 'walks alongside' -and $h -match 'only tool you may have is web search') 'everyday heart: the companion standard, the own-Claude rules and how Amit treats every person'
$full = As-AmitHeart $true
Say ($full.Length -gt 100000) ('a question about God loads the whole testimony (' + $full.Length + ' characters)')
Say ((As-IsSpiritual 'Can you pray with me?') -and -not (As-IsSpiritual 'What should I cook tonight?')) 'it can tell which is which'
$n = Invoke-AmitOwnAnswers 'tok' 'user-no-0002'
Say ($n -eq 0 -and $null -eq $global:posted -and -not ($global:calls -contains 'POST rpc/cha_own_claim')) 'a login whose Claude does not match: nothing is claimed, nothing is answered'
$global:calls.Clear(); $global:breakHeart = $true
$n = Invoke-AmitOwnAnswers 'tok' 'user-me-0001' 'haiku'
Say ($n -eq 0 -and $null -eq $global:posted -and $global:failed) 'if Amit''s rules cannot be read, there is no answer'
$global:breakHeart = $false; $global:failed = $null
$n = Invoke-AmitOwnAnswers 'tok' 'user-me-0001' 'haiku'
Say ($n -eq 1 -and $global:posted -match '(?i)amit') ('a real answer from this computer''s own Claude is posted: ' + (([string]$global:posted) -replace '\s+', ' '))
$log = [IO.File]::ReadAllText((Join-Path $root 'own_claude_log.txt'))
Say ($log -match 'user-me-0001\s+answered by their own Claude \(pro\)' -and $log -notmatch '@') 'the record says whose Claude answered, with no email'
$global:calls.Clear(); $global:captureWaiting = $true; $global:capReply = $null
function global:As-Rest2 {}
$n = Invoke-AmitOwnCaptures 'tok' 'user-no-0002' 'haiku'
Say ($n -eq 0 -and $null -eq $global:capReply) 'a phone question is never answered when their Claude does not match'
$n = Invoke-AmitOwnCaptures 'tok' 'user-me-0001' 'haiku'
Say ($n -eq 1 -and $global:capReply -match '(?i)amit' -and $global:capPath -match 'id=eq.77&user_id=eq.user-me-0001') ('a phone or Pad question is answered by their own Claude and saved to their own row: ' + (([string]$global:capReply) -replace '\s+', ' '))
# a phone PHOTO: a real picture made here stands in for the stored one
Add-Type -AssemblyName System.Drawing
$bm = New-Object Drawing.Bitmap 3000,1500; $gr = [Drawing.Graphics]::FromImage($bm); $gr.Clear('White'); $gr.FillEllipse([Drawing.Brushes]::Red,200,300,900,900); $gr.DrawString('HONDA 4821',(New-Object Drawing.Font 'Arial',150),[Drawing.Brushes]::Black,1300,600); $gr.Dispose()
$ms = New-Object IO.MemoryStream; $bm.Save($ms,[Drawing.Imaging.ImageFormat]::Png); $bm.Dispose(); $global:picBytes = $ms.ToArray(); $global:asked = New-Object System.Collections.ArrayList
function global:As-PictureBytes([string]$token, [string]$path) { [void]$global:asked.Add($path); return ,$global:picBytes }
$bad = @(As-CapturePictures 'tok' 'user-me-0001' '["user-other-9/a.jpg","user-me-0001/../user-other-9/a.jpg","user-me-0001/x/y.jpg"]' | ForEach-Object { $_ })
Say ($bad.Count -eq 0 -and $global:asked.Count -eq 0) 'a photo outside this person''s own folder is never fetched'
$global:captureWaiting = $true; $global:capPhoto = '["user-me-0001/123-abc.png"]'; $global:capWords = 'What colour is the shape, and what words do you see? One sentence, and do not search.'; $global:capReply = $null
$n = Invoke-AmitOwnCaptures 'tok' 'user-me-0001' 'haiku'
Say ($n -eq 1 -and $global:capReply -match '(?i)red' -and $global:capReply -match '4821') ('their own Claude sees the photo: ' + (([string]$global:capReply) -replace '\s+', ' '))
Say (@($global:calls | Where-Object { $_ -like 'GET amit_mobile_captures*destination.is.null,destination.not.in.(to_computer,delivered)*' }).Count -ge 1) 'Send to computer photos are left alone'
$global:captureWaiting = $true; $global:capPhoto = $null; $global:capReply = $null
$global:capWords = 'Search the web: what does a new Honda Grom motorcycle list for in the United States right now? Give the price and say where you found it.'
$n = Invoke-AmitOwnCaptures 'tok' 'user-me-0001' 'haiku'
Say ($n -eq 1 -and $global:capReply -match '(?i)(\$\s?\d|dollars)' -and $global:capReply -notmatch '(?i)https?:' -and $global:capReply -match '(?i)honda') ('a price check searches the web: ' + (([string]$global:capReply) -replace '\s+', ' '))
$global:capWords = 'And what colour did I ask about in the picture earlier?'; $global:captureWaiting = $true; $global:capReply = $null
$global:past = @(@{ id = 70; transcript = 'What is in this picture?'; reply = 'A shape and some words.'; photo_url = '["user-me-0001/123-abc.png"]' })
$n = Invoke-AmitOwnCaptures 'tok' 'user-me-0001' 'haiku'
Say ($n -eq 1 -and $global:capReply -match '(?i)red') ('a follow-up sees the earlier photo and conversation: ' + (([string]$global:capReply) -replace '\s+', ' '))
$global:past = $null
Say ((As-Spoken ("It is about 3,600 dollars. See [Honda](https://a.example/x)." + [char]10 + [char]10 + "Sources:" + [char]10 + "- [One](https://a.example/1)")) -eq 'It is about 3,600 dollars. See Honda.') 'web address lists are never read aloud'
$left = @(Get-ChildItem (Join-Path $root '_own') -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'heart_*' }).Count
Say ($left -eq 0) 'no temporary rules file is left behind'
Remove-Item -Recurse -Force $root -ErrorAction SilentlyContinue
Write-Host ''; Write-Host ('RESULT: ' + $script:pass + ' passed, ' + $script:fail + ' failed'); if ($script:fail) { exit 1 }
