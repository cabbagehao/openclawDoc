---
summary: "デバッグ ツール: 監視モード、生のモデル ストリーム、および推論リークのトレース"
read_when:
  - 推論漏れがないか生のモデル出力を検査する必要がある
  - 反復中にゲートウェイを監視モードで実行したい場合
  - 反復可能なデバッグ ワークフローが必要です
title: "デバッグ"
x-i18n:
  source_hash: "9496410cc38a8024a8c49403af657099fc0a155425e15b7f77c964d15e82afb4"
---

# デバッグ

このページでは、特にストリーミング出力のデバッグ ヘルパーについて説明します。
プロバイダーは通常のテキストに推論を混ぜます。

## ランタイムデバッグのオーバーライド

チャットで `/debug` を使用して、**ランタイムのみ** 構成の上書き (ディスクではなくメモリ) を設定します。
`/debug` はデフォルトでは無効になっています。 `commands.debug: true` で有効にします。
これは、`openclaw.json` を編集せずに、わかりにくい設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の構成に戻ります。

## ゲートウェイ監視モード

高速に反復するには、ファイル ウォッチャーの下でゲートウェイを実行します。

```bash
pnpm gateway:watch
```

これは以下にマッピングされます。

```bash
node --watch-path src --watch-path tsconfig.json --watch-path package.json --watch-preserve-output scripts/run-node.mjs gateway --force
```

`gateway:watch` の後にゲートウェイ CLI フラグを追加すると、それらはパススルーされます。
再起動するたびに。

## 開発プロファイル + 開発ゲートウェイ (--dev)

開発プロファイルを使用して状態を分離し、安全で使い捨てのセットアップをスピンアップします。
デバッグ中。 **2 つの** `--dev` フラグがあります。

- **グローバル `--dev` (プロファイル):** `~/.openclaw-dev` で状態を分離し、
  ゲートウェイ ポートをデフォルトで `19001` に設定します (派生ポートもそれに伴いシフトします)。
- **`gateway --dev`: ゲートウェイにデフォルト設定を自動作成するように指示します +
  workspace** が見つからない場合は (BootSTRAP.md をスキップします)。

推奨フロー (開発プロファイル + 開発ブートストラップ):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

まだグローバル インストールを行っていない場合は、`pnpm openclaw ...` 経由で CLI を実行します。

これが行うこと:1. **プロファイルの分離** (グローバル `--dev`)

- `OPENCLAW_PROFILE=dev`
- `OPENCLAW_STATE_DIR=~/.openclaw-dev`
- `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
- `OPENCLAW_GATEWAY_PORT=19001` (ブラウザ/キャンバスはそれに応じて移動します)

2. **開発ブートストラップ** (`gateway --dev`)
   - 欠落している場合は最小限の構成を書き込みます (`gateway.mode=local`、バインド ループバック)。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` (BOOTSTRAP.md なし) を設定します。
   - ワークスペース ファイルが見つからない場合はシードします。
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - デフォルトのアイデンティティ: **C3‑PO** (プロトコル ドロイド)。
   - 開発モードでチャネルプロバイダーをスキップします (`OPENCLAW_SKIP_CHANNELS=1`)。

リセットフロー (新規スタート):

```bash
pnpm gateway:dev:reset
```

注: `--dev` は **グローバル** プロファイル フラグであり、一部のランナーによって使用されます。
スペルアウトする必要がある場合は、env var 形式を使用してください。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` は、構成、認証情報、セッション、開発ワークスペースをワイプします (使用
`rm` ではなく `trash`)、デフォルトの開発セットアップを再作成します。

ヒント: 非開発ゲートウェイがすでに実行されている場合 (launchd/systemd)、最初に停止します。

```bash
openclaw gateway stop
```

## 生のストリームログ (OpenClaw)

OpenClaw は、フィルタリング/フォーマットの前に **生のアシスタント ストリーム**をログに記録できます。
これは、推論がプレーン テキスト デルタとして到着しているかどうかを確認する最良の方法です
(または別個の思考ブロックとして)。

CLI 経由で有効にします。

````bash
pnpm gateway:watch --raw-stream
```オプションのパス オーバーライド:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
````

同等の環境変数:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトのファイル:

`~/.openclaw/logs/raw-stream.jsonl`

## 生のチャンクのロギング (pi-mono)

**生の OpenAI 互換チャンク**をブロックに解析される前にキャプチャするには、
pi-mono は別のロガーを公開します。

```bash
PI_RAW_STREAM=1
```

オプションのパス:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトのファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注: これは、pi-mono を使用するプロセスによってのみ出力されます。
> `openai-completions` プロバイダー。

## 安全上の注意事項

- 生のストリーム ログには、完全なプロンプト、ツール出力、およびユーザー データを含めることができます。
- ログをローカルに保存し、デバッグ後に削除します。
- ログを共有する場合は、最初にシークレットと PII をスクラブします。
