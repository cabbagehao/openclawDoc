---
summary: "Matrix のサポートステータス、機能、および構成"
read_when:
  - Matrix チャネル機能の開発
title: "Matrix"
x-i18n:
  source_hash: "b1190c8cd14158c5c37fe047b790d0ef5dba8ce073fa36c91e079c9a721b7fe4"
---

# Matrix (プラグイン)

Matrix は、オープンな分散型メッセージングプロトコルです。OpenClaw は、任意のホームサーバー上の Matrix **ユーザー**として接続するため、ボット用の Matrix アカウントが必要です。ログイン後は、ボットに直接 DM を送信したり、ルーム（Matrix の「グループ」）に招待したりできます。Beeper も有効なクライアントオプションですが、E2EE を有効にする必要があります。

ステータス: プラグイン (@vector-im/matrix-bot-sdk) 経由でサポートされています。ダイレクトメッセージ、ルーム、スレッド、メディア、リアクション、投票（送信 + テキストとしての投票開始）、位置情報、および E2EE（暗号化サポートあり）がサポートされています。

## プラグインが必要

Matrix はプラグインとして提供されており、コアインストールには同梱されていません。

CLI (npm レジストリ) 経由でインストールします:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/matrix
```

構成/オンボーディング中に Matrix を選択し、git チェックアウトが検出された場合、OpenClaw は自動的にローカルインストールパスを提案します。

詳細: [プラグイン](/tools/plugin)

## セットアップ

1. Matrix プラグインをインストールします。
   - npm から: `openclaw plugins install @openclaw/matrix`
   - ローカルチェックアウトから: `openclaw plugins install ./extensions/matrix`
2. ホームサーバーで Matrix アカウントを作成します。
   - [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/) でホスティングオプションを確認してください。
   - または、自身でホストします。
3. ボットアカウントのアクセストークンを取得します。
   - ホームサーバーで `curl` を使用して Matrix ログイン API を呼び出します:

   ```bash
   curl --request POST \
     --url https://matrix.example.org/_matrix/client/v3/login \
     --header 'Content-Type: application/json' \
     --data '{
     "type": "m.login.password",
     "identifier": {
       "type": "m.id.user",
       "user": "your-user-name"
     },
     "password": "your-password"
   }'
   ```

   - `matrix.example.org` を自身のホームサーバーの URL に置き換えてください。
   - または、`channels.matrix.userId` + `channels.matrix.password` を設定します。OpenClaw は同じログインエンドポイントを呼び出し、アクセストークンを `~/.openclaw/credentials/matrix/credentials.json` に保存し、次回の起動時に再利用します。

4. 認証情報を構成します。
   - 環境変数: `MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` (または `MATRIX_USER_ID` + `MATRIX_PASSWORD`)
   - または構成ファイル: `channels.matrix.*`
   - 両方が設定されている場合は、構成ファイルの設定が優先されます。
   - アクセストークンを使用する場合、ユーザー ID は `/whoami` 経由で自動的に取得されます。
   - `channels.matrix.userId` を設定する場合は、完全な Matrix ID（例: `@bot:example.org`）を指定してください。
5. ゲートウェイを再起動します（またはオンボーディングを完了させます）。
6. 任意の Matrix クライアント (Element, Beeper 等。 [https://matrix.org/ecosystem/clients/](https://matrix.org/ecosystem/clients/) を参照) からボットと DM を開始するか、ルームに招待します。Beeper には E2EE が必要なため、`channels.matrix.encryption: true` を設定し、デバイスを検証してください。

最小限の構成 (アクセストークン使用、ユーザー ID は自動取得):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" },
    },
  },
}
```

E2EE 構成 (エンドツーエンド暗号化を有効化):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

## 暗号化 (E2EE)

エンドツーエンド暗号化は、Rust crypto SDK を介して**サポート**されています。

`channels.matrix.encryption: true` で有効にします:

- 暗号化モジュールがロードされると、暗号化されたルームは自動的に復号されます。
- 暗号化されたルームに送信する場合、送信メディアは暗号化されます。
- 初回接続時、OpenClaw は他のセッションからのデバイス検証を要求します。
- 他の Matrix クライアント (Element 等) でデバイスを承認し、キー共有を有効にしてください。
- 暗号化モジュールをロードできない場合、E2EE は無効になり、暗号化されたルームは復号されません。この場合、OpenClaw は警告をログに出力します。
- 暗号化モジュール欠落エラー（例: `@matrix-org/matrix-sdk-crypto-nodejs-*`）が表示された場合は、`@matrix-org/matrix-sdk-crypto-nodejs` のビルドスクリプトを許可して `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs` を実行するか、`node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js` でバイナリを取得してください。

