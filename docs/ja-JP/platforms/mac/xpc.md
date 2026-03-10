---
summary: "OpenClaw アプリ、ゲートウェイ ノード トランスポート、および PeekabooBridge 用の macOS IPC アーキテクチャ"
read_when:
  - IPC コントラクトまたはメニュー バー アプリ IPC の編集
title: "macOS IPC"
x-i18n:
  source_hash: "d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92"
---

# OpenClaw macOS IPC アーキテクチャ

**現在のモデル:** ローカル Unix ソケットは、実行承認 + `system.run` のために **ノード ホスト サービス**を **macOS アプリ**に接続します。 `openclaw-mac` デバッグ CLI は、検出/接続チェック用に存在します。エージェントのアクションは引き続きゲートウェイ WebSocket および `node.invoke` を介して流れます。 UI オートメーションには PeekabooBridge が使用されます。

## 目標

- TCC 向けのすべての作業 (通知、画面録画、マイク、音声、AppleScript) を所有する単一の GUI アプリ インスタンス。
- 自動化のための小さなサーフェス: ゲートウェイ + ノード コマンド、および UI 自動化のための PeekabooBridge。
- 予測可能なアクセス許可: 常に同じ署名付きバンドル ID、launchd によって起動されるため、TCC はスティックを付与します。

## 仕組み

### ゲートウェイ + ノードトランスポート

- アプリはゲートウェイ (ローカル モード) を実行し、ノードとしてゲートウェイに接続します。
- エージェントのアクションは `node.invoke` (例: `system.run`、`system.notify`、`canvas.*`) を介して実行されます。

### ノードサービス + アプリ IPC

- ヘッドレス ノード ホスト サービスは、ゲートウェイ WebSocket に接続します。
- `system.run` リクエストは、ローカル Unix ソケット経由で macOS アプリに転送されます。
- アプリは UI コンテキストで実行を実行し、必要に応じてプロンプトを表示し、出力を返します。

図 (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI オートメーション)- UI オートメーションは、`bridge.sock` という名前の別の UNIX ソケットと PeekabooBridge JSON プロトコルを使用します

- ホストの優先順位 (クライアント側): Peekaboo.app → Claude.app → OpenClaw.app → ローカル実行。
- セキュリティ: ブリッジ ホストには許可された TeamID が必要です。 DEBUG 専用の同じ UID エスケープ ハッチは、`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (Peekaboo 規則) によって保護されています。
- 詳細については、[PeekabooBridge の使用法](/platforms/mac/peekaboo) を参照してください。

## 運用フロー

- 再起動/再構築: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 既存のインスタンスを強制終了します
  - 迅速なビルド + パッケージ
  - LaunchAgent の書き込み/ブートストラップ/キックスタート
- 単一インスタンス: 同じバンドル ID を持つ別のインスタンスが実行されている場合、アプリは早期に終了します。

## 硬化メモ

- すべての特権サーフェスに対して TeamID の一致を要求することを好みます。
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG のみ) ローカル開発で同じ UID の呼び出し元を許可する場合があります。
- すべての通信はローカルのみのままです。ネットワークソケットは公開されません。
- TCC プロンプトは GUI アプリ バンドルからのみ発生します。署名付きバンドル ID を再構築後も安定した状態に保ちます。
- IPC 強化: ソケット モード `0600`、トークン、ピア UID チェック、HMAC チャレンジ/レスポンス、短い TTL。
