// 本記事 markdown の 本文 中 の 辞書用語 を /{lang}/dict/{slug}/ リンク に 自動 変換 する
// remark plugin。build 時 に 一度 だけ dict entries を 読み込み、各 .md の text ノード を
// 走査 して 初出 N 件 だけ リンク化 する (link soup 回避)。
//
// 設計方針:
//   - Link / inlineCode / code 内 の text は 無視
//   - 同じ用語 slug は ページ内 で 1 回 だけ リンク化 (dedup)
//   - 長い 用語 優先 ("cognitive behavioral therapy" > "therapy")
//   - 大文字/小文字 無視、 表示は 原文 の まま
//   - リンク化 は 1 ページ あたり MAX_LINKS 件 まで
//
// 使い方: astro.config.mjs の markdown.remarkPlugins に 追加

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit, SKIP } from 'unist-util-visit';

const MAX_LINKS_PER_PAGE = 6;
const MIN_TERM_LENGTH = 3; // "or" 等 を 弾く

function loadDictTerms() {
  const dir = join(process.cwd(), 'data', 'dict', 'entries');
  let files = [];
  try { files = readdirSync(dir); } catch { return { ja: [], en: [] }; }
  const ja = [];
  const en = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const e = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      if (e.ja && e.ja.length >= MIN_TERM_LENGTH) {
        ja.push({ key: e.ja, keyLower: e.ja.toLowerCase(), slug: e.slug });
      }
      // 日本語 ページ でも 英語 用語 (abbr/en) は 本文 中 に 出 やすい
      if (e.en && e.en.length >= MIN_TERM_LENGTH) {
        en.push({ key: e.en, keyLower: e.en.toLowerCase(), slug: e.slug });
        ja.push({ key: e.en, keyLower: e.en.toLowerCase(), slug: e.slug });
      }
      if (e.abbr && e.abbr.length >= 2) {
        en.push({ key: e.abbr, keyLower: e.abbr.toLowerCase(), slug: e.slug });
        ja.push({ key: e.abbr, keyLower: e.abbr.toLowerCase(), slug: e.slug });
      }
    } catch {}
  }
  // 長い 用語 優先
  const byLen = (a, b) => b.key.length - a.key.length;
  ja.sort(byLen); en.sort(byLen);
  return { ja, en };
}

let CACHE = null;
function getDict() {
  if (!CACHE) CACHE = loadDictTerms();
  return CACHE;
}

function detectLang(filePath) {
  if (!filePath) return null;
  const norm = filePath.replace(/\\/g, '/');
  if (norm.includes('/src/content/en/')) return 'en';
  if (norm.includes('/src/content/ja/')) return 'ja';
  return null;
}

function wordBoundaryOK(value, start, end, lang) {
  // 英語 のみ word boundary 検査 (日本語 は 漢字/かな 隣接 OK)
  if (lang !== 'en') return true;
  const before = start > 0 ? value[start - 1] : ' ';
  const after = end < value.length ? value[end] : ' ';
  const wordChar = /[A-Za-z0-9]/;
  return !wordChar.test(before) && !wordChar.test(after);
}

export function remarkDictLinks() {
  return (tree, file) => {
    const lang = detectLang(file?.path || file?.history?.[0]);
    if (!lang) return;
    const terms = getDict()[lang];
    if (!terms.length) return;

    const linkedSlugs = new Set();
    let linksAdded = 0;

    visit(tree, 'text', (node, idx, parent) => {
      if (linksAdded >= MAX_LINKS_PER_PAGE) return SKIP;
      if (!parent || idx == null) return;
      // link / code / inlineCode 内 は 触らない
      if (['link', 'linkReference', 'inlineCode', 'code', 'html'].includes(parent.type)) return;
      // heading 内 も 避ける (SEO 的 に h2/h3 内 リンク は 過剰)
      if (parent.type === 'heading') return;

      const value = node.value;
      if (!value || value.length < MIN_TERM_LENGTH) return;
      const valueLower = value.toLowerCase();

      let best = null;
      for (const t of terms) {
        if (linkedSlugs.has(t.slug)) continue;
        const i = valueLower.indexOf(t.keyLower);
        if (i === -1) continue;
        const end = i + t.keyLower.length;
        if (!wordBoundaryOK(value, i, end, lang)) continue;
        if (!best || i < best.start || (i === best.start && t.keyLower.length > best.matchLen)) {
          best = { slug: t.slug, start: i, matchLen: t.keyLower.length };
        }
      }
      if (!best) return;

      const before = value.slice(0, best.start);
      const match = value.slice(best.start, best.start + best.matchLen);
      const after = value.slice(best.start + best.matchLen);
      const newNodes = [];
      if (before) newNodes.push({ type: 'text', value: before });
      newNodes.push({
        type: 'link',
        url: `/${lang}/dict/${best.slug}/`,
        title: null,
        data: { hProperties: { class: 'dict-autolink' } },
        children: [{ type: 'text', value: match }],
      });
      if (after) newNodes.push({ type: 'text', value: after });
      parent.children.splice(idx, 1, ...newNodes);
      linkedSlugs.add(best.slug);
      linksAdded++;
      return [SKIP, idx + newNodes.length];
    });
  };
}

export default remarkDictLinks;
