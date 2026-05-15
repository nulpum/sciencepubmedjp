// 記事(PubmedArticle)から関連書籍候補を Amazon PA-API 経由で取得し、
// 許可ジャンル / NG タイトルでフィルタして上位 N 冊を返す。
//
// 設計方針:
// - SearchIndex='Books' でハードに絞る（サプリ等の禁止カテゴリは入らない）
// - それでも書籍タイトルに「ダイエット/痩せ/サプリ」等が混じったら NG ワードで弾く
// - PA-API 失敗時は空配列を返す（呼び出し側でアフィなし記事として処理）

import type { PubmedArticle } from '../types.js';
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
// 単純にタイトル中の名詞っぽい英単語を上位 8 個ピック。
// PubMed のタイトルは英語なので英語で検索 → JP Amazon でも英語/翻訳書ともヒットする。
export function extractKeywords(article: PubmedArticle): string {
  const STOP = new Set([
    'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'for', 'to', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'as', 'at', 'by', 'from', 'into', 'this', 'that', 'these', 'those',
    'review', 'systematic', 'meta', 'analysis',  // PubMed 頻出だがノイズ
  ]);
  const words = article.title
    .toLowerCase()
    .replace(/[():,.;!?'"]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  return words.slice(0, 8).join(' ');
}

export interface SelectedBook {
  title: string;
  url: string;
}

export async function selectRelatedBooks(
  article: PubmedArticle,
  count = 2,
): Promise<SelectedBook[]> {
  const keywords = extractKeywords(article);
  if (!keywords) {
    Logger.warn('select-books: キーワード抽出失敗 (タイトル空)');
    return [];
  }

  let candidates: PaApiItem[] = [];
  try {
    candidates = await searchItems({
      keywords,
      itemCount: 10,
      searchIndex: 'Books',
    });
  } catch (e) {
    Logger.warn(`PA-API failed: ${(e as Error).message}. アフィなしで続行。`);
    return [];
  }

  const filtered = candidates.filter((c) => isAllowedBookTitle(c.title));
  Logger.info(
    `select-books: 候補 ${candidates.length} 冊 → NG後 ${filtered.length} 冊`,
  );

  return filtered.slice(0, count).map((c) => ({
    title: c.title,
    url: c.url,
  }));
}
