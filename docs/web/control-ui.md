---
summary: "ゲートウェイのブラウザベースの制御 UI (チャット、ノード、構成)"
read_when:
  - ブラウザからGatewayを操作したい
  - SSH トンネルを使用しないテールネット アクセスが必要な場合
title: "OpenClawコントロールUIの使い方と接続設定・運用ガイド"
description: "コントロール UI は、ゲートウェイによって提供される小さな Vite + Lit シングルページ アプリです。同じポート上の ゲートウェイ WebSocket と直接通信します。"
x-i18n:
  source_hash: "e5be9a2b3866f650e6a1867b20ef24e2d8e51073454a53b60e4ef94dcf9fedf8"
---
コントロール UI は、ゲートウェイによって提供される小さな **Vite + Lit** シングルページ アプリです。

- デフォルト: `http://<host>:18789/`
- オプションの接頭辞: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

同じポート上の **ゲートウェイ WebSocket** と直接通信します。

## クイックオープン (ローカル)

ゲートウェイが同じコンピュータ上で実行されている場合は、次のファイルを開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗した場合は、まずゲートウェイを起動します: `openclaw gateway`。

認証は、WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
  ダッシュボード設定パネルには、現在のブラウザー タブ セッションと選択したゲートウェイ URL のトークンが保持されます。パスワードは保持されません。
  オンボーディング ウィザードはデフォルトでゲートウェイ トークンを生成するため、最初の接続時にここに貼り付けます。

## デバイスのペアリング (最初の接続)

新しいブラウザまたはデバイスからコントロール UI に接続すると、ゲートウェイ
同じテールネット上にいる場合でも、**1 回限りのペアリング承認**が必要です
`gateway.auth.allowTailscale: true` と。これは防止するためのセキュリティ対策です
不正アクセス。

**表示される内容:** 「切断されました (1008): ペアリングが必要です」

**デバイスを承認するには:**

````bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```一度承認されるとデバイスは記憶され、次の場合を除いて再承認は必要ありません。
`openclaw devices revoke --device <id> --role <role>` を使用して取り消します。参照
[デバイス CLI](/cli/devices) トークンのローテーションと取り消し用。

**注:**

- ローカル接続 (`127.0.0.1`) は自動承認されます。
- リモート接続 (LAN、テールネットなど) には明示的な承認が必要です。
- 各ブラウザ プロファイルは一意のデバイス ID を生成するため、ブラウザを切り替えるか、
  ブラウザのデータをクリアするには、再ペアリングが必要になります。

## 言語サポート

コントロール UI は、ブラウザーのロケールに基づいて最初の読み込み時にローカライズでき、後でアクセス カードの言語ピッカーからオーバーライドできます。

- サポートされているロケール: `en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`
- 英語以外の翻訳はブラウザに遅延読み込みされます。
- 選択したロケールはブラウザのストレージに保存され、今後のアクセス時に再利用されます。
- 翻訳キーが見つからない場合は英語に戻ります。

## できること (今日)- Gateway WS 経由でモデルとチャット (`chat.history`、`chat.send`、`chat.abort`、`chat.inject`)
- チャットでツール呼び出し + ライブツール出力カードをストリーミング (エージェントイベント)
- チャネル: WhatsApp/Telegram/Discord/Slack + プラグイン チャネル (Mattermost など) ステータス + QR ログイン + チャネルごとの設定 (`channels.status`、`web.login.*`、`config.patch`)
- インスタンス: プレゼンス リスト + 更新 (`system-presence`)
- セッション: リスト + セッションごとの思考/冗長オーバーライド (`sessions.list`、`sessions.patch`)
- Cron ジョブ: リスト/追加/編集/実行/有効化/無効化 + 実行履歴 (`cron.*`)
- スキル: ステータス、有効化/無効化、インストール、API キーの更新 (`skills.*`)
- ノード: リスト + キャップ (`node.list`)
- 実行承認: ゲートウェイまたはノードのホワイトリストを編集 + `exec host=gateway/node` (`exec.approvals.*`) のポリシーを要求
- 設定: `~/.openclaw/openclaw.json` (`config.get`、`config.set`) の表示/編集
- 構成: 適用し、検証 (`config.apply`) を使用して再起動し、最後のアクティブなセッションをウェイクアップします。
- 構成書き込みには、同時編集の破壊を防ぐためのベース ハッシュ ガードが含まれています
- 構成スキーマ + フォーム レンダリング (`config.schema`、プラグイン + チャネル スキーマを含む);未加工の JSON エディターは引き続き利用可能です
- デバッグ: ステータス/ヘルス/モデルのスナップショット + イベント ログ + 手動 RPC 呼び出し (`status`、`health`、`models.list`)
- ログ: フィルター/エクスポートを使用したゲートウェイ ファイル ログのライブ テール (`logs.tail`)- 更新: package/git update + restart (`update.run`) を実行し、再起動レポートを作成します。

Cron ジョブパネルのメモ:

- 分離されたジョブの場合、配信ではデフォルトで概要がアナウンスされます。内部のみを実行したい場合は、なしに切り替えることができます。
- アナウンスを選択すると、チャンネル/ターゲットフィールドが表示されます。
- Webhook モードでは、有効な HTTP(S) Webhook URL に設定された `delivery.to` とともに `delivery.mode = "webhook"` を使用します。
- メインセッションジョブの場合、Webhook 配信モードとなし配信モードが利用可能です。
- 高度な編集コントロールには、実行後の削除、エージェント オーバーライドのクリア、cron 正確/時間差オプション、
  エージェント モデル/考え方のオーバーライド、およびベスト エフォート配信の切り替え。
- フォーム検証はフィールドレベルのエラーとインラインで行われます。無効な値を指定すると、修正されるまで [保存] ボタンが無効になります。
- 専用ベアラー トークンを送信するように `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
- 非推奨のフォールバック: `notify: true` を使用して保存されたレガシー ジョブは、移行されるまで引き続き `cron.webhook` を使用できます。

