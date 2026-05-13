# PubMed Trivia

PubMed 論文をランダムに取得し、Claude API で日本語/英語の豆知識記事を生成する Astro サイト + ジェネレーター。
Twitter 投稿は Phase 3 で追加。

## 構成

```
pubmed-trivia/
├── src/                  # Astro サイト (i18n: ja default, en, 両方サブパス)
│   ├── content/{ja,en}/{psychology,biology}/  # 生成済み記事 Markdown
│   ├── pages/{ja,en}/{psychology,biology}/    # カテゴリ index と [slug]
│   ├── layouts/  components/
│   └── content.config.ts                      # Content Collections スキーマ
├── scripts/              # 記事生成 (TypeScript / tsx)
│   ├── pubmed/   queries.ts, fetch.ts, run-fetch.ts
│   ├── claude/   prompts.ts, generate.ts, run-generate.ts
│   ├── pipeline/ run-daily.ts
│   ├── lib/      logger.ts, ng-words.ts, slug.ts, files.ts
│   └── types.ts
├── out/raw/              # PubMed から取得した生 JSON (gitignore)
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── .env.example
```

`run-*.ts` が CLI エントリ、`*.ts` (logic) は副作用最小の関数群。GAS 流儀の run/logic 分離。

## カテゴリ

将来 Twitter アカウントを分けやすいよう `category` を最初から分離:

- `psychology`: 心理学・学習・睡眠・記憶・行動経済学（書籍誘導と相性◎）
- `biology`: 動物行動・進化・生態・人類学（純雑学）

クエリは `scripts/pubmed/queries.ts`。薬機法に滑り込みやすい nutrition/drug/disease は意図的に外している。

## セットアップ

```bash
npm install
cp .env.example .env
# .env に ANTHROPIC_API_KEY と PUBMED_EMAIL を入れる
```

## 使い方 (Phase 1)

### 1記事だけ作って手動確認

```bash
npm run pipeline:daily -- --category=psychology
npm run pipeline:daily -- --category=biology
npm run pipeline:daily -- --category=all       # 両カテゴリ続けて
```

`src/content/ja/psychology/YYYYMMDD-{PMID}.md` 等が生まれる。

### サイトをローカル確認

```bash
npm run dev
# http://localhost:4321/ja/  /en/
```

### 個別ステップ実行

```bash
# PubMed 取得だけ → out/raw/{PMID}.json と PMID を stdout
PMID=$(npm run -s gen:fetch -- --category=psychology)

# 既存 raw から記事生成だけ
npm run gen:generate -- --pmid=$PMID --category=psychology
```

## コンテンツ品質ガード

- **NG 語ポストチェック** (`scripts/lib/ng-words.ts`)
  薬機法 NG 表現（効く/治る/予防する/改善する 等）が混入していたら最大 2 回まで再生成
- **association → causation 防止**
  プロンプトと NG 辞書の両方で「原因」「引き起こす」型の表現を抑制
- **必ず原文 abstract から日英を別呼び出しで生成**（二重翻訳しない）

## Phase 2 / 3 予定

- Phase 2: Cloudflare Pages デプロイ自動化、AdSense / Amazon アソシエイト埋め込み、PA-API
- Phase 3: X API 投稿 + GitHub Actions cron（カテゴリ別に分けやすいよう category arg を既に実装済み）
