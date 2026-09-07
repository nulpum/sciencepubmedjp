// PubMed Lab: スマホアプリ 準備中告知 (一回限り)
//
// 「iOS / Android アプリ (無料・広告付き) を卒論シーズンに向けて開発中、
// リリース通知希望の方は事前登録どうぞ」を Threads / Facebook / Instagram に配信。
//
// 使い方:
//   npm run promo:app-announce              # 本番配信
//   npm run promo:app-announce -- --dry-run # 内容のみ確認
//   npm run promo:app-announce -- --skip=fb,ig

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { postToThreads, dryRunThreads } from '../threads/post.js';
import { postToFacebook, dryRunFacebook } from '../facebook/post.js';
import { postToInstagram, dryRunInstagram } from '../instagram/post.js';

const LAB_URL = 'https://sciencepubmed.net/ja/lab/';
const WAITLIST_URL = 'https://forms.gle/FEZ2EQ2VG2ie3zEQA';
const PROMO_IMAGE_URL = 'https://sciencepubmed.net/promo/lab-promo.png';

// ============================================================================
// Threads (~500 char)
// ============================================================================
function buildThreadsText(): string {
  return [
    '📱 PubMed Lab の スマホアプリ (iOS / Android)、開発準備中です',
    '',
    '【なぜアプリ?】',
    '・移動中や図書館でサクッと論文検索',
    '・壁打ちチャットをよりリアルタイムに',
    '・完全無料版 (広告視聴で回数増える型)',
    '',
    '【リリース目標】',
    '卒論・修論シーズン (2026年 11-12月)',
    '',
    'リリース時にメール通知希望の方は 👇',
    WAITLIST_URL,
    '',
    'Web 版は先に使えます:',
    LAB_URL,
  ].join('\n');
}

// ============================================================================
// Facebook (詳しめ)
// ============================================================================
function buildFacebookText(): string {
  return [
    '【PubMed Lab、スマホアプリ (iOS / Android) 開発始動 📱】',
    '',
    'Web 版として提供中の PubMed 日本語検索ツール「PubMed Lab」を、スマホアプリでもリリースする予定です。',
    '',
    '■ なぜアプリ化?',
    '・移動中・図書館・電車で気になった論文をサクッと調べたい方向け',
    '・壁打ちチャット (論文と質疑応答) をプッシュ通知でよりリアルタイムに',
    '・スマホネイティブの UX (タップ 1 発で開く)',
    '',
    '■ 料金モデル',
    '完全無料版 (広告付き)。 「大学生の財布に優しい」を第一に、月額サブスクは一切ありません。 広告視聴で使える回数が増える設計を予定しています。',
    '',
    '■ リリース時期',
    '卒論・修論シーズン (2026年 11-12月) 目標',
    '',
    '■ リリース通知の事前登録',
    '下記フォームからメールアドレスをご登録ください (1 分):',
    WAITLIST_URL,
    '',
    '■ Web 版は既に使えます',
    LAB_URL,
    '',
    '#PubMed #卒論 #大学生 #スマホアプリ',
  ].join('\n');
}

// ============================================================================
// Instagram (caption)
// ============================================================================
function buildInstagramCaption(): string {
  return [
    '📱 PubMed Lab の スマホアプリ 開発中!',
    '',
    '【概要】',
    'iOS / Android 両対応、完全無料版 (広告付き)、卒論・修論シーズンにリリース目標 (2026年 11-12月)',
    '',
    '【何ができる?】',
    '・移動中もサクッと論文検索',
    '・気になった論文と壁打ちチャット',
    '・卒論・修論テーマの AI 提案',
    '',
    '【料金】',
    'サブスクなし、完全無料',
    '広告視聴で使える回数が増える仕組み',
    '',
    '【リリース通知登録】',
    '👉 プロフィール欄のリンクから',
    '',
    'Web 版は既に無料で使えます',
    '',
    '.',
    '.',
    '.',
    '',
    '#PubMed #卒論 #大学生 #大学院生 #修論 #スマホアプリ #iOS #Android #研究 #文献検索 #心理学 #生物学 #勉強垢 #リサーチ #学び #サイエンス',
  ].join('\n');
}

// ============================================================================
// CLI
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
  Logger.info(`=== App 準備中 告知 (dry-run=${args.dryRun}) ===`);

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
        dryRunFacebook({ message: text, link: WAITLIST_URL });
        Logger.info('--- Facebook 本文 ---\n' + text);
      } else {
        const { postId } = await postToFacebook({ message: text, link: WAITLIST_URL });
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
