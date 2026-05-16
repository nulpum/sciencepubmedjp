// 生成済み記事 (Markdown frontmatter) を Threads 投稿 (500字制限) にフォーマット
//
// 構造:
//   1. fact (フック句込みの結論文)
//   2. 本文要約 (1-2行)
//   3. 関連書籍 (アフィあれば)
//   4. サイト URL
//   5. PMID
//   6. ハッシュタグ
//
// 500字オーバー時は本文要約を短縮 → それでもオーバーなら関連書籍を1冊に減らす。

import type { Category } from '../types.js';
import type { ArticleMeta } from '../lib/select-article.js';
import { buildHashtags } from '../lib/hashtags.js';

const SITE_URL = process.env.SITE_URL || 'https://sciencepubmed.net';
const MAX_THREADS = 500;

function siteUrlFor(meta: ArticleMeta): string {
  // SITE_URL の末尾スラッシュ揃え
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/${meta.lang}/${meta.category}/${meta.slug}/`;
}

function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

// Threads はタグ詰めすぎるとスパム判定気味 → 3 個まで
function categoryHashtags(category: Category, lang: 'ja' | 'en', hasAffiliate: boolean): string[] {
  return buildHashtags({ lang, category, count: 3, includePR: hasAffiliate });
}

// 本文要約 (Markdown の最初の文を 1 つ取る、簡易)
function excerpt(body: string, maxChars: number): string {
  const trimmed = body.trim().replace(/\*\*/g, '');
  // 最初のピリオド/。 で切る
  const firstSentence = trimmed.split(/(?<=[。\.\!\?])/)[0] ?? trimmed;
  if (firstSentence.length <= maxChars) return firstSentence;
  return trimmed.slice(0, maxChars - 1) + '…';
}

interface FormatOptions {
  includeAffiliate: boolean; // false にすればアフィ無し版
}

export function formatThreadsPost(
  meta: ArticleMeta,
  options: FormatOptions = { includeAffiliate: true },
): string {
  const url = siteUrlFor(meta);
  const hasAff = options.includeAffiliate && !!meta.affiliateLinks && meta.affiliateLinks.length > 0;
  const tags = categoryHashtags(meta.category, meta.lang, hasAff);

  // === 第1案: アフィ込み (最も理想的) ===
  const tryFull = (excerptMax: number, affCount: number): string => {
    const bodyLine = excerpt(meta.bodyExcerpt, excerptMax);
    const lines: string[] = [];
    lines.push(meta.fact);
    lines.push('');
    if (bodyLine) lines.push(bodyLine);

    if (options.includeAffiliate && meta.affiliateLinks && affCount > 0) {
      lines.push('');
      lines.push(meta.lang === 'ja' ? '📖 関連書籍 (#PR)' : '📖 Related books (#PR)');
      const affs = meta.affiliateLinks.slice(0, affCount);
      for (const a of affs) {
        // Threads 内では URL は短縮されないのでそのまま貼る
        lines.push(`▶ ${a.url}`);
      }
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

  // 段階的に縮めて 500 字に収める
  for (const [excerptMax, affCount] of [
    [120, 2],
    [80, 2],
    [60, 1],
    [40, 1],
    [0, 1],
    [0, 0],
  ] as const) {
    const text = tryFull(excerptMax, affCount);
    if (text.length <= MAX_THREADS) return text;
  }

  // ここに来るのは投稿不可能なほど長いケース (普通は起きない)
  return tryFull(0, 0).slice(0, MAX_THREADS);
}
