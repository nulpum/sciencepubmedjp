// Threads Access Token 自動リフレッシュ
//
// Threads API の long-lived token は 60 日で失効する。Meta は失効前に
// `refresh_access_token` endpoint 経由でトークンをさらに 60 日延長できる。
//
// Ref: https://developers.facebook.com/docs/threads/get-started/long-lived-tokens
//
// 使い方:
//   npm run refresh:threads-token                  # 実行
//   npm run refresh:threads-token -- --dry-run     # 内容のみ確認 (実際には refresh しない)
//
// GH Actions cron から 45 日毎に呼ばれる想定。
//
// 実行後の挙動:
//   1. refresh に成功したら、新 token を Gmail に送信 (常時)
//   2. PAT_FOR_SECRETS 環境変数があれば、GH Secrets も自動更新 (fully-automated)
//   3. PAT が無ければ Gmail 通知だけ (ユーザーが手動で GH Secret を更新)

import '../lib/env.js';
import { Logger } from '../lib/logger.js';
import { sendEmail } from '../lib/notify.js';

interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // 秒
}

async function refreshThreadsToken(currentToken: string): Promise<RefreshResponse> {
  const url = new URL('https://graph.threads.net/refresh_access_token');
  url.searchParams.set('grant_type', 'th_refresh_token');
  url.searchParams.set('access_token', currentToken);

  const res = await fetch(url.toString());
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`refresh_access_token failed: ${res.status} ${text}`);
  }
  const json = JSON.parse(text) as RefreshResponse;
  if (!json.access_token) {
    throw new Error(`refresh response missing access_token: ${text}`);
  }
  return json;
}

// 現在の token が有効か軽くチェック (期限切れなら refresh も失敗するので事前検出)
async function verifyToken(token: string): Promise<{ id: string; username: string } | null> {
  try {
    const url = new URL('https://graph.threads.net/v1.0/me');
    url.searchParams.set('fields', 'id,username');
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const j = (await res.json()) as { id?: string; username?: string };
    if (!j.id) return null;
    return { id: j.id, username: j.username || '?' };
  } catch {
    return null;
  }
}

function parseArgs(): { dryRun: boolean } {
  return { dryRun: process.argv.includes('--dry-run') };
}

async function main(): Promise<void> {
  const args = parseArgs();

  const currentToken = process.env.THREADS_ACCESS_TOKEN?.trim();
  if (!currentToken) throw new Error('THREADS_ACCESS_TOKEN が未設定です');

  Logger.info(`Threads token 検証中... (length=${currentToken.length})`);
  const me = await verifyToken(currentToken);
  if (!me) {
    throw new Error(
      'Threads token が既に無効または期限切れです。手動で User Token Generator から新規発行してください。'
    );
  }
  Logger.info(`✅ Token 有効 (username=@${me.username}, id=${me.id})`);

  if (args.dryRun) {
    Logger.info('[dry-run] 実際の refresh は行いません');
    return;
  }

  Logger.info('Threads API refresh_access_token を呼び出し中...');
  const refreshed = await refreshThreadsToken(currentToken);
  const days = Math.floor(refreshed.expires_in / 86400);
  Logger.info(`✅ 新 token 取得: 有効期限 ${refreshed.expires_in} 秒 (約 ${days} 日)`);

  const oldSuffix = currentToken.slice(-6);
  const newSuffix = refreshed.access_token.slice(-6);
  Logger.info(`old suffix ...${oldSuffix}  →  new suffix ...${newSuffix}`);

  // Gmail 通知 (常時)
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  const subject = `[PubMed Trivia] Threads Token リフレッシュ完了 (${days}日延長)`;
  const body = [
    'Threads Access Token を自動リフレッシュしました。',
    '',
    `旧 token 末尾: ...${oldSuffix}`,
    `新 token 末尾: ...${newSuffix}`,
    `新 token の有効期限: ${expiresAt.toISOString()} (約 ${days} 日後)`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '📋 GitHub Secret を手動で更新する場合:',
    '1. https://github.com/nulpum/sciencepubmedjp/settings/secrets/actions',
    '2. THREADS_ACCESS_TOKEN の右端 ✏️ をクリック',
    '3. 下記の新 token 全文を貼り付けて Update',
    '',
    '=== ここからコピー (新 THREADS_ACCESS_TOKEN 全文) ===',
    '',
    refreshed.access_token,
    '',
    '=== ここまでコピー ===',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'PAT_FOR_SECRETS を GH Secrets に設定していれば、この通知メールに加えて',
    'GH Secrets も自動更新される (更新ログは Actions run に表示)。',
    '',
    '🤖 PubMed Trivia bot 自動リフレッシュ',
  ].join('\n');

  await sendEmail({ subject, body });
  Logger.info('✅ Gmail 通知送信完了');

  // 標準出力に新 token を出す (GH Actions で $GITHUB_OUTPUT に取り出す用)
  // ワークフロー側で `NEW_TOKEN=$(npm run refresh:threads-token 2>&1 | grep -oE 'NEW_TOKEN=...')` 等で拾える
  console.log(`NEW_TOKEN=${refreshed.access_token}`);
}

main().catch((e) => {
  Logger.error(e);
  process.exit(1);
});
