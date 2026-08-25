# 学生向け PubMed リサーチアシスタント — 設計要件書 (MVP: Phase 1+2)

> ステータス: **設計フェーズ**  
> 対象: sciencepubmed.net の新機能として `/ja/search` に統合  
> 前提: 既存の PubMed E-utilities 呼び出しコード / Anthropic Claude API キー / Cloudflare Workers デプロイパイプラインを流用

---

## 1. 背景と目的

### 課題

日本の大学生・大学院生 (特に心理・生物・医療系) が卒論・研究テーマ探しで PubMed を使うとき、以下の壁がある:

1. **英語検索がハードル**: 医学英語のキーワードを組み立てられず、思ったような論文にたどり着けない
2. **abstract を読むのに時間がかかる**: 1 本ずつ英語 abstract を読む労力大
3. **論文の芋づる的探索が難しい**: 「この論文の類似は?」「反論しているのは?」を効率的に辿れない
4. **AI 検索ツール (Elicit / Consensus) は英語 UI + 有料化**: 日本人学生には敷居高い

### 目的

**日本語入力で PubMed 検索 + AI との対話で論文発見をアシストする** ツールを sciencepubmed.net 内に公開。

差別化 = **日本の大学生特化 (完全日本語 UI + 心理・生物・医療系にフォーカス)**。

---

## 2. スコープ (MVP: Stage A + B)

MVP は **フリーミアム構成** で 2 段階に分ける。Stage A → B の順で実装するが両方同じスプリントで完成させる想定。

### Stage A: 無料機能 (Claude API ほぼ使わない)

- **日本語入力 → PubMed 検索** (`/ja/lab`)
  - Claude で日本語 → 英語クエリ変換 (~$0.001/検索 = ほぼ無料)
  - PubMed E-utilities で検索、上位 10 件取得
- **論文カード表示** (英語 abstract そのまま、日本語要約は有料 gate)
  - タイトル・著者・誌・年・英語 abstract
  - PubMed 原典リンク
- **サイト内記事検索** (`/ja/lab/site-search`) — 既存 sciencepubmed.net 記事から検索
- **ゲスト利用可** (認証不要でも試せる、rate limit あり)

### Stage B: 有料機能 (Claude API 使用、認証 + 決済 gate)

- **論文 abstract の日本語 3 行要約**
- **論文壁打ちチャット**
  - 特定論文の context を入れた対話 UI
  - よくある質問テンプレ (要点/限界/類似/反論/卒論引用)
- **検索履歴保存 + お気に入り論文**
- **月間検索・チャット無制限**

### 含まない (Phase 3+ 送り)

- 引用ネットワーク可視化
- 論文比較機能
- 論文 PDF 全文取得
- 複数論文の統合レビュー生成 (メタ的な出力)

---

## 2b. フリーミアム設計

### 料金プラン (初期案)

| プラン | 料金 | 検索/月 | AI 要約 | 壁打ち | 履歴 |
|---|---|---|---|---|---|
| **ゲスト** | 無料 | 10 検索/日 (IP ベース) | ⛔ | ⛔ | ⛔ |
| **登録無料** | 無料 (要 Google ログイン) | 30 検索/日 | 月 5 件まで試用 | 月 5 msg まで試用 | ✅ (30 日) |
| **PubMed Lab+** | ¥500/月 (or ¥5000/年) | 無制限 | 無制限 | 無制限 | ✅ (永続) |

### 認証

- **Google OAuth** (Supabase Auth 経由) を採用
   - 大学生・研究者は Google アカウント持ってる率 100% に近い
   - Supabase Auth は無料枠が広く (50K MAU) 実装楽
- ログイン不要でも Stage A は使える (rate limit: 10 検索/日/IP)

### 決済

- **Stripe** (定額サブスク、日本円対応)
- 月額 ¥500 / 年額 ¥5000 (2ヶ月お得)
- 学生証持ってれば学生割引 (¥300/月) を後付けで検討

### DB (Supabase Postgres)

```sql
-- users テーブル (Supabase Auth と自動連携)
--   auth.users.id を FK に使う

profiles(
  id uuid PK REFERENCES auth.users(id),
  plan text CHECK (plan IN ('free', 'plus')) DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
)

-- 検索履歴
search_history(
  id bigserial PK,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  query_ja text,
  query_en text,
  result_count int,
  created_at timestamptz DEFAULT now()
)

-- お気に入り論文
favorites(
  id bigserial PK,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pmid text NOT NULL,
  title text,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pmid)
)

-- 使用量 (rate limit + kill switch 用)
usage_log(
  id bigserial PK,
  user_id uuid,               -- null = guest
  ip text,                    -- guest 判別用
  action text,                -- 'search', 'summary', 'chat'
  cost_estimate decimal(10,4), -- USD
  created_at timestamptz DEFAULT now()
)
CREATE INDEX ON usage_log(user_id, created_at);
CREATE INDEX ON usage_log(ip, created_at);
```

