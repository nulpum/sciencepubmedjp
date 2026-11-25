#!/usr/bin/env node
/**
 * PubMed 日英辞書 303語 を Anki 向け TSV に 変換 する。
 *
 * 出力:
 *   - dist/anki/pubmed-dict-303.tsv (Anki File → Import で 取り込み)
 *   - dist/anki/README.md (インポート手順 + 販売 ページ 用 説明)
 *
 * カード 設計 (1語 につき 2 枚, 計 606枚):
 *   Type A: EN → JA  (front: 英語用語 / back: 日本語 + 意味 + 使い方 + PubMed件数)
 *   Type B: JA → EN  (front: 日本語用語 / back: 英語 + 意味 + MeSH + 検索クエリ)
 *
 * タグ: category / 略語の有無 / MeSH検証済み
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DICT_DIR = join(ROOT, 'data', 'dict', 'entries');
const OUT_DIR = join(ROOT, 'dist', 'anki');

mkdirSync(OUT_DIR, { recursive: true });

const entries = [];
for (const f of readdirSync(DICT_DIR)) {
  if (!f.endsWith('.json')) continue;
  try {
    entries.push(JSON.parse(readFileSync(join(DICT_DIR, f), 'utf-8')));
  } catch {}
}
console.log(`Loaded ${entries.length} entries`);

// TSV escape: tab → space、 改行 → <br>、 " → &quot;
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('\t', ' ')
    .replaceAll('\n', '<br>')
    .replaceAll('\r', '')
    .trim();
}

const CAT_LABELS_JA = {
  research: '研究・統計',
  biology: '生物学',
  psychology: '心理学',
  'nursing-pharma': '看護・薬学',
};

// Anki は TSV の 1行 = 1枚 のカード。 列 の 意味 は Anki 側 の note type で 定義。
// 推奨 note type: Basic (Front / Back / Tags)
// ここでは Front, Back, Tags の 3列 で 出力。
const rows = ['Front\tBack\tTags'];

for (const e of entries) {
  const tags = [
    `cat::${e.category}`,
    e.abbr ? 'has_abbr' : 'no_abbr',
    e.meshHeading ? 'mesh_verified' : 'no_mesh',
  ].join(' ');

  // Type A: EN → JA
  const frontA = `<div style="font-size:1.4em;font-weight:700">${esc(e.en)}</div>`
    + (e.abbr ? `<div style="color:#888;font-size:0.9em;margin-top:0.3em">(${esc(e.abbr)})</div>` : '');
  const backA = `
    <div style="font-size:1.2em;font-weight:700;color:#1a73e8">${esc(e.ja)}</div>
    <div style="color:#666;font-size:0.9em;margin-top:0.2em">(${esc(e.yomi)})</div>
    <hr style="margin:0.6em 0;border:none;border-top:1px solid #ddd">
    <div style="font-size:0.95em;line-height:1.6">${esc(e.description.ja)}</div>
    <div style="margin-top:0.5em;font-size:0.82em;color:#555"><b>使い方:</b> ${esc(e.usage.ja)}</div>
    ${e.meshHeading ? `<div style="margin-top:0.4em;font-size:0.78em;color:#888"><b>MeSH:</b> ${esc(e.meshHeading)}</div>` : ''}
    <div style="margin-top:0.4em;font-size:0.78em;color:#888"><b>PubMed掲載:</b> ${e.pubmedCount.toLocaleString()}件</div>
    <div style="margin-top:0.3em;font-size:0.75em;color:#aaa">${esc(CAT_LABELS_JA[e.category] || e.category)}</div>
  `;
  rows.push([esc(frontA), esc(backA.replace(/\n\s+/g, '')), `${tags} direction::en_to_ja`].join('\t'));

  // Type B: JA → EN
  const frontB = `<div style="font-size:1.4em;font-weight:700">${esc(e.ja)}</div>`
    + `<div style="color:#888;font-size:0.9em;margin-top:0.3em">(${esc(e.yomi)})</div>`;
  const backB = `
    <div style="font-size:1.2em;font-weight:700;color:#1a73e8">${esc(e.en)}</div>
    ${e.abbr ? `<div style="color:#888;font-size:0.9em;margin-top:0.2em">(${esc(e.abbr)})</div>` : ''}
    <hr style="margin:0.6em 0;border:none;border-top:1px solid #ddd">
    <div style="font-size:0.95em;line-height:1.6">${esc(e.description.ja)}</div>
    ${e.meshHeading ? `<div style="margin-top:0.4em;font-size:0.78em;color:#888"><b>MeSH:</b> ${esc(e.meshHeading)}</div>` : ''}
    <div style="margin-top:0.4em;font-size:0.78em;color:#555"><b>PubMed検索クエリ:</b> <code>${esc(e.searchQuery)}</code></div>
    <div style="margin-top:0.4em;font-size:0.78em;color:#888">掲載 ${e.pubmedCount.toLocaleString()}件</div>
    <div style="margin-top:0.3em;font-size:0.75em;color:#aaa">${esc(CAT_LABELS_JA[e.category] || e.category)}</div>
  `;
  rows.push([esc(frontB), esc(backB.replace(/\n\s+/g, '')), `${tags} direction::ja_to_en`].join('\t'));
}

const tsvPath = join(OUT_DIR, 'pubmed-dict-303.tsv');
writeFileSync(tsvPath, rows.join('\n') + '\n', 'utf-8');
console.log(`Wrote ${tsvPath} (${rows.length - 1} cards)`);

// 購入後 README
const readme = `# PubMed 日英辞書 303語 Anki デッキ

## このパッケージの内容

- **pubmed-dict-303.tsv** — Anki 向けタブ区切りファイル (${rows.length - 1}枚のカード)
- 1用語あたり 2枚: 英語→日本語、日本語→英語 (双方向学習)
- 全カードに カテゴリタグ (研究・生物学・心理学・看護薬学)・MeSH確認済みフラグ付き

## カード内容

各カード裏面に:
- 用語の意味 (日本語解説)
- 論文での使われ方
- MeSH Heading (医学用語シソーラス)
- PubMed 掲載論文数
- コピペ用 PubMed 検索クエリ

## Anki への インポート手順

1. Anki を 起動 ([https://apps.ankiweb.net/](https://apps.ankiweb.net/) で 無料 ダウンロード)
2. メニュー \`File\` → \`Import\` を 選択
3. \`pubmed-dict-303.tsv\` を 選択
4. "Type" は \`Basic\` を 選択
5. "Field separator" は \`Tab\` を 確認
6. "Allow HTML in fields" に チェック (重要)
7. \`Import\` を クリック

## 対象読者

- 医学部・薬学部・看護学部・生物系学部 の 学生
- PubMed で 論文を 読む 研究者・大学院生・臨床医
- TOEFL / IELTS で サイエンス 分野 を 強化 したい 方

## 出典

PubMed (米国国立医学図書館) の 公開データ を もとに、 PubMed Trivia 編集部 が
MeSH Heading を 確認 しながら 日本語訳・解説 を 作成 しました。

Web 版 辞書 (無料): [https://sciencepubmed.net/ja/dict/](https://sciencepubmed.net/ja/dict/)

## 更新

本デッキ は PubMed Trivia (${new Date().toISOString().slice(0, 10)} 時点) の 辞書データ に基づきます。
最新版 は 定期的 に 更新 予定 (購入者 は 次バージョン を 無料 で 受け取れます)。
`;

const readmePath = join(OUT_DIR, 'README.md');
writeFileSync(readmePath, readme, 'utf-8');
console.log(`Wrote ${readmePath}`);

// 販売ページ (BOOTH/Gumroad) 用 説明文 (別ファイル)
const salesCopy = `# PubMed 日英辞書 Anki デッキ 606枚 (303語×双方向)

医学・心理・看護・薬学 の PubMed 論文 を 読む ための 専門用語 303語 を、
日本語⇔英語 の 双方向 で 定着 させる Anki デッキ です。

## 他の 単語帳 と 違う 点

✅ **MeSH 確認済み** — 米国 国立医学図書館 の 公式 シソーラス で 裏取り
✅ **PubMed 掲載件数 付き** — その 用語 が 実際 どれだけ 論文 で 使われる か 分かる
✅ **コピペ用 PubMed 検索クエリ** — その 場で PubMed を 検索 できる
✅ **カテゴリタグ 分類** — 研究統計 / 生物学 / 心理学 / 看護薬学 で フィルタ 可能
✅ **英→日 と 日→英 の 両方向** — Receptive と Productive 両方 強化

## 対象

- 医学部・薬学部・看護学部・生物系学部 の 学生
- 大学院生・ポスドク・臨床医 で 論文 を 読み 書き する 人
- TOEFL / IELTS サイエンス パート 対策

## 内容

- 606 枚 の Basic カード (303用語 × 双方向)
- タブ 区切り TSV ファイル (Anki File → Import で 取り込み)
- README.md (インポート手順)
- 元データ: [sciencepubmed.net](https://sciencepubmed.net/ja/dict/) の 無料 Web 辞書
`;
writeFileSync(join(OUT_DIR, 'SALES-COPY.md'), salesCopy, 'utf-8');
console.log(`Wrote ${join(OUT_DIR, 'SALES-COPY.md')}`);

console.log('\nDone. Output in dist/anki/');
