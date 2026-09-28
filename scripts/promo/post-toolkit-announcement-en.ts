// EN toolkit announcement: PubMed Lab AI prompt toolkit distribution.
//
// Posts a one-shot promo about the free AI-prompt toolkit to Threads / Facebook /
// Instagram / Bluesky / X, in ENGLISH, targeting the international research audience.
//
// 使い方:
//   npm run promo:toolkit-en              # 本番配信
//   npm run promo:toolkit-en -- --dry-run # 内容のみ確認
//   npm run promo:toolkit-en -- --skip=fb,ig
//
// X はハイブリッド投稿 (API 試行 → 失敗時 email fallback)。

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { postToThreads, dryRunThreads } from '../threads/post.js';
import { postToFacebook, dryRunFacebook } from '../facebook/post.js';
import { postToInstagram, dryRunInstagram } from '../instagram/post.js';
import { notifyXPost } from '../x/notify-post.js';
import { postToX, dryRunX } from '../x/post.js';
import { postToBluesky, dryRunBluesky } from '../bluesky/post.js';

const TOOLKIT_URL = 'https://sciencepubmed.net/en/lab/toolkit/';
const LAB_URL = 'https://sciencepubmed.net/en/lab/';
const PROMO_IMAGE_URL = 'https://sciencepubmed.net/promo/lab-promo.png';

// ============================================================================
// Threads (~500 chars, EN)
// ============================================================================
function buildThreadsText(): string {
  return [
    '🤖 Free AI prompt: paste into ChatGPT / Claude / Gemini → PubMed paper-chat assistant',
    '',
    'From the abstract you paste:',
    '📖 Key findings',
    '📊 Sample & statistics',
    '⚠️ Limitations & biases',
    '🎓 Thesis-scale follow-ups',
    '✍️ APA citation phrasing',
    '',
    'Unlimited in your own AI subscription. No signup.',
    '',
    'For grad students, postdocs, researchers 👇',
    TOOLKIT_URL,
    '',
    '#AIforScience #PhDchat #PubMed',
  ].join('\n');
}

// ============================================================================
// Facebook (long-form, EN)
// ============================================================================
function buildFacebookText(): string {
  return [
    '[Free AI prompt for researchers who read PubMed 🤖]',
    '',
    'Distributing a ready-to-paste master prompt that turns your ChatGPT (Free/Plus), Claude, or Google Gemini into a dedicated PubMed research assistant.',
    '',
    '■ What it does',
    '📖 Extract the 3-5 main findings from any abstract',
    '📊 Check sample size, statistical methods, and study design',
    '⚠️ Surface limitations, biases, and caveats',
    '🎓 Suggest 3 thesis-scale follow-up study ideas',
    '✍️ Draft APA in-text citation phrasing',
    '',
    '■ Usage (3 steps)',
    '1. Click [ Copy prompt ] on the page below',
    '2. Paste into your AI (ChatGPT / Claude / Gemini) and send',
    '3. Paste a PubMed abstract in the next message and start asking',
    '',
    '■ Why give it away for free',
    '- Runs in your own AI subscription = unlimited messages',
    '- Full conversation history stays in your account',
    '- Bypasses PubMed Lab hosted 3-message daily limit',
    '',
    'ChatGPT Plus users can turn it into a Custom GPT; Claude Pro users can save it as a Project — so you never re-paste it.',
    '',
    '▼ Details + prompt',
    TOOLKIT_URL,
    '',
    '#PubMed #AIforScience #PhDchat #academicchatter #ChatGPT #Claude #Gemini',
  ].join('\n');
}

// ============================================================================
// Instagram caption (EN)
// ============================================================================
function buildInstagramCaption(): string {
  return [
    '🤖 Free AI prompt: paste into ChatGPT / Claude / Gemini → PubMed paper-chat assistant',
    '',
    'What it does (based on the abstract you paste):',
    '',
    '📖 Extract key findings',
    '📊 Check sample size & statistics',
    '⚠️ Surface limitations',
    '🎓 Suggest follow-up thesis ideas',
    '✍️ Draft citation phrasing',
    '',
    '[Why free?]',
    '- Unlimited use in your own AI subscription',
    '- No signup, no rate limit, full history',
    '',
    '👉 Link in bio to copy the prompt',
    '',
    '.',
    '.',
    '.',
    '',
    '#PubMed #AIforScience #PhDchat #PhDlife #academicchatter #academiclife #gradschool #postdoc #ChatGPT #Claude #Gemini #ResearchTools #ScienceCommunication #openscience #Neuroscience #Biology #Psychology',
  ].join('\n');
}

// ============================================================================
// Bluesky (~300 chars, EN researcher tone)
// ============================================================================
function buildBlueskyText(): string {
  return [
    '🤖 Free master prompt: paste into ChatGPT / Claude / Gemini → your AI becomes a PubMed paper-chat assistant.',
    '',
    'Grounded strictly in the abstract you paste. Grad students, postdocs, PIs welcome. Unlimited use in your own subscription.',
    '',
    TOOLKIT_URL,
    '',
    '#AIforScience #PhDchat',
  ].join('\n');
}

