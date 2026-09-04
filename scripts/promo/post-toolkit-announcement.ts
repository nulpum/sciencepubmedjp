// PubMed Lab: AI プロンプト配布 (toolkit) 告知 (一回限り)
//
// 「自分の ChatGPT / Claude / Gemini で無料無制限」を推す告知を
// Threads / Facebook / Instagram に一斉配信する。
//
// 使い方:
//   npm run promo:toolkit              # 本番配信
//   npm run promo:toolkit -- --dry-run # 内容のみ確認
//   npm run promo:toolkit -- --skip=fb,ig
//
// X は手動投稿。

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { postToThreads, dryRunThreads } from '../threads/post.js';
import { postToFacebook, dryRunFacebook } from '../facebook/post.js';
import { postToInstagram, dryRunInstagram } from '../instagram/post.js';

const TOOLKIT_URL = 'https://sciencepubmed.net/ja/lab/toolkit/';
const LAB_URL = 'https://sciencepubmed.net/ja/lab/';
const PROMO_IMAGE_URL = 'https://sciencepubmed.net/promo/lab-promo.png';

// ============================================================================
// Threads (~500 char)
// ============================================================================
function buildThreadsText(): string {
  return [
    '🤖 自分の ChatGPT / Claude / Gemini を PubMed 論文専用アシスタントに変身させるプロンプト、無料配布しました',
    '',
    '【何ができる?】',
    '📖 abstract の要点整理',
    '📊 N数・統計手法チェック',
    '⚠️ 限界・バイアスの洗い出し',
    '🎓 卒論テーマ 3 案提案',
    '✍️ 引用フレーズ作成',
    '',
    '【なぜ配布?】',
    '・完全無料 (自分の AI 課金内で無制限)',
    '・PubMed Lab の 1 日 3 回制限を突破',
    '・履歴が自分の AI に残るので後で見返せる',
    '',
    'コピペで即使えます 👇',
    TOOLKIT_URL,
  ].join('\n');
}

// ============================================================================
// Facebook (詳しめ)
// ============================================================================
function buildFacebookText(): string {
  return [
    '【PubMed 論文の壁打ちができる AI プロンプト、無料配布します 🤖】',
    '',
    'ChatGPT (無料 / Plus 両対応) / Claude / Google Gemini など、お使いの AI に貼るだけで、PubMed 論文専用の研究アシスタントに変身するプロンプトを PubMed Lab で配布しています。',
    '',
    '■ 何ができるか',
    '📖 論文 abstract の要点を 3 つに整理',
    '📊 N 数・統計手法・研究デザインのチェック',
    '⚠️ 限界・バイアス・注意点の洗い出し',
    '🎓 派生研究テーマ 3 案の提案 (卒論・修論向け)',
    '✍️ 卒論引用フレーズ作成 (APA スタイル)',
    '',
    '■ 使い方 (3 ステップ)',
    '1. プロンプトを [コピー] ボタンで丸ごとコピー',
    '2. お使いの AI に貼り付けて送信',
    '3. あとは論文の abstract を貼って質問',
    '',
    '■ なぜ配布するか',
    '・完全無料 (自分の AI の課金内で回数無制限)',
    '・PubMed Lab の 1 日 3 メッセージ制限を突破',
    '・履歴が自分の AI に残るので後で見返せる',
    '',
    'ChatGPT Plus をお持ちの方は「マイ GPT」化、Claude Pro をお持ちの方は「Projects」化することで、毎回のプロンプト貼り直しも不要になります。',
    '',
    '▼ 詳細と プロンプト取得',
    TOOLKIT_URL,
    '',
    '#PubMed #卒論 #ChatGPT #Claude #大学生',
  ].join('\n');
}

// ============================================================================
// Instagram (caption)
// ============================================================================
function buildInstagramCaption(): string {
  return [
    '🤖 自分の AI を PubMed 論文専用に変身させるプロンプト、無料配布',
    '',
    'サブスク済みの ChatGPT / Claude / Gemini に貼るだけで:',
    '',
    '📖 abstract の要点整理',
    '📊 N数・統計チェック',
    '⚠️ 限界・バイアス洗い出し',
    '🎓 卒論テーマ提案',
    '✍️ 引用フレーズ作成',
    '',
    '【なぜ配布?】',
    '・完全無料 (自分の AI 課金内)',
    '・回数無制限 (Lab の 1日3回突破)',
    '・履歴も自分の AI に残る',
    '',
    '👉 プロフィール欄のリンクから、コピペで即使えます',
    '',
    '.',
    '.',
    '.',
    '',
    '#PubMed #卒論 #大学生 #大学院生 #修論 #ChatGPT #Claude #Gemini #研究 #文献検索 #心理学 #生物学 #看護学 #医学部 #勉強垢 #リサーチ #学び #サイエンス #AIツール #プロンプト',
  ].join('\n');
}

// ============================================================================
// CLI (post-lab-update-announcement.ts と同型)
// ============================================================================
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
  Logger.info(`=== Toolkit (AI プロンプト無料配布) 告知 (dry-run=${args.dryRun}) ===`);

  const results: { platform: string; ok: boolean; error?: string }[] = [];

  if (!args.skip.has('threads')) {
    const text = buildThreadsText();
    await runOne('threads', async () => {
      if (args.dryRun) {
        const info = dryRunThreads(text);
        Logger.info(`[dry-run] Threads: ${info.length} chars, overflow=${info.overflow}`);
        Logger.info('--- Threads 本文 ---\n' + text);
      } else {
        const { threadId } = await postToThreads(text);
        Logger.info(`✅ Threads 投稿: thread_id=${threadId}`);
      }
    }, results);
  }

  if (!args.skip.has('facebook')) {
    const text = buildFacebookText();
    await runOne('facebook', async () => {
      if (args.dryRun) {
        dryRunFacebook({ message: text, link: TOOLKIT_URL });
        Logger.info('--- Facebook 本文 ---\n' + text);
      } else {
        const { postId } = await postToFacebook({ message: text, link: TOOLKIT_URL });
        Logger.info(`✅ Facebook 投稿: post_id=${postId}`);
      }
    }, results);
  }

  if (!args.skip.has('instagram')) {
    const caption = buildInstagramCaption();
    await runOne('instagram', async () => {
      if (args.dryRun) {
        dryRunInstagram({ imageUrl: PROMO_IMAGE_URL, caption });
        Logger.info('--- Instagram caption ---\n' + caption);
      } else {
        const { mediaId } = await postToInstagram({ imageUrl: PROMO_IMAGE_URL, caption });
        Logger.info(`✅ Instagram 投稿: media_id=${mediaId}`);
      }
    }, results);
  }

  const ok = results.filter((r) => r.ok).length;
  const ng = results.filter((r) => !r.ok).length;
  Logger.info(`=== 完了: 成功 ${ok}/${results.length}, 失敗 ${ng} ===`);
  if (ng > 0) {
    Logger.warn(`失敗一覧: ${JSON.stringify(results.filter((r) => !r.ok))}`);
    if (ok === 0) process.exitCode = 1;
  }
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
