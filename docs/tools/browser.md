---
summary: "統合されたブラウザ制御サービス + アクション コマンド"
read_when:
  - エージェント制御のブラウザ自動化の追加
  - openclaw が自分の Chrome に干渉する理由をデバッグする
  - macOS アプリにブラウザ設定とライフサイクルを実装する
title: "ブラウザ (OpenClaw 管理)"
seoTitle: "OpenClawブラウザツールの使い方と制約・活用ポイント解説"
description: "OpenClaw は、エージェントが制御する 専用の Chrome/Brave/Edge/Chromium プロファイルを実行できます。個人のブラウザから分離されており、小さなローカル ブラウザを通じて管理されます。ゲートウェイ内のサービスを制御します (ループバックのみ)。"
x-i18n:
  source_hash: "687c93076263849a6117ed24c7e63f712c821c599435b95c9d78e02564050892"
---
OpenClaw は、エージェントが制御する **専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。
個人のブラウザから分離されており、小さなローカル ブラウザを通じて管理されます。
ゲートウェイ内のサービスを制御します (ループバックのみ)。

初心者向けのビュー:

- **独立したエージェント専用ブラウザ**と考えてください。
- `openclaw` プロファイルは、個人ブラウザのプロファイルには**影響しません**。
- エージェントは安全なレーンで **タブを開いたり、ページを読んだり、クリックしたり、入力したり**できます。
- デフォルトの `chrome` プロファイルは、**システムのデフォルトの Chromium ブラウザ** を使用します。
  延長リレー。分離された管理対象ブラウザの場合は、`openclaw` に切り替えます。

## 得られるもの

- **openclaw** という名前の別のブラウザ プロファイル (デフォルトではオレンジ色のアクセント)。
- 確定的なタブ コントロール (リスト/開く/フォーカス/閉じる)。
- エージェントのアクション (クリック/入力/ドラッグ/選択)、スナップショット、スクリーンショット、PDF。
- オプションのマルチプロファイルのサポート (`openclaw`、`work`、`remote` など)。

このブラウザは、日常のドライバーではありません\*\*。安全で隔離された表面です。
エージェントの自動化と検証。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「ブラウザが無効です」というメッセージが表示された場合は、設定で有効にし（以下を参照）、ブラウザを再起動します。
ゲートウェイ。

## プロファイル: `openclaw` 対 `chrome`- `openclaw`: 管理された独立したブラウザ (拡張機能は必要ありません)

- `chrome`: **システム ブラウザ**への拡張機能リレー (OpenClaw が必要)
  タブに接続する拡張子）。

デフォルトで管理モードが必要な場合は、`browser.defaultProfile: "openclaw"` を設定します。

## 構成

ブラウザ設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "chrome",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

注:- ブラウザ制御サービスは、`gateway.port` から派生したポート上のループバックにバインドされます。
(デフォルト: `18791`、ゲートウェイ + 2)。リレーは次のポート (`18792`) を使用します。

- ゲートウェイ ポート (`gateway.port` または `OPENCLAW_GATEWAY_PORT`) をオーバーライドする場合、
  派生ブラウザ ポートは同じ「ファミリー」に留まるように移行します。
