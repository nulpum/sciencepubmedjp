// 辞書エントリを 1 用語ずつ Bluesky + Threads に投稿
//
// 使い方:
//   npm run post:dict             # 未投稿から1件自動選択
//   npm run post:dict -- --slug=xxx   # 指定 slug
//   npm run post:dict -- --dry    # ドライラン (投稿せず内容確認のみ)
//
// 投稿済み記録: data/dict/posted.json

import '../lib/env.js';
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { DictEntry, DictCategory } from '../types.js';
import { postToBluesky, dryRunBluesky } from '../bluesky/post.js';
import { postToThreads, dryRunThreads } from '../threads/post.js';

const ENTRIES_DIR = join(process.cwd(), 'data', 'dict', 'entries');
const POSTED_PATH = join(process.cwd(), 'data', 'dict', 'posted.json');
const SITE_URL = process.env.SITE_URL || 'https://sciencepubmed.net';

const CATEGORY_HASHTAGS: Record<DictCategory, string[]> = {
  research: ['研究', '統計', 'EBM'],
  biology: ['生物学', 'ライフサイエンス'],
  psychology: ['心理学', 'メンタルヘルス'],
  'nursing-pharma': ['看護', '薬学'],
};

interface PostedLog {
  posts: { slug: string; postedAt: string; blueskyUrl?: string; threadId?: string }[];
}

async function loadPosted(): Promise<PostedLog> {
  try {
    const txt = await readFile(POSTED_PATH, 'utf-8');
    return JSON.parse(txt);
  } catch {
    return { posts: [] };
  }
}

async function savePosted(log: PostedLog): Promise<void> {
  await mkdir(join(POSTED_PATH, '..'), { recursive: true });
  await writeFile(POSTED_PATH, JSON.stringify(log, null, 2), 'utf-8');
}

async function loadAllEntries(): Promise<DictEntry[]> {
  const files = await readdir(ENTRIES_DIR);
  const out: DictEntry[] = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try { out.push(JSON.parse(await readFile(join(ENTRIES_DIR, f), 'utf-8'))); } catch {}
  }
  return out;
}

async function pickNext(): Promise<DictEntry | null> {
  const [entries, log] = await Promise.all([loadAllEntries(), loadPosted()]);
  const postedSlugs = new Set(log.posts.map(p => p.slug));
  const candidates = entries.filter(e => !postedSlugs.has(e.slug));
  if (candidates.length === 0) return null;
  // 累計hits が多い (= 検索されやすい) 順で未投稿から1件
  candidates.sort((a, b) => b.pubmedCount - a.pubmedCount);
  return candidates[0];
}

function buildPostText(entry: DictEntry, maxChars: number): string {
  const url = `${SITE_URL}/ja/dict/${entry.slug}/?utm_source=${maxChars === 300 ? 'bluesky' : 'threads'}&utm_medium=social&utm_campaign=dict_daily`;
  const hashtags = ['#PubMed', '#英語論文', ...CATEGORY_HASHTAGS[entry.category].map(h => `#${h}`)].slice(0, 4).join(' ');
  const header = `【PubMed英語用語】${entry.ja}${entry.abbr ? ` (${entry.abbr})` : ''}\n英語表記: ${entry.en}\n`;
  const footer = `\n詳しい解説と検索クエリ → ${url}\n${hashtags}`;
  const remaining = maxChars - [...header].length - [...footer].length - 2;
  let desc = entry.description.ja;
  if ([...desc].length > remaining) {
    // grapheme 単位でクリップ
    const chars = [...desc];
    desc = chars.slice(0, Math.max(0, remaining - 1)).join('') + '…';
  }
  return `${header}\n${desc}\n${footer}`;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const slugArg = args.find(a => a.startsWith('--slug='));
  const slug = slugArg ? slugArg.split('=')[1] : null;

  let entry: DictEntry | null;
  if (slug) {
    const path = join(ENTRIES_DIR, `${slug}.json`);
    try { entry = JSON.parse(await readFile(path, 'utf-8')); }
    catch { console.error(`not found: ${slug}`); process.exit(1); }
  } else {
    entry = await pickNext();
  }
  if (!entry) {
    console.log('no unposted entries left');
    return;
  }

  const blueskyText = buildPostText(entry, 300);
  const threadsText = buildPostText(entry, 500);

  console.log(`=== ${entry.slug} ===`);
  console.log('--- bluesky (300) ---');
  console.log(blueskyText);
  console.log(`len=${[...blueskyText].length}`);
  console.log('--- threads (500) ---');
  console.log(threadsText);
  console.log(`len=${[...threadsText].length}`);

  if (dry) {
    console.log('[dry-run] not posting');
    return;
  }

  const blueskyOk = dryRunBluesky(blueskyText);
  const threadsOk = dryRunThreads(threadsText);
  if (blueskyOk.overflow) { console.error('bluesky overflow'); process.exit(1); }
  if (threadsOk.overflow) { console.error('threads overflow'); process.exit(1); }

  const log = await loadPosted();
  let bsResult: any, thResult: any;
  try {
    bsResult = await postToBluesky(blueskyText);
    console.log('bluesky posted:', bsResult.url);
  } catch (e: any) {
    console.error('bluesky failed:', e.message);
  }
  try {
    thResult = await postToThreads(threadsText);
    console.log('threads posted:', thResult.threadId);
  } catch (e: any) {
    console.error('threads failed:', e.message);
  }

  if (bsResult || thResult) {
    log.posts.push({
      slug: entry.slug,
      postedAt: new Date().toISOString(),
      blueskyUrl: bsResult?.url,
      threadId: thResult?.threadId,
    });
    await savePosted(log);
    console.log(`recorded: ${log.posts.length} total posted`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
