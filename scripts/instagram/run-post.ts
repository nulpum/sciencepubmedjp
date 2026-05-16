// CLI: 未投稿記事を 1 本選んで Instagram に投稿
//
// 使い方:
//   npm run post:instagram
//   npm run post:instagram -- --lang=ja --category=psychology
//   npm run post:instagram -- --strategy=oldest
//   npm run post:instagram -- --dry-run

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { selectArticleForPost } from '../lib/select-article.js';
import { recordPost } from '../lib/posted-tracker.js';
import { formatInstagramCaption } from './format-post.js';
import { postToInstagram, dryRunInstagram } from './post.js';
import { ALL_CATEGORIES, type Category } from '../types.js';

const SITE_URL = process.env.SITE_URL || 'https://sciencepubmedjp.pubmedtrivia.workers.dev';

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

function imageUrlFor(meta: { lang: 'ja' | 'en'; slug: string }): string {
  // square (1080x1080) は Instagram フィード推奨サイズ
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/square/${meta.lang}/${meta.slug}.png`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(
    `run-post (instagram): lang=${args.lang ?? 'any'} category=${args.category ?? 'any'} strategy=${args.strategy ?? 'random'} dry-run=${args.dryRun}`,
  );

  const article = await selectArticleForPost({
    platform: 'instagram',
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

  const caption = formatInstagramCaption(article);
  const imageUrl = imageUrlFor(article);

  if (args.dryRun) {
    dryRunInstagram({ imageUrl, caption });
    return;
  }

  const { mediaId } = await postToInstagram({ imageUrl, caption });

  await recordPost({
    platform: 'instagram',
    slug: article.slug,
    lang: article.lang,
    category: article.category,
    postedAt: new Date().toISOString(),
    postId: mediaId,
  });
  Logger.info(`✅ 投稿完了 + 履歴に記録: ig_media_id=${mediaId}`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
