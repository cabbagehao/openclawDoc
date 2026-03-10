---
summary: "マトリックスのサポートステータス、機能、および構成"
read_when:
  - マトリックスチャンネル機能の開発
title: "マトリックス"
x-i18n:
  source_hash: "b1190c8cd14158c5c37fe047b790d0ef5dba8ce073fa36c91e079c9a721b7fe4"
---

# マトリックス (プラグイン)

Matrix は、オープンな分散型メッセージング プロトコルです。 OpenClaw は Matrix **ユーザー** として接続します
任意のホームサーバー上にあるため、ボット用の Matrix アカウントが必要です。ログイン後DM可能です
ボットを直接、またはルーム (マトリックスの「グループ」) に招待します。ビープ音も有効なクライアント オプションです。
ただし、E2EE を有効にする必要があります。

ステータス: プラグイン (@vector-im/matrix-bot-sdk) 経由でサポートされています。ダイレクトメッセージ、ルーム、スレッド、メディア、反応、
投票 (テキストとして送信 + 投票開始)、場所、および E2EE (暗号化サポートあり)。

## プラグインが必要です

Matrix はプラグインとして出荷され、コア インストールにはバンドルされていません。

CLI (npm レジストリ) 経由でインストールします。

```bash
openclaw plugins install @openclaw/matrix
```

ローカル チェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/matrix
```

構成/オンボーディング中に Matrix を選択し、git チェックアウトが検出された場合、
OpenClaw はローカル インストール パスを自動的に提供します。

詳細: [プラグイン](/tools/plugin)

## セットアップ

1. マトリックス プラグインをインストールします。
   - npm から: `openclaw plugins install @openclaw/matrix`
   - ローカルチェックアウトから: `openclaw plugins install ./extensions/matrix`
2. ホームサーバーで Matrix アカウントを作成します。
   - [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/) でホスティング オプションを参照してください。
   - または自分で主催します。
3. ボット アカウントのアクセス トークンを取得します。
   - ホームサーバーで `curl` を使用して Matrix ログイン API を使用します。

   ````bash
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
   ```- `matrix.example.org` をホームサーバーの URL に置き換えます。
   - または、`channels.matrix.userId` + `channels.matrix.password` を設定します: OpenClaw は同じものを呼び出します
     ログイン エンドポイント、アクセス トークンを `~/.openclaw/credentials/matrix/credentials.json` に保存します。
     そして次回の起動時にそれを再利用します。

   ````

4. 資格情報を構成します。
   - 環境: `MATRIX_HOMESERVER`、`MATRIX_ACCESS_TOKEN` (または `MATRIX_USER_ID` + `MATRIX_PASSWORD`)
   - または構成: `channels.matrix.*`
   - 両方が設定されている場合は、config が優先されます。
   - アクセス トークンの場合: ユーザー ID は `/whoami` 経由で自動的に取得されます。
   - 設定する場合、`channels.matrix.userId` は完全なマトリックス ID である必要があります (例: `@bot:example.org`)。
