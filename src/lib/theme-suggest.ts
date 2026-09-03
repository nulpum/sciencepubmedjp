// 卒論・修論テーマ提案 (PubMed Lab β)
//
// ユーザーの興味 + 検索結果の上位 N 論文を俯瞰し、
// 「大学生でも実施可能な研究テーマ」を 3 つ提案する。
//
// 特徴:
// - 1 コールで 3 テーマ生成 (コスト抑制)
// - JSON 応答なので UI 描画しやすい
// - 各テーマに「元にした論文の PMID」を持たせ、結果カードに anchor リンク

import Anthropic from '@anthropic-ai/sdk';

export interface ThemeSuggestPaper {
  pmid: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  abstract: string;
}

export interface ThemeSuggestion {
  title: string;         // 30 字以内
  why: string;           // 100-150 字
  basedOnPmid: string;   // papers の PMID のいずれか
}

export interface ThemeSuggestResult {
  interests: string[];             // 3-5 キーワード
  themes: ThemeSuggestion[];       // 3 つ固定
  entryPaper: {
    pmid: string;                  // 精読推薦の論文
    why: string;                   // 80 字前後
  };
  usage?: { input: number; output: number };
}

const MAX_PAPERS = 5;                 // 提案に使う論文数 (上位 5 件)
const MAX_ABSTRACT_CHARS = 800;       // 各 abstract を切り詰め (コスト抑制)
const MAX_TOKENS = 900;               // 出力 JSON

function buildSystem(): string {
  return [
    'あなたは日本の大学生・大学院生の卒論・修論テーマアドバイザーです。',
    'ユーザーの興味 (日本語) と、PubMed で見つかった関連論文 (abstract 抜粋) を俯瞰し、',
    'ユーザーが実際に卒論・修論として取り組める研究テーマを 3 つ日本語で提案してください。',
    '',
    'ガイドライン:',
    '- テーマは大学生でも実施可能なスケール感 (質問紙調査、小規模実験、系統的レビュー、二次データ再解析など)',
    '- 抽象的な「〜の研究」ではなく「〜を大学生 100 人に質問紙で測定」レベルまで具体化する',
    '- 「日本人サンプルでの再現」「対象年齢を狭める」「独立変数を変える」「媒介変数を追加」「縦断化」などの切り口を意識',
    '- basedOnPmid は必ず論文リスト内の PMID を返す',
    '- entryPaper.pmid も論文リスト内から選ぶ',
    '- 医療助言はしない',
    '',
    '出力は STRICT JSON のみ、prose 一切なし。以下の shape:',
    '{',
    '  "interests": ["キーワード1", "キーワード2", "キーワード3"],',
    '  "themes": [',
    '    { "title": "テーマ 1 (30 字以内)", "why": "なぜ + どう検証 (100-150 字)", "basedOnPmid": "12345678" },',
    '    { "title": "...", "why": "...", "basedOnPmid": "..." },',
    '    { "title": "...", "why": "...", "basedOnPmid": "..." }',
    '  ],',
    '  "entryPaper": { "pmid": "12345678", "why": "この論文を入り口に推す理由 (80 字前後)" }',
    '}',
  ].join('\n');
}

function buildUserMessage(userQuery: string, papers: ThemeSuggestPaper[]): string {
  const paperBlocks = papers.map((p, i) => {
    const meta = [p.journal, p.year].filter(Boolean).join(' ');
    const abs = p.abstract.length > MAX_ABSTRACT_CHARS
      ? p.abstract.slice(0, MAX_ABSTRACT_CHARS) + '…'
      : p.abstract;
    return [
      `${i + 1}. PMID:${p.pmid}`,
      `   タイトル: ${p.title}`,
      `   著者: ${p.authors.slice(0, 3).join(', ')}${p.authors.length > 3 ? ' 他' : ''}`,
      meta ? `   Journal: ${meta}` : '',
      `   Abstract: ${abs || '(なし)'}`,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  return [
    `ユーザーの興味 (日本語で入力された検索クエリ): ${userQuery}`,
    '',
    `以下は PubMed 検索の上位 ${papers.length} 本です:`,
    '',
    paperBlocks,
    '',
    'このユーザーが卒論・修論として実行可能な研究テーマを 3 つ、上の JSON 形式で答えてください。',
  ].join('\n');
}

export async function suggestThemes(
  apiKey: string,
  userQuery: string,
  papers: ThemeSuggestPaper[],
): Promise<ThemeSuggestResult> {
  if (papers.length === 0) throw new Error('papers が空です');
  const usePapers = papers.slice(0, MAX_PAPERS);

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: MAX_TOKENS,
    system: buildSystem(),
    messages: [{ role: 'user', content: buildUserMessage(userQuery, usePapers) }],
  });

  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    throw new Error('Claude 応答に text ブロックがありません');
  }
  const cleaned = block.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed: ThemeSuggestResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`JSON パース失敗: ${cleaned.slice(0, 200)}`);
  }

  // 最低限のバリデーション
  if (!Array.isArray(parsed.interests) || parsed.interests.length === 0) {
    throw new Error('interests が空 or 不正');
  }
  if (!Array.isArray(parsed.themes) || parsed.themes.length !== 3) {
    throw new Error(`themes は 3 件必要 (実際: ${parsed.themes?.length})`);
  }
  const validPmids = new Set(usePapers.map((p) => p.pmid));
  for (const t of parsed.themes) {
    if (!t.title || !t.why || !t.basedOnPmid) {
      throw new Error('theme に必須フィールド欠損');
    }
    if (!validPmids.has(t.basedOnPmid)) {
      // Claude が hallucinate した pmid の場合、最初の論文にフォールバック
      t.basedOnPmid = usePapers[0].pmid;
    }
  }
  if (!parsed.entryPaper?.pmid || !parsed.entryPaper?.why) {
    throw new Error('entryPaper が不正');
  }
  if (!validPmids.has(parsed.entryPaper.pmid)) {
    parsed.entryPaper.pmid = usePapers[0].pmid;
  }

  return {
    ...parsed,
    usage: res.usage
      ? { input: res.usage.input_tokens, output: res.usage.output_tokens }
      : undefined,
  };
}
