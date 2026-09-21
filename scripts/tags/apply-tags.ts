// 全記事の frontmatter に tags: [...] を注入 / 更新する。
// 使い方: npx tsx scripts/tags/apply-tags.ts
//
// 動作:
// - src/content/**/*.md を走査
// - frontmatter を単純パース (title と fact を取り出す)
// - extractTagsFor() で 該当タグID一覧を計算
// - 既存の tags: 行を差し替え / なければ追加

import '../lib/env.js';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractTagsFor } from '../../src/config/tags.js';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try { return JSON.parse(t); } catch { return t.slice(1, -1); }
  }
  return t;
}

function parse(content: string): { title: string; fact: string; hasTags: boolean } | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = m[1];
  const get = (key: string) => {
    const mm = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    return mm ? unquote(mm[1]) : null;
  };
  const title = get('title') ?? '';
  const fact = get('fact') ?? '';
  const hasTags = /^tags:/m.test(fm);
  return { title, fact, hasTags };
}

function upsertTags(content: string, tagIds: string[]): string {
  const tagsBlock = tagIds.length === 0
    ? 'tags: []'
    : 'tags:\n' + tagIds.map((t) => `  - "${t}"`).join('\n');
  // 既存 tags block があれば差し替え
  const existing = /^tags:\s*(?:\r?\n(?:  - .*\r?\n?)+|\[\])\s*$/m;
  if (existing.test(content)) {
    return content.replace(existing, tagsBlock);
  }
  // なければ frontmatter の閉じ --- の直前に追加
  return content.replace(/^(---\r?\n[\s\S]*?)(\r?\n---)/, `$1\n${tagsBlock}$2`);
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (e.name.endsWith('.md')) files.push(p);
  }
  return files;
}

async function main() {
  const files = await walk(CONTENT_DIR);
  console.log(`Detected ${files.length} .md files`);
  let updated = 0, tagsPerArticle = 0;
  for (const f of files) {
    const original = await readFile(f, 'utf8');
    const parsed = parse(original);
    if (!parsed) continue;
    const tagIds = extractTagsFor(parsed.title, parsed.fact);
    tagsPerArticle += tagIds.length;
    const next = upsertTags(original, tagIds);
    if (next !== original) {
      await writeFile(f, next, 'utf8');
      updated++;
    }
  }
  console.log(`Updated ${updated} files; avg tags/article = ${(tagsPerArticle / files.length).toFixed(2)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