// ============================================================================
// CLI
// ============================================================================
interface CliArgs {
  dryRun: boolean;
  skip: Set<'threads' | 'facebook' | 'instagram' | 'bluesky'>;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const skipArg = args.find((a) => a.startsWith('--skip='));
  const skip = new Set<'threads' | 'facebook' | 'instagram' | 'bluesky'>();
  if (skipArg) {
    for (const p of skipArg.split('=')[1].split(',')) {
      const s = p.trim();
      if (s === 'threads' || s === 'facebook' || s === 'instagram' || s === 'bluesky') skip.add(s);
      if (s === 'fb') skip.add('facebook');
      if (s === 'ig') skip.add('instagram');
      if (s === 'bsky') skip.add('bluesky');
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
  Logger.info(`=== EN Toolkit (AI prompt distribution) 告知 (dry-run=${args.dryRun}) ===`);

  const results: { platform: string; ok: boolean; error?: string }[] = [];

  if (!args.skip.has('threads')) {
    const text = buildThreadsText();
    await runOne('threads', async () => {
      if (args.dryRun) {
        const info = dryRunThreads(text);
        Logger.info(`[dry-run] Threads: ${info.length} chars, overflow=${info.overflow}`);
        Logger.info('--- Threads EN 本文 ---\n' + text);
      } else {
        const { threadId } = await postToThreads(text);
        Logger.info(`✅ Threads EN 投稿: thread_id=${threadId}`);
      }
    }, results);
  }

  if (!args.skip.has('facebook')) {
    const text = buildFacebookText();
    await runOne('facebook', async () => {
      if (args.dryRun) {
        dryRunFacebook({ message: text, link: TOOLKIT_URL });
        Logger.info('--- Facebook EN 本文 ---\n' + text);
      } else {
        const { postId } = await postToFacebook({ message: text, link: TOOLKIT_URL });
        Logger.info(`✅ Facebook EN 投稿: post_id=${postId}`);
      }
    }, results);
  }

  // Instagram: EN 用 promo 画像 が 未整備 (現在の lab-promo.png は 日本語で「PubMed の英語論文が探せる」/ja/lab/ を含む)
  // → EN caption と image 内容 mismatch を 避けるため、EN promo は Instagram を default skip。
  // 明示的に --include=instagram で 走らせる or EN 版 画像 を 作成後 に この skip を 外す。
  const includeInstagram = process.argv.includes('--include=instagram');
  if (includeInstagram && !args.skip.has('instagram')) {
    const caption = buildInstagramCaption();
    await runOne('instagram', async () => {
      if (args.dryRun) {
        dryRunInstagram({ imageUrl: PROMO_IMAGE_URL, caption });
        Logger.info('--- Instagram EN caption ---\n' + caption);
      } else {
        const { mediaId } = await postToInstagram({ imageUrl: PROMO_IMAGE_URL, caption });
        Logger.info(`✅ Instagram EN 投稿: media_id=${mediaId}`);
      }
    }, results);
  }

  if (!args.skip.has('bluesky')) {
    const bskyText = buildBlueskyText();
    await runOne('bluesky', async () => {
      if (args.dryRun) {
        dryRunBluesky(bskyText);
        Logger.info('--- Bluesky EN 本文 ---\n' + bskyText);
      } else {
        const { url } = await postToBluesky(bskyText);
        Logger.info(`✅ Bluesky EN 投稿: ${url}`);
      }
    }, results);
  }

  // === X: 手動投稿用に Gmail 通知のみ (JA と同じフロー、案B のロングテキスト) ===
  {
    const xText = [
      '🤖 Free AI prompt for researchers: turn your ChatGPT / Claude / Gemini into a PubMed paper-chat assistant.',
      '',
      'What it does (grounded strictly in the abstract you paste):',
      '📖 Extract key findings',
      '📊 Check sample size, statistics, design',
      '⚠️ Surface limitations & biases',
      '🎓 Suggest thesis-scale follow-up studies',
      '✍️ Draft APA citation phrasing',
      '',
      'Why free?',
      '• Runs in your own AI subscription = unlimited msgs',
      '• Full conversation history stays in your account',
      '• No signup, no email, no rate limits',
      '',
      'Copy-paste ready. Edit freely.',
      '',
      'Grab it → ' + TOOLKIT_URL,
      '',
      '#AIforScience #PhDchat #academicchatter #PubMed #ResearchTools',
    ].join('\n');
    if (args.dryRun) {
      dryRunX(xText);
      Logger.info(`--- X EN 本文 (${xText.length} chars) ---\n` + xText);
    } else {
      await notifyXPost({
        subject: '[X 手動投稿] PubMed Lab EN toolkit announcement',
        xText,
        contextNote: `EN Toolkit の X 用テキスト (案B long form) を用意しました。X Premium 想定です。
Gmail からコピーして X に手動投稿してください。`,
      }).catch((e) => Logger.warn(`X notify 送信失敗: ${(e as Error).message}`));
      Logger.info('✅ X EN テキストを Gmail 通知送信 (手動投稿してください)');
    }
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
