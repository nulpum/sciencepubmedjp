// タグ / トピッククラスタ 定義
// - 記事の title + fact をパターン match して 該当 tag ID を付与する
// - 各 tag は multi-lang label を持つ (URL slug は共通)
//
// 使い方:
//   npm run gen:tags   → 全記事に tags: [...] を追加/更新
//   /ja/tag/adhd/       などで 該当タグの記事一覧を閲覧
//
// タグ設計方針 (2026-09):
// - 検索需要ある固有名詞 (ADHD, HSP, 腸内フローラ 等) を優先
// - 症状・状態 (睡眠, ストレス, うつ 等) で 記事間 回遊を促す
// - 過度に細かい tag は 避ける (30 個前後 が扱いやすい)

export interface TagDef {
  id: string;             // URL slug (英小文字-ハイフン)
  labels: { ja: string; en: string };  // 表示ラベル
  patterns: RegExp[];     // title + fact に対する match 用
  description?: { ja?: string; en?: string };
}

export const TAGS: TagDef[] = [
  // === 心理学系 ===
  {
    id: 'adhd',
    labels: { ja: 'ADHD', en: 'ADHD' },
    patterns: [/ADHD/i, /注意欠陥/i, /注意欠如/i, /多動/i, /attention[ -]?deficit/i],
    description: { ja: '注意欠如・多動症 (ADHD) 関連', en: 'Attention-deficit/hyperactivity disorder' },
  },
  {
    id: 'autism',
    labels: { ja: '自閉症スペクトラム', en: 'Autism' },
    patterns: [/自閉/i, /ASD/, /autis/i, /asperger/i],
  },
  {
    id: 'depression',
    labels: { ja: 'うつ病', en: 'Depression' },
    patterns: [/うつ/, /抑うつ/, /大うつ病/, /depress/i, /MDD/],
  },
  {
    id: 'anxiety',
    labels: { ja: '不安障害', en: 'Anxiety' },
    patterns: [/不安障害/, /不安症/, /不安/, /anxiety/i, /panic/i],
  },
  {
    id: 'ptsd',
    labels: { ja: 'PTSD', en: 'PTSD' },
    patterns: [/PTSD/i, /心的外傷/, /トラウマ/, /post[ -]?traumatic/i, /trauma/i],
  },
  {
    id: 'sleep',
    labels: { ja: '睡眠', en: 'Sleep' },
    patterns: [/睡眠/, /不眠/, /眠り/, /寝/, /sleep/i, /insomnia/i, /circadian/i, /rem/i],
  },
  {
    id: 'memory',
    labels: { ja: '記憶', en: 'Memory' },
    patterns: [/記憶/, /ワーキングメモリ/, /忘却/, /memory/i, /memori/i, /forget/i, /recall/i],
  },
  {
    id: 'learning',
    labels: { ja: '学習', en: 'Learning' },
    patterns: [/学習/, /勉強/, /学び/, /learning/i, /education/i, /study skill/i],
  },
  {
    id: 'stress',
    labels: { ja: 'ストレス', en: 'Stress' },
    patterns: [/ストレス/, /コルチゾール/, /stress/i, /cortisol/i],
  },
  {
    id: 'hsp',
    labels: { ja: 'HSP', en: 'HSP' },
    patterns: [/HSP/i, /繊細/, /感覚処理感受性/, /highly sensitive/i, /sensory processing sensitivity/i],
  },
  {
    id: 'cbt',
    labels: { ja: '認知行動療法', en: 'Cognitive Behavioral Therapy' },
    patterns: [/認知行動療法/, /CBT/, /cognitive behavior/i],
  },
  {
    id: 'meditation',
    labels: { ja: '瞑想・マインドフルネス', en: 'Meditation & Mindfulness' },
    patterns: [/瞑想/, /マインドフルネス/, /meditation/i, /mindfulness/i, /mindful/i],
  },
  {
    id: 'suicide',
    labels: { ja: '自殺予防', en: 'Suicide Prevention' },
    patterns: [/自殺/, /suicid/i, /self[ -]?harm/i],
  },
  {
    id: 'social-anxiety',
    labels: { ja: '社会不安・ひきこもり', en: 'Social Withdrawal' },
    patterns: [/ひきこもり/, /引きこもり/, /hikikomori/i, /social withdrawal/i, /social anxiety/i],
  },

  // === 神経科学系 ===
  {
    id: 'brain',
    labels: { ja: '脳科学', en: 'Brain Science' },
    patterns: [/脳/, /大脳/, /海馬/, /前頭前野/, /brain/i, /neural/i, /neuron/i, /hippocamp/i, /prefrontal/i],
  },
  {
    id: 'dopamine',
    labels: { ja: 'ドーパミン・報酬系', en: 'Dopamine & Reward' },
    patterns: [/ドーパミン/, /報酬系/, /dopamine/i, /reward system/i, /craving/i],
  },
  {
    id: 'circadian',
    labels: { ja: '概日リズム', en: 'Circadian Rhythm' },
    patterns: [/概日/, /サーカディアン/, /circadian/i, /biological clock/i, /body clock/i],
  },

  // === 生物学系 ===
  {
    id: 'gut-microbiome',
    labels: { ja: '腸内フローラ・腸内細菌', en: 'Gut Microbiome' },
    patterns: [/腸内/, /マイクロバイオーム/, /腸活/, /フローラ/, /microbiome/i, /microbiota/i, /gut[ -]?brain/i],
  },
  {
    id: 'immunity',
    labels: { ja: '免疫', en: 'Immunity' },
    patterns: [/免疫/, /炎症/, /immun/i, /inflammation/i, /autoimmune/i],
  },
  {
    id: 'mitochondria',
    labels: { ja: 'ミトコンドリア', en: 'Mitochondria' },
    patterns: [/ミトコンドリア/, /mitochondri/i, /ATP/],
  },
  {
    id: 'genetics',
    labels: { ja: '遺伝子', en: 'Genetics' },
    patterns: [/遺伝子/, /ゲノム/, /DNA/, /RNA/, /gene/i, /genom/i, /epigenet/i],
  },
  {
    id: 'aging',
    labels: { ja: '老化', en: 'Aging' },
    patterns: [/老化/, /長寿/, /抗加齢/, /aging/i, /longevity/i, /senescence/i],
  },
  {
    id: 'probiotics',
    labels: { ja: 'プロバイオティクス', en: 'Probiotics' },
    patterns: [/プロバイオティクス/, /乳酸菌/, /probiotic/i, /prebiotic/i, /lactobacill/i, /bifidobact/i],
  },

  // === 医療・生活習慣系 ===
  {
    id: 'diet-nutrition',
    labels: { ja: '食事・栄養', en: 'Diet & Nutrition' },
    patterns: [/食事/, /栄養/, /食生活/, /nutrition/i, /dietary/i, /macronutrient/i],
  },
  {
    id: 'exercise',
    labels: { ja: '運動', en: 'Exercise' },
    patterns: [/運動/, /トレーニング/, /有酸素/, /筋トレ/, /exercise/i, /physical activity/i, /aerobic/i, /training/i],
  },
  {
    id: 'diabetes',
    labels: { ja: '糖尿病', en: 'Diabetes' },
    patterns: [/糖尿病/, /インスリン/, /血糖/, /diabetes/i, /insulin/i, /glucose/i, /glycemi/i],
  },
  {
    id: 'obesity',
    labels: { ja: '肥満・ダイエット', en: 'Obesity & Weight' },
    patterns: [/肥満/, /減量/, /obes/i, /weight[ -]?loss/i, /BMI/i],
  },
  {
    id: 'glp1',
    labels: { ja: 'GLP-1', en: 'GLP-1' },
    patterns: [/GLP[ -]?1/i, /セマグルチド/, /semaglutide/i, /liraglutide/i, /オゼンピック/i, /ozempic/i],
  },
  {
    id: 'hormones',
    labels: { ja: 'ホルモン・内分泌', en: 'Hormones' },
    patterns: [/ホルモン/, /内分泌/, /エストロゲン/, /テストステロン/, /甲状腺/, /hormone/i, /endocrin/i, /estrogen/i, /testosterone/i, /thyroid/i],
  },
  {
    id: 'women-health',
    labels: { ja: '女性の健康', en: 'Women\u0027s Health' },
    patterns: [/女性/, /月経/, /生理/, /妊娠/, /更年期/, /women/i, /female/i, /menstrua/i, /pregnan/i, /menopause/i],
  },
];

/**
 * 記事の title + fact 文字列から 該当タグ ID を抽出する。
 * どの言語の記事にも 同じロジックで動く (正規表現側で JA/EN を吸収)。
 */
export function extractTagsFor(title: string, fact: string): string[] {
  const haystack = `${title}\n${fact}`;
  const hit: string[] = [];
  for (const t of TAGS) {
    if (t.patterns.some((re) => re.test(haystack))) hit.push(t.id);
  }
  return hit;
}

export function getTag(id: string): TagDef | undefined {
  return TAGS.find((t) => t.id === id);
}
