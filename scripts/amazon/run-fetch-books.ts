// CLI: PMID を指定して PA-API で関連書籍を検索する単体テスト用エントリ
// 使い方: npm run gen:fetch-books -- --pmid=40287119

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { readRawArticle } from '../lib/files.js';
import { selectRelatedBooks, extractKeywords } from './select-books.js';

async function main(): Promise<void> {
  const pmidArg = process.argv.find((a) => a.startsWith('--pmid='));
  const pmid = pmidArg?.split('=')[1];
  if (!pmid) throw new Error('--pmid=XXXXXXXX を指定してください');

  const raw = await readRawArticle(pmid);
  if (!raw) {
    throw new Error(
      `out/raw/${pmid}.json が見つかりません。先に gen:fetch を実行してください。`,
    );
  }

  Logger.info(`PMID=${pmid}: "${raw.title.slice(0, 80)}"`);
  Logger.info(`抽出キーワード: "${extractKeywords(raw)}"`);

  const books = await selectRelatedBooks(raw, 2);

  if (books.length === 0) {
    Logger.warn('該当書籍ゼロ (PA-API 失敗 or 全部 NG ガード)');
    return;
  }

  console.log('');
  console.log('=== 選定された書籍 ===');
  for (const b of books) {
    console.log(`- ${b.title}`);
    console.log(`  ${b.url}`);
  }
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
