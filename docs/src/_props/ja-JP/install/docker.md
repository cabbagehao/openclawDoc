---
summary: "OpenClaw 向けの任意の Docker ベースセットアップとオンボーディング"
read_when:
  - コンテナ化したゲートウェイをローカルインストールの代わりに使いたい
  - Docker フローを検証したい
title: "Docker"
---

# Docker (任意)

Docker は **任意** です。コンテナ化したゲートウェイが必要な場合や、Docker フローを検証したい場合にのみ使ってください。

## Docker は自分に適しているか？

* **Yes**: 分離された一時的なゲートウェイ環境が必要、またはローカルインストールなしのホストで OpenClaw を動かしたい。
* **No**: 自分のマシン上で動かしており、最速の開発ループだけが欲しい。この場合は通常のインストールフローを使ってください。
* **サンドボックスに関する補足**: エージェントのサンドボックス化にも Docker を使いますが、完全なゲートウェイ全体を Docker 内で動かす必要は **ありません**。[Sandboxing](/gateway/sandboxing) を参照してください。

このガイドでは、次の 2 つを扱います。

* コンテナ化されたゲートウェイ (Docker 内で OpenClaw 全体を実行)
* セッション単位のエージェントサンドボックス (ホスト上のゲートウェイ + Docker で分離したエージェントツール)

サンドボックスの詳細: [Sandboxing](/gateway/sandboxing)

## 要件

* Docker Desktop (または Docker Engine) + Docker Compose v2
* イメージビルド用に最低 2 GB RAM
  * 1 GB ホストでは `pnpm install` が OOM kill され、exit 137 になることがあります
