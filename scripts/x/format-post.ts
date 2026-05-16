// X (Twitter) Premium 想定の長文フォーマッタ
//
// X Premium Basic 加入で 25,000 字まで投稿可能のため、Facebook と同様の
// 詳細フォーマットを生成する。URL は省略せず full で。
//
// 構造 (Facebook と並列):
//   1. fact (フック句込みの結論)
//   2. 本文要約 2-3 文
//   3. 関連書籍 + アフィリエイト URL (#PR)
//   4. サイト URL (auto-card 化される)
//   5. 原典 PMID + URL
//   6. ハッシュタグ

import type { Category } from '../types.js';
import type { ArticleMeta } from '../lib/select-article.js';
import { buildHashtags } from '../lib/hashtags.js';

const SITE_URL = process.env.SITE_URL || 'https://sciencepubmed.net';

function siteUrlFor(meta: ArticleMeta): string {
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/${meta.lang}/${meta.category}/${meta.slug}/`;
}

function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

// X: 3-4 個程度 (#PR 必要なら自動で末尾に)
function categoryTags(category: Category, lang: 'ja' | 'en', hasAffiliate: boolean): string[] {
  return buildHashtags({ lang, category, count: 4, includePR: hasAffiliate });
}

function excerpt(body: string, maxSentences: number): string {
  const trimmed = body.trim().replace(/\*\*/g, '');
  const sentences = trimmed.split(/(?<=[。\.\!\?])/).filter((s) => s.trim());
  return sentences.slice(0, maxSentences).join('').trim();
}

// 参考: 重み計算 (X Premium でも overflow チェック用に残す)
// docs: https://developer.x.com/en/docs/counting-characters
export function xWeight(text: string): number {
  const urlReplaced = text.replace(/https?:\/\/\S+/g, '_'.repeat(23));
  let weight = 0;
  for (const ch of urlReplaced) {
    const code = ch.codePointAt(0) ?? 0;
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
  const link = siteUrlFor(meta);
  const hasAff = !!meta.affiliateLinks && meta.affiliateLinks.length > 0;
  const tags = categoryTags(meta.category, meta.lang, hasAff);

  const lines: string[] = [];
  // 1. fact (フック句)
  lines.push(meta.fact);
  // 2. 本文要約 (3文)
  lines.push('');
  lines.push(excerpt(meta.bodyExcerpt, 3));

  // 3. 関連書籍 + アフィ URL
  if (meta.affiliateLinks && meta.affiliateLinks.length > 0) {
    lines.push('');
    lines.push(meta.lang === 'ja' ? '📖 関連書籍 (#PR)' : '📖 Related books (#PR)');
    for (const a of meta.affiliateLinks.slice(0, 2)) {
      lines.push(`▶ ${a.title}`);
      lines.push(`   ${a.url}`);
    }
  }

  // 4. サイト URL (X が auto-card 化するはず)
  lines.push('');
  lines.push(meta.lang === 'ja' ? '🔗 詳しくは' : '🔗 Read more');
  lines.push(link);

  // 5. 原典 PMID + URL
  lines.push('');
  lines.push(`📄 ${meta.lang === 'ja' ? '原典' : 'Source'}: PMID ${meta.pmid}`);
  lines.push(pubmedUrl(meta.pmid));

  // 6. ハッシュタグ
  lines.push('');
  lines.push(tags.join(' '));

  return lines.join('\n').trim();
}
