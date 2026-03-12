---
summary: "OpenProse: OpenClaw における .prose ワークフロー、slash command、状態管理"
read_when:
  - .prose ワークフローを実行または作成したいとき
  - OpenProse プラグインを有効化したいとき
  - 状態ストレージの仕組みを理解したいとき
title: "OpenProse"
---
OpenProse は、AI セッションをオーケストレーションするための、ポータブルで markdown-first なワークフロー形式です。OpenClaw では、OpenProse skill pack と `/prose` slash command を追加する plugin として提供されます。プログラムは `.prose` ファイルに記述し、明示的な制御フローで複数の sub-agent を起動できます。

公式サイト: [https://www.prose.md](https://www.prose.md)

## できること

- 明示的な並列実行を持つ multi-agent の調査と統合
- 承認フローを前提にした、再実行可能なワークフロー（code review、incident triage、content pipeline）
- 対応する agent runtime をまたいで再利用できる `.prose` プログラム

## インストールと有効化

バンドル済み plugin は既定で無効です。OpenProse を有効にするには:

```bash
openclaw plugins enable open-prose
```

plugin を有効化したら、ゲートウェイを再起動してください。

開発 / ローカル checkout では次を使えます: `openclaw plugins install ./extensions/open-prose`

関連ドキュメント: [Plugins](/tools/plugin)、[Plugin manifest](/plugins/manifest)、[Skills](/tools/skills)

## Slash command

OpenProse は `/prose` を、ユーザーが呼び出せる skill command として登録します。内部では OpenProse VM の命令にルーティングされ、OpenClaw の各種ツールを使って実行されます。

よく使うコマンド:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 例: シンプルな `.prose` ファイル

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## ファイル配置

OpenProse は workspace 配下の `.prose/` に状態を保存します。

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

ユーザー単位で永続化される agent は次に保存されます。

```
~/.prose/agents/
```

## 状態モード

OpenProse は複数の状態 backend をサポートします。

- **filesystem**（既定）: `.prose/runs/...`
- **in-context**: 一時的な小規模プログラム向け
- **sqlite**（実験的）: `sqlite3` バイナリが必要
- **postgres**（実験的）: `psql` と接続文字列が必要

注意:

- sqlite / postgres は opt-in かつ experimental です。
- postgres の認証情報は sub-agent log に流れます。専用で最小権限の DB を使用してください。

## リモート プログラム

`/prose run <handle/slug>` は `https://p.prose.md/<handle>/<slug>` に解決されます。URL を直接指定した場合はそのまま取得します。これには `web_fetch` ツール（POST の場合は `exec`）を使います。

## OpenClaw runtime との対応関係

OpenProse プログラムは OpenClaw の primitive に次のように対応します。

| OpenProse concept         | OpenClaw tool    |
| ------------------------- | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read/write           | `read` / `write` |
| Web fetch                 | `web_fetch`      |

ツール allowlist がこれらをブロックしている場合、OpenProse プログラムは失敗します。詳細は [Skills config](/tools/skills-config) を参照してください。

## セキュリティと承認

`.prose` ファイルはコードとして扱ってください。実行前に内容を確認し、OpenClaw のツール allowlist と承認ゲートで副作用を制御してください。

決定的で、承認ゲートを前提にしたワークフローが必要なら、[Lobster](/tools/lobster) と比較してください。
