import type { APIContext } from 'astro';

export const prerender = true;
import { buildRssResponse } from '../../lib/rss-helper';

export async function GET(context: APIContext): Promise<Response> {
  return buildRssResponse(context.site, 'ja');
}