## チャットの動作- `chat.send` は **ノンブロッキング** です。`{ runId, status: "started" }` で即座に ACK を送信し、応答は `chat` イベント経由でストリームされます。
- 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返され、完了後は `{ status: "ok" }` が返されます。
- `chat.history` 応答は、UI の安全性のためにサイズが制限されています。トランスクリプト エントリが大きすぎる場合、Gateway は長いテキスト フィールドを切り捨て、重いメタデータ ブロックを省略し、サイズを超えるメッセージをプレースホルダー (`[chat.history omitted: message too large]`) に置き換える場合があります。
- `chat.inject` はセッション トランスクリプトにアシスタント ノートを追加し、UI のみの更新のために `chat` イベントをブロードキャストします (エージェントの実行やチャネル配信はありません)。
- 停止:
  - [**停止**] をクリックします (`chat.abort` を呼び出します)
  - 帯域外を中止するには、`/stop` (または、`stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` などのスタンドアロンの中止フレーズ) を入力します。
  - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止する `{ sessionKey }` (`runId` はサポートしません) をサポートします
- 部分的な保持を中止します。
  - 実行が中止された場合でも、部分的なアシスタント テキストが UI に表示されることがあります。
  - ゲートウェイは、バッファリングされた出力が存在する場合、中断された部分的なアシスタント テキストをトランスクリプト履歴に保持します。
  - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用者は通常の完了出力から部分中止を区別できます。

## テールネット アクセス (推奨)### 統合されたテールスケール サーブ (推奨)

ゲートウェイをループバックに保ち、Tailscale Serve が HTTPS でプロキシできるようにします。

```bash
openclaw gateway --tailscale serve
````

開く:

- `https://<magicdns>/` (または構成された `gateway.controlUi.basePath`)

