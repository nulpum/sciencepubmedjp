# SNS 戦略的フォローキャンペーン — 定義要件 & 進捗トラッカー

> このドキュメントは**自己完結**。別セッション / 別エージェントに丸投げしても、
> これ単体で「何を・どこまで・どうやって」が分かるように書いてある。
> 途中再開時は「## 進捗ログ」を最初に読むこと。

---

## 1. 目的 (なぜやるか)

**PubMed Trivia** (sciencepubmed.net / 科学トリビア自動投稿bot) の SNS アカウント群:
- Threads: `@science_pubmed`
- Instagram: `@science_pubmed`
- Facebook Page: PubMed Trivia (ID 1103479166185406)
- X: 日本語アカウント (X Premium 加入済)

…のフォロワー基盤を、**相互フォロー率が高く拡散力のある日本の科学・教育・医療系アカウント**を手動フォローすることで育てる。

ターゲット選定基準:
- 科学・教育・医療・自然系で**ジャンルが近い** (= follow back 期待)
- フォロワー多 or エンゲージ高 (= 拡散インフラになる)
- 公序良俗 OK、bot/出会い系/スパムは除外

---

## 2. 制約 (絶対守る) ⚠️

各プラットフォームの **spam 検知を絶対トリガーしない**こと。過去に Meta 開発者アカウントが
「不審アクティビティ」でブロックされた事故があるため、慎重運用。

### 1日あたりのフォロー上限

| PF | 1日上限 | 1アクション間隔 |
|---|---|---|
| Instagram | **5〜10** | 5〜15 分以上 |
| Threads | **5〜10** | 5〜15 分以上 |
| Facebook (Page→Pageいいね) | **10〜15** | 5〜10 分以上 |
| X (Twitter) | **5〜20** (新規垢は控えめ) | 5 分以上 |

### 守るべき行動ルール
- **連打禁止**。1件フォローしたら数分空ける。
- フォローと同時に**その相手の最近の投稿に「いいね」1個**を押すと自然。
- 一度に全部やらない。1日の上限内で、できれば時間帯を散らす。
- 鍵垢・休眠垢 (最終投稿が半年以上前) はスキップ。
- フォロー back が無いアカウントを 2週間後に一括アンフォローするのは**やらない** (これも spam 判定リスク)。

---

## 3. 作業手順 (1日のルーティン)

1. 下の「## アカウントリスト」から、まだ ☐ (未フォロー) の行を**各 PF 5件ずつ**選ぶ
   - ランダムにしたい場合は Google Sheets で
     `=INDEX(範囲, RANDBETWEEN(1, COUNTA(範囲)))` を 5 セル
2. その PF のアプリ/サイトで 1 件ずつフォロー (+ 最近の投稿に いいね 1)
3. フォローしたら、このファイルの該当行を ☐ → ☑ に変更
4. 「## 進捗ログ」に日付と件数をメモ
5. 上限に達したら終了。翌日また再開。

---

## 4. 優先順位 (follow back 率 × 拡散力)

1. **動物園・水族館系** — エンタメ強、相互フォロー文化あり、最優先
2. **個人クリエイター** (医師・教育・サイエンスコミュニケーター) — 同ジャンル follow back 期待
3. **大学公式** — 同業 follow back ありえる
4. **学会・研究機関・科学館** — follow back 少ないが拡散インフラ
5. **美容クリニック系** — 相性悪い、優先度最低 (やらなくてよい)

---

## 5. アカウントリスト (チェックボックス = 進捗)

### 🟪 Instagram

#### 動物園・水族館 (最優先)
- [ ] `@asahiyamazoo1` 旭山動物園 (527k)
- [ ] `@kyoto_aquarium` 京都水族館 (155k)
- [ ] `@kaiyohaku_churaumi` 沖縄美ら海水族館 (122k)
- [ ] `@port_of_nagoya_public_aquarium` 名古屋港水族館 (110k)
- [ ] `@kamogawaseaworld` 鴨川シーワールド (106k)
- [ ] `@sumida_aquarium_` すみだ水族館 (44k)
- [ ] `@nifrel_official` NIFREL
- [ ] `@ueno_zoo_official` 上野動物園

#### 科学博物館・科学館
- [ ] `@kahaku_nmns` 国立科学博物館 (66k)
- [ ] `@miraikan` 日本科学未来館 (26k)
- [ ] `@fukuokacity_sm` 福岡市科学館 (11k)
- [ ] `@osakasciencemuseum` 大阪市立科学館 (7.5k)

