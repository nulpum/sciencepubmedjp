// RSS フィード 生成 の 共通 ヘルパー
//
// Google Discover / aggregator (Feedly, Inoreader) 経由 の 間接 流入 を 増やす ため、
// 各 言語 の 最新 50 件 を 配信。 noindex 記事 は 除外。

import { getCollection, type CollectionEntry } from 'astro:content';
import rss from '@astrojs/rss';

type Lang = 'ja' | 'en';

export async function buildRssResponse(site: URL | string | undefined, lang: Lang) {
  if (!site) throw new Error('astro.config.mjs の site が 未設定');

  const collections: Array<'ja_biology' | 'ja_psychology' | 'en_biology' | 'en_psychology'> =
    lang === 'ja' ? ['ja_biology', 'ja_psychology'] : ['en_biology', 'en_psychology'];

  type Item = { entry: CollectionEntry<'ja_biology'> | CollectionEntry<'ja_psychology'> | CollectionEntry<'en_biology'> | CollectionEntry<'en_psychology'>; category: 'biology' | 'psychology' };
  const items: Item[] = [];
  for (const name of collections) {
    const es = await getCollection(name as any);
    const category: 'biology' | 'psychology' = name.endsWith('biology') ? 'biology' : 'psychology';
    for (const e of es) items.push({ entry: e as any, category });
  }

  const filtered = items
    .filter(({ entry }) => !(entry.data as any).noindex)
    .sort((a, b) => ((a.entry.data as any).generated_at < (b.entry.data as any).generated_at ? 1 : -1))
    .slice(0, 50);

  const title = lang === 'ja' ? 'PubMed Trivia (日本語)' : 'PubMed Trivia (English)';
  const description = lang === 'ja'
    ? 'PubMed の 論文 を 日本語で わかりやすく 解説。 生物学 と 心理学 の 最新 研究要約。'
    : 'Plain-English summaries of PubMed research in biology and psychology.';

  return rss({
    title,
    description,
    site: typeof site === 'string' ? site : site.toString(),
    items: filtered.map(({ entry, category }) => ({
      title: entry.data.title,
      pubDate: new Date((entry.data as any).generated_at),
      description: entry.data.fact || entry.data.title,
      link: `/${lang}/${category}/${(entry as any).id}/`,
      categories: ((entry.data as any).tags as string[] | undefined) ?? [category],
    })),
    customData: `<language>${lang === 'ja' ? 'ja-JP' : 'en-US'}</language>`,
  });
}
