---
title: "日本語で PubMed が引ける ツールを個人で作った話 - Astro + Cloudflare Workers + Claude"
emoji: "🔬"
type: "tech"
topics: ["astro", "cloudflare", "claude", "typescript", "個人開発"]
published: false
---

## 3 行まとめ

- **日本語で入力するだけで、AI が MeSH タームつきの英語 PubMed クエリに変換 → 検索** できるツール [PubMed Lab](https://sciencepubmed.net/ja/lab/) を作った
- Astro (SSR) + Cloudflare Workers + Claude Sonnet 4.5 (クエリ変換) / Haiku 4.5 (壁打ち) の構成
- 論文と壁打ちチャットや、検索結果を俯瞰した「卒論テーマ 3 案提案」機能もあり、**すべて無料・登録不要**

サイト → https://sciencepubmed.net/ja/lab/

---

## なぜ作ったか

卒論・修論のリサーチで PubMed を使う大学生・院生は多い。 でも、実際に使ってみると、こういうハードルが順に立ちはだかる。

1. **英語で検索する必要がある** (日本語入力できない)
2. **MeSH ターム** ("sleep deprivation"[MeSH] みたいなの) を知らないと結果が絞れない
3. **どの論文が「入口」に読むべき論文か分からない** (10 件表示されて詰まる)
4. **abstract を読んでも英語で入ってこない、要点整理が面倒**

これを全部 AI で解決したツールがあれば、大学生の卒論作業が数日短縮できる。 そう思って作った。

## 技術スタック

シンプル寄せ、個人開発の維持コスト最小化を優先。

| レイヤー | 選択 | 理由 |
|---|---|---|
| Framework | Astro 5 | SSR / SSG ハイブリッド、Cloudflare 統合が綺麗 |
| Hosting | Cloudflare Workers (Static Assets + SSR) | 無料枠が超広い、日本 latency 低 |
| LLM (クエリ変換) | Claude Sonnet 4.5 | MeSH ターム判定の精度が Haiku より上 |
| LLM (壁打ち) | Claude Haiku 4.5 | in $1/M, out $5/M で Sonnet の 1/3 コスト、abstract 根拠の QA は Haiku で十分 |
| Data source | PubMed E-utilities API | 無料、API key 取得で 10 req/sec |
| Analytics | Google Analytics 4 | 無料、詳細イベント計測可 |
| Ads | Google AdSense | 記事下 + Lab 3 箇所配置 |

コスト: 記事自動生成 (毎日 4 本) 込みで **月 ~¥500-2000**。 個人開発として十分回る。

## 日本語 → 英語 PubMed クエリ変換

コアの機能。 Claude に system prompt でルール指示、JSON 縛りで返させる。

```typescript
const systemPrompt = [
  'You are a scientific literature search expert.',
  'Convert Japanese natural-language research questions',
  'into PubMed search queries.',
  '',
  'Rules:',
  '1. Use MeSH terms with [MeSH] qualifier when standard heading exists',
  '   (e.g. "sleep deprivation"[MeSH])',
  '2. Include synonyms with OR to broaden recall',
  '   (e.g. (children OR pediatric OR adolescent))',
  '3. Output STRICT JSON only: {"englishQuery": string, "notes": string}',
].join('\n');
```

入力: `"大学生の睡眠と成績の関係"`

出力:
```json
{
  "englishQuery": "(\"sleep deprivation\"[MeSH] OR \"sleep quality\") AND (\"academic performance\" OR \"academic achievement\") AND (\"university students\" OR undergraduate)",
  "notes": "MeSH の sleep deprivation を主軸に、成績関連キーワードで絞込み"
}
```

MeSH ターム を Claude が自主的に判定して差し込むのがポイント。 これがあると PubMed の検索精度が段違い。

## 論文と壁打ちチャット (Anti-hallucination)

各論文カードから「💬 この論文と壁打ち」ボタン。 abstract を根拠に AI と質疑応答できる。

肝は **abstract の外の情報を「知らない」と答えさせる** こと。 Claude に強めのルールで指示している:

```
### DO NOT (絶対禁止)
❌ Abstract に無い数値や結論の捏造
❌ 「一般的には〜」で abstract 外の情報を混入
❌ 医療・投薬助言 (「〜すべき」「〜が効きます」)
❌ 「反対の研究は?」等 abstract 外の質問に断定的に答える
    → 「私は貼られた abstract 情報のみを持つため、
       他の研究の存在は確答できません」と返す
```

Claude Haiku 4.5 でこのルールに 9 割方 従ってくれる (Sonnet だと 99%)。 コスト差を考えると Haiku で十分。

## 卒論テーマ提案 (5 論文俯瞰の JSON)

これは推し機能。 検索結果 上位 5 本を俯瞰して、大学生でも実行可能な派生研究テーマを 3 案返す。

```json
{
  "interests": ["睡眠", "大学生", "学業成績", "認知機能"],
  "themes": [
    {
      "title": "日本人大学生を対象にした睡眠介入 RCT",
      "why": "米国データが中心の PMID:xxxxx を、日本人サンプルで再現。 質問紙 + 週間ダイアリー、N=100 で実施可能。",
      "basedOnPmid": "12345678"
    },
    ...
  ],
  "entryPaper": {
    "pmid": "12345678",
    "why": "方法論が明快で、この方向を進めるなら最初の一冊"
  }
}
```

「まず何を精読すべきか」まで指定してくれるので、卒論テーマ迷子の学生に刺さる。

## コスト管理: Sonnet → Haiku 切替

最初は壁打ちも Sonnet 4.5 だった。 でも壁打ちは abstract を根拠に返答する reasoning-light タスクなので Haiku で十分。 切替でコスト 1/3 になった。

| モデル | in $/M | out $/M | 1 msg (800/500 tok) | 100 UU/日 × 30日 |
|---|---|---|---|---|
| Sonnet 4.5 | 3 | 15 | ~¥1.5 | ~¥4,500 |
| **Haiku 4.5** | **1** | **5** | **~¥0.5** | **~¥1,500** |

品質は「abstract の要点整理・N数抽出・統計手法確認」レベルなら差は微差。 Sonnet が有意に強いのは「テーマ提案」だけなので、そこは Sonnet 継続。

## 「自分の AI 用プロンプト配布」でサーバーコスト 0 化

面白いのが、この記事で一番言いたい部分。

サーバー側で Claude を動かすと、UU が伸びるほど API コストが線形に増える。 個人開発だと即詰み。 そこで、**「PubMed 論文専用アシスタントに変身するプロンプト」を無料配布する** 発想に至った。

- ChatGPT (Free/Plus) の入力欄に貼れば、その AI が壁打ちアシスタントに変身
- Claude Free/Pro でも同じ
- Gemini でも動く

**ユーザーは自分の AI サブスク枠を使う**、我々の API コストはゼロ。 大学生の 20-30% は既に ChatGPT Plus / Claude Pro 課金してるので、この層はまるっと我々のコスト外で回る。

配布ページ → https://sciencepubmed.net/ja/lab/toolkit/

「サービスを自分で提供する」から「サービスを起動するテンプレートを配布する」への発想転換。 サーバーコスト 0、ユーザーは自分の AI 課金枠内で無制限に使える。 win-win。

## 学び

作りながら気付いたこと。

1. **PubMed の面白さは「フリーテキスト検索の柔軟性」だが、MeSH は英語文化前提** → 日本語ユーザーは AI 翻訳で橋渡しできる余地が大きい
2. **abstract は 情報密度が高い** → LLM の context window 内に 5-10 本くらいなら余裕で入る = 俯瞰系機能と相性◎
3. **医療系タスクは反ハルシネーション必須** → system prompt で「知らない」を強制するのが正解
4. **Haiku 4.5 は QA 系タスクの費用対効果が異常** → 壁打ち・要点整理レベルなら Sonnet と体感差 ほぼゼロ
5. **配布モデル (SaaS 反対) は個人開発の rescue** → 自分のインフラで全ユーザーを賄うのは無理、ユーザーの AI 枠を借りる発想が生き残り戦略

## 余談: なぜ AI × 科学に張るのか

技術的な話から少し離れて、個人的な考えを書いておきたい。

> AI が忌避される世の中になるほど AI は進化し続けている。
> それは今までの医学や科学の進歩と同じである。
> AI さえも大いに取り込み、医学や科学に対して学び進化し続ける者たちの助けになっていきたい。

新しい技術は、必ず一度「忌避」のフェーズを通る。 顕微鏡も、麻酔も、ワクチンも、電子カルテも、そうだった。 それでも技術は静かに進化し続けて、気付いた時には現場を書き換えている。

いま AI に対しても、同じ空気を感じる。 「AI が書いた論文は信用できない」「学生が AI に頼ると考えなくなる」— 声は大きい。 でも AI はその間も、着実に上手くなっている。

私は、その進化を「取り込む側」に立って学び続ける人たちの手を、静かに支える道具を作りたい。 医学・科学のような、蓄積が力になる世界では、AI を「使える道具」として扱える人が、5 年後 10 年後に大きく差をつける。

PubMed Lab は、その 5 年後の景色に向けた最初の一歩。

## 使ってみてください

- 検索ツール: https://sciencepubmed.net/ja/lab/
- プロンプト配布: https://sciencepubmed.net/ja/lab/toolkit/

サンプル検索例:
- 「大学生の睡眠不足と学業成績」
- 「ADHD の子どもへの認知行動療法」
- 「腸内細菌と精神的健康」

卒論・修論シーズンに向けて、iOS / Android アプリ版 (無料版・広告付き) も準備中。

## GitHub

https://github.com/nulpum/sciencepubmedjp

コードは全部 public、興味あれば読んでください。 Astro + Cloudflare Workers + Anthropic SDK の実装参考にどうぞ。
