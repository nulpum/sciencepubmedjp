// 楽天ラクヨコ (2026-08-25 開設の楽天プチプラ直販ストア) の
// アフィリエイトリンク集。
// 公募 ASP (もしも等) 未対応のため、楽天アフィリエイト直経由の
// hybrid_url リダイレクタを利用する。
//
// 商品を追加する場合:
//  1. 楽天アフィリエイト管理画面で rakuyoko.rakuten.co.jp の商品を検索
//  2. 「リンク作成」 → hybrid_url (推奨) で URL取得
//  3. 下記配列に push

export interface RakuyokoBanner {
  id: string;
  title: string;
  description?: string;
  url: string;
  tag?: 'all' | 'biology' | 'psychology' | 'research' | 'nursing-pharma';
}

export const RAKUYOKO_BANNERS: RakuyokoBanner[] = [
  {
    id: 'rk001',
    title: '楽天ラクヨコ',
    description: 'プチプラ雑貨・ファッション (数百円〜)',
    url: 'https://hb.afl.rakuten.co.jp/hgc/578b922e.072821fb.578b922f.080feb17/?pc=https%3A%2F%2Frakuyoko.rakuten.co.jp%2Fshop%2F1p-ss%2Fitem%2F676150327911&link_type=hybrid_url&ut=eyJwYWdlIjoidXJsIiwidHlwZSI6Imh5YnJpZF91cmwiLCJjb2wiOjF9',
    tag: 'all',
  },
];

// slug をシードにした決定的な選択 (SSR でも毎回同じ)
export function pickRakuyokoBanner(slug: string, categoryTag?: string): RakuyokoBanner | null {
  const pool = RAKUYOKO_BANNERS.filter(b => !b.tag || b.tag === 'all' || b.tag === categoryTag);
  if (pool.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}
