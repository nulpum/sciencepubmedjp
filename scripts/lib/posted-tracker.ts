// 投稿履歴トラッカー (プラットフォーム横断)
//
// `out/posted.json` に「どのスラグを どの SNS に いつ投稿したか」を記録する。
// 重複投稿防止 + 後の反応分析に使う。
//
// JSON 形式:
// {
//   "posts": [
//     { "platform": "threads", "slug": "20260514-40287119", "lang": "ja",
//       "category": "psychology", "postedAt": "2026-05-15T12:34:56Z",
//       "postId": "1234..." },
//     { "platform": "facebook", "slug": "...", ... }
//   ]
// }

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// data/ は git 管理対象 (GitHub Actions が commit して履歴永続化)
// 旧 out/posted.json があれば後方互換で読み込む。
const TRACKER_PATH = join(process.cwd(), 'data', 'posted.json');
const LEGACY_PATH = join(process.cwd(), 'out', 'posted.json');

export type Platform = 'threads' | 'facebook';

export interface PostedRecord {
  platform: Platform;
  slug: string;
  lang: 'ja' | 'en';
  category: 'psychology' | 'biology';
  postedAt: string;
  postId?: string;
}

interface TrackerData {
  posts: PostedRecord[];
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
  // 新パス → 旧パスの順で探す
  const path = (await exists(TRACKER_PATH))
    ? TRACKER_PATH
    : (await exists(LEGACY_PATH)) ? LEGACY_PATH : null;
  if (!path) return { posts: [] };
  const text = await readFile(path, 'utf8');
  const raw = JSON.parse(text) as Partial<TrackerData> & { threads?: PostedRecord[] };
  // 旧形式 ({threads:[...]}) からの自動移行
  if (raw.threads && !raw.posts) {
    return { posts: raw.threads.map((r) => ({ ...r, platform: 'threads' as const })) };
  }
  return { posts: raw.posts ?? [] };
}

async function save(data: TrackerData): Promise<void> {
  await mkdir(dirname(TRACKER_PATH), { recursive: true });
  await writeFile(TRACKER_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// 同一 slug × lang × platform は重複扱い
export async function isPosted(
  slug: string,
  lang: 'ja' | 'en',
  platform: Platform,
): Promise<boolean> {
  const data = await load();
  return data.posts.some(
    (r) => r.slug === slug && r.lang === lang && r.platform === platform,
  );
}

export async function recordPost(record: PostedRecord): Promise<void> {
  const data = await load();
  data.posts.push(record);
  await save(data);
}

export async function getAllPosted(platform?: Platform): Promise<PostedRecord[]> {
  const data = await load();
  return platform ? data.posts.filter((p) => p.platform === platform) : data.posts;
}
