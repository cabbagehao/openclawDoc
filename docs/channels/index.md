---
summary: "OpenClaw が接続できるメッセージングプラットフォーム"
read_when:
  - OpenClaw用のチャットチャンネルを選択したい場合
  - サポートされているメッセージングプラットフォームの概要が必要な場合
title: "Chat Channels"
seoTitle: "OpenClawのチャットチャンネル連携の一覧と選び方・導入比較ガイド"
description: "OpenClaw が接続できるチャットチャンネルの一覧ページです。各メッセージングプラットフォームの特徴と対応範囲を比較できます。"
---
OpenClaw は、すでに使っているチャットアプリの上で会話できます。各チャンネルはゲートウェイ経由で接続されます。テキストはすべてのチャンネルで利用できますが、メディアやリアクションの対応状況はチャンネルごとに異なります。

## サポートされているチャンネル

- [BlueBubbles](/channels/bluebubbles) — **iMessage には推奨**。BlueBubbles の macOS サーバー REST API を使い、編集、送信取り消し、エフェクト、リアクション、グループ管理まで含めて広く対応しています。なお、編集機能は現在 macOS 26 Tahoe では動作しません。
- [Discord](/channels/discord) — Discord Bot API と Gateway を利用します。サーバー、チャンネル、DM に対応しています。
- [Feishu](/channels/feishu) — WebSocket 経由の Feishu/Lark ボットです。プラグインとして別途インストールします。
- [Google Chat](/channels/googlechat) — HTTP webhook 経由で動作する Google Chat API アプリです。
- [iMessage (レガシー)](/channels/imessage) — `imsg` CLI を使う従来の macOS 連携です。非推奨のため、新規構成では BlueBubbles の利用を推奨します。
- [IRC](/channels/irc) — 従来型の IRC サーバーに対応します。チャンネルと DM の両方を扱え、ペアリングや allowlist による制御もできます。
- [LINE](/channels/line) — LINE Messaging API ボットです。プラグインとして別途インストールします。
- [Matrix](/channels/matrix) — Matrix プロトコル対応です。プラグインとして別途インストールします。
- [Mattermost](/channels/mattermost) — Bot API と WebSocket を使います。チャンネル、グループ、DM に対応しています。プラグインとして別途インストールします。
- [Microsoft Teams](/channels/msteams) — Bot Framework ベースで、エンタープライズ向けの利用を想定しています。プラグインとして別途インストールします。
- [Nextcloud Talk](/channels/nextcloud-talk) — Nextcloud Talk を使うセルフホスト型チャットです。プラグインとして別途インストールします。
- [Nostr](/channels/nostr) — NIP-04 ベースの分散型 DM に対応します。プラグインとして別途インストールします。
- [Signal](/channels/signal) — `signal-cli` ベースで、プライバシー重視の運用に向いています。
- [Synology Chat](/channels/synology-chat) — 送受信 webhook を使う Synology NAS Chat 連携です。プラグインとして別途インストールします。
- [Slack](/channels/slack) — Bolt SDK ベースで、ワークスペースアプリとして動作します。
- [Telegram](/channels/telegram) — grammY 経由の Bot API を使い、グループにも対応しています。
- [Tlon](/channels/tlon) — Urbit ベースのメッセンジャーです。プラグインとして別途インストールします。
- [Twitch](/channels/twitch) — IRC 接続経由で Twitch チャットに参加します。プラグインとして別途インストールします。
- [WebChat](/web/webchat) — WebSocket 経由で動作するゲートウェイの WebChat UI です。
- [WhatsApp](/channels/whatsapp) — 最も利用者の多いチャンネルです。Baileys を使い、QR ペアリングが必要です。
- [Zalo](/channels/zalo) — Zalo Bot API 対応です。ベトナムで広く使われているメッセンジャーです。プラグインとして別途インストールします。
- [Zalo Personal](/channels/zalouser) — QR ログインを使う Zalo 個人アカウント連携です。プラグインとして別途インストールします。

## 注意事項

- 複数のチャンネルは同時に有効化できます。複数設定した場合でも、OpenClaw はチャットごとに適切にルーティングします。
- 最も手早く始めやすいのは通常 **Telegram** です。ボットトークンだけで始めやすいためです。WhatsApp は QR ペアリングが必要で、ディスク上に保持する状態も多くなります。
- グループの挙動はチャンネルごとに異なります。詳しくは [Groups](/channels/groups) を参照してください。
- DM のペアリングと allowlist は安全のため必須です。詳しくは [Security](/gateway/security) を参照してください。
- トラブルシューティングは [Channel troubleshooting](/channels/troubleshooting) を参照してください。
- モデルプロバイダーについては別ページで説明しています。[Model Providers](/providers/models) を参照してください。