- `cdpUrl` が設定されていない場合、デフォルトはリレー ポートになります。
- `remoteCdpTimeoutMs` は、リモート (非ループバック) CDP 到達可能性チェックに適用されます。
- `remoteCdpHandshakeTimeoutMs` は、リモート CDP WebSocket 到達可能性チェックに適用されます。
- ブラウザーのナビゲーション/開いているタブは、ナビゲーション前に SSRF で保護され、ナビゲーション後の最終 `http(s)` URL でベストエフォート型の再チェックが行われます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` のデフォルトは `true` (信頼されたネットワーク モデル) です。厳密な公開専用ブラウジングの場合は、`false` に設定します。
- `browser.ssrfPolicy.allowPrivateNetwork` は、互換性を確保するためにレガシー エイリアスとして引き続きサポートされます。
- `attachOnly: true` は、「ローカル ブラウザを決して起動しないでください。すでに実行されている場合にのみ接続してください。」を意味します。
- `color` + プロファイルごとの `color` ブラウザ UI に色を付けて、どのプロファイルがアクティブであるかを確認します。
- デフォルトのプロファイルは `openclaw` (OpenClaw 管理のスタンドアロン ブラウザ) です。 `defaultProfile: "chrome"` を使用して Chrome 拡張機能リレーをオプトインします。
- 自動検出順序: Chromium ベースの場合はシステムのデフォルトのブラウザ。それ以外の場合は、Chrome → Brave → Edge → Chromium → Chrome Canary。- ローカル `openclaw` プロファイル自動割り当て `cdpPort`/`cdpUrl` — リモート CDP に対してのみ設定します。

## Brave (または別の Chromium ベースのブラウザ) を使用します

**システムのデフォルト** ブラウザが Chromium ベース (Chrome/Brave/Edge など) の場合、
OpenClaw はそれを自動的に使用します。 `browser.executablePath` を上書きするように設定します
自動検出:

CLI の例:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## ローカル制御とリモート制御

- **ローカル制御 (デフォルト):** ゲートウェイはループバック制御サービスを開始し、ローカル ブラウザを起動できます。
- **リモート コントロール (ノード ホスト):** ブラウザーを備えたマシン上でノード ホストを実行します。ゲートウェイはブラウザーのアクションをゲートウェイにプロキシします。
- **リモート CDP:** `browser.profiles.<name>.cdpUrl` (または `browser.cdpUrl`) を次のように設定します。
  リモートの Chromium ベースのブラウザに接続します。この場合、OpenClaw はローカル ブラウザを起動しません。

リモート CDP URL には認証を含めることができます。

- クエリトークン (例: `https://provider.example?token=<token>`)
- HTTP 基本認証 (例: `https://user:pass@provider.example`)

OpenClaw は、`/json/*` エンドポイントの呼び出し時および接続時に認証を保持します。
CDP WebSocket に接続します。環境変数またはシークレットマネージャーを優先します。
トークンを構成ファイルにコミットする代わりに。

## ノード ブラウザ プロキシ (ゼロ構成のデフォルト)

ブラウザがインストールされているマシン上で **ノード ホスト**を実行すると、OpenClaw は次のことを行うことができます。
自動ルートブラウザツールは、追加のブラウザ設定なしでそのノードを呼び出します。
これはリモート ゲートウェイのデフォルト パスです。

注:- ノード ホストは、**プロキシ コマンド** を介してローカル ブラウザ コントロール サーバーを公開します。

- プロファイルはノード独自の `browser.profiles` 構成 (ローカルと同じ) から取得されます。
- 不要な場合は無効にします。
  - ノード上: `nodeHost.browserProxy.enabled=false`
  - ゲートウェイ上: `gateway.nodes.browser.mode="off"`

## ブラウザレス (ホスト型リモート CDP)

