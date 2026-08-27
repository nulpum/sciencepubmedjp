// PubMed Lab 宣伝用の固定 1080x1080 画像を生成
// 使い方: npm run promo:lab-image
// 出力: public/promo/lab-promo.png

import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const FONT_PATH = join(process.cwd(), 'fonts', 'NotoSansJP-Bold.ttf');
const OUT_PATH = join(process.cwd(), 'public', 'promo', 'lab-promo.png');

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSvg(): string {
  const W = 1080;
  const H = 1080;

  const headline1 = '日本語で入力するだけで';
  const headline2 = 'PubMed の英語論文が探せる';
  const subline = '卒論・研究テーマ探しに';
  const brand = 'PubMed Trivia';
  const label = '🔬 NEW · PubMed Lab';
  const url = 'sciencepubmed.net/ja/lab/';

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a365d"/>
      <stop offset="1" stop-color="#0f2340"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- 上部 label -->
  <text x="90" y="140" font-family="Noto Sans JP" font-weight="700" font-size="34" fill="#fbbf24" letter-spacing="6">
    ${escapeXml(label)}
  </text>

  <!-- メインヘッドライン (2 行) -->
  <text x="90" y="320" font-family="Noto Sans JP" font-weight="700" font-size="66" fill="#ffffff">
    ${escapeXml(headline1)}
  </text>
  <text x="90" y="420" font-family="Noto Sans JP" font-weight="700" font-size="66" fill="#ffffff">
    ${escapeXml(headline2)}
  </text>

  <!-- サブライン -->
  <text x="90" y="530" font-family="Noto Sans JP" font-weight="700" font-size="42" fill="#90b4e0">
    ${escapeXml(subline)}
  </text>

  <!-- 中央のアクセント: 検索窓っぽい box -->
  <rect x="90" y="620" width="900" height="140" rx="20" fill="#ffffff" opacity="0.98"/>
  <text x="140" y="700" font-family="Noto Sans JP" font-weight="700" font-size="34" fill="#4a5568">
    大学生の睡眠不足と学業成績...
  </text>
  <rect x="820" y="660" width="130" height="60" rx="10" fill="#1a365d"/>
  <text x="850" y="702" font-family="Noto Sans JP" font-weight="700" font-size="30" fill="#ffffff">
    検索
  </text>

  <!-- 下部: URL 表示 -->
  <text x="90" y="900" font-family="Noto Sans JP" font-weight="700" font-size="28" fill="#90b4e0" letter-spacing="2">
    ${escapeXml(brand)}
  </text>
  <text x="90" y="950" font-family="Noto Sans JP" font-weight="700" font-size="40" fill="#fbbf24">
    ${escapeXml(url)}
  </text>
</svg>`;
}

async function main(): Promise<void> {
  const font = await readFile(FONT_PATH);
  const svg = buildSvg();
  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: [font],
      loadSystemFonts: false,
      defaultFontFamily: 'Noto Sans JP',
    },
    background: '#1a365d',
  });
  const png = resvg.render().asPng();
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, png);
  console.log(`✅ 生成完了: ${OUT_PATH} (${png.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
