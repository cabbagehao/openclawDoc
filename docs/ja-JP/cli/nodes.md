---
summary: "「openclaw ノード」の CLI リファレンス (リスト/ステータス/承認/呼び出し、カメラ/キャンバス/画面)"
read_when:
  - ペアになったノード (カメラ、スクリーン、キャンバス) を管理している
  - リクエストを承認するか、ノードコマンドを呼び出す必要があります
title: "ノード"
x-i18n:
  source_hash: "2b9767046159c0e30c51fce179d2f87365a6f2a8f7e04cf8b2111308d0f44d0c"
---

# `openclaw nodes`

ペアになったノード (デバイス) を管理し、ノード機能を呼び出します。

関連:

- ノードの概要: [ノード](/nodes)
- カメラ: [カメラノード](/nodes/camera)
- 画像: [画像ノード](/nodes/images)

一般的なオプション:

- `--url`、`--token`、`--timeout`、`--json`

## 共通コマンド

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

`nodes list` は保留中/ペアになったテーブルを出力します。ペアになった行には、最新の接続経過時間 (最終接続) が含まれます。
現在接続されているノードのみを表示するには、`--connected` を使用します。 `--last-connected <duration>` を使用して、
期間内に接続したノードにフィルターします (例: `24h`、`7d`)。

## 呼び出し/実行

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
openclaw nodes run --node <id|name|ip> <command...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|name|ip> --raw "git status"
```

フラグを呼び出します。

- `--params <json>`: JSON オブジェクト文字列 (デフォルトは `{}`)。
- `--invoke-timeout <ms>`: ノード呼び出しタイムアウト (デフォルト `15000`)。
- `--idempotency-key <key>`: オプションのべき等性キー。

### Exec スタイルのデフォルト

`nodes run` は、モデルの実行動作 (デフォルト + 承認) を反映しています。

- `tools.exec.*` を読み取ります (さらに `agents.list[].tools.exec.*` オーバーライド)。
- `system.run` を呼び出す前に、実行承認 (`exec.approval.request`) を使用します。
- `tools.exec.node` が設定されている場合、`--node` は省略できます。
- `system.run` (macOS コンパニオン アプリまたはヘッドレス ノード ホスト) をアドバタイズするノードが必要です。

フラグ:- `--cwd <path>`: 作業ディレクトリ。

- `--env <key=val>`: 環境オーバーライド (反復可能)。注: ノード ホストは `PATH` オーバーライドを無視します (`tools.exec.pathPrepend` はノード ホストに適用されません)。
- `--command-timeout <ms>`: コマンドがタイムアウトしました。
- `--invoke-timeout <ms>`: ノード呼び出しタイムアウト (デフォルト `30000`)。
- `--needs-screen-recording`: 画面録画許可が必要です。
- `--raw <command>`: シェル文字列 (`/bin/sh -lc` または `cmd.exe /c`) を実行します。
  Windows ノード ホストの許可リスト モードでは、`cmd.exe /c` シェル ラッパーの実行には承認が必要です
  (許可リストのエントリだけではラッパー フォームは自動的に許可されません)。
- `--agent <id>`: エージェントを対象とした承認/許可リスト (デフォルトは構成されたエージェント)。
- `--ask <off|on-miss|always>`、`--security <deny|allowlist|full>`: オーバーライドします。
