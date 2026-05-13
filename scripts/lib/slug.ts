// slug 生成: PMID は世界一意なのでそれをそのまま使う。
// 日付を頭につけるとリスト整列が楽。

export function buildSlug(pmid: string, dateIso?: string): string {
  const d = dateIso ? new Date(dateIso) : new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${pmid}`;
}
