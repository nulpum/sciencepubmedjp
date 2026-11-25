// career / 転職系 ASP の CTA カタログ。
//
// 運用方針:
//   - url が PLACEHOLDER の 間 は 見た目 だけ レンダリング、 href は `#` で click ゼロ
//   - 実 URL が 入った 段階 で placeholder = false に して 本番 配信
//   - 読者層 memory (大学生+研究者、看護・薬学系学生) に 合わせた variant 設計
//
// ASP 候補 (単価 高 順):
//   - 医師転職ドットコム / リクルートドクターズキャリア: 医師 転職 (¥50,000-100,000/件)
//   - JAC Recruitment: 研究職 ハイクラス (¥30,000-50,000/件)
//   - マイナビ看護師 / ナース人材バンク: 看護師 転職 (¥10,000-30,000/件)
//   - リクナビ 薬剤師 / ファル・メイト: 薬剤師 (¥10,000-20,000/件)
//   - リクルートエージェント: ジェネラル 大学生 (¥3,000-10,000/件)

export type CareerVariant = 'nurse' | 'doctor' | 'pharmacist' | 'researcher' | 'general' | 'english_learning';

export interface CareerCTA {
  id: string;
  variant: CareerVariant;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  url: string;
  provider: string;
  disclosureShort: string;
  placeholder: boolean;
  alternatives?: Array<{
    url: string;
    provider: string;
    title?: string;
    description?: string;
    bullets?: string[];
    ctaLabel?: string;
  }>;
}

