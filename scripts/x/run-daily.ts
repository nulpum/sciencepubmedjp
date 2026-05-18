// CLI: 「Meta から独立した X 用テンプレ daily 配信」スクリプト
//
// 目的:
//   post.yml が動かなくても (Meta が壊れている間でも) X 用テンプレを
//   毎日 1 通 Gmail に届けて、手動 X 投稿を継続できるようにする。
//
// 動作:
//   1. src/content/ja/{psychology,biology}/ を全列挙
//   2. data/x-emailed.json で「既に X 用にメール送信済」の slug を除外
//   3. 残りから oldest 1 件を選定
//   4. X 用テンプレ (ja 親 + en ツリー返信) を整形して Gmail 送信
//   5. data/x-emailed.json に記録
//
// 使い方:
//   npm run notify:x-daily                  # 本番送信
//   npm run notify:x-daily -- --dry-run     # 内容のみ確認
//
// post.yml の中で動く notify:x (posted.json ベース) とは別物。
// こちらは「SNS への自動投稿の有無に関わらず X 用ネタを毎日くれる」配信。

import '../lib/env.js';
import { readdir, readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Logger } from '../lib/logger.js';
import { sendEmail } from '../lib/notify.js';
import { formatXPost, xWeight } from './format-post.js';
import type { ArticleMeta } from '../lib/select-article.js';
import type { Category } from '../types.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');
const X_EMAILED_PATH = join(process.cwd(), 'data', 'x-emailed.json');

