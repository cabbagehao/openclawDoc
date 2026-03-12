---
summary: "Mac アプリにゲートウェイ WebChat を埋め込む方法とそれをデバッグする方法"
read_when:
  - Mac の WebChat ビューや loopback port をデバッグするとき
title: "OpenClawのmacOS ウェブチャット の仕組み・設定手順・運用ガイド"
description: "macOS のメニュー バー アプリは、WebChat UI をネイティブの SwiftUI view として埋め込んでいます。ゲートウェイへ接続し、選択中エージェントの main session を既定対象とします。"
x-i18n:
  source_hash: "6e72893255fa01cafa1252c4d5accf76e87f9b7720158c14442b99b60753363e"
---
macOS のメニュー バー アプリは、WebChat UI をネイティブの SwiftUI view として埋め込んでいます。ゲートウェイへ接続し、選択中エージェントの **main session** を既定対象とします。必要に応じて他 session へ切り替える UI も備えています。

- **Local mode**: ローカルのゲートウェイ WebSocket へ直接接続します。
- **Remote mode**: ゲートウェイの control port を SSH で転送し、そのトンネルを data plane として使います。

## 起動とデバッグ

- 手動起動: Lobster menu → "Open Chat"
- テスト用に自動起動:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- ログ: `./scripts/clawlog.sh` (subsystem `ai.openclaw`、category `WebChatSwiftUI`)

## 配線構成

- Data plane: ゲートウェイ WS の `chat.history`、`chat.send`、`chat.abort`、`chat.inject` と、イベント `chat`、`agent`、`presence`、`tick`、`health`
- Session: 既定では primary session (`main`、または scope が global の場合は `global`) を使います。UI から session を切り替えられます。
- オンボーディングでは専用 session を使い、初回セットアップの対話を通常のチャット session から分離します。

## セキュリティ面

- Remote mode では、SSH 経由で転送するのはゲートウェイ WebSocket の control port だけです。

## 既知の制限

- UI はチャット session 向けに最適化されており、完全なブラウザー サンドボックスではありません。
