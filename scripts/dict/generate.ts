// 1用語の辞書エントリを生成するロジック

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { DictTerm, DictEntry } from '../types.js';
import { checkMesh, esearchCount, yearlyCounts, recentArticles, buildCopyableQuery } from './pubmed.js';
import { generateDictContent } from './claude.js';

const ENTRIES_DIR = join(process.cwd(), 'data', 'dict', 'entries');

async function fileExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

export async function generateEntry(term: DictTerm, opts: { force?: boolean } = {}): Promise<{ entry?: DictEntry; skipped?: boolean; error?: string }> {
  await mkdir(ENTRIES_DIR, { recursive: true });
  const outPath = join(ENTRIES_DIR, `${term.slug}.json`);
  if (!opts.force && await fileExists(outPath)) {
    return { skipped: true };
  }
  try {
    // 1. MeSH 確認
    const mesh = await checkMesh(term.en);
    // 2. コピペ用クエリ構築
    const query = buildCopyableQuery(term.en, mesh.exists, mesh.heading);
    // 3. 総件数
    const total = await esearchCount(query);
    // 4. 年別
    const yearly = await yearlyCounts(query, 10);
    // 5. 最近の論文
    const articles = await recentArticles(query, 5);
    // 6. Claude 解説
    const content = await generateDictContent(term);

    const entry: DictEntry = {
      ...term,
      meshHeading: mesh.heading,
      meshUi: mesh.ui,
      description: content.description,
      usage: content.usage,
      synonyms: content.synonyms,
      pubmedCount: total,
      yearlyCount: yearly,
      searchQuery: query,
      recentArticles: articles,
      generatedAt: new Date().toISOString(),
    };

    await writeFile(outPath, JSON.stringify(entry, null, 2), 'utf-8');
    return { entry };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}
