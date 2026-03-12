---
summary: "Mattermost ボットのセットアップと OpenClaw 構成"
read_when:
  - Mattermost のセットアップ
  - Mattermost ルーティングのデバッグ
title: "Mattermost"
seoTitle: "OpenClawでMattermostボット連携を設定する方法"
description: "Mattermost ボットを OpenClaw に接続する設定ガイドです。ボットトークン、WebSocket イベント、DM・チャネル対応の構成を確認できます。"
x-i18n:
  source_hash: "c1d43218b97fdaa30e8739287056151feeb88aace9b1787769a890f9cc5eca59"
---
ステータス: プラグイン経由でサポートされています（ボットトークン + WebSocket イベント）。チャネル、グループ、DM がサポートされています。
Mattermost は、自己ホスト可能なチームメッセージングプラットフォームです。製品の詳細やダウンロードについては、公式サイト [mattermost.com](https://mattermost.com) をご覧ください。

## プラグインが必要

Mattermost はプラグインとして提供されており、コアインストールには同梱されていません。

CLI (npm レジストリ) 経由でインストールします:

```bash
openclaw plugins install @openclaw/mattermost
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/mattermost
```

構成/オンボーディング中に Mattermost を選択し、git チェックアウトが検出された場合、OpenClaw は自動的にローカルインストールパスを提案します。

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ

1. Mattermost プラグインをインストールします。
2. Mattermost ボットアカウントを作成し、**ボットトークン**をコピーします。
3. Mattermost の**ベース URL**（例: `https://chat.example.com`）をコピーします。
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

ネイティブのスラッシュコマンドはオプトイン方式です。有効にすると、OpenClaw は Mattermost API を介して `oc_*` スラッシュコマンドを登録し、ゲートウェイの HTTP サーバーでコールバック POST を受信します。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost がゲートウェイに直接到達できない場合（リバースプロキシ/公開 URL など）に使用します。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

注:

- `native: "auto"` の場合、Mattermost ではデフォルトで無効になります。有効にするには `native: true` を設定してください。
- `callbackUrl` が省略された場合、OpenClaw はゲートウェイのホスト/ポート + `callbackPath` から自動的に導出します。
- マルチアカウント設定の場合、`commands` はトップレベル、または `channels.mattermost.accounts.<id>.commands` 配下で設定可能です（アカウントごとの値が最上位フィールドを上書きします）。
- コマンドコールバックはコマンドごとのトークンで検証され、チェックに失敗した場合は安全のために実行を拒否（フェールクローズ）します。
- 到達可能性の要件: コールバックエンドポイントは Mattermost サーバーから到達可能である必要があります。
  - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されていない限り、`callbackUrl` を `localhost` に設定しないでください。
  - URL が OpenClaw への `/api/channels/mattermost/command` をリバースプロキシしている場合を除き、`callbackUrl` を Mattermost のベース URL と同じに設定しないでください。
  - 簡単な確認方法として、`curl https://<gateway-host>/api/channels/mattermost/command` を実行してください。OpenClaw から `404` ではなく `405 Method Not Allowed` が返ってくれば正常です。
- Mattermost の送信（Egress）許可リストの要件:
  - コールバック先がプライベート/Tailscale/内部アドレスの場合は、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを追加してください。
  - 完全な URL ではなく、ホスト/ドメインのみを指定します。
    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

## 環境変数 (デフォルトアカウント)

環境変数を使用したい場合は、ゲートウェイホストで以下を設定します:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

環境変数は**デフォルト**アカウント (`default`) にのみ適用されます。その他のアカウントは構成ファイルの値を使用する必要があります。

## チャットモード

Mattermost は DM に自動的に応答します。チャネルでの動作は `chatmode` で制御されます:

- `oncall` (デフォルト): チャネルで @メンションされた場合にのみ応答します。
- `onmessage`: すべてのチャネルメッセージに応答します。
- `onchar`: メッセージが特定のトリガープレフィックスで始まる場合に応答します。

構成例:

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

- `onchar` モードでも、明示的な @メンションには引き続き応答します。
- レガシーな構成では `channels.mattermost.requireMention` も尊重されますが、`chatmode` の使用を推奨します。

## アクセス制御 (DM)

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（未知の送信者にはペアリングコードが送信されます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- パブリック DM: `channels.mattermost.dmPolicy="open"` かつ `channels.mattermost.allowFrom=["*"]`。

## チャネル (グループ)

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（メンション制限あり）。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに登録します（ユーザー ID を推奨）。
- `@username` による照合は変更可能であり、`channels.mattermost.dangerouslyAllowNameMatching: true` が設定されている場合にのみ有効になります。
- オープンチャネル: `channels.mattermost.groupPolicy="open"`（メンション制限あり）。
- ランタイムに関する注意: `channels.mattermost` セクションが完全に欠落している場合、ランタイムはグループチェックのために `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

## アウトバウンド配信のターゲット

`openclaw message send` や Cron/Webhook で使用できるターゲット形式は以下の通りです:

- チャネルの場合: `channel:<id>`
- DM の場合: `user:<id>`
- DM の場合: `@username` (Mattermost API 経由で解決)

プレフィックスのない ID はチャネルとして扱われます。

## リアクション (メッセージツール)

- `channel=mattermost` で `message action=react` を使用します。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` は `thumbsup` や `:+1:` のような名前を受け入れます（コロンは任意）。
- リアクションを削除するには `remove=true` (boolean) を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションにシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

構成:

- `channels.mattermost.actions.reactions`: リアクション操作を有効/無効にします（デフォルト: true）。
- アカウントごとのオーバーライド: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン (メッセージツール)

クリック可能なボタン付きのメッセージを送信できます。ユーザーがボタンをクリックすると、エージェントはその選択内容を受け取って応答できます。

チャネル機能に `inlineButtons` を追加してボタンを有効にします:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` パラメータを指定して `message action=send` を使用します。ボタンは 2 次元配列（ボタンの行）です:

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"はい","callback_data":"yes"},{"text":"いいえ","callback_data":"no"}]]
```

ボタンのフィールド:

- `text` (必須): 表示ラベル。
- `callback_data` (必須): クリック時に返される値（アクション ID として使用）。
- `style` (任意): `"default"`, `"primary"`, または `"danger"`。

ユーザーがボタンをクリックすると:

1. すべてのボタンが確認メッセージに置き換わります（例: 「✓ **はい** が @user によって選択されました」）。
2. エージェントは選択内容をインバウンドメッセージとして受け取り、応答します。

注:

- ボタンのコールバックは HMAC-SHA256 検証を使用します（自動で行われ、設定は不要です）。
- Mattermost は API レスポンスからコールバックデータを削除するため（セキュリティ機能）、クリック時にはすべてのボタンが削除されます。部分的な削除はできません。
- ハイフンやアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限のため）。

構成:

- `channels.mattermost.capabilities`: 機能文字列の配列。エージェントのシステムプロンプトでボタンツールの説明を有効にするには、`"inlineButtons"` を追加してください。
- `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用のオプションの外部ベース URL（例: `https://gateway.example.com`）。Mattermost がゲートウェイのバインドアドレスに直接到達できない場合に使用します。
- マルチアカウント設定では、`channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 配下でも同じフィールドを設定できます。
- `interactions.callbackBaseUrl` が省略された場合、OpenClaw は `gateway.customBindHost` + `gateway.port` から導出し、さらに `http://localhost:<port>` にフォールバックします。
- 到達可能性ルール: ボタンのコールバック URL は Mattermost サーバーから到達可能である必要があります。`localhost` は、Mattermost と OpenClaw が同じホスト/ネットワーク名前空間で実行されている場合にのみ機能します。
- コールバック先がプライベート/Tailscale/内部アドレスの場合は、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にそのホスト/ドメインを追加してください。

### 直接 API 連携 (外部スクリプト)

外部スクリプトや Webhook は、エージェントの `message` ツールを通さずに、Mattermost REST API 経由で直接ボタンを投稿できます。可能な限り拡張機能の `buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、以下のルールに従ってください:

**ペイロード構造:**

```json5
{
  channel_id: "<channelId>",
  message: "オプションを選択してください:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 英数字のみ — 下記参照
            type: "button", // 必須。ないとクリックが無視されます
            name: "承認", // 表示ラベル
            style: "primary", // 任意: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ボタン ID と一致させる必要があります（名前引き引き用）
                action: "approve",
                // ... その他のカスタムフィールド ...
                _token: "<hmac>", // 下記の HMAC セクション参照
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

1. アタッチメントは、トップレベルの `attachments` ではなく `props.attachments` に入れる必要があります（トップレベルは無視されます）。
2. すべてのアクションに `type: "button"` が必要です。これがないとクリックが通知されません。
3. すべてのアクションに `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクションの `id` は**英数字のみ** (`[a-zA-Z0-9]`) である必要があります。ハイフンやアンダースコアは Mattermost のサーバー側アクションルーティングを破壊します（404 が返ります）。使用前に除去してください。
5. `context.action_id` はボタンの `id` と一致させる必要があります。これにより、確認メッセージに生の ID ではなくボタン名（例: 「承認」）が表示されます。
6. `context.action_id` は必須です。これがないとインタラクションハンドラーは 400 を返します。

**HMAC トークンの生成:**

ゲートウェイは HMAC-SHA256 でボタンのクリックを検証します。外部スクリプトは、ゲートウェイの検証ロジックに一致するトークンを生成する必要があります:

1. ボットトークンからシークレットを導出します:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token` を**除く**すべてのフィールドを含むコンテキストオブジェクトを構築します。
3. **キーをソート**し、**スペースなし**でシリアル化します（ゲートウェイはソートされたキーで `JSON.stringify` を行い、コンパクトな出力を生成します）。
4. 署名します: `HMAC-SHA256(key=secret, data=serializedContext)`
5. 生成された 16 進ダイジェストを `_token` としてコンテキストに追加します。

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

HMAC のよくある落とし穴:

- Python の `json.dumps` はデフォルトでスペースを追加します (`{"key": "val"}`)。JavaScript のコンパクトな出力 (`{"key":"val"}`) に合わせるため、`separators=(",", ":")` を使用してください。
- 常に**すべて**のコンテキストフィールド（`_token` 以外）を署名対象にしてください。ゲートウェイは `_token` を除去した後、残ったすべてを署名します。一部のフィールドのみを署名すると検証に失敗します。
- `sort_keys=True` を使用してください。ゲートウェイは署名前にキーをソートします。また、Mattermost はペイロード保存時にコンテキストフィールドの順序を変更することがあります。
- シークレットはランダムなバイトではなく、ボットトークンから（決定論的に）導出してください。ボタンを作成するプロセスと検証するゲートウェイで同じシークレットを使用する必要があります。

## ディレクトリアダプター

Mattermost プラグインには、Mattermost API 経由でチャネル名やユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` や Cron/Webhook 配信において `#channel-name` や `@username` をターゲットとして指定できるようになります。

設定は不要です。アダプターはアカウント構成のボットトークンを自動的に使用します。

## マルチアカウント

Mattermost は `channels.mattermost.accounts` 配下で複数のアカウントをサポートしています:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "メイン", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "アラート", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## トラブルシューティング

- チャネルで返信がない: ボットがチャネルに参加していることを確認し、メンションするか（oncall モード）、プレフィックスを使用するか（onchar モード）、または `chatmode: "onmessage"` を設定してください。
- 認証エラー: ボットトークン、ベース URL、およびアカウントが有効になっているかを確認してください。
- マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。
- ボタンが白い箱として表示される: エージェントが不正な形式のボタンデータを送信している可能性があります。各ボタンに `text` と `callback_data` フィールドの両方が含まれているか確認してください。
- ボタンは表示されるがクリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれているか、また `ServiceSettings.EnablePostActionIntegration` が `true` になっているかを確認してください。
- ボタンをクリックすると 404 が返る: ボタンの `id` にハイフンやアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID で動作しません。`[a-zA-Z0-9]` のみを使用してください。
- ゲートウェイログに `invalid _token` と出る: HMAC が一致していません。すべてのコンテキストフィールドを署名しているか（一部ではない）、キーをソートしているか、コンパクトな JSON（スペースなし）を使用しているかを確認してください。上記の HMAC セクションを参照してください。
- ゲートウェイログに `missing _token in context` と出る: ボタンのコンテキストに `_token` フィールドが含まれていません。連携ペイロード構築時に必ず含めるようにしてください。
- 確認メッセージにボタン名ではなく生の ID が表示される: `context.action_id` がボタンの `id` と一致していません。両方に同じサニタイズ後の値を設定してください。
- エージェントがボタンについて知らない: Mattermost チャネル構成に `capabilities: ["inlineButtons"]` を追加してください。
