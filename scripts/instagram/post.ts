// Instagram Graph API クライアント
//
// 仕様:
//   - IG Business アカウント + 連携した Facebook ページ が必須
//   - 投稿は 2 段階:
//       1. POST /{ig-user-id}/media (image_url + caption で container 作成)
//       2. POST /{ig-user-id}/media_publish (container を公開)
//   - 画像は **HTTPS で公開アクセス可能な URL** が必要 (Cloudflare 経由の画像 URL)
//   - 必要 env:
//       INSTAGRAM_USER_ID   (IG Business アカウントの API ID)
//       INSTAGRAM_ACCESS_TOKEN (= FB Page Token または同等、scope に
//                             instagram_basic / instagram_content_publish が必要)
//
// IG_USER_ID の取得:
//   GET /{page-id}?fields=instagram_business_account
//   → response.instagram_business_account.id

import { Logger } from '../lib/logger.js';

const API_BASE = 'https://graph.facebook.com/v21.0';

interface IgConfig {
  userId: string;
  accessToken: string;
}

function readConfig(): IgConfig {
  const userId = process.env.INSTAGRAM_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!userId || !accessToken) {
    throw new Error('INSTAGRAM_USER_ID / INSTAGRAM_ACCESS_TOKEN が未設定です');
  }
  return { userId, accessToken };
}

interface CreateContainerResponse {
  id: string;
}

async function createContainer(params: {
  imageUrl: string;
  caption: string;
}): Promise<string> {
  const config = readConfig();
  const url = `${API_BASE}/${config.userId}/media`;
  const body = new URLSearchParams({
    image_url: params.imageUrl,
    caption: params.caption,
    access_token: config.accessToken,
  });

  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`IG createContainer failed: ${res.status} ${errText.slice(0, 500)}`);
  }
  const json = (await res.json()) as CreateContainerResponse;
  return json.id;
}

async function publishContainer(creationId: string): Promise<string> {
  const config = readConfig();
  const url = `${API_BASE}/${config.userId}/media_publish`;
  const body = new URLSearchParams({
    creation_id: creationId,
    access_token: config.accessToken,
  });
  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`IG publishContainer failed: ${res.status} ${errText.slice(0, 500)}`);
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function postToInstagram(params: {
  imageUrl: string;
  caption: string;
}): Promise<{ mediaId: string }> {
  Logger.info(`IG 投稿: caption=${params.caption.length} chars, image=${params.imageUrl}`);
  const containerId = await createContainer(params);
  Logger.info(`コンテナ作成: ${containerId}`);

  // Meta 推奨: 公開前に画像取り込みのため少し待つ
  await new Promise((r) => setTimeout(r, 3000));

  const mediaId = await publishContainer(containerId);
  Logger.info(`公開成功: ig_media_id=${mediaId}`);
  return { mediaId };
}

export function dryRunInstagram(params: { imageUrl: string; caption: string }): void {
  Logger.info(`[dry-run] IG 投稿予定: caption=${params.caption.length} chars`);
  Logger.info(`[dry-run] image_url: ${params.imageUrl}`);
  Logger.info(`[dry-run] caption:\n${params.caption}`);
}
