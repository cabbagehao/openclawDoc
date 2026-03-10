---
summary: "Feishuボットの概要、特徴、構成"
read_when:
  - フェイシュ/ラークボットを接続したい
  - Feishu チャンネルを設定しています
title: "フェイシュ"
x-i18n:
  source_hash: "da86292f422fef1945309c89a6daa5768974284a936778f082c085d40acc0f52"
---

# フェイシュボット

Feishu (Lark) は、企業がメッセージングやコラボレーションに使用するチーム チャット プラットフォームです。このプラグインは、プラットフォームの WebSocket イベント サブスクリプションを使用して OpenClaw を Feishu/Lark ボットに接続するため、パブリック Webhook URL を公開せずにメッセージを受信できます。

---

## バンドルされたプラグイン

Feishu は現在の OpenClaw リリースにバンドルされて出荷されるため、個別のプラグインをインストールする必要はありません
が必要です。

バンドルが含まれていない古いビルドまたはカスタム インストールを使用している場合
フェイシュ、手動でインストールします。

```bash
openclaw plugins install @openclaw/feishu
```

---

## クイックスタート

Feishu チャンネルを追加するには 2 つの方法があります。

### 方法 1: オンボーディング ウィザード (推奨)

OpenClaw をインストールしたばかりの場合は、ウィザードを実行します。

```bash
openclaw onboard
```

ウィザードの手順は次のとおりです。

1.Feishuアプリの作成と認証情報の収集 2. OpenClaw でのアプリ認証情報の構成 3. ゲートウェイの起動

✅ **構成後**、ゲートウェイのステータスを確認します。

- `openclaw gateway status`
- `openclaw logs --follow`

### 方法 2: CLI セットアップ

初期インストールがすでに完了している場合は、CLI 経由でチャネルを追加します。

```bash
openclaw channels add
```

**Feishu** を選択し、アプリ ID とアプリ シークレットを入力します。

✅ **構成後**、ゲートウェイを管理します。

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## ステップ 1: Feishu アプリを作成する

### 1. フェイシュオープンプラットフォームをオープンする

[Feishu Open Platform](https://open.feishu.cn/app) にアクセスしてサインインします。Lark (グローバル) テナントは [https://open.larksuite.com/app](https://open.larksuite.com/app) を使用し、Feishu 構成で `domain: "lark"` を設定する必要があります。

### 2. アプリを作成する

1. [**エンタープライズ アプリの作成**] をクリックします。
2. アプリ名と説明を入力します
3. アプリのアイコンを選択します

![エンタープライズ アプリの作成](../../images/feishu-step2-create-app.png)

### 3. 認証情報をコピーする

**認証情報と基本情報** から、次をコピーします。

- **アプリID** (形式: `cli_xxx`)
- **アプリの秘密**

❗ **重要:** App Secret は非公開にしてください。

![資格情報を取得](../../images/feishu-step3-credentials.png)

### 4. 権限を構成する

**権限** で、**バッチインポート** をクリックし、以下を貼り付けます。

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![権限の構成](../../images/feishu-step4-permissions.png)

### 5. ボット機能を有効にする

**アプリの機能** > **ボット**:

1. ボット機能を有効にする2.ボット名を設定する

![ボット機能を有効にする](../../images/feishu-step5-bot-capability.png)

### 6. イベントのサブスクリプションを構成する

⚠️ **重要:** イベントのサブスクリプションを設定する前に、次のことを確認してください。

1. フェイシュウに対して `openclaw channels add` をすでに実行しています
2. ゲートウェイが実行中 (`openclaw gateway status`)

**イベント サブスクリプション**:

1. **イベントの受信に長い接続を使用** (WebSocket) を選択します。
2. イベントを追加します: `im.message.receive_v1`

⚠️ ゲートウェイが実行されていない場合、長時間接続の設定の保存に失敗する可能性があります。

![イベント サブスクリプションの構成](../../images/feishu-step6-event-subscription.png)

### 7. アプリを公開する1. **バージョン管理とリリース**でバージョンを作成します

2. レビューのために送信して公開する
3. 管理者の承認を待ちます (エンタープライズ アプリは通常自動承認されます)。

---

## ステップ 2: OpenClaw を構成する

### ウィザードを使用して構成する (推奨)

```bash
openclaw channels add
```

**Feishu** を選択し、アプリ ID とアプリ シークレットを貼り付けます。

### 設定ファイル経由で設定する

`~/.openclaw/openclaw.json` を編集:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "My AI assistant",
        },
      },
    },
  },
}
```

`connectionMode: "webhook"` を使用する場合は、`verificationToken` を設定します。 Feishu Webhook サーバーはデフォルトで `127.0.0.1` にバインドされます。意図的に別のバインド アドレスが必要な場合にのみ、`webhookHost` を設定してください。

#### 検証トークン (Webhook モード)

Webhook モードを使用する場合は、構成で `channels.feishu.verificationToken` を設定します。値を取得するには:

1.Feishu Open Platformでアプリを開きます2. **開発** → **イベントとコールバック** (开发構成 → イベント与回调) に移動します。3. **暗号化** タブを開きます (加密策略) 4. **検証トークン**をコピーします

![検証トークンの場所](../../images/feishu-verification-token.png)

### 環境変数を使用して構成する

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark (グローバル) ドメイン

テナントが Lark (国際) にある場合は、ドメインを `lark` (または完全なドメイン文字列) に設定します。 `channels.feishu.domain` またはアカウントごと (`channels.feishu.accounts.<id>.domain`) で設定できます。

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### クォータ最適化フラグ

次の 2 つのオプションのフラグを使用して、Feishu API の使用量を減らすことができます。- `typingIndicator` (デフォルト `true`): `false` の場合、リアクション呼び出しの入力をスキップします。

- `resolveSenderNames` (デフォルト `true`): `false` の場合、送信者プロファイル検索呼び出しをスキップします。

最上位レベルまたはアカウントごとに設定します。

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## ステップ 3: 開始 + テスト

### 1. ゲートウェイを起動します

```bash
openclaw gateway
```

### 2. テストメッセージを送信する

Feishu でボットを見つけてメッセージを送信します。

### 3. ペアリングを承認する

デフォルトでは、ボットはペアリング コードを応答します。承認します:

```bash
openclaw pairing approve feishu <CODE>
```

承認後は通常通りチャットが可能です。

---

## 概要

- **フェイシュボットチャンネル**: ゲートウェイが管理するフェイシュボット
- **決定的なルーティング**: 返信は常にフェイシュに返されます。
- **セッション分離**: DM はメイン セッションを共有します。グループが孤立している
- **WebSocket 接続**: Feishu SDK 経由の長時間接続、パブリック URL は必要ありません

---

## アクセス制御

### ダイレクトメッセージ

- **デフォルト**: `dmPolicy: "pairing"` (不明なユーザーはペアリング コードを取得します)
- **ペアリングを承認**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **許可リスト モード**: `channels.feishu.allowFrom` を許可された Open ID で設定します

### グループチャット

**1.グループ ポリシー** (`channels.feishu.groupPolicy`):

- `"open"` = グループ内の全員を許可します (デフォルト)
- `"allowlist"` = `groupAllowFrom` のみを許可します
- `"disabled"` = グループ メッセージを無効にする

**2.言及要件** (`channels.feishu.groups.<chat_id>.requireMention`):- `true` = @メンションが必要 (デフォルト)

- `false` = 言及せずに応答する

---

## グループ構成例

### すべてのグループを許可、@mention が必要 (デフォルト)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // Default requireMention: true
    },
  },
}
```

