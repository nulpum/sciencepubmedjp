// 辞書エントリ生成用の PubMed E-utilities ヘルパー
//
// 既存 scripts/pubmed/fetch.ts の getCount() を流用しつつ、
// 辞書に必要な追加操作を提供:
//   - 年別件数 (過去10年)
//   - MeSH UI 存在確認
//   - 最新論文の軽量取得 (タイトル+年)

const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const TOOL = process.env.PUBMED_TOOL || 'pubmed-trivia-dict';
const EMAIL = process.env.PUBMED_EMAIL || '';
const API_KEY = process.env.PUBMED_API_KEY || '';

function buildParams(extra: Record<string, string>): string {
  const base: Record<string, string> = { tool: TOOL };
  if (EMAIL) base.email = EMAIL;
  if (API_KEY) base.api_key = API_KEY;
  return new URLSearchParams({ ...base, ...extra }).toString();
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// レート制御: API_KEY なら 100ms, なければ 334ms (3req/s)
const RATE_DELAY = API_KEY ? 110 : 340;

export async function esearchCount(query: string, extra: Record<string, string> = {}): Promise<number> {
  await sleep(RATE_DELAY);
  const params = buildParams({ db: 'pubmed', term: query, retmode: 'json', rettype: 'count', ...extra });
  const res = await fetch(`${EUTILS_BASE}/esearch.fcgi?${params}`);
  if (!res.ok) throw new Error(`esearch failed: ${res.status}`);
  const json: any = await res.json();
  return Number(json.esearchresult?.count ?? 0);
}

export async function yearlyCounts(baseQuery: string, years: number = 10): Promise<{ year: number; count: number }[]> {
  const now = new Date().getFullYear();
  const results: { year: number; count: number }[] = [];
  for (let i = years - 1; i >= 0; i--) {
    const y = now - i;
    const q = `(${baseQuery}) AND ${y}[dp]`;
    const count = await esearchCount(q);
    results.push({ year: y, count });
  }
  return results;
}

// MeSH UI の存在確認 (db=mesh)
// 返り値: { exists: boolean, ui?: string, heading?: string }
export async function checkMesh(term: string): Promise<{ exists: boolean; ui?: string; heading?: string }> {
  await sleep(RATE_DELAY);
  const params = buildParams({ db: 'mesh', term: `${term}[MeSH Terms]`, retmode: 'json', retmax: '1' });
  const res = await fetch(`${EUTILS_BASE}/esearch.fcgi?${params}`);
  if (!res.ok) return { exists: false };
  const json: any = await res.json();
  const ids: string[] = json.esearchresult?.idlist ?? [];
  if (ids.length === 0) return { exists: false };
  // esummary で正式 heading 取る
  await sleep(RATE_DELAY);
  const sp = buildParams({ db: 'mesh', id: ids[0], retmode: 'json' });
  const sres = await fetch(`${EUTILS_BASE}/esummary.fcgi?${sp}`);
  if (!sres.ok) return { exists: true, ui: ids[0] };
  const sjson: any = await sres.json();
  const row = sjson.result?.[ids[0]];
  const heading = row?.ds_meshterms?.[0] || row?.title;
  return { exists: true, ui: ids[0], heading };
}

export async function recentArticles(query: string, limit: number = 5): Promise<{ pmid: string; title: string; year?: number }[]> {
  await sleep(RATE_DELAY);
  const sp = buildParams({ db: 'pubmed', term: query, retmode: 'json', retmax: String(limit), sort: 'pub_date' });
  const sres = await fetch(`${EUTILS_BASE}/esearch.fcgi?${sp}`);
  if (!sres.ok) return [];
  const sjson: any = await sres.json();
  const ids: string[] = sjson.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];
  await sleep(RATE_DELAY);
  const summ = buildParams({ db: 'pubmed', id: ids.join(','), retmode: 'json' });
  const sumRes = await fetch(`${EUTILS_BASE}/esummary.fcgi?${summ}`);
  if (!sumRes.ok) return [];
  const sumJson: any = await sumRes.json();
  const out: { pmid: string; title: string; year?: number }[] = [];
  for (const pmid of ids) {
    const row = sumJson.result?.[pmid];
    if (!row) continue;
    const yearMatch = /(\d{4})/.exec(row.pubdate || row.epubdate || '');
    out.push({
      pmid,
      title: row.title || '',
      year: yearMatch ? Number(yearMatch[1]) : undefined,
    });
  }
  return out;
}

// コピペ用の PubMed 検索クエリ (MeSH + tiab のOR)
export function buildCopyableQuery(term: string, hasMesh: boolean, meshHeading?: string): string {
  const safe = term.replace(/"/g, '');
  if (hasMesh && meshHeading) {
    return `("${meshHeading}"[MeSH Terms]) OR ("${safe}"[tiab])`;
  }
  return `"${safe}"[tiab]`;
}
