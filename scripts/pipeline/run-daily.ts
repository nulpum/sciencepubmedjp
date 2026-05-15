// 一気通貫パイプライン: PubMed 取得 → 生 JSON 保存 → Claude 日英生成 → Markdown 書き出し
//
// 使い方:
//   npm run pipeline:daily -- --category=psychology
//   npm run pipeline:daily -- --category=biology
//   npm run pipeline:daily -- --category=all      # 両方を順に実行
//
// 失敗時はその category だけ skip して次に進む（cron で半端に止まらないように）。

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { writeRawArticle, writeGeneratedArticle } from '../lib/files.js';
import { buildSlug } from '../lib/slug.js';
import { fetchOneByCategory } from '../pubmed/fetch.js';
import { generateBothLangs } from '../claude/generate.js';
import { selectRelatedBooks } from '../amazon/select-books.js';
import { ALL_CATEGORIES, type Category } from '../types.js';

function parseCategoryArg(): Category[] {
  const arg = process.argv.find((a) => a.startsWith('--category='));
  const v = arg?.split('=')[1];
  if (!v) throw new Error(`--category は ${ALL_CATEGORIES.join('|')}|all を指定してください`);
  if (v === 'all') return [...ALL_CATEGORIES];
  if (!(ALL_CATEGORIES as readonly string[]).includes(v)) {
    throw new Error(`--category は ${ALL_CATEGORIES.join('|')}|all を指定してください`);
  }
  return [v as Category];
}

async function runOne(category: Category): Promise<void> {
  Logger.info(`=== pipeline start: category=${category} ===`);

  const raw = await fetchOneByCategory(category);
  const rawPath = await writeRawArticle(raw);
  Logger.info(`raw saved: ${rawPath}`);

  const { ja, en } = await generateBothLangs(raw, category);

  // Phase 2: PA-API で関連書籍を選定し、両言語の記事に注入
  // 失敗 (キーなし、throttle、書籍ヒットなし) してもパイプラインは止めない
  const books = await selectRelatedBooks(raw, 2);
  if (books.length > 0) {
    ja.affiliateLinks = books;
    en.affiliateLinks = books;
    Logger.info(`affiliate_links: ${books.length} 冊を注入`);
  }

  const slug = buildSlug(raw.pmid, raw.fetchedAt);
  const jaPath = await writeGeneratedArticle(ja, slug);
  const enPath = await writeGeneratedArticle(en, slug);

  Logger.info(`done: ${jaPath}`);
  Logger.info(`done: ${enPath}`);
}

async function main(): Promise<void> {
  const categories = parseCategoryArg();
  const failures: { category: Category; error: string }[] = [];

  for (const c of categories) {
    try {
      await runOne(c);
    } catch (e) {
      const msg = (e as Error).message;
      Logger.error(`category=${c} 失敗: ${msg}`);
      failures.push({ category: c, error: msg });
    }
  }

  if (failures.length > 0) {
    Logger.warn(`完了 (失敗 ${failures.length}/${categories.length}): ${JSON.stringify(failures)}`);
    process.exitCode = failures.length === categories.length ? 1 : 0;
  } else {
    Logger.info(`全 category 完了 (${categories.length} 件)`);
  }
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