#### 医療・看護・教育インフルエンサー
- [ ] `@noe.lecinq` NOE (看護師 539k)
- [ ] `@ishyageinin` 井たくま (ニート医師 401k)
- [ ] `@miorin2018` みおりん (勉強法 65k)
- [ ] `@shinnosuke8739` しんのすけママ (心理×脳 55k)
- [ ] `@msf_japan` 国境なき医師団 (49k)
- [ ] `@nobuko.n.nakano` 中野信子 (脳科学 31k)
- [ ] `@drtaku_official` 畑拓磨 (副院長)
- [ ] `@doctor_nw` 小児科医
- [ ] `@dr.mandheling` YouTube医療大学

#### 科学系 YouTuber
- [ ] `@yobinori` ヨビノリたくみ
- [ ] `@yobinoriyasu` やす (ヨビノリ編集)
- [ ] `@mogimogimogigi` 茂木大輔

#### 科学雑誌
- [ ] `@newton_science` 科学雑誌 Newton
- [ ] `@nikkeiscience` 日経サイエンス

#### 大学公式
- [ ] `@waseda_university` 早稲田大学 (90k)
- [ ] `@sokauniversity` 創価大学 (64k)
- [ ] `@ritsumeikan_university` 立命館大学 (52k)
- [ ] `@aoyamagakuinuniversity` 青山学院大学 (51k)
- [ ] `@uosaka_1931` 大阪大学 (47k)
- [ ] `@utokyo_pr` 東京大学 (45k)
- [ ] `@kyotouniversity.jp` 京都大学 (42k)
- [ ] `@kwanseigakuinuniversity` 関西学院大学 (38k)
- [ ] `@university_of_tsukuba` 筑波大学 (27k)
- [ ] `@tokyo_geidai` 東京芸術大学 (23k)
- [ ] `@osakametuniv` 大阪公立大学 (10k)
- [ ] `@akitainternationaluniversity` 国際教養大学 (9.7k)
- [ ] `@kyoto_geidai` 京都市立芸術大学 (9.1k)

#### 大学 (薬学・看護・医療系)
- [ ] `@iryo_sosei` 医療創生大学
- [ ] `@hoku_iryo` 北海道医療大学
- [ ] `@meijikokusai` 明治国際医療大学
- [ ] `@tokyoiryohoken_univ` 東京医療保健大学
- [ ] `@nihonuniv_pha` 日本大学薬学部
- [ ] `@jhuinsta` 日本医療大学
- [ ] `@ichiyaku_official` 第一薬科大学
- [ ] `@kansaiiryou_university` 関西医療大学
- [ ] `@nims_official_nyushi` 日本医療科学大学
- [ ] `@nichiyaku_official` 日本薬科大学

#### 東大系 学部・研究所
- [ ] `@utokyo.sci` 東大理学部
- [ ] `@utokyo_agri` 東大農学部
- [ ] `@utokyo_medlib` 東大医学図書館
- [ ] `@utokyo_komaba` 東大駒場
- [ ] `@utokyo_isas` 東大生産技術研
- [ ] `@ut.metaschool` 東大メタバース工学部
- [ ] `@glif_lab` 東大 GLIFラボ
- [ ] `@kamiokaobs_pr` 東大カミオカ観測所
- [ ] `@fish_dictionary_aori` 東大大気海洋研 魚図鑑
- [ ] `@ut_psr` 東大政策研究
- [ ] `@utokyo_globe` 東大 GlobE
- [ ] `@utokyo_guc` 東大 GUC
- [ ] `@tokyocollege` 東大 Tokyo College
- [ ] `@utokyo_gsfs` 東大新領域
- [ ] `@bg_utokyo` 東大附属植物園

#### 研究室公式
- [ ] `@nubs_zos` 日本大学 動物学科

#### (優先度最低) 美容クリニック
- [ ] `@femmyclinic` フェミークリニック (13k)
- [ ] `@shironoclinicofficial` シロノクリニック (9.2k)
- [ ] `@jiyugaokaclinic` 自由が丘クリニック (8.9k)
- [ ] `@luxclinic_official` ルクスクリニック

---

### 🟫 Threads

> Threads は IG handle 共用が基本。アプリで handle 検索 → 存在すればフォロー。

#### 確認済アクティブ
- [ ] `@kahaku_nmns` 国立科学博物館
- [ ] `@miraikan` 日本科学未来館
- [ ] `@nobuko.n.nakano` 中野信子
- [ ] `@newton_science` 科学雑誌 Newton
- [ ] `@nikkeiscience` 日経サイエンス