### コスト再計算 (フリーミアム前提)

| ユーザー数 | 有料転換率 | 有料ユーザー | 月間 Claude コスト | 月間売上 | 粗利 |
|---|---|---|---|---|---|
| 100 | 3% | 3 | 3×$5 = $15 | ¥1,500 | ¥0 (トントン) |
| 500 | 3% | 15 | $75 | ¥7,500 | ¥3,700 |
| 2000 | 3% | 60 | $300 | ¥30,000 | ¥15,000 |
| 10,000 | 3% | 300 | $1,500 | ¥150,000 | ¥75,000 |

無料ユーザーのコストはほぼゼロ (PubMed API + 微小な Claude クエリ変換のみ) なので、ユーザー数が伸びるほどマージン改善。

---

## 3. ユーザーフロー

```
[トップページ /ja/search]
         │
         │  日本語で入力 (例: 「大学生の睡眠不足と成績の関係」)
         ↓
[検索実行]
         │
         │  ① Claude で英語クエリ生成
         │  ② PubMed esearch + efetch
         │  ③ 各 abstract を Claude で日本語 3 行要約
         ↓
[結果画面]
   ┌─────────────────────────────────┐
   │ 検索結果 10 件 (カード一覧)      │
   │  - タイトル (日 + 英)             │
   │  - 著者・誌・年                   │
   │  - 3 行要約                        │
   │  - [PubMed で読む] [壁打ちする]  │
   └─────────────────────────────────┘
         │
         │  「壁打ちする」クリック
         ↓
[壁打ちチャット画面]
   ┌──────────────────────────────────┐
   │ 論文情報 (固定表示)                │
   │ ─────────────────                │
   │ チャット (対話 UI)                 │
   │  User: 「この研究の限界は?」        │
   │  AI:   「サンプルサイズが小さく…」   │
   │                                    │
   │  [テンプレ質問 5 個ボタン]          │
   └──────────────────────────────────┘
```

---

## 4. 画面設計 (テキスト wireframe)

### /ja/search (トップ)

```
─────────────────────────────────────────────────
🔍 PubMed リサーチアシスタント
─────────────────────────────────────────────────

日本語で検索できる論文データベース検索ツール。
卒論・研究テーマ探しに。

[大きめの検索窓]
 例: 大学生の睡眠不足と成績の関係
      発達心理学の最近のホット領域は?
      HSP に関するメタアナリシスある?
                                        [検索する]

──── サンプル検索 (クリックで実行) ────
[大学生 睡眠] [ADHD 治療] [腸活 メンタル] [進化心理学]

──── 使い方 ────
1. 日本語で気になるテーマ・質問を入力
2. AI が英語 PubMed クエリに変換して検索
3. 各論文を日本語要約 + 対話で深掘り

──── 注意 ────
- 一般教養目的。医療助言ではありません
- 論文の解釈は必ず原典を確認してください
- 詳しくは [論文の読み方ガイド] へ
─────────────────────────────────────────────────
```

### /ja/search?q=... (検索結果)

```
─────────────────────────────────────────────────
検索: 「大学生の睡眠不足と成績の関係」
生成された英語クエリ: (sleep deprivation) AND ...
─────────────────────────────────────────────────

📄 10 件見つかりました

┌ 1. 睡眠不足は大学生の学業成績と関連する: 系統的レビュー
│   Sleep Deprivation and Academic Performance in ...
│   Journal of Sleep Research · 2023
│   
│   3行要約:
│   • 41 研究のメタ解析で、睡眠時間 6h 未満の学生は...
│   • ... (省略)
│   
│   [PubMed で読む] [🤖 壁打ちする]
└─────────────────────────

┌ 2. ... 
...
```

### /ja/search/paper/[pmid] (壁打ちチャット)

```
─────────────────────────────────────────────────
← 検索結果に戻る
─────────────────────────────────────────────────

📄 睡眠不足は大学生の学業成績と関連する: 系統的レビュー
Sleep Deprivation... · J Sleep Res · 2023 · PMID:12345678
[原文を PubMed で見る]

─── 3 行要約 ───
• ...
• ...
• ...

─── よくある質問 ───
[この研究の要点は?] [対象・方法・限界は?] [類似する他の研究は?]
[反論している研究は?] [卒論で引用するなら?]

─── チャット ───
👤 User: この研究の要点は?
🤖 AI: この論文は...

[入力欄...............................] [送信]
─────────────────────────────────────────────────
```