暗号化の状態は、アカウント + アクセストークンごとに `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/` (SQLite データベース) に保存されます。同期状態はその隣の `bot-storage.json` に保存されます。アクセストークン（デバイス）が変更されると、新しいストアが作成され、ボットは暗号化されたルームに対して再検証が必要になります。

**デバイスの検証:**
E2EE が有効な場合、ボットは起動時に他のセッションからの検証を要求します。Element（または他のクライアント）を開き、検証リクエストを承認して信頼関係を確立してください。検証が完了すると、ボットは暗号化されたルームのメッセージを復号できるようになります。

## マルチアカウント

マルチアカウントのサポート: `channels.matrix.accounts` を使用して、アカウントごとの認証情報とオプションの `name` を指定します。共通パターンについては [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) を参照してください。

各アカウントは、任意のホームサーバー上で個別の Matrix ユーザーとして動作します。アカウントごとの構成は、最上位の `channels.matrix` 設定を継承し、任意のオプション（DM ポリシー、グループ、暗号化など）を上書きできます。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          name: "メインアシスタント",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_***",
          encryption: true,
        },
        alerts: {
          name: "アラートボット",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_***",
          dm: { policy: "allowlist", allowFrom: ["@admin:example.org"] },
        },
      },
    },
  },
}
```

注:

- アカウントの起動は、モジュールの同時インポートによる競合状態を避けるためにシリアル化されます。
- 環境変数（`MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` など）は**デフォルト**アカウントにのみ適用されます。
- 基本的なチャネル設定（DM ポリシー、グループポリシー、メンション制限など）は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを異なるエージェントにルーティングできます。
- 暗号化の状態はアカウント + アクセストークンごとに保存されます（アカウントごとに個別のキーストア）。

## ルーティングモデル

- 返信は常に Matrix に戻ります。
- DM はエージェントのメインセッションを共有します。ルームはグループセッションにマップされます。

## アクセス制御 (DM)

- デフォルト: `channels.matrix.dm.policy = "pairing"`。未知の送信者にはペアリングコードが送信されます。
- 承認方法:
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- パブリック DM: `channels.matrix.dm.policy="open"` かつ `channels.matrix.dm.allowFrom=["*"]`。
- `channels.matrix.dm.allowFrom` は、完全な Matrix ユーザー ID（例: `@user:server`）を受け入れます。構成ウィザードでは、ディレクトリ検索で一意の完全一致が見つかった場合に、表示名をユーザー ID に解決できます。
- 表示名やユーザー名のみ（例: `"Alice"` や `"alice"`）は使用しないでください。これらは曖昧であり、許可リストの照合では無視されます。必ず完全な `@user:server` 形式の ID を使用してください。

## ルーム (グループ)

- デフォルト: `channels.matrix.groupPolicy = "allowlist"` (メンション制限あり)。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- ランタイムに関する注意: `channels.matrix` セクションが完全に欠落している場合、ランタイムはルームチェックのために `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。
- ルームを許可リストに追加するには `channels.matrix.groups` を使用します（ルーム ID またはエイリアス。ディレクトリ検索で一意の完全一致が見つかった場合は名前も ID に解決されます）:

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
      groupAllowFrom: ["@owner:example.org"],
    },
  },
}
```

- `requireMention: false` を設定すると、そのルームでの自動応答が有効になります。
- `groups."*"` を使用して、すべてのルームにおけるメンション制限のデフォルトを設定できます。
- `groupAllowFrom` は、ルーム内でボットをトリガーできる送信者を制限します（完全な Matrix ユーザー ID）。
- ルームごとの `users` 許可リストにより、特定のルーム内の送信者をさらに制限できます（完全な Matrix ユーザー ID を使用）。
- 構成ウィザードは、ルームの許可リスト（ルーム ID、エイリアス、または名前）の入力を求め、一意に一致する場合にのみ名前を解決します。
- 起動時、OpenClaw は許可リスト内のルーム/ユーザー名を ID に解決し、そのマッピングをログに出力します。未解決のエントリは、許可リストの照合では無視されます。
- 招待はデフォルトで自動承諾されます。`channels.matrix.autoJoin` および `channels.matrix.autoJoinAllowlist` で制御可能です。
- **すべてのルームを禁止**するには、`channels.matrix.groupPolicy: "disabled"` を設定します（または許可リストを空にします）。
- レガシーキー: `channels.matrix.rooms` (`groups` と同じ形式)。

## スレッド

- 返信スレッドがサポートされています。
- `channels.matrix.threadReplies` は、返信をスレッド内に維持するかどうかを制御します:
  - `off`, `inbound` (デフォルト), `always`
- `channels.matrix.replyToMode` は、スレッド内で返信しない場合の返信先メタデータを制御します:
  - `off` (デフォルト), `first`, `all`

## 機能

| 機能 | ステータス |
| :--- | :--- |
| ダイレクトメッセージ | ✅ サポート済み |
| ルーム | ✅ サポート済み |
| スレッド | ✅ サポート済み |
| メディア | ✅ サポート済み |
| E2EE | ✅ サポート済み (暗号化モジュールが必要) |
| リアクション | ✅ サポート済み (ツール経由での送信/読み取り) |
| 投票 | ✅ 送信をサポート。受信した投票開始イベントはテキストに変換されます（回答/終了は無視されます） |
| 位置情報 | ✅ サポート済み (geo URI。高度は無視されます) |
| ネイティブコマンド | ✅ サポート済み |

## トラブルシューティング

まず以下のコマンドを順に試してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

その後、必要に応じて DM のペアリング状態を確認してください:

```bash
openclaw pairing list matrix
```

よくある失敗例:
- ログインしているがルームのメッセージが無視される: ルームが `groupPolicy` またはルーム許可リストによってブロックされています。
- DM が無視される: `channels.matrix.dm.policy="pairing"` の場合、送信者が承認待ちの状態です。
- 暗号化されたルームで失敗する: 暗号化のサポートまたは暗号化設定の不一致。

詳細な診断フローについては、[/channels/troubleshooting](/channels/troubleshooting) を参照してください。

## 構成リファレンス (Matrix)

完全な構成: [構成](/gateway/configuration)

プロバイダーオプション:
- `channels.matrix.enabled`: チャネルの起動を有効/無効にします。
- `channels.matrix.homeserver`: ホームサーバーの URL。
- `channels.matrix.userId`: Matrix ユーザー ID (アクセストークン使用時はオプション)。
- `channels.matrix.accessToken`: アクセストークン。
- `channels.matrix.password`: ログイン用パスワード (トークンが保存されます)。
- `channels.matrix.deviceName`: デバイスの表示名。
- `channels.matrix.encryption`: E2EE を有効化 (デフォルト: false)。
- `channels.matrix.initialSyncLimit`: 初期同期の制限数。
- `channels.matrix.threadReplies`: `off | inbound | always` (デフォルト: inbound)。
- `channels.matrix.textChunkLimit`: 送信テキストのチャンクサイズ（文字数）。
- `channels.matrix.chunkMode`: `length` (デフォルト) または `newline`（長さで分割する前に、空行などの段落境界で分割）。
- `channels.matrix.dm.policy`: `pairing | allowlist | open | disabled` (デフォルト: pairing)。
- `channels.matrix.dm.allowFrom`: DM 許可リスト (完全な Matrix ユーザー ID)。`open` には `"*"` が必要です。ウィザードは可能な限り名前を ID に解決します。
- `channels.matrix.groupPolicy`: `allowlist | open | disabled` (デフォルト: allowlist)。
- `channels.matrix.groupAllowFrom`: グループメッセージの許可された送信者 (完全な Matrix ユーザー ID)。
- `channels.matrix.allowlistOnly`: DM とルームの両方で許可リストルールを強制適用します。
- `channels.matrix.groups`: グループ許可リストとルームごとの設定マップ。
- `channels.matrix.rooms`: レガシーなグループ許可リスト/構成。
- `channels.matrix.replyToMode`: スレッド/タグの返信モード。
- `channels.matrix.mediaMaxMb`: 受信/送信メディアの上限サイズ (MB)。
- `channels.matrix.autoJoin`: 招待の処理 (`always | allowlist | off`、デフォルト: always)。
- `channels.matrix.autoJoinAllowlist`: 自動承諾を許可するルーム ID/エイリアスのリスト。
- `channels.matrix.accounts`: アカウント ID をキーとするマルチアカウント構成 (各アカウントは最上位の設定を継承します)。
- `channels.matrix.actions`: アクションごとのツール制限 (reactions/messages/pins/memberInfo/channelInfo)。
