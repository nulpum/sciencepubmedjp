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
  // Phase 2: PA-API で関連書籍を自動選定し注入
  affiliateLinks?: { title: string; url: string }[];
  // Phase 3: 編集ノート (2026-10-15 追加、E-E-A-T 強化、Claude 自動生成)
  editorNote?: string;
}

// 辞書エントリの分野 (既存Categoryと独立、研究統計/看護薬学を追加)
export type DictCategory = 'research' | 'biology' | 'psychology' | 'nursing-pharma';
export const ALL_DICT_CATEGORIES: DictCategory[] = ['research', 'biology', 'psychology', 'nursing-pharma'];

// terms.json の1エントリ (手動シード)
export interface DictTerm {
  slug: string;
  ja: string;
  yomi: string;
  en: string;
  abbr?: string;
  category: DictCategory;
  aliases?: string[];
}

// Claude + PubMed から生成した辞書エントリ (data/dict/entries/<slug>.json)
export interface DictEntry extends DictTerm {
  meshHeading?: string;
  meshUi?: string;
  description: { ja: string; en: string };
  usage: { ja: string; en: string };
  synonyms: { ja: string; en: string };
  pubmedCount: number;
  yearlyCount: { year: number; count: number }[];
  searchQuery: string;
  recentArticles: { pmid: string; title: string; year?: number }[];
  relatedSlugs?: string[];
  generatedAt: string;
}

