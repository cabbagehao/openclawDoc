---
summary: "Synology Chat webhook のセットアップと OpenClaw 構成"
read_when:
  - OpenClaw で Synology Chat をセットアップする場合
  - Synology Chat webhook ルーティングをデバッグする場合
title: "Synology Chat"
seoTitle: "OpenClawでSynology Chat webhook連携を設定する方法"
description: "Synology Chat webhook を使って OpenClaw を接続する設定ガイドです。送受信 webhook の役割、プラグイン構成、返信フローを確認できます。"
x-i18n:
  source_hash: "65cdf3be3fbf0652e201428d71e0ebd00dc6ab41f7e54c60b8f8019b4aeb12cf"
---
ステータス: Synology Chat webhook を使用したダイレクトメッセージチャネルとして、プラグイン経由でサポートされています。
このプラグインは、Synology Chat の送信（Outgoing）webhook からのインバウンドメッセージを受け取り、Synology Chat の受信（Incoming）webhook を介して返信を送信します。

## プラグインが必要

Synology Chat はプラグインベースであり、デフォルトのコアチャネルには含まれていません。

ローカルチェックアウトからインストールする場合:

```bash
openclaw plugins install ./extensions/synology-chat
```

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ

1. Synology Chat プラグインをインストールして有効にします。
2. Synology Chat の「統合」設定で以下の操作を行います:
   - **受信（Incoming）webhook** を作成し、その URL をコピーします。
   - **送信（Outgoing）webhook** を作成し、トークンをコピーします。
3. 送信 webhook の URL を OpenClaw ゲートウェイに向けます:
   - デフォルト: `https://gateway-host/webhook/synology`
   - または、カスタム設定した `channels.synology-chat.webhookPath`。
4. OpenClaw の `channels.synology-chat` セクションを構成します。
5. ゲートウェイを再起動し、Synology Chat ボットにメッセージを送信します。

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

デフォルトアカウントでは、環境変数を使用することもできます:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (カンマ区切り)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

構成ファイル内の値は、環境変数を上書きします。

## DM ポリシーとアクセス制御

- 推奨設定は `dmPolicy: "allowlist"` です。
- `allowedUserIds` には、Synology のユーザー ID のリスト（またはカンマ区切りの文字列）を指定します。
- `allowlist` モードで `allowedUserIds` が空の場合、構成エラーとみなされ webhook ルートは開始されません（全員を許可する場合は `dmPolicy: "open"` を使用してください）。
- `dmPolicy: "open"` はすべての送信者を許可します。
- `dmPolicy: "disabled"` は DM をブロックします。
- ペアリング承認は以下のコマンドで操作できます:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## アウトバウンド配信

数値形式の Synology Chat ユーザー ID をターゲットとして使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "OpenClaw からのメッセージです"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "再送テスト"
```

メディア送信は、URL ベースのファイル配信としてサポートされています。

## マルチアカウント

`channels.synology-chat.accounts` 配下で、複数の Synology Chat アカウントを運用できます。
各アカウントでトークン、受信 URL、webhook パス、DM ポリシー、制限値を上書き可能です。

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

## セキュリティに関する注意

- `token` は秘密に保ち、漏洩した場合は速やかにローテーションしてください。
- 自己署名の NAS 証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` のままにしてください。
- インバウンドの webhook リクエストはトークンで検証され、送信者ごとにレート制限が適用されます。
- 本番環境では `dmPolicy: "allowlist"` の使用を推奨します。
