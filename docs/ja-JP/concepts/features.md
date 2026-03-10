---
summary: "チャネル、ルーティング、メディア、UX にわたる OpenClaw 機能。"
read_when:
  - OpenClaw がサポートするものの完全なリストが必要です
title: "特徴"
x-i18n:
  source_hash: "709ea22218ffb9c5435af0ecfef105cb6350754ede0f99094abe18afb8e4e119"
---

## ハイライト

<Columns>
  <Card title="チャンネル" icon="message-square">
    WhatsApp、Telegram、Discord、iMessage を 1 つのゲートウェイで利用可能。
  </Card>
  <Card title="プラグイン" icon="plug">
    拡張機能を使用して Mattermost などを追加します。
  </Card>
  <Card title="ルーティング" icon="route">
    分離されたセッションによるマルチエージェント ルーティング。
  </Card>
  <Card title="メディア" icon="image">
    画像、音声、ドキュメントの入出力。
  </Card>
  <Card title="アプリとUI" icon="monitor">
    Web コントロール UI および macOS コンパニオン アプリ。
  </Card>
  <Card title="モバイルノード" icon="smartphone">
    ペアリング、音声/チャット、および豊富なデバイス コマンドを備えた iOS および Android ノード。
  </Card>
</Columns>

## 完全なリスト- WhatsApp Web (ベイリーズ) を介した WhatsApp 統合

- テレグラムボットのサポート (grammY)
- Discord ボットのサポート (channels.discord.js)
- Mattermost ボットのサポート (プラグイン)
- ローカル imsg CLI を介した iMessage の統合 (macOS)
- ツール ストリーミングを使用した RPC モードの Pi 用エージェント ブリッジ
- 長い応答のストリーミングとチャンク化
- ワークスペースまたは送信者ごとに分離されたセッションのためのマルチエージェントルーティング
- OAuth 経由の Anthropic および OpenAI のサブスクリプション認証
- セッション: 直接チャットは共有 `main` に折りたたまれます。グループが孤立している
- メンションベースのアクティベーションによるグループチャットサポート
- 画像、音声、ドキュメントのメディアサポート
- オプションの音声メモ書き起こしフック
- WebChat および macOS メニュー バー アプリ
- ペアリング、キャンバス、カメラ、画面録画、位置情報、音声機能を備えた iOS ノード
- ペアリング付き Android ノード、「接続」タブ、チャット セッション、音声タブ、キャンバス/カメラ、デバイス、通知、連絡先/カレンダー、モーション、写真、SMS コマンド

<Note>
従来の Claude、Codex、Gemini、および Opencode パスは削除されました。パイだけだよ
コーディングエージェントのパス。
</Note>
