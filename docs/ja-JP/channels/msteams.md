---
summary: "Microsoft Teams ボットのサポート ステータス、機能、および構成"
read_when:
  - MS Teams チャネル機能の開発
title: "マイクロソフトチーム"
x-i18n:
  source_hash: "9559705b08291578f9d476ea4924d53aa77ae81d682a95d93e9b148430007e32"
---

# Microsoft Teams (プラグイン)

> 「ここに入る者よ、一切の希望を捨てよ。」

更新日: 2026-01-21

ステータス: テキスト + DM 添付ファイルがサポートされています。チャネル/グループ ファイルの送信には、`sharePointSiteId` + Graph 権限が必要です ([グループ チャットでのファイルの送信](#sending-files-in-group-chats) を参照)。投票はアダプティブ カード経由で送信されます。

## プラグインが必要です

Microsoft Teams はプラグインとして出荷され、コア インストールにはバンドルされていません。

**重大な変更 (2026.1.15):** MS Teams がコアの外に移動しました。使用する場合はプラグインをインストールする必要があります。

説明可能: コアのインストールを軽量に保ち、MS Teams の依存関係を個別に更新できるようにします。

CLI (npm レジストリ) 経由でインストールします。

```bash
openclaw plugins install @openclaw/msteams
```

ローカル チェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/msteams
```

構成/オンボーディング中に Teams を選択し、git チェックアウトが検出された場合、
OpenClaw はローカル インストール パスを自動的に提供します。

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. Microsoft Teams プラグインをインストールします。
2. **Azure Bot** (アプリ ID + クライアント シークレット + テナント ID) を作成します。
3. これらの資格情報を使用して OpenClaw を構成します。
4. パブリック URL またはトンネル経由で `/api/messages` (デフォルトではポート 3978) を公開します。
5. Teams アプリ パッケージをインストールし、ゲートウェイを起動します。

最小限の構成:

````json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```注: グループ チャットはデフォルトでブロックされています (`channels.msteams.groupPolicy: "allowlist"`)。グループ返信を許可するには、`channels.msteams.groupAllowFrom` を設定します (または、メンションゲートで任意のメンバーを許可するには、`groupPolicy: "open"` を使用します)。

## 目標

- Teams DM、グループ チャット、またはチャネル経由で OpenClaw と会話します。
- 決定的なルーティングを維持します。返信は常に、到着したチャネルに戻ります。
- デフォルトでは安全なチャネル動作になります (別の設定がされていない限り、言及が必要です)。

## 構成の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によってトリガーされる構成更新を書き込むことができます (`commands.config: true` が必要です)。

次のコマンドで無効にします。

```json5
{
  channels: { msteams: { configWrites: false } },
}
````

## アクセス制御 (DM + グループ)

**DMアクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。不明な送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` は安定した AAD オブジェクト ID を使用する必要があります。
- UPN/表示名は変更可能です。直接一致はデフォルトでは無効になっており、`channels.msteams.dangerouslyAllowNameMatching: true` でのみ有効になります。
- 資格情報が許可する場合、ウィザードは Microsoft Graph を介して名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom` を追加しない限りブロックされます)。設定されていない場合は、`channels.defaults.groupPolicy` を使用してデフォルトをオーバーライドします。
- `channels.msteams.groupAllowFrom` は、グループ チャット/チャネルでトリガーできる送信者を制御します (`channels.msteams.allowFrom` にフォールバックします)。
- `groupPolicy: "open"` を設定して、任意のメンバーを許可します (デフォルトではメンションゲートされています)。
- **チャネルなし**を許可するには、`channels.msteams.groupPolicy: "disabled"` を設定します。

例:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**チーム + チャネル許可リスト**- `channels.msteams.teams` の下にチームとチャネルをリストすることで、グループ/チャネルの返信をスコープします。

- キーはチーム ID または名前にすることができます。チャネル キーは会話 ID または名前にすることができます。
- `groupPolicy="allowlist"` とチーム許可リス​​トが存在する場合、リストされたチーム/チャネルのみが受け入れられます (メンションゲートされます)。
- 構成ウィザードは `Team/Channel` エントリを受け入れ、それらを保存します。
- 起動時に、OpenClaw はチーム/チャネルおよびユーザー許可リスト名を ID に解決します (Graph 権限が許可している場合)
  そしてマッピングをログに記録します。未解決のエントリは入力されたとおりに保持されます。

例:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## 仕組み

1. Microsoft Teams プラグインをインストールします。
2. **Azure Bot** (アプリ ID + シークレット + テナント ID) を作成します。
3. ボットを参照し、以下の RSC 権限を含む **Teams アプリ パッケージ** を構築します。
4. Teams アプリをチーム (または DM の個人スコープ) にアップロード/インストールします。
5. `~/.openclaw/openclaw.json` (または環境変数) で `msteams` を構成し、ゲートウェイを起動します。
6. ゲートウェイは、デフォルトで `/api/messages` 上の Bot Framework Webhook トラフィックをリッスンします。

## Azure ボットのセットアップ (前提条件)

OpenClaw を構成する前に、Azure Bot リソースを作成する必要があります。

### ステップ 1: Azure ボットを作成する

1. [Azure ボットの作成](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します。
2. | [**基本**] タブに次のように入力します。 | フィールド                                                  | 値  |
   | --------------------------------------- | ----------------------------------------------------------- | --- |
   | **ボットハンドル**                      | ボット名、例: `openclaw-msteams` (一意である必要があります) |
   | **サブスクリプション**                  | Azure サブスクリプションを選択します                        |
   | **リソース グループ**                   | 新規作成するか既存のものを使用する                          |
   | **価格帯**                              | **開発/テストは無料**                                       |
   | **アプリの種類**                        | **シングル テナント** (推奨 - 下記の注を参照)               |
   | **作成タイプ**                          | **新しい Microsoft アプリ ID を作成**                       |

> **非推奨の通知:** 新しいマルチテナント ボットの作成は、2025 年 7 月 31 日以降非推奨になりました。新しいボットには **単一テナント** を使用します。

3. [**確認と作成**] → [**作成**] をクリックします (約 1 ～ 2 分待ちます)

### ステップ 2: 資格情報を取得する

1. Azure Bot リソース → **構成** に移動します。
2. **Microsoft アプリ ID** をコピー → これは `appId` です
3. [**パスワードの管理**] をクリックし、[アプリの登録] に進みます。
4. [**証明書とシークレット**] → [**新しいクライアント シークレット**] → [**値**] をコピー → これが `appPassword` です。
5. **概要**に移動 → **ディレクトリ (テナント) ID** をコピー → これが `tenantId` です

### ステップ 3: メッセージング エンドポイントの構成1. Azure Bot → **構成**

2. **メッセージング エンドポイント**を Webhook URL に設定します。
   - 製造: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します (下記の [ローカル開発](#local-development-tunneling) を参照)

### ステップ 4: Teams チャネルを有効にする

1. Azure Bot → **チャンネル**
2. [**Microsoft Teams**] → [構成] → [保存] をクリックします。
3. 利用規約に同意する

## 地域開発 (トンネリング)

チームは `localhost` に到達できません。ローカル開発にはトンネルを使用します。

**オプション A: ngrok**

```bash
ngrok http 3978
# Copy the https URL, e.g., https://abc123.ngrok.io
# Set messaging endpoint to: https://abc123.ngrok.io/api/messages
```

**オプション B: テールスケール ファネル**

```bash
tailscale funnel 3978
# Use your Tailscale funnel URL as the messaging endpoint
```

## Teams 開発者ポータル (代替)

マニフェスト ZIP を手動で作成する代わりに、[Teams 開発者ポータル](https://dev.teams.microsoft.com/apps) を使用できます。

1. [**+新しいアプリ**] をクリックします。
2. 基本情報 (名前、説明、開発者情報) を入力します。
3. **アプリの機能** → **ボット** に移動します
4. [**ボット ID を手動で入力してください**] を選択し、Azure Bot App ID を貼り付けます
5. 範囲を確認します: **個人**、**チーム**、**グループ チャット**
6. [**配布**] → [**アプリ パッケージのダウンロード**] をクリックします。
7. Teams で: **アプリ** → **アプリの管理** → **カスタム アプリのアップロード** → ZIP を選択します

多くの場合、これは JSON マニフェストを手動で編集するよりも簡単です。

## ボットのテスト

**オプション A: Azure Web チャット (最初に Webhook を確認します)**

1. Azure Portal → Azure Bot リソース → **Web チャットでテスト**
2. メッセージを送信します - 応答が表示されます。
3. これにより、Teams のセットアップ前に Webhook エンドポイントが機能することが確認されます。**オプション B: Teams (アプリのインストール後)**

4. Teams アプリをインストールします (サイドロードまたは組織カタログ)
5. Teams でボットを見つけて DM を送信します
6. ゲートウェイのログで受信アクティビティを確認します。

## セットアップ (最小限のテキストのみ)

1. **Microsoft Teams プラグインをインストールします**
   - npm から: `openclaw plugins install @openclaw/msteams`
   - ローカルチェックアウトから: `openclaw plugins install ./extensions/msteams`

2. **ボットの登録**
   - Azure ボットを作成し (上記を参照)、次の点に注意してください。
     - アプリID
     - クライアントシークレット（アプリパスワード）
       ・テナントID（シングルテナント）

3. **Teams アプリのマニフェスト**
   - `botId = <App ID>` とともに `bot` エントリを含めます。
   - スコープ: `personal`、`team`、`groupChat`。
   - `supportsFiles: true` (個人スコープ ファイルの処理に必要)。
   - RSC 権限を追加します (下記)。
   - アイコンを作成します: `outline.png` (32x32) および `color.png` (192x192)。
   - 3 つのファイルをすべて zip 圧縮します: `manifest.json`、`outline.png`、`color.png`。

4. **OpenClaw の構成**

   ```json
   {
     "msteams": {
       "enabled": true,
       "appId": "<APP_ID>",
       "appPassword": "<APP_PASSWORD>",
       "tenantId": "<TENANT_ID>",
       "webhook": { "port": 3978, "path": "/api/messages" }
     }
   }
   ```

   構成キーの代わりに環境変数を使用することもできます。
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **ボットエンドポイント**
   - Azure Bot メッセージング エンドポイントを次のように設定します。
     - `https://<host>:3978/api/messages` (または選択したパス/ポート)。

6. **ゲートウェイを実行します**
   - プラグインがインストールされ、`msteams` 構成が資格情報とともに存在すると、Teams チャネルが自動的に開始されます。

## 歴史の背景- `channels.msteams.historyLimit` は、プロンプトにラップされる最近のチャネル/グループ メッセージの数を制御します

- `messages.groupChat.historyLimit` にフォールバックします。 `0` を無効に設定します (デフォルトは 50)。
- `channels.msteams.dmHistoryLimit` (ユーザーターン) で DM 履歴を制限できます。ユーザーごとのオーバーライド: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限 (マニフェスト)

これらは、Teams アプリ マニフェストの **既存の resourceSpecific 権限** です。これらは、アプリがインストールされているチーム/チャット内にのみ適用されます。

**チャネルの場合 (チーム範囲):**

- `ChannelMessage.Read.Group` (アプリケーション) - @メンションなしですべてのチャネル メッセージを受信します
- `ChannelMessage.Send.Group` (アプリケーション)
- `Member.Read.Group` (アプリケーション)
- `Owner.Read.Group` (アプリケーション)
- `ChannelSettings.Read.Group` (アプリケーション)
- `TeamMember.Read.Group` (アプリケーション)
- `TeamSettings.Read.Group` (アプリケーション)

**グループチャットの場合:**

- `ChatMessage.Read.Chat` (アプリケーション) - @メンションなしですべてのグループ チャット メッセージを受信します

## チームマニフェストの例 (編集済み)

必須フィールドを含む最小限の有効な例。 ID と URL を置き換えます。

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": { "short": "OpenClaw" },
  "developer": {
    "name": "Your Org",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "description": { "short": "OpenClaw in Teams", "full": "OpenClaw in Teams" },
  "icons": { "outline": "outline.png", "color": "color.png" },
  "accentColor": "#5B6DEF",
  "bots": [
    {
      "botId": "11111111-1111-1111-1111-111111111111",
      "scopes": ["personal", "team", "groupChat"],
      "isNotificationOnly": false,
      "supportsCalling": false,
      "supportsVideo": false,
      "supportsFiles": true
    }
  ],
  "webApplicationInfo": {
    "id": "11111111-1111-1111-1111-111111111111"
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        { "name": "ChannelMessage.Read.Group", "type": "Application" },
        { "name": "ChannelMessage.Send.Group", "type": "Application" },
        { "name": "Member.Read.Group", "type": "Application" },
        { "name": "Owner.Read.Group", "type": "Application" },
        { "name": "ChannelSettings.Read.Group", "type": "Application" },
        { "name": "TeamMember.Read.Group", "type": "Application" },
        { "name": "TeamSettings.Read.Group", "type": "Application" },
        { "name": "ChatMessage.Read.Chat", "type": "Application" }
      ]
    }
  }
}
```

### マニフェストの注意事項 (必須フィールド)- `bots[].botId` **Azure Bot App ID と一致する必要があります**

- `webApplicationInfo.id` **Azure Bot App ID と一致する必要があります**。
- `bots[].scopes` には、使用する予定のサーフェス (`personal`、`team`、`groupChat`) を含める必要があります。
- 個人スコープでのファイル処理には `bots[].supportsFiles: true` が必要です。
- チャネル トラフィックが必要な場合は、`authorization.permissions.resourceSpecific` にチャネル読み取り/送信を含める必要があります。

### 既存のアプリの更新

すでにインストールされている Teams アプリを更新するには (例: RSC アクセス許可を追加するため):

1. `manifest.json` を新しい設定で更新します
2. **`version` フィールドをインクリメントします** (例: `1.0.0` → `1.1.0`)
3. アイコン (`manifest.json`、`outline.png`、`color.png`) を含むマニフェストを **再圧縮**します。
4. 新しい zip をアップロードします。
   - **オプション A (Teams 管理センター):** Teams 管理センター → Teams アプリ → アプリの管理 → アプリの検索 → 新しいバージョンのアップロード
   - **オプション B (サイドロード):** Teams → アプリ → アプリの管理 → カスタム アプリのアップロード
5. **チーム チャネルの場合:** 新しい権限を有効にするには、各チームにアプリを再インストールします。
6. **Teams を完全に終了して再起動** (ウィンドウを閉じるだけではなく)、キャッシュされたアプリのメタデータをクリアします

## 機能: RSC のみ vs グラフ

### **Teams RSC のみ** (アプリがインストールされており、Graph API 権限なし)

作品:

- チャンネル メッセージ **テキスト** コンテンツを読み取ります。
- チャンネル メッセージ **テキスト** コンテンツを送信します。
- **個人 (DM)** ファイルの添付ファイルを受信します。

機能しない:- チャネル/グループ **画像またはファイルのコンテンツ** (ペイロードには HTML スタブのみが含まれます)。

- SharePoint/OneDrive に保存されている添付ファイルのダウンロード。
- メッセージ履歴の読み取り (ライブ Webhook イベント以外)。

### **Teams RSC + Microsoft Graph アプリケーション権限** を使用

追加:

- ホストされているコンテンツ (メッセージに貼り付けられた画像) のダウンロード。
- SharePoint/OneDrive に保存されている添付ファイルのダウンロード。
- グラフ経由でチャンネル/チャットメッセージ履歴を読み取ります。

### RSC とグラフ API

| 能力                         | RSC 権限                            | グラフAPI                            |
| ---------------------------- | ----------------------------------- | ------------------------------------ |
| **リアルタイム メッセージ**  | はい (Webhook 経由)                 | いいえ (ポーリングのみ)              |
| **履歴メッセージ**           | いいえ                              | はい (履歴をクエリできます)          |
| **セットアップの複雑さ**     | アプリマニフェストのみ              | 管理者の同意 + トークン フローが必要 |
| **オフラインでも動作します** | いいえ (実行している必要があります) | はい (いつでも問い合わせてください)  |

**結論:** RSC はリアルタイム リスニング用です。グラフ API は履歴アクセス用です。オフライン中に見逃したメッセージを確認するには、`ChannelMessage.Read.All` を使用した Graph API が必要です (管理者の同意が必要です)。

## グラフ対応メディア + 履歴 (チャネルに必要)**チャンネル**内の画像/ファイルが必要な場合、または**メッセージ履歴**を取得したい場合は、Microsoft Graphのアクセス許可を有効にし、管理者の同意を与える必要があります

1. Entra ID (Azure AD) **アプリの登録**で、Microsoft Graph **アプリケーションのアクセス許可**を追加します。
   - `ChannelMessage.Read.All` (チャネル添付ファイル + 履歴)
   - `Chat.Read.All` または `ChatMessage.Read.All` (グループ チャット)
2. テナントに **管理者の同意を与えます**。
3. Teams アプリの **マニフェスト バージョン**を更新し、再アップロードして、**Teams にアプリを再インストールします**。
4. **Teams を完全に終了して再起動**して、キャッシュされたアプリのメタデータをクリアします。

**ユーザー メンションに対する追加の権限:** ユーザーの @メンションは、会話内のユーザーに対してそのまま機能します。ただし、**現在の会話に参加していない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All` (アプリケーション) 権限を追加し、管理者の同意を与えます。

