// 投稿対象の記事を選定する (プラットフォーム横断で再利用可)
//
// 1. src/content/{lang}/{category}/ から全 .md を列挙
// 2. 指定プラットフォームで未投稿のものに絞る
// 3. 戦略 (random/newest/oldest) に基づき 1 件返す

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from './logger.js';
import { isPosted, type Platform } from './posted-tracker.js';
import type { Category } from '../types.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

export interface ArticleMeta {
  pmid: string;
  category: Category;
  lang: 'ja' | 'en';
  title: string;
  fact: string;
  bodyExcerpt: string;
  journal?: string;
  year?: number;
  slug: string;
  generatedAt: string;
  affiliateLinks?: { title: string; url: string }[];
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try {
      return JSON.parse(t);
    } catch {
      return t.slice(1, -1);
    }
  }
  return t;
}

function parseArticle(filePath: string, content: string): ArticleMeta | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const body = m[2];

  const get = (key: string): string | null => {
    const re = new RegExp(`^${key}:\\s*(.*)$`, 'm');
    const mm = fm.match(re);
    return mm ? unquote(mm[1]) : null;
  };

  const pmid = get('pmid');
  const category = get('category') as Category | null;
  const lang = get('lang') as 'ja' | 'en' | null;
  const title = get('title');
  const fact = get('fact');
  const generatedAt = get('generated_at');
  const journal = get('journal') ?? undefined;
  const yearStr = get('year');
  if (!pmid || !category || !lang || !title || !fact || !generatedAt) return null;

  // affiliate_links 解析
  const affRegex = /^affiliate_links:\s*$\n((?:  - title:.*\n    url:.*\n)+)/m;
  const affMatch = fm.match(affRegex);
  const affiliateLinks: { title: string; url: string }[] = [];
  if (affMatch) {
    const entryRe = /  - title:\s*(.*)\n    url:\s*(.*)/g;
    let mm: RegExpExecArray | null;
    while ((mm = entryRe.exec(affMatch[1])) !== null) {
      affiliateLinks.push({ title: unquote(mm[1]), url: unquote(mm[2]) });
    }
  }

  const fileName = filePath.split(/[\\/]/).pop() ?? '';
  const slug = fileName.replace(/\.md$/, '');

  return {
    pmid,
    category,
    lang,
    title,
    fact,
    bodyExcerpt: body,
    journal,
    year: yearStr ? Number(yearStr) : undefined,
    slug,
    generatedAt,
    affiliateLinks,
  };
}

async function listMarkdown(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listMarkdown(p)));
    else if (entry.name.endsWith('.md')) files.push(p);
  }
  return files;
}

export interface SelectOptions {
  platform: Platform;
  lang?: 'ja' | 'en';
  category?: Category;
  strategy?: 'random' | 'newest' | 'oldest';
}

export async function selectArticleForPost(
  options: SelectOptions,
): Promise<ArticleMeta | null> {
  const { platform, lang, category, strategy = 'random' } = options;

  const all = await listMarkdown(CONTENT_DIR);
  const parsed: ArticleMeta[] = [];
  for (const f of all) {
    const content = await readFile(f, 'utf8');
    const a = parseArticle(f, content);
    if (a) parsed.push(a);
  }

  let candidates = parsed;
  if (lang) candidates = candidates.filter((a) => a.lang === lang);
  if (category) candidates = candidates.filter((a) => a.category === category);

  const unposted: ArticleMeta[] = [];
  for (const a of candidates) {
    if (!(await isPosted(a.slug, a.lang, platform))) unposted.push(a);
  }

  Logger.info(
    `select-article (${platform}): 候補 ${candidates.length} 件 → 未投稿 ${unposted.length} 件`,
  );
  if (unposted.length === 0) return null;

  if (strategy === 'random') {
    return unposted[Math.floor(Math.random() * unposted.length)];
  }
  const sorted = [...unposted].sort((a, b) =>
    strategy === 'newest'
      ? Date.parse(b.generatedAt) - Date.parse(a.generatedAt)
      : Date.parse(a.generatedAt) - Date.parse(b.generatedAt),
  );
  return sorted[0];
}
