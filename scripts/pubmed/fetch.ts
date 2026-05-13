// PubMed E-utilities ロジック層（純粋関数寄り、副作用は HTTP のみ）
//
// 1. esearch でクエリの total count を取得
// 2. ランダム offset で 1 件 PMID を取得
// 3. efetch で詳細 XML を取得 → 必要フィールドを抽出

import type { PubmedArticle } from '../types.js';
import { Logger } from '../lib/logger.js';
import { buildQuery } from './queries.js';
import type { Category } from '../types.js';

const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

interface PubmedConfig {
  tool: string;
  email: string;
  apiKey?: string;
}

function readConfig(): PubmedConfig {
  const tool = process.env.PUBMED_TOOL || 'pubmed-trivia';
  const email = process.env.PUBMED_EMAIL || 'dev@example.com';
  const apiKey = process.env.PUBMED_API_KEY || undefined;
  return { tool, email, apiKey };
}

function withCommonParams(p: URLSearchParams, cfg: PubmedConfig): URLSearchParams {
  p.set('tool', cfg.tool);
  p.set('email', cfg.email);
  if (cfg.apiKey) p.set('api_key', cfg.apiKey);
  return p;
}

// rate limit 用の最小ウエイト
async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// 1) クエリの total hit count を取得
export async function getCount(query: string): Promise<number> {
  const cfg = readConfig();
  const params = withCommonParams(
    new URLSearchParams({
      db: 'pubmed',
      term: query,
      rettype: 'count',
      retmode: 'json',
    }),
    cfg,
  );
  const res = await fetch(`${ESEARCH}?${params}`);
  if (!res.ok) throw new Error(`esearch count failed: ${res.status}`);
  const json = (await res.json()) as { esearchresult: { count: string } };
  return Number(json.esearchresult.count);
}

// 2) ランダムな 1 PMID を取得
export async function fetchRandomPmid(query: string): Promise<string> {
  const total = await getCount(query);
  if (total === 0) throw new Error('クエリに該当する論文が0件でした');

  // PubMed の retstart 上限は実用的に 9999 程度なので、
  // 母集団が大きすぎる時は窓を切ってその中からランダムに引く
  const HARD_MAX = 9999;
  const upper = Math.min(total, HARD_MAX);
  const offset = Math.floor(Math.random() * upper);

  Logger.info(`esearch: total=${total}, sampled offset=${offset}`);

  const cfg = readConfig();
  const params = withCommonParams(
    new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmode: 'json',
      retstart: String(offset),
      retmax: '1',
    }),
    cfg,
  );
  await sleep(120); // 約 8 req/sec 相当に抑える
  const res = await fetch(`${ESEARCH}?${params}`);
  if (!res.ok) throw new Error(`esearch random failed: ${res.status}`);
  const json = (await res.json()) as { esearchresult: { idlist: string[] } };
  const pmid = json.esearchresult.idlist?.[0];
  if (!pmid) throw new Error('esearch がランダムオフセットで PMID を返さなかった');
  return pmid;
}

// 3) PMID 1件 → 詳細を取得して PubmedArticle に正規化
export async function fetchArticle(pmid: string): Promise<PubmedArticle> {
  const cfg = readConfig();
  const params = withCommonParams(
    new URLSearchParams({
      db: 'pubmed',
      id: pmid,
      retmode: 'xml',
      rettype: 'abstract',
    }),
    cfg,
  );
  await sleep(120);
  const res = await fetch(`${EFETCH}?${params}`);
  if (!res.ok) throw new Error(`efetch failed: ${res.status}`);
  const xml = await res.text();

  return parseEfetchXml(xml, pmid);
}

// シンプルな XML パース（依存ゼロで済ませるため正規表現ベース）
// ※ 完璧な XML パーサではないが PubMed の決まったスキーマには十分
export function parseEfetchXml(xml: string, pmid: string): PubmedArticle {
  const pick = (re: RegExp): string | undefined => {
    const m = xml.match(re);
    if (!m) return undefined;
    return decodeXml(m[1].replace(/<[^>]+>/g, '').trim());
  };

  const title = pick(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/) || '';
  // Abstract は複数 <AbstractText> が来ることがある → 全部つなげる
  const absMatches = [
    ...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g),
  ];
  const abstract = absMatches
    .map((m) => decodeXml(m[1].replace(/<[^>]+>/g, '').trim()))
    .join('\n\n');

  const journal = pick(/<Journal>[\s\S]*?<Title>([\s\S]*?)<\/Title>[\s\S]*?<\/Journal>/);
  const yearStr = pick(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>[\s\S]*?<\/PubDate>/);
  const year = yearStr ? Number(yearStr) : undefined;
  const doi = pick(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/);

  const ptypes = [
    ...xml.matchAll(/<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g),
  ].map((m) => decodeXml(m[1].trim()));

  return {
    pmid,
    title,
    abstract,
    journal,
    year,
    doi,
    publicationTypes: ptypes,
    fetchedAt: new Date().toISOString(),
  };
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// abstract が無い / 短すぎる / 撤回されているなど、雑学化に向かないものを弾く
export function isUsable(a: PubmedArticle): boolean {
  if (!a.abstract || a.abstract.length < 200) return false;
  if (!a.title) return false;
  if (a.publicationTypes?.some((t) => /retract/i.test(t))) return false;
  return true;
}

// 高レベル: category → 1記事
export async function fetchOneByCategory(category: Category): Promise<PubmedArticle> {
  const query = buildQuery(category);
  Logger.info(`category=${category} query length=${query.length}`);

  // usable な abstract に当たるまで最大 N 回リトライ
  const MAX_TRIES = 5;
  for (let i = 1; i <= MAX_TRIES; i++) {
    const pmid = await fetchRandomPmid(query);
    Logger.info(`try ${i}: PMID=${pmid}`);
    const article = await fetchArticle(pmid);
    if (isUsable(article)) return article;
    Logger.warn(`PMID=${pmid} は usable でなかったため再抽選`);
  }
  throw new Error(`category=${category} で ${MAX_TRIES} 回引いても usable な論文が出ませんでした`);
}

export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}
