// 辞書エントリ用 OGP カード (1200x630) を生成
//
// 用途: 各辞書エントリページの og:image としてプリジェネレート
//
// 使い方:
//   npm run generate:dict-og             # 不足分のみ
//   npm run generate:dict-og -- --force  # 全部再生成
//
// 出力: public/og/dict/<slug>.png

import '../lib/env.js';
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { DictEntry } from '../types.js';

const FONT_PATH = join(process.cwd(), 'fonts', 'NotoSansJP-Bold.ttf');
const ENTRIES_DIR = join(process.cwd(), 'data', 'dict', 'entries');
const OUT_DIR = join(process.cwd(), 'public', 'og', 'dict');

const CATEGORY_LABELS: Record<string, { ja: string; color: string }> = {
  research: { ja: '研究・統計', color: '#4a90e2' },
  biology: { ja: '生物学', color: '#52c41a' },
  psychology: { ja: '心理学', color: '#722ed1' },
  'nursing-pharma': { ja: '看護・薬学', color: '#fa8c16' },
};

let fontBuf: Buffer | null = null;
async function loadFont() {
  if (!fontBuf) fontBuf = await readFile(FONT_PATH);
  return fontBuf;
}

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// CJK 2単位 / ASCII 1単位 で簡易折り返し
function wrap(text: string, maxWeight: number): string[] {
  const lines: string[] = [];
  let cur = '';
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const cw = code > 0x00FF ? 2 : 1;
    if (w + cw > maxWeight && cur) { lines.push(cur); cur = ''; w = 0; }
    cur += ch; w += cw;
  }
  if (cur) lines.push(cur);
  return lines;
}

function buildSvg(entry: DictEntry): string {
  const cat = CATEGORY_LABELS[entry.category] || { ja: entry.category, color: '#666' };
  const jaLines = wrap(entry.ja, 28); // 最大 28単位 (CJKなら14字)
  const jaFs = jaLines.length === 1 ? 92 : (jaLines.length === 2 ? 76 : 60);
  const enLines = wrap(entry.en, 44);
  const enFs = enLines.length === 1 ? 48 : 40;
  const hitsLabel = `PubMed ${entry.pubmedCount.toLocaleString()} 件`;

  const jaY0 = 220;
  const enY0 = jaY0 + (jaLines.length * (jaFs * 1.15)) + 20;

  const jaBlock = jaLines.map((ln, i) =>
    `<text x="60" y="${jaY0 + i * jaFs * 1.15}" font-size="${jaFs}" font-weight="700" fill="#1a1a1a">${escapeXml(ln)}</text>`
  ).join('');

  const enBlock = enLines.map((ln, i) =>
    `<text x="60" y="${enY0 + i * enFs * 1.2}" font-size="${enFs}" font-weight="700" fill="#555">${escapeXml(ln)}</text>`
  ).join('');

  const abbr = entry.abbr ? `<g>
    <rect x="60" y="500" width="${entry.abbr.length * 28 + 30}" height="60" rx="8" fill="#fff3cd" />
    <text x="${60 + (entry.abbr.length * 28 + 30) / 2}" y="540" font-size="36" font-weight="700" fill="#856404" text-anchor="middle">${escapeXml(entry.abbr)}</text>
  </g>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="8" fill="${cat.color}"/>
  <!-- category badge -->
  <g>
    <rect x="60" y="60" width="${cat.ja.length * 32 + 40}" height="50" rx="25" fill="${cat.color}"/>
    <text x="${60 + (cat.ja.length * 32 + 40) / 2}" y="95" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">${escapeXml(cat.ja)}</text>
  </g>
  <!-- site mark -->
  <text x="1140" y="95" font-size="22" font-weight="700" fill="#888" text-anchor="end">PubMed 日英辞書</text>
  <!-- ja -->
  ${jaBlock}
  <!-- en -->
  ${enBlock}
  <!-- abbr -->
  ${abbr}
  <!-- hits -->
  <text x="1140" y="540" font-size="28" font-weight="700" fill="${cat.color}" text-anchor="end">${escapeXml(hitsLabel)}</text>
  <!-- url -->
  <text x="60" y="605" font-size="22" fill="#999">sciencepubmed.net/ja/dict/</text>
</svg>`;
}

async function renderOne(entry: DictEntry, force: boolean): Promise<'ok' | 'skip' | 'fail'> {
  const outPath = join(OUT_DIR, `${entry.slug}.png`);
  if (!force && await exists(outPath)) return 'skip';
  try {
    const svg = buildSvg(entry);
    const resvg = new Resvg(svg, {
      font: { fontBuffers: [await loadFont()], loadSystemFonts: false, defaultFontFamily: 'Noto Sans JP' },
    });
    const png = resvg.render().asPng();
    await writeFile(outPath, png);
    return 'ok';
  } catch (e: any) {
    console.error(`  FAIL  ${entry.slug}  ${e.message}`);
    return 'fail';
  }
}

async function main() {
  const force = process.argv.includes('--force');
  await mkdir(OUT_DIR, { recursive: true });
  let files: string[] = [];
  try { files = await readdir(ENTRIES_DIR); } catch { console.log('No entries yet'); return; }
  let ok = 0, skip = 0, fail = 0;
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const entry: DictEntry = JSON.parse(await readFile(join(ENTRIES_DIR, f), 'utf-8'));
      const r = await renderOne(entry, force);
      if (r === 'ok') { ok++; console.log(`  OK    ${entry.slug}`); }
      else if (r === 'skip') skip++;
      else fail++;
    } catch {}
  }
  console.log(`[dict/og] done: ok=${ok} skip=${skip} fail=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
