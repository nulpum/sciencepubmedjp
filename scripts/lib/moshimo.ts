// もしもアフィリエイト経由の楽天リンク生成
//
// もしもの「かんたんリンク」HTML から抽出したパラメータ体系:
//   //af.moshimo.com/af/c/click?a_id=<a_id>&p_id=<p_id>&pc_id=<pc_id>&pl_id=<pl_id>&url=<encoded destination>
//
// 楽天市場 (書籍以外も含む):
//   p_id=54, pc_id=54, pl_id=27059
// 楽天ブックス (書籍専用) は将来対応可 (pl_id が別)

const RAKUTEN_MOSHIMO_BASE = 'https://af.moshimo.com/af/c/click';
const RAKUTEN_PARAMS = { p_id: 54, pc_id: 54, pl_id: 27059 } as const;

export interface RakutenLinkOptions {
  aId: string;                 // MOSHIMO_A_ID
  keyword: string;             // 検索キーワード
  category?: 'books' | 'all';  // 検索対象。 デフォルト books
}

/**
 * 楽天市場で書籍を検索する URL を、もしも経由のアフィリエイトリンクに包む
 */
export function buildRakutenSearchLink(opts: RakutenLinkOptions): string {
  const { aId, keyword, category = 'books' } = opts;

  // 楽天市場側の検索 URL を組み立て
  //   category=books: BOOKS ジャンル (書籍) に絞る
  //   category=all:   全ジャンル
  const rakutenUrl = new URL('https://search.rakuten.co.jp/search/mall/');
  if (category === 'books') {
    // 楽天のジャンル ID: 001 = 書籍系
    rakutenUrl.pathname = '/search/mall/BOOKS/';
  }
  rakutenUrl.searchParams.set('p', keyword);   // "p" が楽天の検索キーワードパラメータ
  rakutenUrl.searchParams.set('f', '1');       // pagination 1 ページ目

  // もしもの click エンドポイントに包む
  const moshimo = new URL(RAKUTEN_MOSHIMO_BASE);
  moshimo.searchParams.set('a_id', aId);
  moshimo.searchParams.set('p_id', String(RAKUTEN_PARAMS.p_id));
  moshimo.searchParams.set('pc_id', String(RAKUTEN_PARAMS.pc_id));
  moshimo.searchParams.set('pl_id', String(RAKUTEN_PARAMS.pl_id));
  moshimo.searchParams.set('url', rakutenUrl.toString());
  return moshimo.toString();
}