#### IG handle で要検索 (動物園・水族館 本命)
- [ ] `@asahiyamazoo1` 旭山動物園
- [ ] `@kyoto_aquarium` 京都水族館
- [ ] `@kaiyohaku_churaumi` 沖縄美ら海水族館
- [ ] `@port_of_nagoya_public_aquarium` 名古屋港水族館
- [ ] `@kamogawaseaworld` 鴨川シーワールド
- [ ] `@sumida_aquarium_` すみだ水族館
- [ ] `@nifrel_official` NIFREL
- [ ] `@ueno_zoo_official` 上野動物園
- [ ] `@fukuokacity_sm` 福岡市科学館
- [ ] `@osakasciencemuseum` 大阪市立科学館

#### IG handle で要検索 (大学・インフルエンサー)
- [ ] `@waseda_university` 早稲田大学
- [ ] `@kyotouniversity.jp` 京都大学
- [ ] `@utokyo_pr` 東京大学
- [ ] `@uosaka_1931` 大阪大学
- [ ] `@sokauniversity` 創価大学
- [ ] `@ritsumeikan_university` 立命館大学
- [ ] `@ishyageinin` 井たくま医師
- [ ] `@miorin2018` みおりん
- [ ] `@shinnosuke8739` しんのすけママ
- [ ] `@drtaku_official` 畑拓磨
- [ ] `@yobinori` ヨビノリたくみ
- [ ] `@yobinoriyasu` やす
- [ ] `@noe.lecinq` NOE (看護師)

---

### 🟦 Facebook (Page → Page いいね or フォロー)

#### 主要機関
- [ ] `facebook.com/Kyoto.Univ` 京都大学
- [ ] `facebook.com/sciencetokyo.official.ja` 東京科学大学
- [ ] `facebook.com/miraikan.jp` 日本科学未来館 (32k)
- [ ] `facebook.com/nims.jp` NIMS (物質・材料研究機構)

#### 出版社・学会
- [ ] `facebook.com/kodanshablue` 講談社ブルーバックス
- [ ] `facebook.com/NewtonScience` 科学雑誌 Newton
- [ ] `facebook.com/JapanesePsychologicalAssociation` 日本心理学会
- [ ] `facebook.com/JSPNKOUHOU` 日本精神神経学会

#### 東大系 (40ページ)
- [ ] `facebook.com/UTokyo.News` 東大ニュース
- [ ] `facebook.com/UTokyo.News.en` 東大ニュース英語
- [ ] `facebook.com/UTokyodanjo` 東大男女共同参画
- [ ] `facebook.com/UTokyo.foundation` 東大基金
- [ ] `facebook.com/UTokyo.sports` 東大スポーツ
- [ ] `facebook.com/UTokyo.Alumni` 東大同窓会
- [ ] `facebook.com/UTokyo.Eng` 東大工学部
- [ ] `facebook.com/UTokyo.sci` 東大理学部
- [ ] `facebook.com/UTokyo.SVAP` 東大社会連携
- [ ] `facebook.com/UTokyo_Agri` 東大農学部
- [ ] `facebook.com/UTokyoVMC` 東大動物医療
- [ ] `facebook.com/jugeiken` 東大演習林
- [ ] `facebook.com/Todai.Pharm` 東大薬学部
- [ ] `facebook.com/UTokyoMD` 東大医学部
- [ ] `facebook.com/UTokyo.gsfs` 東大新領域
- [ ] `facebook.com/sccutecon` 東大経済学部
- [ ] `facebook.com/UTokyo.Komaba.J` 東大駒場 (日)
- [ ] `facebook.com/UTokyo.Komaba.E` 東大駒場 (英)
- [ ] `facebook.com/GlobalKomaba` 東大グローバル駒場
- [ ] `facebook.com/UTPSV` 東大駒場系
- [ ] `facebook.com/tobunken` 東大東洋文化研究所
- [ ] `facebook.com/UTokyo.aori` 東大大気海洋研
- [ ] `facebook.com/UTokyo.aori.en` 同 英語
- [ ] `facebook.com/UTokyo.Rcast` 東大先端研
- [ ] `facebook.com/UTokyo.Rcast.en` 同 英語
- [ ] `facebook.com/todai.tv` 東大 TV
- [ ] `facebook.com/UTokyoOpenCourseWare` 東大 OCW
- [ ] `facebook.com/TodaiFFP` 東大教育プログラム
- [ ] `facebook.com/interactiveteaching.jp` 東大教育
- [ ] `facebook.com/KavliIpmu` 東大 Kavli IPMU
- [ ] `facebook.com/University.of.Tokyo.IRCN` 東大 IRCN (脳科学)
- [ ] `facebook.com/UTokyo.IFI` 東大 IFI
- [ ] `facebook.com/UTokyo.ITC` 東大 情報技術
- [ ] `facebook.com/CSISut` 東大 空間情報科学
- [ ] `facebook.com/HMC.UTokyo` 東大 ヒューマニティーズ
- [ ] `facebook.com/UTokyo.CRIIM` 東大 次世代医学
- [ ] `facebook.com/phisem.ut` 東大 哲学
- [ ] `facebook.com/UTokyo.emerg` 東大 救急
- [ ] `facebook.com/UTokyo.tokyo.forum` 東大 Tokyo Forum
- [ ] `facebook.com/utokyo.guc` 東大 GUC

