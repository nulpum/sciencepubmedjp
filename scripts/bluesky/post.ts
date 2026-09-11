// Bluesky 投稿クライアント (AT Protocol)
//
// @atproto/api SDK を使って app.bsky.feed.post を作成する。
// 認証は App Password (bsky.app の設定画面で発行、4 単語形式)。
//
// 必要 env:
//   BLUESKY_HANDLE         @xxx.bsky.social (@ なし)
//   BLUESKY_APP_PASSWORD   4 単語 (xxxx-xxxx-xxxx-xxxx)
//
// 使い方:
//   import { postToBluesky, dryRunBluesky } from './post.js';
//   const { uri, url } = await postToBluesky('こんにちは Bluesky');

import { AtpAgent } from '@atproto/api';
import { Logger } from '../lib/logger.js';

const MAX_POST_CHARS = 300;
const SERVICE_URL = 'https://bsky.social';

export interface PostResult {
  uri: string;
  url: string;
  cid: string;
}

function extractRkey(uri: string): string | null {
  const m = uri.match(/\/app\.bsky\.feed\.post\/([^/]+)$/);
  return m ? m[1] : null;
}

export async function postToBluesky(text: string): Promise<PostResult> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) {
    throw new Error('BLUESKY_HANDLE / BLUESKY_APP_PASSWORD が未設定');
  }
  if (!text || text.trim().length === 0) {
    throw new Error('text が空です');
  }
  const graphemeLen = [...text].length;
  if (graphemeLen > MAX_POST_CHARS) {
    throw new Error(`text が長すぎ (${graphemeLen} > ${MAX_POST_CHARS} graphemes)`);
  }

  const agent = new AtpAgent({ service: SERVICE_URL });
  Logger.info(`Bluesky ログイン: ${handle}`);
  await agent.login({ identifier: handle, password });

  Logger.info(`Bluesky 投稿試行: ${graphemeLen} chars`);
  const res = await agent.post({
    text,
    createdAt: new Date().toISOString(),
  });
  const rkey = extractRkey(res.uri);
  const url = rkey
    ? `https://bsky.app/profile/${handle}/post/${rkey}`
    : `https://bsky.app/profile/${handle}`;
  Logger.info(`✅ Bluesky 投稿成功: ${url}`);
  return { uri: res.uri, url, cid: res.cid };
}

export function dryRunBluesky(text: string): { length: number; overflow: boolean } {
  const length = [...text].length;
  const overflow = length > MAX_POST_CHARS;
  Logger.info(`[dry-run] Bluesky 投稿予定: ${length}/${MAX_POST_CHARS} chars${overflow ? ' ⚠️ overflow' : ''}`);
  return { length, overflow };
}
