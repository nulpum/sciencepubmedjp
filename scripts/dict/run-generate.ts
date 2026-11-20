// CLI: data/dict/terms.json を読み、未生成のエントリを順次生成
//
// 使い方:
//   npm run gen:dict                    # 未生成分のみ
//   npm run gen:dict -- --force         # 全部再生成
//   npm run gen:dict -- --limit=5       # 最初の5件だけ (試験用)
//   npm run gen:dict -- --slug=xxx      # 指定slugのみ

import '../lib/env.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DictTerm } from '../types.js';
import { generateEntry } from './generate.js';

const TERMS_PATH = join(process.cwd(), 'data', 'dict', 'terms.json');

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const slugArg = args.find(a => a.startsWith('--slug='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;
  const slug = slugArg ? slugArg.split('=')[1] : undefined;

  const raw = await readFile(TERMS_PATH, 'utf-8');
  let terms: DictTerm[] = JSON.parse(raw);
  if (slug) terms = terms.filter(t => t.slug === slug);
  if (limit) terms = terms.slice(0, limit);

  console.log(`[dict/run-generate] processing ${terms.length} terms (force=${force})`);

  let ok = 0, skip = 0, fail = 0;
  for (const t of terms) {
    const r = await generateEntry(t, { force });
    if (r.skipped) { skip++; console.log(`  SKIP  ${t.slug}`); continue; }
    if (r.error)   { fail++; console.log(`  FAIL  ${t.slug}  ${r.error}`); continue; }
    ok++;
    console.log(`  OK    ${t.slug}  (${r.entry?.pubmedCount ?? '?'} hits, MeSH=${r.entry?.meshHeading ?? 'none'})`);
  }
  console.log(`[dict/run-generate] done: ok=${ok} skip=${skip} fail=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
