// X 用投稿テキストをメールで通知
//
// X API 有料化 ($200/月) を回避するため、自動投稿はせず
// 「Gmail にコピペ用テキストが届く」方式で運用する。
//
// 使い方 (他 script から):
//   import { notifyXPost } from '../x/notify-post.js';
//   await notifyXPost({ subject: '...', xText: '...' });

import { sendEmail } from '../lib/notify.js';
import { Logger } from '../lib/logger.js';

interface NotifyParams {
  subject: string;   // メール件名
  xText: string;     // X に投稿するテキスト (280 chars 想定)
  contextNote?: string; // 補足説明 (何のイベント発火か)
}

export async function notifyXPost(params: NotifyParams): Promise<void> {
  const { subject, xText, contextNote } = params;
  const encoded = encodeURIComponent(xText);
  const intentUrl = `https://twitter.com/intent/tweet?text=${encoded}`;

  const body = [
    contextNote || '(自動配信) X (Twitter) 手動投稿用のテキストです。',
    '',
    '=' .repeat(60),
    '📋 コピペ用テキスト:',
    '=' .repeat(60),
    xText,
    '=' .repeat(60),
    '',
    `文字数: ${xText.length} / 280 chars`,
    '',
    '💡 ワンクリック投稿リンク (X が新規タブで開いて prefill):',
    intentUrl,
    '',
    '(そのまま「ポスト」ボタンを押すだけで投稿完了)',
  ].join('\n');

  Logger.info(`X 用メール送信: subject="${subject}" xText=${xText.length} chars`);
  await sendEmail({ subject, body });
}
