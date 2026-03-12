---
summary: "ループバック WebChat 静的ホストとゲートウェイ WS のチャット UI の使用"
read_when:
  - WebChat アクセスのデバッグまたは構成
title: "ウェブチャット"
x-i18n:
  source_hash: "18739c0332e9a78e78d51275b3f5f55e267c9b11316a79bf38ac95b7d3f3bdd1"
---
ステータス: macOS/iOS SwiftUI チャット UI はゲートウェイ WebSocket と直接通信します。

## それは何ですか

- ゲートウェイのネイティブ チャット UI (組み込みブラウザやローカル静的サーバーはありません)。
- 他のチャネルと同じセッションとルーティング ルールを使用します。
- 決定的なルーティング: 返信は常に WebChat に返されます。

## クイックスタート

1. ゲートウェイを起動します。
2. WebChat UI (macOS/iOS アプリ) または Control UI チャット タブを開きます。
3. ゲートウェイ認証が設定されていることを確認します (ループバックでもデフォルトで必須)。

## 仕組み (動作)

- UI はゲートウェイ WebSocket に接続し、`chat.history`、`chat.send`、および `chat.inject` を使用します。
- `chat.history` は安定性のために制限されています: ゲートウェイは長いテキスト フィールドを切り詰め、重いメタデータを省略し、サイズを超えるエントリを `[chat.history omitted: message too large]` に置き換える場合があります。
- `chat.inject` は、アシスタントのメモをトランスクリプトに直接追加し、それを UI にブロードキャストします (エージェントは実行されません)。
- 実行が中止された場合、部分的なアシスタント出力が UI に表示されたままになることがあります。
- ゲートウェイは、バッファリングされた出力が存在する場合、中止された部分的なアシスタント テキストをトランスクリプト履歴に保持し、それらのエントリを中止メタデータでマークします。
- 履歴は常にゲートウェイから取得されます (ローカル ファイルの監視はありません)。
- ゲートウェイに到達できない場合、WebChat は読み取り専用になります。

## コントロール UI エージェント ツール パネル- コントロール UI `/agents` ツール パネルは、`tools.catalog` 経由でランタイム カタログを取得し、それぞれにラベルを付けます

ツールは `core` または `plugin:<id>` (さらにオプションのプラグイン ツールの場合は `optional`)。

- `tools.catalog` が使用できない場合、パネルは組み込みの静的リストに戻ります。
- パネルはプロファイルを編集して構成を上書きしますが、効果的なランタイム アクセスは依然としてポリシーに従います。
  優先順位 (`allow`/`deny`、エージェントおよびプロバイダー/チャネルごとのオーバーライド)。

## リモート使用

- リモート モードは、SSH/Tailscale 経由でゲートウェイ WebSocket をトンネリングします。
- 別の WebChat サーバーを実行する必要はありません。

## 構成リファレンス (WebChat)

完全な構成: [構成](/gateway/configuration)

チャンネルオプション:

- 専用の `webchat.*` ブロックはありません。 WebChat は、以下のゲートウェイ エンドポイント + 認証設定を使用します。

関連するグローバル オプション:

- `gateway.port`、`gateway.bind`: WebSocket ホスト/ポート。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`: WebSocket 認証 (トークン/パスワード)。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ クライアントのリバース プロキシ認証 ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`: リモート ゲートウェイ ターゲット。
- `session.*`: セッション ストレージとメイン キーのデフォルト。
