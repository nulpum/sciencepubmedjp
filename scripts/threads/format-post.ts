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
  if (maxChars <= 0) return '';     // 0 以下は明示的に空文字 (slice(0,-1) 等のバグ回避)
  const trimmed = body.trim().replace(/\*\*/g, '');
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

  // Threads 仕様 (500 字制限):
  //   - Amazon 検索 URL は URL エンコードされた日本語キーワードで 200-260 字に膨らむ
  //   - これ 2 個入れると Threads 投稿が即 overflow → fact + body 削れて投稿が痩せる
  //   - そこで Threads 版は「📖 関連書籍は記事内 (#PR)」のラベルだけ載せて、URL は省略
  //   - ステマ規制対応の #PR タグは tags 側で必ず付与済
  //   - 実際の Amazon リンクは「🔗 詳しくは」のサイト誘導先で見せる
  const tryFull = (excerptMax: number): string => {
    const bodyLine = excerpt(meta.bodyExcerpt, excerptMax);
    const lines: string[] = [];
    lines.push(meta.fact);
    if (bodyLine) {
      lines.push('');
      lines.push(bodyLine);
    }

    if (hasAff) {
      lines.push('');
      lines.push(
        meta.lang === 'ja'
          ? '📖 関連書籍は記事内 (#PR)'
          : '📖 Related books in article (#PR)',
      );
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

  // 段階的に body を縮めて 500 字に収める
  for (const excerptMax of [200, 150, 120, 80, 40, 0] as const) {
    const text = tryFull(excerptMax);
    if (text.length <= MAX_THREADS) return text;
  }

  // ここに来るのは投稿不可能なほど長いケース (普通は起きない)
  return tryFull(0).slice(0, MAX_THREADS);
}