### すべてのグループを許可します。@メンションは必要ありません

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_xxx: { requireMention: false },
      },
    },
  },
}
```

### 特定のグループのみを許可する

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Feishu group IDs (chat_id) look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### グループ内でメッセージを送信できる送信者を制限する (送信者許可リスト)

グループ自体を許可することに加えて、そのグループ内の **すべてのメッセージ** は送信者の open_id によってゲートされます。`groups.<chat_id>.allowFrom` にリストされているユーザーのみがメッセージを処理します。他のメンバーからのメッセージは無視されます (これは、/reset や /new のような制御コマンドだけでなく、完全な送信者レベルのゲートです)。

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu user IDs (open_id) look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## グループ/ユーザー ID を取得する

### グループ ID (chat_id)

グループ ID は `oc_xxx` のようになります。

**方法 1 (推奨)**

1. ゲートウェイを起動し、グループ内のボットを @メンションします
2. `openclaw logs --follow` を実行し、`chat_id` を探します。

**方法 2**

Feishu API デバッガーを使用してグループ チャットを一覧表示します。

### ユーザー ID (open_id)

ユーザー ID は `ou_xxx` のようになります。

**方法 1 (推奨)**

1. ゲートウェイを起動し、ボットに DM を送信します
2. `openclaw logs --follow` を実行し、`open_id` を探します。

**方法 2**

ユーザー Open ID のペアリング要求を確認します。

```bash
openclaw pairing list feishu
```

---

## 共通コマンド|コマンド |説明 |

| --------- | ----------------- |
| `/status` |ボットのステータスを表示 |
| `/reset` |セッションをリセットする |
| `/model` |モデルの表示/切り替え |

> 注: Feishu はまだネイティブ コマンド メニューをサポートしていないため、コマンドはテキストとして送信する必要があります。

## ゲートウェイ管理コマンド

| コマンド                   | 説明                                    |
| -------------------------- | --------------------------------------- |
| `openclaw gateway status`  | ゲートウェイのステータスを表示          |
| `openclaw gateway install` | ゲートウェイサービスのインストール/開始 |
| `openclaw gateway stop`    | ゲートウェイサービスを停止する          |
| `openclaw gateway restart` | ゲートウェイ サービスを再起動する       |
| `openclaw logs --follow`   | テールゲートウェイのログ                |

---

## トラブルシューティング

### グループチャットでボットが応答しません

1. ボットがグループに追加されていることを確認します
2. ボットを @メンションするようにしてください (デフォルトの動作)
3. `groupPolicy` が `"disabled"` に設定されていないことを確認します
4. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しません

1. アプリが公開および承認されていることを確認する
2. イベント サブスクリプションに `im.message.receive_v1` が含まれていることを確認します。
3. **長時間接続**が有効になっていることを確認します4.アプリの権限が完了していることを確認します
4. ゲートウェイが実行されていることを確認します: `openclaw gateway status`
5. ログを確認します: `openclaw logs --follow`

### アプリシークレットの漏洩

1.Feishu Open Platformでアプリのシークレットをリセットする 2. 構成内のアプリ シークレットを更新します。3. ゲートウェイを再起動します### メッセージ送信の失敗

1. アプリに `im:message:send_as_bot` 権限があることを確認します
2. アプリが公開されていることを確認します
3. ログで詳細なエラーを確認する

---

## 高度な構成

### 複数のアカウント

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` は、アウトバウンド API が `accountId` を明示的に指定しない場合に、どの Feishu アカウントが使用されるかを制御します。