* イメージとログを保持できる十分なディスク容量
* VPS / 公開ホストで動かす場合は [Security hardening for network exposure](/gateway/security#04-network-exposure-bind--port--firewall) を確認してください
  * 特に Docker の `DOCKER-USER` firewall policy に注意してください

## コンテナ化された Gateway（Docker Compose）

### クイックスタート（推奨）

<Note>
  ここでの Docker 既定値は、host alias ではなく bind mode（`lan` / `loopback`）を前提にしています。`gateway.bind` には `0.0.0.0` や `localhost` のような host alias ではなく、`lan` や `loopback` のような bind mode の値を使ってください。
</Note>

リポジトリルートから:

```bash
./docker-setup.sh
```

このスクリプトでは次を行います。

* ゲートウェイイメージをローカルでビルドする
  * `OPENCLAW_IMAGE` が設定されていれば、代わりにリモートイメージを pull します
* オンボーディングウィザードを実行する
* 任意のプロバイダー設定に関するヒントを表示する
* Docker Compose 経由でゲートウェイを起動する
* ゲートウェイトークンを生成して `.env` に書き込む

任意の環境変数:

* `OPENCLAW_IMAGE` — ローカルビルドの代わりにリモートイメージを使う (例: `ghcr.io/openclaw/openclaw:latest`)
* `OPENCLAW_DOCKER_APT_PACKAGES` — ビルド時に追加の apt パッケージを入れる
* `OPENCLAW_EXTENSIONS` — ビルド時に extension の依存関係を事前インストールする
  * スペース区切りの extension 名を指定します。例: `diagnostics-otel matrix`
* `OPENCLAW_EXTRA_MOUNTS` — 追加のホスト bind mount を加える
* `OPENCLAW_HOME_VOLUME` — `/home/node` を named volume として永続化する
* `OPENCLAW_SANDBOX` — Docker ゲートウェイ用サンドボックス設定の bootstrap を有効にする
  * 明示的に truthy な値 `1`、`true`、`yes`、`on` の場合のみ有効です
* `OPENCLAW_INSTALL_DOCKER_CLI` — ローカルイメージビルド向けの build arg passthrough
  * `1` を指定するとイメージ内に Docker CLI を入れます
  * `docker-setup.sh` はローカルビルドで `OPENCLAW_SANDBOX=1` の場合、自動でこれを設定します
* `OPENCLAW_DOCKER_SOCKET` — Docker socket path を上書きする
  * デフォルトは `DOCKER_HOST=unix://...` の path、そうでなければ `/var/run/docker.sock`
* `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — 緊急時向け
  * CLI / オンボーディングクライアント経路で、信頼済み private network 上の `ws://` target を許可します
  * デフォルトは loopback のみです
* `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` — コンテナ browser の hardening flag を無効化する
  * `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` を外し、WebGL / 3D 互換性が必要なときに使います
* `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` — browser フローで extension が必要なときに有効のままにする
  * 既定ではサンドボックス側の browser で extension は無効です
* `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` — Chromium の renderer process 上限を設定する
  * `0` にするとこのフラグを省略し、Chromium のデフォルト動作を使います

完了後:

* ブラウザで `http://127.0.0.1:18789/` を開く
* Control UI にトークンを貼り付ける（Settings → token）
* URL が再度必要ですか？ `docker compose run --rm openclaw-cli dashboard --no-open` を実行してください。

### Docker ゲートウェイ用の agent sandbox を有効にする（オプトイン）

`docker-setup.sh` は、Docker デプロイ向けに `agents.defaults.sandbox.*` を初期設定することもできます。

有効化するには:

```bash
export OPENCLAW_SANDBOX=1
./docker-setup.sh
```

カスタム socket path（たとえば rootless Docker）の場合:

```bash
export OPENCLAW_SANDBOX=1
export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
./docker-setup.sh
```

注意:

* このスクリプトはサンドボックスの前提条件を満たしたあとでのみ `docker.sock` をマウントします。
* サンドボックスセットアップを完了できない場合、再実行時に古い / 壊れた設定が残らないよう `agents.defaults.sandbox.mode` を `off` に戻します。
* `Dockerfile.sandbox` がない場合は警告を出して続行します。
  * 必要なら `scripts/sandbox-setup.sh` で `openclaw-sandbox:bookworm-slim` をビルドしてください。
* ローカル以外の `OPENCLAW_IMAGE` を使う場合、そのイメージにはサンドボックス実行用の Docker CLI サポートがあらかじめ含まれている必要があります。

### 自動化 / CI（非対話、TTY ノイズなし）

スクリプトや CI では、`-T` で Compose の疑似 TTY 割り当てを無効にしてください。

```bash
docker compose run -T --rm openclaw-cli gateway probe
docker compose run -T --rm openclaw-cli devices list --json
```

自動化環境で Claude の session 変数を export していなくても、未設定値は `docker-compose.yml` 側で空文字として解決されるため、`variable is not set` 警告が繰り返し出ないようになっています。

### 共有ネットワークのセキュリティに関する注意（CLI + ゲートウェイ）

`openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使うため、CLI コマンドは Docker 内の `127.0.0.1` 経由で確実にゲートウェイへ到達できます。

これは共有された信頼境界として扱ってください。loopback bind は、この 2 つのコンテナ間の分離を意味しません。より強い分離が必要なら、同梱の `openclaw-cli` サービスではなく、別コンテナまたは別ホストのネットワーク経路からコマンドを実行してください。

CLI プロセスが侵害された場合の影響を減らすため、Compose 設定では `openclaw-cli` に対して `NET_RAW` / `NET_ADMIN` を drop し、`no-new-privileges` を有効にしています。

設定とワークスペースはホスト上の次の場所に書き込まれます。

* `~/.openclaw/`
* `~/.openclaw/workspace`

VPS 上で実行していますか？ [Hetzner (Docker VPS)](/install/hetzner) を参照してください。

### リモートイメージを使う（ローカルビルドをスキップ）

公式の事前ビルド済みイメージは次で公開されています。

* [GitHub Container Registry package](https://github.com/openclaw/openclaw/pkgs/container/openclaw)

イメージ名は `ghcr.io/openclaw/openclaw` を使ってください（似た名前の Docker Hub
イメージではありません）。

一般的なタグ:

* `main` — `main` の最新ビルド
* `<version>` — リリースタグのビルド（例: `2026.2.26`）
* `latest` — 最新の安定リリースタグ

### ベースイメージのメタデータ

現在のメイン Docker イメージで使われているベースイメージは次のとおりです。

* `node:22-bookworm`

現在の Docker イメージでは OCI の base-image annotation を公開しています（sha256 は一例で、
そのタグに固定されたマルチアーキテクチャの manifest list を指します）。

* `org.opencontainers.image.base.name=docker.io/library/node:22-bookworm`
* `org.opencontainers.image.base.digest=sha256:b501c082306a4f528bc4038cbf2fbb58095d583d0419a259b2114b5ac53d12e9`
* `org.opencontainers.image.source=https://github.com/openclaw/openclaw`
* `org.opencontainers.image.url=https://openclaw.ai`
* `org.opencontainers.image.documentation=https://docs.openclaw.ai/install/docker`
* `org.opencontainers.image.licenses=MIT`
* `org.opencontainers.image.title=OpenClaw`
* `org.opencontainers.image.description=OpenClaw gateway and CLI runtime container image`
* `org.opencontainers.image.revision=<git-sha>`
* `org.opencontainers.image.version=<tag-or-main>`
* `org.opencontainers.image.created=<rfc3339 timestamp>`

参考: [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)

補足: このリポジトリのタグ付き履歴では、`v2026.2.22` と、それ以前の 2026 系タグ
（例: `v2026.2.21`, `v2026.2.9`）でもすでに Bookworm を使用しています。

既定では、セットアップスクリプトはソースからイメージをビルドします。代わりに事前ビルド済み
イメージを取得したい場合は、スクリプト実行前に `OPENCLAW_IMAGE` を設定してください。

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./docker-setup.sh
```

スクリプトは `OPENCLAW_IMAGE` が既定の `openclaw:local` ではないことを検出すると、
`docker build` の代わりに `docker pull` を実行します。それ以外の処理
（オンボーディング、ゲートウェイ起動、トークン生成）は同じです。

`docker-setup.sh` はローカルの `docker-compose.yml` と補助ファイルを利用するため、
引き続きリポジトリルートから実行してください。`OPENCLAW_IMAGE` はローカルイメージのビルド時間を省くための設定であり、
Compose を使ったセットアップ手順そのものを置き換えるものではありません。

### シェルヘルパー（任意）

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールしてください。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
```

**シェル設定に追加（zsh）:**

```bash
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

その後は `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使えます。利用可能なコマンドは `clawdock-help` で確認してください。

詳しくは [`ClawDock` Helper README](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md) を参照してください。

### 手動手順（Compose）

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

注意: `docker compose ...` はリポジトリルートから実行してください。
`OPENCLAW_EXTRA_MOUNTS` または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは
`docker-compose.extra.yml` を生成します。別の場所で Compose を実行するときは、
これを含めてください。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### Control UI のトークンとペアリング（Docker）

`unauthorized` または `disconnected (1008): pairing required` と表示された場合は、
新しいダッシュボードリンクを取得して、ブラウザデバイスを承認してください。

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

詳細は [Dashboard](/web/dashboard) と [Devices](/cli/devices) を参照してください。

### 追加マウント（任意）

追加のホストディレクトリをコンテナへマウントしたい場合は、
`docker-setup.sh` を実行する前に `OPENCLAW_EXTRA_MOUNTS` を設定してください。これは
Docker の bind mount をカンマ区切りで指定する形式で、
`docker-compose.extra.yml` を生成して `openclaw-gateway` と `openclaw-cli` の両方に適用します。

例:

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意:

* macOS / Windows では、対象パスが Docker Desktop と共有されている必要があります。
* 各項目は `source:target[:options]` 形式で、スペース、タブ、改行を含めてはいけません。
* `OPENCLAW_EXTRA_MOUNTS` を編集した場合は、
  追加の Compose ファイルを再生成するために `docker-setup.sh` を再実行してください。
* `docker-compose.extra.yml` は自動生成されます。手動で編集しないでください。

### コンテナ全体の home を永続化する（任意）

コンテナを作り直したあとも `/home/node` を保持したい場合は、
`OPENCLAW_HOME_VOLUME` で named volume を指定してください。これにより Docker volume が作成され、
`/home/node` にマウントされます。同時に標準の設定 / ワークスペース用 bind mount も維持されます。ここでは
bind path ではなく named volume を使ってください。bind mount が必要な場合は
`OPENCLAW_EXTRA_MOUNTS` を使ってください。

例:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

追加マウントと組み合わせることもできます。

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意:

* named volume 名は `^[A-Za-z0-9][A-Za-z0-9_.-]*$` に一致する必要があります。
* `OPENCLAW_HOME_VOLUME` を変更した場合は、
  追加の Compose ファイルを再生成するために `docker-setup.sh` を再実行してください。
* named volume は `docker volume rm <name>` で削除するまで保持されます。

### 追加の apt packages をインストールする（任意）

イメージ内でシステムパッケージ（ビルドツールやメディア関連ライブラリなど）が必要な場合は、
`docker-setup.sh` 実行前に `OPENCLAW_DOCKER_APT_PACKAGES` を設定してください。
これによりイメージのビルド中にパッケージがインストールされるため、コンテナを削除しても保持されます。

例:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

注意:

* これは apt パッケージ名をスペース区切りで指定する形式です。
* `OPENCLAW_DOCKER_APT_PACKAGES` を変更した場合は、イメージを再ビルドするために `docker-setup.sh` を再実行してください。

### extension dependencies を事前インストールする（任意）

独自の `package.json` を持つ extension（例: `diagnostics-otel`, `matrix`,
`msteams`）は、初回読み込み時に npm 依存関係をインストールします。代わりにそれらの
依存関係をイメージへ組み込みたい場合は、
`docker-setup.sh` 実行前に `OPENCLAW_EXTENSIONS` を設定してください。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel matrix"
./docker-setup.sh
```

あるいは直接ビルドする場合:

```bash
docker build --build-arg OPENCLAW_EXTENSIONS="diagnostics-otel matrix" .
```

注意:

* これは `extensions/` 配下のディレクトリ名をスペース区切りで指定する形式です。
* `package.json` を持つ extension のみが対象です。これを持たない軽量プラグインは無視されます。
* `OPENCLAW_EXTENSIONS` を変更した場合は、イメージを再ビルドするために `docker-setup.sh` を再実行してください。

### 上級者向けのフル機能コンテナ（オプトイン）

既定の Docker イメージは **セキュリティ優先** で、非 root の `node`
ユーザーとして実行されます。攻撃対象領域は小さくなりますが、次の制約があります。

* 実行時にシステムパッケージを追加インストールできない
* デフォルトでは Homebrew なし
* Chromium / Playwright ブラウザは同梱されない

より多機能なコンテナが必要な場合は、次のオプトイン設定を使ってください。

1. ブラウザのダウンロードやツールキャッシュを保持できるよう、**`/home/node` を永続化**します。

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. **システム依存関係をイメージに組み込みます**（再現性があり、永続化されます）。

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **`npx` を使わずに Playwright ブラウザをインストール**します（npm の override 競合を回避できます）。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Playwright にシステム依存関係をインストールさせる必要がある場合は、
実行時に `--with-deps` を使う代わりに `OPENCLAW_DOCKER_APT_PACKAGES` 付きでイメージを再ビルドしてください。

4. **Playwright ブラウザのダウンロードを永続化**します。

* `docker-compose.yml` で
  `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定する。
* `OPENCLAW_HOME_VOLUME` で `/home/node` が永続化されていることを確認するか、
  `OPENCLAW_EXTRA_MOUNTS` で `/home/node/.cache/ms-playwright` をマウントする。

### 権限エラーと EACCES

イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で
権限エラーが表示される場合は、ホスト側の bind mount が uid 1000 の所有になっていることを確認してください。

例（Linux host）:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

利便性のために root 実行を選ぶ場合は、その分のセキュリティ上のトレードオフを受け入れる必要があります。

### より高速な再ビルド（推奨）

再ビルドを高速化するには、依存関係のレイヤーがキャッシュされるように Dockerfile の順序を調整してください。
これにより lockfile が変わらない限り `pnpm install` の再実行を避けられます。

```dockerfile
FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cache dependencies unless package metadata changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

### チャネルのセットアップ（任意）

CLI コンテナを使ってチャネルを設定し、必要に応じてゲートウェイを再起動してください。

WhatsApp（QR）:

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram（bot トークン）:

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord（bot トークン）:

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

関連ドキュメント: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

### OpenAI Codex OAuth（ヘッドレス Docker）

ウィザードで OpenAI Codex OAuth を選ぶと、ブラウザ URL を開いて
`http://127.0.0.1:1455/auth/callback` のコールバックを受け取ろうとします。Docker や
ヘッドレス環境では、このコールバック時にブラウザでエラーが表示されることがあります。遷移先の完全なリダイレクト URL をコピーし、
認証を完了するためにウィザードへ貼り戻してください。

### Health checks

コンテナのプローブ用エンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

エイリアスは `/health` と `/ready` です。

`/healthz` は「ゲートウェイプロセスが起動している」ことを確認する軽量な liveness probe です。
`/readyz` は起動猶予期間中も ready のままで、その後は必須の
管理対象チャネルが猶予期間後も未接続のままか、あとから切断された場合にのみ `503` を返します。

Docker イメージには、バックグラウンドで `/healthz` を監視する組み込みの `HEALTHCHECK` が含まれています。
つまり Docker は、OpenClaw が引き続き応答しているかを継続的に確認します。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` とマークし、
オーケストレーションシステム（Docker Compose の再起動ポリシー、Swarm、Kubernetes
など）は自動的に再起動または置き換えを行えます。

認証付きの詳細なヘルススナップショット（ゲートウェイ + チャネル）:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E smoke test（Docker）

```bash
scripts/e2e/onboard-docker.sh
```

### QR import smoke test（Docker）

```bash
pnpm test:docker:qr
```

### `lan` と `loopback` の違い（Docker Compose）

`docker-setup.sh` は既定で `OPENCLAW_GATEWAY_BIND=lan` を設定するため、
Docker のポート公開によりホストから `http://127.0.0.1:18789` へアクセスできます。

* `lan`（既定値）: ホストのブラウザとホスト CLI から、公開されたゲートウェイポートへ到達できます。
* `loopback`: コンテナの network namespace 内にいるプロセスだけが
  ゲートウェイへ直接到達できます。ホストへ公開されたポート経由のアクセスは失敗する場合があります。

セットアップスクリプトはオンボーディング後に `gateway.mode=local` も固定するため、Docker CLI
コマンドは既定でローカル loopback 宛てを使います。

旧来の設定に関する注意: `gateway.bind` には bind mode の値（`lan` / `loopback` /
`custom` / `tailnet` / `auto`）を使ってください。host alias（`0.0.0.0`, `127.0.0.1`,
`localhost`, `::`, `::1`）は使わないでください。

`Gateway target: ws://172.x.x.x:18789` や、Docker CLI コマンドで繰り返し `pairing required`
エラーが表示される場合は、次を実行してください。

```bash
docker compose run --rm openclaw-cli config set gateway.mode local
docker compose run --rm openclaw-cli config set gateway.bind lan
docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
```

### 注意

* ゲートウェイの bind はコンテナ利用向けに既定で `lan` です（`OPENCLAW_GATEWAY_BIND`）。
* Dockerfile の `CMD` は `--allow-unconfigured` を使います。マウントされた設定で `gateway.mode` が `local` でなくても起動します。ガードを強制したい場合は `CMD` を上書きしてください。
* ゲートウェイコンテナがセッション情報の正本です（`~/.openclaw/agents/<agentId>/sessions/`）。

### ストレージモデル

* **永続化されるホスト側データ:** Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に bind mount するため、これらのパスはコンテナを置き換えても保持されます。
* **一時的なサンドボックス tmpfs:** `agents.defaults.sandbox` が有効な場合、サンドボックスコンテナは `/tmp`、`/var/tmp`、`/run` に `tmpfs` を使います。これらのマウントはトップレベルの Compose スタックとは別で、サンドボックスコンテナとともに消えます。
* **ディスク増加しやすい箇所:** `media/`、`agents/<agentId>/sessions/sessions.json`、transcript JSONL ファイル、`cron/runs/*.jsonl`、および `/tmp/openclaw/`（または設定した `logging.file`）配下のローテートログに注意してください。Docker 外で macOS アプリも実行している場合、そのサービスログは別管理で、`~/.openclaw/logs/gateway.log`、`~/.openclaw/logs/gateway.err.log`、`/tmp/openclaw/openclaw-gateway.log` に出力されます。

## Agent Sandbox（ホスト上のゲートウェイ + Docker ツール）

詳細: [Sandboxing](/gateway/sandboxing)

### 概要

`agents.defaults.sandbox` が有効な場合、**main 以外のセッション** は Docker
コンテナ内でツールを実行します。ゲートウェイはホスト上に残りますが、ツール実行は分離されます。

* 既定の scope は `"agent"`（agent ごとに 1 つのコンテナ + ワークスペース）
* セッション単位で分離したい場合は scope に `"session"` を使います
* scope ごとのワークスペースフォルダを `/workspace` にマウントします
* 必要に応じて agent workspace access（`agents.defaults.sandbox.workspaceAccess`）を設定できます
* ツールポリシーは allow/deny 方式で、deny が優先されます
* 受信メディアは、ツールから読めるようアクティブなサンドボックスワークスペース（`media/inbound/*`）へコピーされます（`workspaceAccess: "rw"` の場合は agent ワークスペースに入ります）

警告: `scope: "shared"` はセッション間の分離を無効にします。すべてのセッションが
1 つのコンテナと 1 つのワークスペースを共有します。

### Agent ごとのサンドボックスプロファイル（multi-agent）

multi-agent routing を使う場合、各 agent はサンドボックス設定とツール設定を上書きできます。
対象は `agents.list[].sandbox` と `agents.list[].tools`（および `agents.list[].tools.sandbox.tools`）です。これにより、1 つのゲートウェイ内で
異なるアクセスレベルを混在させて運用できます。

* フルアクセス（個人用 agent）
* 読み取り専用ツール + 読み取り専用ワークスペース（家族用 / 業務用 agent）
* filesystem / shell ツールなし（公開 agent）

例、優先順位、トラブルシューティングは [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

### デフォルト動作

* イメージ: `openclaw-sandbox:bookworm-slim`
* agent ごとに 1 つのコンテナ
* Agent workspace access: `workspaceAccess: "none"`（既定値）では `~/.openclaw/sandboxes` を使います
  * `"ro"` ではサンドボックスワークスペースを `/workspace` のままにし、agent workspace を `/agent` へ読み取り専用でマウントします（`write` / `edit` / `apply_patch` は無効）
  * `"rw"` では agent workspace を `/workspace` へ読み書き可能でマウントします
* 自動削除: アイドル状態が 24 時間超、または作成から 7 日超
* ネットワーク: 既定値は `none`（外向き通信が必要な場合のみ明示的にオプトイン）
  * `host` はブロックされます。
  * `container:<id>` も既定でブロックされます（namespace join のリスクがあるため）。
* 既定で許可: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
* 既定で拒否: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### サンドボックスを有効にする

`setupCommand` でパッケージをインストールする予定がある場合は、次に注意してください。

* 既定の `docker.network` は `"none"`（外向き通信なし）です。
* `docker.network: "host"` はブロックされます。
* `docker.network: "container:<id>"` はデフォルトでブロックされます。
* 緊急時のみの上書き設定: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`
* `readOnlyRoot: true` ではパッケージインストールを実行できません。
* `apt-get` を使うには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定します）。
  OpenClaw は `setupCommand`（または Docker 設定）が変わると自動的にコンテナを再作成しますが、
  コンテナが**直近で使用されていた**（約 5 分以内）場合は除きます。稼働中のコンテナでは、
  正確な `openclaw sandbox recreate ...` コマンドを含む警告が表示されます。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent is default)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
        },
        prune: {
          idleHours: 24, // 0 disables idle pruning
          maxAgeDays: 7, // 0 disables max-age pruning
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

hardening 用の設定項目は `agents.defaults.sandbox.docker` 配下にあります。
`network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`,
`seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`,
`dangerouslyAllowContainerNamespaceJoin`（緊急時専用）。

multi-agent では、`agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope` が `"shared"` の場合を除き、agent ごとに `agents.list[].sandbox.{docker,browser,prune}.*` で `agents.defaults.sandbox.{docker,browser,prune}.*` を上書きできます
（`"shared"` の場合は無視されます）。

### 既定のサンドボックスイメージをビルドする

```bash
scripts/sandbox-setup.sh
```

これにより `Dockerfile.sandbox` を使って `openclaw-sandbox:bookworm-slim` がビルドされます。

### 共通サンドボックスイメージ（任意）

一般的なビルドツール群（Node、Go、Rust など）を含むサンドボックスイメージが必要な場合は、共通イメージをビルドしてください。

```bash
scripts/sandbox-common-setup.sh
```

これにより `openclaw-sandbox-common:bookworm-slim` がビルドされます。使用するには、次のように設定します。

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### サンドボックス用ブラウザイメージ

サンドボックス内で `browser` ツールを実行するには、ブラウザイメージをビルドしてください。

```bash
scripts/sandbox-browser-setup.sh
```

これにより `Dockerfile.sandbox-browser` を使って `openclaw-sandbox-browser:bookworm-slim` がビルドされます。コンテナでは CDP を有効にした Chromium と、
任意の noVNC オブザーバー（Xvfb 経由の headful モード）を実行します。

注意:

* Headful（Xvfb）は headless より bot blocking を受けにくくなります。
* `agents.defaults.sandbox.browser.headless=true` を設定すれば、引き続き headless を使えます。
* フルデスクトップ環境（GNOME など）は不要で、表示は Xvfb が提供します。
* ブラウザコンテナは、グローバルな `bridge` ではなく、専用の Docker network（`openclaw-sandbox-browser`）を既定で使います。
* 必要に応じて `agents.defaults.sandbox.browser.cdpSourceRange` を使い、コンテナ境界での CDP ingress を CIDR で制限できます（例: `172.21.0.1/32`）。
* noVNC のオブザーバーアクセスは既定でパスワード保護されます。OpenClaw は短時間だけ有効な observer token URL を提供し、パスワードは URL query ではなく URL fragment に保持されるローカル bootstrap page を返します。
* ブラウザコンテナの起動時既定値は、共有環境やコンテナワークロード向けに保守的に設定されており、次のフラグを含みます。
  * `--remote-debugging-address=127.0.0.1`
  * `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  * `--user-data-dir=${HOME}/.chrome`
  * `--no-first-run`
  * `--no-default-browser-check`
  * `--disable-3d-apis`
  * `--disable-software-rasterizer`
  * `--disable-gpu`
  * `--disable-dev-shm-usage`
  * `--disable-background-networking`
  * `--disable-features=TranslateUI`
  * `--disable-breakpad`
  * `--disable-crash-reporter`
  * `--metrics-recording-only`
  * `--renderer-process-limit=2`
  * `--no-zygote`
  * `--disable-extensions`
  * `agents.defaults.sandbox.browser.noSandbox` が設定されている場合は、`--no-sandbox` と
    `--disable-setuid-sandbox` も追加されます。
  * 上記 3 つの graphics hardening フラグは任意です。ワークロードで
    WebGL / 3D が必要な場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定して
    `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`
    なしで実行してください。
  * extension の挙動は `--disable-extensions` で制御され、extension 依存のページや extension を多用するワークフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` により無効化
    （つまり extension を有効化）できます。
  * `--renderer-process-limit=2` も
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT` で設定できます。ブラウザ並列数の調整が必要な場合は `0` にして、Chromium に
    既定の process limit を選ばせることもできます。

これらの既定値は同梱イメージであらかじめ適用されています。別の
Chromium フラグが必要な場合は、カスタムのブラウザイメージを使い、独自の entrypoint を指定してください。

設定例:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: { enabled: true },
      },
    },
  },
}
```

カスタムブラウザイメージ:

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } },
    },
  },
}
```

