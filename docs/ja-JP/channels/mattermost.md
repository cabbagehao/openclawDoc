---
summary: "Mattermost ボットのセットアップと OpenClaw 構成"
read_when:
  - Mattermost のセットアップ
  - Mattermost ルーティングのデバッグ
title: "Mattermost"
x-i18n:
  source_hash: "c1d43218b97fdaa30e8739287056151feeb88aace9b1787769a890f9cc5eca59"
---

# Mattermost (プラグイン)

ステータス: プラグイン経由でサポートされています (ボット トークン + WebSocket イベント)。チャネル、グループ、DM がサポートされています。
Mattermost は、自己ホスト可能なチーム メッセージング プラットフォームです。公式サイトを参照してください。
製品の詳細とダウンロードについては、[mattermost.com](https://mattermost.com) をご覧ください。

## プラグインが必要です

Mattermost はプラグインとして出荷され、コア インストールにはバンドルされていません。

CLI (npm レジストリ) 経由でインストールします。

```bash
openclaw plugins install @openclaw/mattermost
```

ローカル チェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/mattermost
```

構成/オンボーディング中に Mattermost を選択し、git チェックアウトが検出された場合、
OpenClaw はローカル インストール パスを自動的に提供します。

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ

1. Mattermost プラグインをインストールします。
2. Mattermost ボット アカウントを作成し、**ボット トークン**をコピーします。
3. Mattermost **ベース URL** (例: `https://chat.example.com`) をコピーします。
4. OpenClaw を設定し、ゲートウェイを起動します。

最小限の構成:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## ネイティブのスラッシュコマンド

ネイティブのスラッシュ コマンドはオプトインです。有効にすると、OpenClaw は `oc_*` スラッシュ コマンドを次のように登録します。
Mattermost API を使用し、ゲートウェイ HTTP サーバーでコールバック POST を受け取ります。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

注:- `native: "auto"` は、Mattermost に対してデフォルトで無効になっています。 `native: true` を有効に設定します。

- `callbackUrl` が省略された場合、OpenClaw はゲートウェイのホスト/ポート + `callbackPath` から派生します。
- マルチアカウント設定の場合、`commands` はトップレベル以下に設定できます。
  `channels.mattermost.accounts.<id>.commands` (アカウント値は最上位フィールドをオーバーライドします)。
- コマンド コールバックはコマンドごとのトークンで検証され、トークン チェックが失敗するとフェール クローズされます。
- 到達可能性の要件: コールバック エンドポイントは Mattermost サーバーから到達可能である必要があります。
  - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されていない限り、`callbackUrl` を `localhost` に設定しないでください。
  - URL が OpenClaw に `/api/channels/mattermost/command` をリバースプロキシする場合を除き、`callbackUrl` を Mattermost ベース URL に設定しないでください。
  - 簡単なチェックは `curl https://<gateway-host>/api/channels/mattermost/command` です。 GET は OpenClaw から `404` ではなく `405 Method Not Allowed` を返す必要があります。
- Mattermost 送信許可リストの要件:
  - コールバックがプライベート/テールネット/内部アドレスをターゲットとする場合は、Mattermost を設定します
    `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  - 完全な URL ではなく、ホスト/ドメイン エントリを使用します。
    - 良い: `gateway.tailnet-name.ts.net`
    - 悪い: `https://gateway.tailnet-name.ts.net`

## 環境変数 (デフォルトアカウント)

環境変数を使用する場合は、ゲートウェイ ホストでこれらを設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`環境変数は **デフォルト** アカウント (`default`) にのみ適用されます。他のアカウントは構成値を使用する必要があります。

## チャットモード

Mattermost は DM に自動的に応答します。チャネルの動作は `chatmode` によって制御されます。

- `oncall` (デフォルト): チャネルで @ メンションされた場合にのみ応答します。
- `onmessage`: すべてのチャネル メッセージに応答します。
- `onchar`: メッセージがトリガー プレフィックスで始まるときに応答します。

設定例:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

注:

- `onchar` は引き続き明示的な @メンションに応答します。
- `channels.mattermost.requireMention` はレガシー構成に優先されますが、`chatmode` が優先されます。

## アクセス制御 (DM)

- デフォルト: `channels.mattermost.dmPolicy = "pairing"` (不明な送信者はペアリング コードを取得します)。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- パブリック DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャンネル (グループ)

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"` (メンションゲート)。
- `channels.mattermost.groupAllowFrom` の送信者を許可リストに登録します (ユーザー ID を推奨)。
- `@username` マッチングは変更可能であり、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"` (メンションゲート)。
- ランタイムに関する注意: `channels.mattermost` が完全に欠落している場合、ランタイムはグループ チェックのために `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

## アウトバウンド配信のターゲット

`openclaw message send` または cron/webhook でこれらのターゲット形式を使用します。- チャネルの場合は `channel:<id>`

- `user:<id>` DMの場合
- `@username` DM (Mattermost API 経由で解決)

ベア ID はチャネルとして扱われます。

## リアクション（メッセージツール）

- `message action=react` を `channel=mattermost` と一緒に使用します。
- `messageId` は重要な投稿 ID です。
- `emoji` は、`thumbsup` や `:+1:` のような名前を受け入れます (コロンはオプションです)。
- 反応を削除するには、`remove=true` (ブール値) を設定します。
- 反応の追加/削除イベントは、システム イベントとしてルーティングされたエージェント セッションに転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

構成:

- `channels.mattermost.actions.reactions`: リアクションアクションを有効/無効にします (デフォルトは true)。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（メッセージツール）

クリック可能なボタンを使用してメッセージを送信します。ユーザーがボタンをクリックすると、エージェントは
を選択して対応することができます。

`inlineButtons` をチャネル機能に追加してボタンを有効にします。

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`message action=send` を `buttons` パラメーターとともに使用します。ボタンは 2D 配列 (ボタンの行) です。

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンフィールド:

- `text` (必須): 表示ラベル。
- `callback_data` (必須): クリック時に返される値 (アクション ID として使用)。
- `style` (オプション): `"default"`、`"primary"`、または `"danger"`。

ユーザーがボタンをクリックすると:1. すべてのボタンが確認行に置き換えられます (例: 「✓ **Yes** selected by @user」)。2. エージェントは選択内容を受信メッセージとして受信し、応答します。

注:

- ボタンのコールバックは HMAC-SHA256 検証を使用します (自動、構成は必要ありません)。
- Mattermost は API 応答 (セキュリティ機能) からコールバック データを削除するため、すべてのボタンが
  クリックすると削除されます。部分的な削除はできません。
- ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます。
  (Mattermostルーティングの制限)。

構成:

- `channels.mattermost.capabilities`: 機能文字列の配列。 `"inlineButtons"` を追加
  エージェント システム プロンプトでボタン ツールの説明を有効にします。
- `channels.mattermost.interactions.callbackBaseUrl`: ボタンのオプションの外部ベース URL
  コールバック (`https://gateway.example.com` など)。 Mattermost が使用できない場合にこれを使用します
  バインド ホストのゲートウェイに直接到達します。
- マルチアカウント設定では、同じフィールドを設定することもできます。
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`。
- `interactions.callbackBaseUrl` が省略された場合、OpenClaw はコールバック URL を次から取得します。
  `gateway.customBindHost` + `gateway.port` の場合、`http://localhost:<port>` に戻ります。
- 到達可能性ルール: ボタンのコールバック URL は Mattermost サーバーから到達可能である必要があります。
  `localhost` は、Mattermost と OpenClaw が同じホスト/ネットワーク名前空間で実行されている場合にのみ機能します。
- コールバック ターゲットがプライベート/テールネット/内部の場合、そのホスト/ドメインを Mattermost に追加します。
  `ServiceSettings.AllowedUntrustedInternalConnections`。### API の直接統合 (外部スクリプト)

外部スクリプトと Webhook は、Mattermost REST API を介してボタンを直接送信できます
エージェントの `message` ツールを使用する代わりに。 `buildButtonAttachments()` を使用します。
可能な場合は拡張子。生の JSON を投稿する場合は、次のルールに従ってください。

**ペイロード構造:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

**重要なルール:**

1. 添付ファイルは、トップレベルの `attachments` ではなく、`props.attachments` に格納されます (黙って無視されます)。
2. すべてのアクションには `type: "button"` が必要です。これがないと、クリックは黙って飲み込まれます。
3. すべてのアクションには `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクション `id` は **英数字のみ** (`[a-zA-Z0-9]`) である必要があります。ハイフンとアンダースコアの区切り
   Mattermost のサーバー側アクション ルーティング (404 を返す)。使用前に剥がしてください。
5. `context.action_id` はボタンの `id` と一致する必要があり、確認メッセージに
   生の ID の代わりにボタン名 (「承認」など) を使用します。
6. `context.action_id` は必須です。これがないと、対話ハンドラーは 400 を返します。

**HMAC トークンの生成:**

ゲートウェイはボタンのクリックを HMAC-SHA256 で検証します。外部スクリプトはトークンを生成する必要がある
ゲートウェイの検証ロジックと一致するもの:1. ボット トークンからシークレットを取得します。
`HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)` 2. **`_token` を除く**すべてのフィールドを含むコンテキスト オブジェクトを構築します。3. **ソートされたキー** および **スペースなし** でシリアル化します (ゲートウェイは `JSON.stringify` を使用します)
ソートされたキーを使用し、コンパクトな出力を生成します)。4. 署名: `HMAC-SHA256(key=secret, data=serializedContext)` 5. 結果の 16 進ダイジェストを `_token` としてコンテキストに追加します。

Python の例:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

HMAC の一般的な落とし穴:

- Python の `json.dumps` はデフォルトでスペースを追加します (`{"key": "val"}`)。使用する
  `separators=(",", ":")` は、JavaScript のコンパクトな出力 (`{"key":"val"}`) と一致します。
- **すべて**のコンテキスト フィールドに常に署名します (`_token` を除く)。ゲートウェイは `_token` を取り除き、その後
  残りすべてに署名します。サブセットに署名すると、サイレント検証が失敗します。
- `sort_keys=True` を使用します — ゲートウェイは署名前にキーをソートします。
  ペイロードを保存するときにコンテキスト フィールドを並べ替えます。
- ランダムなバイトではなく、ボット トークン (決定論的) からシークレットを導出します。秘密
  ボタンを作成するプロセスと検証するゲートウェイ全体で同じである必要があります。

## ディレクトリアダプター

Mattermost プラグインには、チャネル名とユーザー名を解決するディレクトリ アダプタが含まれています
Mattermost API経由。これにより、`#channel-name` および `@username` ターゲットが有効になります。
`openclaw message send` および cron/webhook 配信。構成は必要ありません。アダプターはアカウント構成のボット トークンを使用します。

