// 投稿履歴トラッカー
//
// `out/posted.json` に「どのスラグを何時に Threads 投稿したか」を記録する。
// 重複投稿防止 + 後で「投稿後の反応分析」に使える。
//
// JSON 形式:
// {
//   "threads": [
//     { "slug": "20260514-40287119", "lang": "ja", "category": "psychology",
//       "postedAt": "2026-05-15T12:34:56.789Z", "threadId": "1234..." }
//   ]
// }

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const TRACKER_PATH = join(process.cwd(), 'out', 'posted.json');

export interface PostedRecord {
  slug: string;
  lang: 'ja' | 'en';
  category: 'psychology' | 'biology';
  postedAt: string;
  threadId?: string;
}

interface TrackerData {
  threads: PostedRecord[];
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function load(): Promise<TrackerData> {
  if (!(await exists(TRACKER_PATH))) {
    return { threads: [] };
  }
  const text = await readFile(TRACKER_PATH, 'utf8');
  return JSON.parse(text) as TrackerData;
}

async function save(data: TrackerData): Promise<void> {
  await mkdir(dirname(TRACKER_PATH), { recursive: true });
  await writeFile(TRACKER_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// slug+lang を一意キーとして判定
export async function isPosted(slug: string, lang: 'ja' | 'en'): Promise<boolean> {
  const data = await load();
  return data.threads.some((r) => r.slug === slug && r.lang === lang);
}

export async function recordPost(record: PostedRecord): Promise<void> {
  const data = await load();
  data.threads.push(record);
  await save(data);
}

export async function getAllPosted(): Promise<PostedRecord[]> {
  const data = await load();
  return data.threads;
}
