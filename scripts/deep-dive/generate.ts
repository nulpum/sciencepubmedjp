// deep-dive generator: PubMed で複数論文を横断的にまとめた review 記事を生成する。
// 通常の 1 記事=1 PMID の trivia とは別枠の "SEO 磁石" 用。月 1-2 本の運用想定。
//
// 使い方:
//   npx tsx scripts/deep-dive/generate.ts \
//     --query="probiotics AND diarrhea" \
//     --lang=en \
//     --category=biology \
//     --slug=probiotics-diarrhea-evidence \
//     --title-hint="Probiotics for Diarrhea" \
//     --n=10

import '../lib/env.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { fetchArticle, isUsable, pubmedUrl } from '../pubmed/fetch.js';
import { Logger } from '../lib/logger.js';
import type { PubmedArticle } from '../types.js';

interface Args {
  query: string;
  lang: 'ja' | 'en';
  category: 'psychology' | 'biology';
  slug: string;
  titleHint: string;
  n: number;
}

function parseArgs(): Args {
  const get = (key: string): string | undefined => {
    const a = process.argv.find((x) => x.startsWith(`--${key}=`));
    return a?.split('=').slice(1).join('=');
  };
  const query = get('query');
  const lang = get('lang') as 'ja' | 'en' | undefined;
  const category = get('category') as 'psychology' | 'biology' | undefined;
  const slug = get('slug');
  const titleHint = get('title-hint');
  const n = Number(get('n') || '10');
  if (!query) throw new Error('--query は必須');
  if (!lang || (lang !== 'ja' && lang !== 'en')) throw new Error('--lang=ja|en');
  if (!category || (category !== 'psychology' && category !== 'biology'))
    throw new Error('--category=psychology|biology');
  if (!slug) throw new Error('--slug は必須');
  if (!titleHint) throw new Error('--title-hint は必須');
  return { query, lang, category, slug, titleHint, n: Math.min(Math.max(n, 3), 15) };
}

async function fetchPmids(query: string, n: number): Promise<string[]> {
  const tool = process.env.PUBMED_TOOL || 'pubmed-trivia';
  const email = process.env.PUBMED_EMAIL || 'dev@example.com';
  const apiKey = process.env.PUBMED_API_KEY;
  const params = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmode: 'json',
    retmax: String(n),
    sort: 'relevance',
    tool,
    email,
  });
  if (apiKey) params.set('api_key', apiKey);
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`;
  Logger.info(`esearch (deep-dive) query="${query}" n=${n}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`esearch failed: ${res.status}`);
  const json = (await res.json()) as { esearchresult: { idlist?: string[] } };
  const ids = json.esearchresult?.idlist ?? [];
  if (ids.length === 0) throw new Error('検索結果が 0 件');
  Logger.info(`  → ${ids.length} PMIDs fetched`);
  return ids;
}

async function fetchAll(pmids: string[]): Promise<PubmedArticle[]> {
  const out: PubmedArticle[] = [];
  for (const pmid of pmids) {
    try {
      const a = await fetchArticle(pmid);
      if (isUsable(a)) {
        out.push(a);
        Logger.info(`  ✓ PMID ${pmid} — ${a.title.slice(0, 80)}`);
      } else {
        Logger.warn(`  ✗ PMID ${pmid} — unusable (short/retracted)`);
      }
    } catch (e) {
      Logger.warn(`  ✗ PMID ${pmid} — fetch failed: ${(e as Error).message}`);
    }
  }
  if (out.length < 3) throw new Error(`使えるアブスト ${out.length} 件、少なすぎ`);
  return out;
}

function buildSystemPrompt(lang: 'ja' | 'en'): string {
  if (lang === 'en') {
    return `You are a senior science writer producing an evidence-review article for a general audience on a science-trivia site. You synthesize multiple PubMed abstracts into ONE cohesive, engaging long-form article.

CONSTRAINTS:
- 1800-2500 words total
- Neutral, accurate, no medical advice
- Cite specific studies inline as [PMID XXXXX] where relevant — every claim traceable
- Structure the body with clear H2 sections (##)
- Use plain English; explain jargon briefly on first use
- Balance mechanistic explanation with practical takeaways
- End with clear "Limitations" and "Bottom line" sections

STRUCTURE (H2 sections):
## What we're looking at
## The evidence — what studies actually found
## How it might work — biological mechanisms
## Where the evidence is strong (and weak)
## Practical takeaways
## Limitations of this review
## Studies referenced

The "Studies referenced" section MUST list each cited PMID with a 1-2 sentence description and a full PubMed link like: "- [PMID XXXXX](https://pubmed.ncbi.nlm.nih.gov/XXXXX/) — ..."

OUTPUT FORMAT: strict JSON with exactly these keys:
{
  "title": "SEO-friendly title <= 70 chars, includes core keyword",
  "fact": "1-sentence hook <= 200 chars for OGP/meta-description",
  "body": "The full Markdown body starting with the first ## section"
}
No prose outside the JSON. No code fences.`;
  }
  return `あなたは 科学サイエンス系トリビアサイトの シニアライターです。PubMed の複数のアブストラクトを 統合し、一般読者向けの 深堀り "エビデンスレビュー" 記事を 1 本 生成します。

制約:
- 総文字数 3000-4500 字
- 中立・正確、医療アドバイスは行わない
- 個々の研究を [PMID XXXXX] で 本文中に inline citation
- H2 セクション (##) で 明確に構造化
- 専門用語は 初出で 短く 解説
- メカニズムと 実生活への示唆の 両方を バランスよく
- 最後に「限界」「まとめ」セクション

構造 (H2):
## この記事で見ていくこと
## 研究が示していること
## 生物学的メカニズム — なぜそうなるのか
## エビデンスが強い部分と弱い部分
## 日常生活での示唆
## この総説の限界
## 引用した研究

「引用した研究」セクションでは 各 PMID を 1-2 文の説明とともに:
"- [PMID XXXXX](https://pubmed.ncbi.nlm.nih.gov/XXXXX/) — ..." 形式でリスト。

出力形式: 厳密な JSON、以下のキーのみ:
{
  "title": "SEO を意識したタイトル、70字以内、コアキーワード含む",
  "fact": "OGP/meta description 用の 200 字以内 の フック 1 文",
  "body": "完全な Markdown 本文、最初の ## セクションから始まる"
}
JSON の外に散文を書かない。コードフェンスも付けない。`;
}

