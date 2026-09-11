// X (Twitter) 自動投稿クライアント (Pay Per Use)
//
// twitter-api-v2 SDK を使って POST /2/tweets を叩く。
// 認証は OAuth 1.0a User Context (Consumer key + Access token 4 個)。
//
// 必要 env:
//   TWITTER_API_KEY         Consumer Key
//   TWITTER_API_SECRET      Consumer Secret
//   TWITTER_ACCESS_TOKEN    @science_pubmed 用アクセストークン (Read+Write)
//   TWITTER_ACCESS_SECRET   Access Token Secret
//
// 使い方:
//   import { postToX, dryRunX } from './post.js';
//   const { tweetId } = await postToX('こんにちは');

import { TwitterApi } from 'twitter-api-v2';
import { Logger } from '../lib/logger.js';

const MAX_TWEET_CHARS = 280;

export interface PostResult {
  tweetId: string;
  url: string;
}

function getClient(): TwitterApi {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    throw new Error(
      'X 認証情報が不足 (TWITTER_API_KEY / API_SECRET / ACCESS_TOKEN / ACCESS_SECRET のいずれかが未設定)',
    );
  }
  return new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });
}

/**
 * X に投稿。 280 chars 超えたら例外。
 */
export async function postToX(text: string): Promise<PostResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('text が空です');
  }
  // 文字数チェック (X は URL を t.co で 23 chars と計算するが、
  // ここでは concervative に生の length で判定)
  if (text.length > MAX_TWEET_CHARS) {
    throw new Error(`text が長すぎ (${text.length} > ${MAX_TWEET_CHARS})`);
  }

  const client = getClient();
  Logger.info(`X 投稿試行: ${text.length} chars`);
  const res = await client.v2.tweet(text);
  const tweetId = res.data.id;
  const url = `https://x.com/science_pubmed/status/${tweetId}`;
  Logger.info(`✅ X 投稿成功: ${url}`);
  return { tweetId, url };
}

/**
 * dry-run: 実際には投稿せず、内容のみログ出力
 */
export function dryRunX(text: string): { length: number; overflow: boolean } {
  const length = text.length;
  const overflow = length > MAX_TWEET_CHARS;
  Logger.info(`[dry-run] X 投稿予定: ${length}/${MAX_TWEET_CHARS} chars${overflow ? ' ⚠️ overflow' : ''}`);
  return { length, overflow };
}
