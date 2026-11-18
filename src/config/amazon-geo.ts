// Amazon affiliate geo-routing config
//
// 現状 の affiliate_links は 全部 amazon.co.jp 直貼り だが、 EN 読者 の
// 一部 は 海外 (大部分 US) か ら 来て いる。 海外 読者 に とって
// amazon.co.jp は 送料・配送 面 で 不都合、 購入 率 が 極端 に 下がる。
//
// 対策: navigator.language = 'en-US' の 読者 だけ、 JS で
// amazon.co.jp link を amazon.com に 動的 置換 する (href rewrite)。
// 書き換え は クライアント 側 のみ、 SSR / HTML sitemap に は 影響 しない。
//
// このため に Amazon.com Associates (US) に 別途 登録 し、 tag を 取得
// して 下記 `us.tag` に 設定 する。
// 登録 URL: https://affiliate-program.amazon.com/
// 審査 条件: 180日 以内 に 3件 の 対象 CV が 必要 (でないと 契約 解除)
//
// `us.tag` が 空 の 間 は、 geo-routing は 無効 (= 従来 通り
// amazon.co.jp を そのまま 表示)。 tag を 貼ったら BaseLayout に
// 埋め込まれた inline script が US 読者 向け に 書き換え 開始。

export const AMAZON_GEO = {
  jp: {
    host: 'amazon.co.jp',
    tag: 'sciencepubm06-22',
  },
  us: {
    host: 'amazon.com',
    // TODO: Amazon.com Associates に 登録 後、 発行 された tag を 貼る
    //   形式 例: 'yoursite-20'
    tag: '',
  },
};

export type AmazonRegion = keyof typeof AMAZON_GEO;
