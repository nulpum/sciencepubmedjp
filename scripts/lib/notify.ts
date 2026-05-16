// Gmail SMTP 経由のメール送信ラッパー
//
// 必要 env:
//   GMAIL_USER          送信元 Gmail アドレス
//   GMAIL_APP_PASSWORD  アプリパスワード (myaccount.google.com/apppasswords)
//                       通常の Gmail パスワードではなく、2FA 有効化後に発行する 16 桁
//   NOTIFY_EMAIL_TO     送り先 (未設定なら GMAIL_USER 自身に送る)

import nodemailer from 'nodemailer';
import { Logger } from './logger.js';

interface SendEmailParams {
  subject: string;
  body: string;        // プレーンテキスト
  to?: string;          // 上書き先
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    Logger.warn('GMAIL_USER / GMAIL_APP_PASSWORD 未設定 → メール送信スキップ');
    return;
  }

  const to = params.to || process.env.NOTIFY_EMAIL_TO || user;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  Logger.info(`メール送信: to=${to} subject="${params.subject}"`);
  await transporter.sendMail({
    from: user,
    to,
    subject: params.subject,
    text: params.body,
  });
  Logger.info('✅ メール送信完了');
}
