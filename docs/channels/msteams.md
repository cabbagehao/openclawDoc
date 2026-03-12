---
summary: "Microsoft Teams ボットのサポートステータス、機能、および構成"
read_when:
  - Microsoft Teams チャネル機能の開発
title: "Microsoft Teams"
seoTitle: "OpenClawのMicrosoft Teamsボット連携の設定方法と運用ガイド"
description: "Microsoft Teams ボット連携の現状と設定方法をまとめます。対応範囲、前提条件、構成手順、既知の制約を確認できます。"
x-i18n:
  source_hash: "9559705b08291578f9d476ea4924d53aa77ae81d682a95d93e9b148430007e32"
---
> 「ここに入る者よ、一切の希望を捨てよ。」

更新日: 2026-01-21

ステータス: テキストおよび DM での添付ファイルをサポート。チャネルやグループでのファイル送信には `sharePointSiteId` と Graph API の権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）。投票は Adaptive Cards 経由で送信されます。

## プラグインが必要

Microsoft Teams はプラグインとして提供されており、コアインストールには同梱されていません。

**重大な変更 (2026.1.15):** Microsoft Teams はコアから分離されました。利用する場合はプラグインをインストールする必要があります。

理由: コアインストールの軽量化と、Microsoft Teams の依存関係を個別に更新できるようにするためです。

CLI (npm レジストリ) 経由でインストールします:

```bash
openclaw plugins install @openclaw/msteams
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/msteams
```

構成/オンボーディング中に Teams を選択し、git チェックアウトが検出された場合、OpenClaw は自動的にローカルインストールパスを提案します。

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. Microsoft Teams プラグインをインストールします。
2. **Azure Bot** (アプリ ID + クライアントシークレット + テナント ID) を作成します。
3. これらの認証情報を使用して OpenClaw を構成します。
4. パブリック URL またはトンネル経由で `/api/messages`（デフォルトポートは 3978）を公開します。
5. Teams アプリパッケージをインストールし、ゲートウェイを起動します。

最小限の構成:

```json5
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
```

注: グループチャットはデフォルトでブロックされています（`channels.msteams.groupPolicy: "allowlist"`）。グループでの応答を許可するには、`channels.msteams.groupAllowFrom` を設定するか、メンション制限付きで誰でも許可する場合は `groupPolicy: "open"` を使用してください。

## 目標

- Teams の DM、グループチャット、またはチャネル経由で OpenClaw と会話する。
- 確定的なルーティングを維持する: 返信は常にメッセージが届いたチャネルに戻されます。
- 安全なデフォルト設定: 特に設定がない限り、応答にはメンションが必要です。

## 構成の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` による構成の更新を許可しています（`commands.config: true` が必要です）。

無効にするには以下のように設定します:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御 (DM + グループ)

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。承認されるまで、未知の送信者は無視されます。
- `channels.msteams.allowFrom` には、不変の AAD オブジェクト ID を使用してください。
- UPN や表示名は変更可能なため、これらによる直接一致はデフォルトで無効になっています。`channels.msteams.dangerouslyAllowNameMatching: true` を設定した場合のみ有効になります。
- 構成ウィザードでは、権限があれば Microsoft Graph 経由で名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロックされます）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用してください。
- `channels.msteams.groupAllowFrom` は、グループチャットやチャネルでボットをトリガーできる送信者を制御します（未設定時は `channels.msteams.allowFrom` にフォールバックします）。
- `groupPolicy: "open"` を設定すると、誰でもボットをトリガーできるようになります（ただしデフォルトでメンションが必要です）。
- **すべてのチャネルを禁止**するには、`channels.msteams.groupPolicy: "disabled"` を設定してください。

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

**チーム + チャネル許可リスト**

