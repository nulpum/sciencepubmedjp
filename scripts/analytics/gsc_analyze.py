#!/usr/bin/env python3
"""GSC Performance export zip を 解析して killer zone + 月別推移 を 出力。

使い方:
    python scripts/analytics/gsc_analyze.py path/to/gsc-export.zip
    python scripts/analytics/gsc_analyze.py path/to/gsc-export.zip --out report.md

GSC 側 の 書き出し 手順:
    Search Console > パフォーマンス > エクスポート > CSV (zip) をダウンロード
"""
import argparse
import csv
import io
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path


def pnum(s):
    if not s:
        return 0
    return float(s.replace(",", "").replace("%", "").strip())


def read_csvs_distinct(zip_path):
    """zip 内 CSV を utf-8 で 読み、 列名 で ページ/クエリ を 区別 する。"""
    out = defaultdict(list)
    with zipfile.ZipFile(zip_path) as z:
        for name in z.namelist():
            if not name.lower().endswith(".csv"):
                continue
            with z.open(name) as fh:
                raw = fh.read()
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                text = raw.decode("utf-16", errors="replace")
            header = text.split("\n", 1)[0].strip()
            rdr = csv.DictReader(io.StringIO(text))
            rows = list(rdr)
            if "上位のページ" in header:
                out["pages"].extend(rows)
            elif "上位のクエリ" in header:
                out["queries"].extend(rows)
            elif header.startswith("日付"):
                out["dates"].extend(rows)
            elif header.startswith("国"):
                out["countries"].extend(rows)
            elif header.startswith("デバイス"):
                out["devices"].extend(rows)
            elif header.startswith("フィルタ"):
                out["filters"].extend(rows)
            elif header.startswith("検索での見え方"):
                out["appearance"].extend(rows)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("zip", help="GSC export zip")
    ap.add_argument("--out", help="output markdown path (default: stdout)")
    args = ap.parse_args()

    csvs = read_csvs_distinct(args.zip)
    pages = csvs["pages"]
    queries = csvs["queries"]
    dates = csvs["dates"]

    buf = io.StringIO()

    def w(line=""):
        buf.write(line + "\n")

    w(f"# GSC Analysis: {Path(args.zip).name}")
    w("")
    for r in csvs["filters"]:
        w(f"- {r.get('フィルタ', '?')}: {r.get('値', '?')}")
    w("")

    # === 月別 推移 ===
    w("## 月別 推移")
    w("")
    w("| 月 | Clicks | Impr | CTR |")
    w("|---|---|---|---|")
    monthly = defaultdict(lambda: {"c": 0, "i": 0})
    for r in dates:
        ym = r["日付"][:7]
        monthly[ym]["c"] += int(pnum(r["クリック数"]))
        monthly[ym]["i"] += int(pnum(r["表示回数"]))
    for ym in sorted(monthly):
        c, i = monthly[ym]["c"], monthly[ym]["i"]
        ctr = f"{c/i*100:.2f}%" if i else "-"
        w(f"| {ym} | {c} | {i} | {ctr} |")
    w("")

    # === 直近 14 日 vs 前 14 日 ===
    if len(dates) >= 28:
        rc = sum(int(pnum(r["クリック数"])) for r in dates[-14:])
        ri = sum(int(pnum(r["表示回数"])) for r in dates[-14:])
        pc = sum(int(pnum(r["クリック数"])) for r in dates[-28:-14])
        pi = sum(int(pnum(r["表示回数"])) for r in dates[-28:-14])
        w("## 直近 14 日 vs 前 14 日")
        w("")
        w(f"- 直近 14日: {rc} clicks / {ri} impr / CTR {rc/ri*100 if ri else 0:.2f}%")
        w(f"- 前   14日: {pc} clicks / {pi} impr / CTR {pc/pi*100 if pi else 0:.2f}%")
        w(f"- 変化: clicks {rc-pc:+d} / impr {ri-pi:+d}")
        w("")

    # === 言語別 ===
    ja_c = ja_i = en_c = en_i = 0
    for r in pages:
        url = r["上位のページ"]
        c = int(pnum(r["クリック数"]))
        i = int(pnum(r["表示回数"]))
        if "/en/" in url:
            en_c += c
            en_i += i
        else:
            ja_c += c
            ja_i += i
    w("## 言語別")
    w("")
    w(f"- JA: {ja_c} clicks / {ja_i} impr / CTR {ja_c/ja_i*100 if ja_i else 0:.2f}%")
    w(f"- EN: {en_c} clicks / {en_i} impr / CTR {en_c/en_i*100 if en_i else 0:.2f}%")
    w("")

    # === キラーゾーン ===
    w("## キラーゾーン (pos<=10 & clicks=0 & impr>=5)")
    w("")
    killers = [
        p
        for p in pages
        if int(pnum(p["クリック数"])) == 0
        and float(pnum(p["掲載順位"])) <= 10
        and int(pnum(p["表示回数"])) >= 5
    ]
    killers.sort(key=lambda r: -int(pnum(r["表示回数"])))
    w("| pos | impr | URL |")
    w("|---|---|---|")
    for r in killers[:30]:
        pos = r["掲載順位"]
        impr = int(pnum(r["表示回数"]))
        url = r["上位のページ"].replace("https://sciencepubmed.net", "")
        w(f"| {pos} | {impr} | `{url}` |")
    w("")

    # === Position 分布 (EN vs JA) ===
    w("## Position 分布")
    w("")
    for prefix, label in [("/en/", "EN"), ("/ja/", "JA")]:
        buckets = defaultdict(lambda: {"count": 0, "impr": 0, "clicks": 0})
        for r in pages:
            if prefix not in r["上位のページ"]:
                continue
            p = float(pnum(r["掲載順位"]))
            if p <= 10:
                b = "1-10"
            elif p <= 20:
                b = "11-20"
            elif p <= 50:
                b = "21-50"
            else:
                b = "51+"
            buckets[b]["count"] += 1
            buckets[b]["impr"] += int(pnum(r["表示回数"]))
            buckets[b]["clicks"] += int(pnum(r["クリック数"]))
        w(f"### {label}")
        w("")
        w("| bucket | pages | impr | clicks | CTR |")
        w("|---|---|---|---|---|")
        for b in ["1-10", "11-20", "21-50", "51+"]:
            v = buckets[b]
            ctr = f"{v['clicks']/v['impr']*100:.2f}%" if v["impr"] else "-"
            w(f"| {b} | {v['count']} | {v['impr']} | {v['clicks']} | {ctr} |")
        w("")

    # === Top クエリ ===
    w("## Top 30 クエリ (Clicks 降順)")
    w("")
    w("| クエリ | Clicks | Impr | CTR | Pos |")
    w("|---|---|---|---|---|")
    qs = sorted(
        queries,
        key=lambda r: (-int(pnum(r["クリック数"])), -int(pnum(r["表示回数"]))),
    )
    for r in qs[:30]:
        q = r["上位のクエリ"]
        c = int(pnum(r["クリック数"]))
        i = int(pnum(r["表示回数"]))
        w(f"| {q} | {c} | {i} | {r['CTR']} | {r['掲載順位']} |")
    w("")

    # === Impression 多いけど Clicks 0 (改善 候補) ===
    w("## タイトル 改善 候補 (impr 多 & clicks 0)")
    w("")
    w("| クエリ | Impr | Pos |")
    w("|---|---|---|")
    no_click = [r for r in queries if int(pnum(r["クリック数"])) == 0]
    no_click.sort(key=lambda r: -int(pnum(r["表示回数"])))
    for r in no_click[:20]:
        q = r["上位のクエリ"]
        i = int(pnum(r["表示回数"]))
        w(f"| {q} | {i} | {r['掲載順位']} |")

    text = buf.getvalue()
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"Report written to: {args.out}", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