## 既知の制限事項

### Webhook タイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合 (LLM 応答が遅いなど)、次のようなメッセージが表示される場合があります。

- ゲートウェイのタイムアウト
- チームがメッセージを再試行する (重複が発生する)
- 返信が削除されました

OpenClaw は、迅速に応答し、積極的に応答を送信することでこれに対処しますが、応答が非常に遅いと依然として問題が発生する可能性があります。

### 書式設定

Teams のマークダウンは、Slack や Discord よりも制限されています。- 基本的な書式設定の機能: **太字**、_italic_、`code`、リンク

- 複雑なマークダウン (テーブル、ネストされたリスト) は正しくレンダリングされない場合があります
- アダプティブ カードは、ポーリングおよび任意のカード送信に対してサポートされています (下記を参照)

## 構成

主要な設定 (共有チャネル パターンについては `/gateway/configuration` を参照):- `channels.msteams.enabled`: チャネルを有効/無効にします。

- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: ボットの認証情報。
- `channels.msteams.webhook.port` (デフォルト `3978`)
- `channels.msteams.webhook.path` (デフォルト `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: ペアリング)
- `channels.msteams.allowFrom`: DM 許可リスト (AAD オブジェクト ID を推奨)。グラフ アクセスが使用可能な場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能な UPN/表示名の一致を再度有効にするためのブレークグラス切り替え。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンク サイズ。
- `channels.msteams.chunkMode`: `length` (デフォルト) または `newline` は、長さをチャンクする前に空白行 (段落境界) で分割します。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイル ホストの許可リスト (デフォルトは Microsoft/Teams ドメイン)。
- `channels.msteams.mediaAuthAllowHosts`: メディアの再試行時に Authorization ヘッダーを添付するための許可リスト (デフォルトは Graph + Bot Framework ホスト)。
- `channels.msteams.requireMention`: チャネル/グループで @mention が必要です (デフォルトは true)。
- `channels.msteams.replyStyle`: `thread | top-level` ([返信スタイル](#reply-style-threads-vs-posts) を参照)。
- `channels.msteams.teams.<teamId>.replyStyle`: チームごとの上書き。
- `channels.msteams.teams.<teamId>.requireMention`: チームごとの上書き。
- `channels.msteams.teams.<teamId>.tools`: チャネル オーバーライドが欠落している場合に使用される、デフォルトのチームごとのツール ポリシー オーバーライド (`allow`/`deny`/`alsoAllow`)。
- `channels.msteams.teams.<teamId>.toolsBySender`: デフォルトのチームごと、送信者ごとのツール ポリシーがオーバーライドされます (`"*"` ワイルドカードがサポートされています)。- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネルごとのオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネルごとのオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネルごとのツール ポリシーのオーバーライド (`allow`/`deny`/`alsoAllow`)。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネルごと、送信者ごとのツール ポリシーをオーバーライドします (`"*"` ワイルドカードがサポートされています)。
- `toolsBySender` キーには明示的なプレフィックスを使用する必要があります。
  `id:`、`e164:`、`username:`、`name:` (従来の接頭辞のないキーは引き続き `id:` にのみマップされます)。
- `channels.msteams.sharePointSiteId`: グループ チャット/チャネルでのファイル アップロード用の SharePoint サイト ID ([グループ チャットでのファイルの送信](#sending-files-in-group-chats) を参照)。

## ルーティングとセッション

- セッション キーは標準エージェント形式に従います ([/concepts/session](/concepts/session) を参照)。
  - ダイレクト メッセージはメイン セッションを共有します (`agent:<agentId>:<mainKey>`)。
  - チャネル/グループ メッセージは会話 ID を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッド vs 投稿

| Teams は最近、同じ基盤となるデータ モデル上に 2 つのチャネル UI スタイルを導入しました。 | スタイル                                                                                           | 説明 | 推奨 `replyStyle` |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---- | ----------------- |
| **投稿** (クラシック)                                                                    | メッセージはカードとして表示され、その下にスレッド形式の返信が表示されます。 `thread` (デフォルト) |
| **スレッド** (Slack のような)                                                            | メッセージは直線的に流れ、Slack に似ています。 `top-level`                                         |

**問題:** Teams API は、チャネルが使用する UI スタイルを公開しません。間違った `replyStyle` を使用した場合:

- スレッド形式のチャネルの `thread` → 返信が不自然にネストされて表示されます
- 投稿スタイルのチャネルの `top-level` → 返信はスレッド内ではなく別のトップレベルの投稿として表示されます

**解決策:** チャネルの設定方法に基づいて、チャネルごとに `replyStyle` を構成します。

```json
{
  "msteams": {
    "replyStyle": "thread",
    "teams": {
      "19:abc...@thread.tacv2": {
        "channels": {
          "19:xyz...@thread.tacv2": {
            "replyStyle": "top-level"
          }
        }
      }
    }
  }
}
```

## 添付ファイルと画像

**現在の制限事項:**

- **DM:** 画像と添付ファイルは、Teams ボット ファイル API を介して機能します。
- **チャネル/グループ:** 添付ファイルは M365 ストレージ (SharePoint/OneDrive) に存在します。 Webhook ペイロードには HTML スタブのみが含まれ、実際のファイル バイトは含まれません。 **チャンネルの添付ファイルをダウンロードするには、**Graph API 権限が必要です\*_。Graph 権限がないと、画像を含むチャネル メッセージはテキストのみとして受信されます (ボットは画像コンテンツにアクセスできません)。
  デフォルトでは、OpenClaw は Microsoft/Teams ホスト名からのみメディアをダウンロードします。 `channels.msteams.mediaAllowHosts` でオーバーライドします (任意のホストを許可するには `["_"]` を使用します)。
認証ヘッダーは、`channels.msteams.mediaAuthAllowHosts` のホストにのみ添付されます (デフォルトは Graph + Bot Framework ホスト)。このリストは厳密にしてください (マルチテナント サフィックスは避けてください)。

## グループチャットでのファイルの送信

ボットは、FileConsentCard フロー (組み込み) を使用して DM でファイルを送信できます。ただし、**グループ チャット/チャネルでファイルを送信**するには、追加の設定が必要です。

| コンテキスト                    | ファイルの送信方法                                      | セットアップが必要です                    |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| **DM**                          | FileConsentCard → ユーザーが承認 → ボットがアップロード | すぐに使える                              |
| **グループ チャット/チャネル**  | SharePoint にアップロード → リンクを共有                | `sharePointSiteId` + グラフ権限が必要です |
| **画像 (あらゆるコンテキスト)** | Base64 エンコードされたインライン                       | すぐに使える                              |

### グループ チャットに SharePoint が必要な理由ボットには個人用の OneDrive ドライブがありません (`/me/drive` Graph API エンドポイントはアプリケーション ID に対して機能しません)。グループ チャット/チャネルでファイルを送信するには、ボットは **SharePoint サイト**にアップロードし、共有リンクを作成します

### セットアップ

1. Entra ID (Azure AD) → アプリ登録で **Graph API 権限を追加**:
   - `Sites.ReadWrite.All` (アプリケーション) - ファイルを SharePoint にアップロードします
   - `Chat.Read.All` (アプリケーション) - オプション、ユーザーごとの共有リンクを有効にします

2. テナントに **管理者の同意を与えます**。

3. **SharePoint サイト ID を取得します:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw を構成します:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共有行動

| 許可                                    | 共有行動                                                       |
| --------------------------------------- | -------------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ              | 組織全体の共有リンク (組織内の誰もがアクセス可能)              |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク (チャット メンバーのみがアクセス可能) |

ユーザーごとの共有は、チャット参加者のみがファイルにアクセスできるため、より安全です。 `Chat.Read.All` 権限がない場合、ボットは組織全体の共有に戻ります。

### フォールバック動作|シナリオ |結果 |

| -------------------------------------------------- | -------------------------------------------------- |
|グループ チャット + ファイル + `sharePointSiteId` が構成されました | SharePoint にアップロード、共有リンクを送信 |
|グループ チャット + ファイル + いいえ `sharePointSiteId` | OneDrive のアップロードを試行します (失敗する可能性があります)。テキストのみを送信します。
|個人チャット + ファイル | FileConsentCard フロー (SharePoint なしで動作) |
|任意のコンテキスト + 画像 | Base64 エンコードされたインライン (SharePoint なしで動作) |

### ファイルの保存場所

アップロードされたファイルは、構成された SharePoint サイトの既定のドキュメント ライブラリの `/OpenClawShared/` フォルダーに保存されます。

## 投票 (アダプティブ カード)

OpenClaw は、Teams 投票をアダプティブ カードとして送信します (ネイティブの Teams 投票 API はありません)。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票はゲートウェイによって `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するには、ゲートウェイがオンラインのままである必要があります。
- 投票では、結果の概要はまだ自動投稿されません (必要に応じてストア ファイルを検査します)。

## アダプティブ カード (任意)

`message` ツールまたは CLI を使用して、アダプティブ カード JSON を Teams ユーザーまたは会話に送信します。

`card` パラメーターは、アダプティブ カード JSON オブジェクトを受け入れます。 `card` を指定する場合、メッセージ テキストはオプションです。

**エージェントツール:**

```json
{
"action": "send",
"channel": "msteams",
"target": "user:<id>",
"card": {
"type": "AdaptiveCard",
"version": "1.5",
"body": [{ "type": "TextBlock", "text": "Hello!" }]
}
}

````

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
````

カードのスキーマと例については、[アダプティブ カードのドキュメント](https://adaptivecards.io/) を参照してください。ターゲット形式の詳細については、以下の [ターゲット形式](#target-formats) を参照してください。

## ターゲット形式

MSTeam ターゲットは、プレフィックスを使用してユーザーと会話を区別します。

| ターゲットの種類       | フォーマット                     | 例                                                     |
| ---------------------- | -------------------------------- | ------------------------------------------------------ |
| ユーザー (ID 別)       | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`            |
| ユーザー (名前順)      | `user:<display-name>`            | `user:John Smith` (グラフ API が必要)                  |
| グループ/チャンネル    | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`               |
| グループ/チャネル (生) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` が含まれる場合) |

