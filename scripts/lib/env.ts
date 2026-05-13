// .env 読み込みのラッパー
// Claude Code 等の親プロセスが空の環境変数 (例: ANTHROPIC_API_KEY="") を持っていると
// dotenv はデフォルトで上書きしないため、本プロジェクトでは override:true で .env を正とする。
//
// 各 CLI エントリポイントの先頭で `import '../lib/env.js';` するだけで有効化される。
import { config } from 'dotenv';

config({ override: true });
