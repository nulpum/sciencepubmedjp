// CLI: 未投稿記事を 1 本選んで Facebook Page に投稿
//
// 使い方:
//   npm run post:facebook
//   npm run post:facebook -- --lang=ja --category=psychology
//   npm run post:facebook -- --strategy=oldest
//   npm run post:facebook -- --dry-run

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { selectArticleForPost } from '../lib/select-article.js';
import { recordPost } from '../lib/posted-tracker.js';
import { formatFacebookPost } from './format-post.js';
import { postToFacebook, dryRunFacebook } from './post.js';
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

  return { lang, category, strategy, dryRun: args.includes('--dry-run') };
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(
    `run-post (facebook): lang=${args.lang ?? 'any'} category=${args.category ?? 'any'} strategy=${args.strategy ?? 'random'} dry-run=${args.dryRun}`,
  );

  const article = await selectArticleForPost({
    platform: 'facebook',
    lang: args.lang ?? 'ja',
    category: args.category,
    strategy: args.strategy,
  });
  if (!article) {
    Logger.warn('未投稿の記事がありません');
    return;
  }

  Logger.info(
    `選定: ${article.slug} (${article.lang}/${article.category}) "${article.title.slice(0, 40)}…"`,
  );

  const post = formatFacebookPost(article);

  if (args.dryRun) {
    dryRunFacebook(post);
    return;
  }

  const { postId } = await postToFacebook(post);

  await recordPost({
    platform: 'facebook',
    slug: article.slug,
    lang: article.lang,
    category: article.category,
    postedAt: new Date().toISOString(),
    postId,
  });
  Logger.info(`✅ 投稿完了 + 履歴に記録: post_id=${postId}`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
