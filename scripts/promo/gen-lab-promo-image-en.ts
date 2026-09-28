// PubMed Lab 宣伝用 EN 版 の 固定 1080x1080 画像を生成
// 使い方: npm run promo:lab-image-en
// 出力: public/promo/lab-promo-en.png
//
// EN Instagram 投稿など、EN caption と 一致する 画像を 用意するため。

import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

// Noto Sans JP は Latin 文字も 収録済みなので EN でも 使用可
const FONT_PATH = join(process.cwd(), 'fonts', 'NotoSansJP-Bold.ttf');
const OUT_PATH = join(process.cwd(), 'public', 'promo', 'lab-promo-en.png');

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

  const label = 'NEW · PubMed Lab · Free';
  const headline1 = 'Turn your ChatGPT / Claude / Gemini';
  const headline2 = 'into a PubMed paper-chat assistant';
  const subline = 'Free master prompt — copy · paste · unlimited';
  const brand = 'PubMed Trivia';
  const url = 'sciencepubmed.net/en/lab/toolkit/';

  const bulletY = 660;
  const bullets = [
    'Extract key findings',
    'Check sample size & statistics',
    'Suggest thesis-scale follow-ups',
    'Draft APA citation phrasing',
  ];

  const bulletsSvg = bullets.map((b, i) => {
    const y = bulletY + i * 55;
    return `  <text x="130" y="${y}" font-family="Noto Sans JP" font-weight="700" font-size="30" fill="#e2e8f0">\n    ✓ ${escapeXml(b)}\n  </text>`;
  }).join('\n');

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a365d"/>
      <stop offset="1" stop-color="#0f2340"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- 上部 label -->
  <text x="90" y="140" font-family="Noto Sans JP" font-weight="700" font-size="30" fill="#fbbf24" letter-spacing="5">
    🔬 ${escapeXml(label)}
  </text>

  <!-- メインヘッドライン (2 行) -->
  <text x="90" y="290" font-family="Noto Sans JP" font-weight="700" font-size="52" fill="#ffffff">
    ${escapeXml(headline1)}
  </text>
  <text x="90" y="360" font-family="Noto Sans JP" font-weight="700" font-size="52" fill="#ffffff">
    ${escapeXml(headline2)}
  </text>

  <!-- サブライン -->
  <text x="90" y="440" font-family="Noto Sans JP" font-weight="700" font-size="30" fill="#90b4e0">
    ${escapeXml(subline)}
  </text>

  <!-- 中央のアクセント: 特徴 リスト box -->
  <rect x="90" y="600" width="900" height="290" rx="20" fill="#ffffff" opacity="0.08"/>
  <text x="130" y="640" font-family="Noto Sans JP" font-weight="700" font-size="26" fill="#fbbf24" letter-spacing="2">
    WHAT IT DOES
  </text>
${bulletsSvg}

  <!-- 下部: brand + URL -->
  <text x="90" y="960" font-family="Noto Sans JP" font-weight="700" font-size="24" fill="#90b4e0" letter-spacing="3">
    ${escapeXml(brand)}
  </text>
  <text x="90" y="1010" font-family="Noto Sans JP" font-weight="700" font-size="34" fill="#fbbf24">
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
