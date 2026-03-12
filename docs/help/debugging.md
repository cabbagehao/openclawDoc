---
summary: "デバッグツール：ウォッチモード、生のモデルストリーム、推論内容の漏洩のトレース"
description: "ランタイム上書き、watch モード、dev プロファイル、生ストリームログを使って、推論混入や応答異常を切り分ける手順をまとめます。"
read_when:
  - モデルの生出力を検査して、推論プロセスの混入を確認する場合
  - 開発中にゲートウェイをウォッチモードで実行したい場合
  - 再現可能なデバッグワークフローが必要な場合
title: "デバッグ"
seoTitle: "OpenClaw のデバッグ手順と reasoning 混入・生ログ調査完全ガイド"
---
このページでは、ストリーミング出力、特にプロバイダーが通常のテキストに推論プロセス（reasoning）を混入させる場合のデバッグヘルパーについて説明します。

## ランタイムデバッグのオーバーライド

チャットで `/debug` コマンドを使用すると、ディスク上の設定を変更せずに、**実行中のみ**の設定オーバーライド（メモリ上のみ）を適用できます。
`/debug` はデフォルトで無効になっています。有効にするには、設定で `commands.debug: true` を指定してください。
これは、`openclaw.json` を編集せずに一時的に設定を切り替えたい場合に便利です。

実行例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` を実行すると、すべてのオーバーライドがクリアされ、ディスク上の設定に戻ります。

## ゲートウェイのウォッチモード

迅速な開発サイクルのために、ファイルウォッチャーの下でゲートウェイを実行できます。

```bash
pnpm gateway:watch
```

このコマンドは内部で以下を実行します。

```bash
node --watch-path src --watch-path tsconfig.json --watch-path package.json --watch-preserve-output scripts/run-node.mjs gateway --force
```

`gateway:watch` の後にゲートウェイのCLIフラグを追加すると、再起動のたびにそれらのフラグが引き継がれます。

## 開発プロファイルと開発ゲートウェイ (--dev)

開発（dev）プロファイルを使用すると、状態を分離し、デバッグ用の安全で使い捨て可能な環境を構築できます。`--dev` フラグには**2種類**の意味があります。

- **グローバル `--dev` (プロファイル):** 状態を `~/.openclaw-dev` ディレクトリに分離し、ゲートウェイのポートをデフォルトで `19001` に設定します（関連するポートもそれに合わせてシフトします）。
- **`gateway --dev`:** 構成ファイルが見つからない場合に、デフォルトの設定とワークスペースを自動作成します（また、`BOOTSTRAP.md` の読み込みをスキップします）。

推奨されるフロー（開発プロファイル + 開発ブートストラップ）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

グローバルインストールを行っていない場合は、`pnpm openclaw ...` 経由でCLIを実行してください。

このコマンドにより実行される内容：

1. **プロファイルの分離** (グローバル `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (ブラウザやキャンバスのポートもこれに追従します)

2. **開発ブートストラップ** (`gateway --dev`)
   - 設定ファイルがない場合に最小限の構成（`gateway.mode=local`, loopbackバインド）を書き込みます。
   - `agent.workspace` を開発用ワークスペースに設定します。
   - `agent.skipBootstrap=true` に設定（`BOOTSTRAP.md` を無視）。
   - ワークスペースファイルがない場合にシードファイルを作成：
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - デフォルトのアイデンティティ：**C3-PO** (プロトコルドロイド)。
   - 開発モードではチャネルプロバイダーをスキップします (`OPENCLAW_SKIP_CHANNELS=1`)。

環境のリセット（クリーンな状態からの開始）：

```bash
pnpm gateway:dev:reset
```

注：`--dev` は**グローバル**なプロファイルフラグであり、一部のランナーでは正しく解釈されない場合があります。明示的に指定する必要がある場合は、環境変数の形式を使用してください。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` は設定、認証情報、セッション、および開発ワークスペースを完全に削除（`rm` ではなく `trash` を使用）し、デフォルトの開発環境を再構築します。

ヒント：開発用ではないゲートウェイが既に実行されている場合（launchd/systemd等）、先にそれを停止してください。

```bash
openclaw gateway stop
```

## 生のストリームログ (OpenClaw)

OpenClawは、フィルタリングやフォーマットが適用される前の **生のアシスタントストリーム（raw stream）** をログに記録できます。これは、推論プロセスがプレーンテキストとして届いているのか、あるいは独立した思考ブロックとして届いているのかを確認するのに最適な方法です。

CLIで有効化：

```bash
pnpm gateway:watch --raw-stream
```

保存先パスの上書き（オプション）：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

同等の環境変数：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトの保存先：
`~/.openclaw/logs/raw-stream.jsonl`

## 生のチャンクログ (pi-mono)

ブロックに解析される前の **生の OpenAI 互換チャンク** をキャプチャするために、pi-mono は別のロガーを提供しています。

```bash
PI_RAW_STREAM=1
```

保存先パス（オプション）：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトの保存先：
`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注：これは pi-mono の `openai-completions` プロバイダーを使用しているプロセスでのみ出力されます。

## 安全上の注意

- 生のストリームログには、完全なプロンプト、ツールの出力、およびユーザーデータが含まれる可能性があります。
- ログはローカルにのみ保存し、デバッグ終了後は削除してください。
- ログを共有する場合は、事前に機密情報や個人情報（PII）を必ず除去（マスク）してください。
