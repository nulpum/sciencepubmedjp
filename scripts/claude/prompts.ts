// Claude API へ渡すプロンプト集
//
// 重要ルール（system prompt に明記する）:
// - association ↔ causation を混同しない（「相関がある」を「原因」と訳さない）
// - 薬機法 NG 表現禁止（効く / 治る / 予防する / 改善する 等）
// - ステマ規制配慮（商品の断定推奨はしない、紹介は別セクション）
// - 1文目に結論、本文に具体数字、フック句で始める

import type { Lang, PubmedArticle } from '../types.js';

// 「最新研究」系は時に嘘になる（古い論文も引くため）ので外した。
// 「知ってる？」をデフォルトに、軽い驚き系で揃える。
const HOOKS_JA = ['【知ってる？】', '【意外な事実】', '【ちょっと驚き】'];
const HOOKS_EN = ['Did you know?', 'Surprising finding:', 'Quick fact:'];

function pickHook(lang: Lang): string {
  const arr = lang === 'ja' ? HOOKS_JA : HOOKS_EN;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildSystemPrompt(lang: Lang): string {
  if (lang === 'ja') {
    return [
      'あなたは PubMed 論文を一般読者向けの「豆知識」記事に翻案するライターです。',
      '次のルールを必ず守ってください:',
      '1. 論文に書かれていない断定をしない。"associated with" は「関連がある」と訳し、「原因」「引き起こす」と書かない。',
      '2. 薬機法 NG 表現を使わない: 「効く」「治る」「治療する」「予防する」「改善する」「症状が消える」「副作用がない」など。',
      '3. 出力は 200〜400 字程度の Markdown。1文目は必ず結論。本文に具体的な数字 (n, %, 倍率, 年数 等) を最低1つ含める。',
      '4. 商品やサプリの推奨をしない。',
      '5. 出力は厳密な JSON で、{"title": string, "fact": string, "body": string} の3フィールドのみ。前後の説明は書かない。',
      '   - title: 30字以内、論文の核心を表す見出し',
      '   - fact: フック句で始まる1文 (例: 「【意外な事実】〇〇は△△と関連する」)',
      '   - body: Markdown 本文 (factの繰り返しは不要)',
    ].join('\n');
  }
  return [
    'You are a science writer who turns PubMed papers into short trivia for general readers.',
    'Follow these rules strictly:',
    '1. Never overclaim: translate "associated with" as "linked to", not "causes".',
    '2. Do NOT make medical efficacy claims. Avoid phrases like "X cures Y", "prevents disease", "heals", "miracle cure", "clinically proven to cure", "guaranteed weight loss", "100% effective".',
    '   Prefer hedged scientific phrasing: "linked to", "associated with", "may reduce risk of", "shows benefit for", "correlates with", "in a study of N people".',
    '   You may discuss "treatment" or "cure" descriptively (e.g. "the cure rate was 65%", "standard treatment involves X") but never claim a substance/behavior cures/prevents/heals a named condition.',
    '3. Output is 80-160 English words in Markdown. First sentence is the takeaway. Include at least one concrete number (n, %, fold, years).',
    '4. Do not recommend supplements or products.',
    '5. Output STRICT JSON only with {"title": string, "fact": string, "body": string}. No prose before or after.',
    '   - title: under 60 chars, captures the core finding',
    '   - fact: a single sentence starting with a hook (e.g. "Did you know? ...")',
    '   - body: Markdown body (no need to repeat the fact verbatim)',
  ].join('\n');
}

export function buildUserPrompt(article: PubmedArticle, lang: Lang): string {
  const hook = pickHook(lang);
  if (lang === 'ja') {
    return [
      `次の論文 abstract を題材に、上記ルールに従って日本語の豆知識記事を JSON で出力してください。`,
      `フック句の候補（factの先頭で必ず1つ使う）: ${HOOKS_JA.join(' / ')}`,
      `推奨フック: ${hook}`,
      ``,
      `タイトル: ${article.title}`,
      `掲載誌: ${article.journal ?? 'unknown'}`,
      `出版年: ${article.year ?? 'unknown'}`,
      `Abstract:`,
      article.abstract,
    ].join('\n');
  }
  return [
    `Using the abstract below, write an English trivia post in JSON per the rules above.`,
    `Allowed hooks (use one at the start of "fact"): ${HOOKS_EN.join(' / ')}`,
    `Suggested hook: ${hook}`,
    ``,
    `Title: ${article.title}`,
    `Journal: ${article.journal ?? 'unknown'}`,
    `Year: ${article.year ?? 'unknown'}`,
    `Abstract:`,
    article.abstract,
  ].join('\n');
}
