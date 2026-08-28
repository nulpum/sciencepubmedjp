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

/**
 * 論文タイトルから検索キーワードを抽出。
 * @param topN 何個のトークンを結合するか。Amazon/楽天 は複数語 AND 検索なので
 *   多すぎると結果 0 になる。ヒットさせたいなら 2〜3 が経験則的にベスト。
 */
export function extractKeywords(article: PubmedArticle, topN: number = 3): string {
  const tokens = hasJapanese(article.title)
    ? tokenizeJa(article.title)
    : tokenizeEn(article.title);
  return tokens.slice(0, topN).join(' ');
}

export interface SelectedBook {
  title: string;
  url: string;
}

function partnerTag(): string {
  return process.env.AMAZON_PARTNER_TAG || 'sciencepubmed-22';
}

/**
 * Amazon 検索結果ページの URL を組む。tag 付きでアクセスすれば affiliate 有効。
 * @param bookLang 和書 (stripbooks) or 洋書 (english-books) を指定。
 *   JA 記事 → stripbooks: 日本語キーワード × 和書 = ヒット率◎
 *   EN 記事 → english-books: 英語キーワード × 洋書 = amazon.co.jp 内でも豊富にヒット
 */
export function buildSearchUrl(keywords: string, bookLang: 'ja' | 'en' = 'ja'): string {
  const enc = encodeURIComponent(keywords);
  const category = bookLang === 'en' ? 'english-books' : 'stripbooks';
  return `https://www.amazon.co.jp/s?k=${enc}&tag=${partnerTag()}&i=${category}`;
}

// カテゴリごとの広めキーワード (フォールバック 2 つ目のリンク用)
// キーワード数を減らし (2〜3 語)、ヒット率を確保する
const CATEGORY_BROAD_KEYWORDS_JA: Record<Category, string> = {
  psychology: '心理学',
  biology: '生物学',
};
const CATEGORY_BROAD_KEYWORDS_EN: Record<Category, string> = {
  psychology: 'psychology',
  biology: 'biology',
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
// 設計方針 (2026-08 改訂):
//   - キーワードは 2〜3 語まで (以前は 6 語で結果ほぼ 0 だった)
//   - lang=ja: 日本語キーワード × amazon.co.jp 和書 (stripbooks)
//   - lang=en: 英語キーワード × amazon.co.jp 洋書 (english-books)
//   - 楽天は 日本語キーワード × 楽天ブックス (JA 記事のみ有効、EN 記事は
//     日本読者が英語論文を英語で読むケースが少ないので楽天リンクは省略)
//   - リンク数: JA=3 (Amazon topic + Amazon broad + Rakuten topic)
//              EN=2 (Amazon topic 洋書 + Amazon broad 洋書)
function buildFallbackLinks(
  article: PubmedArticle,
  category: Category,
  lang: Lang,
): SelectedBook[] {
  const aId = moshimoAId();
  const links: SelectedBook[] = [];

  if (lang === 'ja') {
    const topicKw = extractKeywords(article, 3);   // 上位 3 トークン
    const broadKw = CATEGORY_BROAD_KEYWORDS_JA[category];
    if (topicKw) {
      links.push({
        title: `「${topicKw}」で Amazon 検索`,
        url: buildSearchUrl(topicKw, 'ja'),
      });
    }
    links.push({
      title: `${CATEGORY_LABEL_JA[category]}カテゴリの Amazon 検索`,
      url: buildSearchUrl(broadKw, 'ja'),
    });
    if (aId && topicKw) {
      links.push({
        title: `「${topicKw}」で 楽天ブックス 検索`,
        url: buildRakutenSearchLink({ aId, keyword: topicKw, category: 'books' }),
      });
    }
  } else {
    const topicKw = extractKeywords(article, 3);   // EN の 3 語
    const broadKw = CATEGORY_BROAD_KEYWORDS_EN[category];
    if (topicKw) {
      links.push({
        title: `Search Amazon JP (English books) for "${topicKw}"`,
        url: buildSearchUrl(topicKw, 'en'),
      });
    }
    links.push({
      title: `Browse ${category} books on Amazon JP (English books)`,
      url: buildSearchUrl(broadKw, 'en'),
    });
    // EN 記事に楽天は付けない (楽天は洋書弱い、日本語読者向けに刺さらない)
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
    return buildFallbackLinks(article, category, lang);
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
    return buildFallbackLinks(article, category, lang);
  }

  const filtered = candidates.filter((c) => isAllowedBookTitle(c.title));
  Logger.info(
    `select-books: PA-API 候補 ${candidates.length} 冊 → NG後 ${filtered.length} 冊`,
  );

  if (filtered.length === 0) {
    Logger.warn('select-books: PA-API で適合書籍ゼロ → フォールバック');
    return buildFallbackLinks(article, category, lang);
  }

  return filtered.slice(0, count).map((c) => ({
    title: c.title,
    url: c.url,
  }));
}
