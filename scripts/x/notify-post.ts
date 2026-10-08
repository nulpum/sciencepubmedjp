// X 用投稿テキストをメールで通知 (統一テンプレ)
//
// X API 有料化 ($200/月) を回避するため、自動投稿はせず
// 「Gmail にコピペ用テキストが届く」方式で運用する。
//
// 2026-10-08 以降: body テンプレを run-notify.ts / run-daily.ts と 統一。
// (ユーザが 1 日に 複数の X 用 Gmail を 受け取っても 同じ 見た目に なるように)
//
// 使い方 (他 script から):
//   import { notifyXPost } from '../x/notify-post.js';
//   await notifyXPost({ subject: '...', xText: '...' });

import { sendEmail } from '../lib/notify.js';
import { Logger } from '../lib/logger.js';

interface NotifyParams {
  subject: string;   // メール件名
  xText: string;     // X に投稿するテキスト
  contextNote?: string; // 補足説明 (何のイベント発火か)
}

export async function notifyXPost(params: NotifyParams): Promise<void> {
  const { subject, xText, contextNote } = params;

  const bodyLines: string[] = [
    '# 手動投稿用テンプレート (X / Instagram)',
    '',
  ];

  if (contextNote) {
    bodyLines.push(
      '## 📌 補足',
      contextNote,
      '',
    );
  }

  bodyLines.push(
    '## 🐦 X (旧 Twitter) — ツリー投稿で algorithm に乗せる',
    '',
    '【運用手順】',
    '  1. 下の「親ポスト」を X に投稿',
    '  2. 必要なら 2 投稿目を 自分の返信 として ツリー化',
    '',
    '────────────────────────────────────',
    `## 🇯🇵 親ポスト`,
    `=== ここからコピー (${xText.length} chars) ===`,
    '',
    xText,
    '',
    '=== ここまでコピー ===',
    '',
    '🤖 PubMed Trivia bot より自動送信',
  );

  const body = bodyLines.join('\n');

  Logger.info(`X 用メール送信: subject="${subject}" xText=${xText.length} chars`);
  await sendEmail({ subject, body });
}
