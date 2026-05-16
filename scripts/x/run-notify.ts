// CLI: 最新の投稿記事を読んで X 用テンプレを生成 → Gmail に送信
//
// 想定運用:
//   GitHub Actions post.yml で post:threads / post:facebook の後に呼ぶ。
//   ユーザーはメールで届いた X 用テキストをコピペして X に手動投稿。
//
// 使い方:
//   npm run notify:x                    # 最新の投稿を対象 (デフォルト)
//   npm run notify:x -- --slug=...      # 特定 slug を対象
//   npm run notify:x -- --dry-run       # メール送信せず内容のみ確認

import '../lib/env.js';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '../lib/logger.js';
import { getAllPosted } from '../lib/posted-tracker.js';
import { sendEmail } from '../lib/notify.js';
import { formatXPost, xWeight } from './format-post.js';
import type { ArticleMeta } from '../lib/select-article.js';
import type { Category } from '../types.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try {
      return JSON.parse(t);
    } catch {
      return t.slice(1, -1);
    }
  }
  return t;
}

// posted-tracker に記録された PostedRecord から実ファイルパスを推測して
// frontmatter を解析する (select-article.ts の簡易版)
async function loadArticleBySlug(
  slug: string,
  lang: 'ja' | 'en',
  category: Category,
): Promise<ArticleMeta | null> {
  const path = join(CONTENT_DIR, lang, category, `${slug}.md`);
  let content: string;
  try {
    content = await readFile(path, 'utf8');
  } catch {
    return null;
  }
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const body = m[2];
  const get = (key: string): string | null => {
    const re = new RegExp(`^${key}:\\s*(.*)$`, 'm');
    const mm = fm.match(re);
    return mm ? unquote(mm[1]) : null;
  };
  const pmid = get('pmid');
  const title = get('title');
  const fact = get('fact');
  const generatedAt = get('generated_at');
  const journal = get('journal') ?? undefined;
  const yearStr = get('year');
  if (!pmid || !title || !fact || !generatedAt) return null;
  return {
    pmid,
    category,
    lang,
    title,
    fact,
    bodyExcerpt: body,
    journal,
    year: yearStr ? Number(yearStr) : undefined,
    slug,
    generatedAt,
  };
}

interface CliArgs {
  slug?: string;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const slugArg = args.find((a) => a.startsWith('--slug='));
  return {
    slug: slugArg?.split('=')[1],
    dryRun: args.includes('--dry-run'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs();

  // 投稿履歴から対象を選定
  const all = await getAllPosted();
  if (all.length === 0) {
    Logger.warn('まだ投稿履歴がありません');
    return;
  }

  let target = all[all.length - 1]; // 既定: 最新
  if (args.slug) {
    const m = all.reverse().find((r) => r.slug === args.slug);
    if (!m) throw new Error(`slug=${args.slug} の投稿履歴が見つかりません`);
    target = m;
  }

  Logger.info(`対象: ${target.slug} (${target.lang}/${target.category}, ${target.platform} 経由)`);

  const article = await loadArticleBySlug(target.slug, target.lang, target.category);
  if (!article) throw new Error(`記事ファイルが見つかりません: ${target.slug}`);

  // X 用テキスト整形 (X Premium 想定の長文版)
  const xText = formatXPost(article);
  const weight = xWeight(xText);
  // X Premium Basic 加入で 25,000 weighted chars まで OK
  // 無料枠は 280 weighted chars
  const X_PREMIUM_LIMIT = 25000;
  const overflow = weight > X_PREMIUM_LIMIT ? '⚠️ Premium 上限超過' : '';
  Logger.info(`X 用テキスト: ${weight} weighted chars ${overflow}`);

  const subject = `[PubMed Trivia] X 用テンプレ: ${article.title.slice(0, 30)}`;

  const body = [
    '# X (旧 Twitter) 用の投稿テンプレートです (X Premium 想定の長文版)',
    '',
    'スマホで Gmail 開いてこのメールの本文をコピー → X アプリに貼り付けて投稿してください。',
    '',
    `=== ここからコピー (${weight} weighted chars / Premium 上限 25000) ===`,
    '',
    xText,
    '',
    '=== ここまでコピー ===',
    '',
    `📊 参考: 同じ記事を既に Threads / Facebook に自動投稿済`,
    `   - 記事 URL: ${process.env.SITE_URL || 'https://sciencepubmed.net'}/${article.lang}/${article.category}/${article.slug}/`,
    `   - PMID: ${article.pmid}`,
    '',
    '🤖 PubMed Trivia bot より自動送信',
  ].join('\n');

  if (args.dryRun) {
    Logger.info(`[dry-run] subject="${subject}"`);
    Logger.info(`[dry-run] body:\n${body}`);
    return;
  }

  await sendEmail({ subject, body });
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
