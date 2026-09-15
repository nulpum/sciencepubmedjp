// もしもアフィリエイト バナー広告の設定
//
// 各 banner は HTML 文字列 + メタ情報 のペア。
// MoshimoBanner.astro が読み込み、ランダム 1 個表示する。
//
// 追加する場合:
//   1. もしもアフィリエイトで提携先の広告リンク→バナー広告 の HTML コピー
//   2. 下の BANNERS 配列に entry として追加
//   3. push → 自動的に rotation に加わる
//
// メタ情報:
//   id       - 内部識別 (kebab-case、log/GA 用)
//   label    - 内部用ラベル (ダッシュボードで案件見分ける用)
//   category - 'education' | 'career' | 'dev' | 'ai-tools' | 'other'
//   html     - 広告本体の HTML (a + img + impression pixel を含む 1 文字列)

export interface MoshimoBanner {
  id: string;
  label: string;
  category: 'education' | 'career' | 'dev' | 'ai-tools' | 'other';
  html: string;
}

export const MOSHIMO_BANNERS: MoshimoBanner[] = [
  // ==================== 初期 3 個 (2026-09-15) ====================
  {
    id: 'banner-pl67749',
    label: 'p_id=5144 (1404x180 wide banner) — Bytech AI 研修',
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

  // ==================== 追加 5 個 (2026-09-15、audience-fit priority) ====================
  {
    id: 'banner-egnite',
    label: 'egnite (英語コーチング、300x250) 成果 ¥10,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800909&p_id=5144&pc_id=13942&pl_id=67748" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/4800/000000067748.jpg" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="egnite 英語コーチング"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800909&p_id=5144&pc_id=13942&pl_id=67748" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-studyacademy',
    label: 'スタアカ (データサイエンス、320x180) 成果 ¥30,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800877&p_id=3953&pc_id=9863&pl_id=54912" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/3471/000000054912.png" width="320" height="180" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="スタアカ データサイエンス"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800877&p_id=3953&pc_id=9863&pl_id=54912" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-daytra',
    label: 'デイトラ (プログラミング等、468x60) 成果 ¥5,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800903&p_id=3554&pc_id=8575&pl_id=51507" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/2965/000000051507.png" width="468" height="60" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="デイトラ プログラミング"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800903&p_id=3554&pc_id=8575&pl_id=51507" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-posiwill',
    label: 'POSIWILL CAREER (キャリア相談、300x250) 成果 ¥8,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800955&p_id=5098&pc_id=13789&pl_id=68099" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/1622/000000068099.jpg" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="POSIWILL CAREER キャリア相談"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800955&p_id=5098&pc_id=13789&pl_id=68099" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-conoha-wing',
    label: 'ConoHa WING (レンタルサーバー、300x250) 成果 ¥5,000',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800872&p_id=2312&pc_id=4967&pl_id=38395" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/1762/000000038395.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="ConoHa WING レンタルサーバー"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800872&p_id=2312&pc_id=4967&pl_id=38395" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },

  // ==================== 追加 10 個 (2026-09-15、rotation 18 個化) ====================
  {
    id: 'banner-pyq',
    label: 'PyQ (Python 学習、300x250) 成果 20% 継続',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800868&p_id=1166&pc_id=1793&pl_id=20228" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/0408/000000020228.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="PyQ Python 学習"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800868&p_id=1166&pc_id=1793&pl_id=20228" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-1ststep',
    label: '1st step (プログラミングスクール、468x60) 成果 ¥1,900',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800964&p_id=3728&pc_id=9129&pl_id=59600" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/3209/000000059600.png" width="468" height="60" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="1st step プログラミング"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800964&p_id=3728&pc_id=9129&pl_id=59600" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-planetalk',
    label: 'Planetalk (外国語会話、300x250) 成果 30%',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800942&p_id=5465&pc_id=14955&pl_id=71455" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/4878/000000071455.jpg" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="Planetalk 外国語会話"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800942&p_id=5465&pc_id=14955&pl_id=71455" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-talkingmarathon',
    label: 'トーキングマラソン (スピーキング英会話、600x600) 成果 ¥410',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5804419&p_id=7717&pc_id=22349&pl_id=96325" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/6249/000000096325.jpg" width="600" height="600" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="トーキングマラソン 英会話"></a><img src="//i.moshimo.com/af/i/impression?a_id=5804419&p_id=7717&pc_id=22349&pl_id=96325" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-sakucareer',
    label: 'サクキャリマッチ (キャリアコーチング、300x250) 成果 ¥5,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5804461&p_id=7239&pc_id=20766&pl_id=91255" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/6719/000000091255.jpg" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="サクキャリマッチ キャリアコーチング"></a><img src="//i.moshimo.com/af/i/impression?a_id=5804461&p_id=7239&pc_id=20766&pl_id=91255" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-wintech',
    label: 'ウインテック留学センター (712x570) 成果 ¥3,230',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800892&p_id=7687&pc_id=22252&pl_id=95903" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/6249/000000095903.png" width="712" height="570" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="ウインテック留学センター"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800892&p_id=7687&pc_id=22252&pl_id=95903" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-ugaku',
    label: 'U-GAKU ニセコ留学 (300x250) 成果 ¥9,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800898&p_id=7364&pc_id=21187&pl_id=92655" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/3982/000000092655.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="U-GAKU ニセコ留学"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800898&p_id=7364&pc_id=21187&pl_id=92655" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-onamae',
    label: 'お名前.com ドメイン (300x250) 成果 5%',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800990&p_id=109&pc_id=109&pl_id=2553" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/0045/000000002553.gif" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="お名前.com ドメイン"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800990&p_id=109&pc_id=109&pl_id=2553" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-shinserver',
    label: 'シンレンタルサーバー (300x250) 成果 ¥3,000-8,000',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800962&p_id=4942&pc_id=13183&pl_id=65513" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/4520/000000065513.gif" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="シンレンタルサーバー"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800962&p_id=4942&pc_id=13183&pl_id=65513" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-rakurin',
    label: 'Rakurin (AI ライティング、300x250) 成果 ¥100-6,000',
    category: 'ai-tools',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800879&p_id=5432&pc_id=14858&pl_id=70498" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/2131/000000070498.jpg" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="Rakurin AI ライティング"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800879&p_id=5432&pc_id=14858&pl_id=70498" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
];
