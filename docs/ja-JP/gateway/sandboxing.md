---
summary: "OpenClaw サンドボックスの仕組み: モード、スコープ、ワークスペース アクセス、イメージ"
title: "サンドボックス化"
read_when: "You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox."
status: active
x-i18n:
  source_hash: "0d7bb6c468517fec90b277065201f2d2e322a14b036b57a2b175abdf74a66668"
---

# サンドボックス化

OpenClaw は **Docker コンテナ内でツール**を実行して、爆発範囲を減らすことができます。
これは **オプション** であり、構成 (`agents.defaults.sandbox` または
`agents.list[].sandbox`)。サンドボックスがオフの場合、ツールはホスト上で実行されます。
ゲートウェイはホスト上に残ります。ツールの実行は分離されたサンドボックスで実行されます
有効な場合。

これは完全なセキュリティ境界ではありませんが、ファイルシステムを実質的に制限します。
モデルが何か愚かなことをしたときのプロセスアクセス。

## サンドボックス化されるもの- ツールの実行 (`exec`、`read`、`write`、`edit`、`apply_patch`、`process` など)

- オプションのサンドボックス ブラウザ (`agents.defaults.sandbox.browser`)。
  - デフォルトでは、ブラウザ ツールが必要なときにサンドボックス ブラウザが自動起動します (CDP に到達できることを確認します)。
    `agents.defaults.sandbox.browser.autoStart` および `agents.defaults.sandbox.browser.autoStartTimeoutMs` を介して構成します。
  - デフォルトでは、サンドボックス ブラウザー コンテナーは、グローバル `bridge` ネットワークではなく、専用の Docker ネットワーク (`openclaw-sandbox-browser`) を使用します。
    `agents.defaults.sandbox.browser.network` で構成します。
  - オプションの `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト (`172.21.0.1/32` など) を使用してコンテナー エッジ CDP イングレスを制限します。
  - noVNC オブザーバーのアクセスはデフォルトでパスワードで保護されています。 OpenClaw は、ローカル ブートストラップ ページを提供する有効期間の短いトークン URL を発行し、URL フラグメント (クエリ/ヘッダー ログではない) のパスワードを使用して noVNC を開きます。
  - `agents.defaults.sandbox.browser.allowHostControl` では、サンドボックス セッションがホスト ブラウザーを明示的にターゲットにできるようにします。
  - オプションのホワイトリスト ゲート `target: "custom"`: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

サンドボックス化されていない場合:

- ゲートウェイ プロセス自体。
- ホスト上での実行が明示的に許可されているツール (例: `tools.elevated`)。
  - **昇格された実行はホスト上で実行され、サンドボックスをバイパスします。**
  - サンドボックスがオフの場合、`tools.elevated` は実行を変更しません (すでにホスト上にあります)。 [昇格モード](/tools/elevated) を参照してください。

## モード`agents.defaults.sandbox.mode` は、サンドボックスを使用する**時期**を制御します

- `"off"`: サンドボックスなし。
- `"non-main"`: サンドボックスのみ **非メイン** セッション (ホスト上で通常のチャットが必要な場合のデフォルト)。
- `"all"`: すべてのセッションはサンドボックスで実行されます。
  注: `"non-main"` は、エージェント ID ではなく、`session.mainKey` (デフォルト `"main"`) に基づいています。
  グループ/チャネル セッションは独自のキーを使用するため、非メインとしてカウントされ、サンドボックス化されます。

## 範囲

`agents.defaults.sandbox.scope` は、**作成されるコンテナーの数**を制御します。

- `"session"` (デフォルト): セッションごとに 1 つのコンテナー。
- `"agent"`: エージェントごとに 1 つのコンテナー。
- `"shared"`: すべてのサンドボックス セッションで共有される 1 つのコンテナ。

## ワークスペースへのアクセス

`agents.defaults.sandbox.workspaceAccess` は **サンドボックスが表示できるもの** を制御します。

- `"none"` (デフォルト): ツールは `~/.openclaw/sandboxes` の下のサンドボックス ワークスペースを参照します。
- `"ro"`: エージェント ワークスペースを `/agent` に読み取り専用でマウントします (`write`/`edit`/`apply_patch` を無効にします)。
- `"rw"`: エージェント ワークスペースを読み取り/書き込みで `/workspace` にマウントします。

受信メディアはアクティブなサンドボックス ワークスペース (`media/inbound/*`) にコピーされます。
スキルに関する注意: `read` ツールはサンドボックス ベースです。 `workspaceAccess: "none"` では、
OpenClaw は対象となるスキルをサンドボックス ワークスペース (`.../skills`) にミラーリングします。
それらは読むことができます。 `"rw"` を使用すると、ワークスペースのスキルを次の場所から読み取ることができます。
`/workspace/skills`。## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は、追加のホスト ディレクトリをコンテナにマウントします。
形式: `host:container:mode` (例: `"/home/user/source:/source:rw"`)。

グローバル バインドとエージェントごとのバインドは **マージ**されます (置換されません)。 `scope: "shared"` では、エージェントごとのバインドは無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホスト ディレクトリを **サンドボックス ブラウザ** コンテナのみにマウントします。

- 設定すると (`[]` を含む)、ブラウザ コンテナの `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略した場合、ブラウザ コンテナは `agents.defaults.sandbox.docker.binds` (下位互換性) に戻ります。

例 (読み取り専用ソース + 追加のデータ ディレクトリ):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

セキュリティに関する注意事項:

- バインドはサンドボックス ファイルシステムをバイパスします。設定したモード (`:ro` または `:rw`) でホスト パスを公開します。
- OpenClaw は、危険なバインド ソース (例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを公開する親マウント) をブロックします。
- 機密性の高いマウント (シークレット、SSH キー、サービス資格情報) は、絶対に必要な場合を除き、`:ro` である必要があります。
- ワークスペースへの読み取りアクセスのみが必要な場合は、`workspaceAccess: "ro"` と組み合わせます。バインドモードは独立したままになります。
- バインドがツール ポリシーおよび昇格された実行とどのように相互作用するかについては、[サンドボックス vs ツール ポリシー vs 昇格](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## 画像 + セットアップ

デフォルトの画像: `openclaw-sandbox:bookworm-slim`

一度ビルドしてみましょう。

````bash
scripts/sandbox-setup.sh
```注: デフォルトのイメージにはノードは**含まれません**。スキルにノード (または
他のランタイム)、カスタム イメージをベイクするか、経由でインストールします。
`sandbox.docker.setupCommand` (ネットワーク出力 + 書き込み可能なルート + が必要)
ルートユーザー）。

共通のツールを備えたより機能的なサンドボックス イメージが必要な場合 (たとえば、
`curl`、`jq`、`nodejs`、`python3`、`git`)、ビルド:

```bash
scripts/sandbox-common-setup.sh
````

次に、`agents.defaults.sandbox.docker.image` を次のように設定します。
`openclaw-sandbox-common:bookworm-slim`。

サンドボックス化されたブラウザーの画像:

```bash
scripts/sandbox-browser-setup.sh
```

デフォルトでは、サンドボックス コンテナは **ネットワークなし**で実行されます。
`agents.defaults.sandbox.docker.network` でオーバーライドします。

バンドルされたサンドボックス ブラウザ イメージには、保守的な Chromium 起動デフォルトも適用されます
コンテナ化されたワークロード向け。現在のコンテナのデフォルトには次のものがあります。- `--remote-debugging-address=127.0.0.1`

- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox`。
- 3 つのグラフィック強化フラグ (`--disable-3d-apis`、
  `--disable-software-rasterizer`、`--disable-gpu`) はオプションであり、便利です
  コンテナーに GPU サポートがない場合。 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定します
  ワークロードに WebGL またはその他の 3D/ブラウザー機能が必要な場合。
- `--disable-extensions` はデフォルトで有効になっており、次のコマンドで無効にできます。
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 拡張機能に依存したフローの場合。
- `--renderer-process-limit=2` はによって制御されます
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`、`0` は Chromium のデフォルトを保持します。

別のランタイム プロファイルが必要な場合は、カスタム ブラウザ イメージを使用して、
あなた自身のエントリーポイント。ローカル (非コンテナ) Chromium プロファイルの場合は、次を使用します。
`browser.extraArgs` を使用して、追加の起動フラグを追加します。

セキュリティのデフォルト:

- `network: "host"` はブロックされています。
- `network: "container:<id>"` はデフォルトでブロックされます (名前空間結合バイパスのリスク)。
- ブレークグラスオーバーライド: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker がインストールされ、コンテナ化されたゲートウェイがここに存在します。
[ドッカー](/install/docker)Docker ゲートウェイのデプロイの場合、`docker-setup.sh` はサンドボックス構成をブートストラップできます。
`OPENCLAW_SANDBOX=1` (または `true`/`yes`/`on`) を設定して、そのパスを有効にします。できます
ソケットの位置を `OPENCLAW_DOCKER_SOCKET` でオーバーライドします。完全なセットアップと環境
参照: [Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in)。

## setupCommand (1 回限りのコンテナーのセットアップ)

`setupCommand` は、サンドボックス コンテナーの作成後に **1 回**実行されます (毎回の実行ではありません)。
これは、`sh -lc` を介してコンテナー内で実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェントごと: `agents.list[].sandbox.docker.setupCommand`

よくある落とし穴:

- デフォルトの `docker.network` は `"none"` (出力なし) であるため、パッケージのインストールは失敗します。
- `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、ブレークグラスのみです。
- `readOnlyRoot: true` は書き込みを禁止します。 `readOnlyRoot: false` を設定するか、カスタム イメージをベイクします。
- `user` は、パッケージをインストールするために root である必要があります (`user` を省略するか、`user: "0:0"` を設定します)。
- サンドボックス exec はホスト `process.env` を継承しません\*\*。使用する
  スキル API キーの `agents.defaults.sandbox.docker.env` (またはカスタム イメージ)。

## ツールポリシー + エスケープハッチ

ツールの許可/拒否ポリシーは、サンドボックス ルールの前に引き続き適用されます。ツールが拒否された場合
グローバルまたはエージェントごとに、サンドボックス化してもそれは元に戻りません。`tools.elevated` は、ホスト上で `exec` を実行する明示的なエスケープ ハッチです。
`/exec` ディレクティブは、承認された送信者にのみ適用され、セッションごとに持続します。ハード無効化する
`exec`、ツール ポリシー拒否を使用します ([サンドボックスとツール ポリシーと昇格](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照)。

デバッグ:

- `openclaw sandbox explain` を使用して、効果的なサンドボックス モード、ツール ポリシー、および Fix-it 構成キーを検査します。
- 「これがブロックされる理由」については、[サンドボックス vs ツール ポリシー vs 昇格](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。メンタルモデル。
  ロックダウンしておいてください。

## マルチエージェントのオーバーライド

各エージェントはサンドボックス + ツールをオーバーライドできます。
`agents.list[].sandbox` および `agents.list[].tools` (さらにサンドボックス ツール ポリシー用の `agents.list[].tools.sandbox.tools`)。
優先順位については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

## 最小限の有効化の例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 関連ドキュメント

- [サンドボックス構成](/gateway/configuration#agentsdefaults-sandbox)
- [マルチエージェントサンドボックスとツール](/tools/multi-agent-sandbox-tools)
- [セキュリティ](/gateway/security)
