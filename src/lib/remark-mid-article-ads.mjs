// build 時 に 記事 の H2 見出し の 間 に 広告 を 差し込む remark plugin。
//
// 挿入 ルール:
//   - 記事 の H2 が N 本 あるとき、 2本目 / 4本目 / 6本目 の H2 の 直前 に 広告 を 挿入
//   - 最大 3 広告 /記事
//   - H2 が 4 本 未満 の 記事 は スキップ (短い 記事 に 入れると 詰まる)
//   - 日本語 記事 (/src/content/ja/) のみ 対象
//   - 広告 は 3 種 ローテ: Yahoo!ショッピング (バリューコマース)、 Amazon Prime Student、 Kindle Unlimited JP
//
// 設計:
//   - raw HTML AST ノード (`type: 'html'`) を 挿入、 Astro は そのまま 出力
//   - disclosure (#PR) ラベル 付き
//   - サイト全体 と デザイン 整合 する 控えめ な スタイル (inline style で scoped CSS 不要)

import { visit } from 'unist-util-visit';

const MIN_H2_TO_INSERT = 4;
const INSERT_AT_H2_INDEXES = [2, 4, 6]; // 2本目 / 4本目 / 6本目 の H2 の 直前

function detectLang(filePath) {
  if (!filePath) return null;
  const norm = filePath.replace(/\\/g, '/');
  if (norm.includes('/src/content/ja/')) return 'ja';
  return null;
}

// 広告 3 種 (JA 読者 向け)。 slug hash で 順番 を 少し 変える。
const ADS = {
  yahoo: {
    label: 'Yahoo!ショッピング (バリューコマース)',
    html: `<aside class="inline-ad inline-ad--yahoo" aria-label="Yahoo!ショッピング">
<p class="inline-ad__label">#PR / バリューコマース 経由</p>
<div class="inline-ad__body">
<script src="//ad.jp.ap.valuecommerce.com/servlet/jsbanner?sid=3789847&amp;pid=892757749"></script>
<noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3789847&amp;pid=892757749" rel="sponsored nofollow noopener"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3789847&amp;pid=892757749" border="0" alt="Yahoo!ショッピング" /></a></noscript>
</div>
</aside>`,
  },
  prime_student: {
    label: 'Amazon Prime Student',
    html: `<aside class="inline-ad inline-ad--prime" aria-label="Amazon Prime Student">
<p class="inline-ad__label">#PR / Amazon アソシエイト</p>
<a class="inline-ad__card" href="https://www.amazon.co.jp/amazonprime/student?tag=sciencepubm06-22" rel="sponsored nofollow noopener" target="_blank">
<span class="inline-ad__card-badge">🎓 学生 限定</span>
<span class="inline-ad__card-title">Prime Student 6ヶ月 無料体験</span>
<span class="inline-ad__card-desc">配送無料・ Kindle 本 10%還元・ 教科書 対象・ Amazon Music Prime / Prime Video 見放題</span>
<span class="inline-ad__card-cta">無料で試す →</span>
</a>
</aside>`,
  },
  kindle_unlimited: {
    label: 'Kindle Unlimited JP',
    html: `<aside class="inline-ad inline-ad--ku" aria-label="Kindle Unlimited JP">
<p class="inline-ad__label">#PR / Amazon アソシエイト</p>
<a class="inline-ad__card" href="https://www.amazon.co.jp/kindle-dbs/hz/signup?tag=sciencepubm06-22" rel="sponsored nofollow noopener" target="_blank">
<span class="inline-ad__card-badge">📚 読み放題</span>
<span class="inline-ad__card-title">Kindle Unlimited 30日間 無料</span>
<span class="inline-ad__card-desc">医学・生物学・心理学 の 専門書 / 洋書 / 論文集 200万冊 以上 が 読み放題。 学生 の 文献 調査 に。</span>
<span class="inline-ad__card-cta">30日間 無料で試す →</span>
</a>
</aside>`,
  },
};

function hashStr(s) {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// slug hash で 3 種 の 並び 順 を 選ぶ (記事 ごと に 一貫、 全体 で ばらける)
function pickOrder(slug) {
  const h = hashStr(slug);
  const orders = [
    ['yahoo', 'prime_student', 'kindle_unlimited'],
    ['prime_student', 'kindle_unlimited', 'yahoo'],
    ['kindle_unlimited', 'yahoo', 'prime_student'],
    ['yahoo', 'kindle_unlimited', 'prime_student'],
    ['prime_student', 'yahoo', 'kindle_unlimited'],
    ['kindle_unlimited', 'prime_student', 'yahoo'],
  ];
  return orders[h % orders.length];
}

export function remarkMidArticleAds() {
  return (tree, file) => {
    const lang = detectLang(file?.path || file?.history?.[0]);
    if (lang !== 'ja') return;

    // 1 pass目: H2 の 位置 (parent 配列 内 index) と 総数 を 収集
    const h2Positions = [];
    tree.children.forEach((node, idx) => {
      if (node.type === 'heading' && node.depth === 2) {
        h2Positions.push(idx);
      }
    });
    if (h2Positions.length < MIN_H2_TO_INSERT) return;

    // slug は file.path の basename から
    const slug = (file?.path || '').split(/[/\\]/).pop()?.replace(/\.md$/, '') || '';
    const order = pickOrder(slug);

    // 2 pass目: 挿入 候補 の H2 indexes (後ろ から 入れる = index ズレ なし)
    const insertAt = [];
    for (let i = 0; i < INSERT_AT_H2_INDEXES.length; i++) {
      const h2Idx = INSERT_AT_H2_INDEXES[i] - 1; // 1-based → 0-based
      if (h2Idx >= h2Positions.length) break;
      insertAt.push({
        childIdx: h2Positions[h2Idx],
        adKey: order[i],
      });
    }

    // 後ろ から 挿入 (index ズレ防止)
    for (let i = insertAt.length - 1; i >= 0; i--) {
      const { childIdx, adKey } = insertAt[i];
      const ad = ADS[adKey];
      if (!ad) continue;
      tree.children.splice(childIdx, 0, {
        type: 'html',
        value: '\n' + ad.html + '\n',
      });
    }
  };
}

export default remarkMidArticleAds;
