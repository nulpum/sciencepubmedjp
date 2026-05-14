import { defineConfig } from 'astro/config';

// i18n: ja/en どちらも /ja/ /en/ サブパスで配信（prefixDefaultLocale: true）
export default defineConfig({
  // OGP / sitemap で絶対 URL を組むため。SITE_URL env で上書き可能。
  site: process.env.SITE_URL || 'https://sciencepubmedjp.pubmedtrivia.workers.dev',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
});
