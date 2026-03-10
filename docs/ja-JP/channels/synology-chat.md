---
summary: "Synology Chat Webhook のセットアップと OpenClaw 設定"
read_when:
  - OpenClaw を使用した Synology Chat のセットアップ
  - Synology Chat Webhook ルーティングのデバッグ
title: "Synology チャット"
x-i18n:
  source_hash: "65cdf3be3fbf0652e201428d71e0ebd00dc6ab41f7e54c60b8f8019b4aeb12cf"
---

# Synology Chat (プラグイン)

ステータス: Synology Chat Webhook を使用したダイレクト メッセージ チャネルとしてプラグイン経由でサポートされています。
プラグインは、Synology Chat 発信 Webhook からの受信メッセージを受け入れ、応答を送信します。
Synology Chat の受信 Webhook を通じて。

## プラグインが必要です

Synology Chat はプラグインベースであり、デフォルトのコア チャネル インストールの一部ではありません。

ローカル チェックアウトからインストールします。

```bash
openclaw plugins install ./extensions/synology-chat
```

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ

1. Synology Chat プラグインをインストールして有効にします。
2. Synology Chat 統合の場合:
   - 受信 Webhook を作成し、その URL をコピーします。
   - シークレット トークンを使用して送信 Webhook を作成します。
3. 送信 Webhook URL を OpenClaw ゲートウェイに向けます。
   - デフォルトでは `https://gateway-host/webhook/synology`。
   - またはカスタム `channels.synology-chat.webhookPath`。
4. OpenClaw で `channels.synology-chat` を構成します。
5. ゲートウェイを再起動し、Synology Chat ボットに DM を送信します。

最小限の構成:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 環境変数

デフォルトのアカウントの場合は、環境変数を使用できます。

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (カンマ区切り)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

構成値は環境変数をオーバーライドします。

## DM ポリシーとアクセス制御- `dmPolicy: "allowlist"` が推奨されるデフォルトです

- `allowedUserIds` は、Synology ユーザー ID のリスト (またはカンマ区切りの文字列) を受け入れます。
- `allowlist` モードでは、空の `allowedUserIds` リストは構成ミスとして扱われ、Webhook ルートは開始されません (allow-all には `dmPolicy: "open"` を使用します)。
- `dmPolicy: "open"` は任意の送信者を許可します。
- `dmPolicy: "disabled"` は DM をブロックします。
- ペアリングの承認は以下と連携します。
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## アウトバウンド配送

数値の Synology Chat ユーザー ID をターゲットとして使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

メディア送信は、URL ベースのファイル配信によってサポートされます。

## マルチアカウント

複数の Synology Chat アカウントは `channels.synology-chat.accounts` でサポートされています。
各アカウントは、トークン、受信 URL、Webhook パス、DM ポリシー、および制限をオーバーライドできます。

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## セキュリティに関する注意事項

- `token` は秘密にし、漏洩した場合はローテーションします。
- 自己署名ローカル NAS 証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` を保持します。
- 受信 Webhook リクエストはトークン検証され、送信者ごとにレートが制限されます。
- 本番環境では `dmPolicy: "allowlist"` を優先します。
