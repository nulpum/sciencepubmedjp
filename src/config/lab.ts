// PubMed Lab waitlist 設定 (現在: 廃止 = 全 CTA 非表示)
//
// 経緯:
//   1. 元は「有料版事前登録」フォーム
//   2. 有料需要がほぼないと判明 → 「アプリ リリース通知」にリブランド
//   3. リブランド後も 4 日で 0 件 → waitlist 収集自体を廃止
//
// 現状: waitlistUrl = '' (空文字) で isWaitlistEnabled() が false
//       → Lab / toolkit の全 CTA が自動的に非表示 (コード側は残す)
//
// 復活方法: waitlistUrl に URL を貼るだけで全 CTA が再表示される。
//
// Google Form (https://forms.gle/FEZ2EQ2VG2ie3zEQA) 自体は残存。
// 誰かが直接 URL 叩いて送信すれば回答は入る (無害・低コスト)。

export const LAB_CONFIG = {
  /**
   * Google Form の共有 URL。 空文字なら CTA 全非表示。
   * 復活したくなったら 'https://forms.gle/FEZ2EQ2VG2ie3zEQA' に戻す。
   */
  waitlistUrl: '',
} as const;

export function isWaitlistEnabled(): boolean {
  return LAB_CONFIG.waitlistUrl.length > 0 && !LAB_CONFIG.waitlistUrl.includes('PLACEHOLDER');
}
