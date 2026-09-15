// もしもアフィリエイト バナー広告の設定
//
// 各 banner は HTML 文字列 + メタ情報 のペア。
// MoshimoBanner.astro が読み込み、ランダム 1 個表示する。
//
// 追加する場合:
//   1. もしもアフィリエイトで提携先の広告リンク→バナー広告 のHTMLコピー
//   2. 下の BANNERS 配列に entry として追加
//   3. push → 自動的に rotation に加わる
//
// メタ情報:
//   id       - 内部識別 (kebab-case、log/GA 用)
//   label    - 内部用ラベル (ダッシュボードで案件見分ける用)
//   category - 'education' | 'career' | 'dev' | 'other' (将来 placement 別 filter 用、今は未使用)
//   html     - 広告本体の HTML (a + img + impression pixel を含む 1 文字列)

export interface MoshimoBanner {
  id: string;
  label: string;
  category: 'education' | 'career' | 'dev' | 'ai-tools' | 'other';
  html: string;
}

export const MOSHIMO_BANNERS: MoshimoBanner[] = [
  {
    id: 'banner-pl67749',
    label: 'p_id=5144 (1404x180 wide banner)',
    category: 'other',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800909&p_id=5144&pc_id=13942&pl_id=67749" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/4800/000000067749.jpg" width="1404" height="180" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="広告"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800909&p_id=5144&pc_id=13942&pl_id=67749" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-pl71612',
    label: 'p_id=2826 (550x152 medium banner)',
    category: 'other',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800874&p_id=2826&pc_id=6435&pl_id=71612" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/2083/000000071612.png" width="550" height="152" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="広告"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800874&p_id=2826&pc_id=6435&pl_id=71612" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-pl17969',
    label: 'p_id=1166 (300x300 square banner)',
    category: 'other',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800868&p_id=1166&pc_id=1793&pl_id=17969" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/0408/000000017969.png" width="300" height="300" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="広告"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800868&p_id=1166&pc_id=1793&pl_id=17969" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
];
