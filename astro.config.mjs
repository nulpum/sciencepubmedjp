import { defineConfig } from 'astro/config';

// i18n: ja/en どちらも /ja/ /en/ サブパスで配信（prefixDefaultLocale: true）
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
});
