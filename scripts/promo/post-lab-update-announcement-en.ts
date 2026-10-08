// EN Lab update announcement: PubMed Lab 3 major features + waitlist.
//
// Posts the Lab-feature update (⭐ favorites, 💬 chat, 🎓 thesis proposals)
// to Threads / Facebook / Instagram / Bluesky in ENGLISH, targeting the
// international research audience.
//
// 使い方:
//   npm run promo:lab-update-en              # 本番配信
//   npm run promo:lab-update-en -- --dry-run # 内容のみ確認
//   npm run promo:lab-update-en -- --skip=fb,ig
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

const LAB_URL = 'https://sciencepubmed.net/en/lab/';
const PROMO_IMAGE_URL = 'https://sciencepubmed.net/promo/lab-promo-en.png';

// ============================================================================
// Threads (~500 chars, EN)
// ============================================================================
function buildThreadsText(): string {
  return [
    '🔬 PubMed Lab now has 3 new features (all free, no signup)',
    '',
    '⭐ Save favorite papers',
    'One-click save any paper card for later review',
    '',
    '💬 Chat with papers (3 messages/day free)',
    'Ask "key findings", "sample size and stats", "what are the limitations?" — AI answers from the abstract',
    '',
    '🎓 Thesis topic AI proposal (3/day free)',
    'From your search, AI synthesizes "your focus" + "3 follow-up research ideas" + "which paper to read first"',
    '',
    'Try: "sleep deprivation and academic performance"',
    LAB_URL,
  ].join('\n');
}

// ============================================================================
// Facebook (long-form, EN)
// ============================================================================
function buildFacebookText(): string {
  return [
    '[PubMed Lab just got a major update 🔬]',
    '',
    'The free Japanese-and-English PubMed research tool "PubMed Lab" now has 3 new features aimed at grad students, postdocs, and curious researchers.',
    '',
    '■ New features (all free, no signup)',
    '',
    '⭐ Save favorite papers',
    'One-click save any paper card from the search results and come back to it later.',
    '',
    '💬 Chat with papers (3 free messages/day)',
    'Open any paper card → "Chat with this paper" → ask Claude AI anything grounded in the abstract: "key findings", "N and statistical method", "possible counterarguments".',
    '',
    '🎓 Thesis / dissertation topic AI proposal (3/day free)',
    'The AI reads the top 5 papers from your search and proposes: your "focus area", 3 follow-up research questions scaled for a thesis, and the one paper you should read deeply first.',
    '',
    '▼ Try it',
    LAB_URL,
    '',
    'Example: Search "sleep deprivation and academic performance" — you\'ll get follow-up ideas on sleep-intervention RCTs, screen time × GPA, and social-media × academic impact.',
    '',
    '#PubMed #PhDchat #academicchatter #research #gradschool',
  ].join('\n');
}

// ============================================================================
// Instagram caption (image required, URLs not clickable → "link in bio")
// ============================================================================
function buildInstagramCaption(): string {
  return [
    '🔬 PubMed Lab — major update',
    '',
    '3 new features for grad students & researchers 👇',
    '',
    '⭐ Save favorite papers',
    'One-click save for later review',
    '',
    '💬 Chat with papers (3 msg/day free)',
    '"Key findings?" "N and statistics?" — AI answers from the abstract',
    '',
    '🎓 Thesis topic AI proposal (3/day free)',
    'Synthesizes your search → 3 follow-up ideas + the one paper to read first',
    '',
    'Try: "sleep deprivation and academic performance"',
    '',
    'All free, no signup',
    '👉 Link in bio',
    '',
    '.',
    '.',
    '.',
    '',
    '#PubMed #PhDchat #academicchatter #AIforScience #gradschool #research #thesis #phdlife #academia #phdstudent #gradstudent #literaturereview #ChatGPT #Claude',
  ].join('\n');
}

// ============================================================================
// Bluesky (~300 char, EN)
// ============================================================================
function buildBlueskyText(): string {
  return [
    '🔬 PubMed Lab — 3 new features (all free, no signup)',
    '',
    '⭐ Save favorite papers',
    '💬 Chat with papers (3/day)',
    '🎓 Thesis topic AI proposal (3/day)',
    '',
    'Try "sleep deprivation and academic performance".',
    LAB_URL,
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
  Logger.info(`=== Lab UPDATE EN 告知投稿 (dry-run=${args.dryRun}) ===`);

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

  if (!args.skip.has('bluesky')) {
    const bskyText = buildBlueskyText();
    await runOne('bluesky', async () => {
      if (args.dryRun) {
        dryRunBluesky(bskyText);
        Logger.info('--- Bluesky 本文 ---\n' + bskyText);
      } else {
        const { url } = await postToBluesky(bskyText);
        Logger.info(`✅ Bluesky 投稿: ${url}`);
      }
    }, results);
  }

  // === X (Twitter) ハイブリッド投稿: API 試行 → 失敗時 メール fallback ===
  {
    const xText = [
      '🔬 PubMed Lab — 3 new features (free)',
      '',
      '⭐ Save favorite papers',
      '💬 Chat with papers (3/day)',
      '🎓 Thesis topic AI proposal (3/day)',
      '',
      'No signup.',
      LAB_URL,
      '',
      '#PhDchat #academicchatter',
    ].join('\n');
    if (args.dryRun) {
      dryRunX(xText);
    } else {
      try {
        const result = await postToX(xText);
        Logger.info(`✅ X 自動投稿成功: ${result.url}`);
      } catch (e) {
        const msg = (e as Error).message || String(e);
        Logger.warn(`⚠️ X 自動投稿失敗 → メール fallback: ${msg}`);
        await notifyXPost({
          subject: '[X 投稿 fallback] PubMed Lab EN update announcement',
          xText,
          contextNote: `LAB update EN announcement cron 発火時に X 自動投稿を試みましたが失敗しました。手動で投稿してください。
エラー: ${msg}`,
        }).catch((e2) => Logger.warn(`X notify fallback も失敗: ${(e2 as Error).message}`));
      }
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
