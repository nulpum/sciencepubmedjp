// Facebook Page 投稿クライアント (Graph API)
//
// エンドポイント: POST https://graph.facebook.com/v21.0/{page-id}/feed
// 必要 env:
//   FACEBOOK_PAGE_ID
//   FACEBOOK_PAGE_ACCESS_TOKEN  (Page Access Token, 60日有効)
//
// 取得方法:
//   1. developers.facebook.com → 既存アプリ (Threads と共用可)
//   2. 「ツール」→「Graph API Explorer」
//   3. 権限 (Permissions): pages_manage_posts, pages_read_engagement, pages_show_list を追加
//   4. User Access Token を発行 (Threads と同じく自分の FB ログインで承認)
//   5. GET /me/accounts → 表示された Page の access_token を取る (これが Page Access Token)
//   6. 長期化: GET /oauth/access_token?grant_type=fb_exchange_token&...
//      ※ User Token を長期化してから /me/accounts を再取得 → Page Token も長期化される
//
// Page 投稿は Threads より単純: 1 リクエストで完結。

import { Logger } from '../lib/logger.js';

const API_BASE = 'https://graph.facebook.com/v21.0';

interface FacebookConfig {
  pageId: string;
  accessToken: string;
}

function readConfig(): FacebookConfig {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !accessToken) {
    throw new Error('FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN が未設定です');
  }
  return { pageId, accessToken };
}

interface PublishResponse {
  id: string; // {page-id}_{post-id} 形式
}

// 2 段階方式:
//   Step 1: 設定された token (User or Page どちらでも可) で /{page_id}?fields=access_token を叩き、
//           「本物の Page Token」を都度取得する。
//   Step 2: その Page Token で /{page_id}/feed に POST。
//
// 理由: .env に保存しているのが "Page-scoped User Token" だと FB が User と判定して #200 を返す。
//       実行時に Page Token を再取得することで、入力トークンの種類に関係なく動く。
async function fetchPageAccessToken(): Promise<string> {
  const config = readConfig();
  const url = new URL(`${API_BASE}/${config.pageId}`);
  url.searchParams.set('fields', 'access_token');
  url.searchParams.set('access_token', config.accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `fetchPageAccessToken failed: ${res.status} ${errText.slice(0, 500)}`,
    );
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error('Page Token がレスポンスに含まれていません');
  }
  return json.access_token;
}

// Page にテキスト + リンク投稿
// link を指定すると Facebook がそのページの OGP を読んで自動でカードプレビュー化
export async function postToFacebook(params: {
  message: string;
  link?: string;
}): Promise<{ postId: string }> {
  const { message, link } = params;
  const config = readConfig();

  // Step 1: 本物の Page Token を都度取得
  const pageToken = await fetchPageAccessToken();
  Logger.info(`Page Token 取得 OK (len=${pageToken.length})`);

  // Step 2: Page Token で投稿
  const url = `${API_BASE}/${config.pageId}/feed`;
  const body = new URLSearchParams({
    message,
    access_token: pageToken,
  });
  if (link) body.set('link', link);

  Logger.info(`Facebook 投稿: ${message.length} chars${link ? ` link=${link}` : ''}`);
  const res = await fetch(url, {
    method: 'POST',
    body,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`postToFacebook failed: ${res.status} ${errText.slice(0, 500)}`);
  }
  const json = (await res.json()) as PublishResponse;
  Logger.info(`公開成功: post_id=${json.id}`);
  return { postId: json.id };
}

export function dryRunFacebook(params: { message: string; link?: string }): void {
  const { message, link } = params;
  Logger.info(`[dry-run] Facebook 投稿予定: ${message.length} chars`);
  if (link) Logger.info(`[dry-run] link (auto-preview): ${link}`);
  Logger.info(`---\n${message}\n---`);
}
