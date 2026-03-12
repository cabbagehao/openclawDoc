---
summary: "外部 CLI (signal-cli、レガシー imsg) およびゲートウェイ パターン用の RPC アダプター"
read_when:
  - 外部 CLI 統合の追加または変更
  - RPC アダプターのデバッグ (signal-cli、imsg)
title: "OpenClaw RPCアダプター仕様と呼び出し方法を確認するガイド"
description: "OpenClaw は、JSON-RPC 経由で外部 CLI を統合します。今日は 2 つのパターンが使用されます。パターン A: HTTP デーモン (signal-cli)、パターン B: stdio 子プロセス (レガシー: imsg)。"
x-i18n:
  source_hash: "06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57"
---
OpenClaw は、JSON-RPC 経由で外部 CLI を統合します。今日は 2 つのパターンが使用されます。

## パターン A: HTTP デーモン (signal-cli)

- `signal-cli` は、HTTP 経由で JSON-RPC を使用してデーモンとして実行されます。
- イベント ストリームは SSE (`/api/v1/events`) です。
- ヘルスプローブ: `/api/v1/check`。
- OpenClaw は、`channels.signal.autoStart=true` のときにライフサイクルを所有します。

セットアップとエンドポイントについては、[Signal](/channels/signal) を参照してください。

## パターン B: stdio 子プロセス (レガシー: imsg)

> **注:** 新しい iMessage セットアップの場合は、代わりに [BlueBubbles](/channels/bluebubbles) を使用してください。

- OpenClaw は、子プロセスとして `imsg rpc` を生成します (従来の iMessage 統合)。
- JSON-RPC は、stdin/stdout 上で行区切りです (1 行に 1 つの JSON オブジェクト)。
- TCP ポートもデーモンも必要ありません。

使用されるコアメソッド:

- `watch.subscribe` → 通知 (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (プローブ/診断)

従来のセットアップとアドレス指定については、[iMessage](/channels/imessage) を参照してください (`chat_id` を推奨)。

## アダプターのガイドライン

- ゲートウェイはプロセスを所有します (開始/停止はプロバイダーのライフサイクルに関連付けられます)。
- RPC クライアントの回復力を維持します: タイムアウト、終了時に再起動します。
- 表示文字列よりも安定した ID (例: `chat_id`) を優先します。