### メッセージ制限

- `textChunkLimit`: 送信テキストのチャンク サイズ (デフォルト: 2000 文字)
- `mediaMaxMb`: メディアのアップロード/ダウンロード制限 (デフォルト: 30MB)

### ストリーミング

Feishu は、インタラクティブ カードを介したストリーミング返信をサポートしています。有効にすると、ボットはテキストを生成するときにカードを更新します。

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default true)
      blockStreaming: true, // enable block-level streaming (default true)
    },
  },
}
```

送信する前に完全な応答を待機するように `streaming: false` を設定します。

### マルチエージェントルーティング

Feishu DM またはグループを別のエージェントにルーティングするには、`bindings` を使用します。

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

ルーティングフィールド:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` または `"group"`
- `match.peer.id`: ユーザーオープン ID (`ou_xxx`) またはグループ ID (`oc_xxx`)

検索のヒントについては、[グループ/ユーザー ID の取得](#get-groupuser-ids) を参照してください。

---

## 構成リファレンス

フル構成: [ゲートウェイ構成](/gateway/configuration)

| 主なオプション:                                   | 設定                                         | 説明             | デフォルト |
| ------------------------------------------------- | -------------------------------------------- | ---------------- | ---------- | -------------------------- | ---------- | --------- |
| `channels.feishu.enabled`                         | チャンネルを有効/無効にする                  | `true`           |
| `channels.feishu.domain`                          | API ドメイン (`feishu` または `lark`)        | `feishu`         |
| `channels.feishu.connectionMode`                  | イベントトランスポートモード                 | `websocket`      |
| `channels.feishu.defaultAccount`                  | 送信ルーティングのデフォルトのアカウント ID  | `default`        |
| `channels.feishu.verificationToken`               | Webhook モードに必要                         | -                |
| `channels.feishu.webhookPath`                     | Webhook ルート パス                          | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook バインド ホスト                      | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook バインド ポート                      | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | アプリID                                     | -                |
| `channels.feishu.accounts.<id>.appSecret`         | アプリの秘密                                 | -                |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとの API ドメイン オーバーライド | `feishu`         |            | `channels.feishu.dmPolicy` | DMポリシー | `pairing` |
| `channels.feishu.allowFrom`                       | DM 許可リスト (open_id リスト)               | -                |
| `channels.feishu.groupPolicy`                     | グループポリシー                             | `open`           |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト                           | -                |
| `channels.feishu.groups.<chat_id>.requireMention` | @メンションが必要                            | `true`           |
| `channels.feishu.groups.<chat_id>.enabled`        | グループを有効にする                         | `true`           |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ                     | `2000`           |
| `channels.feishu.mediaMaxMb`                      | メディア サイズ制限                          | `30`             |
| `channels.feishu.streaming`                       | ストリーミング カード出力を有効にする        | `true`           |
| `channels.feishu.blockStreaming`                  | ブロックストリーミングを有効にする           | `true`           |

---

## dmPolicy リファレンス|値 |行動 |

| ------------- | -------------------------------------------------------------- |
| `"pairing"` | **デフォルト。** 不明なユーザーはペアリング コードを取得します。承認される必要があります |
| `"allowlist"` | `allowFrom` のユーザーのみがチャットできます |
| `"open"` |すべてのユーザーを許可します (allowFrom に `"*"` が必要です) |
| `"disabled"` | DM を無効にする |

---

## サポートされているメッセージ タイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト (投稿)
- ✅ 画像
- ✅ ファイル
- ✅ オーディオ
- ✅ ビデオ
- ✅ ステッカー

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ オーディオ
- ⚠️ リッチテキスト (部分的にサポート)
