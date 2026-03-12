---
summary: "Twitch チャットボットの構成とセットアップ"
read_when:
  - OpenClaw に Twitch チャット連携を導入する場合
title: "Twitch"
x-i18n:
  source_hash: "4fa7daa11d1e5ed43c9a8f9f7092809bf2c643838fc5b0c8df27449e430796dc"
---
IRC 接続を介した Twitch チャットのサポートです。OpenClaw は Twitch ユーザー（ボットアカウント）として接続し、指定したチャネルでメッセージの送受信を行います。

## プラグインが必要

Twitch はプラグインとして提供されており、コアインストールには同梱されていません。

CLI (npm レジストリ) 経由でインストールします:

```bash
openclaw plugins install @openclaw/twitch
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/twitch
```

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. ボット用の専用 Twitch アカウントを作成します（既存のアカウントを使用することも可能です）。
2. 認証情報を生成します: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token** を選択します。
   - スコープに `chat:read` と `chat:write` が含まれていることを確認します。
   - **Client ID** と **Access Token** をコピーします。
3. Twitch ユーザー ID を確認します: [ユーザー ID 変換ツール](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. トークンを構成します:
   - 環境変数: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (デフォルトアカウントのみ)
   - 構成ファイル: `channels.twitch.accessToken`
   - 両方が設定されている場合は構成ファイルが優先されます（環境変数はデフォルトアカウントにのみ適用されます）。
5. ゲートウェイを起動します。

**⚠️ 重要:** 未承認のユーザーがボットを操作できないよう、アクセス制御（`allowFrom` または `allowedRoles`）を設定してください。`requireMention` はデフォルトで `true` です。

最小限の構成:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // ボットの Twitch アカウント名
      accessToken: "oauth:abc123...", // OAuth アクセストークン（または環境変数 OPENCLAW_TWITCH_ACCESS_TOKEN を使用）
      clientId: "xyz789...", // Token Generator から取得した Client ID
      channel: "vevisk", // 参加する Twitch チャネルのチャット（必須）
      allowFrom: ["123456789"], // (推奨) 自身の Twitch ユーザー ID。上記ツールで確認してください。
    },
  },
}
```

## Twitch チャネルの概要

- ゲートウェイが所有する Twitch チャネルです。
- 確定的なルーティング: 返信は常にメッセージが届いた Twitch チャットに送信されます。
- 各アカウントは個別のセッションキー `agent:<agentId>:twitch:<accountName>` にマッピングされます。
- `username` は認証に使用するボットのアカウント名、`channel` は参加するチャットルーム名です。

## 詳細セットアップ

### 認証情報の生成

[Twitch Token Generator](https://twitchtokengenerator.com/) を使用します:

- **Bot Token** を選択します。
- スコープ `chat:read` および `chat:write` が選択されていることを確認します。
- **Client ID** と **Access Token** をコピーします。

手動でのアプリ登録は不要です。トークンは数時間で期限切れになります。

### ボットの構成

**環境変数 (デフォルトアカウントのみ):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**構成ファイル:**

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

環境変数と構成ファイルの両方が設定されている場合、構成ファイルが優先されます。

### アクセス制御 (推奨)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (推奨) 特定の Twitch ユーザー ID のみを許可
    },
  },
}
```

厳格な許可リストには `allowFrom` を使用してください。ロール（役割）ベースのアクセスが必要な場合は、代わりに `allowedRoles` を使用します。