[ブラウザレス](https://browserless.io) は、ホストされた Chromium サービスであり、
HTTPS 経由の CDP エンドポイント。 OpenClaw ブラウザ プロファイルを次の場所にポイントできます。
ブラウザレス リージョン エンドポイントと API キーで認証します。

例:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "https://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

注:

- `<BROWSERLESS_API_KEY>` を実際のブラウザレス トークンに置き換えます。
- ブラウザレス アカウントに一致するリージョン エンドポイントを選択します (ドキュメントを参照)。

## ダイレクト WebSocket CDP プロバイダー

一部のホスト型ブラウザ サービスは、エンドポイントではなく **直接 WebSocket** エンドポイントを公開します。
標準の HTTP ベースの CDP 検出 (`/json/version`)。 OpenClaw は次の両方をサポートします。

- **HTTP(S) エンドポイント** (ブラウザレスなど) — OpenClaw は `/json/version` を呼び出して、
  WebSocket デバッガ URL を検出して接続します。
- **WebSocket エンドポイント** (`ws://` / `wss://`) — OpenClaw は直接接続します。
  `/json/version` をスキップします。これを次のようなサービスに使用します
  [ブラウザベース](https://www.browserbase.com) または、
  WebソケットのURL。

### ブラウザベース[Browserbase](https://www.browserbase.com) は、実行するためのクラウド プラットフォームです

CAPTCHA解決機能、ステルスモード、およびレジデンシャル機能が組み込まれたヘッドレスブラウザ
プロキシ。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

注:

- [サインアップ](https://www.browserbase.com/sign-up) し、**API キー**をコピーします
  [概要ダッシュボード](https://www.browserbase.com/overview) から。
- `<BROWSERBASE_API_KEY>` を実際のブラウザベース API キーに置き換えます。
- Browserbase は WebSocket 接続でブラウザ セッションを自動作成するため、
  手動によるセッション作成手順が必要です。
- 無料枠では、1 か月あたり 1 つの同時セッションと 1 ブラウザ時間が許可されます。
  有料プランの制限については、[価格設定](https://www.browserbase.com/pricing) を参照してください。
- 完全な API については、[ブラウザベースのドキュメント](https://docs.browserbase.com) を参照してください。
  リファレンス、SDK ガイド、統合例。

## セキュリティ

重要なアイデア:

- ブラウザ制御はループバックのみです。アクセスは、ゲートウェイの認証またはノード ペアリングを介して流れます。
- ブラウザ制御が有効で認証が設定されていない場合、OpenClaw は起動時に `gateway.auth.token` を自動生成し、それを設定に保存します。
- ゲートウェイとすべてのノード ホストをプライベート ネットワーク (Tailscale) 上に維持します。公共の場への露出を避けてください。
- リモート CDP URL/トークンをシークレットとして扱います。環境変数またはシークレットマネージャーを使用することをお勧めします。

リモート CDP のヒント:

- 可能な場合は、暗号化されたエンドポイント (HTTPS または WSS) と有効期間の短いトークンを優先します。
- 有効期間の長いトークンを構成ファイルに直接埋め込むことは避けてください。

## プロファイル (マルチブラウザ)OpenClaw は、複数の名前付きプロファイル (ルーティング構成) をサポートしています。プロファイルは次のとおりです

- **openclaw 管理**: 独自のユーザー データ ディレクトリと CDP ポートを備えた専用の Chromium ベースのブラウザ インスタンス
- **リモート**: 明示的な CDP URL (他の場所で実行されている Chromium ベースのブラウザ)
- **拡張機能リレー**: ローカル リレー + Chrome 拡張機能を介した既存の Chrome タブ

デフォルト:

- `openclaw` プロファイルが存在しない場合は自動作成されます。
- `chrome` プロファイルは Chrome 拡張機能リレー用に組み込まれています (デフォルトでは `http://127.0.0.1:18792` を指します)。
- ローカル CDP ポートは、デフォルトで **18800 ～ 18899** を割り当てます。
- プロファイルを削除すると、ローカル データ ディレクトリがゴミ箱に移動します。

すべてのコントロール エンドポイントは `?profile=<name>` を受け入れます。 CLI は `--browser-profile` を使用します。

## Chrome 拡張機能リレー (既存の Chrome を使用)

OpenClaw は、ローカル CDP リレー + Chrome 拡張機能を介して **既存の Chrome タブ** (別個の「openclaw」Chrome インスタンスはありません) を駆動することもできます。

完全ガイド: [Chrome 拡張機能](/tools/chrome-extension)

フロー:

- ゲートウェイはローカル (同じマシン) で実行されるか、ノード ホストがブラウザ マシン上で実行されます。
- ローカル **リレー サーバー** は、ループバック `cdpUrl` (デフォルト: `http://127.0.0.1:18792`) で待機します。
- タブ上の **OpenClaw Browser Relay** 拡張機能アイコンをクリックして接続します (自動接続されません)。
- エージェントは、適切なプロファイルを選択することで、通常の `browser` ツールを介してそのタブを制御します。ゲートウェイが別の場所で実行されている場合は、ブラウザ マシン上でノード ホストを実行して、ゲートウェイがブラウザ アクションをプロキシできるようにします。

### サンドボックスセッション

エージェント セッションがサンドボックス化されている場合、`browser` ツールはデフォルトで `target="sandbox"` (サンドボックス ブラウザー) に設定される場合があります。
Chrome 拡張機能リレーの引き継ぎにはホスト ブラウザの制御が必要なので、次のいずれかが必要です。

- セッションをサンドボックスなしで実行する、または
- ツールを呼び出すときに `agents.defaults.sandbox.browser.allowHostControl: true` を設定し、 `target="host"` を使用します。

### セットアップ

1. 拡張機能 (dev/unpacked) をロードします。

```bash
openclaw browser extension install
```

- Chrome → `chrome://extensions` → 「開発者モード」を有効にする
- 「解凍してロード」 → `openclaw browser extension path` で出力されたディレクトリを選択
- 拡張機能を固定し、制御するタブをクリックします (バッジには `ON` が表示されます)。

2. 使用します:

- CLI: `openclaw browser --browser-profile chrome tabs`
- エージェント ツール: `browser` と `profile="chrome"`

オプション: 別の名前または中継ポートが必要な場合は、独自のプロファイルを作成します。

```bash
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

注:

- このモードは、ほとんどの操作 (スクリーンショット/スナップショット/アクション) で Playwright-on-CDP に依存します。
- 拡張機能アイコンを再度クリックすると接続が解除されます。
- リレー ループバックのみをデフォルトのままにします。別のネットワーク名前空間 (WSL2 のゲートウェイ、Windows の Chrome など) からリレーに到達できる必要がある場合は、周囲のネットワークをプライベートで認証された状態に保ちながら、`browser.relayBindHost` を `0.0.0.0` などの明示的なバインド アドレスに設定します。

WSL2 / クロスネームスペースの例:

```json5
{
browser: {
enabled: true,
relayBindHost: "0.0.0.0",
defaultProfile: "chrome",
},
}

````

## 分離の保証

- **専用のユーザー データ ディレクトリ**: 個人のブラウザ プロファイルには決して触れません。
- **専用ポート**: `9222` を回避し、開発ワークフローとの衝突を防ぎます。
- **確定的タブ コントロール**: 「最後のタブ」ではなく、`targetId` によるタブをターゲットにします。

## ブラウザの選択

ローカルで起動する場合、OpenClaw は最初に利用可能なものを選択します。

1.クロム
2. 勇敢な
3. エッジ
4. クロム
5. クロムカナリア

`browser.executablePath` でオーバーライドできます。

プラットフォーム:

- macOS: `/Applications` および `~/Applications` をチェックします。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium` などを探します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API (オプション)

ローカル統合の場合のみ、ゲートウェイは小さなループバック HTTP API を公開します。- ステータス/開始/停止: `GET /`、`POST /start`、`POST /stop`
- タブ: `GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- スナップショット/スクリーンショット: `GET /snapshot`、`POST /screenshot`
- アクション: `POST /navigate`、`POST /act`
- フック: `POST /hooks/file-chooser`、`POST /hooks/dialog`
- ダウンロード: `POST /download`、`POST /wait/download`
- デバッグ: `GET /console`、`POST /pdf`
- デバッグ: `GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- ネットワーク: `POST /response/body`
- 状態: `GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状態: `GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 設定: `POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、 `POST /set/device`

すべてのエンドポイントは `?profile=<name>` を受け入れます。

ゲートウェイ認証が構成されている場合、ブラウザーの HTTP ルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードを使用した HTTP Basic 認証

### 劇作家の要件

一部の機能 (ナビゲート/アクト/AI スナップショット/ロール スナップショット、要素のスクリーンショット、PDF) には、
劇作家。 Playwright がインストールされていない場合、これらのエンドポイントはクリアな 501 を返します。
エラー。 ARIA スナップショットと基本的なスクリーンショットは、openclaw で管理される Chrome でも引き続き機能します。
Chrome 拡張機能リレー ドライバーの場合、ARIA スナップショットとスクリーンショットには Playwright が必要です。`Playwright is not available in this gateway build` が表示された場合は、完全なバージョンをインストールしてください。
Playwright パッケージ (`playwright-core` ではありません) を実行し、ゲートウェイを再起動するか、再インストールします
ブラウザをサポートする OpenClaw。

#### Docker Playwright のインストール

ゲートウェイが Docker で実行されている場合は、`npx playwright` (npm オーバーライドの競合) を避けてください。
代わりにバンドルされている CLI を使用してください。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
````

ブラウザーのダウンロードを永続的にするには、`PLAYWRIGHT_BROWSERS_PATH` を設定します (たとえば、
`/home/node/.cache/ms-playwright`) を使用して、`/home/node` が永続化されていることを確認します。
`OPENCLAW_HOME_VOLUME` またはバインド マウント。 [Docker](/install/docker) を参照してください。

## 仕組み (内部)

大まかなフロー:

- 小規模な **コントロール サーバー** が HTTP リクエストを受け入れます。
- **CDP** 経由で Chromium ベースのブラウザ (Chrome/Brave/Edge/Chromium) に接続します。
- 高度なアクション (クリック/タイプ/スナップショット/PDF) の場合は、**Playwright** を上部に使用します
  CDPの。
- Playwright が見つからない場合、Playwright 以外の操作のみが可能です。

この設計により、エージェントは安定した決定論的なインターフェイスに維持され、同時に
ローカル/リモートのブラウザとプロファイルを交換します。

## CLI クイックリファレンス

すべてのコマンドは、特定のプロファイルをターゲットとする `--browser-profile <name>` を受け入れます。
すべてのコマンドは、機械可読出力 (安定したペイロード) として `--json` も受け入れます。

基本:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`検査:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

アクション:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

状態:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

注:- `upload` および `dialog` は **監視** コールです。クリックまたは押す前に実行します
選択/ダイアログをトリガーします。

- ダウンロードおよびトレースの出力パスは、OpenClaw の一時ルートに制限されます。
  - トレース: `/tmp/openclaw` (フォールバック: `${os.tmpdir()}/openclaw`)
  - ダウンロード: `/tmp/openclaw/downloads` (フォールバック: `${os.tmpdir()}/openclaw/downloads`)
- アップロード パスは OpenClaw 一時アップロード ルートに制限されます。
  - アップロード: `/tmp/openclaw/uploads` (フォールバック: `${os.tmpdir()}/openclaw/uploads`)
- `upload` は、`--input-ref` または `--element` を介してファイル入力を直接設定することもできます。
- `snapshot`:
  - `--format ai` (Playwright がインストールされている場合のデフォルト): 数値参照 (`aria-ref="<n>"`) を含む AI スナップショットを返します。
  - `--format aria`: アクセシビリティ ツリーを返します (参照なし、検査のみ)。
  - `--efficient` (または `--mode efficient`): コンパクトな役割のスナップショット プリセット (インタラクティブ + コンパクト + 深さ + より低い maxChars)。
  - デフォルト設定 (ツール/CLI のみ): 呼び出し元がモードを渡さない場合に効率的なスナップショットを使用するように `browser.snapshotDefaults.mode: "efficient"` を設定します ([ゲートウェイ設定](/gateway/configuration#browser-openclaw-managed-browser) を参照)。
  - ロール スナップショット オプション (`--interactive`、`--compact`、`--depth`、`--selector`) は、`ref=e12` のような参照を持つロールベースのスナップショットを強制します。
  - `--frame "<iframe selector>"` は、ロール スナップショットのスコープを iframe に設定します (`e12` のようなロール参照とペアになります)。- `--interactive` は、インタラクティブな要素のフラットで選択しやすいリストを出力します (アクションを推進するのに最適です)。
  - `--labels` は、オーバーレイされた参照ラベルを含むビューポートのみのスクリーンショットを追加します (`MEDIA:<path>` を印刷します)。
- `click`/`type`/etc には、`snapshot` からの `ref` (数値 `12` またはロール参照 `e12`) が必要です。
  CSS セレクターはアクションに対して意図的にサポートされていません。

## スナップショットと参照

OpenClaw は 2 つの「スナップショット」スタイルをサポートしています。

- **AI スナップショット (数値参照)**: `openclaw browser snapshot` (デフォルト; `--format ai`)
  - 出力: 数値参照を含むテキスト スナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部的には、参照は Playwright の `aria-ref` を介して解決されます。

- **ロールのスナップショット (`e12` のようなロール参照)**: `openclaw browser snapshot --interactive` (または `--compact`、`--depth`、`--selector`、`--frame`)
  - 出力: `[ref=e12]` (およびオプションの `[nth=1]`) を含むロールベースのリスト/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部的に、ref は `getByRole(...)` (さらに重複の場合は `nth()`) を介して解決されます。
  - `--labels` を追加して、`e12` ラベルがオーバーレイされたビューポートのスクリーンショットを含めます。

参照動作:- Ref は **ナビゲーション間で安定していません**。何かが失敗した場合は、`snapshot` を再実行し、新しい参照を使用します。

- ロールのスナップショットが `--frame` で取得された場合、ロール参照は次のロールのスナップショットまでその iframe にスコープされます。

## パワーアップを待ちます

時間やテキスト以外のものも待つことができます。

- URL を待ちます (Playwright によってサポートされているグロブ):
  - `openclaw browser wait --url "**/dash"`
- ロード状態を待機します:
  - `openclaw browser wait --load networkidle`
- JS 述語を待ちます。
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが表示されるまで待ちます。
  - `openclaw browser wait "#main"`

これらは次のように組み合わせることができます。

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## ワークフローをデバッグする

アクションが失敗した場合 (例: 「表示されない」、「厳密モード違反」、「カバーされている」):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使用します (対話モードでのロール参照を優先します)
3. それでも失敗する場合: `openclaw browser highlight <ref>` で Playwright のターゲットを確認します
4. ページの動作がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細なデバッグの場合: トレースを記録します。
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop` (`TRACE:<path>` を印刷)

## JSON 出力

`--json` は、スクリプトおよび構造化ツール用です。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON のロール スナップショットには、`refs` と小さな `stats` ブロック (lines/chars/refs/interactive) が含まれているため、ツールはペイロードのサイズと密度を推論できます。

## 状態と環境のノブこれらは、「サイトを X のように動作させる」ワークフローに役立ちます

- Cookie: `cookies`、`cookies set`、`cookies clear`
- ストレージ: `storage local|session get|set|clear`
- オフライン: `set offline on|off`
- ヘッダー: `set headers --headers-json '{"X-Debug":"1"}'` (従来の `set headers --json '{"X-Debug":"1"}'` は引き続きサポートされます)
- HTTP 基本認証: `set credentials user pass` (または `--clear`)
- 地理位置情報: `set geo <lat> <lon> --origin "https://example.com"` (または `--clear`)
- メディア: `set media dark|light|no-preference|none`
- タイムゾーン/ロケール: `set timezone ...`、`set locale ...`
- デバイス/ビューポート:
  - `set device "iPhone 14"` (Playwright デバイスのプリセット)
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw ブラウザ プロファイルには、ログインしたセッションが含まれる場合があります。敏感なものとして扱います。
- `browser act kind=evaluate` / `openclaw browser evaluate` および `wait --fn`
  ページコンテキストで任意の JavaScript を実行します。迅速な噴射で操縦可能
  これ。必要ない場合は、`browser.evaluateEnabled=false` を使用して無効にします。
- ログインとボット対策の注意事項 (X/Twitter など) については、[ブラウザ ログイン + X/Twitter 投稿](/tools/browser-login) を参照してください。
- ゲートウェイ/ノード ホストをプライベートに保ちます (ループバックまたはテールネットのみ)。
- リモート CDP エンドポイントは強力です。トンネルを作って彼らを守ります。

厳密モードの例 (デフォルトでプライベート/内部宛先をブロック):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## トラブルシューティング

Linux 固有の問題 (特にスナップ Chromium) については、次を参照してください。
[ブラウザのトラブルシューティング](/tools/browser-linux-troubleshooting)。WSL2 ゲートウェイ + Windows Chrome の分割ホスト設定については、次を参照してください。
[WSL2 + Windows + リモート Chrome CDP のトラブルシューティング](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

## エージェント ツール + 制御の仕組み

エージェントはブラウザ自動化のための **1 つのツール**を取得します。

- `browser` — ステータス/開始/停止/タブ/開く/フォーカス/閉じる/スナップショット/スクリーンショット/ナビゲート/動作

マッピング方法:

- `browser snapshot` は、安定した UI ツリー (AI または ARIA) を返します。
- `browser act` は、スナップショット `ref` ID を使用してクリック/入力/ドラッグ/選択します。
- `browser screenshot` はピクセル (ページ全体または要素全体) をキャプチャします。
- `browser` は以下を受け入れます:
  - `profile` は、名前付きブラウザー プロファイル (openclaw、chrome、またはリモート CDP) を選択します。
  - `target` (`sandbox` | `host` | `node`) ブラウザーが存在する場所を選択します。
  - サンドボックス セッションでは、`target: "host"` には `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: サンドボックス セッションのデフォルトは `sandbox`、非サンドボックス セッションのデフォルトは `host` です。
  - ブラウザ対応ノードが接続されている場合、`target="host"` または `target="node"` を固定しない限り、ツールはそのノードに自動ルーティングすることがあります。

これにより、エージェントの決定性が維持され、脆弱なセレクターが回避されます。
