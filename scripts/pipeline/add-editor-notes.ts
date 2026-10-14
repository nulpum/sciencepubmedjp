// Editor's note generator
//
// 各記事に 2-3 文の 編集ノート を 付与する (E-E-A-T の 「編集者が 読んで 選んだ」signal 強化)。
// 文章パターン を 多様化 (「今月の 気になる 論文」「意外にも」「注意して 読みたい」等) し、
// template 感を 排除する。
//
// 使い方:
//   npm run add:editor-notes                          # 全件 連続実行 (本番)
//   npm run add:editor-notes -- --max=100             # 100 件
//   npm run add:editor-notes -- --concurrency=5       # 並列実行
//   npm run add:editor-notes -- --dry-run             # 書き込まず log
//
// idempotent: 既に editor_note が frontmatter に ある 記事は スキップ
// コスト: 635 件 × ~150 output tokens × $0.015/1k = ~$1.50 (Sonnet 4.5)

import '../lib/env.js';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../lib/logger.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

interface Args {
  max: number;
  concurrency: number;
  dryRun: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (k: string) => argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
  return {
    max: Number(get('max') || '10000'),
    concurrency: Math.max(1, Number(get('concurrency') || '1')),
    dryRun: argv.includes('--dry-run'),
  };
}

interface Target {
  path: string;
  lang: 'ja' | 'en';
  category: 'psychology' | 'biology';
  title: string;
  fact: string;
  bodyExcerpt: string;
  frontmatter: string;
  body: string;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try { return JSON.parse(t); } catch { return t.slice(1, -1); }
  }
  return t;
}

async function listAllMd(): Promise<string[]> {
  const out: string[] = [];
  for (const lang of ['ja', 'en'] as const) {
    for (const cat of ['psychology', 'biology'] as const) {
      const dir = join(CONTENT_DIR, lang, cat);
      try {
        const files = await readdir(dir);
        for (const f of files) if (f.endsWith('.md')) out.push(join(dir, f));
      } catch {}
    }
  }
  return out;
}

async function parseMd(path: string): Promise<Target | null> {
  const raw = await readFile(path, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const body = m[2];
  const get = (k: string): string | null => {
    const re = new RegExp(`^${k}:\\s*(.*)$`, 'm');
    const mm = fm.match(re);
    return mm ? unquote(mm[1]) : null;
  };
  const lang = get('lang') as 'ja' | 'en' | null;
  const category = get('category') as 'psychology' | 'biology' | null;
  const title = get('title');
  const fact = get('fact');
  if (!lang || !category || !title || !fact) return null;
  return {
    path, lang, category, title, fact,
    bodyExcerpt: body.slice(0, 1500),  // first 1500 chars enough for context
    frontmatter: fm, body,
  };
}

function hasEditorNote(target: Target): boolean {
  return /^editor_note:\s*/m.test(target.frontmatter);
}

// 15 variations in opening pattern to avoid template feel
const JA_OPENING_PATTERNS = [
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
const EN_OPENING_PATTERNS = [
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

function buildUserPrompt(t: Target, patternHint: string): string {
  return [
    `# 記事情報`,
    ``,
    `## タイトル`,
    t.title,
    ``,
    `## リード (fact)`,
    t.fact,
    ``,
    `## 本文の 冒頭`,
    t.bodyExcerpt,
    ``,
    `---`,
    t.lang === 'ja'
      ? `※ 編集ノートの 冒頭 は 「${patternHint}」の 発想で 書いてください (そのまま 使う 必要 なし、ニュアンス だけ 参考に)。`
      : `Note: start the editor's note in the spirit of: "${patternHint}" (you don't have to use the exact words, just the nuance).`,
  ].join('\n');
}

async function generate(t: Target, patternHint: string): Promise<string> {
  const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';
  const res = await client.messages.create({
    model,
    max_tokens: 500,
    system: buildSystemPrompt(t.lang),
    messages: [{ role: 'user', content: buildUserPrompt(t, patternHint) }],
  });
  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('no text block');
  return block.text.trim();
}

function pickPatternHint(path: string, lang: 'ja' | 'en'): string {
  // Deterministic pick based on filename hash
  let h = 0;
  for (let i = 0; i < path.length; i++) h = (h * 31 + path.charCodeAt(i)) >>> 0;
  const list = lang === 'ja' ? JA_OPENING_PATTERNS : EN_OPENING_PATTERNS;
  return list[h % list.length];
}

function updateFrontmatter(fm: string, note: string): string {
  // Escape for YAML-safe quoting: use JSON.stringify which is YAML-compatible
  const quoted = JSON.stringify(note);
  const marker = fm.match(/^generated_at:.*$/m);
  if (marker && marker.index !== undefined) {
    const end = marker.index + marker[0].length;
    return fm.slice(0, end) + `\neditor_note: ${quoted}` + fm.slice(end);
  }
  return fm + `\neditor_note: ${quoted}`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(`add-editor-notes start: max=${args.max} concurrency=${args.concurrency} dry-run=${args.dryRun}`);

  const allPaths = await listAllMd();
  const targets: Target[] = [];
  for (const p of allPaths) {
    const t = await parseMd(p);
    if (!t) continue;
    if (hasEditorNote(t)) continue;
    targets.push(t);
  }
  Logger.info(`対象 (editor_note 未付与): ${targets.length} 本`);

  const toProcess = targets.slice(0, args.max);
  Logger.info(`今回処理: ${toProcess.length} 本 (concurrency=${args.concurrency})`);

  let ok = 0, ng = 0;
  const total = toProcess.length;
  let done = 0;

  async function processOne(t: Target): Promise<void> {
    const rel = t.path.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
    try {
      const hint = pickPatternHint(t.path, t.lang);
      const note = await generate(t, hint);
      // sanity: clip to 300 chars max to prevent runaway
      const safe = note.length > 300 ? note.slice(0, 297) + '…' : note;
      const newFm = updateFrontmatter(t.frontmatter, safe);
      const newContent = `---\n${newFm}\n---\n\n${t.body.trimStart()}`;
      if (args.dryRun) {
        done++;
        Logger.info(`[${done}/${total}] ${rel} note=${safe.length} chars (dry)`);
      } else {
        await writeFile(t.path, newContent, 'utf8');
        done++;
        Logger.info(`[${done}/${total}] OK ${rel} note=${safe.length} chars`);
      }
      ok++;
    } catch (e) {
      done++;
      Logger.error(`[${done}/${total}] 失敗 ${rel}: ${(e as Error).message}`);
      ng++;
    }
  }

  for (let i = 0; i < toProcess.length; i += args.concurrency) {
    const chunk = toProcess.slice(i, i + args.concurrency);
    await Promise.all(chunk.map((t) => processOne(t)));
    if (i + args.concurrency < toProcess.length) await new Promise((r) => setTimeout(r, 500));
  }

  Logger.info(`=== 完了: 成功 ${ok} / 失敗 ${ng} / 残り ${targets.length - toProcess.length} ===`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
