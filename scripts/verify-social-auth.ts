// Bluesky と X の auth 確認 (投稿はしない、login のみ)
// 実行: npx tsx scripts/verify-social-auth.ts
import './lib/env.js';
import { AtpAgent } from '@atproto/api';
import { TwitterApi } from 'twitter-api-v2';

async function checkBluesky(): Promise<void> {
  const handle = process.env.BLUESKY_HANDLE;
  const pw = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !pw) {
    console.log('❌ Bluesky: env 未設定 (BLUESKY_HANDLE / BLUESKY_APP_PASSWORD)');
    return;
  }
  try {
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    const res = await agent.login({ identifier: handle, password: pw });
    console.log(`✅ Bluesky auth OK: @${res.data.handle}`);
  } catch (e) {
    console.log(`❌ Bluesky auth FAIL: ${(e as Error).message}`);
  }
}

async function checkX(): Promise<void> {
  const k = process.env.TWITTER_API_KEY;
  const s = process.env.TWITTER_API_SECRET;
  const t = process.env.TWITTER_ACCESS_TOKEN;
  const ts = process.env.TWITTER_ACCESS_SECRET;
  if (!k || !s || !t || !ts) {
    console.log('❌ X: env 未設定 (TWITTER_API_KEY / _SECRET / _ACCESS_TOKEN / _ACCESS_SECRET)');
    return;
  }
  try {
    const client = new TwitterApi({ appKey: k, appSecret: s, accessToken: t, accessSecret: ts });
    const me = await client.v2.me();
    console.log(`✅ X auth OK: @${me.data.username}`);
  } catch (e) {
    console.log(`❌ X auth FAIL: ${(e as Error).message}`);
  }
}

(async () => {
  await checkBluesky();
  await checkX();
})();
