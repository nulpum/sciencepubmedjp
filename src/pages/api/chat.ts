// POST /api/chat
//
// PubMed Lab β: 論文と壁打ちチャット
// Body: { paper: PaperContext, messages: ChatMessage[] }
// Response: { reply: string, usage?: {input, output} }
//
// コスト管理:
// - サーバー側の緊急スイッチ: env LAB_CHAT_ENABLED=false でリクエストを 503 で拒否
// - クライアント側で 3 msg/day/browser の rate limit (localStorage)
// - サーバー側の hard rate limit は KV バインディング要 → 未実装。
//   もしコスト暴発したら Cloudflare secret で LAB_CHAT_ENABLED を切り替える。

import type { APIRoute } from 'astro';
import { chatWithPaper, type PaperContext, type ChatMessage } from '../../lib/paper-chat';

export const prerender = false;

interface ChatRequest {
  paper: PaperContext;
  messages: ChatMessage[];
}

function json<T>(body: T, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function getEnv(locals: App.Locals, key: string): string | undefined {
  // @ts-ignore Cloudflare Astro.locals.runtime.env
  const cf = locals?.runtime?.env;
  if (cf && typeof cf === 'object' && key in cf) return (cf as Record<string, string>)[key];
  return typeof process !== 'undefined' ? process.env[key] : undefined;
}

function isValidPaper(p: unknown): p is PaperContext {
  if (!p || typeof p !== 'object') return false;
  const x = p as Partial<PaperContext>;
  return (
    typeof x.pmid === 'string' &&
    typeof x.title === 'string' &&
    Array.isArray(x.authors) &&
    typeof x.abstract === 'string'
  );
}

function isValidMessages(m: unknown): m is ChatMessage[] {
  if (!Array.isArray(m) || m.length === 0 || m.length > 20) return false;
  return m.every(
    (x) =>
      x &&
      typeof x === 'object' &&
      (x.role === 'user' || x.role === 'assistant') &&
      typeof x.content === 'string' &&
      x.content.length > 0 &&
      x.content.length <= 2000,
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  // 緊急スイッチ (コスト暴発対策)
  const enabledFlag = (getEnv(locals, 'LAB_CHAT_ENABLED') || 'true').trim().toLowerCase();
  if (enabledFlag === 'false' || enabledFlag === '0' || enabledFlag === 'off') {
    return json({ error: 'chat_disabled', detail: 'サーバー側で一時停止中です' }, 503);
  }

  const apiKey = (getEnv(locals, 'ANTHROPIC_API_KEY') || '').trim();
  if (!apiKey) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!isValidPaper(body.paper)) return json({ error: 'invalid_paper' }, 400);
  if (!isValidMessages(body.messages)) return json({ error: 'invalid_messages' }, 400);
  // 最新メッセージが user のみ受け付ける
  if (body.messages[body.messages.length - 1].role !== 'user') {
    return json({ error: 'last_message_must_be_user' }, 400);
  }
  // abstract がまったく無い論文は不許可 (context 無しで幻覚しやすい)
  if (body.paper.abstract.trim().length < 20) {
    return json({ error: 'no_abstract', detail: 'この論文には abstract がないためチャットできません' }, 400);
  }

  try {
    const result = await chatWithPaper(apiKey, body.paper, body.messages);
    return json(result);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return json({ error: 'chat_failed', detail: msg }, 500);
  }
};

export const GET: APIRoute = () =>
  json({
    endpoint: '/api/chat',
    method: 'POST',
    body: {
      paper: { pmid: 'string', title: 'string', authors: 'string[]', abstract: 'string', journal: 'string?', year: 'number?' },
      messages: '[{role: "user"|"assistant", content: string}]',
    },
  });
