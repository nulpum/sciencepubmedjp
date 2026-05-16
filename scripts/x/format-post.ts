// X (Twitter) 投稿フォーマッタ
//
// X の文字数制限:
//   - 280 weighted chars (無料 / Premium 加入前)
//   - 日本語・漢字・ひらがな・カタカナ = 2 weighted
//   - ASCII = 1 weighted
//   - URL は t.co で短縮 → 23 weighted 固定
//
// X Premium 加入後は 25,000 字まで投稿可能だが、本フォーマッタは
// 「無料枠でも収まる」最大公約数で設計 (Premium でも見映え◎)。

import type { Category } from '../types.js';
import type { ArticleMeta } from '../lib/select-article.js';

const SITE_URL = process.env.SITE_URL || 'https://sciencepubmed.net';
const X_LIMIT = 280;

function siteUrlFor(meta: ArticleMeta): string {
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/${meta.lang}/${meta.category}/${meta.slug}/`;
}

function categoryTags(category: Category, lang: 'ja' | 'en'): string[] {
  if (lang === 'ja') {
    return category === 'psychology'
      ? ['#豆知識', '#心理学']
      : ['#豆知識', '#生物学'];
  }
  return category === 'psychology'
    ? ['#trivia', '#psychology']
    : ['#trivia', '#biology'];
}

// X (Twitter) の重み計算
// docs: https://developer.x.com/en/docs/counting-characters
export function xWeight(text: string): number {
  // URL は t.co で 23 weighted 固定。簡易判定で http(s):// から空白までを URL とみなす
  const urlReplaced = text.replace(/https?:\/\/\S+/g, '_'.repeat(23));
  let weight = 0;
  for (const ch of urlReplaced) {
    const code = ch.codePointAt(0) ?? 0;
    // X 公式の "Weighted code-point ranges" に基づく
    if (
      (code >= 0x0000 && code <= 0x10FF) ||
      (code >= 0x2000 && code <= 0x200D) ||
      (code >= 0x2010 && code <= 0x201F) ||
      (code >= 0x2032 && code <= 0x2037)
    ) {
      weight += 1;
    } else {
      weight += 2;
    }
  }
  return weight;
}

export function formatXPost(meta: ArticleMeta): string {
  const url = siteUrlFor(meta);
  const tags = categoryTags(meta.category, meta.lang);

  // 第1案 (最も理想): fact + 1行スペース + URL + tags
  const tryShape = (factText: string, includePmid: boolean): string => {
    const lines = [factText];
    if (includePmid) {
      lines.push('', `PMID ${meta.pmid}`);
    }
    lines.push('', `▶ ${url}`);
    lines.push('', tags.join(' '));
    return lines.join('\n');
  };

  // 段階的にコンテンツを削って 280 に収める
  // (1) fact フル + PMID
  // (2) fact フル (PMID 省略)
  // (3) fact 切り詰め (PMID 省略)
  const candidates: { factText: string; includePmid: boolean }[] = [
    { factText: meta.fact, includePmid: true },
    { factText: meta.fact, includePmid: false },
  ];

  // fact を 5 char ずつ削った候補も用意
  let f = meta.fact;
  while (f.length > 20) {
    f = f.slice(0, -5);
    candidates.push({ factText: f + '…', includePmid: false });
  }

  for (const c of candidates) {
    const text = tryShape(c.factText, c.includePmid);
    if (xWeight(text) <= X_LIMIT) return text;
  }

  // ここまで来たら最低限 (URL + tags のみ)
  return [`▶ ${url}`, '', tags.join(' ')].join('\n');
}
