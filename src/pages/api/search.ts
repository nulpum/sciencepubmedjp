// POST /api/search
//
// Body: { query: string, maxResults?: number }
// Response: { englishQuery, results: [...], meta }
//
// フリーミアム Stage A: 認証不要、Claude 呼び出しは日本語→英語変換の1回だけ
// (論文の日本語要約は Stage B の有料機能)

import type { APIRoute } from 'astro';
import { translateQueryToEnglish } from '../../lib/query-translator';
import { searchPmids, fetchArticles, pubmedUrl, type PubmedArticle } from '../../lib/pubmed';

export const prerender = false;

interface SearchRequest {
  query: string;
  maxResults?: number;
}

interface SearchResponseItem {
  pmid: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  abstract: string;
  pubmedUrl: string;
  doi?: string;
}

interface SearchResponse {
  englishQuery: string;
  translationNotes?: string;
  results: SearchResponseItem[];
  meta: {
    totalCount: number;
    fetchedCount: number;
    elapsedMs: number;
  };
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

function json<T>(body: T, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** Cloudflare の Astro.locals.runtime.env と Node の process.env の両対応 */
function getEnv(locals: App.Locals, key: string): string | undefined {
  // Cloudflare Pages Functions ランタイム
  // @ts-ignore  Astro の App.Locals は各環境で拡張されるため
  const cfEnv = locals?.runtime?.env;
  if (cfEnv && typeof cfEnv === 'object' && key in cfEnv) {
    return (cfEnv as Record<string, string>)[key];
  }
  // Node (ローカル dev)
  return typeof process !== 'undefined' ? process.env[key] : undefined;
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const startedAt = Date.now();

  // 1. ボディ検証
  let body: SearchRequest;
  try {
    body = await request.json();
  } catch {
    return json<ErrorResponse>({ error: 'invalid_json' }, 400);
  }
  const query = (body.query ?? '').trim();
  const maxResults = Math.min(Math.max(body.maxResults ?? 10, 1), 20);

  if (!query) return json<ErrorResponse>({ error: 'empty_query' }, 400);
  if (query.length > 500) return json<ErrorResponse>({ error: 'query_too_long' }, 400);

  // 2. Env 取得
  const apiKey = (getEnv(locals, 'ANTHROPIC_API_KEY') || '').trim();
  const pubmedEmail = getEnv(locals, 'PUBMED_EMAIL') || 'sciencepubmedjp@gmail.com';
  const pubmedTool = getEnv(locals, 'PUBMED_TOOL') || 'pubmed-trivia-lab';
  const pubmedApiKey = getEnv(locals, 'PUBMED_API_KEY') || undefined;

  if (!apiKey) {
    return json<ErrorResponse>({ error: 'server_misconfigured', detail: 'ANTHROPIC_API_KEY not set' }, 500);
  }

  try {
    // 3. 日本語 → 英語クエリ変換
    const translation = await translateQueryToEnglish(apiKey, query);

    // 4. PubMed 検索
    const pubmedCfg = { tool: pubmedTool, email: pubmedEmail, apiKey: pubmedApiKey };
    const { pmids, total } = await searchPmids(pubmedCfg, translation.englishQuery, maxResults);

    if (pmids.length === 0) {
      return json<SearchResponse>({
        englishQuery: translation.englishQuery,
        translationNotes: translation.notes,
        results: [],
        meta: { totalCount: 0, fetchedCount: 0, elapsedMs: Date.now() - startedAt },
      });
    }

    // 5. 論文詳細取得
    const articles = await fetchArticles(pubmedCfg, pmids);

    const results: SearchResponseItem[] = articles.map((a: PubmedArticle) => ({
      pmid: a.pmid,
      title: a.title,
      authors: a.authors.slice(0, 5), // 最大 5 著者、多いと et al.
      journal: a.journal,
      year: a.year,
      abstract: a.abstract,
      pubmedUrl: pubmedUrl(a.pmid),
      doi: a.doi,
    }));

    return json<SearchResponse>({
      englishQuery: translation.englishQuery,
      translationNotes: translation.notes,
      results,
      meta: { totalCount: total, fetchedCount: results.length, elapsedMs: Date.now() - startedAt },
    });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return json<ErrorResponse>({ error: 'search_failed', detail: msg }, 500);
  }
};

// GET は使わない (ドキュメント代わりの JSON を返す)
export const GET: APIRoute = () =>
  json({
    endpoint: '/api/search',
    method: 'POST',
    body: { query: 'string (Japanese)', maxResults: 'number (1-20, default 10)' },
    example: { query: '大学生の睡眠不足と成績の関係' },
  });
