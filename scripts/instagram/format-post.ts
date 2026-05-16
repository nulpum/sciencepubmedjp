// Instagram キャプションのフォーマッタ
//
// 設計方針:
//   - 文字数制限 2,200 字 (キャプション) なので Facebook 並みの長さで OK
//   - URL は表示されるがクリック不可 (IG 仕様) → 「プロフィールリンクから」誘導が王道
//   - ハッシュタグは多めに (12-15 個) ... 発見性↑、IG では一般的
//   - #PR は必須 (アフィあれば末尾)

import type { ArticleMeta } from '../lib/select-article.js';
import { buildHashtags } from '../lib/hashtags.js';

function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

function excerpt(body: string, maxSentences: number): string {
  const trimmed = body.trim().replace(/\*\*/g, '');
  const sentences = trimmed.split(/(?<=[。\.\!\?])/).filter((s) => s.trim());
  return sentences.slice(0, maxSentences).join('').trim();
}

export function formatInstagramCaption(meta: ArticleMeta): string {
  const hasAff = !!meta.affiliateLinks && meta.affiliateLinks.length > 0;
  // Instagram は思い切ってタグ多め
  const tags = buildHashtags({
    lang: meta.lang,
    category: meta.category,
    count: 14,
    includePR: hasAff,
  });

  const lines: string[] = [];
  lines.push(meta.fact);
  lines.push('');
  lines.push(excerpt(meta.bodyExcerpt, 4));

  lines.push('');
  lines.push(meta.lang === 'ja' ? '🔗 詳しくは @science_pubmed のプロフィールリンクから' : '🔗 Full article via @science_pubmed bio link');

  if (hasAff) {
    lines.push('');
    lines.push(meta.lang === 'ja' ? '📖 関連書籍 (#PR)' : '📖 Related books (#PR)');
    lines.push(meta.lang === 'ja' ? '(リンクはサイト記事内から)' : '(links on the website article)');
  }

  lines.push('');
  lines.push(`📄 ${meta.lang === 'ja' ? '原典' : 'Source'}: PMID ${meta.pmid}`);
  lines.push(pubmedUrl(meta.pmid));

  // タグはまとめて末尾 (改行 1 つ空けて読みやすく)
  lines.push('');
  lines.push('.');
  lines.push('.');
  lines.push('.');
  lines.push(tags.join(' '));

  return lines.join('\n').trim();
}
