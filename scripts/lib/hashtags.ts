// プラットフォーム横断のハッシュタグプール
//
// SNS ごとの慣習:
//   - X / Threads / Facebook: 3-4 個が無難 (多いとスパム判定)
//   - Instagram: 10-15 個 OK (発見性↑、IG では一般的)
//
// カテゴリと言語ごとに用意。

import type { Category } from '../types.js';

type Lang = 'ja' | 'en';

// 共通 (どの記事にも付ける基本タグ)
const BASE: Record<Lang, string[]> = {
  ja: ['#豆知識', '#研究', '#科学'],
  en: ['#trivia', '#research', '#science'],
};

// カテゴリ別タグ
const CATEGORY: Record<Lang, Record<Category, string[]>> = {
  ja: {
    psychology: [
      '#心理学', '#脳科学', '#認知科学', '#行動経済学',
      '#自己啓発', '#学び', '#睡眠', '#記憶',
    ],
    biology: [
      '#生物学', '#進化生物学', '#動物行動学', '#生態学',
      '#人類学', '#微生物', '#自然', '#生命',
    ],
  },
  en: {
    psychology: [
      '#psychology', '#neuroscience', '#cognitive', '#behavioral',
      '#sleep', '#memory', '#mindfulness',
    ],
    biology: [
      '#biology', '#evolution', '#ecology', '#anthropology',
      '#microbiome', '#animals', '#nature',
    ],
  },
};

// ブランド/出典タグ (時々付ける)
const SOURCE: Record<Lang, string[]> = {
  ja: ['#PubMed', '#論文'],
  en: ['#PubMed', '#openaccess'],
};

export interface BuildHashtagsOptions {
  lang: Lang;
  category: Category;
  count: number;       // 何個欲しいか (上限)
  includePR?: boolean; // アフィあるなら true
}

// 重複なしで count 個までタグを組み立てる
// 必ず BASE 1 つ + カテゴリ 1 つから始め、残りはカテゴリプールを埋め、
// その後 SOURCE + 残り BASE を順次足す。
export function buildHashtags(opts: BuildHashtagsOptions): string[] {
  const { lang, category, count, includePR } = opts;
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (tag: string): boolean => {
    if (seen.has(tag) || out.length >= count) return false;
    seen.add(tag);
    out.push(tag);
    return true;
  };

  // 1) 最初の基本タグ
  push(BASE[lang][0]);
  // 2) 主カテゴリタグ
  push(CATEGORY[lang][category][0]);
  // 3) カテゴリプール残り
  for (const t of CATEGORY[lang][category].slice(1)) push(t);
  // 4) 出典タグ
  for (const t of SOURCE[lang]) push(t);
  // 5) BASE 残り
  for (const t of BASE[lang].slice(1)) push(t);

  // PR は最後に必ず (規制対応で常に末尾)
  if (includePR && out.length < count) {
    push('#PR');
  } else if (includePR) {
    // count いっぱいでも PR は捻じ込む (規制優先)
    out.pop();
    out.push('#PR');
  }

  return out;
}
