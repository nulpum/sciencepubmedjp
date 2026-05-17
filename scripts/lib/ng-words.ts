// 薬機法 / ステマ規制 ポストチェック用 NG 語辞書
//
// 目的: Claude 生成後の本文に NG 表現が含まれていないか機械的にチェックし、
//       含まれていたら再生成または手動レビューに回す。
//
// 注意: あくまで safety net。プロンプト側でも禁止を明示すること。

// 日本語 NG 表現（薬機法を中心に、効能効果の断定表現を弾く）
const JA_NG_PATTERNS: RegExp[] = [
  /効く/,
  /効果がある/,
  /治る/,
  /治す/,
  /治療(する|できる|になる)/,
  /予防(する|できる|になる)/,
  /改善(する|します)/,
  /症状(が|を)?(消える|なくなる|改善)/,
  /(病気|疾患|うつ|不眠|認知症|がん|高血圧|糖尿病).*?(治|防|改善)/,
  /痩せる/,
  /ダイエット効果/,
  /副作用(が|は)?ない/,
  /医薬品(と同|同様|レベル)/,
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
  /(によって|が原因で).{0,15}(引き起こ|もたらす)/,
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
