import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// i18n: ja/en どちらも /ja/ /en/ サブパスで配信（prefixDefaultLocale: true）
export default defineConfig({
  // OGP / sitemap で絶対 URL を組むため。SITE_URL env で上書き可能。
  // 旧 URL (sciencepubmedjp.pubmedtrivia.workers.dev) も引き続きアクセス可能。
  site: process.env.SITE_URL || 'https://sciencepubmed.net',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  integrations: [
    // /sitemap-index.xml と /sitemap-0.xml を build 時に自動生成
    // i18n 対応: ja/en の両方が hreflang 付きで列挙される
    sitemap({
      i18n: {
        defaultLocale: 'ja',
        locales: { ja: 'ja-JP', en: 'en-US' },
      },
    }),
  ],
});