---

### 🟦 X (Twitter)

#### 個人科学者・大物
- [ ] `@kenichiromogi` 茂木健一郎 (脳科学 147万)

#### 国立研究機関・大型
- [ ] `@JAXA_jp` JAXA
- [ ] `@AIST_JP` 産業技術総合研究所
- [ ] `@museum_kahaku` 国立科学博物館
- [ ] `@miraikan` 日本科学未来館
- [ ] `@scienceagora` サイエンスアゴラ

#### 学会
- [ ] `@jpa_psych` 日本心理学会
- [ ] `@jnsorg` 日本神経科学学会

#### 科学雑誌・メディア
- [ ] `@newton_science` Newton
- [ ] `@nikkeiscience` 日経サイエンス
- [ ] `@NatGeoMagJP` ナショジオ日本版
- [ ] `@natgeokids_jp` NatGeo Kids JP
- [ ] `@NNGBook` 日経ナショジオ書籍部
- [ ] `@bluebacks_pub` 講談社ブルーバックス

#### TV番組
- [ ] `@nhk_sciencezero` NHK サイエンスZERO
- [ ] `@nhk_space` NHK コズミックフロント

#### 動物園・水族館
- [ ] `@UenoZooGardens` 上野動物園
- [ ] `@asahiyamazoo1` 旭山動物園
- [ ] `@kamoseaofficial` 鴨川シーワールド
- [ ] `@kaiyohakukoen` 沖縄美ら海水族館
- [ ] `@fukuokacity_sm` 福岡市科学館

#### 教育・コミュニケーター
- [ ] `@Yobinori` ヨビノリたくみ
- [ ] `@yasu_yobinori` やす (ヨビノリ編集)
- [ ] `@mogimogimogigi` 茂木大輔
- [ ] `@uja_info` United Japanese Researchers Abroad

#### 東大系 X (主要 — 必要なら追加)
- [ ] `@UTokyo_News` 東大ニュース
- [ ] `@UTokyo_News_en` 東大ニュース英語
- [ ] `@UTokyo_Science` 東大理学部
- [ ] `@UTokyo_Agri` 東大農学部
- [ ] `@eng_univ_tokyo` 東大工学部
- [ ] `@eps_utokyo` 東大地球惑星科学
- [ ] `@bg_utokyo` 東大附属植物園
- [ ] `@IRCN_UTokyo` 東大 IRCN (脳科学)
- [ ] `@kavliipmu` 東大 Kavli IPMU
- [ ] `@ICRRpr` 東大宇宙線研究所
- [ ] `@Kamiokaobs_pr` 東大カミオカ
- [ ] `@UTokyo_AORI` 東大大気海洋研究所
- [ ] `@UTokyo_issp` 東大物性研究所
- [ ] `@UTokyo_ICEPP` 東大素粒子物理
> (東大 X はまだ 60+ あり。上記で足りなければ別途リスト参照)

---

## 6. 進捗ログ

> 作業するたびにここに追記。「最後にどこまでやったか」がここを見れば分かる。

| 日付 | PF | フォローした件数 | メモ |
|---|---|---|---|
| 2026-05-23 | (記入例) IG | 5 | 動物園系から開始 |
|  |  |  |  |

---

## 7. 再開時のチェックリスト

新しいセッションでこのファイルを渡されたら:
1. この「## 7」と「## 6 進捗ログ」をまず読む
2. 「## 5 アカウントリスト」で ☐ が残ってる PF / カテゴリを確認
3. 「## 2 制約」の 1日上限を厳守
4. 優先順位 (## 4) に沿って ☐ から選ぶ
5. フォローしたら ☑ に変えて、進捗ログに追記
