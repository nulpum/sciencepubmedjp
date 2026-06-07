// 薬機法 / ステマ規制 ポストチェック用 NG 語辞書
//
// 目的: Claude 生成後の本文に NG 表現が含まれていないか機械的にチェックし、
//       含まれていたら再生成または手動レビューに回す。
//
// 注意: あくまで safety net。プロンプト側でも禁止を明示すること。
//
// 2026-06 改訂: 5 セクション構成 (800-1500字) に長文化したことで、論文中の
// 医学用語 (治療・予防・改善・疾患) を引用するシーンが増え、旧フィルタの
// 単独単語マッチが過剰に発火していた。英語側と同様、効能を断定する構文に
// 絞ってマッチさせる方針へ変更。
//
//   NG 例 (引き続きブロック):
//     - "サプリで糖尿病が治る" / "この食品を飲めば改善する"
//     - "絶対に痩せる" / "副作用がない" / "医薬品レベル"
//     - "○○が☓☓を予防する" (sponsored claim style)
//   OK 例 (今後通る):
//     - "研究では認知機能の改善が観察された"
//     - "糖尿病治療における新しいアプローチ"
//     - "予防医学の文脈での示唆"
//     - "症状改善と関連していた"

// 日本語 NG 表現
const JA_NG_PATTERNS: RegExp[] = [
  // === 1. 商品・行動 → 効能断定 (ステマ規制 + 薬機法) ===
  // 「サプリ/食品/薬」+ 助詞 + 「治す/治る/改善する/予防する/消える」
  /(サプリ|サプリメント|本商品|本書|この製品|この食品|この薬|この方法)\s*(を|が|で|なら|だけで).{0,20}(治す|治る|改善す|予防す|消える|効く)/,
  // 「飲めば/食べれば/使えば/やれば」+ 効能
  /(を)?(飲めば|食べれば|使えば|やれば|試せば).{0,10}(治る|治す|効く|改善|予防)/,

  // === 2. 確実性・保証表現 (薬機法明確違反) ===
  /(絶対|必ず|確実に|100\s*[%％]|完全に).{0,12}(治る|治す|効く|予防でき|改善する|痩せ)/,
  /誰でも.{0,8}(治る|痩せ|改善)/,
  /即(効|座)に.{0,5}(効く|治る|改善)/,

  // === 3. ダイエット効能の断定 ===
  /必ず\s*痩せ/,
  /確実に\s*痩せ/,
  /短期間で\s*\d+\s*(kg|キロ).{0,5}(痩|減量)/,
  /ダイエット効果(がある|あり|抜群)/,

  // === 4. 副作用なし系 ===
  /副作用(が|は|も)?(無い|ない|存在しない|皆無)/,
  /安全性.{0,5}(100|完全|絶対|保証)/,

  // === 5. 医薬品同等性 ===
  /医薬品(と同|同様|レベル|並み|超え)/,

  // === 6. 過剰な保証 ===
  /奇跡の(治療|薬|食品|サプリ|方法)/,
  /夢の(治療|薬|サプリ)/,

  // === 7. 強い断定動詞 (単独で使われた場合のみ問題、構文限定) ===
  // 「○○を治す」 (誰かが何かを治す断定)
  /[一-龯ぁ-ゟァ-ヿ]を治す(?![療])/,
  // 「効く」が断定的にバズる: "○○が効く"
  /^(\S+\s*)?[^効]効く(?![き])/m,
];

// 英語 NG 表現（薬機法相当の medical claim）
// 単独動詞 (cures / treats / prevents / heals) は research 文脈で頻出するため、
// "効能を断定する構文" に限定してマッチさせる。
//   NG例: "Vitamin D cures depression" / "X prevents cancer"
//   OK例: "cure rate was 65%" / "search for a cure" / "standard treatment for ..."
const EN_NG_PATTERNS: RegExp[] = [
  // <動詞> + <疾患/症状名> の断定パターン
  /\b(?:cures?|heals?|prevents?)\s+(?:cancer|diabetes|depression|anxiety|alzheimer'?s?|dementia|obesity|insomnia|disease|illness|disorders?|conditions?|symptoms?)\b/i,
  // "will / can / definitely / completely + cure/prevent/heal"
  /\b(?:will|can|definitely|completely|fully)\s+(?:cures?|prevents?|heals?)\b/i,
  // 過度な保証表現
  /\bguarantee[ds]?\s+(?:weight|results|cure)/i,
  /\bmiracle\s+(?:cure|drug|effect|pill)/i,
  /\bclinically\s+proven\s+to\s+(?:cure|treat|prevent|heal)/i,
  // "100% effective" 系
  /\b100\s*%\s+(?:effective|safe|guaranteed)/i,
];

// association を causation で語っていないかの簡易チェック（補助的）
const CAUSATION_OVER_REACH_JA: RegExp[] = [
  // 「○○が原因で〜を引き起こす」のような強い因果断定
  // ただし「(可能性) を引き起こす可能性がある」 「と考えられる」 のような hedged 表現はOK
  /(によって|が原因で).{0,15}(必ず|確実に).{0,5}(引き起こ|もたらす)/,
];
const CAUSATION_OVER_REACH_EN: RegExp[] = [
  /\bcauses?\s+(directly|definitively)\b/i,
];

export interface NgCheckResult {
  ok: boolean;
  hits: string[]; // マッチした表現の生文字列
}

export function checkNgWords(
  text: string,
  lang: 'ja' | 'en',
): NgCheckResult {
  const patterns = lang === 'ja'
    ? [...JA_NG_PATTERNS, ...CAUSATION_OVER_REACH_JA]
    : [...EN_NG_PATTERNS, ...CAUSATION_OVER_REACH_EN];

  const hits: string[] = [];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return { ok: hits.length === 0, hits };
}
