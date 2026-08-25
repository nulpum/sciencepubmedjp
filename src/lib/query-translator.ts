// 日本語検索意図 → PubMed 英語クエリ 変換
//
// ユーザーが日本語で入力した検索意図を、Claude に PubMed 検索用の
// 英語クエリに変換させる。無料機能なので Claude 呼び出しは 1 回だけ。

import Anthropic from '@anthropic-ai/sdk';

export interface TranslateQueryResult {
  englishQuery: string;
  notes?: string;
}

/**
 * 日本語入力を PubMed 英語クエリに変換
 * @param apiKey Anthropic API key
 * @param jaQuery ユーザーの日本語入力 (例: "大学生の睡眠と成績")
 */
export async function translateQueryToEnglish(
  apiKey: string,
  jaQuery: string,
): Promise<TranslateQueryResult> {
  const client = new Anthropic({ apiKey });

  const systemPrompt = [
    'You are a scientific literature search expert. Your job is to convert Japanese natural-language research questions into PubMed search queries.',
    '',
    'Rules:',
    '1. Output MUST be a valid PubMed search query using MeSH terms or free-text keywords with Boolean operators (AND, OR, NOT).',
    '2. Use quotes for exact multi-word phrases when appropriate.',
    '3. Prefer MeSH terms with [MeSH] qualifier when the concept has a standard MeSH heading (e.g. "sleep deprivation"[MeSH]).',
    '4. Include synonyms with OR to broaden recall (e.g. (children OR pediatric OR adolescent)).',
    '5. Do NOT include date restrictions unless the user explicitly asks for recent studies.',
    '6. Keep the query length reasonable (under 300 chars).',
    '7. If the input is too vague, still make a best-effort conversion.',
    '',
    'Output STRICT JSON only with {"englishQuery": string, "notes": string}. No prose before or after.',
    '  - englishQuery: the PubMed query string',
    '  - notes: brief 1-line note about the translation strategy (in Japanese)',
  ].join('\n');

  const userPrompt = [
    `以下の日本語の研究テーマ・質問を PubMed 検索用の英語クエリに変換してください:`,
    '',
    `日本語入力: ${jaQuery}`,
  ].join('\n');

  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    throw new Error('Claude 応答に text ブロックがありません');
  }

  // コードフェンス除去
  const cleaned = block.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const obj = JSON.parse(cleaned) as TranslateQueryResult;
  if (!obj.englishQuery) {
    throw new Error(`englishQuery が空: ${cleaned}`);
  }
  return obj;
}
