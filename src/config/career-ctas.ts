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
    url: '#placeholder-asp-url',
    provider: 'スタディサプリENGLISH ビジネス英語 (A8.net 経由)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: true,
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
