# AdSense 通過 後 noindex 解除 計画

## 背景

2026-11-17 に AdSense 「有用性 の 低い コンテンツ」 対策 で 大量 の
auto-generated daily 記事 を 一括 noindex 化。 これ に より サイト 全体 の
検索 露出 の 60-80% が 消失 した。

GSC 2026-11-19 データ で 判明:
- noindex 済 記事 が 合計 1,909 impr を 吸って いた (全 impr 4,388 の 44%)
- うち 14 rewrite 対象 (11-09 commit daab747 で title 最適 化 済 み) も
  全数 noindex されて おり、 rewrite 効果 が 測定 不可 の 状況
- 深掘り 記事 (-evidence 系 6 本) は noindex されて いない の で OK

## 解除 戦略 (段階 的、 AdSense 通過 を 待って)

### 第 1波: 即 解除 対象 (14 件)

11-09 の title rewrite 対象。 既 に 内容 品質 が 一定 以上 で、
「キラーゾーン」 (pos 1-10) に 位置 して いた 記事。 AdSense 通過 後、
最 優先 で noindex を 剥がす。

**EN 11 本**:
- src/content/en/biology/20260612-40155609.md
- src/content/en/biology/20260710-41524176.md
- src/content/en/biology/20260718-41061906.md
- src/content/en/biology/20260815-40955568.md
- src/content/en/biology/20260924-41754207.md
- src/content/en/psychology/20260614-38718488.md
- src/content/en/psychology/20260724-41260295.md
- src/content/en/psychology/20260821-38935007.md
- src/content/en/psychology/20260823-38626312.md  (61 impr @ pos 9)
- src/content/en/psychology/20260827-40987079.md
- src/content/en/psychology/20261006-39919521.md

**JA 3 本**:
- src/content/ja/biology/20260808-40962150.md
- src/content/ja/psychology/20260807-40980490.md  (10 impr @ pos 2.2!)
- src/content/ja/psychology/20260808-42160139.md

### 第 2波: 1 週間 後 解除 対象 (高 impr noindex、 pos 70+)

本文 を 軽 く 強化 して から 解除。 単発 クエリ で 露出 する 記事 で、
pos は 低い が impr は 大きい (= long tail 捕捉 済)。

- src/content/en/biology/20260730-40265338.md  (451 impr) — Inner Mitochondrial Membrane
- src/content/en/biology/20260617-41417588.md  (366 impr) — Probiotics Antibiotic Diarrhea
- src/content/en/psychology/20260620-39913483.md  (799 impr @ pos 4.4!) — Conspiracy beliefs
- src/content/ja/psychology/20260620-39913483.md  (19 impr)
- src/content/en/biology/20260619-39801083.md  (111 impr) — GLP-1 Appetite
- src/content/en/biology/20260601-40869419.md  (40 impr) — Probiotic Strains Mood
- src/content/en/biology/20260613-39863438.md  (29 impr) — Gut Rheumatoid
- src/content/en/biology/20260723-41076730.md  (26 impr) — Omega-3 Gut
- src/content/en/biology/20260703-42124041.md  (26 impr) — Autism Metabolic

**特 筆**: 39913483 EN は pos 4.4 で 799 impr と サイト 最大 の 検索 露出 ソース。
noindex 解除 + 深掘り 化 (content strengthening) の セット で 対応 推奨。

### 第 3波: 1 ヶ月 後 段階 解除 (低 impr auto-generated)

残り の noindex 済 記事 を、 内容 を 間引 き 整理 しながら 徐々 に 解除。
AdSense の 「有用性 の 低い コンテンツ」 判定 に 再度 引っかから ない よう、
日次 自動 生成 の 停止 を 継続 + 既 存 記事 の 品質 底上げ を 並行。

## 実装 コマンド (第 1波、 14 件)

```bash
cd pubmed-trivia
for f in <14 files>; do
  # frontmatter の noindex: true 行 と noindex_reason 行 を 削除
  sed -i '/^noindex: true/d' "$f"
  sed -i '/^noindex_reason:/d' "$f"
done
git add src/content
git commit -m "feat(adsense-pass): 第 1波 — 14 rewrite 対象 の noindex 解除"
git push
```

## 検証 KPI

- 解除 後 1 週間: 14 記事 の clicks が 0 → N (N ≥ 1 が 目標)
- 解除 後 2 週間: サイト 全体 の clicks を 2026-10 水準 (10/日) 以上 に 戻す
- 深掘り 誘発 クエリ (`which probiotic strains...` @ pos 2.4 等) の clicks 検証

## 作成 経緯

- 2026-11-19 GSC 分析 で 「14 rewrite の 効果 が 全部 noindex で 消えた」 問題 を 発見
- 事前 計画 として 本 docs を 作成、 AdSense 通過 直後 に 実行

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
