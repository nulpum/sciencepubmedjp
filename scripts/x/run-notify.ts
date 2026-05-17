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
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '../lib/logger.js';
import { getAllPosted } from '../lib/posted-tracker.js';
import { sendEmail } from '../lib/notify.js';
import { formatXPost, xWeight } from './format-post.js';
import type { ArticleMeta } from '../lib/select-article.js';
import type { Category } from '../types.js';

async function existsLocal(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

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
  lang?: 'ja' | 'en';
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const slugArg = args.find((a) => a.startsWith('--slug='));
  const langArg = args.find((a) => a.startsWith('--lang='));
  const lang = langArg?.split('=')[1];
  if (lang && lang !== 'ja' && lang !== 'en') {
    throw new Error('--lang は ja|en のみ');
  }
  return {
    slug: slugArg?.split('=')[1],
    lang: lang as 'ja' | 'en' | undefined,
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

  // --lang 指定があれば事前にフィルタ (X 通知を ja のみに固定したいケース)
  const filtered = args.lang ? all.filter((r) => r.lang === args.lang) : all;
  if (filtered.length === 0) {
    Logger.warn(`lang=${args.lang} の投稿履歴がありません`);
    return;
  }

  let target = filtered[filtered.length - 1]; // 既定: 最新
  if (args.slug) {
    const m = [...filtered].reverse().find((r) => r.slug === args.slug);
    if (!m) throw new Error(`slug=${args.slug} の投稿履歴が見つかりません`);
    target = m;
  }

  Logger.info(`対象: ${target.slug} (${target.lang}/${target.category}, ${target.platform} 経由)`);

  const article = await loadArticleBySlug(target.slug, target.lang, target.category);
  if (!article) throw new Error(`記事ファイルが見つかりません: ${target.slug}`);

  // 同 slug の反対言語版もロード (X はツリー投稿でアルゴリズムに乗せたいため
  // ja を親ポスト + en をツリー返信で 1 セット送る運用)
  const otherLang: 'ja' | 'en' = article.lang === 'ja' ? 'en' : 'ja';
  const counterpart = await loadArticleBySlug(article.slug, otherLang, article.category);

  // X 用テキスト整形 (X Premium 想定の長文版)
  const xText = formatXPost(article);
  const weight = xWeight(xText);
  // X Premium Basic 加入で 25,000 weighted chars まで OK
  // 無料枠は 280 weighted chars
  const X_PREMIUM_LIMIT = 25000;
  const overflow = weight > X_PREMIUM_LIMIT ? '⚠️ Premium 上限超過' : '';
  Logger.info(`X 用テキスト (${article.lang}): ${weight} weighted chars ${overflow}`);

  let counterpartText = '';
  let counterpartWeight = 0;
  if (counterpart) {
    counterpartText = formatXPost(counterpart);
    counterpartWeight = xWeight(counterpartText);
    Logger.info(`X 用テキスト (${otherLang}, ツリー返信用): ${counterpartWeight} weighted chars`);
  } else {
    Logger.warn(`反対言語版 (${otherLang}) の記事ファイルが見つからない → ツリー返信なし`);
  }

  const subject = `[PubMed Trivia] 手動投稿テンプレ: ${article.title.slice(0, 30)}`;

  // Instagram 用 1080x1080 画像があれば添付 (なければスキップ)
  const squareImagePath = join(
    process.cwd(),
    'public',
    'square',
    article.lang,
    `${article.slug}.png`,
  );
  const hasImage = await existsLocal(squareImagePath);

  // ja → en の順を保証 (親が ja, ツリー返信が en)
  const isParentJa = article.lang === 'ja';
  const parentLabel = isParentJa ? '🇯🇵 親ポスト (日本語)' : '🇺🇸 親ポスト (英語)';
  const replyLabel = isParentJa ? '🇺🇸 ツリー返信 (英語)' : '🇯🇵 ツリー返信 (日本語)';

  const bodyLines: string[] = [
    '# 手動投稿用テンプレート (X / Instagram)',
    '',
    '## 🐦 X (旧 Twitter) — ツリー投稿で algorithm に乗せる',
    '',
    '【運用手順】',
    '  1. 下の「親ポスト」を X に投稿',
    '  2. 自分のその投稿に対して「ツリー返信」をリプライ',
    '  3. 同じ記事の日英をスレッドで繋げると engagement ↑',
    '',
    '────────────────────────────────────',
    `## ${parentLabel}`,
    `=== ここからコピー (${weight} weighted chars / 上限 25000) ===`,
    '',
    xText,
    '',
    '=== ここまでコピー ===',
    '',
  ];

  if (counterpartText) {
    bodyLines.push(
      '────────────────────────────────────',
      `## ${replyLabel}`,
      '上の親ポストを投稿した後、その投稿に「返信」する形でツリー化',
      `=== ここからコピー (${counterpartWeight} weighted chars / 上限 25000) ===`,
      '',
      counterpartText,
      '',
      '=== ここまでコピー ===',
      '',
    );
  } else {
    bodyLines.push(
      '⚠️ 反対言語版が未生成のためツリー返信テンプレなし',
      '',
    );
  }

  bodyLines.push(
    '## 📷 Instagram 用',
    hasImage
      ? '添付の正方形画像 (1080×1080) を Instagram にアップ → 親ポストのテキストをキャプションに貼り付け (適宜短縮)。'
      : '画像未生成のため添付なし。`npm run generate:og -- --size=square` で生成可能。',
    '',
    `📊 同じ記事を自動投稿済:`,
    `   - 記事 URL (ja): ${process.env.SITE_URL || 'https://sciencepubmed.net'}/ja/${article.category}/${article.slug}/`,
    `   - 記事 URL (en): ${process.env.SITE_URL || 'https://sciencepubmed.net'}/en/${article.category}/${article.slug}/`,
    `   - PMID: ${article.pmid}`,
    '',
    '🤖 PubMed Trivia bot より自動送信',
  );

  const body = bodyLines.join('\n');

  if (args.dryRun) {
    Logger.info(`[dry-run] subject="${subject}"`);
    Logger.info(`[dry-run] body:\n${body}`);
    Logger.info(`[dry-run] image attachment: ${hasImage ? squareImagePath : 'なし'}`);
    return;
  }

  await sendEmail({
    subject,
    body,
    attachments: hasImage
      ? [{ filename: `${article.slug}.png`, path: squareImagePath }]
      : undefined,
  });
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
