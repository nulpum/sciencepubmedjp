// MOSHIMO_BANNERS を public/moshimo-banners.json に 書き出す。
//
// 従来 は MoshimoBanner.astro が SSR 時 に banner HTML 全 61 件 を JSON.stringify して
// 各 ページ に インライン していた → HTML 161 KB / img 360 個 / LCP 悪化 の 主因。
//
// 本 スクリプト が emit した JSON を client が IntersectionObserver で 遅延 fetch する。
//
// 2026-11-19: 読者 層 (大学生+研究者) に 不 適合 な banner を weight 0 で 配信 停止 する
// 仕組み を 追加。 weight === 0 の 項目 は JSON に 含めない (bandwidth + CTR 品質 向上)。

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MOSHIMO_BANNERS } from "../../src/config/moshimo-banners";

function stripLazyFromImpression(html: string): string {
  return html.replace(
    /(<img[^>]*i\.moshimo\.com\/af\/i\/impression[^>]*?)\s+loading="lazy"/g,
    "$1",
  );
}

async function main(): Promise<void> {
  const active = MOSHIMO_BANNERS.filter((b) => (b.weight ?? 1) > 0);
  const dropped = MOSHIMO_BANNERS.length - active.length;
  const payload = active.map((b) => ({
    id: b.id,
    html: stripLazyFromImpression(b.html),
    weight: b.weight ?? 1,
  }));
  const outPath = join(process.cwd(), "public", "moshimo-banners.json");
  const json = JSON.stringify(payload);
  await writeFile(outPath, json, "utf8");
  console.log(
    `emit-moshimo-banners: ${payload.length} active banners (${dropped} dropped, weight=0) → ${outPath} (${json.length} bytes)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