有効にすると、agent は次を受け取ります。

* サンドボックス用ブラウザ制御 URL（`browser` ツール用）
* noVNC URL（有効かつ headless=false の場合）

注意: ツールに allowlist を使う場合は、`browser` を追加し
（かつ deny から削除し）ない限り、そのツールはブロックされたままです。
prune ルール（`agents.defaults.sandbox.prune`）はブラウザコンテナにも適用されます。

### カスタムサンドボックスイメージ

独自のイメージをビルドし、設定でそれを指定してください。

```bash
docker build -t my-openclaw-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-openclaw-sbx" } },
    },
  },
}
```

### ツールポリシー（allow/deny）

* `deny` は `allow` に優先します。
* `allow` が空の場合: `deny` を除くすべてのツールが利用可能です。
* `allow` が空でない場合: `allow` にあるツールだけが利用可能です（`deny` を除く）。

### 自動削除ポリシー

調整できる項目は 2 つあります。

* `prune.idleHours`: X 時間使われていないコンテナを削除（0 = 無効）
* `prune.maxAgeDays`: X 日より古いコンテナを削除（0 = 無効）

例:

* 稼働中のセッションは維持しつつ、有効期間を制限する:
  `idleHours: 24`, `maxAgeDays: 7`
* 自動削除を一切行わない:
  `idleHours: 0`, `maxAgeDays: 0`

### セキュリティに関する注意

* 強い隔離が適用されるのは **tools** のみです（exec / read / write / edit / apply\_patch）。
* browser / camera / canvas のような host-only ツールは既定でブロックされます。
* サンドボックスで `browser` を許可すると **隔離が崩れます**（browser はホスト上で実行されます）。

## トラブルシューティング

* イメージがない: [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) でビルドするか、`agents.defaults.sandbox.docker.image` を設定してください。
* コンテナが起動していない: 必要になった時点で、セッションごとに自動作成されます。
* サンドボックスで権限エラーが出る: `docker.user` を
  マウントしたワークスペースの所有権に一致する UID:GID へ設定する
  （またはワークスペースフォルダを `chown` する）。
* カスタムツールが見つからない: OpenClaw は `sh -lc`（login shell）でコマンドを実行するため、
  `/etc/profile` を読み込んで `PATH` をリセットすることがあります。`docker.env.PATH` を設定して
  カスタムツールのパス（例: `/custom/bin:/usr/local/share/npm-global/bin`）を前置するか、
  Dockerfile で `/etc/profile.d/` 配下にスクリプトを追加してください。
