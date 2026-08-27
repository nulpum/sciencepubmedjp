#!/usr/bin/env python3
# Markdown → PDF (日本語フォント対応)
# 使い方: python scripts/md2pdf.py docs/sns-follow-campaign.md docs/sns-follow-campaign.pdf

import sys
import markdown
from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

src = sys.argv[1]
out = sys.argv[2]

# 日本語フォント登録
# reportlab 内蔵の日本語 CID フォント (外部ファイル不要・確実にグリフを持つ)。
# 可変フォント (NotoSansJP-Bold.ttf) や TTC は xhtml2pdf 経由で豆腐になるため不使用。
pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))

with open(src, "r", encoding="utf-8") as f:
    md_text = f.read()

# markdown → HTML (tables / checkboxes 対応の拡張つき)
html_body = markdown.markdown(
    md_text,
    extensions=["tables", "fenced_code", "sane_lists", "nl2br"],
)

# チェックボックス [ ] / [x] を視覚記号に置換 (xhtml2pdf は task-list 未対応のため)
html_body = (
    html_body
    .replace("[ ]", "☐")
    .replace("[x]", "☑")
    .replace("[X]", "☑")
)

# 全体を NotoJP フォント指定の HTML に包む
html = f"""
<html>
<head>
<meta charset="utf-8"/>
<style>
  body {{ font-family: "HeiseiKakuGo-W5"; font-size: 9pt; line-height: 1.5; color: #1a1a1a; }}
  h1 {{ font-size: 17pt; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 4px; margin-top: 16px; }}
  h2 {{ font-size: 13pt; color: #1a365d; margin-top: 14px; }}
  h3 {{ font-size: 11pt; color: #2a4a7d; margin-top: 10px; }}
  h4 {{ font-size: 10pt; color: #333; margin-top: 8px; }}
  table {{ border-collapse: collapse; width: 100%; margin: 6px 0; }}
  th, td {{ border: 1px solid #ccc; padding: 3px 5px; font-size: 8.5pt; }}
  th {{ background-color: #e8eef7; }}
  code {{ background-color: #f0f0f0; font-size: 8.5pt; }}
  pre {{ background-color: #f6f6f6; padding: 6px; font-size: 8pt; }}
  li {{ margin: 1px 0; }}
  blockquote {{ color: #666; border-left: 3px solid #ccc; padding-left: 8px; }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

with open(out, "w+b") as f:
    pisa_status = pisa.CreatePDF(html, dest=f, encoding="utf-8")

if pisa_status.err:
    print(f"ERROR: PDF 生成失敗 ({pisa_status.err} errors)")
    sys.exit(1)
print(f"OK: {out} を生成しました")
