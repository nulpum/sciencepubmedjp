// Threads API クライアント
//
// Meta が 2024 年に公開した Threads API (graph.threads.net)。
// 投稿は 2 段階:
//   1. POST /me/threads → メディアコンテナ作成 (text only or with media)
//   2. POST /me/threads_publish → コンテナを公開
//
// 必要 env:
//   THREADS_ACCESS_TOKEN  (long-lived access token, 60日有効)
//   THREADS_USER_ID       (= "me" でも動くが明示推奨)
//
// 取得方法: developers.facebook.com → アプリ作成 → Threads API 製品追加
//          → User Token Generator で long-lived token を発行
//
// Rate limit: 250 投稿/24h (3-5投稿/日では余裕)
// docs: https://developers.facebook.com/docs/threads

import { Logger } from '../lib/logger.js';

const API_BASE = 'https://graph.threads.net/v1.0';

interface ThreadsConfig {
  accessToken: string;
  userId: string;
}

function readConfig(): ThreadsConfig {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('THREADS_ACCESS_TOKEN が未設定です (.env を確認)');
  }
  const userId = process.env.THREADS_USER_ID || 'me';
  return { accessToken, userId };
}

interface CreateContainerResponse {
  id: string;
}

interface PublishResponse {
  id: string;
}

// Step 1: メディアコンテナを作成
async function createContainer(text: string): Promise<string> {
  const config = readConfig();
  const url = `${API_BASE}/${config.userId}/threads`;
  const params = new URLSearchParams({
    media_type: 'TEXT',
    text,
    access_token: config.accessToken,
  });

  const res = await fetch(url, {
    method: 'POST',
    body: params,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`createContainer failed: ${res.status} ${errText.slice(0, 500)}`);
  }
  const json = (await res.json()) as CreateContainerResponse;
  return json.id;
}

// Step 2: コンテナを公開
async function publishContainer(containerId: string): Promise<string> {
  const config = readConfig();
  const url = `${API_BASE}/${config.userId}/threads_publish`;
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: config.accessToken,
  });

  const res = await fetch(url, {
    method: 'POST',
    body: params,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`publishContainer failed: ${res.status} ${errText.slice(0, 500)}`);
  }
  const json = (await res.json()) as PublishResponse;
  return json.id; // 投稿された Thread ID
}

// 高レベル: テキストを Threads に投稿
export async function postToThreads(text: string): Promise<{ threadId: string }> {
  Logger.info(`Threads 投稿: ${text.length} chars`);
  const containerId = await createContainer(text);
  Logger.info(`コンテナ作成: ${containerId}`);

  // Meta の推奨: コンテナ作成 → 公開の間に少し待つ (処理時間確保)
  await new Promise((r) => setTimeout(r, 1500));

  const threadId = await publishContainer(containerId);
  Logger.info(`公開成功: thread_id=${threadId}`);
  return { threadId };
}

// dry-run: 実投稿せず内容と長さだけ確認
export function dryRunThreads(text: string): { length: number; overflow: boolean } {
  const length = text.length;
  const overflow = length > 500;
  Logger.info(`[dry-run] Threads 投稿予定: ${length}/500 chars${overflow ? ' ⚠️ OVERFLOW' : ''}`);
  Logger.info(`---\n${text}\n---`);
  return { length, overflow };
}
