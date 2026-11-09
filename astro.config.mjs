import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// i18n: ja/en どちらも /ja/ /en/ サブパスで配信（prefixDefaultLocale: true）
//
// output モード:
//   - Astro 5 のデフォルトは静的サイト生成 (SSG)
//   - PubMed Lab (/ja/lab/*) と API endpoint (/api/*) だけ SSR にしたいので
//     `output: 'server'` + 個別ページで `export const prerender = true` の
//     オプトアウト方式を採用
//   - 既存の 200+ 記事ページは全て prerender=true にして静的維持
//   - Cloudflare Pages Functions で SSR エンドポイントを実行
export default defineConfig({
  site: process.env.SITE_URL || 'https://sciencepubmed.net',
  output: 'server',
  adapter: cloudflare({
    // Cloudflare Pages にデプロイする際の設定
    // Astro 5 + Cloudflare adapter 12.x の推奨構成
    imageService: 'passthrough',
  }),
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'ja',
        locales: { ja: 'ja-JP', en: 'en-US' },
      },
      // 2026-11-09 追加: ページ種別ごとに priority/changefreq を 最適化
      // - トップ: 1.0 (日次更新)
      // - ハブ: 0.9 (週次更新)
      // - 深掘り (-evidence): 0.85 (月次更新)
      // - 日次記事: 0.7 (月次)
      // - Lab / guide: 0.8 (月次)
      // - ユーティリティ (archive/tag/search/privacy): 0.4 (月次 or 年次)
      serialize(item) {
        const url = item.url;
        const path = new URL(url).pathname;
        // noindex を 想定: sitemap.xml 側では include せず、 noindex は meta で 制御
        if (/\/(ja|en)\/?$/.test(path)) {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (/\/hub\//.test(path)) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else if (/-evidence\/?$/.test(path)) {
          item.priority = 0.85;
          item.changefreq = 'monthly';
        } else if (/\/(biology|psychology)\/\d{8}-/.test(path)) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (/\/(lab|guide)\//.test(path)) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (/\/(archive|tag|search|privacy|about|editorial-policy|editor)\//.test(path)) {
          item.priority = 0.4;
          item.changefreq = 'yearly';
        } else {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
});
