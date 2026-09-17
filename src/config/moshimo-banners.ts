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

  // ==================== 追加 15 個 (2026-09-15、rotation 33 個化 — audience-fit 全部) ====================
  {
    id: 'banner-techgym',
    label: 'テックジム 教材一括 (548x150) 成果 ¥55,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800874&p_id=2826&pc_id=6435&pl_id=71611" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/2083/000000071611.png" width="548" height="150" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="テックジム プログラミング教材"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800874&p_id=2826&pc_id=6435&pl_id=71611" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-programminghacks',
    label: 'ProgrammingHacks (300x250) 成果 ¥10,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800904&p_id=2402&pc_id=5229&pl_id=31548" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/1888/000000031548.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="ProgrammingHacks プログラミング学習"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800904&p_id=2402&pc_id=5229&pl_id=31548" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-digihari',
    label: 'デジハリ・オンラインスクール (300x250) 成果 ¥10,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800969&p_id=3193&pc_id=7476&pl_id=76824" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/2262/000000076824.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="デジハリ・オンラインスクール"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800969&p_id=3193&pc_id=7476&pl_id=76824" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-datascience-bootcamp',
    label: 'データサイエンスブートキャンプ (336x280) 成果 ¥1,000-50,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800946&p_id=5289&pc_id=14386&pl_id=70164" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/4919/000000070164.jpg" width="336" height="280" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="データサイエンスブートキャンプ"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800946&p_id=5289&pc_id=14386&pl_id=70164" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-shift-teras',
    label: 'SHIFT TERAS CAMPUS (300x250) 成果 ¥1,000-25,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800981&p_id=1363&pc_id=2297&pl_id=83717" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/0323/000000083717.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="SHIFT TERAS CAMPUS プログラミングスクール"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800981&p_id=1363&pc_id=2297&pl_id=83717" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-tech-stadium',
    label: 'TECH STADIUM (ゲーム・CG、300x250) 成果 ¥2,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800970&p_id=2857&pc_id=6532&pl_id=95477" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/2264/000000095477.jpg" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="TECH STADIUM ゲーム・CG制作"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800970&p_id=2857&pc_id=6532&pl_id=95477" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-kfranc',
    label: 'K-Franc 韓国語 (468x60) 成果 ¥4,000',
    category: 'education',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800878&p_id=5308&pc_id=14476&pl_id=69437" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/4935/000000069437.jpg" width="468" height="60" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="K-Franc 韓国語教室"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800878&p_id=5308&pc_id=14476&pl_id=69437" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-mba-laundering',
    label: 'MBAロンダリング (300x250) 成果 ¥20,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5804478&p_id=7079&pc_id=20253&pl_id=89536" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/6861/000000089536.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="MBAロンダリング"></a><img src="//i.moshimo.com/af/i/impression?a_id=5804478&p_id=7079&pc_id=20253&pl_id=89536" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-conoha-vps',
    label: 'ConoHa VPS (300x250) 成果 ¥880',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800873&p_id=2540&pc_id=5631&pl_id=61326" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/1762/000000061326.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="ConoHa VPS"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800873&p_id=2540&pc_id=5631&pl_id=61326" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-onamae-server',
    label: 'お名前.com レンタルサーバー (468x60) 成果 ¥3,000-5,000',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800991&p_id=110&pc_id=110&pl_id=2539" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/0045/000000002539.gif" width="468" height="60" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="お名前.com レンタルサーバー"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800991&p_id=110&pc_id=110&pl_id=2539" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-little-server',
    label: 'リトルサーバー (300x250) 成果 ¥100-2,500',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800871&p_id=2106&pc_id=4344&pl_id=28675" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/1490/000000028675.gif" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="リトルサーバー"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800871&p_id=2106&pc_id=4344&pl_id=28675" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-lolipop',
    label: 'ロリポップ (300x250) 成果 ¥100-10,000',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800992&p_id=16&pc_id=16&pl_id=30623" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/0003/000000030623.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="ロリポップ レンタルサーバー"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800992&p_id=16&pc_id=16&pl_id=30623" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-peraichi',
    label: 'ペライチ HP作成 (300x250) 成果 ¥2,000-10,000',
    category: 'dev',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800979&p_id=1989&pc_id=3992&pl_id=76881" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/1360/000000076881.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="ペライチ HP作成"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800979&p_id=1989&pc_id=3992&pl_id=76881" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-ai-blogkun-gold',
    label: 'AIブログくんGOLD (300x250) 成果 ¥1,980+',
    category: 'ai-tools',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5804429&p_id=7624&pc_id=22031&pl_id=95169" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/5289/000000095169.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="AIブログくんGOLD"></a><img src="//i.moshimo.com/af/i/impression?a_id=5804429&p_id=7624&pc_id=22031&pl_id=95169" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },
  {
    id: 'banner-rin',
    label: 'Rin AIコーチ (テキストリンク) 成果 ¥500-1,000',
    category: 'ai-tools',
    html: '<div style="max-width:300px;margin:0 auto;padding:20px 16px;background:linear-gradient(135deg,#f5f0ff 0%,#fdf4ff 100%);border:1px solid #d8b4fe;border-radius:10px;text-align:center;"><p style="margin:0 0 10px;font-size:0.75rem;color:#7c3aed;font-weight:700;letter-spacing:0.05em;">AI COACH</p><a href="//af.moshimo.com/af/c/click?a_id=5804427&p_id=7637&pc_id=22086&pl_id=95318" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank" style="display:block;color:#5b21b6;font-weight:700;text-decoration:none;font-size:0.95rem;line-height:1.5;">あなた専用に育つAIコーチ「Rin」<br><span style="font-size:0.82rem;font-weight:500;color:#6d28d9;">強み×毎日のジャーナルで内省が続く<br>(初回30日無料)</span></a></div><img src="//i.moshimo.com/af/i/impression?a_id=5804427&p_id=7637&pc_id=22086&pl_id=95318" width="1" height="1" style="border:none;" loading="lazy" alt="">',
  },

  // ==================== 追加 5 個 (2026-09-17、rotation 38 個化 — career 系厚み増強) ====================
  // audience = 大学生 + 研究者 の 洞察に基づき type転職 / フリコン / 転職ナビ を投入
  {
    id: 'banner-type-tenshoku',
    label: 'type転職エージェント (600x600) 成果 ¥11,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5804433&p_id=7540&pc_id=21772&pl_id=94548" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/6249/000000094548.jpg" width="600" height="600" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="type転職エージェント"></a><img src="//i.moshimo.com/af/i/impression?a_id=5804433&p_id=7540&pc_id=21772&pl_id=94548" width="1" height="1" style="border:none;" alt="">',
  },
  {
    id: 'banner-type-woman',
    label: 'type女性の転職エージェント (600x600) 成果 ¥11,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5804434&p_id=7541&pc_id=21774&pl_id=94550" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/6249/000000094550.jpg" width="600" height="600" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="type女性の転職エージェント"></a><img src="//i.moshimo.com/af/i/impression?a_id=5804434&p_id=7541&pc_id=21774&pl_id=94550" width="1" height="1" style="border:none;" alt="">',
  },
  {
    id: 'banner-furicon',
    label: 'フリコン フリーランスIT案件 (640x320) 成果 ¥30,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800933&p_id=3841&pc_id=9491&pl_id=57708" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/3294/000000057708.png" width="640" height="320" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="フリコン フリーランスIT案件"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800933&p_id=3841&pc_id=9491&pl_id=57708" width="1" height="1" style="border:none;" alt="">',
  },
  {
    id: 'banner-tenshoku-agent-navi',
    label: '転職エージェントナビ (1080x1080) 成果 ¥8,000',
    category: 'career',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800943&p_id=5537&pc_id=15176&pl_id=71461" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/5218/000000071461.png" width="1080" height="1080" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="転職エージェントナビ"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800943&p_id=5537&pc_id=15176&pl_id=71461" width="1" height="1" style="border:none;" alt="">',
  },
  {
    id: 'banner-hatena-blog-pro',
    label: 'はてなブログ Pro (300x250) 成果 ¥300-1,200',
    category: 'other',
    html: '<a href="//af.moshimo.com/af/c/click?a_id=5800978&p_id=2017&pc_id=4094&pl_id=91504" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade" target="_blank"><img src="//image.moshimo.com/af-img/1396/000000091504.png" width="300" height="250" style="border:none;max-width:100%;height:auto;display:block;margin:0 auto;" alt="はてなブログ Pro"></a><img src="//i.moshimo.com/af/i/impression?a_id=5800978&p_id=2017&pc_id=4094&pl_id=91504" width="1" height="1" style="border:none;" alt="">',
  },
];
