// 投稿対象の記事を選定する
//
// 戦略:
// 1. src/content/{lang}/{category}/ から全 .md を列挙
// 2. posted.json で既投稿のものを除外
// 3. ランダムに 1 件選ぶ (古い記事を「再発見」してもらう狙い)
//    オプションで「新しい順」「古い順」も選べる
//
// 返すのは format-post.ts で使う ArticleMeta 形式。

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '../lib/logger.js';
import { isPosted } from './posted-tracker.js';
import type { ArticleMeta } from './format-post.js';
import type { Category } from '../types.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

interface ParsedArticle extends ArticleMeta {
  generatedAt: string;
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

function parseArticle(filePath: string, content: string): ParsedArticle | null {
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

  // affiliate_links 解析 (簡易)
  const affRegex = /^affiliate_links:\s*$\n((?:  - title:.*\n    url:.*\n)+)/m;
  const affMatch = fm.match(affRegex);
  const affiliateLinks: { title: string; url: string }[] = [];
  if (affMatch) {
    const entryRe = /  - title:\s*(.*)\n    url:\s*(.*)/g;
    let mm: RegExpExecArray | null;
    while ((mm = entryRe.exec(affMatch[1])) !== null) {
      affiliateLinks.push({
        title: unquote(mm[1]),
        url: unquote(mm[2]),
      });
    }
  }

  // slug = ファイル名 (拡張子なし)
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
    affiliateLinks,
    generatedAt,
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
  lang?: 'ja' | 'en';        // 言語フィルタ
  category?: Category;        // カテゴリフィルタ
  strategy?: 'random' | 'newest' | 'oldest';
}

export async function selectArticleForPost(
  options: SelectOptions = {},
): Promise<ArticleMeta | null> {
  const { lang, category, strategy = 'random' } = options;

  const all = await listMarkdown(CONTENT_DIR);
  const parsed: ParsedArticle[] = [];
  for (const f of all) {
    const content = await readFile(f, 'utf8');
    const article = parseArticle(f, content);
    if (article) parsed.push(article);
  }

  // 言語・カテゴリでフィルタ
  let candidates = parsed;
  if (lang) candidates = candidates.filter((a) => a.lang === lang);
  if (category) candidates = candidates.filter((a) => a.category === category);

  // 既投稿を除外
  const unposted: ParsedArticle[] = [];
  for (const a of candidates) {
    if (!(await isPosted(a.slug, a.lang))) unposted.push(a);
  }

  Logger.info(`select-article: 候補 ${candidates.length} 件 → 未投稿 ${unposted.length} 件`);

  if (unposted.length === 0) return null;

  // 戦略別に1件選ぶ
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
