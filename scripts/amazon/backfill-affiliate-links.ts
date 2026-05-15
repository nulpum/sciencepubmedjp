// 既存の Markdown 記事に affiliate_links が無いものを検出し、
// PA-API or フォールバック (検索 URL) で 2 本注入する。
//
// 使い方: npm run gen:backfill-affiliate
//
// - 既に affiliate_links が入ってる記事はスキップ
// - frontmatter は単純な key:value 形式なので正規表現で解析
// - Claude API は呼ばない (キーワード抽出はタイトルだけで行う)

import '../lib/env.js';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '../lib/logger.js';
import { selectRelatedBooks } from './select-books.js';
import { readRawArticle } from '../lib/files.js';
import { ALL_CATEGORIES, ALL_LANGS, type Category, type Lang, type PubmedArticle } from '../types.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

interface ParsedFrontmatter {
  pmid: string;
  category: Category;
  lang: Lang;
  title: string;
  hasAffiliateLinks: boolean;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try {
      // JSON.parse で正しくエスケープ解除
      return JSON.parse(t);
    } catch {
      return t.slice(1, -1);
    }
  }
  return t;
}

function parseFrontmatter(content: string): ParsedFrontmatter | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = m[1];

  const get = (key: string): string | null => {
    const re = new RegExp(`^${key}:\\s*(.*)$`, 'm');
    const mm = fm.match(re);
    return mm ? unquote(mm[1]) : null;
  };

  const pmid = get('pmid');
  const category = get('category') as Category | null;
  const lang = get('lang') as Lang | null;
  const title = get('title');
  const hasAffiliateLinks = /^affiliate_links\s*:/m.test(fm);

  if (!pmid || !category || !lang || !title) return null;
  if (!ALL_CATEGORIES.includes(category)) return null;
  if (!ALL_LANGS.includes(lang)) return null;
  return { pmid, category, lang, title, hasAffiliateLinks };
}

// フォールバック型 (検索 URL `/s?k=`) の affiliate_links だけを剥がす。
// 特定書籍 (dp/XXXX 形式) の affiliate_links はそのまま残す。
function stripFallbackAffiliateLinks(content: string): string | null {
  const re = /^affiliate_links:\s*$\r?\n(?:  - title:.*\r?\n    url:.*\r?\n)+/m;
  const match = content.match(re);
  if (!match) return null;
  if (!match[0].includes('/s?k=')) return null; // 特定書籍ならスキップ
  return content.replace(re, '');
}

async function processFile(filePath: string): Promise<'updated' | 'replaced' | 'skipped-has' | 'skipped-parse' | 'skipped-nobooks'> {
  const original = await readFile(filePath, 'utf8');
  // フォールバック型なら剥がして再生成対象にする
  const strippedContent = stripFallbackAffiliateLinks(original);
  const content = strippedContent ?? original;
  const wasReplaced = strippedContent !== null;

  const parsed = parseFrontmatter(content);
  if (!parsed) return 'skipped-parse';
  if (parsed.hasAffiliateLinks) return 'skipped-has';

  // 元の PubMed 英語タイトルが out/raw/{pmid}.json にあれば優先的に使う
  // 理由: 日本語タイトルは助詞含みで Amazon 検索が機能しにくい
  let titleForKeywords = parsed.title;
  const rawJson = await readRawArticle(parsed.pmid);
  if (rawJson?.title) titleForKeywords = rawJson.title;

  const fakeArticle: PubmedArticle = {
    pmid: parsed.pmid,
    title: titleForKeywords,
    abstract: '',
    fetchedAt: new Date().toISOString(),
  };

  const books = await selectRelatedBooks(fakeArticle, parsed.category, 2, parsed.lang);
  if (books.length === 0) return 'skipped-nobooks';

  const affBlock = [
    'affiliate_links:',
    ...books.flatMap((b) => [
      `  - title: ${JSON.stringify(b.title)}`,
      `    url: ${JSON.stringify(b.url)}`,
    ]),
  ].join('\n');

  // frontmatter の closing --- の直前に挿入
  const newContent = content.replace(/^(---\r?\n[\s\S]*?)(\r?\n---)/, `$1\n${affBlock}$2`);

  await writeFile(filePath, newContent, 'utf8');
  return wasReplaced ? 'replaced' : 'updated';
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else if (entry.name.endsWith('.md')) files.push(p);
  }
  return files;
}

async function main(): Promise<void> {
  const files = await walk(CONTENT_DIR);
  Logger.info(`${files.length} ファイル検出`);

  const counts = {
    updated: 0,
    replaced: 0,
    'skipped-has': 0,
    'skipped-parse': 0,
    'skipped-nobooks': 0,
  };
  for (const file of files) {
    const result = await processFile(file);
    counts[result]++;
    if (result === 'updated' || result === 'replaced') {
      Logger.info(`${result === 'replaced' ? '~' : '+'} ${file}`);
    }
  }

  Logger.info(
    `完了: 新規=${counts.updated} 差替=${counts.replaced} 既存=${counts['skipped-has']} 解析失敗=${counts['skipped-parse']} 書籍ゼロ=${counts['skipped-nobooks']}`,
  );
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