---

## 5. 技術設計

### アーキテクチャ

```
[ブラウザ]
    │  fetch POST
    ↓
[Cloudflare Pages Functions / Astro SSR endpoint]
    │  /api/search
    │  /api/chat
    ├──→ [Anthropic Claude API] (要約・クエリ変換・対話)
    └──→ [PubMed E-utilities API] (esearch, efetch)
    ↓
[結果を JSON で返す]
    │
[ブラウザで render]
```

### コード配置

```
sciencepubmed.net (既存 Astro プロジェクト)
├── src/pages/ja/search/
│   ├── index.astro                トップ画面 (検索窓 + サンプル)
│   ├── results.astro              検索結果 (SSR、?q=... で叩く)
│   └── paper/[pmid].astro         壁打ちチャット (SSR + client hydration)
├── src/pages/api/
│   ├── search.ts                  POST 検索エンドポイント
│   └── chat.ts                    POST チャットエンドポイント
├── src/components/
│   ├── SearchBar.astro
│   ├── PaperCard.astro
│   ├── ChatUI.astro (or React island)
│   └── QuickQuestionButtons.astro
└── scripts/lib/
    ├── search-orchestrator.ts     日本語 → 英語クエリ → 検索 → 要約 の一連ロジック
    ├── query-translator.ts        日本語意図 → PubMed 英語クエリ
    ├── abstract-summarizer.ts     abstract → 日本語 3 行要約
    └── chat-agent.ts              論文 context + 履歴 → AI 応答
```

### 既存資産の流用

- `scripts/pubmed/fetch.ts` の `fetchArticle` / `fetchRandomPmid` を検索版に拡張
- `scripts/lib/env.ts` の env 読み込み
- Anthropic SDK client を再利用

### 新たに必要な設定

- **Astro SSR モードの有効化** (現在は完全静的サイト)
  - `astro.config.mjs` に `output: 'hybrid'` 追加
  - `/api/*` と `/ja/search/*` のみ SSR、その他の記事ページは静的維持
  - Cloudflare Pages 対応: `@astrojs/cloudflare` adapter

### 主要 API 仕様

#### POST /api/search

```typescript
Request:
{
  query: string;         // 日本語入力 (例: "大学生の睡眠不足")
  maxResults?: number;   // 上位 N 件、デフォルト 10、最大 20
}

Response:
{
  englishQuery: string;              // Claude が生成した英語 PubMed クエリ
  results: Array<{
    pmid: string;
    title: string;                    // 英語原題
    titleJa: string;                  // 日本語意訳
    authors: string[];
    journal: string;
    year: number;
    abstractSummaryJa: string[];      // 日本語 3 行要約
    pubmedUrl: string;
  }>;
  meta: {
    totalCount: number;               // PubMed 側の総件数
    fetchedCount: number;             // 実際に取得した件数
    cacheHit: boolean;
  };
}
```

#### POST /api/chat

```typescript
Request:
{
  pmid: string;
  paperContext: {                    // 初回のみ必要、以降 session で保持
    title: string;
    abstract: string;
    journal: string;
    year: number;
  };
  messages: Array<{                  // 会話履歴
    role: 'user' | 'assistant';
    content: string;
  }>;
}

Response:
{
  reply: string;                     // AI の返答
  usage: { input: number, output: number };
}
```

---

## 6. コスト設計

### 1 検索あたり Claude API コスト概算

| 処理 | tokens (in/out) | コスト |
|---|---|---|
| 日本語 → 英語クエリ変換 | 200 / 100 | $0.001 |
| 論文 10 件を各要約 (10 回並列呼び出し) | 400×10 / 200×10 | $0.06 |
| **1 検索合計** | | **~$0.06** |

### 1 チャットメッセージ

| 処理 | tokens (in/out) | コスト |
|---|---|---|
| 論文 context + 履歴 5 発分 + 質問 → 応答 | 1500 / 400 | ~$0.02 |

### 月間コストシミュレーション

| ユーザー数 (仮) | 検索/人/月 | チャット/人/月 | 月間 API コスト |
|---|---|---|---|
| 10 | 5 | 10 | $5 |
| 100 | 5 | 10 | $50 |
| 1000 | 5 | 10 | $500 |

**フリーミアム前 (完全無料)** で **月 100 ユーザー / 5 検索** なら $5 程度で運用可能。爆発したら要フリーミアム化。

