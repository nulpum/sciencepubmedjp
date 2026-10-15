// Editor's note generator (single article) — used by daily pipeline
//
// 新規記事 生成時 に Claude Sonnet 4.5 で 2-3 文 の 編集ノート を 生成する。
// (バッチ用の pipeline/add-editor-notes.ts と 共通ロジック、こちらは 1 本 ずつ呼び出し用)
//
// E-E-A-T 強化: 「編集者が 読んで 選んだ」signal を 新規記事にも 自動付与。

import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../lib/logger.js';
import type { GeneratedArticle } from '../types.js';

// 15 種の 開始パターン (template 感 排除)
const JA_PATTERNS = [
  '意外に 感じるかもしれない 結果',
  '読み進める 価値ある レビュー',
  '最近 の 議論に 文脈を 与える 1 本',
  '一見 当たり前そうで 実は 奥が深い テーマ',
  '結論よりも 「限界 の 書き方」が 読みどころ',
  'メディア報道で 省かれがち な ニュアンス を 抑えた記事',
  '方法論の 丁寧さに 注目したい 論文',
  '仮説より データが 面白い 1 本',
  '古典的 な 問いに 新しい 証拠を 加える レビュー',
  '読者から 質問 の 多い テーマ の 現在地',
  '専門外の 人にも 示唆が 広い 内容',
  '相関と 因果 の 区別が 重要な テーマ',
  'サンプル 設計の 工夫が 光る 研究 の まとめ',
  'よくある 誤解 を 覆す 系統的レビュー',
  '結論よりも「残された 問い」が 多い 分野 の 現在地',
];
const EN_PATTERNS = [
  'A result that may surprise you',
  'A review worth reading closely',
  'Context for a current conversation',
  'A topic that seems obvious but is actually deeper',
  'The limitations section is the real highlight',
  'The nuance that media coverage tends to skip',
  'A paper where the methodology deserves attention',
  'The data is more interesting than the hypothesis',
  'New evidence on a classical question',
  'The current state of a topic readers often ask about',
  'Relevant beyond the usual specialty audience',
  'A topic where correlation vs causation really matters',
  'A review where sample design shines',
  'A systematic review that overturns a common misconception',
  'A field with more open questions than answers',
];

function pickPattern(pmid: string, lang: 'ja' | 'en'): string {
  let h = 0;
  for (let i = 0; i < pmid.length; i++) h = (h * 31 + pmid.charCodeAt(i)) >>> 0;
  const list = lang === 'ja' ? JA_PATTERNS : EN_PATTERNS;
  return list[h % list.length];
}

function buildSystemPrompt(lang: 'ja' | 'en'): string {
  if (lang === 'ja') {
    return `あなたは PubMed Trivia の 編集者 です。 読者 (大学生 / 研究者 / 社会人) に 向けて、
この 記事 の 冒頭 に 載せる 短い 「編集ノート」を 1 件 書いてください。

**制約**:
- 2〜3 文、合計 100〜180 字
- タイトル や 本文を 単に 言い換えない。 「編集者視点」の 独自コメント を 1 つ加える
- 方法論への 注目、文脈 (なぜ 今 読む価値あるか)、限界 の 示唆、関連分野 への 広がり、
  読者タイプ別 の 推奨、よくある 誤解 の 是正 — 等 の 中から 1 つ 選ぶ
- 医学的助言 / 「必ず治る」等 の 薬機法 違反表現 禁止
- 「〜ではないでしょうか」「〜と 思います」等 の 曖昧な 自己言及 禁止
- 事実に 基づく 淡々とした 編集者 トーン ("ですます"調 or 常体 どちらでも OK、記事に合わせる)

**出力形式**: 編集ノート本文 のみ (前置き・後置き なし、150 字 程度)`;
  }
  return `You are an editor at PubMed Trivia. Write ONE short "editor's note" to appear at the top of this article
for readers (grad students, researchers, informed laypeople).

**Constraints**:
- 2-3 sentences, 60-120 words total
- Do NOT merely restate the title or fact. Add ONE editorial angle
- Pick ONE of: methodological note / why this matters now / limitations hint / cross-field relevance /
  recommended reader type / correcting a common misconception
- No medical advice, no claims that would violate pharmaceutical-affairs law ("guaranteed cure", etc.)
- Avoid vague self-reference ("in my opinion", "perhaps"); use a factual editor tone
- Natural prose, not bullet points

**Output**: just the note (no preamble, no epilogue), ~80 words`;
}

function buildUserPrompt(article: GeneratedArticle, hint: string): string {
  return [
    `# 記事情報`,
    ``,
    `## タイトル`,
    article.title,
    ``,
    `## リード (fact)`,
    article.fact,
    ``,
    `## 本文の 冒頭`,
    article.body.slice(0, 1500),
    ``,
    `---`,
    article.lang === 'ja'
      ? `※ 編集ノートの 冒頭 は 「${hint}」の 発想で 書いてください (そのまま 使う 必要 なし、ニュアンス だけ 参考に)。`
      : `Note: start the editor's note in the spirit of: "${hint}" (you don't have to use the exact words, just the nuance).`,
  ].join('\n');
}

/**
 * Generate a 2-3 sentence editor's note for one article.
 * Returns the note string, or null on failure (caller should proceed without blocking).
 */
export async function generateEditorNote(article: GeneratedArticle): Promise<string | null> {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) {
    Logger.warn('generate-editor-note: ANTHROPIC_API_KEY 未設定 → スキップ');
    return null;
  }
  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';
    const hint = pickPattern(article.pmid, article.lang);
    const res = await client.messages.create({
      model,
      max_tokens: 500,
      system: buildSystemPrompt(article.lang),
      messages: [{ role: 'user', content: buildUserPrompt(article, hint) }],
    });
    const block = res.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      Logger.warn(`generate-editor-note: no text block for ${article.pmid} (${article.lang})`);
      return null;
    }
    const note = block.text.trim();
    return note.length > 300 ? note.slice(0, 297) + '…' : note;
  } catch (e) {
    Logger.warn(`generate-editor-note: ${article.pmid} ${article.lang} 失敗 → スキップ: ${(e as Error).message}`);
    return null;
  }
}
