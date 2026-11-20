// 辞書エントリの解説を Claude API で生成 (ja + en 同時)

import Anthropic from '@anthropic-ai/sdk';
import type { DictTerm } from '../types.js';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.warn('[dict/claude] ANTHROPIC_API_KEY not set — generation will fail');
}

const client = new Anthropic({ apiKey: API_KEY });

export interface DictContent {
  description: { ja: string; en: string };
  usage: { ja: string; en: string };
  synonyms: { ja: string; en: string };
}

const PROMPT_SYSTEM = `あなたは医学論文に詳しい編集者です。PubMedの専門用語について、一般読者 (大学生・研究者志望・医療従事者) 向けに平易な辞書的解説を日本語と英語の両方で生成します。

# 厳守ルール (薬機法対応)
- 個別商品名や「○○が効く」といった効能効果の断定は書かない
- 治療の推奨 (「○○を服用すべき」等) は書かない
- 病名は論文で使われる英語表記と検索のコツにとどめ、治療法の説明はしない
- 栄養素・ハーブ等は「研究で調べられている指標」として記述、効果の断定を避ける
- 日本語の文章中に不自然な半角スペースを入れない

# 出力形式 (JSON厳守、他のテキストは一切出さない)
{
  "description": {
    "ja": "1-3文のやさしい解説 (日本語)",
    "en": "1-3 sentences plain explanation (English)"
  },
  "usage": {
    "ja": "論文で使われる典型的な文脈・測定方法 (日本語, 1-2文)",
    "en": "typical usage in papers, methods (English, 1-2 sentences)"
  },
  "synonyms": {
    "ja": "言い換え・類義語・注意すべき使い分け (日本語, 1-2文)",
    "en": "synonyms, related terms, usage notes (English, 1-2 sentences)"
  }
}`;

export async function generateDictContent(term: DictTerm): Promise<DictContent> {
  if (!API_KEY) throw new Error('ANTHROPIC_API_KEY required');

  const user = `用語情報:
- 日本語: ${term.ja}
- 英語: ${term.en}
${term.abbr ? `- 略語: ${term.abbr}` : ''}
- 分野: ${term.category}
${term.aliases?.length ? `- 別表記: ${term.aliases.join(', ')}` : ''}

この用語の辞書エントリを JSON で出力してください。`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: PROMPT_SYSTEM,
    messages: [{ role: 'user', content: user }],
  });

  const text = resp.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map(c => c.text)
    .join('');

  // JSON抽出 (```json ...``` の場合もある)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude returned non-JSON: ${text.slice(0, 200)}`);

  const parsed = JSON.parse(jsonMatch[0]) as DictContent;
  if (!parsed.description?.ja || !parsed.description?.en) {
    throw new Error('Claude output missing description fields');
  }
  return parsed;
}