function buildUserPrompt(articles: PubmedArticle[], titleHint: string, query: string): string {
  const digest = articles
    .map((a, i) => {
      const meta = `[${i + 1}] PMID ${a.pmid} | ${a.journal ?? 'Journal N/A'} | ${a.year ?? 'Year N/A'}`;
      return `${meta}\nTitle: ${a.title}\nAbstract: ${a.abstract}\n`;
    })
    .join('\n---\n');
  return `TOPIC: ${titleHint}
PubMed query used: ${query}
Number of studies to synthesize: ${articles.length}

Below are the ${articles.length} PubMed abstracts. Synthesize them into ONE cohesive evidence-review article per the system prompt. Cite EVERY study at least once as [PMID XXXXX] inline.

${digest}`;
}

interface Generated {
  title: string;
  fact: string;
  body: string;
}

async function generate(articles: PubmedArticle[], lang: 'ja' | 'en', titleHint: string, query: string): Promise<Generated> {
  const rawKey = process.env.ANTHROPIC_API_KEY;
  if (!rawKey) throw new Error('ANTHROPIC_API_KEY 未設定');
  const client = new Anthropic({ apiKey: rawKey.trim() });
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';
  Logger.info(`Claude 呼び出し: model=${model}, lang=${lang}, articles=${articles.length}`);
  const res = await client.messages.create({
    model,
    max_tokens: 8000,
    system: buildSystemPrompt(lang),
    messages: [{ role: 'user', content: buildUserPrompt(articles, titleHint, query) }],
  });
  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('text block なし');
  const cleaned = block.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const obj = JSON.parse(cleaned) as Generated;
  if (!obj.title || !obj.fact || !obj.body) throw new Error('title/fact/body 揃わず');
  Logger.info(`  ✓ 生成成功: title="${obj.title.slice(0, 60)}..." body ${obj.body.length} chars`);
  return obj;
}

async function writeArticle(
  gen: Generated,
  args: Args,
  primaryPmid: string,
  primaryArticle: PubmedArticle,
): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `${dateStr}-${args.slug}.md`;
  const dir = join(process.cwd(), 'src', 'content', args.lang, args.category);
  await mkdir(dir, { recursive: true });
  const path = join(dir, fileName);

  const fm: string[] = [
    '---',
    `pmid: "${primaryPmid}"`,
    `category: ${args.category}`,
    `lang: ${args.lang}`,
    `title: ${JSON.stringify(gen.title)}`,
    `fact: ${JSON.stringify(gen.fact)}`,
    `source_url: ${JSON.stringify(pubmedUrl(primaryPmid))}`,
  ];
  if (primaryArticle.journal) fm.push(`journal: ${JSON.stringify(primaryArticle.journal)}`);
  if (primaryArticle.year) fm.push(`year: ${primaryArticle.year}`);
  fm.push(`generated_at: ${JSON.stringify(new Date().toISOString())}`);
  fm.push('---', '', gen.body.trim(), '');

  await writeFile(path, fm.join('\n'), 'utf8');
  return path;
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(`=== deep-dive generate 開始 ===`);
  Logger.info(`  query=${args.query}, lang=${args.lang}, category=${args.category}`);
  Logger.info(`  slug=${args.slug}, title-hint="${args.titleHint}", n=${args.n}`);

  const pmids = await fetchPmids(args.query, args.n);
  const articles = await fetchAll(pmids);
  const gen = await generate(articles, args.lang, args.titleHint, args.query);
  const primary = articles[0];
  const path = await writeArticle(gen, args, primary.pmid, primary);
  Logger.info(`✅ 書き出し: ${path}`);
  Logger.info(`  primary PMID: ${primary.pmid}`);
  Logger.info(`  cited: ${articles.length} studies`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
