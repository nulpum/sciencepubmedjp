// 2026-11-23: 楽天ラクヨコが楽天アフィリエイト対象外と判明したため
// Amazon Prime Student (学生限定6ヶ月無料) に全面切替。
// ファイル名は banner系の import 継続性のため残置。
//
// 商品を追加する場合は Amazon アソシエイトで URL 作成 → 下記配列に push。

export interface RakuyokoBanner {
  id: string;
  title: string;
  description?: string;
  url: string;
  tag?: "all" | "biology" | "psychology" | "research" | "nursing-pharma";
}

export const RAKUYOKO_BANNERS: RakuyokoBanner[] = [
  {
    id: "ps001",
    title: "Amazon Prime Student",
    description: "学生限定 6ヶ月無料 (大学生・院生・専門学生対象)",
    url: "https://www.amazon.co.jp/amazonprime/student?tag=sciencepubm06-22",
    tag: "all",
  },
];

// slug をシードにした決定的な選択 (SSR でも毎回同じ)
export function pickRakuyokoBanner(slug: string, categoryTag?: string): RakuyokoBanner | null {
  const pool = RAKUYOKO_BANNERS.filter(b => !b.tag || b.tag === "all" || b.tag === categoryTag);
  if (pool.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}