- `channels.msteams.teams` 配下にチームとチャネルをリストすることで、グループやチャネルでの返信対象を制限できます。
- キーにはチーム ID または名前を指定できます。チャネルのキーには会話 ID または名前を指定できます。
- `groupPolicy="allowlist"` かつチーム許可リストが存在する場合、リストされたチーム/チャネルのみが許可されます（メンション制限あり）。
- 構成ウィザードでは `チーム名/チャネル名` 形式での入力を受け付け、自動的に保存します。
- 起動時、OpenClaw は許可リスト内のチーム/チャネル名およびユーザー名を ID に解決し（Graph 権限がある場合）、そのマッピングをログに出力します。未解決のエントリは入力された形式のまま保持されます。

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
3. ボットを参照し、後述の RSC 権限を含む **Teams アプリパッケージ** を構築します。
4. Teams アプリをチーム（または DM 用に個人スコープ）にアップロード/インストールします。
5. `~/.openclaw/openclaw.json` (または環境変数) で `msteams` を構成し、ゲートウェイを起動します。
6. ゲートウェイはデフォルトで `/api/messages` において Bot Framework の Webhook トラフィックをリッスンします。

## Azure Bot のセットアップ (前提条件)

OpenClaw を構成する前に、Azure Bot リソースを作成する必要があります。

### ステップ 1: Azure Bot を作成する