デフォルトでは、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー経由で認証できます。
(`tailscale-user-login`) `gateway.auth.allowTailscale` が `true` の場合。オープンクロー
`x-forwarded-for` アドレスを解決することで身元を検証します。
`tailscale whois` をヘッダーと照合し、次の場合にのみこれらを受け入れます。
リクエストは Tailscale の `x-forwarded-*` ヘッダーでループバックにヒットします。セット
`gateway.auth.allowTailscale: false` (または強制 `gateway.auth.mode: "password"`)
トラフィックを提供する場合でもトークン/パスワードを要求したい場合。
トークンレス サーブ認証では、ゲートウェイ ホストが信頼されていることが前提となります。信頼できないローカルの場合
コードはそのホスト上で実行される可能性があり、トークン/パスワード認証が必要です。

### テールネット + トークンにバインド

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

次に開きます:

- `http://<tailscale-ip>:18789/` (または構成された `gateway.controlUi.basePath`)

トークンを UI 設定に貼り付けます (`connect.params.auth.token` として送信)。

## 安全でない HTTP

プレーン HTTP (`http://<lan-ip>` または `http://<tailscale-ip>`) 経由でダッシュボードを開いた場合、
ブラウザは **非安全なコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、
OpenClaw **ブロック** デバイス ID を持たない UI 接続を制御します。

**推奨される修正:** HTTPS (Tailscale Serve) を使用するか、UI をローカルで開きます。- `https://<magicdns>/` (サーブ)

- `http://127.0.0.1:18789/` (ゲートウェイ ホスト上)

**安全でない認証の切り替え動作:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` は、コントロール UI デバイスの ID またはペアリングのチェックをバイパスしません。

**ガラス破りのみ:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` は、コントロール UI デバイス ID チェックを無効にし、
重大なセキュリティの低下。緊急使用後はすぐに元に戻してください。

HTTPS セットアップのガイダンスについては、[Tailscale](/gateway/tailscale) を参照してください。

## UI の構築

ゲートウェイは、`dist/control-ui` からの静的ファイルを提供します。以下を使用して構築します。

```bash
pnpm ui:build # auto-installs UI deps on first run
```

オプションの絶対ベース (固定資産 URL が必要な場合):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発の場合 (別の開発サーバー):

```bash
pnpm ui:dev # auto-installs UI deps on first run
```

次に、UI で Gateway WS URL (例: `ws://127.0.0.1:18789`) を指定します。

## デバッグ/テスト: 開発サーバー + リモート ゲートウェイ

コントロール UI は静的ファイルです。 WebSocket ターゲットは構成可能であり、
HTTPオリジンとは異なります。これは、Vite 開発サーバーが必要な場合に便利です
ローカルではありますが、ゲートウェイは別の場所で実行されます。

1. UI 開発サーバーを起動します: `pnpm ui:dev`
2. 次のような URL を開きます。

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

オプションのワンタイム認証 (必要な場合):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

注:- `gatewayUrl` はロード後に localStorage に保存され、URL から削除されます。

- `token` は URL フラグメントからインポートされ、現在のブラウザー タブ セッションおよび選択されたゲートウェイ URL の sessionStorage に保存され、URL から削除されます。 localStorage には保存されません。
- `password` はメモリ内にのみ保持されます。
- `gatewayUrl` が設定されている場合、UI は構成または環境の資格情報にフォールバックしません。
  `token` (または `password`) を明示的に指定します。明示的な資格情報が欠落しているとエラーになります。
- ゲートウェイが TLS (Tailscale Serve、HTTPS プロキシなど) の背後にある場合は、`wss://` を使用します。
- `gatewayUrl` は、クリックジャッキングを防ぐために、トップレベル ウィンドウ (埋め込まれていない) でのみ受け入れられます。
- 非ループバック コントロール UI 展開では `gateway.controlUi.allowedOrigins` を設定する必要があります
  明示的に（完全な起源）。これには、リモート開発セットアップが含まれます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` を有効にします
  ホストヘッダー起点フォールバック モードですが、危険なセキュリティ モードです。

例:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

リモート アクセス設定の詳細: [リモート アクセス](/gateway/remote)。
