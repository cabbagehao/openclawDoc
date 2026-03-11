---
summary: "チャネル、ルーティング、メディア、UX にわたる OpenClaw の主要機能一覧"
read_when:
  - OpenClaw がサポートしている機能の全体像を把握したい場合
title: "機能一覧"
x-i18n:
  source_hash: "709ea22218ffb9c5435af0ecfef105cb6350754ede0f99094abe18afb8e4e119"
---

# 機能一覧

## ハイライト

<Columns>
  <Card title="チャネル" icon="message-square">
    WhatsApp, Telegram, Discord, iMessage を 1 つのゲートウェイで統合管理。
  </Card>

  <Card title="プラグイン" icon="plug">
    拡張機能を使用して Mattermost などのチャネルを自由に追加。
  </Card>

  <Card title="ルーティング" icon="route">
    分離されたセッションによる高度なマルチエージェントルーティング。
  </Card>

  <Card title="メディア" icon="image">
    画像、音声、ドキュメントの送受信と解析に対応。
  </Card>

  <Card title="アプリと UI" icon="monitor">
    ウェブベースのコントロール UI と macOS 用コンパニオンアプリ。
  </Card>

  <Card title="モバイルノード" icon="smartphone">
    iOS/Android ノードとのペアリング、音声/チャット、豊富なデバイスコマンド。
  </Card>
</Columns>

## 全機能リスト

* **チャネル連携**: WhatsApp Web (Baileys), Telegram (grammY), Discord (discord.js), iMessage (imsg CLI) を標準サポート。
* **拡張性**: プラグインによるチャネル追加（Mattermost 等）。
* **エージェントブリッジ**: RPC モードによる Pi (pi-mono) 連携とツールストリーミング。
* **ストリーミング**: 長い応答をリアルタイムで送信するストリーミングとチャンク化。
* **マルチエージェント**: ワークスペースや送信者ごとに分離されたセッションルーティング。
* **サブスクリプション認証**: OAuth 経由の Anthropic および OpenAI 認証。
* **セッション管理**: ダイレクトチャットは `main` セッションへ集約、グループチャットは個別に分離。
* **グループチャット**: メンション（言及）ベースの応答トリガー。
* **メディア対応**: 画像、音声、ドキュメントの双方向サポート。
* **音声メモ**: オプションの音声メッセージ書き起こしフック。
* **ユーザーインターフェース**: WebChat および macOS メニューバーアプリ。
* **iOS ノード**: ペアリング、Canvas、カメラ、画面収録、位置情報、音声通信。
* **Android ノード**: ペアリング、接続タブ、チャットセッション、音声タブ、Canvas/カメラ、およびデバイス制御（通知、連絡先、カレンダー、センサー、写真、SMS）。

<Note>
  レガシーな Claude, Codex, Gemini, Opencode パスは削除されました。現在は Pi が唯一のコーディングエージェントパスです。
</Note>
