// ファイル I/O ユーティリティ
// - raw PubMed JSON は out/raw/ に置く（gitignore）
// - 生成済み記事 Markdown は src/content/{lang}/{category}/ に置く（commit）

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Category, GeneratedArticle, Lang, PubmedArticle } from '../types.js';

const ROOT = process.cwd();

export const PATHS = {
  rawDir: join(ROOT, 'out', 'raw'),
  contentDir: (lang: Lang, category: Category) =>
    join(ROOT, 'src', 'content', lang, category),
};

async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function writeRawArticle(article: PubmedArticle): Promise<string> {
  await ensureDir(PATHS.rawDir);
  const path = join(PATHS.rawDir, `${article.pmid}.json`);
  await writeFile(path, JSON.stringify(article, null, 2), 'utf8');
  return path;
}

export async function readRawArticle(pmid: string): Promise<PubmedArticle | null> {
  const path = join(PATHS.rawDir, `${pmid}.json`);
  if (!(await exists(path))) return null;
  return JSON.parse(await readFile(path, 'utf8')) as PubmedArticle;
}

// frontmatter + 本文を Markdown として書き出す
export async function writeGeneratedArticle(
  article: GeneratedArticle,
  slug: string,
): Promise<string> {
  const dir = PATHS.contentDir(article.lang, article.category);
  await ensureDir(dir);
  const path = join(dir, `${slug}.md`);

  const lines: (string | null)[] = [
    '---',
    `pmid: "${article.pmid}"`,
    `category: ${article.category}`,
    `lang: ${article.lang}`,
    `title: ${JSON.stringify(article.title)}`,
    `fact: ${JSON.stringify(article.fact)}`,
    `source_url: ${JSON.stringify(article.sourceUrl)}`,
    article.journal ? `journal: ${JSON.stringify(article.journal)}` : null,
    article.year ? `year: ${article.year}` : null,
    `generated_at: ${JSON.stringify(article.generatedAt)}`,
  ];

  // Phase 2: PA-API で取得した関連書籍 (あれば)
  if (article.affiliateLinks && article.affiliateLinks.length > 0) {
    lines.push('affiliate_links:');
    for (const link of article.affiliateLinks) {
      lines.push(`  - title: ${JSON.stringify(link.title)}`);
      lines.push(`    url: ${JSON.stringify(link.url)}`);
    }
  }

  lines.push('---', '', article.body.trim(), '');

  const fm = lines.filter((l) => l !== null).join('\n');

  await writeFile(path, fm, 'utf8');
  return path;
}

export function dirOf(p: string): string {
  return dirname(p);
}
