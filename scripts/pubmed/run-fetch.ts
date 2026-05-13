// CLI: PubMed からランダム1件取得して out/raw/{PMID}.json に保存
// 使い方:  npm run gen:fetch -- --category=psychology
//          npm run gen:fetch -- --category=biology

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { writeRawArticle } from '../lib/files.js';
import { fetchOneByCategory } from './fetch.js';
import type { Category } from '../types.js';
import { ALL_CATEGORIES } from '../types.js';

function parseCategory(): Category {
  const arg = process.argv.find((a) => a.startsWith('--category='));
  const v = arg?.split('=')[1] as Category | undefined;
  if (!v || !ALL_CATEGORIES.includes(v)) {
    throw new Error(`--category は ${ALL_CATEGORIES.join('|')} のいずれかを指定してください`);
  }
  return v;
}

async function main(): Promise<void> {
  const category = parseCategory();
  Logger.info(`fetch start (category=${category})`);

  const article = await fetchOneByCategory(category);
  const path = await writeRawArticle(article);

  Logger.info(`saved: ${path}`);
  // stdout には PMID だけ出す → 後続のスクリプトに pipe しやすい
  process.stdout.write(article.pmid + '\n');
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
