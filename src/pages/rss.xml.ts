import type { APIContext } from 'astro';

export const prerender = true;
import { buildRssResponse } from '../lib/rss-helper';

// 全体 の RSS は JA 優先 (読者 層: 日本語 中核)
export async function GET(context: APIContext): Promise<Response> {
  return buildRssResponse(context.site, 'ja');
}
