---
summary: "OpenClawが接続できるメッセージングプラットフォーム"
read_when:
  - OpenClaw用のチャットチャンネルを選択したい場合
  - サポートされているメッセージングプラットフォームの概要が必要な場合
title: "チャットチャンネル"
---

# チャットチャンネル

OpenClawは、すでに使用している任意のチャットアプリで会話できます。各チャンネルはGateway経由で接続します。
テキストはすべての場所でサポートされています。メディアとリアクションはチャンネルによって異なります。

## サポートされているチャンネル

- [BlueBubbles](/channels/bluebubbles) — **iMessage推奨**; BlueBubbles macOSサーバーREST APIを使用し、フル機能をサポート（編集、送信取り消し、エフェクト、リアクション、グループ管理 — 編集は現在macOS 26 Tahoeで動作しません）
- [Discord](/channels/discord) — Discord Bot API + Gateway; サーバー、チャンネル、DMをサポート
- [Feishu](/channels/feishu) — WebSocket経由のFeishu/Larkボット（プラグイン、別途インストール）
- [Google Chat](/channels/googlechat) — HTTPウェブフック経由のGoogle Chat APIアプリ
- [iMessage (レガシー)](/channels/imessage) — imsg CLI経由のレガシーmacOS統合（非推奨、新規セットアップにはBlueBubblesを使用）
- [IRC](/channels/irc) — クラシックIRCサーバー; ペアリング/許可リスト制御付きのチャンネル + DM
- [LINE](/channels/line) — LINE Messaging APIボット（プラグイン、別途インストール）
- [Matrix](/channels/matrix) — Matrixプロトコル（プラグイン、別途インストール）
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; チャンネル、グループ、DM（プラグイン、別途インストール）
- [Microsoft Teams](/channels/msteams) — Bot Framework; エンタープライズサポート（プラグイン、別途インストール）
- [Nextcloud Talk](/channels/nextcloud-talk) — Nextcloud Talk経由のセルフホスト型チャット（プラグイン、別途インストール）
- [Nostr](/channels/nostr) — NIP-04経由の分散型DM（プラグイン、別途インストール）
- [Signal](/channels/signal) — signal-cli; プライバシー重視
- [Synology Chat](/channels/synology-chat) — 送信+受信ウェブフック経由のSynology NAS Chat（プラグイン、別途インストール）
- [Slack](/channels/slack) — Bolt SDK; ワークスペースアプリ
- [Telegram](/channels/telegram) — grammY経由のBot API; グループをサポート
- [Tlon](/channels/tlon) — Urbitベースのメッセンジャー（プラグイン、別途インストール）
- [Twitch](/channels/twitch) — IRC接続経由のTwitchチャット（プラグイン、別途インストール）
- [WebChat](/web/webchat) — WebSocket経由のGateway WebChat UI
- [WhatsApp](/channels/whatsapp) — 最も人気; Baileysを使用し、QRペアリングが必要
- [Zalo](/channels/zalo) — Zalo Bot API; ベトナムの人気メッセンジャー（プラグイン、別途インストール）
- [Zalo Personal](/channels/zalouser) — QRログイン経由のZalo個人アカウント（プラグイン、別途インストール）

## 注意事項

- チャンネルは同時に実行可能。複数を設定すると、OpenClawがチャットごとにルーティングします
- 最速のセットアップは通常**Telegram**（シンプルなボットトークン）。WhatsAppはQRペアリングが必要で、ディスク上により多くの状態を保存します
- グループの動作はチャンネルによって異なります。[グループ](/channels/groups)を参照してください
- DMペアリングと許可リストは安全のために強制されます。[セキュリティ](/gateway/security)を参照してください
- トラブルシューティング: [チャンネルトラブルシューティング](/channels/troubleshooting)
- モデルプロバイダーは別途文書化されています。[モデルプロバイダー](/providers/models)を参照してください
