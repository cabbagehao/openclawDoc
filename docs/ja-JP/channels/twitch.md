---
summary: "Twitch チャットボットの構成とセットアップ"
read_when:
  - OpenClaw 用の Twitch チャット統合のセットアップ
title: "けいれん"
x-i18n:
  source_hash: "4fa7daa11d1e5ed43c9a8f9f7092809bf2c643838fc5b0c8df27449e430796dc"
---

# Twitch (プラグイン)

IRC 接続を介した Twitch チャットのサポート。 OpenClaw は、Twitch ユーザー (ボット アカウント) として接続し、チャネル内でメッセージを送受信します。

## プラグインが必要です

Twitch はプラグインとして出荷され、コア インストールにはバンドルされていません。

CLI (npm レジストリ) 経由でインストールします。

```bash
openclaw plugins install @openclaw/twitch
```

ローカル チェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/twitch
```

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. ボット専用の Twitch アカウントを作成します (または既存のアカウントを使用します)。
2. 認証情報を生成します: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **ボット トークン**を選択します
   - スコープ `chat:read` および `chat:write` が選択されていることを確認します
   - **クライアント ID** と **アクセス トークン** をコピーします。
3. Twitch ユーザー ID を見つけます: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. トークンを構成します。
   - 環境: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (デフォルトアカウントのみ)
   - または構成: `channels.twitch.accessToken`
   - 両方が設定されている場合、config が優先されます (env fallback はデフォルトアカウントのみです)。
5. ゲートウェイを起動します。

**⚠️ 重要:** アクセス制御 (`allowFrom` または `allowedRoles`) を追加して、権限のないユーザーがボットをトリガーできないようにします。 `requireMention` のデフォルトは `true` です。

最小限の構成:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## それは何ですか- ゲートウェイが所有する Twitch チャンネル

- 決定的なルーティング: 返信は常に Twitch に返されます。
- 各アカウントは、分離されたセッション キー `agent:<agentId>:twitch:<accountName>` にマッピングされます。
- `username` はボットのアカウント (認証者)、`channel` は参加するチャット ルームです。

## セットアップ (詳細)

### 認証情報を生成する

[Twitch トークン ジェネレーター](https://twitchtokengenerator.com/) を使用します。

- **ボット トークン**を選択します
- スコープ `chat:read` および `chat:write` が選択されていることを確認します
- **クライアント ID** と **アクセス トークン** をコピーします。

手動でアプリを登録する必要はありません。トークンは数時間後に期限切れになります。

### ボットを構成する

**環境変数 (デフォルトアカウントのみ):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**または設定:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

env と config の両方が設定されている場合は、config が優先されます。

### アクセス制御 (推奨)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

ハード ホワイトリストには `allowFrom` を優先します。ロールベースのアクセスが必要な場合は、代わりに `allowedRoles` を使用してください。

**利用可能なロール:** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

**ユーザー ID を使用する理由** ユーザー名は変更される可能性があり、なりすましが可能になります。ユーザー ID は永続的です。

Twitch ユーザー ID を見つけます: [https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/) (Twitch ユーザー名を ID に変換します)

## トークンのリフレッシュ (オプション)[Twitch Token Generator](https://twitchtokengenerator.com/) からのトークンは自動的に更新できません。期限が切れると再生成されます

トークンを自動更新するには、[Twitch 開発者コンソール](https://dev.twitch.tv/console) で独自の Twitch アプリケーションを作成し、構成に追加します。

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

ボットは有効期限が切れる前にトークンを自動的に更新し、更新イベントをログに記録します。

## マルチアカウントのサポート

アカウントごとのトークンでは `channels.twitch.accounts` を使用します。共有パターンについては、[`gateway/configuration`](/gateway/configuration) を参照してください。

例 (2 つのチャネルに 1 つのボット アカウント):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**注意:** 各アカウントには独自のトークンが必要です (チャネルごとに 1 つのトークン)。

## アクセス制御

### 役割ベースの制限

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### ユーザー ID による許可リスト (最も安全)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### ロールベースのアクセス (代替)

`allowFrom` はハード ホワイトリストです。設定すると、それらのユーザー ID のみが許可されます。
ロールベースのアクセスが必要な場合は、`allowFrom` を未設定のままにし、代わりに `allowedRoles` を構成します。

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### @メンション要件を無効にする

デフォルトでは、`requireMention` は `true` です。すべてのメッセージを無効にして応答するには:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## トラブルシューティング

まず、診断コマンドを実行します。

```bash
openclaw doctor
openclaw channels status --probe
```

### ボットがメッセージに応答しません

**アクセス制御を確認してください:** ユーザー ID が `allowFrom` であることを確認するか、一時的に削除してください
`allowFrom` を指定し、`allowedRoles: ["all"]` をテストに設定します。**ボットがチャネルに存在することを確認してください:** ボットは、`channel` で指定されたチャネルに参加する必要があります。

### トークンの問題

**「接続に失敗しました」または認証エラー:**

- `accessToken` が OAuth アクセス トークン値であることを確認します (通常は `oauth:` プレフィックスで始まります)
- トークンのスコープが `chat:read` および `chat:write` であることを確認してください
- トークンのリフレッシュを使用する場合は、`clientSecret` と `refreshToken` が設定されていることを確認してください

### トークンの更新が機能しない

**更新イベントのログを確認します:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

「トークンの更新が無効になっています (更新トークンなし)」と表示される場合:

- `clientSecret` が提供されていることを確認してください
- `refreshToken` が提供されていることを確認してください

## 構成

**アカウント構成:**

- `username` - ボットのユーザー名
- `accessToken` - `chat:read` および `chat:write` の OAuth アクセス トークン
- `clientId` - Twitch クライアント ID (トークン ジェネレーターまたはアプリから)
- `channel` - 参加するチャンネル (必須)
- `enabled` - このアカウントを有効にします (デフォルト: `true`)
- `clientSecret` - オプション: 自動トークン更新用
- `refreshToken` - オプション: 自動トークン更新用
- `expiresIn` - 秒単位のトークンの有効期限
- `obtainmentTimestamp` - トークン取得のタイムスタンプ
- `allowFrom` - ユーザー ID 許可リスト
- `allowedRoles` - 役割ベースのアクセス制御 (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @メンションが必要 (デフォルト: `true`)

**プロバイダー オプション:**- `channels.twitch.enabled` - チャネルの起動を有効/無効にします

- `channels.twitch.username` - ボットのユーザー名 (簡素化された単一アカウント構成)
- `channels.twitch.accessToken` - OAuth アクセス トークン (簡素化された単一アカウント構成)
- `channels.twitch.clientId` - Twitch クライアント ID (簡素化された単一アカウント構成)
- `channels.twitch.channel` - 参加するチャネル (簡素化された単一アカウント構成)
- `channels.twitch.accounts.<accountName>` - マルチアカウント構成 (上記のすべてのアカウント フィールド)

完全な例:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## ツールのアクション

エージェントは、アクションを使用して `twitch` を呼び出すことができます。

- `send` - チャネルにメッセージを送信します

例:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 安全性と運用

- **トークンをパスワードのように扱う** - トークンを git にコミットしないでください
- **長時間実行されるボットには自動トークン更新を使用します**
- **アクセス制御にはユーザー名の代わりにユーザー ID ホワイトリストを使用します**
- **ログを監視**してトークン更新イベントと接続ステータスを確認します
- **スコープ トークンは最小限** - `chat:read` および `chat:write` のみをリクエストします
- **スタックした場合**: 他のプロセスがセッションを所有していないことを確認した後、ゲートウェイを再起動します。

## 制限

- メッセージあたり **500 文字** (単語境界で自動チャンク化)
- チャンク化の前にマークダウンが削除されます
- レート制限なし (Twitch の組み込みレート制限を使用)
