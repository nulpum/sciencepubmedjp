// Claude API ロジック層
// - 日英を「別呼び出し」で生成（仕様の二重翻訳禁止に準拠）
// - 出力 JSON を strict にパース
// - NG 語ポストチェックで fail したら最大 N 回まで再生成

import Anthropic from '@anthropic-ai/sdk';
import type {
  Category,
  GeneratedArticle,
  Lang,
  PubmedArticle,
} from '../types.js';
import { Logger } from '../lib/logger.js';
import { checkNgWords } from '../lib/ng-words.js';
import { buildSystemPrompt, buildUserPrompt } from './prompts.js';
import { pubmedUrl } from '../pubmed/fetch.js';

const MAX_NG_RETRIES = 2;

let didLogKeyInfo = false;
function getClient(): Anthropic {
  const rawKey = process.env.ANTHROPIC_API_KEY;
  if (!rawKey) throw new Error('ANTHROPIC_API_KEY が未設定です');
  // CI 上で改行やスペースが混入していると HTTP ヘッダ生成で fetch が
  // 即座に失敗し "Connection error" になる → 念のためトリム
  const apiKey = rawKey.trim();
  if (!didLogKeyInfo) {
    const rawLen = rawKey.length;
    const trimLen = apiKey.length;
    const head = apiKey.slice(0, 12);
    const tail = apiKey.slice(-4);
    const hasWhitespace = rawLen !== trimLen;
    Logger.info(
      `Anthropic key: rawLen=${rawLen} trimLen=${trimLen} ` +
      `prefix="${head}..." suffix="...${tail}" hasWhitespaceArtifact=${hasWhitespace}`,
    );
    didLogKeyInfo = true;
  }
  return new Anthropic({ apiKey });
}

function getModel(): string {
  return process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';
}

interface ClaudeArticleJson {
  title: string;
  fact: string;
  body: string;
}

function parseJson(text: string): ClaudeArticleJson {
  // モデルがコードフェンスを付けてくるケースに耐える
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const obj = JSON.parse(cleaned) as ClaudeArticleJson;
  if (!obj.title || !obj.fact || !obj.body) {
    throw new Error('Claude 出力 JSON に title/fact/body が揃っていません');
  }
  return obj;
}

async function callClaudeOnce(
  article: PubmedArticle,
  lang: Lang,
): Promise<ClaudeArticleJson> {
  const client = getClient();
  const res = await client.messages.create({
    model: getModel(),
    max_tokens: 1024,
    system: buildSystemPrompt(lang),
    messages: [{ role: 'user', content: buildUserPrompt(article, lang) }],
  });

  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    throw new Error('Claude からテキストブロックが返ってきませんでした');
  }
  return parseJson(block.text);
}

export async function generateForLang(
  article: PubmedArticle,
  category: Category,
  lang: Lang,
): Promise<GeneratedArticle> {
  let lastErr: unknown;

  for (let i = 0; i <= MAX_NG_RETRIES; i++) {
    try {
      const json = await callClaudeOnce(article, lang);
      const merged = `${json.title}\n${json.fact}\n${json.body}`;
      const ng = checkNgWords(merged, lang);
      if (!ng.ok) {
        Logger.warn(
          `NG 語ヒット (lang=${lang}, try=${i}): ${ng.hits.join(', ')} → 再生成`,
        );
        lastErr = new Error(`NG words: ${ng.hits.join(', ')}`);
        continue;
      }

      return {
        pmid: article.pmid,
        category,
        lang,
        title: json.title.trim(),
        fact: json.fact.trim(),
        body: json.body.trim(),
        sourceUrl: pubmedUrl(article.pmid),
        journal: article.journal,
        year: article.year,
        generatedAt: new Date().toISOString(),
      };
    } catch (e) {
      lastErr = e;
      Logger.warn(`generate try ${i} 失敗: ${(e as Error).message}`);
    }
  }

  throw new Error(
    `lang=${lang} の生成に ${MAX_NG_RETRIES + 1} 回失敗: ${(lastErr as Error)?.message}`,
  );
}

// 高レベル: 日英を別呼び出しで両方生成
export async function generateBothLangs(
  article: PubmedArticle,
  category: Category,
): Promise<{ ja: GeneratedArticle; en: GeneratedArticle }> {
  // 並列で叩く（rate limit に当たるなら逐次に変える）
  const [ja, en] = await Promise.all([
    generateForLang(article, category, 'ja'),
    generateForLang(article, category, 'en'),
  ]);
  return { ja, en };
}
