// Facebook Page 投稿のフォーマッタ
//
// Threads と違い、文字数制限が実質ない (63,206 字) ので
// 本文を Threads より長めに。link 引数を別途渡せるので、本文中に
// サイト URL を埋めなくても OGP プレビューが自動で付く。
//
// 構造:
//   1. fact (フック句込み)
//   2. 本文要約 2-3 文
//   3. 関連書籍 (#PR)
//   4. 原典 PMID + URL
//   5. ハッシュタグ
//   (link は別途 API 引数で渡す → カードプレビュー)

import type { Category } from '../types.js';
import type { ArticleMeta } from '../lib/select-article.js';

const SITE_URL = process.env.SITE_URL || 'https://sciencepubmed.net';

function siteUrlFor(meta: ArticleMeta): string {
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/${meta.lang}/${meta.category}/${meta.slug}/`;
}

function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

function categoryHashtags(category: Category, lang: 'ja' | 'en'): string[] {
  if (lang === 'ja') {
    return category === 'psychology'
      ? ['#豆知識', '#心理学']
      : ['#豆知識', '#生物学'];
  }
  return category === 'psychology'
    ? ['#trivia', '#psychology']
    : ['#trivia', '#biology'];
}

// 本文要約 (Markdown の最初の N 文)
function excerpt(body: string, maxSentences: number): string {
  const trimmed = body.trim().replace(/\*\*/g, '');
  const sentences = trimmed.split(/(?<=[。\.\!\?])/).filter((s) => s.trim());
  return sentences.slice(0, maxSentences).join('').trim();
}

export interface FacebookPost {
  message: string;
  link: string;
}

export function formatFacebookPost(meta: ArticleMeta): FacebookPost {
  const link = siteUrlFor(meta);
  const tags = categoryHashtags(meta.category, meta.lang);

  const lines: string[] = [];
  lines.push(meta.fact);
  lines.push('');
  lines.push(excerpt(meta.bodyExcerpt, 3));

  if (meta.affiliateLinks && meta.affiliateLinks.length > 0) {
    lines.push('');
    lines.push(meta.lang === 'ja' ? '📖 関連書籍 (#PR)' : '📖 Related books (#PR)');
    for (const a of meta.affiliateLinks.slice(0, 2)) {
      lines.push(`▶ ${a.title}`);
      lines.push(`   ${a.url}`);
    }
    tags.push('#PR');
  }

  lines.push('');
  lines.push(`📄 ${meta.lang === 'ja' ? '原典' : 'Source'}: PMID ${meta.pmid}`);
  lines.push(pubmedUrl(meta.pmid));
  lines.push('');
  lines.push(tags.join(' '));

  return {
    message: lines.join('\n').trim(),
    link, // Facebook が auto-preview でカード化
  };
}
