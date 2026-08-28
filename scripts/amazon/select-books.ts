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
import { buildRakutenSearchLink } from '../lib/moshimo.js';

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
// 言語別に処理:
//  - 日本語タイトル (ひらがな/カタカナ/漢字含む) → 助詞・記号で分割して名詞を取り出す
//  - 英語タイトル → スペース分割 + ストップワード除外
// JP 検索では英語キーワードだとサプリ広告が出やすいので、可能なら日本語を使う。
const EN_STOP = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'for', 'to', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'as', 'at', 'by', 'from', 'into', 'this', 'that', 'these', 'those',
  'review', 'systematic', 'meta', 'analysis', 'study', 'studies',
]);
const JA_STOP = new Set([
  'する', 'ある', 'いる', 'なる', 'こと', 'もの', 'ため', 'よう',
  'です', 'ます', 'まし', 'でし',
]);

// 日本語助詞・記号で分割
function tokenizeJa(text: string): string[] {
  return text
    .replace(/[・、。「」『』()（）\[\]【】〜~,.;:!?！？\s]+/g, '|')
    // 助詞の前後で分割 (1文字助詞)
    .replace(/(の|が|を|に|は|で|と|や|も|から|まで|より|へ|か|ね|よ)/g, '|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && !JA_STOP.has(s));
}

function tokenizeEn(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[():,.;!?'"\-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !EN_STOP.has(w));
}

function hasJapanese(text: string): boolean {
  return /[぀-ゟ゠-ヿ一-鿿]/.test(text);
}

export function extractKeywords(article: PubmedArticle): string {
  const tokens = hasJapanese(article.title)
    ? tokenizeJa(article.title)
    : tokenizeEn(article.title);
  return tokens.slice(0, 6).join(' ');
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

// もしも a_id が設定されていれば楽天リンクも生成する
function moshimoAId(): string | null {
  const v = (process.env.MOSHIMO_A_ID || '').trim();
  return v || null;
}

// PA-API が使えない / 失敗した時の URL ベースフォールバック
// 現状の設計:
//   - Amazon (直リンク、sciencepubmed-22 タグ) を必ず 2 本
//   - MOSHIMO_A_ID があれば楽天 (もしも経由) を 1 本追加
//   - 結果として ja=2〜3, en=2〜3 本のリンクが記事に載る
function buildFallbackLinks(
  category: Category,
  keywords: string,
  lang: Lang,
): SelectedBook[] {
  const broad = CATEGORY_BROAD_KEYWORDS[category];
  const aId = moshimoAId();

  const links: SelectedBook[] = [];
  if (lang === 'ja') {
    links.push({ title: 'この記事のテーマに関連する書籍 (Amazon)', url: buildSearchUrl(keywords) });
    links.push({ title: `${CATEGORY_LABEL_JA[category]}の関連書籍 (Amazon)`, url: buildSearchUrl(broad) });
    if (aId) {
      links.push({
        title: '楽天でも探す (楽天ブックス)',
        url: buildRakutenSearchLink({ aId, keyword: keywords, category: 'books' }),
      });
    }
  } else {
    links.push({ title: 'Related books on this topic (Amazon JP)', url: buildSearchUrl(keywords) });
    links.push({ title: `More ${category} books (Amazon JP)`, url: buildSearchUrl(broad) });
    if (aId) {
      links.push({
        title: 'Search on Rakuten Books',
        url: buildRakutenSearchLink({ aId, keyword: keywords, category: 'books' }),
      });
    }
  }
  return links;
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