**CLI の例:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send an Adaptive Card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**エージェント ツールの例:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:John Smith",
  "message": "Hello!"
}
```

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "conversation:19:abc...@thread.tacv2",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "Hello" }]
  }
}
```

注: `user:` 接頭辞がないと、名前はデフォルトでグループ/チーム解決になります。表示名でユーザーをターゲットにする場合は、常に `user:` を使用してください。

## プロアクティブなメッセージング

- プロアクティブ メッセージは、ユーザーが対話した**後**にのみ可能です。これは、その時点で会話の参照が保存されるためです。
- `dmPolicy` とホワイトリスト ゲーティングについては、`/gateway/configuration` を参照してください。## チーム ID とチャネル ID (よくある問題)

Teams URL の `groupId` クエリ パラメーターは、構成に使用されるチーム ID ではありません\*\*。代わりに URL パスから ID を抽出します。

**チームURL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode this)
```

**チャンネルURL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**構成の場合:**

- チーム ID = `/team/` 以降のパス セグメント (URL デコードされたもの、例: `19:Bk4j...@thread.tacv2`)
- チャネル ID = `/channel/` 以降のパス セグメント (URL デコード)
- **無視** `groupId` クエリ パラメーター

## プライベートチャンネル

ボットはプライベート チャネルでのサポートが制限されています。

| 特集                              | 標準チャンネル | プライベートチャンネル       |
| --------------------------------- | -------------- | ---------------------------- |
| ボットのインストール              | はい           | 限定                         |
| リアルタイム メッセージ (Webhook) | はい           | 動作しない可能性があります   |
| RSC 権限                          | はい           | 動作が異なる可能性があります |
| @メンション                       | はい           | ボットがアクセス可能かどうか |
| グラフ API 履歴                   | はい           | はい (許可あり)              |

**プライベート チャネルが機能しない場合の回避策:**

1. ボットとのやり取りに標準チャネルを使用する
2. DM を使用する - ユーザーはいつでもボットに直接メッセージを送信できます
3. 履歴アクセスにはグラフ API を使用します (`ChannelMessage.Read.All` が必要)

## トラブルシューティング

### よくある問題- **チャンネルに画像が表示されない:** グラフの権限または管理者の同意がありません。 Teams アプリを再インストールし、Teams を完全に終了して再度開きます

- **チャネル内に応答はありません:** デフォルトではメンションが必須です。 `channels.msteams.requireMention=false` を設定するか、チーム/チャネルごとに設定します。
- **バージョンの不一致 (Teams にはまだ古いマニフェストが表示されます):** アプリを削除して再追加し、Teams を完全に終了して更新します。
- **401 Unauthorized from webhook:** Azure JWT を使用せずに手動でテストする場合に予想されます - エンドポイントは到達可能ですが、認証に失敗したことを意味します。 Azure Web Chat を使用して適切にテストしてください。

### マニフェストのアップロード エラー

- **「アイコン ファイルを空にすることはできません」:** マニフェストは 0 バイトのアイコン ファイルを参照しています。有効な PNG アイコン (`outline.png` の場合は 32x32、`color.png` の場合は 192x192) を作成します。
- **「webApplicationInfo.Id はすでに使用されています」:** アプリはまだ別のチーム/チャットにインストールされています。最初にそれを見つけてアンインストールするか、伝播するまで 5 ～ 10 分待ちます。
- **アップロード時に「問題が発生しました」:** [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 経由でアップロードする代わりに、ブラウザーの DevTools (F12) → [ネットワーク] タブを開き、応答本文で実際のエラーを確認してください。
- **サイドロードの失敗:** 「カスタム アプリをアップロードする」の代わりに「組織のアプリ カタログにアプリをアップロードする」を試してください。これにより、多くの場合、サイドロードの制限が回避されます。

### RSC 権限が機能しない1. `webApplicationInfo.id` がボットのアプリ ID と正確に一致することを確認します

2. アプリを再アップロードし、チーム/チャットに再インストールします
3. 組織管理者が RSC 権限をブロックしていないか確認します。
4. 正しいスコープを使用していることを確認します: チームの場合は `ChannelMessage.Read.Group`、グループ チャットの場合は `ChatMessage.Read.Chat`

## 参考文献

- [Azure Botの作成](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Botセットアップガイド
- [Teams 開発者ポータル](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams アプリのマニフェスト スキーマ](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC でチャネル メッセージを受信](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 権限リファレンス](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams ボット ファイルの処理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (チャネル/グループにはグラフが必要です)
- [プロアクティブなメッセージング](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
