// PubMed E-utilities 用クエリ定義
//
// 設計方針:
// - publication type を review / meta-analysis に絞り、症例報告・撤回論文・コメントを除外
// - 英語のみ
// - 2018 年以降（古すぎる知見を避ける）
// - category ごとに MeSH を変える（薬機法に滑り込みやすい nutrition/disease/drug は意図的に外す）

import type { Category } from '../types.js';

const COMMON_FILTER = `
  ("review"[Publication Type] OR "meta-analysis"[Publication Type] OR "systematic review"[Publication Type])
  NOT "case reports"[Publication Type]
  NOT "retracted publication"[Publication Type]
  NOT "comment"[Publication Type]
  NOT "editorial"[Publication Type]
  AND "english"[Language]
  AND ("2018"[PDAT] : "3000"[PDAT])
`.replace(/\s+/g, ' ').trim();

const TOPIC_QUERIES: Record<Category, string> = {
  // 心理学・学習科学・行動科学・睡眠
  psychology: `(
    "memory"[MeSH] OR "learning"[MeSH] OR "sleep"[MeSH]
    OR "cognition"[MeSH] OR "habits"[MeSH] OR "decision making"[MeSH]
    OR "motivation"[MeSH] OR "attention"[MeSH]
  )`.replace(/\s+/g, ' ').trim(),

  // 動物行動・進化・生態・人類学（純雑学寄り）
  biology: `(
    "behavior, animal"[MeSH] OR "biological evolution"[MeSH]
    OR "ecology"[MeSH] OR "anthropology"[MeSH]
    OR "biodiversity"[MeSH]
  )`.replace(/\s+/g, ' ').trim(),
};

export function buildQuery(category: Category): string {
  return `${TOPIC_QUERIES[category]} AND ${COMMON_FILTER}`;
}
