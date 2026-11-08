// FAQ セクション 追加 (deep-dive 記事 の PAA 対策)
//
// 深掘り記事 (-evidence suffix / highly-sensitive / mental-health) で ## FAQ が ない 記事に
// Claude Sonnet 4.5 で 5 Q&A を 生成 → ## Studies referenced の 直前 に 挿入。
//
// 使い方:
//   npm run add:faq
//   npm run add:faq -- --max=10 --concurrency=5 --dry-run

import '../lib/env.js';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../lib/logger.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

interface Args { max: number; concurrency: number; dryRun: boolean; }

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
  category: 'biology' | 'psychology';
  title: string;
  fact: string;
  bodyExcerpt: string;
  frontmatter: string;
  body: string;
  slug: string;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try { return JSON.parse(t); } catch { return t.slice(1, -1); }
  }
  return t;
}

async function listDeepDives(): Promise<string[]> {
  const out: string[] = [];
  for (const lang of ['ja', 'en'] as const) {
    for (const cat of ['psychology', 'biology'] as const) {
      const dir = join(CONTENT_DIR, lang, cat);
      try {
        const files = await readdir(dir);
        for (const f of files) {
          if (!f.endsWith('.md')) continue;
          const slug = f.replace(/\.md$/, '');
          if (/-evidence$/.test(slug) || /highly-sensitive/.test(slug) || /mental-health$/.test(slug)) {
            out.push(join(dir, f));
          }
        }
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
  const category = get('category') as 'biology' | 'psychology' | null;
  const title = get('title');
  const fact = get('fact');
  if (!lang || !category || !title || !fact) return null;
  const slug = path.split(/[\\/]/).pop()!.replace(/\.md$/, '');
  return { path, lang, category, title, fact, bodyExcerpt: body.slice(0, 3000), frontmatter: fm, body, slug };
}

function hasFaq(target: Target): boolean {
  return /^## FAQ[:\s]/m.test(target.body);
}

function buildSystemPrompt(lang: 'ja' | 'en'): string {
  if (lang === 'ja') {
    return `あなたは PubMed Trivia の 編集者 です。 深掘り記事 に 追加する FAQ セクション を 作成してください。

**目的**: Google の 「People Also Ask (PAA)」box に 選ばれる ような 質問-回答 を 5 件 生成し、
Rich Result として SERP に 表示されやすくする。

**フォーマット**:
出力 は Markdown のみ。 以下 の 形式 で 5 問 を 出力:

## FAQ: [記事トピック に 応じた 簡潔な FAQ タイトル]

### Q1 の 具体的な 質問文?

A1 の 回答 (2-4 段落、200-400 文字)。

### Q2 の 質問?

A2 の 回答...

...

### Q5 の 質問?

A5 の 回答...

**質問の 設計 方針**:
- 「何が」「なぜ」「どのように」「どれくらい」「誰に」のような PAA 的な 一般質問
- 記事の 本文 で 答えられる 内容 (ハルシネーション 禁止)
- 記事と 読者の 間で 「わかりにくそう」な ポイント を 先回り
- 薬機法 NG 表現 禁止
- 相関 を 因果 に 言い換えない

**制約**: 全体 1500-2500 文字。`;
  }
  return `You are an editor at PubMed Trivia. Create a FAQ section for this deep-dive article.

**Goal**: Generate 5 question-answer pairs in the "People Also Ask" style so Google's
PAA box might select them and the FAQPage Rich Result shows on SERP.

**Format**: Output Markdown only:

## FAQ: [concise FAQ title]

### Specific question 1?

Answer 1 (2-4 sentences, ~60-120 words, cite PMIDs from the article if helpful).

### Question 2?
Answer 2...
...
### Question 5?
Answer 5.

**Question design principles**:
- "What", "Why", "How", "How much", "Who" PAA-style questions
- Answers supported by article body (no hallucination)
- Pre-empt confusing points
- No medical-claims-law violations
- Do not upgrade correlation to causation

**Constraints**: Total 400-700 words.`;
}

async function generate(target: Target): Promise<string> {
  const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';

  const user = [
    `# 深掘り記事 情報`,
    ``,
    `## タイトル`,
    target.title,
    ``,
    `## リード (fact)`,
    target.fact,
    ``,
    `## 本文 (抜粋)`,
    target.bodyExcerpt,
    ``,
    `---`,
    target.lang === 'ja'
      ? 'この記事 の FAQ セクション (5 問) を 生成してください。'
      : 'Generate the FAQ section (5 Q&A) for this article.',
  ].join('\n');

  const res = await client.messages.create({
    model,
    max_tokens: 3000,
    system: buildSystemPrompt(target.lang),
    messages: [{ role: 'user', content: user }],
  });
  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('no text block');
  return block.text.trim();
}

function insertFaq(target: Target, faqSection: string): string {
  const refMarkers = [
    /\n## Studies referenced/,
    /\n## 参考文献/,
    /\n## 元論文/,
  ];
  let insertPos = target.body.length;
  for (const re of refMarkers) {
    const m = target.body.match(re);
    if (m && m.index !== undefined && m.index < insertPos) insertPos = m.index;
  }
  const before = target.body.slice(0, insertPos).trimEnd();
  const after = target.body.slice(insertPos).trimStart();
  const parts = [before, '', faqSection.trim(), ''];
  if (after) parts.push(after);
  parts.push('');
  return parts.join('\n');
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(`add-faq: max=${args.max} concurrency=${args.concurrency} dry=${args.dryRun}`);

  const paths = await listDeepDives();
  const targets: Target[] = [];
  for (const p of paths) {
    const t = await parseMd(p);
    if (!t) continue;
    if (hasFaq(t)) continue;
    targets.push(t);
  }
  Logger.info(`対象 (FAQ 無し): ${targets.length} 本`);

  const toProcess = targets.slice(0, args.max);
  Logger.info(`処理: ${toProcess.length} 本`);

  let ok = 0, ng = 0;
  const total = toProcess.length;
  let done = 0;

  async function processOne(t: Target): Promise<void> {
    const rel = t.path.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
    try {
      const faq = await generate(t);
      const newBody = insertFaq(t, faq);
      const newContent = `---\n${t.frontmatter}\n---\n\n${newBody.trimStart()}`;
      if (args.dryRun) {
        done++;
        Logger.info(`[${done}/${total}] dry ${rel} faq=${faq.length} chars`);
      } else {
        await writeFile(t.path, newContent, 'utf8');
        done++;
        Logger.info(`[${done}/${total}] OK ${rel} faq=${faq.length} chars`);
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
    if (i + args.concurrency < toProcess.length) await new Promise((r) => setTimeout(r, 1000));
  }

  Logger.info(`=== 完了: OK ${ok} / 失敗 ${ng} ===`);
}

main().catch((e) => { Logger.error(e); process.exit(1); });
