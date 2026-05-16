// CLI: src/content/ 配下の全記事に対して public/og/{slug}.png を生成 (冪等)
//
// 既に存在する PNG はスキップ (--force で再生成可)
//
// 使い方:
//   npm run generate:og              # 不足分のみ生成
//   npm run generate:og -- --force   # 全部再生成
//   npm run generate:og -- --size=square  # Instagram 用 1080x1080

import '../lib/env.js';
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { Logger } from '../lib/logger.js';
import { renderCardPng, type CardSize } from './render-card.js';
import type { Category } from '../types.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');
const PUBLIC_DIR = join(process.cwd(), 'public');

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

interface Meta {
  slug: string;
  category: Category;
  fact: string;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
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

function parseMeta(content: string): Pick<Meta, 'category' | 'fact'> | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = m[1];
  const get = (key: string): string | null => {
    const re = new RegExp(`^${key}:\\s*(.*)$`, 'm');
    const mm = fm.match(re);
    return mm ? unquote(mm[1]) : null;
  };
  const category = get('category') as Category | null;
  const fact = get('fact');
  if (!category || !fact) return null;
  return { category, fact };
}

interface Args {
  force: boolean;
  size: CardSize;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const sizeArg = args.find((a) => a.startsWith('--size='));
  const size = (sizeArg?.split('=')[1] as CardSize) || 'og';
  return {
    force: args.includes('--force'),
    size,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const baseOutDir = join(PUBLIC_DIR, args.size); // public/og or public/square

  const files = await listMarkdown(CONTENT_DIR);
  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    // file 例: src/content/ja/psychology/20260513-39940306.md
    const slug = basename(file).replace(/\.md$/, '');
    // lang はファイルパスから抽出 (src/content/{lang}/{cat}/...)
    const langMatch = file.match(/[\\/]content[\\/](ja|en)[\\/]/);
    const lang = (langMatch?.[1] || 'ja') as 'ja' | 'en';

    const outDir = join(baseOutDir, lang);
    await mkdir(outDir, { recursive: true });
    const outPath = join(outDir, `${slug}.png`);

    if (!args.force && (await exists(outPath))) {
      skipped++;
      continue;
    }

    const content = await readFile(file, 'utf8');
    const meta = parseMeta(content);
    if (!meta) {
      Logger.warn(`parseMeta 失敗: ${file}`);
      continue;
    }

    try {
      const png = await renderCardPng({
        fact: meta.fact,
        category: meta.category,
        size: args.size,
      });
      await writeFile(outPath, png);
      generated++;
      if (generated % 20 === 0) Logger.info(`progress: ${generated} 生成`);
    } catch (e) {
      Logger.error(`render 失敗 ${slug} (${lang}): ${(e as Error).message}`);
    }
  }

  Logger.info(`完了: 生成=${generated} スキップ=${skipped} (size=${args.size})`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