**利用可能なロール:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`。

**なぜユーザー ID なのか？** ユーザー名は変更可能で、なりすましのリスクがあります。ユーザー ID は不変です。

Twitch ユーザー ID の確認: [Twitch ユーザー名を ID に変換](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/)

## トークンの更新 (オプション)

[Twitch Token Generator](https://twitchtokengenerator.com/) で生成されたトークンは自動更新できません。期限が切れたら再生成してください。

自動更新が必要な場合は、[Twitch Developer Console](https://dev.twitch.tv/console) で自身の Twitch アプリケーションを作成し、以下を構成に追加してください:

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

ボットは期限が切れる前に自動的にトークンを更新し、そのイベントをログに記録します。

## マルチアカウントのサポート

`channels.twitch.accounts` を使用して、アカウントごとにトークンを設定できます。共通のパターンについては [`gateway/configuration`](/gateway/configuration) を参照してください。

構成例 (1 つのボットアカウントで 2 つのチャネルに参加する場合):

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

**注意:** 各アカウント（チャネルごと）に個別のトークンが必要です。

## アクセス制御の詳細

### ロールベースの制限

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

`allowFrom` を設定すると、そのユーザー ID のみが許可される厳格なリストになります。
ロールベースのアクセスを行いたい場合は、`allowFrom` を未設定にし、`allowedRoles` を構成してください。

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

### @メンション要件の無効化

デフォルトでは `requireMention` は `true` です。これを無効にしてすべてのメッセージに応答させるには以下のように設定します:

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

まず、以下の診断コマンドを実行してください:

```bash
openclaw doctor
openclaw channels status --probe
```

### ボットがメッセージに反応しない

**アクセス制御を確認:** 自身のユーザー ID が `allowFrom` に含まれているか確認してください。テストとして一時的に `allowFrom` を削除し、`allowedRoles: ["all"]` に設定してみてください。

**ボットがチャネルに参加しているか確認:** ボットは `channel` 設定で指定されたチャネルに参加している必要があります。

### トークンの問題

**「Failed to connect」や認証エラー:**

- `accessToken` が OAuth アクセストークンの値（通常 `oauth:` プレフィックスで始まる）であることを確認してください。
- トークンに `chat:read` と `chat:write` のスコープが付与されているか確認してください。
- 自動更新を使用している場合は、`clientSecret` と `refreshToken` が設定されているか確認してください。

### トークンの更新が動作しない

**ログで更新イベントを確認:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

「token refresh disabled (no refresh token)」と表示される場合:

- `clientSecret` が提供されているか確認してください。
- `refreshToken` が提供されているか確認してください。

## 構成リファレンス

**アカウント設定:**

- `username` - ボットのユーザー名
- `accessToken` - `chat:read` と `chat:write` を持つ OAuth アクセストークン
- `clientId` - Twitch Client ID (Token Generator または自身のアプリから)
- `channel` - 参加するチャネル（必須）
- `enabled` - このアカウントを有効化（デフォルト: `true`）
- `clientSecret` - オプション: トークン自動更新用
- `refreshToken` - オプション: トークン自動更新用
- `expiresIn` - トークンの有効期限（秒）
- `obtainmentTimestamp` - トークン取得時のタイムスタンプ
- `allowFrom` - ユーザー ID の許可リスト
- `allowedRoles` - ロールベースのアクセス制御 (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @メンションを必須にする（デフォルト: `true`）

**プロバイダーオプション:**

- `channels.twitch.enabled` - チャネルの起動を有効/無効にします。
- `channels.twitch.username` - ボットのユーザー名（単一アカウント用の簡略設定）
- `channels.twitch.accessToken` - OAuth アクセストークン（単一アカウント用の簡略設定）
- `channels.twitch.clientId` - Twitch Client ID（単一アカウント用の簡略設定）
- `channels.twitch.channel` - 参加するチャネル（単一アカウント用の簡略設定）
- `channels.twitch.accounts.<accountName>` - マルチアカウント設定（上記のアカウント設定項目すべて）

完全な構成例:

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

## ツールアクション

エージェントは `twitch` を呼び出して以下の操作が可能です:

- `send` - チャネルにメッセージを送信します。

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

## セキュリティと運用

- **トークンはパスワードと同様に扱う** - 決して Git 等にコミットしないでください。
- 長時間運用するボットには **トークンの自動更新** を使用してください。
- アクセス制御にはユーザー名ではなく **ユーザー ID の許可リスト** を使用してください。
- トークンの更新イベントや接続ステータスをログで監視してください。
- トークンのスコープは最小限（`chat:read` と `chat:write` のみ）に留めてください。
- **動作が不安定な場合**: 他のプロセスがセッションを所有していないことを確認し、ゲートウェイを再起動してください。

## 制限事項

- 1 メッセージあたり **500 文字**（単語の境界で自動的に分割されます）。
- Markdown は分割前に除去されます。
- 独自のレート制限はありません（Twitch の組み込み制限に従います）。
