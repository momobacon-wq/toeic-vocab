// gen-site.mjs — notes_dump.json (AnkiConnect notesInfo) → data.json + copy audio mp3
// usage: node gen-site.mjs [dumpPath]
// 重跑安全：data.json 全量重寫、mp3 已存在就跳過
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = import.meta.dirname;
const DUMP = process.argv[2] || join(ROOT, 'notes_dump.json');
const AUDIO_SRC = join(process.env.APPDATA, 'Anki2', '使用者 1', 'collection.media');
const AUDIO_DST = join(ROOT, 'audio');
mkdirSync(AUDIO_DST, { recursive: true });

const notes = JSON.parse(readFileSync(DUMP, 'utf8'));

const stripHtml = (h) => (h || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

let copied = 0, missing = [];
const cards = notes.map((n) => {
  const f = Object.fromEntries(Object.entries(n.fields).map(([k, v]) => [k, v.value]));
  const audioMatch = (f['Audio'] || '').match(/\[sound:([^\]]+)\]/);
  let audio = null;
  if (audioMatch) {
    const src = join(AUDIO_SRC, audioMatch[1]);
    const dst = join(AUDIO_DST, audioMatch[1]);
    if (existsSync(src)) {
      if (!existsSync(dst)) { copyFileSync(src, dst); copied++; }
      audio = audioMatch[1];
    } else missing.push(audioMatch[1]);
  }
  const ctx = f['多益情境'] || '';
  const level = (ctx.match(/TOEIC\s*(\d{3}\+)/) || [])[1] || null;
  const parts = [...new Set([...ctx.matchAll(/Part\s*(\d)/g)].map(m => m[1]))].sort();
  return {
    id: n.noteId,
    en: stripHtml(f['English']),
    zh: stripHtml(f['中文']),
    kk: stripHtml(f['KK音標']),
    pos: f['詞性'] || '',
    pronun: f['發音說明'] || '',
    etym: f['解說'] || '',
    ex: f['例句'] || '',
    coll: f['常用搭配'] || '',
    syn: f['同義字反義'] || '',
    ctx, level, parts, audio,
    search: [f['English'], f['中文'], f['詞性'], f['解說'], f['例句'], f['常用搭配'], f['同義字反義'], ctx]
      .map(stripHtml).join(' ').toLowerCase(),
  };
}).sort((a, b) => a.en.localeCompare(b.en));

writeFileSync(join(ROOT, 'data.json'), JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  count: cards.length,
  cards,
}), 'utf8');

console.log(`data.json: ${cards.length} cards | audio copied: ${copied}, missing: ${missing.length}${missing.length ? ' → ' + missing.join(', ') : ''}`);
