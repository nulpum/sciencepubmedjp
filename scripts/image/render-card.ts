// テキスト → PNG レンダラ
// 用途:
//   - OGP 画像 (1200x630) ... og タグでシェア時に表示されるカード
//   - Instagram 用カード (1080x1080) ... フィード投稿時の画像
//
// 実装: SVG を組み立てて @resvg/resvg-js で PNG 化
// フォント: fonts/NotoSansJP-Bold.ttf (Variable, 全 weight 込み)

import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const FONT_PATH = join(process.cwd(), 'fonts', 'NotoSansJP-Bold.ttf');

let cachedFont: Buffer | null = null;
async function loadFont(): Promise<Buffer> {
  if (cachedFont) return cachedFont;
  cachedFont = await readFile(FONT_PATH);
  return cachedFont;
}

export type CardSize = 'og' | 'square';

// 全角を考慮した簡易折り返し (CJK 1 文字 = 2 単位、ASCII 1 単位)
function wrapByWeight(text: string, maxWeight: number): string[] {
  const lines: string[] = [];
  let cur = '';
  let curWeight = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const w = code > 0x00FF ? 2 : 1;
    if (curWeight + w > maxWeight && cur.length > 0) {
      lines.push(cur);
      cur = '';
      curWeight = 0;
    }
    cur += ch;
    curWeight += w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface CardData {
  fact: string;              // メインのフック句 + 結論
  category: 'psychology' | 'biology';
  size: CardSize;
}

interface CardLayout {
  width: number;
  height: number;
  factFontSize: number;
  factMaxWeight: number;     // 1 行あたりの最大重み (全角換算)
  factLineHeight: number;
  factTop: number;
  factLeft: number;
}

const LAYOUTS: Record<CardSize, CardLayout> = {
  og: {
    width: 1200,
    height: 630,
    factFontSize: 52,
    factMaxWeight: 36,    // ~18 全角文字
    factLineHeight: 78,
    factTop: 130,
    factLeft: 80,
  },
  square: {
    width: 1080,
    height: 1080,
    factFontSize: 60,
    factMaxWeight: 32,    // ~16 全角文字
    factLineHeight: 90,
    factTop: 220,
    factLeft: 90,
  },
};

const CATEGORY_LABEL: Record<CardData['category'], string> = {
  psychology: 'PSYCHOLOGY',
  biology: 'BIOLOGY',
};

function buildSvg(data: CardData): string {
  const L = LAYOUTS[data.size];
  const lines = wrapByWeight(data.fact, L.factMaxWeight).slice(0, 6); // 6 行まで
  const category = CATEGORY_LABEL[data.category];

  const factTspans = lines
    .map(
      (line, i) =>
        `<tspan x="${L.factLeft}" dy="${i === 0 ? 0 : L.factLineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  // 配色: ネイビー背景 + 白文字 (プロフィール画像と統一)
  return `<svg width="${L.width}" height="${L.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${L.width}" height="${L.height}" fill="#1a365d"/>
  <text x="${L.factLeft}" y="80" font-family="Noto Sans JP" font-weight="700" font-size="28" fill="#90b4e0" letter-spacing="4">
    ${escapeXml(category)} · PubMed Trivia
  </text>
  <text font-family="Noto Sans JP" font-weight="700" font-size="${L.factFontSize}" fill="#ffffff" y="${L.factTop}">
    ${factTspans}
  </text>
  <text x="${L.factLeft}" y="${L.height - 50}" font-family="Noto Sans JP" font-weight="700" font-size="26" fill="#90b4e0">
    sciencepubmed.net
  </text>
</svg>`;
}

export async function renderCardPng(data: CardData): Promise<Buffer> {
  const font = await loadFont();
  const svg = buildSvg(data);
  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: [font],
      loadSystemFonts: false,
      defaultFontFamily: 'Noto Sans JP',
    },
    background: '#1a365d',
  });
  return resvg.render().asPng();
}