5. ゲートウェイを再起動します (またはオンボーディングを終了します)。
6. ボットで DM を開始するか、任意の Matrix クライアントからボットをルームに招待します
   (要素、ビープ音など。[https://matrix.org/ecosystem/clients/](https://matrix.org/ecosystem/clients/) を参照)。ビープ音には E2EE が必要です。
   したがって、`channels.matrix.encryption: true` を設定し、デバイスを確認します。

最小限の構成 (アクセス トークン、ユーザー ID が自動取得):

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

E2EE 構成 (エンドツーエンド暗号化が有効):

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

エンドツーエンドの暗号化は、Rust crypto SDK を介して**サポート**されます。

`channels.matrix.encryption: true` で有効にします:- 暗号化モジュールがロードされると、暗号化されたルームは自動的に復号化されます。

- 暗号化されたルームに送信する場合、送信メディアは暗号化されます。
- 最初の接続時に、OpenClaw は他のセッションからのデバイス検証を要求します。
- 別の Matrix クライアント (Element など) でデバイスを検証し、キー共有を有効にします。
- 暗号化モジュールをロードできない場合、E2EE は無効になり、暗号化されたルームは復号化されません。
  OpenClaw は警告をログに記録します。
- 暗号モジュール欠落エラー (`@matrix-org/matrix-sdk-crypto-nodejs-*` など) が表示された場合は、
  `@matrix-org/matrix-sdk-crypto-nodejs` のビルド スクリプトを許可し、実行します
  `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs` または次のコマンドでバイナリをフェッチします
  `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js`。

暗号状態はアカウント + アクセス トークンごとに保存されます。
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`
(SQLite データベース)。同期状態は `bot-storage.json` 内に存在します。
アクセス トークン (デバイス) が変更されると、新しいストアが作成され、ボットは
暗号化された部屋については再検証されました。

**デバイスの検証:**
E2EE が有効になっている場合、ボットは起動時に他のセッションからの検証を要求します。
Element (または別のクライアント) を開き、検証リクエストを承認して信頼を確立します。
認証が完了すると、ボットは暗号化された部屋でメッセージを復号化できます。

## マルチアカウント

マルチアカウントのサポート: アカウントごとの資格情報とオプションの `name` を指定して `channels.matrix.accounts` を使用します。共有パターンについては、[`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) を参照してください。各アカウントは、任意のホームサーバー上で個別の Matrix ユーザーとして実行されます。アカウントごとの構成
最上位の `channels.matrix` 設定を継承し、任意のオプションをオーバーライドできます
(DM ポリシー、グループ、暗号化など)。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          name: "Main assistant",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_***",
          encryption: true,
        },
        alerts: {
          name: "Alerts bot",
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
- 環境変数 (`MATRIX_HOMESERVER`、`MATRIX_ACCESS_TOKEN` など) は **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定 (DM ポリシー、グループ ポリシー、メンション ゲーティングなど) は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 暗号状態はアカウント + アクセス トークンごとに保存されます (アカウントごとに個別のキー ストア)。

## ルーティングモデル

- 返信は常に Matrix に返されます。
- DM はエージェントのメイン セッションを共有します。ルームはグループセッションにマップされます。

## アクセス制御 (DM)

- デフォルト: `channels.matrix.dm.policy = "pairing"`。不明な送信者がペアリング コードを取得します。
- 承認方法:
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- パブリック DM: `channels.matrix.dm.policy="open"` と `channels.matrix.dm.allowFrom=["*"]`。
- `channels.matrix.dm.allowFrom` は、完全な Matrix ユーザー ID (例: `@user:server`) を受け入れます。ディレクトリ検索で完全一致が 1 つ見つかった場合、ウィザードは表示名をユーザー ID に解決します。
- 表示名や裸のローカルパーツ (例: `"Alice"` または `"alice"`) は使用しないでください。これらは曖昧であり、ホワイトリストの照合では無視されます。完全な `@user:server` ID を使用してください。

## 部屋 (グループ)- デフォルト: `channels.matrix.groupPolicy = "allowlist"` (メンションゲート)。設定されていない場合は、`channels.defaults.groupPolicy` を使用してデフォルトをオーバーライドします

- ランタイムに関する注意: `channels.matrix` が完全に欠落している場合、ランタイムはルーム チェックのために `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。
- `channels.matrix.groups` を持つルームをホワイトリストに登録します (ルーム ID またはエイリアス。ディレクトリ検索で完全一致が 1 つ見つかった場合、名前は ID に解決されます):

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

- `requireMention: false` は、そのルームでの自動応答を有効にします。
- `groups."*"` は、ルーム間でのメンション ゲートのデフォルトを設定できます。
- `groupAllowFrom` は、ルーム内でボットをトリガーできる送信者を制限します (完全な Matrix ユーザー ID)。
- ルームごとの `users` 許可リストにより、特定のルーム内の送信者をさらに制限できます (完全な Matrix ユーザー ID を使用)。
- 構成ウィザードは、ルーム許可リス​​ト (ルーム ID、エイリアス、または名前) の入力を求め、完全かつ一意に一致する場合にのみ名前を解決します。
- 起動時に、OpenClaw はホワイトリスト内のルーム/ユーザー名を ID に解決し、マッピングをログに記録します。未解決のエントリは、ホワイトリストの照合では無視されます。
- 招待はデフォルトで自動参加されます。 `channels.matrix.autoJoin` および `channels.matrix.autoJoinAllowlist` で制御します。
- **部屋なし**を許可するには、`channels.matrix.groupPolicy: "disabled"` を設定します (または空の許可リストを保持します)。
- レガシーキー: `channels.matrix.rooms` (`groups` と同じ形状)。

## スレッド- 返信スレッドがサポートされています

- `channels.matrix.threadReplies` は、応答がスレッドに残るかどうかを制御します。
  - `off`、`inbound` (デフォルト)、`always`
- `channels.matrix.replyToMode` は、スレッド内で返信しない場合の返信先メタデータを制御します。
  - `off` (デフォルト)、`first`、`all`

## 機能|特集 |ステータス |

| --------------- | ------------------------------------------------------------------------------------- |
|ダイレクトメッセージ | ✅ サポートされている |
|客室 | ✅ サポートされている |
|スレッド | ✅ サポートされている |
|メディア | ✅ サポートされている |
| E2EE | ✅ サポートされています (暗号化モジュールが必要です) |
|反応 | ✅ サポートされています (ツール経由で送信/読み取り) |
|世論調査 | ✅ 送信がサポートされています。受信ポーリングの開始はテキストに変換されます (応答/終了は無視されます)。
|場所 | ✅ サポートされています (地理 URI、高度は無視されます) |
|ネイティブコマンド | ✅ サポートされている |

## トラブルシューティング

まずこのはしごを実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に、必要に応じて DM ペアリングの状態を確認します。

```bash
openclaw pairing list matrix
```

よくある失敗:- ログインしたがルーム メッセージが無視されました: ルームは `groupPolicy` またはルーム許可リス​​トによってブロックされました。

- DM は無視されました: `channels.matrix.dm.policy="pairing"` の場合、送信者は承認待ちです。
- 暗号化ルームの失敗: 暗号化サポートまたは暗号化設定が一致しません。

トリアージ フローの場合: [/channels/troubleshooting](/channels/troubleshooting)。

## 構成リファレンス (マトリックス)

完全な構成: [構成](/gateway/configuration)

プロバイダーのオプション:- `channels.matrix.enabled`: チャネルの起動を有効/無効にします。

- `channels.matrix.homeserver`: ホームサーバーの URL。
- `channels.matrix.userId`: マトリックス ユーザー ID (アクセス トークンを使用する場合はオプション)。
- `channels.matrix.accessToken`: アクセス トークン。
- `channels.matrix.password`: ログイン用のパスワード (トークンが保存されています)。
- `channels.matrix.deviceName`: デバイスの表示名。
- `channels.matrix.encryption`: E2EE を有効にします (デフォルト: false)。
- `channels.matrix.initialSyncLimit`: 初期同期制限。
- `channels.matrix.threadReplies`: `off | inbound | always` (デフォルト: 受信)。
- `channels.matrix.textChunkLimit`: 送信テキストのチャンク サイズ (文字数)。
- `channels.matrix.chunkMode`: `length` (デフォルト) または `newline` は、長さをチャンクする前に空白行 (段落境界) で分割します。
- `channels.matrix.dm.policy`: `pairing | allowlist | open | disabled` (デフォルト: ペアリング)。
- `channels.matrix.dm.allowFrom`: DM 許可リスト (完全な Matrix ユーザー ID)。 `open` には `"*"` が必要です。可能な場合、ウィザードは名前を ID に解決します。
- `channels.matrix.groupPolicy`: `allowlist | open | disabled` (デフォルト: ホワイトリスト)。
- `channels.matrix.groupAllowFrom`: グループ メッセージの許可リストに登録された送信者 (完全な Matrix ユーザー ID)。
- `channels.matrix.allowlistOnly`: DM + ルームの許可リスト ルールを強制します。
- `channels.matrix.groups`: グループ許可リスト + 部屋ごとの設定マップ。
- `channels.matrix.rooms`: 従来のグループ許可リスト/構成。
- `channels.matrix.replyToMode`: スレッド/タグの返信モード。
- `channels.matrix.mediaMaxMb`: 受信/送信メディアの上限 (MB)。
- `channels.matrix.autoJoin`: 招待処理 (`always | allowlist | off`、デフォルト: 常に)。
- `channels.matrix.autoJoinAllowlist`: 自動参加に許可されたルーム ID/エイリアス。- `channels.matrix.accounts`: アカウント ID をキーとするマルチアカウント構成 (各アカウントは最上位の設定を継承します)。
- `channels.matrix.actions`: アクションごとのツール ゲーティング (反応/メッセージ/ピン/メンバー情報/チャンネル情報)。
