#!/usr/bin/env node
/**
 * PubMed 日英辞書 303語 を Kindle 向け eBook 原稿 (markdown + HTML) に 整形。
 *
 * 出力:
 *   dist/ebook/pubmed-dict-303.md    — KDP 入稿 用 原稿 (markdown)
 *   dist/ebook/pubmed-dict-303.html  — Kindle Previewer / Pandoc 入力 用 single-file HTML
 *   dist/ebook/toc.txt               — 目次 (入稿 時 の navigation 構造 確認用)
 *   dist/ebook/SALES-COPY.md         — KDP 商品説明 ドラフト
 *
 * 構成:
 *   はじめに (本書の読み方 / 注意事項)
 *   第1章 研究・統計
 *   第2章 生物学
 *   第3章 心理学
 *   第4章 看護・薬学
 *   付録A 索引 (50音順)
 *   付録B 索引 (英語 A-Z 順)
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DICT_DIR = join(ROOT, 'data', 'dict', 'entries');
const OUT_DIR = join(ROOT, 'dist', 'ebook');
mkdirSync(OUT_DIR, { recursive: true });

const entries = [];
for (const f of readdirSync(DICT_DIR)) {
  if (!f.endsWith('.json')) continue;
  try { entries.push(JSON.parse(readFileSync(join(DICT_DIR, f), 'utf-8'))); } catch {}
}
console.log(`Loaded ${entries.length} entries`);

const CAT_CHAPTERS = [
  { key: 'research',       jaLabel: '研究・統計',   enLabel: 'Research & Statistics' },
  { key: 'biology',        jaLabel: '生物学',       enLabel: 'Biology' },
  { key: 'psychology',     jaLabel: '心理学',       enLabel: 'Psychology' },
  { key: 'nursing-pharma', jaLabel: '看護・薬学',   enLabel: 'Nursing & Pharmacy' },
];

const TODAY = new Date().toISOString().slice(0, 10);

// ===== Markdown 本文 =====

const md = [];
md.push('---');
md.push('title: "PubMed 日英辞書 303語"');
md.push('subtitle: "医学・心理・看護・薬学 の 論文 を 読む ための 専門用語 リファレンス"');
md.push('author: "PubMed Trivia 編集部"');
md.push(`date: "${TODAY}"`);
md.push('lang: ja');
md.push('---');
md.push('');
md.push('# はじめに');
md.push('');
md.push('本書 は、 PubMed に 掲載 される 医学・心理学・生物学・看護学・薬学 の 論文 を');
md.push('読み書き する 際 に 頻出 する 専門用語 303語 を、 日本語 と 英語 で 対訳 形式 に');
md.push('まとめた リファレンス です。');
md.push('');
md.push('## 本書 の 特徴');
md.push('');
md.push('- **MeSH 確認済み**: 米国 国立医学図書館 の 公式 シソーラス で 裏取り した 用語 のみ 収録');
md.push('- **PubMed 掲載件数 付き**: その 用語 が 実際 どれだけ 論文 で 使われる か 分かる');
md.push('- **コピペ用 PubMed 検索クエリ**: その 場で PubMed を 検索 できる');
md.push('- **カテゴリ別 章立て**: 研究統計・生物学・心理学・看護薬学 の 4章 構成');
md.push('- **双方向 索引**: 50音順・ABC順 の 2 種類 の 索引 を 付録');
md.push('');
md.push('## 本書 の 読み方');
md.push('');
md.push('各 用語 ページ は 以下 の 構成 です:');
md.push('');
md.push('1. **用語名 (日本語 / 英語 / 略語)**');
md.push('2. **意味**: 平易 な 日本語 での 定義');
md.push('3. **論文での使われ方**: 実際 の 論文 で どう 現れる か');
md.push('4. **類義語・注意点**: 似た 用語 との 違い');
md.push('5. **MeSH Heading**: 米国 国立医学図書館 の シソーラス 見出し');
md.push('6. **PubMed 掲載件数**: 累計 の 論文 件数');
md.push('7. **コピペ用検索クエリ**: PubMed 本家 の 検索窓 に そのまま 貼り付け 可能');
md.push('');
md.push('## 更新 と お問い合わせ');
md.push('');
md.push(`本書 は ${TODAY} 時点 の データ に 基づきます。 最新 の 無料 Web 版 は`);
md.push('[sciencepubmed.net/ja/dict/](https://sciencepubmed.net/ja/dict/) で 公開 中 です。');
md.push('');
md.push('誤り・誤訳 の ご指摘 は sciencepubmedjp@gmail.com まで。');
md.push('');
md.push('---');
md.push('');

// ===== 章 =====

for (let chIdx = 0; chIdx < CAT_CHAPTERS.length; chIdx++) {
  const chap = CAT_CHAPTERS[chIdx];
  const terms = entries
    .filter(e => e.category === chap.key)
    .sort((a, b) => a.yomi.localeCompare(b.yomi, 'ja'));

  md.push(`# 第${chIdx + 1}章 ${chap.jaLabel} (${chap.enLabel})`);
  md.push('');
  md.push(`本章 では、 ${chap.jaLabel} 分野 の 用語 ${terms.length} 語 を 50音順 に 掲載 します。`);
  md.push('');

  for (const e of terms) {
    const title = `${e.ja} — ${e.en}${e.abbr ? ' / ' + e.abbr : ''}`;
    md.push(`## ${title}`);
    md.push('');
    md.push(`**読み**: ${e.yomi}`);
    md.push('');
    if (e.aliases && e.aliases.length > 0) {
      md.push(`**別表記**: ${e.aliases.join(' / ')}`);
      md.push('');
    }
    if (e.meshHeading) {
      md.push(`**MeSH**: ${e.meshHeading}${e.meshUi ? ` (${e.meshUi})` : ''}`);
      md.push('');
    }
    md.push('### 意味');
    md.push('');
    md.push(e.description.ja);
    md.push('');
    md.push('### 論文での使われ方');
    md.push('');
    md.push(e.usage.ja);
    md.push('');
    md.push('### 類義語・注意点');
    md.push('');
    md.push(e.synonyms.ja);
    md.push('');
    md.push(`**PubMed 掲載件数**: ${e.pubmedCount.toLocaleString()} 件 (累計)`);
    md.push('');
    md.push('**コピペ用 PubMed 検索クエリ**:');
    md.push('');
    md.push('```');
    md.push(e.searchQuery);
    md.push('```');
    md.push('');
    md.push('---');
    md.push('');
  }
}

// ===== 索引 =====

md.push('# 付録A 索引 (50音順)');
md.push('');
const jaSorted = [...entries].sort((a, b) => a.yomi.localeCompare(b.yomi, 'ja'));
for (const e of jaSorted) {
  md.push(`- **${e.ja}** (${e.yomi}) — ${e.en}${e.abbr ? ' / ' + e.abbr : ''} ｜ ${chapterLabelOf(e.category)}`);
}
md.push('');

md.push('# 付録B 索引 (英語 A-Z 順)');
md.push('');
const enSorted = [...entries].sort((a, b) => a.en.localeCompare(b.en));
for (const e of enSorted) {
  md.push(`- **${e.en}**${e.abbr ? ' (' + e.abbr + ')' : ''} — ${e.ja} ｜ ${chapterLabelOf(e.category)}`);
}
md.push('');

md.push('# 出典 と 免責');
md.push('');
md.push('- データ出典: PubMed (米国 国立医学図書館), MeSH Thesaurus');
md.push('- 本書 の 記述 は 一般教養 の 参考情報 です。 医療 的 判断 の 根拠 と しては 使用 しないで ください');
md.push('- 原著論文 の 解釈 は 必ず 原文 を 確認 して ください');
md.push('');
md.push(`© ${new Date().getFullYear()} PubMed Trivia 編集部. All rights reserved.`);
md.push('');

function chapterLabelOf(cat) {
  return CAT_CHAPTERS.find(c => c.key === cat)?.jaLabel || cat;
}

const mdPath = join(OUT_DIR, 'pubmed-dict-303.md');
writeFileSync(mdPath, md.join('\n'), 'utf-8');
console.log(`Wrote ${mdPath}`);

// ===== Single-file HTML (Kindle Previewer / Pandoc 入力用) =====

// simple MD → HTML (本格派 な escape は Pandoc に 任せる 想定、 ここでは minimal)
function mdToHtml(s) {
  let h = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = h.split('\n');
  const out = [];
  let inCode = false;
  for (let line of lines) {
    if (line.startsWith('```')) {
      out.push(inCode ? '</code></pre>' : '<pre><code>');
      inCode = !inCode;
      continue;
    }
    if (inCode) { out.push(line); continue; }
    if (line.startsWith('# ')) out.push('<h1>' + line.slice(2) + '</h1>');
    else if (line.startsWith('## ')) out.push('<h2>' + line.slice(3) + '</h2>');
    else if (line.startsWith('### ')) out.push('<h3>' + line.slice(4) + '</h3>');
    else if (line.startsWith('- ')) out.push('<li>' + line.slice(2) + '</li>');
    else if (line === '---') out.push('<hr>');
    else if (line === '') out.push('</p><p>');
    else out.push(line);
  }
  // bold / italic (minimal)
  let html = out.join('\n');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // wrap bare <li> runs in <ul>
  html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>PubMed 日英辞書 303語</title>
<style>
  body { font-family: "Hiragino Sans", "Noto Sans JP", sans-serif; max-width: 42em; margin: 2em auto; padding: 0 1em; line-height: 1.7; }
  h1 { border-bottom: 2px solid #333; padding-bottom: 0.3em; page-break-before: always; }
  h1:first-of-type { page-break-before: auto; }
  h2 { border-left: 4px solid #4a90e2; padding-left: 0.5em; margin-top: 2em; }
  h3 { color: #555; margin-top: 1.5em; }
  pre { background: #f4f4f4; padding: 0.7em; border-radius: 4px; overflow-x: auto; }
  code { font-size: 0.9em; }
  hr { border: none; border-top: 1px dashed #ccc; margin: 1.5em 0; }
  li { margin: 0.2em 0; }
</style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
}

const htmlPath = join(OUT_DIR, 'pubmed-dict-303.html');
writeFileSync(htmlPath, mdToHtml(md.join('\n')), 'utf-8');
console.log(`Wrote ${htmlPath}`);

// ===== TOC =====

const toc = [];
toc.push('はじめに');
for (let i = 0; i < CAT_CHAPTERS.length; i++) {
  const ch = CAT_CHAPTERS[i];
  const n = entries.filter(e => e.category === ch.key).length;
  toc.push(`第${i + 1}章 ${ch.jaLabel} (${n}語)`);
}
toc.push('付録A 索引 (50音順)');
toc.push('付録B 索引 (英語 A-Z順)');
toc.push('出典と免責');
writeFileSync(join(OUT_DIR, 'toc.txt'), toc.join('\n') + '\n', 'utf-8');

// ===== 販売 コピー =====

const sales = `# KDP 商品ページ ドラフト — PubMed 日英辞書 303語

## タイトル候補

- **メイン**: PubMed 日英辞書 — 医学・心理・看護・薬学 論文の必須303語 [MeSH確認済み/PubMed掲載件数付き]
- **サブ**: 論文で頻出する専門用語を 日本語⇔英語 で引ける 一冊

## 価格 想定

- Kindle 版: ¥500-980 (KDPセレクト登録推奨、KU読み放題対象化で ページ単価 収益)
- 70% 印税設定 (¥250以上必須)

## 商品説明 (そのままKDPに貼り付け可能)

医学・心理・看護・薬学の PubMed 論文 を 読む あなたへ。

本書 は、 PubMed に 頻出 する 専門用語 303語 を、 米国 国立医学図書館 の MeSH シソーラス で 確認 しながら、 日本語⇔英語 で 引ける リファレンス です。

**本書の特徴**

- ✅ MeSH 確認済み — 公式シソーラス で 裏取り した 用語 のみ 収録
- ✅ PubMed 掲載件数 付き — その 用語 が どれだけ 論文 で 使われる か 一目瞭然
- ✅ コピペ用 PubMed 検索クエリ — すぐ PubMed で 検索 できる
- ✅ カテゴリ別 4章 構成 — 研究統計 / 生物学 / 心理学 / 看護薬学
- ✅ 双方向 索引 — 50音順 と ABC順 両方 掲載

**対象読者**

- 医学部・薬学部・看護学部・生物系学部 の 学生
- 大学院生・ポスドク・臨床医 で 論文 を 読み 書き する 人
- TOEFL / IELTS サイエンス 分野 を 強化 したい 方
- PubMed 検索 の 効率 を 上げたい 全ての 研究者

**章構成**

- 第1章 研究・統計 (${entries.filter(e => e.category === 'research').length}語)
- 第2章 生物学 (${entries.filter(e => e.category === 'biology').length}語)
- 第3章 心理学 (${entries.filter(e => e.category === 'psychology').length}語)
- 第4章 看護・薬学 (${entries.filter(e => e.category === 'nursing-pharma').length}語)
- 付録A 索引 (50音順)
- 付録B 索引 (英語 A-Z順)

**無料 Web 版**

本書 の 内容 は [sciencepubmed.net/ja/dict/](https://sciencepubmed.net/ja/dict/) で 無料 公開 中。
オフライン で いつでも 引きたい 方 の ため に Kindle 版 を ご用意 しました。

## カテゴリ 候補

- 本 > 医学・薬学 > 医療・看護
- 本 > 医学・薬学 > 辞典
- 本 > 語学・辞事典・年鑑 > 英語

## キーワード 候補 (KDP で 7個 まで)

1. PubMed
2. 医学英語
3. 看護英語
4. MeSH
5. 論文 読み方
6. 医学 辞書
7. 研究 英語

## KDPセレクト (読み放題 KU) 登録 の 是非

**推奨: 登録する**
- KU 読者 が 1ページ 読む ごと に 約 ¥0.5-0.8 の ページ単価 収益
- 本書 は 辞典 なので 引く たび 複数 ページ 閲覧 → KU 相性 良い
- 読み放題 強制 価格 設定 無し, 単体 購入 も 可能
`;

writeFileSync(join(OUT_DIR, 'SALES-COPY.md'), sales, 'utf-8');
console.log(`Wrote ${join(OUT_DIR, 'SALES-COPY.md')}`);
console.log('\nDone. Output in dist/ebook/');
