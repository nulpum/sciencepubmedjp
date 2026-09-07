// PubMed Lab β "アプリ リリース通知" waitlist 設定
//
// 元は「有料版事前登録」フォームだったが、無料 toolkit プロンプト配布で
// 有料需要はほぼないと判明したため、「アプリ (無料・広告版) リリース通知」
// リストに用途変更。 Form 側も同じくリブランド済み。
//
// 変数名 waitlistUrl / GA event 名 lab_waitlist_click_* は互換性維持で
// そのまま (集計連続性のため)。 表示コピーだけ変更している。
//
// 未設定 (PLACEHOLDER のまま) の場合、UI 側は CTA を非表示にする。
//
// Form 作成手順:
// 1. https://forms.google.com/ で新規フォーム作成
// 2. タイトル: 「PubMed Lab 有料版 事前登録」
// 3. 質問 1: メールアドレス (必須、種類=短文回答、回答の検証=メール)
// 4. 質問 2 (任意): 学年・立場 (プルダウン: 学部生 / 大学院生 / 社会人 / その他)
// 5. 質問 3 (任意): 一番使いたい機能は? (プルダウン: 壁打ちチャット / 検索横断のテーマ提案 / 論文要約 / その他)
// 6. 「送信」→「リンク」タブ → 「短縮 URL」チェックを入れて URL コピー
//    (https://forms.gle/xxxxx 形式)
// 7. その URL を下の LAB_WAITLIST_URL に貼り付け

export const LAB_CONFIG = {
  /**
   * Google Form の共有 URL (short URL 形式推奨)。
   * 未設定なら waitlist CTA は表示されない。
   */
  waitlistUrl: 'https://forms.gle/FEZ2EQ2VG2ie3zEQA',
} as const;

export function isWaitlistEnabled(): boolean {
  return !LAB_CONFIG.waitlistUrl.includes('PLACEHOLDER');
}
