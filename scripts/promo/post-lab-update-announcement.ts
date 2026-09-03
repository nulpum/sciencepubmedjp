// PubMed Lab 大型アップデート告知 (一回限り)
//
// 3 大機能 (⭐保存 / 💬壁打ち / 🎓テーマ提案) + waitlist リリース告知を
// Threads / Facebook / Instagram に 一斉配信する。
//
// 使い方:
//   npm run promo:lab-update              # 本番配信
//   npm run promo:lab-update -- --dry-run # 内容のみ確認
//   npm run promo:lab-update -- --skip=fb,ig
//
// X (Twitter) はここに含めない (手動投稿でスレッド化想定)。
//
// GH Actions からの手動トリガーは .github/workflows/lab-update-announcement.yml
// workflow_dispatch 経由で「Run workflow」ボタンから叩ける。

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { postToThreads, dryRunThreads } from '../threads/post.js';
import { postToFacebook, dryRunFacebook } from '../facebook/post.js';
import { postToInstagram, dryRunInstagram } from '../instagram/post.js';

const LAB_URL = 'https://sciencepubmed.net/ja/lab/';
const WAITLIST_URL = 'https://forms.gle/FEZ2EQ2VG2ie3zEQA';
const PROMO_IMAGE_URL = 'https://sciencepubmed.net/promo/lab-promo.png';

// ============================================================================
// Threads (~500 char 想定)
// ============================================================================
function buildThreadsText(): string {
  return [
    '🔬 PubMed Lab に大型アップデートを入れました (全部無料・登録不要)',
    '',
    '⭐ お気に入り論文の保存',
    '気になった論文をワンクリックで保存、後で見返せます',
    '',
    '💬 論文と壁打ちチャット (1日3回無料)',
    '「要点3つ」「N数と統計手法は?」「反論の可能性は?」など、AIと質疑応答',
    '',
    '🎓 卒論・修論テーマのAI提案 (1日3回無料)',
    '検索結果を俯瞰して「あなたの興味の焦点」+「派生研究テーマ3案」+「精読すべき論文」を提案',
    '',
    '例:「大学生の睡眠と学業成績」で検索してみてください。',
    LAB_URL,
    '',
    '有料版 (¥110〜、月額なし) 事前登録受付中:',
    WAITLIST_URL,
  ].join('\n');
}

// ============================================================================
// Facebook (詳しめ、長さ制限なし)
// ============================================================================
function buildFacebookText(): string {
  return [
    '【PubMed Lab、大型アップデートしました 🔬】',
    '',
    '無料で使える PubMed 日本語検索ツール「PubMed Lab」に、大学生・大学院生向けの機能を 3 つ追加しました。',
    '',
    '■ 追加機能 (すべて無料・登録不要)',
    '',
    '⭐ お気に入り論文の保存',
    '気になった論文をワンクリックで保存できます。',
    '',
    '💬 論文と壁打ちチャット (1日3メッセージ無料)',
    '論文カードから「この論文と壁打ち」を選ぶと、Claude AI と質疑応答できます。abstract の内容を根拠に「要点3つ」「反論の可能性」「N数と統計」などを聞けます。',
    '',
    '🎓 卒論・修論テーマのAI提案 (1日3回無料)',
    '検索結果の上位5本を AI が俯瞰し、「あなたの興味の焦点」「派生研究テーマ 3 案」「最初に精読すべき論文」を提案します。',
    '',
    '▼ 使ってみる',
    LAB_URL,
    '',
    '例:「大学生の睡眠不足と学業成績」で検索すると、睡眠介入 RCT、スマホ使用時間 × GPA、SNS 依存 × 学業影響 といった卒論テーマを出してくれます。',
    '',
    '将来的には有料版 (¥110〜、月額なしの買い切り) も準備中です:',
    WAITLIST_URL,
    '',
    '#PubMed #卒論 #大学生',
  ].join('\n');
}

// ============================================================================
// Instagram caption (画像必須、URL クリック不可なので "プロフィールから")
// ============================================================================
function buildInstagramCaption(): string {
  return [
    '🔬 PubMed Lab、大型アップデート',
    '',
    '大学生・院生向けに 3 機能追加しました 👇',
    '',
    '⭐ 論文お気に入り保存',
    '気になった論文をワンクリックで保存',
    '',
    '💬 論文と壁打ちチャット (1日3回無料)',
    '「要点3つ」「N数と統計は?」など AI と質疑応答',
    '',
    '🎓 卒論・修論テーマAI提案 (1日3回無料)',
    '検索結果を俯瞰して研究テーマ 3 案 + 精読すべき 1 本を提案',
    '',
    '例:「大学生の睡眠と学業成績」で検索してみて',
    '',
    'すべて無料・登録不要',
    '👉 プロフィール欄のリンクから',
    '',
    '有料版 (¥110〜、月額なし) 事前登録受付中 (プロフィールリンク)',
    '',
    '.',
    '.',
    '.',
    '',
    '#PubMed #卒論 #大学生 #大学院生 #修論 #研究 #文献検索 #心理学 #生物学 #看護学 #医学部 #勉強垢 #リサーチ #学び #サイエンス',
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
  Logger.info(`=== Lab UPDATE 告知投稿 (dry-run=${args.dryRun}) ===`);

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
        dryRunFacebook({ message: text, link: LAB_URL });
        Logger.info('--- Facebook 本文 ---\n' + text);
      } else {
        const { postId } = await postToFacebook({ message: text, link: LAB_URL });
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
