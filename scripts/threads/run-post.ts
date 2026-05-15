// CLI: 未投稿記事を 1 本選んで Threads に投稿
//
// 使い方:
//   npm run post:threads                              # ランダム選定で投稿
//   npm run post:threads -- --lang=ja --category=psychology
//   npm run post:threads -- --strategy=oldest         # 一番古い未投稿
//   npm run post:threads -- --dry-run                 # 実投稿せず内容のみ確認
//
// 失敗時は exit 1、成功時は exit 0。

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { selectArticleForPost } from './select-article.js';
import { formatThreadsPost } from './format-post.js';
import { postToThreads, dryRunThreads } from './post.js';
import { recordPost } from './posted-tracker.js';
import { ALL_CATEGORIES, type Category } from '../types.js';

interface CliArgs {
  lang?: 'ja' | 'en';
  category?: Category;
  strategy?: 'random' | 'newest' | 'oldest';
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const find = (prefix: string): string | undefined =>
    args.find((a) => a.startsWith(prefix))?.split('=')[1];

  const langStr = find('--lang=');
  const lang = langStr === 'ja' || langStr === 'en' ? langStr : undefined;

  const catStr = find('--category=') as Category | undefined;
  const category =
    catStr && ALL_CATEGORIES.includes(catStr) ? catStr : undefined;

  const stratStr = find('--strategy=');
  const strategy =
    stratStr === 'newest' || stratStr === 'oldest' || stratStr === 'random'
      ? stratStr
      : undefined;

  return {
    lang,
    category,
    strategy,
    dryRun: args.includes('--dry-run'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(`run-post: lang=${args.lang ?? 'any'} category=${args.category ?? 'any'} strategy=${args.strategy ?? 'random'} dry-run=${args.dryRun}`);

  const article = await selectArticleForPost({
    lang: args.lang ?? 'ja', // 既定は日本語
    category: args.category,
    strategy: args.strategy,
  });

  if (!article) {
    Logger.warn('未投稿の記事がありません');
    return;
  }

  Logger.info(`選定: ${article.slug} (${article.lang}/${article.category}) "${article.title.slice(0, 40)}…"`);

  const text = formatThreadsPost(article);

  if (args.dryRun) {
    dryRunThreads(text);
    return;
  }

  // 実投稿
  const { threadId } = await postToThreads(text);

  await recordPost({
    slug: article.slug,
    lang: article.lang,
    category: article.category,
    postedAt: new Date().toISOString(),
    threadId,
  });
  Logger.info(`✅ 投稿完了 + 履歴に記録: thread_id=${threadId}`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
