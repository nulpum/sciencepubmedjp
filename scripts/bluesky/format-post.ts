// 生成済み記事を Bluesky 投稿 (300 grapheme 制限) にフォーマット
//
// Threads 版 (500字) より タイトな 300 chars。
// 構造:
//   1. fact
//   2. 本文要約 (可能な範囲で)
//   3. サイト URL
//   4. PMID
//   5. ハッシュタグ (2-3 個)

import type { Category } from '../types.js';
import type { ArticleMeta } from '../lib/select-article.js';
import { buildHashtags } from '../lib/hashtags.js';

const SITE_URL = process.env.SITE_URL || 'https://sciencepubmed.net';
const MAX_BLUESKY = 300;

function siteUrlFor(meta: ArticleMeta): string {
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/${meta.lang}/${meta.category}/${meta.slug}/`;
}

function categoryHashtags(category: Category, lang: 'ja' | 'en', hasAffiliate: boolean): string[] {
  return buildHashtags({ lang, category, count: 2, includePR: hasAffiliate });
}

function excerpt(body: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  const trimmed = body.trim().replace(/\*\*/g, '');
  const firstSentence = trimmed.split(/(?<=[。\.\!\?])/)[0] ?? trimmed;
  if (firstSentence.length <= maxChars) return firstSentence;
  return trimmed.slice(0, maxChars - 1) + '…';
}

interface FormatOptions {
  includeAffiliate: boolean;
}

export function formatBlueskyPost(
  meta: ArticleMeta,
  options: FormatOptions = { includeAffiliate: true },
): string {
  const url = siteUrlFor(meta);
  const hasAff = options.includeAffiliate && !!meta.affiliateLinks && meta.affiliateLinks.length > 0;
  const tags = categoryHashtags(meta.category, meta.lang, hasAff);

  const tryFull = (excerptMax: number): string => {
    const bodyLine = excerpt(meta.bodyExcerpt, excerptMax);
    const lines: string[] = [];
    lines.push(meta.fact);
    if (bodyLine) {
      lines.push('');
      lines.push(bodyLine);
    }
    lines.push('');
    lines.push(meta.lang === 'ja' ? '🔗 詳しくは' : '🔗 Read more');
    lines.push(url);
    lines.push('');
    lines.push(`📄 PMID ${meta.pmid}`);
    lines.push('');
    lines.push(tags.join(' '));
    return lines.join('\n').trim();
  };

  for (const excerptMax of [150, 100, 60, 30, 0] as const) {
    const text = tryFull(excerptMax);
    if ([...text].length <= MAX_BLUESKY) return text;
  }

  return tryFull(0).slice(0, MAX_BLUESKY);
}
