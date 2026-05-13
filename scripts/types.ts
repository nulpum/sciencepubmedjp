// プロジェクト全体で使う型定義

export type Lang = 'ja' | 'en';
export type Category = 'psychology' | 'biology';

export const ALL_LANGS: Lang[] = ['ja', 'en'];
export const ALL_CATEGORIES: Category[] = ['psychology', 'biology'];

// PubMed efetch から正規化した1論文ぶんのデータ
export interface PubmedArticle {
  pmid: string;
  title: string;
  abstract: string;
  journal?: string;
  year?: number;
  doi?: string;
  publicationTypes?: string[];
  fetchedAt: string; // ISO8601
}

// Claude が出力した記事1本（言語別に作る）
export interface GeneratedArticle {
  pmid: string;
  category: Category;
  lang: Lang;
  title: string;
  fact: string;
  body: string;          // Markdown 本文
  sourceUrl: string;
  journal?: string;
  year?: number;
  generatedAt: string;   // ISO8601
}
