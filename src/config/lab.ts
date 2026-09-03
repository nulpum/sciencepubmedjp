// PubMed Lab β 有料版 waitlist 設定
//
// レオナさんが作成する Google Form の URL をここに入れる。
// 未設定 (PLACEHOLDER のまま) の場合、UI 側は waitlist CTA を非表示にする。
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
