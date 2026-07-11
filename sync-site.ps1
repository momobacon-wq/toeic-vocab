# sync-site.ps1 — dump Anki TOEIC deck → regen data.json/audio → push to GitHub Pages
# 前提：Anki 開著（AnkiConnect :8765）、gh/git 已登入
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$b = '{"action":"findNotes","version":6,"params":{"query":"deck:TOEIC"}}'
$ids = (Invoke-RestMethod -Uri http://127.0.0.1:8765 -Method Post -Body $b -ContentType 'application/json').result
$b2 = @{action='notesInfo';version=6;params=@{notes=$ids}} | ConvertTo-Json -Compress
$n = Invoke-RestMethod -Uri http://127.0.0.1:8765 -Method Post -Body $b2 -ContentType 'application/json'
$n.result | ConvertTo-Json -Depth 8 | Out-File "$PSScriptRoot\notes_dump.json" -Encoding UTF8

node "$PSScriptRoot\gen-site.mjs"
if ($LASTEXITCODE -ne 0) { throw "gen-site.mjs failed (exit $LASTEXITCODE) — data.json NOT regenerated" }

git add -A
$status = git status --porcelain
if (-not $status) { Write-Host "site already up to date, nothing to push"; exit 0 }
git commit -m "sync vocab ($($ids.Count) cards)" | Out-Null
git push
Write-Host "pushed: https://momobacon-wq.github.io/toeic-vocab/ ($($ids.Count) cards)"
