// Thin article augmentation
//
// 目的: 本文 <1500 chars の 薄い記事 を Claude Sonnet 4.5 で 深掘り章 を 追加
//       (AdSense 2026-10-10 「有用性の低いコンテンツ」判定 対策)
//
// 既存 body の 末尾 に 以下 4 章を 挿入 (「## Studies referenced」や 「## FAQ:」
// セクション が あれば その 直前):
//   - ## 背景: なぜ この研究が 重要か
//   - ## メカニズム: 著者が 示唆する 因果経路
//   - ## 限界と 批判的視点
//   - ## 読み手に とっての 示唆
//
// 対象記事は frontmatter に `augmented: true` を 追加して idempotent にする。
//
// 使い方:
//   npm run augment:thin                     # 全対象 を 連続実行 (本番)
//   npm run augment:thin -- --max=50         # 50 本だけ
//   npm run augment:thin -- --dry-run        # 書き込まず log のみ
//   npm run augment:thin -- --threshold=1500 # 文字数しきい値 (default 1500)
//
// モデル: Sonnet 4.5 (CLAUDE_MODEL env で 上書き可)
// コスト目安: 292 本 × ~1k 出力トークン × $0.015/1k = ~$5-8

import '../lib/env.js';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../lib/logger.js';
import { fetchArticle } from '../pubmed/fetch.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

interface Args {
  max: number;
  dryRun: boolean;
  threshold: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (k: string) => argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
  return {
    max: Number(get('max') || '10000'),
    dryRun: argv.includes('--dry-run'),
    threshold: Number(get('threshold') || '1500'),
  };
}

interface Target {
  path: string;
  lang: 'ja' | 'en';
  category: 'psychology' | 'biology';
  pmid: string;
  title: string;
  fact: string;
  frontmatter: string;
  body: string;
  bodyChars: number;
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

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try { return JSON.parse(t); } catch { return t.slice(1, -1); }
  }
  return t;
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
  const pmid = get('pmid');
  const lang = get('lang') as 'ja' | 'en' | null;
  const category = get('category') as 'psychology' | 'biology' | null;
  const title = get('title');
  const fact = get('fact');
  if (!pmid || !lang || !category || !title || !fact) return null;
  return {
    path, lang, category, pmid, title, fact,
    frontmatter: fm, body, bodyChars: body.length,
  };
}

function alreadyAugmented(target: Target): boolean {
  return /^augmented:\s*true\s*$/m.test(target.frontmatter);
}

function buildSystemPrompt(lang: 'ja' | 'en'): string {
  if (lang === 'ja') {
    return `あなたは PubMed 掲載の 査読論文を 題材にした 一般読者向け 解説記事の 編集者です。
既存の 短い記事を 読み、同じ 論文に 対する **追加 4 章** を 作成します。
以下 の 4 セクション を **厳密に** 出力してください:

## 背景: この研究が 問われる 文脈
→ 研究テーマ の 社会的・学術的 意義 (2-3 段落)

## メカニズム: 著者が 示唆する 因果経路
→ 論文で 示された (または 示唆された) 生物学的・心理学的 メカニズム (2-3 段落)

## 限界と 批判的視点
→ サンプルサイズ、デザイン、一般化可能性、交絡の可能性 (2-3 段落)

## 読み手にとっての示唆
→ 一般読者 (大学生/研究者 想定) が この知見を どう 活用できるか (2-3 段落)

**制約**:
- 元 abstract と 既存 body に 書かれている 事実のみ 使う (ハルシネーション 禁止)
- 薬機法 違反表現 (「必ず治る」「痩せる」等) 禁止
- 医療 助言 禁止 (「医師に相談を」と 促す)
- 章ごとに 300-500 字、合計 1,500-2,000 字 目安
- 数値は 元論文の 記述を 尊重、新規数値を 捏造しない
- 既存 body と 重複する 表現を 避ける

出力は **Markdown のみ** (前置き・後置き なし、"## 背景:" から 始める)。`;
  }
  return `You are an editor for a general-audience science explainer site built on peer-reviewed PubMed papers.
Read the existing short article and produce **4 additional sections** on the same paper.
Output EXACTLY these 4 sections:

## Background: Why this research matters
→ Social and academic significance (2-3 paragraphs)

## Mechanism: Causal pathways the authors propose
→ Biological or psychological mechanism suggested by the paper (2-3 paragraphs)

## Limitations and critical perspective
→ Sample size, design, generalizability, confounding (2-3 paragraphs)

## What this means for readers
→ Practical implications for general readers (college students / researchers) (2-3 paragraphs)

**Constraints**:
- Use ONLY facts from the original abstract and existing body (no hallucination)
- No medical advice (direct readers to consult a physician for health decisions)
- 300-500 chars per section, 1,500-2,000 chars total
- Respect the paper's original numbers; do not fabricate new numbers
- Avoid duplicating the existing body wording

Output **Markdown only** (no preamble, no epilogue, start with "## Background:").`;
}

