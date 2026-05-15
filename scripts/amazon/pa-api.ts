// Amazon Product Advertising API (PA-API v5) クライアント
//
// 認証: AWS Signature Version 4 (HMAC-SHA256)
// エンドポイント (JP): https://webservices.amazon.co.jp/paapi5/{operation}
// 必要な env: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG
//
// 制約:
// - 新規アカウントは販売実績ゼロ → 1 req/sec/day 程度の超低速
// - 販売 3 件以降に上限解放
// - 失敗時はサイレント (記事生成自体は止めない)

import { createHmac, createHash } from 'node:crypto';
import { Logger } from '../lib/logger.js';

interface PaApiConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  marketplace: string; // 'www.amazon.co.jp'
  host: string;        // 'webservices.amazon.co.jp'
  region: string;      // 'us-west-2' (JP の場合)
}

function getConfig(): PaApiConfig {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG || 'sciencepubmed-22';
  if (!accessKey || !secretKey) {
    throw new Error('AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY が未設定です (.env を確認)');
  }
  return {
    accessKey,
    secretKey,
    partnerTag,
    marketplace: 'www.amazon.co.jp',
    host: 'webservices.amazon.co.jp',
    region: 'us-west-2',
  };
}

const SERVICE = 'ProductAdvertisingAPI';
const ALGORITHM = 'AWS4-HMAC-SHA256';

function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

// AWS4 署名キー導出
function getSigningKey(
  secretKey: string,
  date: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmacSha256('AWS4' + secretKey, date);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  return kSigning;
}

interface SignedRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

// PA-API 用 HTTP リクエストに AWS4 署名を載せる
function signRequest(params: {
  config: PaApiConfig;
  operation: string; // 'SearchItems' | 'GetItems' | ...
  payload: object;
}): SignedRequest {
  const { config, operation, payload } = params;
  const path = `/paapi5/${operation.toLowerCase()}`;
  const target = `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`;
  const body = JSON.stringify(payload);

  // YYYYMMDDTHHmmssZ
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    host: config.host,
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=UTF-8',
    'x-amz-date': amzDate,
    'x-amz-target': target,
  };

  // Canonical request
  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders =
    sortedHeaderKeys.map((k) => `${k}:${headers[k].trim()}`).join('\n') + '\n';
  const signedHeaders = sortedHeaderKeys.join(';');
  const payloadHash = sha256Hex(body);
  const canonicalRequest = [
    'POST',
    path,
    '', // query string なし
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  // String to sign
  const credentialScope = `${dateStamp}/${config.region}/${SERVICE}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  // Signature
  const signingKey = getSigningKey(
    config.secretKey,
    dateStamp,
    config.region,
    SERVICE,
  );
  const signature = createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  headers['authorization'] =
    `${ALGORITHM} Credential=${config.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `https://${config.host}${path}`,
    headers,
    body,
  };
}

export interface PaApiItem {
  asin: string;
  title: string;
  url: string;
  price?: string;
  imageUrl?: string;
}

// SearchItems オペレーション
// docs: https://webservices.amazon.com/paapi5/documentation/search-items.html
export async function searchItems(params: {
  keywords: string;
  itemCount?: number; // 1-10
  searchIndex?: string; // 'Books', 'KindleStore', etc.
}): Promise<PaApiItem[]> {
  const { keywords, itemCount = 5, searchIndex = 'Books' } = params;
  const config = getConfig();

  const payload = {
    Keywords: keywords,
    SearchIndex: searchIndex,
    ItemCount: itemCount,
    PartnerTag: config.partnerTag,
    PartnerType: 'Associates',
    Marketplace: config.marketplace,
    Resources: [
      'ItemInfo.Title',
      'Offers.Listings.Price',
      'Images.Primary.Medium',
    ],
  };

  const signed = signRequest({ config, operation: 'SearchItems', payload });

  Logger.info(`PA-API SearchItems: keywords="${keywords}" index=${searchIndex}`);
  const res = await fetch(signed.url, {
    method: 'POST',
    headers: signed.headers,
    body: signed.body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PA-API ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    SearchResult?: { Items?: unknown[] };
    Errors?: unknown[];
  };
  if (json.Errors && json.Errors.length > 0) {
    throw new Error(`PA-API errors: ${JSON.stringify(json.Errors)}`);
  }

  const rawItems = (json.SearchResult?.Items ?? []) as Array<{
    ASIN: string;
    DetailPageURL: string;
    ItemInfo?: { Title?: { DisplayValue?: string } };
    Offers?: { Listings?: Array<{ Price?: { DisplayAmount?: string } }> };
    Images?: { Primary?: { Medium?: { URL?: string } } };
  }>;

  return rawItems.map((item) => ({
    asin: item.ASIN,
    title: item.ItemInfo?.Title?.DisplayValue ?? '(no title)',
    url: item.DetailPageURL,
    price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
    imageUrl: item.Images?.Primary?.Medium?.URL,
  }));
}