## マルチアカウント

Mattermost は、`channels.mattermost.accounts` で複数のアカウントをサポートしています。

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## トラブルシューティング- チャネル内での応答なし: ボットがチャネル内にいることを確認してメンションする (オンコール)、トリガー プレフィックス (onchar) を使用する、または `chatmode: "onmessage"` を設定します

- 認証エラー: ボット トークン、ベース URL、アカウントが有効かどうかを確認します。
- マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。
- ボタンが白いボックスとして表示される: エージェントが不正な形式のボタン データを送信している可能性があります。各ボタンに `text` フィールドと `callback_data` フィールドの両方があることを確認します。
- ボタンはレンダリングされますが、クリックしても何も起こりません。Mattermost サーバー構成の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、および ServiceSettings の `EnablePostActionIntegration` が `true` であることを確認します。
- ボタンをクリックすると 404 が返されます。ボタン `id` にはハイフンまたはアンダースコアが含まれている可能性があります。 Mattermost のアクション ルーターは、英数字以外の ID では機能しません。 `[a-zA-Z0-9]` のみを使用してください。
- ゲートウェイ ログ `invalid _token`: HMAC が一致しません。すべてのコンテキスト フィールド (サブセットではない) に署名し、並べ替えられたキーを使用し、コンパクトな JSON (スペースなし) を使用していることを確認してください。上記の HMAC セクションを参照してください。
- ゲートウェイ ログ `missing _token in context`: `_token` フィールドはボタンのコンテキストにありません。統合ペイロードを構築するときにそれが含まれていることを確認してください。
- 確認ではボタン名ではなく生の ID が表示されます: `context.action_id` はボタンの `id` と一致しません。両方を同じサニタイズ値に設定します。- エージェントはボタンについて知りません: `capabilities: ["inlineButtons"]` を Mattermost チャネル構成に追加します。