function buildUserPrompt(target: Target, abstract: string | null): string {
  const parts: string[] = [];
  parts.push(`# 元 論文 (PMID: ${target.pmid})`);
  parts.push('');
  if (abstract) {
    parts.push('## 原文 abstract');
    parts.push(abstract);
    parts.push('');
  }
  parts.push('## 既存 記事タイトル');
  parts.push(target.title);
  parts.push('');
  parts.push('## 既存 fact (リード文)');
  parts.push(target.fact);
  parts.push('');
  parts.push('## 既存 本文');
  parts.push(target.body);
  parts.push('');
  parts.push('---');
  parts.push('上記 を 踏まえ、system prompt で 指定された 4 章を 出力してください。');
  return parts.join('\n');
}

async function augment(target: Target): Promise<string> {
  const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';

  // Try to fetch original abstract (best-effort; skip on error)
  let abstract: string | null = null;
  try {
    const a = await fetchArticle(target.pmid);
    abstract = a.abstract || null;
  } catch (e) {
    Logger.warn(`  PubMed fetch 失敗 (PMID ${target.pmid}): ${(e as Error).message} — abstract なしで augment 続行`);
  }

  const res = await client.messages.create({
    model,
    max_tokens: 4000,
    system: buildSystemPrompt(target.lang),
    messages: [{ role: 'user', content: buildUserPrompt(target, abstract) }],
  });
  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('text block なし');
  return block.text.trim();
}

function insertAugmentation(target: Target, augmentation: string): string {
  // 既存 body の 末尾章 を 検出:
  //   「## Studies referenced」/「## FAQ」/「## 参考文献」/「## 元論文」 の 直前 に 挿入
  const markers = [
    /\n## Studies referenced/,
    /\n## FAQ[:\s]/,
    /\n## 参考文献/,
    /\n## 元論文/,
  ];
  let insertPos = target.body.length;
  for (const re of markers) {
    const m = target.body.match(re);
    if (m && m.index !== undefined && m.index < insertPos) {
      insertPos = m.index;
    }
  }

  const before = target.body.slice(0, insertPos).trimEnd();
  const after = target.body.slice(insertPos).trimStart();

  const parts: string[] = [];
  parts.push(before);
  parts.push('');
  parts.push(augmentation.trim());
  if (after) {
    parts.push('');
    parts.push(after);
  }
  parts.push('');
  return parts.join('\n');
}

function updateFrontmatter(fm: string): string {
  if (/^augmented:\s*true\s*$/m.test(fm)) return fm;
  // generated_at の 直後 に 追加
  const genMatch = fm.match(/^generated_at:.*$/m);
  if (genMatch && genMatch.index !== undefined) {
    const end = genMatch.index + genMatch[0].length;
    return fm.slice(0, end) + `\naugmented: true\naugmented_at: "${new Date().toISOString()}"` + fm.slice(end);
  }
  return fm + `\naugmented: true\naugmented_at: "${new Date().toISOString()}"`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(`augment-thin start: threshold=${args.threshold} max=${args.max} dry-run=${args.dryRun}`);

  const allPaths = await listAllMd();
  Logger.info(`全 .md: ${allPaths.length} ファイル`);

  const targets: Target[] = [];
  for (const p of allPaths) {
    const t = await parseMd(p);
    if (!t) continue;
    if (alreadyAugmented(t)) continue;
    if (t.bodyChars < args.threshold) targets.push(t);
  }
  // 短い順 (= 緊急度 高い順) に 処理
  targets.sort((a, b) => a.bodyChars - b.bodyChars);
  Logger.info(`対象 (<${args.threshold} chars, 未 augment): ${targets.length} 本`);

  const toProcess = targets.slice(0, args.max);
  Logger.info(`今回 処理: ${toProcess.length} 本`);

  let ok = 0, ng = 0;
  for (let i = 0; i < toProcess.length; i++) {
    const t = toProcess[i];
    const rel = t.path.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
    Logger.info(`[${i+1}/${toProcess.length}] ${rel} (${t.bodyChars} chars)`);
    try {
      const augmentation = await augment(t);
      const newBody = insertAugmentation(t, augmentation);
      const newFm = updateFrontmatter(t.frontmatter);
      const newContent = `---\n${newFm}\n---\n\n${newBody.trimStart()}`;
      if (args.dryRun) {
        Logger.info(`  [dry-run] body ${t.bodyChars} -> ${newBody.length} chars, +${augmentation.length} chars 追加`);
      } else {
        await writeFile(t.path, newContent, 'utf8');
        Logger.info(`  OK body ${t.bodyChars} -> ${newBody.length} chars`);
      }
      ok++;
    } catch (e) {
      Logger.error(`  失敗: ${(e as Error).message}`);
      ng++;
    }
    // レート制限 回避の ため 2 秒 待機
    if (i < toProcess.length - 1) await new Promise((r) => setTimeout(r, 2000));
  }

  Logger.info(`=== 完了: 成功 ${ok} / 失敗 ${ng} / 残り ${targets.length - toProcess.length} ===`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
