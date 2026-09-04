// Google AdSense 設定
//
// レオナさんが AdSense ダッシュボードで「広告ユニット」を作成後、
// 発行される slot ID (10 桁の数字文字列) を下記に貼り付ける。
//
// 作成手順:
// 1. https://www.google.com/adsense/ → 広告 → 概要 → 広告ユニットタブ
// 2. 「新しい広告ユニットの作成」→ ディスプレイ広告 → 「レスポンシブ」
// 3. 名前を分かりやすく (例: pubmed-article-footer, pubmed-lab-results, pubmed-lab-top)
// 4. 作成すると `data-ad-slot="1234567890"` のコードが発行される
// 5. その 10 桁数字を下記に貼る (client ID は既に BaseLayout に埋め込み済)
//
// slot が空文字のうちは AdUnit コンポーネントは何も表示しない (安全策)。
// 後で slot ID が揃った段階で本番表示になる。

export const AD_CONFIG = {
  /** Google AdSense パブリッシャー ID (BaseLayout の script タグと同じ) */
  client: 'ca-pub-1702094040387118',

  /**
   * 3 箇所の広告 slot ID。 未設定なら該当箇所は表示しない。
   */
  slots: {
    /** 記事ページ (ja/en, psychology/biology) の記事フッター */
    articleFooter: '',
    /** Lab 検索結果ページの末尾 (waitlist CTA の上) */
    labResults: '',
    /** Lab トップ (未検索状態) の feature セクション下 */
    labTop: '',
  },
} as const;

export type AdSlot = keyof typeof AD_CONFIG.slots;

export function isAdSlotEnabled(slot: AdSlot): boolean {
  return AD_CONFIG.slots[slot].length > 0;
}
