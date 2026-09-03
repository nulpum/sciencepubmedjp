// POST /api/theme-suggest
//
// PubMed Lab β: 検索結果 (上位 N 件) を俯瞰して卒論・修論テーマを 3 案提案
//
// Body: { userQuery: string, papers: ThemeSuggestPaper[] }
// Response: { interests, themes, entryPaper, usage? }
//
// 緊急スイッチ: env LAB_THEME_ENABLED=false で 503

import type { APIRoute } from 'astro';
import { suggestThemes, type ThemeSuggestPaper } from '../../lib/theme-suggest';

export const prerender = false;

interface ThemeSuggestRequest {
  userQuery: string;
  papers: ThemeSuggestPaper[];
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

function isValidPaper(p: unknown): p is ThemeSuggestPaper {
  if (!p || typeof p !== 'object') return false;
  const x = p as Partial<ThemeSuggestPaper>;
  return (
    typeof x.pmid === 'string' &&
    typeof x.title === 'string' &&
    Array.isArray(x.authors) &&
    typeof x.abstract === 'string'
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  // 緊急スイッチ
  const enabledFlag = (getEnv(locals, 'LAB_THEME_ENABLED') || 'true').trim().toLowerCase();
  if (enabledFlag === 'false' || enabledFlag === '0' || enabledFlag === 'off') {
    return json({ error: 'theme_disabled', detail: 'サーバー側で一時停止中です' }, 503);
  }

  const apiKey = (getEnv(locals, 'ANTHROPIC_API_KEY') || '').trim();
  if (!apiKey) return json({ error: 'server_misconfigured' }, 500);

  let body: ThemeSuggestRequest;
  try {
    body = (await request.json()) as ThemeSuggestRequest;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const userQuery = (body.userQuery || '').trim();
  if (!userQuery) return json({ error: 'empty_query' }, 400);
  if (userQuery.length > 500) return json({ error: 'query_too_long' }, 400);

  if (!Array.isArray(body.papers) || body.papers.length === 0) {
    return json({ error: 'no_papers' }, 400);
  }
  if (body.papers.length > 10) {
    return json({ error: 'too_many_papers' }, 400);
  }
  if (!body.papers.every(isValidPaper)) {
    return json({ error: 'invalid_paper_shape' }, 400);
  }
  // abstract 有効なもののみ (幻覚防止)
  const validPapers = body.papers.filter((p) => p.abstract && p.abstract.trim().length >= 20);
  if (validPapers.length === 0) {
    return json({ error: 'no_valid_abstracts' }, 400);
  }

  try {
    const result = await suggestThemes(apiKey, userQuery, validPapers);
    return json(result);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return json({ error: 'theme_suggest_failed', detail: msg }, 500);
  }
};

export const GET: APIRoute = () =>
  json({
    endpoint: '/api/theme-suggest',
    method: 'POST',
    body: {
      userQuery: 'string (日本語)',
      papers: '[{pmid, title, authors, abstract, journal?, year?}]',
    },
  });
