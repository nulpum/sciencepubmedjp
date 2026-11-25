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

export type CareerVariant = 'nurse' | 'doctor' | 'pharmacist' | 'researcher' | 'general';

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
}

export const CAREER_CTAS: Record<CareerVariant, CareerCTA> = {
  nurse: {
    id: 'nurse-v1',
    variant: 'nurse',
    title: '🏥 看護師の転職を無料でサポート',
    description:
      '看護系の論文解説を読んでいる あなたへ。マイナビ看護師 / ナース人材バンクなら、非公開求人多数・専任キャリアアドバイザーが無料でサポート。',
    bullets: [
      '登録・利用すべて無料',
      '夜勤なし / 日勤のみ 等 の 条件別検索',
      'LINE で 気軽に相談 OK',
    ],
    ctaLabel: '無料で求人を見てみる →',
    url: '#placeholder-asp-url', // TODO: ASP 審査通過後に実URL差し替え
    provider: 'マイナビ看護師 等 (審査中)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: true,
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
    title: '🔬 研究職・ポスドクの キャリア相談',
    description:
      'アカデミア or 企業研究職 を 迷っている あなたへ。バイオ / 製薬 / ヘルスケア 分野 の ハイクラス求人 を 専任コンサル が 無料紹介。',
    bullets: [
      '完全無料・在職中 OK',
      '製薬・バイオベンチャー の 非公開求人',
      '海外留学後 の 帰国 キャリア 相談',
    ],
    ctaLabel: '研究職の求人を見てみる →',
    url: '#placeholder-asp-url',
    provider: 'JAC Recruitment 等 (審査中)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: true,
  },
  general: {
    id: 'general-v1',
    variant: 'general',
    title: '🎓 大学生・院生 の キャリア相談',
    description:
      '研究室生活 と 就活 の 両立 に 悩む あなたへ。大学生専門のキャリアサービスで、理系学生に合った企業と無料で面談。',
    bullets: [
      '登録無料・LINE 相談 OK',
      '理系学生 特化 の 求人 多数',
      'ES / 面接対策 も 無料',
    ],
    ctaLabel: '大学生の無料キャリア相談 →',
    url: '#placeholder-asp-url',
    provider: '大学生協 提携 ASP 等 (審査中)',
    disclosureShort: '#PR / アフィリエイトリンク',
    placeholder: true,
  },
};

/**
 * 記事 slug / カテゴリ / タグ から 最適 な variant を 選ぶ。
 * 現状 は tag ベース ヒューリスティック。 ASP 導入後 に a/b test で 調整。
 */
export function pickCareerVariant(opts: {
  category?: string;
  tags?: string[];
  slug?: string;
  lang?: 'ja' | 'en';
}): CareerVariant | null {
  // EN 記事 は 当面 対象 外 (日本 ASP ばかり)
  if (opts.lang === 'en') return null;

  const haystack = [
    opts.slug || '',
    ...(opts.tags || []),
  ].join(' ').toLowerCase();

  // 高単価 順 で マッチング
  if (/\b(doctor|physician|医師|医療従事者|clinical)\b/i.test(haystack)) return 'doctor';
  if (/\b(nurse|nursing|看護)\b/i.test(haystack)) return 'nurse';
  if (/\b(pharmac|薬剤|drug|medication)\b/i.test(haystack)) return 'pharmacist';
  if (/\b(research|phd|postdoc|biology|biotechn|genomics|研究)\b/i.test(haystack)) return 'researcher';

  // カテゴリ fallback
  if (opts.category === 'biology') return 'researcher';
  if (opts.category === 'psychology') return 'general';

  return 'general';
}