### コスト制御メカニズム

MVP 段階で入れる保険:
- **1 IP あたり 1 日 20 検索まで** (Cloudflare KV でカウント、超過は 429 応答)
- **1 チャット セッションで 20 メッセージまで** (超過は「新しい論文で始めて」)
- **Claude API 使用量が月 $50 超えたら kill switch** (要監視、後追い実装可)

---

## 7. UX 設計上のポイント

### 大学生に効くコピー・演出

- **「英語ダメでも PubMed 使える」** をトップの一言で
- サンプル検索を目立たせる (何を検索していいか分からない層向け)
- 検索履歴を localStorage で覚えておく (認証なしでも)
- 各論文カードの右上に「☆」でお気に入り (Phase 3 で認証と連動)

### 免責・薬機法配慮

- 全画面フッターに「本サービスは一般教養目的で、医療助言ではありません」
- 論文結果に自動で「読み解く上での注意」バナー表示 (相関≠因果 / メタ解析の見方 等)
- リンク先: 既存の `/ja/guide/how-to-read-research/`

### SEO

- `/ja/search` は SSR で meta description に検索キーワードを埋め込み
- 各検索結果ページを (キャッシュして) SEO 対象に
- `/ja/search/paper/[pmid]` は動的 canonical で PubMed 側へ

---

## 8. ロードマップ

| Phase | 内容 | 期間 | 依存 |
|---|---|---|---|
| **0. 設計 review** | 本 spec を確認・調整 | 1 日 | — |
| **1a. Astro SSR 化** | hybrid モード + Cloudflare adapter | 半日 | — |
| **1b. `/api/search` 実装** | クエリ変換 + PubMed 呼び出し + 要約 | 2 日 | 1a |
| **1c. `/ja/search` トップ + 結果 UI** | 検索窓 + カード表示 | 1 日 | 1b |
| **2a. `/api/chat` 実装** | 会話ロジック + context 管理 | 1 日 | 1b |
| **2b. `/ja/search/paper/[pmid]`** | 壁打ちチャット UI | 2 日 | 1c, 2a |
| **3. コスト制御** | KV rate limit + kill switch | 1 日 | 2b |
| **4. リリース** | Cloudflare デプロイ + サイトメニュー追加 | 半日 | 3 |

**合計 8-10 日** (実作業日ベース、待ち時間含めず)

---

## 9. リスク・オープンクエスチョン

| リスク/質問 | 影響 | 対応方針 |
|---|---|---|
| Astro SSR 化で既存 static ページのビルドが壊れる可能性 | 中 | `hybrid` モードで既存ページは `export const prerender = true` 明示 |
| PubMed API rate limit (10 req/sec) | 低 | 並列度制御 + キャッシュ |
| Claude API のコストが爆発 | 高 | rate limit + monitoring + kill switch |
| 日本語クエリの英語変換精度 | 中 | prompt engineering で対応、初期は「AI が生成した英語クエリ」も表示してユーザーが確認できるようにする |
| Cloudflare Pages Functions のコールドスタート | 低 | 初回 1-2 秒遅延を許容、UI で loading 表示 |
| 卒論代行的な使われ方 (倫理) | 中 | 「思考を支援するツール」と明示、丸パクリを助長しない設計 (要約は 3 行までなど) |

### 決定事項 (2026-08-25)

- **命名**: **`/ja/lab`** (「PubMed Lab」として学生層に馴染ませる呼称)
- **キャラクター性**: **PubMed Trivia 傘下** (既存のロゴ・配色を継承、サブブランド作らず)
  - ページタイトル: 「PubMed Lab ｜ 論文リサーチアシスタント」
  - サイト内リンク文言例: 「🔬 PubMed 検索ラボを試す」
- **サンプル検索のテーマ**: **PubMed 全分野** (制限なし、36M+ 論文フル対象)
  - サンプル質問は心理・生物寄りだが 医療・薬学・栄養・工学系も混ぜる

---

## 10. 完了条件 (MVP リリース基準)

- [ ] `/ja/search` にアクセス可能 (トップ画面)
- [ ] 日本語で検索して 10 件の PubMed 論文が日本語要約付きで表示される
- [ ] 論文カードから壁打ちチャットが起動し、AI が context を踏まえた応答をする
- [ ] Rate limit が動作 (1 IP 1 日 20 検索まで)
- [ ] モバイル UI で使える
- [ ] フッターに免責と guide ページへのリンク
- [ ] 既存記事の下部からも「PubMed を検索する」導線
- [ ] Cloudflare 本番デプロイ完了、実際に検索が動く
