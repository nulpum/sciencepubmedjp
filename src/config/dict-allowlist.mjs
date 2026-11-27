// 辞書 noindex の 個別 解除 allowlist
//
// DICT_INDEXABLE=false の 本番 ビルド でも、 ここ に 列挙 した slug だけ は
// indexable + sitemap に 載る (ja/en 両方)。
//
// 2026-11-27 GSC 3 か月 分析 で 以下 判明:
//   - 辞書 合計 8,537 impr / 0 clicks (CTR 0%)
//   - 多く が pos 6-9 (page 1 下部) に ランク 済
//   - noindex で serp snippet 弱く、 CTR 永久 ゼロ
//
// 対策: 高 impr TOP 10 slug を 先行 解除 → 2-4 週 で CTR 回復 を 観測、
// AdSense 審査 (想定 12/2) 通過 後 に DICT_INDEXABLE=true で 全解除 検討。
//
// 配列 の まま 両 側 で 使う ため plain ESM (.mjs) に 置く:
//   - src/pages/{ja,en}/dict/[slug].astro で import
//   - astro.config.mjs の sitemap filter で import

export const DICT_ALLOWLIST = [
  'habit-formation',       // en 1928 impr / pos 7.28  (ja 264 impr / pos 5.64)
  'glymphatic-system',     // en  370 impr / pos 6.52
  'morbidity',             // en  259 impr / pos 9.15
  'anchoring-effect',      // en  199 impr / pos 9.15
  'adjustment-disorder',   // en  184 impr / pos 7.14
  'incidence',             // en  151 impr / pos 7.30
  'probiotic',             // ja  203 impr / pos 7.50  (en 149 impr / pos 8.73)
  'histone-modification',  // en  128 impr / pos 57.26
  'nudge-theory',          // en  117 impr / pos 6.94
  'circadian-rhythm',      // en  112 impr / pos 8.98
];

export const DICT_ALLOWLIST_SET = new Set(DICT_ALLOWLIST);
