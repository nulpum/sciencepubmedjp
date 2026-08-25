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
    }),
  ],
});
