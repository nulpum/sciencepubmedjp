// 記事(PubmedArticle)から関連書籍候補を構築する。
//
// 動作モード:
// 1. PA-API キーがあり、PA-API が成功した場合 → 実書籍 N 冊を返す
// 2. PA-API キーが無い or 失敗 → Amazon 検索 URL フォールバックを返す
//
// フォールバック理由:
// - 新規アソシエイトは「過去30日に10販売」まで PA-API アクセス不可
// - その間も収益動線は維持したい
// - Amazon 検索結果 URL は tag= パラメータ付きで遷移すれば 24h アフィリエイト Cookie が立つ
//
// 設計方針:
// - SearchIndex='Books' でハードに絞る（サプリ等の禁止カテゴリは入らない）
// - 書籍タイトルに「ダイエット/痩せ/サプリ」等が混じったら NG ワードで弾く

import type { Category, Lang, PubmedArticle } from '../types.js';
import { searchItems, type PaApiItem } from './pa-api.js';
import { Logger } from '../lib/logger.js';

// 書籍タイトルの NG パターン (薬機法・ジャンル制限)
const BOOK_TITLE_NG_PATTERNS: RegExp[] = [
  /痩せ/,
  /ダイエット/,
  /[０-９0-9]+\s*kg/i,
  /サプリ/,
  /医薬品/,
  /処方/,
  /必ず治る/,
  /絶対に治る/,
  /奇跡の/,
  /ガンが消える/,
  /がんが消える/,
];

function isAllowedBookTitle(title: string): boolean {
  return !BOOK_TITLE_NG_PATTERNS.some((re) => re.test(title));
}

// 論文タイトルから検索キーワードを抽出
// 単純にタイトル中の名詞っぽい英単語を上位 N 個ピック。
// PubMed のタイトルは英語だが、Amazon JP の検索でも英単語ヒットする (洋書 + 翻訳書)。
export function extractKeywords(article: PubmedArticle): string {
  const STOP = new Set([
    'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'for', 'to', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'as', 'at', 'by', 'from', 'into', 'this', 'that', 'these', 'those',
    'review', 'systematic', 'meta', 'analysis', 'study', 'studies',  // PubMed 頻出ノイズ
  ]);
  const words = article.title
    .toLowerCase()
    .replace(/[():,.;!?'"]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  return words.slice(0, 6).join(' ');
}

export interface SelectedBook {
  title: string;
  url: string;
}

function partnerTag(): string {
  return process.env.AMAZON_PARTNER_TAG || 'sciencepubmed-22';
}

// Amazon 検索結果ページの URL を組む。tag 付きでアクセスすれば affiliate 有効。
export function buildSearchUrl(keywords: string): string {
  const enc = encodeURIComponent(keywords);
  return `https://www.amazon.co.jp/s?k=${enc}&tag=${partnerTag()}&i=stripbooks`;
}

// カテゴリごとの広めキーワード (フォールバック 2 つ目のリンク用)
const CATEGORY_BROAD_KEYWORDS: Record<Category, string> = {
  psychology: '心理学 認知科学 行動経済',
  biology: '進化生物学 動物行動 生態学',
};
const CATEGORY_LABEL_JA: Record<Category, string> = {
  psychology: '心理学',
  biology: '生物学',
};

// PA-API が使えない / 失敗した時の URL ベースフォールバック
function buildFallbackLinks(
  category: Category,
  keywords: string,
  lang: Lang,
): SelectedBook[] {
  const broad = CATEGORY_BROAD_KEYWORDS[category];
  if (lang === 'ja') {
    return [
      {
        title: `この記事のテーマに関連する書籍 (Amazon)`,
        url: buildSearchUrl(keywords),
      },
      {
        title: `${CATEGORY_LABEL_JA[category]}の関連書籍 (Amazon)`,
        url: buildSearchUrl(broad),
      },
    ];
  }
  return [
    {
      title: `Related books on this topic (Amazon JP)`,
      url: buildSearchUrl(keywords),
    },
    {
      title: `More ${category} books (Amazon JP)`,
      url: buildSearchUrl(broad),
    },
  ];
}

export async function selectRelatedBooks(
  article: PubmedArticle,
  category: Category,
  count = 2,
  lang: Lang = 'ja',
): Promise<SelectedBook[]> {
  const keywords = extractKeywords(article);
  if (!keywords) {
    Logger.warn('select-books: キーワード抽出失敗 (タイトル空)');
    return [];
  }

  // PA-API キーが揃ってなければ即フォールバック
  if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY) {
    Logger.info(`select-books: PA-API キー未設定 → 検索 URL フォールバック (lang=${lang})`);
    return buildFallbackLinks(category, keywords, lang);
  }

  // PA-API 試行
  let candidates: PaApiItem[] = [];
  try {
    candidates = await searchItems({
      keywords,
      itemCount: 10,
      searchIndex: 'Books',
    });
  } catch (e) {
    Logger.warn(`select-books: PA-API 失敗 (${(e as Error).message}) → フォールバック`);
    return buildFallbackLinks(category, keywords, lang);
  }

  const filtered = candidates.filter((c) => isAllowedBookTitle(c.title));
  Logger.info(
    `select-books: PA-API 候補 ${candidates.length} 冊 → NG後 ${filtered.length} 冊`,
  );

  if (filtered.length === 0) {
    Logger.warn('select-books: PA-API で適合書籍ゼロ → フォールバック');
    return buildFallbackLinks(category, keywords, lang);
  }

  return filtered.slice(0, count).map((c) => ({
    title: c.title,
    url: c.url,
  }));
}
