// PubMed E-utilities API クライアント (Cloudflare Workers 対応)
//
// scripts/pubmed/fetch.ts の Node 版と別に、CF Workers ランタイム用に用意。
// - dotenv 不要 (env は関数引数で受ける)
// - fetch (グローバル) のみ使用、node:https 不要
// - ES modules ネイティブ import (dynamic import 不要)

const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

export interface PubmedConfig {
  tool: string;
  email: string;
  apiKey?: string;
}

export interface PubmedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal?: string;
  year?: number;
  doi?: string;
}

function withCommonParams(p: URLSearchParams, cfg: PubmedConfig): URLSearchParams {
  p.set('tool', cfg.tool);
  p.set('email', cfg.email);
  if (cfg.apiKey) p.set('api_key', cfg.apiKey);
  return p;
}

/**
 * PubMed 検索: クエリに一致する PMID を最大 N 件取得
 */
export async function searchPmids(
  cfg: PubmedConfig,
  query: string,
  maxResults: number = 10,
): Promise<{ pmids: string[]; total: number }> {
  const params = withCommonParams(
    new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmode: 'json',
      retmax: String(maxResults),
      sort: 'relevance',
    }),
    cfg,
  );
  const res = await fetch(`${ESEARCH}?${params}`);
  if (!res.ok) throw new Error(`esearch failed: ${res.status}`);
  const json = (await res.json()) as {
    esearchresult: { idlist: string[]; count: string };
  };
  return {
    pmids: json.esearchresult.idlist ?? [],
    total: Number(json.esearchresult.count) || 0,
  };
}

/**
 * PMIDs から論文詳細をまとめて取得
 */
export async function fetchArticles(
  cfg: PubmedConfig,
  pmids: string[],
): Promise<PubmedArticle[]> {
  if (pmids.length === 0) return [];
  const params = withCommonParams(
    new URLSearchParams({
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'xml',
      rettype: 'abstract',
    }),
    cfg,
  );
  const res = await fetch(`${EFETCH}?${params}`);
  if (!res.ok) throw new Error(`efetch failed: ${res.status}`);
  const xml = await res.text();
  return parsePubmedXml(xml);
}

/**
 * PubMed XML から複数論文を抽出
 * scripts/pubmed/fetch.ts の parseEfetchXml を multi-article 版に拡張
 */
export function parsePubmedXml(xml: string): PubmedArticle[] {
  const articles: PubmedArticle[] = [];
  // <PubmedArticle> ブロックを分割
  const blocks = xml.split('<PubmedArticle>').slice(1);
  for (const rawBlock of blocks) {
    const block = '<PubmedArticle>' + rawBlock.split('</PubmedArticle>')[0] + '</PubmedArticle>';
    const article = parseSingleArticle(block);
    if (article) articles.push(article);
  }
  return articles;
}

function parseSingleArticle(xml: string): PubmedArticle | null {
  const pick = (re: RegExp): string | undefined => {
    const m = xml.match(re);
    if (!m) return undefined;
    return decodeXml(m[1].replace(/<[^>]+>/g, '').trim());
  };

  const pmid = pick(/<PMID[^>]*>(\d+)<\/PMID>/);
  if (!pmid) return null;

  const title = pick(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/) || '';

  // Abstract は複数 AbstractText を結合
  const absMatches = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)];
  const abstract = absMatches
    .map((m) => decodeXml(m[1].replace(/<[^>]+>/g, '').trim()))
    .filter(Boolean)
    .join(' ');

  // 著者
  const authorMatches = [...xml.matchAll(/<Author[^>]*>([\s\S]*?)<\/Author>/g)];
  const authors: string[] = [];
  for (const m of authorMatches) {
    const authorXml = m[1];
    const last = authorXml.match(/<LastName>([^<]+)<\/LastName>/)?.[1];
    const first = authorXml.match(/<ForeName>([^<]+)<\/ForeName>/)?.[1];
    if (last) authors.push(first ? `${first} ${last}` : last);
  }

  // 掲載誌
  const journal = pick(/<Journal>[\s\S]*?<Title>([^<]+)<\/Title>/) ||
    pick(/<ISOAbbreviation>([^<]+)<\/ISOAbbreviation>/);

  // 発行年
  const yearStr = pick(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/) ||
    pick(/<ArticleDate[^>]*>[\s\S]*?<Year>(\d{4})<\/Year>/);
  const year = yearStr ? Number(yearStr) : undefined;

  // DOI
  const doi = pick(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);

  return { pmid, title, abstract, authors, journal, year, doi };
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}
