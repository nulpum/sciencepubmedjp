// 既存記事を新プロンプトで一括再生成 (バックフィル)
//
// 目的: AdSense 「有用性の低いコンテンツ」 判定対策として、既存の薄い記事
// (200-400字) を新プロンプトの 5 セクション構成 (800-1500字) に置き換える。
//
// 動作:
//   1. src/content/{lang}/{category}/ から全 .md を列挙し PMID + category を抽出
//   2. PMID 単位で raw を取得 (out/raw/{pmid}.json があれば使う、無ければ efetch)
//   3. generateBothLangs で ja + en を新プロンプトで再生成
//   4. 既存 slug を維持したまま src/content/{lang}/{category}/{slug}.md を上書き
//   5. affiliate_links は select-books で再生成
//
// 使い方:
//   npm run gen:backfill-prompt                          # 全件
//   npm run gen:backfill-prompt -- --pmid=39523882       # 1件だけ
//   npm run gen:backfill-prompt -- --only-missing-sections  # 5 ## セクションが揃ってない記事のみ
//   npm run gen:backfill-prompt -- --dry-run             # 件数確認のみ

import '../lib/env.js';
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '../lib/logger.js';
import { writeGeneratedArticle, writeRawArticle } from '../lib/files.js';
import { fetchArticle } from '../pubmed/fetch.js';
import { generateBothLangs } from '../claude/generate.js';
import { selectRelatedBooks } from '../amazon/select-books.js';
import type { Category, PubmedArticle } from '../types.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');
const RAW_DIR = join(process.cwd(), 'out', 'raw');

interface ArticleRef {
  slug: string;
  pmid: string;
  category: Category;
}

async function existsLocal(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// 既存記事を列挙して (slug, pmid, category) のユニーク集合を返す
async function listExistingArticles(): Promise<ArticleRef[]> {
  const refs = new Map<string, ArticleRef>();
  for (const category of ['psychology', 'biology'] as Category[]) {
    // ja の側を見れば PMID は en と同じ
    const dir = join(CONTENT_DIR, 'ja', category);
    try {
      const files = await readdir(dir);
      for (const f of files) {
        if (!f.endsWith('.md')) continue;
        const slug = f.replace(/\.md$/, '');
        // slug = YYYYMMDD-PMID
        const m = slug.match(/^\d{8}-(\d+)$/);
        if (!m) continue;
        const pmid = m[1];
        const key = `${pmid}-${category}`;
        if (!refs.has(key)) refs.set(key, { slug, pmid, category });
      }
    } catch {
      // dir 無いだけ
    }
  }
  return [...refs.values()];
}

async function loadOrFetchRaw(pmid: string): Promise<PubmedArticle> {
  const rawPath = join(RAW_DIR, `${pmid}.json`);
  if (await existsLocal(rawPath)) {
    const text = await readFile(rawPath, 'utf8');
    return JSON.parse(text) as PubmedArticle;
  }
  Logger.info(`raw 無し、PubMed から再 fetch: PMID=${pmid}`);
  const article = await fetchArticle(pmid);
  await writeRawArticle(article);
  return article;
}

interface CliArgs {
  pmid?: string;
  onlyMissingSections: boolean;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const pmidArg = args.find((a) => a.startsWith('--pmid='));
  return {
    pmid: pmidArg?.split('=')[1],
    onlyMissingSections: args.includes('--only-missing-sections'),
    dryRun: args.includes('--dry-run'),
  };
}

// 記事ファイルの body 内に "## " で始まる H2 見出しが何個あるかを数える
async function countSections(slug: string, category: Category): Promise<number> {
  const path = join(CONTENT_DIR, 'ja', category, `${slug}.md`);
  try {
    const text = await readFile(path, 'utf8');
    const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
    const body = m ? m[1] : text;
    const headings = body.match(/^##\s/gm);
    return headings ? headings.length : 0;
  } catch {
    return 0;
  }
}

async function processOne(ref: ArticleRef): Promise<void> {
  Logger.info(`--- backfill: ${ref.slug} (${ref.category}, PMID=${ref.pmid}) ---`);

  const raw = await loadOrFetchRaw(ref.pmid);
  const { ja, en } = await generateBothLangs(raw, ref.category);

  // affiliate_links を再生成 (既存と同じロジック)
  const [jaBooks, enBooks] = await Promise.all([
    selectRelatedBooks(raw, ref.category, 2, 'ja'),
    selectRelatedBooks(raw, ref.category, 2, 'en'),
  ]);
  if (jaBooks.length > 0) ja.affiliateLinks = jaBooks;
  if (enBooks.length > 0) en.affiliateLinks = enBooks;

  // 既存 slug をそのまま使って上書き
  const jaPath = await writeGeneratedArticle(ja, ref.slug);
  const enPath = await writeGeneratedArticle(en, ref.slug);
  Logger.info(`✅ ${jaPath}`);
  Logger.info(`✅ ${enPath}`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const all = await listExistingArticles();
  Logger.info(`既存記事 ${all.length} 件を検出`);

  let targets: ArticleRef[];
  if (args.pmid) {
    targets = all.filter((r) => r.pmid === args.pmid);
    if (targets.length === 0) {
      throw new Error(`PMID=${args.pmid} に該当する記事が見つかりません`);
    }
  } else if (args.onlyMissingSections) {
    // 新フォーマット (5 セクション) でない記事だけ対象に
    const filtered: ArticleRef[] = [];
    for (const r of all) {
      const n = await countSections(r.slug, r.category);
      if (n < 5) filtered.push(r);
    }
    targets = filtered;
    Logger.info(`--only-missing-sections: 5 セクション未満の記事 ${targets.length} 件を対象に`);
  } else {
    targets = all;
  }
  Logger.info(`バックフィル対象: ${targets.length} 件`);

  if (args.dryRun) {
    for (const r of targets) Logger.info(`[dry-run] ${r.slug} (${r.category})`);
    return;
  }

  let success = 0;
  let failed: { ref: ArticleRef; error: string }[] = [];
  for (const r of targets) {
    try {
      await processOne(r);
      success++;
    } catch (e) {
      const msg = (e as Error).message;
      Logger.error(`失敗: ${r.slug} → ${msg}`);
      failed.push({ ref: r, error: msg });
    }
  }
  Logger.info(`=== 完了: 成功 ${success}/${targets.length}, 失敗 ${failed.length} ===`);
  if (failed.length > 0) {
    Logger.warn(`失敗一覧: ${JSON.stringify(failed.map((f) => ({ slug: f.ref.slug, error: f.error })))}`);
  }
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