export const CAREER_CTAS: Record<CareerVariant, CareerCTA> = {
  nurse: {
    id: 'nurse-v1',
    variant: 'nurse',
    title: '🏥 看護師の求人・転職をサポート',
    description:
      '看護系の論文解説を読んでいるあなたへ。MCナースネットなら登録無料で、常勤・派遣・単発バイトまで幅広い看護師求人をプロが紹介。在学中の情報収集にも。',
    bullets: [
      '登録・利用すべて無料',
      '常勤 / 派遣 / 単発バイト を 一括検索',
      '在学中の 情報収集 OK',
    ],
    ctaLabel: '無料で看護師求人を見てみる →',
    url: 'https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3789847&pid=892757780',
    provider: 'MCナースネット (バリューコマース経由)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: false,
    alternatives: [
      {
        url: 'https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3789847&pid=892757782',
        provider: 'スーパーナース 長期派遣 (バリューコマース経由)',
        title: '🏥 看護師の長期派遣・転職をサポート',
        description:
          '在学中の実習や卒後のキャリア形成を見据えて。スーパーナースの長期派遣なら、希望条件で働きたい病院を選びながら実務経験を積める。',
        ctaLabel: '無料で派遣求人を見てみる →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5804434&p_id=7541&pc_id=21774&pl_id=94512',
        provider: 'type女性の転職エージェント (もしも経由)',
        title: '🌸 女性の転職をサポート (看護学生/若手看護師)',
        description:
          '女性キャリアに特化したtype女性の転職エージェント。看護・医療系からの転職や、両立しやすい職場を探している方の面談を無料サポート。',
        bullets: [
          '登録無料・完全無料利用',
          '女性キャリア支援に特化',
          '面談後の押し売りなし',
        ],
        ctaLabel: '無料で女性向け求人を見てみる →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5910224&p_id=1438&pc_id=2516&pl_id=21535',
        provider: 'アステッキ 医療系資格試験教材 (もしも経由)',
        title: '📚 看護師国家試験・医療系資格の対策教材',
        description:
          '看護師国家試験・看護学生向け eラーニング講座と問題集。在学中の基礎固めから直前対策まで、合格者の学習ノウハウを体系化した教材。',
        bullets: [
          '看護師国家試験 対策 コース充実',
          'eラーニング で スキマ学習',
          '問題集 は 紙 / PDF 両対応',
        ],
        ctaLabel: '国試対策 教材を見てみる →',
      },
    ],
  },
  doctor: {
    id: 'doctor-v1',
    variant: 'doctor',
    title: '🩺 医師の転職・キャリア相談',
    description:
      '若手医師・レジデント・医学部高学年の あなたへ。医師専門のキャリア相談サービス。病院別の生の年収データ・当直回数など非公開情報も。',
    bullets: [
      '完全無料・秘密厳守',
      '専門医取得後のキャリアパス相談',
      '留学・研究職への切替相談',
    ],
    ctaLabel: '医師専門のキャリア相談 →',
    url: '#placeholder-asp-url',
    provider: '医師転職ドットコム 等 (審査中)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: true,
  },
  pharmacist: {
    id: 'pharmacist-v1',
    variant: 'pharmacist',
    title: '💊 薬剤師の転職・調剤/病院/製薬',
    description:
      '薬学系の論文を読んでいる あなたへ。調剤・病院・ドラッグストア・製薬企業まで、薬剤師専門の求人サービス。',
    bullets: [
      '登録無料・在職中の相談 OK',
      '製薬企業 MR / DI 職の求人多数',
      '転職後の年収アップ 実績 平均 +60万円',
    ],
    ctaLabel: '薬剤師求人を無料で見る →',
    url: '#placeholder-asp-url',
    provider: 'リクナビ薬剤師 等 (審査中)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: true,
  },
  researcher: {
    id: 'researcher-v1',
    variant: 'researcher',
    title: '🔬 研究・若手ハイキャリア向け スカウト転職',
    description:
      'バイオ・医療・研究・技術分野の20-30代向けスカウト型転職サービス。匿名プロフィール登録だけで企業からスカウトが届く。',
    bullets: [
      '登録・利用すべて無料',
      '匿名プロフィールで現職にバレない',
      '研究から事業側へのキャリアチェンジ相談可',
    ],
    ctaLabel: '無料でスカウトを受けてみる →',
    url: 'https://af.moshimo.com/af/c/click?a_id=5909684&p_id=7790&pc_id=22577&pl_id=96954',
    provider: 'REFLAME (もしもアフィリエイト経由)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: false,
    alternatives: [
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5804478&p_id=7079&pc_id=20253&pl_id=89363',
        provider: 'MBAロンダリング (もしも経由)',
        title: '🎓 国内MBA・MOT の 合格支援 (大学院卒向け)',
        description:
          '研究職・ポスドク・大学院卒の あなたへ。アカデミア から ビジネス へ の キャリア転換 を 国内MBA・MOT で 実現 する ための 合格 支援 サービス。',
        bullets: [
          '無料 相談 OK',
          '主要 国内MBA の 合格実績 多数',
          '仕事 と の 両立 に 配慮 した スケジュール',
        ],
        ctaLabel: '無料でMBA相談を予約する →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5800877&p_id=3953&pc_id=9863&pl_id=54677',
        provider: 'スタアカ スタビジアカデミー (もしも経由)',
        title: '🤖 データサイエンス・AI を 体系学習 (研究者向け)',
        description:
          'バイオインフォ・ゲノミクス・統計解析 に 興味 の ある 研究職・大学院生 の あなたへ。 スタアカ の 有料プラン なら、 統計・機械学習・Python を 体系的 に 学べる。',
        bullets: [
          '動画 + 演習 で 実装 力 を 身につける',
          'Kaggle / 論文 への 応用 事例 多数',
          '研究 → データサイエンティスト 転身 の 定番',
        ],
        ctaLabel: '有料プランを詳しく見る →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5909951&p_id=5152&pc_id=13967&pl_id=67654',
        provider: '学会ポスタードットコム (もしも経由)',
        title: '📊 学会ポスター の オンライン 印刷・発注',
        description:
          '学会発表 を 控える 研究者・大学院生 の あなたへ。 学会ポスタードットコム なら、 データ入稿 から 当日配送 まで ワンストップ。 修正 校正 サービス も あり。',
        bullets: [
          '最短 翌日 配送 OK',
          '学会 ポスター の 定型 サイズ 対応',
          'PDF / PowerPoint から 直接入稿',
        ],
        ctaLabel: '学会ポスターの料金を見る →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5800904&p_id=2402&pc_id=5229&pl_id=31556',
        provider: 'ProgrammingHacks (もしも経由)',
        title: '💻 プログラミング 独学 (研究室 → IT 転身 候補)',
        description:
          '研究室 の 解析 作業 を 自動化 したい、 または アカデミア から IT 系 に 転身 を 考えて いる 方 向け の オンライン プログラミング スクール。',
        bullets: [
          '動画講座 で 自分 の ペース で 学習',
          'Python / Web / 自動化 等 幅広い コース',
          '一括 買取 型 で 月額 不要',
        ],
        ctaLabel: '講座の詳細を見る →',
      },
    ],
  },
  general: {
    id: 'general-v1',
    variant: 'general',
    title: '🎓 20代・若手向け 転職エージェント',
    description:
      '20代・第二新卒中心の転職エージェント。大学院卒業後の就職、研究室からの離脱、専攻外へのキャリアチェンジを考えている方向け。',
    bullets: [
      '登録無料・在職中 OK',
      '20代の転職支援実績豊富',
      '希望業界の内情をプロに相談',
    ],
    ctaLabel: '無料で転職相談を始める →',
    url: 'https://af.moshimo.com/af/c/click?a_id=5804433&p_id=7540&pc_id=21772&pl_id=94510',
    provider: 'type転職エージェント (もしもアフィリエイト経由)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: false,
    alternatives: [
      {
        url: 'https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3789847&pid=892757784',
        provider: 'ユメキャリ 就職エージェント (バリューコマース経由)',
        title: '🎓 28卒 新卒・院卒 向け 就活エージェント',
        description:
          '28卒 (大学4年・修士2年) のあなたへ。年内内定を目指す新卒特化の無料エージェント。研究室と就活の両立をプロがサポート。',
        bullets: [
          '登録無料・完全無料利用',
          '28卒向けの選考ルート多数',
          'ES・面接対策を個別サポート',
        ],
        ctaLabel: '28卒向け内定相談を始める →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5804453&p_id=7309&pc_id=21003&pl_id=92066',
        provider: 'ビーシャイン 20代 就職転職 (もしも経由)',
        title: '✨ 20代 特化 の 就職・転職 支援 サービス',
        description:
          '20代 前半 の 新卒 / 第二新卒 / 既卒 の あなたへ。 ビーシャイン なら 面談 だけで ¥20,000 相当 の キャリア相談 が 無料。 学歴・職歴 に 自信 が なくても 大丈夫。',
        bullets: [
          '20代 の 支援 実績 多数',
          '面談 だけで OK、 押し売り なし',
          '完全 無料 利用',
        ],
        ctaLabel: '20代 向け 無料 相談 を 予約 →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5800934&p_id=5676&pc_id=15670&pl_id=76515',
        provider: 'ミラキャリ 20代 事務職転職 (もしも経由)',
        title: '💼 20代 未経験 からの 事務職 転職',
        description:
          '研究室 を 離れて 事務 系 の 安定 職 へ 転職 したい 20代 の あなたへ。 ミラキャリ は 未経験 OK の 事務職 求人 に 特化。',
        bullets: [
          '未経験 OK の 事務求人 多数',
          '書類 選考 の 通過率 高め',
          '12月中旬 まで 報酬 アップ キャンペーン',
        ],
        ctaLabel: '事務職の求人を見てみる →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5909793&p_id=6615&pc_id=18829&pl_id=84438',
        provider: 'OwenCareer 応援キャリア (もしも経由)',
        title: '🤝 20代 向け 応援型 キャリア相談',
        description:
          '何から 始めれば いいか 分から ない 20代 の あなたへ。 OwenCareer の 応援型 コーチング で 自分 に 合う キャリア を 一緒 に 見つける。',
        bullets: [
          '無料 相談 OK',
          'コーチング 型 で じっくり 伴走',
          'LINE で も 相談 可能',
        ],
        ctaLabel: '無料相談を始める →',
      },
    ],
  },
  english_learning: {
    id: 'english-learning-v1',
    variant: 'english_learning',
    title: '📘 英語論文を読む力を鍛える',
    description:
      'PubMed論文の英語がスラスラ読めるようになりたい方へ。スタディサプリENGLISHビジネス英語コースなら、科学論文・ビジネスメール両対応の実践英語を短期間で習得。',
    bullets: [
      '7日間無料体験 (期間内キャンセル無料)',
      'スマホ1日5分から継続可',
      'TOEIC スコア 平均 +100点 の 実績',
    ],
    ctaLabel: '7日間無料で試してみる →',
    url: 'https://px.a8.net/svt/ejp?a8mat=4BGTLQ+16V8C2+3AQG+TRVYQ',
    provider: 'スタディサプリENGLISH ビジネス英語 (A8.net 経由)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: false,
    alternatives: [
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5800909&p_id=5144&pc_id=13942&pl_id=67594',
        provider: 'egnite ビジネス英語 コーチング (もしも経由)',
        title: '📘 ビジネス英語 の マンツーマン コーチング',
        description:
          'PubMed 論文 を 読める、 書ける、 話せる へ 。 egnite の ビジネス英語 コーチング なら、 短期 で 実務 で 使える 英語 力 を 身につけられる。',
        bullets: [
          'マンツーマン 伴走 型',
          '論文 / プレゼン / メール 対応',
          '成果 コミット 型 の プログラム',
        ],
        ctaLabel: '有料プログラムを詳しく見る →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5909867&p_id=6176&pc_id=17367&pl_id=79710',
        provider: 'テック英語 TOEIC専門コーチング (もしも経由)',
        title: '📈 TOEIC スコア を 伸ばす 専門 コーチング',
        description:
          '大学院 試験 / 就活 / 留学 で TOEIC スコア が 必要 な 方へ。 無料体験 コーチング で 自分 の 弱点 を 可視化。',
        bullets: [
          '無料 体験 コーチング 実施 中',
          'スコア UP の 目標 設計 を 支援',
          '短期集中 プログラム',
        ],
        ctaLabel: '無料体験コーチングを予約 →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5910161&p_id=2928&pc_id=6732&pl_id=96401',
        provider: 'HLCA 医療英語 オンラインスクール (もしも経由)',
        title: '🩺 医療 現場 で 使える 英語 を 学ぶ (HLCA)',
        description:
          '医療職・医学生・看護学生 の ための 医療英語 専門 オンライン スクール。 患者 説明・論文 読解・海外学会 まで 幅広く カバー。',
        bullets: [
          '医療 現場 直結 の カリキュラム',
          '無料 カウンセリング あり',
          '現役 医療通訳者 が 講師',
        ],
        ctaLabel: '無料カウンセリングを予約 →',
      },
      {
        url: 'https://af.moshimo.com/af/c/click?a_id=5909914&p_id=5804&pc_id=16069&pl_id=74490',
        provider: 'SpeakNow 英語コーチング (もしも経由)',
        title: '🗣️ スピーキング 特化 の 英語 コーチング',
        description:
          '論文 は 読める けど 話せない、 国際学会 の 発表 や 質疑 に 不安 が ある 方 向け の スピーキング 特化 コーチング。',
        bullets: [
          '無料 カウンセリング あり',
          'スピーキング に 特化',
          '科学分野 の 専門 英語 にも 対応',
        ],
        ctaLabel: '無料カウンセリングを予約 →',
      },
    ],
  },
};

