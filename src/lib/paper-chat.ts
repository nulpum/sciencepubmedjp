// 論文と壁打ちチャット (PubMed Lab β 機能)
//
// PubMed 論文 abstract を context として、ユーザー質問に日本語で回答する。
// - 論文 abstract を system prompt に埋め込む
// - conversation history は client 側で管理して毎回全渡し
// - コスト削減のため max_tokens=500, history は最新 6 メッセージまで

import Anthropic from '@anthropic-ai/sdk';

export interface PaperContext {
  pmid: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  abstract: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  reply: string;
  usage?: { input: number; output: number };
}

const MAX_HISTORY = 6;   // 直近 6 メッセージまで送る (コスト抑制)
const MAX_TOKENS = 500;  // 回答は 200-300 字目安 = ~400 tok

function buildSystem(paper: PaperContext): string {
  return [
    'あなたは日本の大学生・大学院生のリサーチアシスタントです。',
    '以下の PubMed 論文の abstract を根拠に、質問に日本語で答えてください。',
    '',
    '--- 論文情報 ---',
    `タイトル: ${paper.title}`,
    `著者: ${paper.authors.join(', ') || '(不明)'}`,
    `Journal: ${paper.journal ?? '(不明)'}${paper.year ? ` (${paper.year})` : ''}`,
    `PMID: ${paper.pmid}`,
    '',
    'Abstract:',
    paper.abstract || '(abstract なし)',
    '----------------',
    '',
    'ルール:',
    '- Abstract に書かれていない事実は「abstract には記載がありません」と明示する',
    '- 医療・投薬助言は行わない (一般教養レベルまで)',
    '- 論文の主張と、一般常識・あなたの推測を混同しない',
    '- 大学生向けに、専門用語は必要に応じて 1 行で補足',
    '- 回答は 200-300 字前後、必要なら箇条書き',
    '- 「反論できる研究は?」など abstract 外の質問には「私は abstract 情報しか持たないので確答できません」と正直に返す',
  ].join('\n');
}

export async function chatWithPaper(
  apiKey: string,
  paper: PaperContext,
  messages: ChatMessage[],
): Promise<ChatResult> {
  if (messages.length === 0) {
    throw new Error('messages が空です');
  }
  // 直近 MAX_HISTORY 件だけ渡す (コスト抑制)
  const trimmed = messages.slice(-MAX_HISTORY);

  const client = new Anthropic({ apiKey });
  // Haiku 4.5 は Sonnet 4.5 の 1/3 のコスト (in $1/M vs $3/M, out $5/M vs $15/M)。
  // 論文 abstract を根拠に日本語で答える壁打ちタスクは reasoning heavy ではない
  // ので Haiku で十分。 100 UU/日 想定でコスト月 ~¥4500 → ~¥1500 に低減できる。
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: MAX_TOKENS,
    system: buildSystem(paper),
    messages: trimmed.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    throw new Error('Claude 応答に text ブロックがありません');
  }
  return {
    reply: block.text.trim(),
    usage: res.usage
      ? { input: res.usage.input_tokens, output: res.usage.output_tokens }
      : undefined,
  };
}