async function existsLocal(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

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

interface XEmailedData {
  emails: { slug: string; emailedAt: string }[];
}

async function loadEmailed(): Promise<XEmailedData> {
  if (!(await existsLocal(X_EMAILED_PATH))) return { emails: [] };
  const text = await readFile(X_EMAILED_PATH, 'utf8');
  try {
    const obj = JSON.parse(text) as XEmailedData;
    return { emails: obj.emails ?? [] };
  } catch {
    return { emails: [] };
  }
}

async function saveEmailed(data: XEmailedData): Promise<void> {
  await mkdir(dirname(X_EMAILED_PATH), { recursive: true });
  await writeFile(X_EMAILED_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function parseFrontmatter(content: string, slug: string, lang: 'ja' | 'en', category: Category): ArticleMeta | null {
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
    pmid, category, lang, title, fact,
    bodyExcerpt: body,
    journal,
    year: yearStr ? Number(yearStr) : undefined,
    slug,
    generatedAt,
  };
}

async function listJaArticles(): Promise<ArticleMeta[]> {
  const articles: ArticleMeta[] = [];
  for (const category of ['psychology', 'biology'] as const) {
    const dir = join(CONTENT_DIR, 'ja', category);
    try {
      const files = await readdir(dir);
      for (const f of files) {
        if (!f.endsWith('.md')) continue;
        const slug = f.replace(/\.md$/, '');
        const content = await readFile(join(dir, f), 'utf8');
        const a = parseFrontmatter(content, slug, 'ja', category);
        if (a) articles.push(a);
      }
    } catch {
      // dir 無いだけ
    }
  }
  return articles;
}

async function loadCounterpart(slug: string, category: Category): Promise<ArticleMeta | null> {
  const path = join(CONTENT_DIR, 'en', category, `${slug}.md`);
  if (!(await existsLocal(path))) return null;
  const content = await readFile(path, 'utf8');
  return parseFrontmatter(content, slug, 'en', category);
}

interface CliArgs {
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return { dryRun: args.includes('--dry-run') };
}

async function main(): Promise<void> {
  const args = parseArgs();

  // 全 ja 記事を列挙
  const allJa = await listJaArticles();
  if (allJa.length === 0) {
    Logger.warn('ja 記事が見つかりません');
    return;
  }

  // 既に X 用にメール送信済みの slug を除外
  const emailedData = await loadEmailed();
  const emailedSet = new Set(emailedData.emails.map((e) => e.slug));
  const candidates = allJa.filter((a) => !emailedSet.has(a.slug));

  Logger.info(`ja 記事 ${allJa.length} 件中、X 用未送信 ${candidates.length} 件`);

  if (candidates.length === 0) {
    Logger.warn('全 ja 記事を X 用に送信済 → 今日の配信なし');
    return;
  }

  // oldest を選定 (generatedAt 昇順)
  candidates.sort((a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt));
  const article = candidates[0];

  Logger.info(`今日の X テンプレ対象: ${article.slug} (ja/${article.category}) "${article.title.slice(0, 40)}"`);

  // en 反対言語版もロード (ツリー返信用)
  const counterpart = await loadCounterpart(article.slug, article.category);

  // X 用テキスト整形
  const xText = formatXPost(article);
  const weight = xWeight(xText);
  Logger.info(`X 用テキスト (ja): ${weight} weighted chars`);

  let counterpartText = '';
  let counterpartWeight = 0;
  if (counterpart) {
    counterpartText = formatXPost(counterpart);
    counterpartWeight = xWeight(counterpartText);
    Logger.info(`X 用テキスト (en, ツリー返信用): ${counterpartWeight} weighted chars`);
  } else {
    Logger.warn('en 版がないためツリー返信なし');
  }

  const subject = `[PubMed Trivia] 今日の X 投稿テンプレ: ${article.title.slice(0, 30)}`;

  // square 画像を添付
  const squareImagePath = join(
    process.cwd(),
    'public',
    'square',
    'ja',
    `${article.slug}.png`,
  );
  const hasImage = await existsLocal(squareImagePath);

  const bodyLines: string[] = [
    '# 今日の X (旧 Twitter) 投稿テンプレ',
    '',
    '## ⚠️ 現在 SNS 自動投稿は停止中',
    'Meta 開発者アカウントの認証 UI バグにより、Threads/FB/IG への自動投稿は',
    '一時停止しています (Meta 復旧待ち)。',
    'X 手動投稿だけは継続するため、毎日このテンプレが届きます。',
    '',
    '## 🐦 X — ツリー投稿で algorithm に乗せる',
    '',
    '【運用手順】',
    '  1. 下の「親ポスト」を X に投稿',
    '  2. 自分のその投稿に対して「ツリー返信」をリプライ',
    '  3. 同じ記事の日英をスレッドで繋げると engagement ↑',
    '',
    '────────────────────────────────────',
    '## 🇯🇵 親ポスト (日本語)',
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
      '## 🇺🇸 ツリー返信 (英語)',
      '上の親ポストを投稿した後、その投稿に「返信」する形でツリー化',
      `=== ここからコピー (${counterpartWeight} weighted chars / 上限 25000) ===`,
      '',
      counterpartText,
      '',
      '=== ここまでコピー ===',
      '',
    );
  }

  bodyLines.push(
    '## 📷 Instagram 用 (Meta 復旧後に手動でも可)',
    hasImage
      ? '添付の正方形画像 (1080×1080) を Instagram にアップ → 親ポストのテキストをキャプションに貼り付け。'
      : '画像未生成。`npm run generate:og -- --size=square` で生成可能。',
    '',
    `📊 記事 URL:`,
    `   - ja: ${process.env.SITE_URL || 'https://sciencepubmed.net'}/ja/${article.category}/${article.slug}/`,
    `   - en: ${process.env.SITE_URL || 'https://sciencepubmed.net'}/en/${article.category}/${article.slug}/`,
    `   - PMID: ${article.pmid}`,
    '',
    `📅 残り未送信ストック: ${candidates.length - 1} 件 (今日の分を引いた数)`,
    '',
    '🤖 PubMed Trivia bot — X 用 daily 配信 (Meta 無関係)',
  );

  const body = bodyLines.join('\n');

  if (args.dryRun) {
    Logger.info(`[dry-run] subject="${subject}"`);
    Logger.info(`[dry-run] body length: ${body.length} chars`);
    Logger.info(`[dry-run] x-emailed.json に追加されない (--dry-run のため)`);
    return;
  }

  await sendEmail({
    subject,
    body,
    attachments: hasImage
      ? [{ filename: `${article.slug}.png`, path: squareImagePath }]
      : undefined,
  });

  // 送信成功後に x-emailed.json に追加
  emailedData.emails.push({ slug: article.slug, emailedAt: new Date().toISOString() });
  await saveEmailed(emailedData);
  Logger.info(`✅ x-emailed.json に記録: ${article.slug}`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
