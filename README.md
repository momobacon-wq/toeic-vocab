# toeic-vocab — 單字總表查詢網頁

Anki TOEIC 牌組的靜態鏡像網站，部署在 GitHub Pages：
**https://momobacon-wq.github.io/toeic-vocab/**

即時搜尋（英文/中文/字根/搭配/例句全文）、等級與 Part 晶片過濾、點詞條展開完整 11 欄卡片、可播 Ava 發音 mp3。

## 更新流程（/toeic skill 自動執行）

```powershell
# 1. dump 全牌組（PowerShell — node 直連 AnkiConnect 會 ECONNRESET）
$b = '{"action":"findNotes","version":6,"params":{"query":"deck:TOEIC"}}'
$ids = (Invoke-RestMethod -Uri http://127.0.0.1:8765 -Method Post -Body $b -ContentType 'application/json').result
$b2 = @{action='notesInfo';version=6;params=@{notes=$ids}} | ConvertTo-Json -Compress
$n = Invoke-RestMethod -Uri http://127.0.0.1:8765 -Method Post -Body $b2 -ContentType 'application/json'
$n.result | ConvertTo-Json -Depth 8 | Out-File notes_dump.json -Encoding UTF8

# 2. 重生 data.json + 補新 mp3、commit、push
node gen-site.mjs
git add -A; git commit -m "sync vocab"; git push
```

或一鍵：`powershell -ExecutionPolicy Bypass -File sync-site.ps1`

## 檔案

- `index.html` — 網頁本體（無框架、單檔、fetch data.json）
- `data.json` — 全部卡片欄位（gen-site.mjs 產生，勿手改）
- `audio/*.mp3` — Ava 發音（從 Anki collection.media 複製）
- `gen-site.mjs` — dump → data.json + 複製 mp3
- `sync-site.ps1` — dump + gen + commit + push 一鍵同步
- `notes_dump.json` — AnkiConnect 原始 dump（gitignored）
