import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 記事の共通スキーマ。lang/category はディレクトリで分かれているが、
// メタデータにも明示しておくと将来のフィルタや RSS で扱いやすい。
const articleSchema = z.object({
  pmid: z.string(),
  category: z.enum(['psychology', 'biology']),
  lang: z.enum(['ja', 'en']),
  title: z.string(),
  fact: z.string(),               // フック句込みの1文目（OGP / リスト表示用）
  source_url: z.string().url(),   // PubMed の原典 URL
  journal: z.string().optional(),
  year: z.number().int().optional(),
  generated_at: z.string(),       // ISO8601
  // Phase 2 で埋める
  affiliate_links: z
    .array(z.object({ title: z.string(), url: z.string().url() }))
    .optional(),
});

const ja_psychology = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ja/psychology' }),
  schema: articleSchema,
});
const ja_biology = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ja/biology' }),
  schema: articleSchema,
});
const en_psychology = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/en/psychology' }),
  schema: articleSchema,
});
const en_biology = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/en/biology' }),
  schema: articleSchema,
});

export const collections = {
  ja_psychology,
  ja_biology,
  en_psychology,
  en_biology,
};
