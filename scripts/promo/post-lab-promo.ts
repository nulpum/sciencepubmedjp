// PubMed Lab 宣伝投稿を Threads / Facebook / Instagram に配信
//
// 固定文言を 2 日に 1 回、昼 12:00 JST に自動投稿する。
// X は含めない (指示通り)。
//
// 使い方:
//   npm run promo:lab-post                # 本番配信
//   npm run promo:lab-post -- --dry-run   # 内容のみ確認
//   npm run promo:lab-post -- --skip=fb,ig # 特定 PF スキップ
//
// GH Actions cron: `0 3 */2 * *` (2日に1回、12:00 JST)
//   .github/workflows/lab-promo.yml で定義

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { postToThreads, dryRunThreads } from '../threads/post.js';
import { postToFacebook, dryRunFacebook } from '../facebook/post.js';
import { postToInstagram, dryRunInstagram } from '../instagram/post.js';

const LAB_URL = 'https://sciencepubmed.net/ja/lab/';
const PROMO_IMAGE_URL = 'https://sciencepubmed.net/promo/lab-promo.png';

// 3 プラットフォーム共通のベース文
const PROMO_TEXT_JA = [
  '日本語で入力するだけで、PubMed の英語論文を検索できるリサーチアシスタントです。',
  '卒論・研究テーマ探し、興味のある論文を効率よく見つけられます。',
  '',
  LAB_URL,
].join('\n');

// Threads/FB/IG それぞれ末尾のハッシュタグを PF に合わせて調整
function buildThreadsText(): string {
  return [
    PROMO_TEXT_JA,
    '',
    '#PubMed #論文 #研究 #卒論 #大学生 #心理学 #生物学',
  ].join('\n');
}

function buildFacebookText(): string {
  return [
    PROMO_TEXT_JA,
    '',
    '#PubMed #論文検索 #研究 #卒論 #科学',
  ].join('\n');
}

function buildInstagramCaption(): string {
  return [
    PROMO_TEXT_JA,
    '',
    '#PubMed #論文検索 #研究 #卒論 #大学生 #大学院生 #心理学 #生物学 #科学 #勉強垢 #豆知識 #リサーチ #学び #サイエンス #統計',
  ].join('\n');
}

interface CliArgs {
  dryRun: boolean;
  skip: Set<'threads' | 'facebook' | 'instagram'>;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const skipArg = args.find((a) => a.startsWith('--skip='));
  const skip = new Set<'threads' | 'facebook' | 'instagram'>();
  if (skipArg) {
    for (const p of skipArg.split('=')[1].split(',')) {
      const s = p.trim();
      if (s === 'threads' || s === 'facebook' || s === 'instagram') skip.add(s);
      if (s === 'fb') skip.add('facebook');
      if (s === 'ig') skip.add('instagram');
    }
  }
  return { dryRun: args.includes('--dry-run'), skip };
}

async function runOne(
  name: string,
  fn: () => Promise<void>,
  results: { platform: string; ok: boolean; error?: string }[],
): Promise<void> {
  try {
    await fn();
    results.push({ platform: name, ok: true });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    Logger.error(`${name} 失敗: ${msg}`);
    results.push({ platform: name, ok: false, error: msg });
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  Logger.info(`=== Lab promo 投稿 (dry-run=${args.dryRun}) ===`);

  const results: { platform: string; ok: boolean; error?: string }[] = [];

  // === Threads ===
  if (!args.skip.has('threads')) {
    const text = buildThreadsText();
    await runOne('threads', async () => {
      if (args.dryRun) {
        const info = dryRunThreads(text);
        Logger.info(`[dry-run] Threads: ${info.length} chars, overflow=${info.overflow}`);
      } else {
        const { threadId } = await postToThreads(text);
        Logger.info(`✅ Threads 投稿: thread_id=${threadId}`);
      }
    }, results);
  }

  // === Facebook ===
  if (!args.skip.has('facebook')) {
    const text = buildFacebookText();
    await runOne('facebook', async () => {
      if (args.dryRun) {
        dryRunFacebook({ message: text, link: LAB_URL });
      } else {
        const { postId } = await postToFacebook({ message: text, link: LAB_URL });
        Logger.info(`✅ Facebook 投稿: post_id=${postId}`);
      }
    }, results);
  }

  // === Instagram === (画像必須)
  if (!args.skip.has('instagram')) {
    const caption = buildInstagramCaption();
    await runOne('instagram', async () => {
      if (args.dryRun) {
        dryRunInstagram({ imageUrl: PROMO_IMAGE_URL, caption });
      } else {
        const { mediaId } = await postToInstagram({ imageUrl: PROMO_IMAGE_URL, caption });
        Logger.info(`✅ Instagram 投稿: media_id=${mediaId}`);
      }
    }, results);
  }

  // === サマリー ===
  const ok = results.filter((r) => r.ok).length;
  const ng = results.filter((r) => !r.ok).length;
  Logger.info(`=== 完了: 成功 ${ok}/${results.length}, 失敗 ${ng} ===`);
  if (ng > 0) {
    Logger.warn(`失敗一覧: ${JSON.stringify(results.filter((r) => !r.ok))}`);
    // GH Actions 側で失敗を検知するため exit code は 0 のままにしておく
    // (全 PF 失敗のときだけ 1)
    if (ok === 0) process.exitCode = 1;
  }
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