1. [Azure Bot の作成](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します。
2. **[基本]** タブを入力します:

   | フィールド | 値 |
   | :--- | :--- |
   | **ボットハンドル** | ボット名。例: `openclaw-msteams` (一意である必要があります) |
   | **サブスクリプション** | Azure サブスクリプションを選択 |
   | **リソースグループ** | 新規作成または既存のものを選択 |
   | **価格ティア** | 開発/テスト用には **Free** |
   | **アプリの種類** | **Single Tenant** (推奨 - 下記の注を参照) |
   | **作成タイプ** | **Create new Microsoft App ID** |

> **非推奨の通知:** マルチテナントボットの新規作成は 2025-07-31 以降非推奨となりました。新しいボットには **Single Tenant** を使用してください。

3. **[確認および作成]** → **[作成]** をクリックします（1〜2 分待ちます）。

### ステップ 2: 認証情報を取得する

1. 作成した Azure Bot リソースの **[構成]** に移動します。
2. **Microsoft アプリ ID** をコピーします。これが `appId` です。
3. **[管理]** をクリックしてアプリの登録に移動します。
4. **[証明書とシークレット]** → **[新しいクライアントシークレット]** → 生成された **値** をコピーします。これが `appPassword` です。
5. **[概要]** に移動し、**ディレクトリ (テナント) ID** をコピーします。これが `tenantId` です。

### ステップ 3: メッセージングエンドポイントを構成する

1. Azure Bot の **[構成]** に戻ります。
2. **メッセージングエンドポイント** を Webhook URL に設定します:
   - 本番環境: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用してください（後述の [ローカル開発](#local-development-tunneling) を参照）。

### ステップ 4: Teams チャネルを有効にする

1. Azure Bot の **[チャネル]** に移動します。
2. **Microsoft Teams** をクリックし、構成を保存します。
3. 利用規約に同意します。

## ローカル開発 (トンネリング)

Teams は `localhost` に直接到達できません。ローカル開発にはトンネルを使用してください。

**オプション A: ngrok**

```bash
ngrok http 3978
# 表示された https URL (例: https://abc123.ngrok.io) をコピーします。
# メッセージングエンドポイントを次のように設定します: https://abc123.ngrok.io/api/messages
```

**オプション B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Tailscale Funnel の URL をメッセージングエンドポイントとして使用します。
```

## Teams Developer Portal (代替方法)

マニフェスト ZIP を手動で作成する代わりに、[Teams Developer Portal](https://dev.teams.microsoft.com/apps) を使用できます。

1. **[+ New app]** をクリックします。
2. 基本情報（名前、説明、開発者情報）を入力します。
3. **[App features]** → **[Bot]** に移動します。
4. **[Enter a bot ID manually]** を選択し、Azure Bot のアプリ ID を貼り付けます。
5. スコープ（**Personal**, **Team**, **Group Chat**）にチェックを入れます。
6. **[Publish]** → **[Download app package]** をクリックします。
7. Teams で: **[アプリ]** → **[アプリの管理]** → **[カスタムアプリをアップロード]** → ZIP を選択します。

これは JSON マニフェストを手動で編集するよりも簡単な場合が多いです。

## ボットのテスト

**オプション A: Azure Web チャット (最初に Webhook を確認)**

1. Azure ポータル → Azure Bot リソース → **[Web チャットでテスト]** に移動します。
2. メッセージを送信し、応答があるか確認します。
3. これにより、Teams の設定前に Webhook エンドポイントが正常に動作していることが確認できます。

**オプション B: Teams (アプリインストール後)**

1. Teams アプリをインストールします（サイドロードまたは組織のカタログ経由）。
2. Teams でボットを探し、DM を送信します。
3. ゲートウェイのログで受信アクティビティを確認します。

## セットアップ (テキストのみの最小構成)

1. **Microsoft Teams プラグインをインストールする**
   - npm から: `openclaw plugins install @openclaw/msteams`
   - ローカルチェックアウトから: `openclaw plugins install ./extensions/msteams`

2. **ボットの登録**
   - 上記の手順に従って Azure Bot を作成し、以下をメモします:
     - アプリ ID
     - クライアントシークレット (アプリパスワード)
     - テナント ID (Single Tenant)

3. **Teams アプリマニフェスト**
   - `botId = <App ID>` を含む `bot` エントリを含めます。
   - スコープに `personal`, `team`, `groupChat` を含めます。
   - 個人スコープでのファイル処理用に `supportsFiles: true` を設定します。
   - 後述の RSC 権限を追加します。
   - アイコンファイル `outline.png` (32x32) と `color.png` (192x192) を作成します。
   - `manifest.json`, `outline.png`, `color.png` の 3 つを ZIP 圧縮します。

4. **OpenClaw を構成する**

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

   構成ファイルのキーの代わりに環境変数を使用することもできます:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **ボットのエンドポイント**
   - Azure Bot のメッセージングエンドポイントを以下に設定します:
     - `https://<host>:3978/api/messages` (または自身で設定したパス/ポート)

6. **ゲートウェイを実行する**
   - プラグインがインストールされ、認証情報を含む `msteams` 構成が存在すれば、Teams チャネルは自動的に開始されます。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、プロンプトに含まれる最近のチャネル/グループメッセージの数を制御します。
- 未設定時は `messages.groupChat.historyLimit` にフォールバックします。`0` を設定すると無効になります（デフォルトは 50）。
- DM の履歴は `channels.msteams.dmHistoryLimit` (ユーザーのターン数) で制限できます。ユーザーごとのオーバーライドは `channels.msteams.dms["<user_id>"].historyLimit` です。

## 現在の Teams RSC 権限 (マニフェスト)

これらは Teams アプリマニフェストにおける **resourceSpecific 権限** です。これらはアプリがインストールされているチーム/チャット内でのみ適用されます。

**チャネル用 (チームスコープ):**

- `ChannelMessage.Read.Group` (Application) - @メンションなしですべてのチャネルメッセージを受信
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**グループチャット用:**

- `ChatMessage.Read.Chat` (Application) - @メンションなしですべてのグループチャットメッセージを受信

## Teams マニフェストの例 (抜粋)

必須フィールドを含む最小限の有効な例です。ID と URL は適宜置き換えてください。

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

### マニフェストに関する注意点 (必須フィールド)

- `bots[].botId` は Azure Bot のアプリ ID と **必ず** 一致させる必要があります。
- `webApplicationInfo.id` も Azure Bot のアプリ ID と **必ず** 一致させる必要があります。
- `bots[].scopes` には、利用予定のサーフェス（`personal`, `team`, `groupChat`）を含める必要があります。
- 個人スコープでのファイル処理には `bots[].supportsFiles: true` が必須です。
- チャネルのトラフィックを受信するには、`authorization.permissions.resourceSpecific` にチャネルの読み取り/送信権限を含める必要があります。

### 既存のアプリの更新

インストール済みの Teams アプリを更新する場合（RSC 権限の追加など）:

1. `manifest.json` を新しい設定で更新します。
2. **`version` フィールドをインクリメント**します（例: `1.0.0` → `1.1.0`）。
3. アイコンを含めて再度 ZIP 圧縮します (`manifest.json`, `outline.png`, `color.png`)。
4. 新しい ZIP をアップロードします:
   - **オプション A (Teams 管理センター):** 管理センター → Teams アプリ → アプリの管理 → 対象のアプリを検索 → [新しいバージョンのアップロード]
   - **オプション B (サイドロード):** Teams → アプリ → アプリの管理 → [カスタムアプリをアップロード]
5. **チームチャネルの場合:** 新しい権限を有効にするには、各チームでアプリを再インストールしてください。
6. **Teams を完全に終了して再起動**し（ウィンドウを閉じるだけでなく）、キャッシュされたメタデータをクリアします。

## 機能: RSC のみ vs Graph API

### **Teams RSC のみ** の場合（アプリインストールのみ、Graph API 権限なし）

可能なこと:
- チャネルメッセージの **テキスト** コンテンツの読み取り。
- チャネルメッセージの **テキスト** コンテンツの送信。
- **個人 (DM)** における添付ファイルの受信。

不可能なこと:
- チャネル/グループにおける **画像やファイルのコンテンツ** の取得（ペイロードには HTML のスタブのみが含まれます）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- メッセージ履歴の読み取り（ライブ Webhook イベント以外のもの）。

### **Teams RSC + Microsoft Graph アプリケーション権限** の場合

追加で可能なこと:
- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- Graph 経由でのチャネル/チャットメッセージ履歴の読み取り。

### RSC vs Graph API

| 機能 | RSC 権限 | Graph API |
| :--- | :--- | :--- |
| **リアルタイムメッセージ** | ✅ 可能 (Webhook 経由) | ❌ 不可 (ポーリングのみ) |
| **履歴メッセージ** | ❌ 不可 | ✅ 可能 (履歴のクエリ) |
| **セットアップの複雑さ** | アプリマニフェストのみ | 管理者の同意 + トークンフローが必要 |
| **オフライン動作** | ❌ 不可 (実行中である必要あり) | ✅ 可能 (いつでもクエリ可能) |

**結論:** RSC はリアルタイムの監視用、Graph API は履歴アクセス用です。オフライン中に届いたメッセージを確認するには、`ChannelMessage.Read.All` 権限を持つ Graph API が必要です（管理者の同意が必要です）。

## Graph を使用したメディア + 履歴 (チャネルで必要)

**チャネル** での画像/ファイルが必要な場合、または **メッセージ履歴** を取得したい場合は、Microsoft Graph の権限を有効にして管理者の同意を得る必要があります。

1. Entra ID (Azure AD) の **[アプリの登録]** で、以下の Microsoft Graph **アプリケーション権限** を追加します:
   - `ChannelMessage.Read.All` (チャネルの添付ファイル + 履歴)
   - `Chat.Read.All` または `ChatMessage.Read.All` (グループチャット)
2. テナントに対して **管理者の同意を付与** します。
3. Teams アプリの **マニフェストバージョンを上げ**、再アップロードして **Teams でアプリを再インストール** します。
4. **Teams を完全に終了して再起動** し、キャッシュをクリアします。

**ユーザーメンション用の追加権限:** 同じ会話内にいるユーザーへの @メンションは標準で動作します。ただし、**現在の会話に参加していない** ユーザーを動的に検索してメンションしたい場合は、`User.Read.All` (Application) 権限を追加して管理者の同意を得てください。

## 既知の制限事項

### Webhook のタイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。処理（LLM の応答など）に時間がかかりすぎると、以下が発生する可能性があります:
- ゲートウェイのタイムアウト
- Teams によるメッセージの再送（重複の原因）
- 返信の欠落

OpenClaw は、即座に応答を返しつつバックグラウンドで返信を送信することでこれに対処していますが、極端に応答が遅い場合には問題が発生することがあります。

### 書式設定

Teams の Markdown は Slack や Discord よりも制限されています:
- 基本的な書式は動作します: **太字**, _斜体_, `コード`, リンク
- 複雑な Markdown（テーブル、ネストされたリスト）は正しくレンダリングされない場合があります。
- 投票や任意のカード送信には Adaptive Cards がサポートされています（後述）。

## 構成

主な設定項目（共通のチャネルパターンについては `/gateway/configuration` を参照）:

- `channels.msteams.enabled`: チャネルの有効/無効。
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ボットの認証情報。
- `channels.msteams.webhook.port` (デフォルト `3978`)
- `channels.msteams.webhook.path` (デフォルト `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: pairing)
- `channels.msteams.allowFrom`: DM 許可リスト（AAD オブジェクト ID 推奨）。Graph アクセスが可能な場合、セットアップウィザードで名前から ID を解決できます。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能な UPN/表示名による一致を再有効化する非常用スイッチ。
- `channels.msteams.textChunkLimit`: アウトバウンドテキストのチャンクサイズ。
- `channels.msteams.chunkMode`: `length` (デフォルト) または `newline`（長さで分割する前に段落境界で分割）。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルのホスト許可リスト（デフォルトは Microsoft/Teams ドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付加するホストの許可リスト（デフォルトは Graph + Bot Framework ホスト）。このリストは厳密に保ってください。
- `channels.msteams.requireMention`: チャネル/グループでの @メンションを必須にする（デフォルト true）。
- `channels.msteams.replyStyle`: `thread | top-level` ([返信スタイル](#reply-style-threads-vs-posts) を参照)。
- `channels.msteams.teams.<teamId>.replyStyle`: チームごとの上書き。
- `channels.msteams.teams.<teamId>.requireMention`: チームごとの上書き。
- `channels.msteams.teams.<teamId>.tools`: チャネル固有の設定がない場合に使用される、チームごとのデフォルトツールポリシー (`allow`/`deny`/`alsoAllow`)。
- `channels.msteams.teams.<teamId>.toolsBySender`: チームごと、送信者ごとのデフォルトツールポリシー（`*` ワイルドカード対応）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネルごとのツールポリシー (`allow`/`deny`/`alsoAllow`)。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネルごと、送信者ごとのツールポリシー（`*` ワイルドカード対応）。
- `toolsBySender` のキーには明示的なプレフィックスを使用してください:
  `id:`, `e164:`, `username:`, `name:` (プレフィックスなしの古いキーは `id:` のみとして扱われます)。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロード用 SharePoint サイト ID（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います ([/concepts/session](/concepts/session) を参照):
  - DM はメインセッション (`agent:<agentId>:<mainKey>`) を共有します。
  - チャネル/グループメッセージは会話 ID を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッド vs 投稿

Teams では最近、同じデータモデルに対して 2 つのチャネル UI スタイルが導入されました:

| スタイル | 説明 | 推奨される `replyStyle` |
| :--- | :--- | :--- |
| **Posts** (クラシック) | メッセージがカードとして表示され、その下にスレッド形式の返信が並ぶ | `thread` (デフォルト) |
| **Threads** (Slack 風) | メッセージが Slack のように直線的に流れる | `top-level` |

**問題点:** Teams API はチャネルがどちらの UI スタイルを使用しているかを公開していません。誤った `replyStyle` を使用すると以下のようになります:
- スタイルが「Threads」のチャネルで `thread` を使用 → 返信が不自然にネストされる
- スタイルが「Posts」のチャネルで `top-level` を使用 → 返信がスレッド内ではなく、新しいトップレベルの投稿として作成される

**解決策:** チャネルの設定に合わせて、チャネルごとに `replyStyle` を構成してください:

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

- **DM:** 画像とファイル添付は Teams ボットのファイル API を通じて機能します。
- **チャネル/グループ:** 添付ファイルは M365 ストレージ (SharePoint/OneDrive) に保存されます。Webhook ペイロードには HTML のスタブのみが含まれ、実際のファイル内容は含まれません。チャネルの添付ファイルをダウンロードするには **Graph API の権限が必要** です。

Graph 権限がない場合、画像付きのチャネルメッセージはテキストのみとして受信されます（ボットは画像内容にアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams のホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書き可能です（`["*"]` で全ホストを許可）。
Authorization ヘッダーは、`channels.msteams.mediaAuthAllowHosts` にリストされたホストに対してのみ付加されます（デフォルトは Graph + Bot Framework ホスト）。

## グループチャットでのファイル送信

ボットは DM においては FileConsentCard フロー（組み込み）を使用してファイルを送信できます。しかし、**グループチャットやチャネルでファイルを送信する** には追加の設定が必要です:

| コンテキスト | 送信方法 | 必要な設定 |
| :--- | :--- | :--- |
| **DM** | FileConsentCard → ユーザー承諾 → ボットアップロード | 標準で動作 |
| **グループチャット/チャネル** | SharePoint へアップロード → 共有リンク送信 | `sharePointSiteId` + Graph 権限 |
| **画像 (全コンテキスト)** | Base64 エンコードされたインライン送信 | 標準で動作 |

### なぜグループチャットに SharePoint が必要なのか

ボットは個人の OneDrive ドライブを持っていません（`/me/drive` Graph API エンドポイントはアプリケーション ID では動作しません）。グループチャットやチャネルでファイルを送信するには、ボットは **SharePoint サイト** にアップロードして共有リンクを作成する必要があります。

### セットアップ

1. Entra ID (Azure AD) → アプリの登録で **Graph API 権限を追加** します:
   - `Sites.ReadWrite.All` (Application) - SharePoint へのファイルアップロード
   - `Chat.Read.All` (Application) - 任意。ユーザーごとの共有リンクを有効にします。

2. テナントに対して **管理者の同意を付与** します。

3. **SharePoint サイト ID を取得します:**

   ```bash
   # Graph Explorer または有効なトークンを用いた curl で取得:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" の場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # レスポンスに含まれる "id": "contoso.sharepoint.com,guid1,guid2" をメモします。
   ```

4. **OpenClaw を構成します:**

   ```json5
   {
     channels: {
       msteams: {
         // ... その他の設定 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共有動作

| 権限 | 共有動作 |
| :--- | :--- |
| `Sites.ReadWrite.All` のみ | 組織全体の共有リンク（組織内の誰でもアクセス可能） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク（チャット参加者のみアクセス可能） |

ユーザーごとの共有の方が、チャット参加者のみがファイルにアクセスできるため安全です。`Chat.Read.All` 権限がない場合、ボットは組織全体の共有にフォールバックします。

### フォールバック動作

| シナリオ | 結果 |
| :--- | :--- |
| グループチャット + ファイル + `sharePointSiteId` 設定あり | SharePoint へアップロードし、共有リンクを送信 |
| グループチャット + ファイル + `sharePointSiteId` 設定なし | OneDrive アップロードを試行（失敗の可能性あり）、テキストのみ送信 |
| 個人チャット + ファイル | FileConsentCard フロー (SharePoint 不要) |
| 全コンテキスト + 画像 | Base64 インライン送信 (SharePoint 不要) |

### ファイルの保存場所

アップロードされたファイルは、構成された SharePoint サイトのデフォルトドキュメントライブラリ内の `/OpenClawShared/` フォルダに保存されます。

## 投票 (Adaptive Cards)

OpenClaw は Teams の投票を Adaptive Cards として送信します（Teams にはネイティブの投票 API がありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票結果はゲートウェイにより `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するにはゲートウェイがオンラインである必要があります。
- 現時点では結果の概要は自動投稿されません（必要に応じてストアファイルを直接確認してください）。

## Adaptive Cards (任意形式)

`message` ツールまたは CLI を使用して、任意の Adaptive Card JSON を Teams ユーザーや会話に送信できます。

`card` パラメータに Adaptive Card JSON オブジェクトを渡します。`card` を指定した場合、メッセージテキストは任意となります。

**エージェントツール:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:<id>",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "こんにちは！" }]
  }
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"こんにちは！"}]}'
```

カードのスキーマや例については [Adaptive Cards documentation](https://adaptivecards.io/) を参照してください。ターゲット形式の詳細については [ターゲット形式](#target-formats) を参照してください。

## ターゲット形式

MSTeams のターゲットは、プレフィックスを使用してユーザーと会話を区別します:

| ターゲットタイプ | 形式 | 例 |
| :--- | :--- | :--- |
| ユーザー (ID 指定) | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| ユーザー (名前指定) | `user:<display-name>` | `user:John Smith` (Graph API が必要) |
| グループ/チャネル | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| グループ/チャネル (生) | `<conversation-id>` | `19:abc123...@thread.tacv2` (`@thread` を含む場合) |

**CLI の例:**

```bash
# ID でユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "こんにちは"

# 表示名でユーザーに送信 (Graph API による検索をトリガー)
openclaw message send --channel msteams --target "user:John Smith" --message "こんにちは"

# グループチャットまたはチャネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "こんにちは"

# 会話に Adaptive Card を送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"こんにちは"}]}'
```

**エージェントツールの例:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:John Smith",
  "message": "こんにちは！"
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
    "body": [{ "type": "TextBlock", "text": "こんにちは" }]
  }
}
```

注: `user:` プレフィックスがない場合、名前はデフォルトでグループ/チームとして解決されます。表示名で個人を指定する場合は、必ず `user:` を使用してください。

## プロアクティブメッセージング

- プロアクティブメッセージ（ボットからの自発的な送信）は、ユーザーが一度対話した後でのみ可能です（その時点で会話の参照情報が保存されるため）。
- `dmPolicy` や許可リストによる制限については `/gateway/configuration` を参照してください。

## チーム ID とチャネル ID (よくある間違い)

Teams URL に含まれる `groupId` クエリパラメータは、構成で使用するチーム ID **ではありません**。URL パスから ID を抽出してください:

**チーム URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    チーム ID (これを URL デコードしてください)
```

**チャネル URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      チャネル ID (これを URL デコードしてください)
```

**構成用:**
- チーム ID = `/team/` の後のパスセグメント (URL デコード後。例: `19:Bk4j...@thread.tacv2`)
- チャネル ID = `/channel/` の後のパスセグメント (URL デコード後)
- `groupId` クエリパラメータは **無視** してください。

## プライベートチャネル

プライベートチャネルでは、ボットのサポートが制限されています:

| 機能 | 標準チャネル | プライベートチャネル |
| :--- | :--- | :--- |
| ボットのインストール | ✅ 可能 | ⚠️ 制限あり |
| リアルタイムメッセージ (Webhook) | ✅ 可能 | ⚠️ 動作しない場合あり |
| RSC 権限 | ✅ 可能 | ⚠️ 挙動が異なる場合あり |
| @メンション | ✅ 可能 | ⚠️ ボットがアクセス可能な場合 |
| Graph API 履歴 | ✅ 可能 | ✅ 可能 (権限が必要) |

**プライベートチャネルで動作しない場合の回避策:**
1. ボットとの対話には標準チャネルを使用する。
2. DM を使用する（ユーザーは常にボットに直接メッセージを送れます）。
3. 履歴アクセスには Graph API を使用する（`ChannelMessage.Read.All` が必要）。

## トラブルシューティング

### よくある問題

- **チャネルで画像が表示されない:** Graph 権限または管理者の同意が不足しています。Teams アプリを再インストールし、Teams を完全に終了してから開き直してください。
- **チャネルで応答がない:** デフォルトではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、チーム/チャネルごとに構成してください。
- **バージョンの不一致 (Teams に古いマニフェストが残っている):** アプリを一度削除して再追加し、Teams を完全に終了して再起動してください。
- **Webhook から 401 Unauthorized が返る:** Azure JWT なしで手動テストした場合は正常な動作です（エンドポイントには到達しているが認証に失敗したことを示します）。正しくテストするには Azure Web Chat を使用してください。

### マニフェストアップロードのエラー

- **"Icon file cannot be empty":** マニフェストが 0 バイトのアイコンファイルを参照しています。有効な PNG アイコン（32x32 の `outline.png`, 192x192 の `color.png`）を作成してください。
- **"webApplicationInfo.Id already in use":** アプリがまだ他のチーム/チャットにインストールされています。アンインストールするか、反映まで 5〜10 分待ってください。
- **アップロード時に "Something went wrong":** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) からアップロードを試み、ブラウザの DevTools (F12) → [Network] タブで実際の詳細なエラーを確認してください。
- **サイドロードに失敗する:** 「カスタムアプリをアップロード」ではなく「組織のアプリカタログにアプリをアップロード」を試してください。これにより制限を回避できる場合があります。

### RSC 権限が動作しない

1. `webApplicationInfo.id` がボットのアプリ ID と完全に一致しているか確認してください。
2. アプリを再アップロードし、チーム/チャットで再インストールしてください。
3. 組織の管理者が RSC 権限をブロックしていないか確認してください。
4. 正しいスコープを使用しているか確認してください（チームには `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`）。

## 参考資料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - アプリの作成・管理
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (チャネル/グループには Graph が必要)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
