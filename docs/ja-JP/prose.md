---
summary: "OpenProse: OpenClawにおける.proseワークフロー、スラッシュコマンド、状態管理"
read_when:
  - .proseワークフローを実行または作成したい場合
  - OpenProseプラグインを有効化したい場合
  - 状態ストレージについて理解する必要がある場合
title: "OpenProse"
---

# OpenProse

OpenProseは、AIセッションをオーケストレーションするための、ポータブルでMarkdownファーストなワークフロー形式です。OpenClawでは、OpenProseスキルパックと`/prose`スラッシュコマンドをインストールするプラグインとして提供されています。プログラムは`.prose`ファイルに記述され、明示的な制御フローで複数のサブエージェントを生成できます。

公式サイト: [https://www.prose.md](https://www.prose.md)

## できること

- 明示的な並列処理によるマルチエージェントリサーチと統合
- 承認セーフな反復可能なワークフロー（コードレビュー、インシデントトリアージ、コンテンツパイプライン）
- サポートされているエージェントランタイム間で実行可能な再利用可能な`.prose`プログラム

## インストールと有効化

バンドルされたプラグインはデフォルトで無効になっています。OpenProseを有効化するには:

```bash
openclaw plugins enable open-prose
```

プラグインを有効化した後、Gatewayを再起動してください。

開発/ローカルチェックアウト: `openclaw plugins install ./extensions/open-prose`

関連ドキュメント: [プラグイン](/tools/plugin)、[プラグインマニフェスト](/plugins/manifest)、[Skills](/tools/skills)

## スラッシュコマンド

OpenProseは`/prose`をユーザー呼び出し可能なスキルコマンドとして登録します。これはOpenProse VMの命令にルーティングされ、内部でOpenClawツールを使用します。

一般的なコマンド:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 例: シンプルな`.prose`ファイル

```prose
# 2つのエージェントを並列実行するリサーチと統合

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

## ファイルの場所

OpenProseはワークスペース内の`.prose/`配下に状態を保持します:

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

ユーザーレベルの永続的なエージェントは以下に保存されます:

```
~/.prose/agents/
```

## 状態モード

OpenProseは複数の状態バックエンドをサポートしています:

- **filesystem**（デフォルト）: `.prose/runs/...`
- **in-context**: 一時的、小規模プログラム向け
- **sqlite**（実験的）: `sqlite3`バイナリが必要
- **postgres**（実験的）: `psql`と接続文字列が必要

注意事項:

- sqlite/postgresはオプトインで実験的です
- postgres認証情報はサブエージェントログに流れます。専用の最小権限DBを使用してください

## リモートプログラム

`/prose run <handle/slug>`は`https://p.prose.md/<handle>/<slug>`に解決されます。
直接URLはそのままフェッチされます。これは`web_fetch`ツール（またはPOSTの場合は`exec`）を使用します。

## OpenClawランタイムマッピング

OpenProseプログラムはOpenClawプリミティブにマッピングされます:

| OpenProseコンセプト         | OpenClawツール   |
| --------------------------- | ---------------- |
| セッション生成 / Taskツール | `sessions_spawn` |
| ファイル読み書き            | `read` / `write` |
| Web取得                     | `web_fetch`      |

ツール許可リストがこれらのツールをブロックしている場合、OpenProseプログラムは失敗します。[Skillsコンフィグ](/tools/skills-config)を参照してください。

## セキュリティと承認

`.prose`ファイルはコードとして扱ってください。実行前にレビューしてください。OpenClawのツール許可リストと承認ゲートを使用して副作用を制御してください。

決定論的で承認ゲート付きのワークフローについては、[Lobster](/tools/lobster)と比較してください。
