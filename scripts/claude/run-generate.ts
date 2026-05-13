// CLI: 既存の out/raw/{PMID}.json から日英記事を生成して
// src/content/{lang}/{category}/{slug}.md に書き出す。
//
// 使い方: npm run gen:generate -- --pmid=12345678 --category=psychology

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { readRawArticle, writeGeneratedArticle } from '../lib/files.js';
import { buildSlug } from '../lib/slug.js';
import { generateBothLangs } from './generate.js';
import { ALL_CATEGORIES, type Category } from '../types.js';

function parseArgs(): { pmid: string; category: Category } {
  const pmidArg = process.argv.find((a) => a.startsWith('--pmid='));
  const catArg = process.argv.find((a) => a.startsWith('--category='));
  const pmid = pmidArg?.split('=')[1];
  const cat = catArg?.split('=')[1] as Category | undefined;
  if (!pmid) throw new Error('--pmid=XXXX を指定してください');
  if (!cat || !ALL_CATEGORIES.includes(cat)) {
    throw new Error(`--category は ${ALL_CATEGORIES.join('|')} のいずれか`);
  }
  return { pmid, category: cat };
}

async function main(): Promise<void> {
  const { pmid, category } = parseArgs();
  Logger.info(`generate start (pmid=${pmid}, category=${category})`);

  const raw = await readRawArticle(pmid);
  if (!raw) throw new Error(`out/raw/${pmid}.json が見つかりません。先に gen:fetch を実行してください`);

  const { ja, en } = await generateBothLangs(raw, category);
  const slug = buildSlug(pmid, raw.fetchedAt);

  const jaPath = await writeGeneratedArticle(ja, slug);
  const enPath = await writeGeneratedArticle(en, slug);

  Logger.info(`written: ${jaPath}`);
  Logger.info(`written: ${enPath}`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