export function hashSlug(s?: string): number {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * 記事 slug / カテゴリ / タグ から 最適 な variant を 選ぶ。
 * - 特定 マッチ (nurse/doctor/pharmacist) が live な ら 最優先
 * - english_learning が live な ら 約 30% の 記事 で ローテ 挿入
 * - 残り は 研究系 → researcher、 その他 → general で fallback
 * - placeholder 状態 の variant は 選ば ない (本番 非表示 を 回避)
 */
export function pickCareerVariant(opts: {
  category?: string;
  tags?: string[];
  slug?: string;
  lang?: 'ja' | 'en';
}): CareerVariant | null {
  if (opts.lang === 'en') return null;

  const haystack = [
    opts.slug || '',
    ...(opts.tags || []),
  ].join(' ').toLowerCase();
  const isLive = (v: CareerVariant) => !CAREER_CTAS[v].placeholder;
  const slugHash = hashSlug(opts.slug);

  // 1. 特定 マッチ (live な ら 優先)
  if (/(doctor|physician|医師|clinical)/i.test(haystack) && isLive('doctor')) return 'doctor';
  if (/(nurse|nursing|看護)/i.test(haystack) && isLive('nurse')) return 'nurse';
  if (/(pharmac|薬剤|drug|medication)/i.test(haystack) && isLive('pharmacist')) return 'pharmacist';

  // 2. English learning rotation (ja 全体 の 約 30%)
  if (isLive('english_learning') && slugHash % 10 < 3) return 'english_learning';

  // 3. 研究系 → researcher (live な ら)
  if (/(research|phd|postdoc|biology|biotechn|genomics|研究)/i.test(haystack) && isLive('researcher')) return 'researcher';
  if (opts.category === 'biology' && isLive('researcher')) return 'researcher';

  // 4. fallback
  if (isLive('general')) return 'general';
  if (isLive('english_learning')) return 'english_learning';
  return null;
}
