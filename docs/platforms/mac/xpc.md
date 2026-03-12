---
summary: "OpenClaw アプリ、ゲートウェイ ノード トランスポート、および PeekabooBridge 用の macOS IPC アーキテクチャ"
read_when:
  - IPC contract や menu bar app IPC を編集するとき
title: "macOS IPC"
seoTitle: "OpenClawのmacOS IPC の仕組み・設定手順・運用ガイド"
description: "現在のモデル: ローカル Unix socket を使って、node host service と macOS アプリ を接続し、exec approval と system.run をやり取りします。"
x-i18n:
  source_hash: "d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92"
---
**現在のモデル:** ローカル Unix socket を使って、**node host service** と **macOS アプリ** を接続し、exec approval と `system.run` をやり取りします。発見や接続確認用には `openclaw-mac` debug CLI があり、エージェントの実際の操作は引き続きゲートウェイ WebSocket と `node.invoke` を通ります。UI 自動化には PeekabooBridge を使います。

## 目標

- TCC に関わる処理 (notifications、screen recording、microphone、speech、AppleScript) を単一の GUI アプリ インスタンスに集約すること
- 自動化用の公開面を最小化すること。具体的には、ゲートウェイ + node command、および UI 自動化用の PeekabooBridge に限定すること
- 常に同じ署名済み bundle ID を持つ launchd 起動アプリに寄せることで、TCC 権限を安定させること

## 仕組み

### ゲートウェイ + node transport

- アプリはゲートウェイを実行し (local mode)、node としてゲートウェイへ接続します。
- エージェント操作は `node.invoke` を通じて行われます。例: `system.run`、`system.notify`、`canvas.*`

### Node service + app IPC

- ヘッドレスの node host service がゲートウェイ WebSocket に接続します。
- `system.run` の要求は、ローカル Unix socket 経由で macOS アプリへ転送されます。
- アプリは UI context でコマンドを実行し、必要なら承認プロンプトを出し、結果を返します。

図 (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI automation)

- UI 自動化は `bridge.sock` という別の UNIX socket と、PeekabooBridge JSON protocol を使います。
- ホスト優先順序 (client 側) は Peekaboo.app → Claude.app → OpenClaw.app → local execution です。
- セキュリティ上、bridge host には許可済み Team ID が必要です。DEBUG 専用の same-UID escape hatch は `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (Peekaboo の慣例) で保護されています。
- 詳細は [PeekabooBridge usage](/platforms/mac/peekaboo) を参照してください。

## 運用フロー

- 再起動 / 再ビルド: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 既存インスタンスを終了
  - Swift build と package を実行
  - LaunchAgent を書き込み、bootstrap し、kickstart する
- 単一インスタンス制御: 同じ bundle ID の別インスタンスが起動中なら、アプリは早期終了します。

## Hardening に関するメモ

- 権限を伴うすべての面では Team ID 一致を基本としてください。
- PeekabooBridge では `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG のみ) により、ローカル開発時に同一 UID の呼び出し元を許可できる場合があります。
- すべての通信はローカル内に閉じ、network socket は公開しません。
- TCC プロンプトは GUI app bundle からのみ発生させ、署名済み bundle ID は rebuild 後も固定してください。
- IPC hardening として、socket mode `0600`、token、peer UID check、HMAC challenge/response、短い TTL を使います。
