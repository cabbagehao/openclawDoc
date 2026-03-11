---
summary: "`openclaw nodes` の CLI リファレンス (一覧表示、ステータス確認、承認、機能呼び出し、カメラ/キャンバス/画面操作)"
read_when:
  - ペアリング済みのノード（カメラ、画面、キャンバスなど）を管理する場合
  - 要求を承認したり、ノードのコマンドを直接実行したりする場合
title: "nodes"
x-i18n:
  source_hash: "2b9767046159c0e30c51fce179d2f87365a6f2a8f7e04cf8b2111308d0f44d0c"
---

# `openclaw nodes`

ペアリング済みのノード（デバイス）を管理し、ノードの機能を呼び出します。

関連ドキュメント:
- ノードの概要: [ノード](/nodes)
- カメラ: [カメラノード](/nodes/camera)
- 画像: [画像ノード](/nodes/images)

共通オプション:
- `--url`, `--token`, `--timeout`, `--json`

## よく使われるコマンド

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` を実行すると、承認待ち（pending）およびペアリング済み（paired）のノードが表形式で表示されます。ペアリング済みの行には、最新の接続からの経過時間（Last Connect）が含まれます。
現在接続されているノードのみを表示するには `--connected` を指定します。`--last-connected <期間>`（例: `24h`, `7d`）を使用すると、その期間内に接続したことのあるノードに絞り込むことができます。

## 実行および機能の呼び出し

```bash
openclaw nodes invoke --node <id|名前|ip> --command <コマンド> --params <json>
openclaw nodes run --node <id|名前|ip> <コマンド...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|名前|ip> --raw "git status"
```

呼び出し（Invoke）用フラグ:
- `--params <json>`: JSON オブジェクト形式の文字列（デフォルトは `{}`）。
- `--invoke-timeout <ms>`: ノード呼び出しのタイムアウト時間（デフォルトは `15000`）。
- `--idempotency-key <キー>`: オプションのべき等性キー。

### Exec スタイルのデフォルト動作

`nodes run` は、エージェント（モデル）が行うコマンド実行と同様の振る舞い（デフォルト設定や承認フロー）を再現します。

- `tools.exec.*` 設定（および `agents.list[].tools.exec.*` による上書き）を読み取ります。
- `system.run` を呼び出す前に、実行承認（`exec.approval.request`）プロセスを介します。
- `tools.exec.node` が構成されていれば、`--node` の指定を省略できます。
- `system.run` 機能を公開しているノード（macOS 用コンパニオンアプリやヘッドレスノードホスト）が必要です。

フラグ一覧:
- `--cwd <パス>`: 作業ディレクトリ。
- `--env <キー=値>`: 環境変数の上書き（複数指定可）。注意: ヘッドレスノードホストは `PATH` の上書きを無視します（また、`tools.exec.pathPrepend` も適用されません）。
- `--command-timeout <ms>`: コマンド自体の実行タイムアウト。
- `--invoke-timeout <ms>`: ノードへのリクエスト送信タイムアウト（デフォルトは `30000`）。
- `--needs-screen-recording`: 画面収録の権限を要求します。
- `--raw <コマンド>`: シェル経由で文字列としてコマンドを実行します（`/bin/sh -lc` または `cmd.exe /c`）。
  Windows のノードホストで許可リスト（allowlist）モードを使用している場合、`cmd.exe /c` 経由の実行には個別の承認が必要です（バイナリ単体の許可だけではシェル経由の実行は許可されません）。
- `--agent <id>`: エージェントスコープの承認設定や許可リストを使用します（デフォルトは構成済みのデフォルトエージェント）。
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: セキュリティポリシーを一時的に上書きします。
