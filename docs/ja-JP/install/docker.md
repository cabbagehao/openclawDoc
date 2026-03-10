---
summary: "OpenClaw のための任意の Docker ベースセットアップとオンボーディング"
read_when:
  - コンテナ化された gateway をローカルインストールの代わりに使いたい
  - Docker フローを検証したい
title: "Docker"
---

# Docker（任意）

Docker は**任意**です。コンテナ化された Gateway が必要な場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に適しているか？

- **Yes**: 分離された一時的な gateway 環境が必要、またはローカルインストールのないホストで OpenClaw を実行したい。
- **No**: 自分のマシン上で実行していて、最速の開発ループだけが必要。代わりに通常のインストールフローを使ってください。
- **Sandboxing note**: エージェントのサンドボックス化にも Docker を使いますが、完全な gateway を Docker 内で実行する必要は**ありません**。[Sandboxing](/gateway/sandboxing) を参照してください。

このガイドでは次を扱います。

- コンテナ化された Gateway（Docker 内で完全な OpenClaw）
- セッションごとの Agent Sandbox（ホスト gateway + Docker で分離された agent tools）

Sandboxing の詳細: [Sandboxing](/gateway/sandboxing)

## 要件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも 2 GB RAM（1 GB ホストでは `pnpm install` が OOM kill され、exit 137 になることがあります）
- イメージとログのための十分なディスク容量
- VPS / 公開ホストで実行する場合は、
  [Security hardening for network exposure](/gateway/security#04-network-exposure-bind--port--firewall)
  を確認してください。特に Docker の `DOCKER-USER` firewall policy に注意してください。

## コンテナ化された Gateway（Docker Compose）

### クイックスタート（推奨）

<Note>
ここでの Docker のデフォルトは host aliases ではなく bind mode（`lan`/`loopback`）を前提としています。`gateway.bind` には host aliases のような
`0.0.0.0` や `localhost` ではなく、bind mode の値（たとえば `lan` や `loopback`）を使ってください。
</Note>

リポジトリルートから:

```bash
./docker-setup.sh
```

このスクリプトは次を行います。

- gateway イメージをローカルでビルドする（または `OPENCLAW_IMAGE` が設定されていればリモートイメージを pull する）
- オンボーディングウィザードを実行する
- 任意の provider セットアップのヒントを表示する
- Docker Compose 経由で gateway を起動する
- gateway token を生成して `.env` に書き込む

任意の環境変数:

- `OPENCLAW_IMAGE` — ローカルビルドの代わりにリモートイメージを使う（例: `ghcr.io/openclaw/openclaw:latest`）
- `OPENCLAW_DOCKER_APT_PACKAGES` — ビルド時に追加の apt packages をインストールする
- `OPENCLAW_EXTENSIONS` — ビルド時に extension dependencies を事前インストールする（スペース区切りの extension 名。例: `diagnostics-otel matrix`）
- `OPENCLAW_EXTRA_MOUNTS` — 追加のホスト bind mounts を加える
- `OPENCLAW_HOME_VOLUME` — `/home/node` を named volume に永続化する
- `OPENCLAW_SANDBOX` — Docker gateway sandbox bootstrap にオプトインする。明示的に truthy な値 `1`、`true`、`yes`、`on` の場合のみ有効
- `OPENCLAW_INSTALL_DOCKER_CLI` — ローカルイメージビルド用の build arg passthrough（`1` でイメージ内に Docker CLI をインストール）。`docker-setup.sh` はローカルビルドで `OPENCLAW_SANDBOX=1` の場合、自動的にこれを設定します。
- `OPENCLAW_DOCKER_SOCKET` — Docker socket path を上書きする（デフォルト: `DOCKER_HOST=unix://...` path、それ以外は `/var/run/docker.sock`）
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — 緊急用: CLI / オンボーディングクライアント経路向けに、信頼できる private-network の
  `ws://` targets を許可する（デフォルトでは loopback のみ）
- `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` — コンテナ browser hardening flags
  `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu` を無効化し、
  WebGL/3D 互換性が必要な場合に使う。
- `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` — browser
  フローで extensions が必要な場合に有効のままにする
  （デフォルトでは sandbox browser で extensions は無効）。
- `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` — Chromium renderer process
  limit を設定する。`0` にするとフラグを省略し、Chromium のデフォルト動作を使う。

完了後:

- ブラウザで `http://127.0.0.1:18789/` を開く。
- Control UI に token を貼り付ける（Settings → token）。
- URL が再度必要ですか？ `docker compose run --rm openclaw-cli dashboard --no-open` を実行してください。

### Docker gateway 用の agent sandbox を有効にする（オプトイン）

`docker-setup.sh` は Docker
デプロイ向けに `agents.defaults.sandbox.*` を bootstrap することもできます。

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

- このスクリプトは sandbox の前提条件を満たした後でのみ `docker.sock` を mount します。
- sandbox セットアップを完了できない場合、再実行時に古い / 壊れた sandbox config が残らないよう、スクリプトは
  `agents.defaults.sandbox.mode` を `off` に戻します。
- `Dockerfile.sandbox` がない場合、スクリプトは警告を表示して続行します。
  必要に応じて `scripts/sandbox-setup.sh` で `openclaw-sandbox:bookworm-slim` をビルドしてください。
- ローカル以外の `OPENCLAW_IMAGE` 値では、そのイメージに sandbox 実行用の Docker
  CLI サポートがすでに含まれている必要があります。

### 自動化 / CI（非対話、TTY ノイズなし）

スクリプトや CI では、`-T` で Compose の疑似 TTY 割り当てを無効にしてください。

```bash
docker compose run -T --rm openclaw-cli gateway probe
docker compose run -T --rm openclaw-cli devices list --json
```

自動化環境で Claude session vars を何も export していない場合でも、未設定のままで
`docker-compose.yml` ではデフォルトで空値に解決されるようになり、繰り返し表示される "variable is not set"
警告を避けられます。

### 共有ネットワークのセキュリティに関する注意（CLI + gateway）

`openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使うため、CLI コマンドは
Docker 内の `127.0.0.1` 経由で確実に gateway に到達できます。

これは共有された信頼境界として扱ってください。loopback bind はこの 2 つの
コンテナ間の分離を意味しません。より強い分離が必要な場合は、同梱の `openclaw-cli` service ではなく、
別のコンテナ / ホストの network path からコマンドを実行してください。

CLI プロセスが侵害された場合の影響を減らすため、compose config では
`openclaw-cli` に対して `NET_RAW` / `NET_ADMIN` を drop し、`no-new-privileges` を有効にしています。

config / workspace はホスト上の次の場所に書き込まれます。

- `~/.openclaw/`
- `~/.openclaw/workspace`

VPS 上で実行していますか？ [Hetzner (Docker VPS)](/install/hetzner) を参照してください。

### リモートイメージを使う（ローカルビルドをスキップ）

公式の事前ビルド済みイメージは次で公開されています。

- [GitHub Container Registry package](https://github.com/openclaw/openclaw/pkgs/container/openclaw)

イメージ名は `ghcr.io/openclaw/openclaw` を使ってください（似た名前の Docker Hub
イメージではありません）。

一般的なタグ:

- `main` — `main` の最新ビルド
- `<version>` — リリースタグのビルド（例: `2026.2.26`）
- `latest` — 最新の安定リリースタグ

### ベースイメージのメタデータ

現在のメイン Docker イメージは次を使用しています。

- `node:22-bookworm`

docker image は現在 OCI base-image annotations を公開しています（sha256 は例であり、
そのタグに固定された multi-arch manifest list を指しています）。

- `org.opencontainers.image.base.name=docker.io/library/node:22-bookworm`
- `org.opencontainers.image.base.digest=sha256:b501c082306a4f528bc4038cbf2fbb58095d583d0419a259b2114b5ac53d12e9`
- `org.opencontainers.image.source=https://github.com/openclaw/openclaw`
- `org.opencontainers.image.url=https://openclaw.ai`
- `org.opencontainers.image.documentation=https://docs.openclaw.ai/install/docker`
- `org.opencontainers.image.licenses=MIT`
- `org.opencontainers.image.title=OpenClaw`
- `org.opencontainers.image.description=OpenClaw gateway and CLI runtime container image`
- `org.opencontainers.image.revision=<git-sha>`
- `org.opencontainers.image.version=<tag-or-main>`
- `org.opencontainers.image.created=<rfc3339 timestamp>`

参考: [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)

リリース文脈: このリポジトリのタグ付き履歴では、`v2026.2.22` およびそれ以前の 2026 タグ
（たとえば `v2026.2.21`, `v2026.2.9`）ですでに Bookworm を使用しています。

デフォルトでは、セットアップスクリプトはソースからイメージをビルドします。事前ビルド済み
イメージを代わりに pull するには、スクリプト実行前に `OPENCLAW_IMAGE` を設定してください。

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./docker-setup.sh
```

スクリプトは `OPENCLAW_IMAGE` がデフォルトの `openclaw:local` ではないことを検出すると、
`docker build` ではなく `docker pull` を実行します。それ以外（オンボーディング、
gateway 起動、token 生成）は同じように動作します。

`docker-setup.sh` はローカルの
`docker-compose.yml` と helper files を使うため、引き続きリポジトリルートから実行します。`OPENCLAW_IMAGE` はローカルイメージのビルド時間をスキップするものであり、
compose / setup workflow 自体を置き換えるものではありません。

### Shell Helpers（任意）

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールしてください。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
```

**shell config に追加（zsh）:**

```bash
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

その後 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` などを使えます。すべてのコマンドは `clawdock-help` で確認してください。

詳細は [`ClawDock` Helper README](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md) を参照してください。

### 手動フロー（compose）

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

注意: `docker compose ...` はリポジトリルートから実行してください。
`OPENCLAW_EXTRA_MOUNTS` または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは
`docker-compose.extra.yml` を書き出します。別の場所で Compose を実行するときは、
これを含めてください。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### Control UI token + pairing（Docker）

“unauthorized” または “disconnected (1008): pairing required” が表示された場合は、
新しい dashboard link を取得して browser device を承認してください。

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

詳細: [Dashboard](/web/dashboard), [Devices](/cli/devices)。

### 追加マウント（任意）

追加のホストディレクトリをコンテナに mount したい場合は、
`docker-setup.sh` を実行する前に `OPENCLAW_EXTRA_MOUNTS` を設定してください。これは
Docker bind mounts のカンマ区切りリストを受け取り、
`docker-compose.extra.yml` を生成して `openclaw-gateway` と `openclaw-cli` の両方に適用します。

例:

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意:

- macOS / Windows では、パスは Docker Desktop と共有されている必要があります。
- 各項目は `source:target[:options]` 形式で、スペース、タブ、改行を含めてはいけません。
- `OPENCLAW_EXTRA_MOUNTS` を編集した場合は、
  追加の compose file を再生成するために `docker-setup.sh` を再実行してください。
- `docker-compose.extra.yml` は自動生成されます。手動で編集しないでください。

### コンテナ全体の home を永続化する（任意）

コンテナ再作成後も `/home/node` を保持したい場合は、
`OPENCLAW_HOME_VOLUME` で named volume を設定してください。これにより Docker volume が作成され、
`/home/node` に mount されます。同時に標準の config / workspace bind mounts も維持されます。ここでは
named volume を使ってください（bind path ではありません）。bind mounts が必要な場合は
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

- Named volumes は `^[A-Za-z0-9][A-Za-z0-9_.-]*$` に一致する必要があります。
- `OPENCLAW_HOME_VOLUME` を変更した場合は、
  追加の compose file を再生成するために `docker-setup.sh` を再実行してください。
- Named volume は `docker volume rm <name>` で削除するまで保持されます。

### 追加の apt packages をインストールする（任意）

イメージ内で system packages（たとえば build tools や media
libraries）が必要な場合は、`docker-setup.sh` 実行前に `OPENCLAW_DOCKER_APT_PACKAGES` を設定してください。
これによりイメージビルド中に packages がインストールされるため、コンテナが削除されても保持されます。

例:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

注意:

- これは apt package 名のスペース区切りリストを受け取ります。
- `OPENCLAW_DOCKER_APT_PACKAGES` を変更した場合は、イメージを再ビルドするために `docker-setup.sh` を再実行してください。

### extension dependencies を事前インストールする（任意）

独自の `package.json` を持つ extensions（例: `diagnostics-otel`, `matrix`,
`msteams`）は、初回ロード時に npm dependencies をインストールします。代わりにそれらの
dependencies をイメージへ組み込みたい場合は、
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

- これは extension directory 名（`extensions/` 配下）のスペース区切りリストを受け取ります。
- `package.json` を持つ extensions のみが対象です。これを持たない軽量 plugin は無視されます。
- `OPENCLAW_EXTENSIONS` を変更した場合は、イメージを再ビルドするために `docker-setup.sh` を再実行してください。

### Power-user / フル機能コンテナ（オプトイン）

デフォルトの Docker イメージは**セキュリティ優先**で、非 root の `node`
user として実行されます。これにより attack surface は小さくなりますが、次の制約があります。

- 実行時の system package installs は不可
- デフォルトでは Homebrew なし
- Chromium / Playwright browsers は同梱されない

よりフル機能なコンテナが必要な場合は、次のオプトイン設定を使ってください。

1. browser downloads や tool caches が保持されるよう、**`/home/node` を永続化**する:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. **system deps をイメージに組み込む**（再現可能かつ永続的）:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **`npx` を使わずに Playwright browsers をインストール**する（npm override conflicts を回避）:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Playwright に system deps をインストールさせる必要がある場合は、
実行時に `--with-deps` を使う代わりに `OPENCLAW_DOCKER_APT_PACKAGES` 付きでイメージを再ビルドしてください。

4. **Playwright browser downloads を永続化**する:

- `docker-compose.yml` で
  `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定する。
- `OPENCLAW_HOME_VOLUME` で `/home/node` が永続化されていることを確認するか、
  `OPENCLAW_EXTRA_MOUNTS` で `/home/node/.cache/ms-playwright` を mount する。

### Permissions + EACCES

イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で
permission errors が表示される場合は、ホストの bind mounts が uid 1000 に所有されていることを確認してください。

例（Linux host）:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

利便性のために root で実行することを選ぶ場合は、そのセキュリティ上のトレードオフを受け入れることになります。

### より高速な再ビルド（推奨）

再ビルドを高速化するには、dependency layers が cache されるよう Dockerfile を並べてください。
これにより lockfiles が変わらない限り `pnpm install` の再実行を避けられます。

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

### Channel セットアップ（任意）

CLI container を使って channels を設定し、必要に応じて gateway を再起動してください。

WhatsApp（QR）:

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram（bot token）:

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord（bot token）:

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

ドキュメント: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

### OpenAI Codex OAuth（ヘッドレス Docker）

ウィザードで OpenAI Codex OAuth を選ぶと、browser URL を開いて
`http://127.0.0.1:1455/auth/callback` で callback を捕捉しようとします。Docker や
headless 環境では、その callback で browser error が表示されることがあります。遷移先の完全な redirect
URL をコピーして、auth を完了するためにウィザードへ貼り戻してください。

### Health checks

Container probe endpoints（auth 不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

Aliases: `/health` と `/ready`。

`/healthz` は「gateway process が起動している」ことを確認する浅い liveness probe です。
`/readyz` は startup grace 中も ready のままで、その後、必須の
managed channels が grace 後も未接続のままか、後から切断された場合にのみ `503` になります。

Docker イメージには、バックグラウンドで `/healthz` を ping する組み込みの `HEALTHCHECK` が含まれています。
平たく言えば、Docker は OpenClaw が引き続き応答しているかを継続的に確認します。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` とマークし、
オーケストレーションシステム（Docker Compose restart policy、Swarm、Kubernetes
など）は自動的に再起動または置き換えを行えます。

認証付きの詳細 health snapshot（gateway + channels）:

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

### LAN vs loopback（Docker Compose）

`docker-setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を設定するため、
Docker port publishing によりホストから `http://127.0.0.1:18789` へアクセスできます。

- `lan`（デフォルト）: ホスト browser とホスト CLI は、公開された gateway port に到達できます。
- `loopback`: コンテナ network namespace 内の process だけが
  gateway に直接到達できます。ホストに公開された port へのアクセスは失敗する場合があります。

セットアップスクリプトはオンボーディング後に `gateway.mode=local` も固定するため、Docker CLI
commands はデフォルトで local loopback targeting を使います。

legacy config に関する注意: `gateway.bind` には bind mode の値（`lan` / `loopback` /
`custom` / `tailnet` / `auto`）を使ってください。host aliases（`0.0.0.0`, `127.0.0.1`,
`localhost`, `::`, `::1`）は使わないでください。

`Gateway target: ws://172.x.x.x:18789` や、Docker CLI commands で繰り返し `pairing required`
errors が表示される場合は、次を実行してください。

```bash
docker compose run --rm openclaw-cli config set gateway.mode local
docker compose run --rm openclaw-cli config set gateway.bind lan
docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
```

### 注意

- Gateway bind はコンテナ使用向けにデフォルトで `lan` です（`OPENCLAW_GATEWAY_BIND`）。
- Dockerfile CMD は `--allow-unconfigured` を使います。mount された config で `gateway.mode` が `local` でなくても起動します。guard を強制するには CMD を上書きしてください。
- gateway container は sessions の source of truth です（`~/.openclaw/agents/<agentId>/sessions/`）。

### Storage model

- **永続的なホストデータ:** Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に bind-mount するため、これらのパスはコンテナを置き換えても保持されます。
- **一時的な sandbox tmpfs:** `agents.defaults.sandbox` が有効な場合、sandbox containers は `/tmp`, `/var/tmp`, `/run` に `tmpfs` を使います。これらの mounts はトップレベルの Compose stack とは別であり、sandbox container とともに消えます。
- **ディスク増加のホットスポット:** `media/`, `agents/<agentId>/sessions/sessions.json`, transcript JSONL files, `cron/runs/*.jsonl`, および `/tmp/openclaw/`（または設定した `logging.file`）配下の rolling file logs に注意してください。Docker 外で macOS app も実行している場合、その service logs はさらに別です: `~/.openclaw/logs/gateway.log`, `~/.openclaw/logs/gateway.err.log`, および `/tmp/openclaw/openclaw-gateway.log`。

## Agent Sandbox（host gateway + Docker tools）

詳細: [Sandboxing](/gateway/sandboxing)

### これは何をするのか

`agents.defaults.sandbox` が有効な場合、**main 以外の sessions** は Docker
container 内で tools を実行します。gateway はホスト上に残りますが、tool execution は分離されます。

- デフォルトで scope: `"agent"`（agent ごとに 1 つの container + workspace）
- セッション単位の分離には scope: `"session"`
- scope ごとの workspace folder を `/workspace` に mount
- 任意の agent workspace access（`agents.defaults.sandbox.workspaceAccess`）
- allow/deny tool policy（deny が優先）
- 受信 media は、tools が読めるようにアクティブな sandbox workspace（`media/inbound/*`）へコピーされます（`workspaceAccess: "rw"` の場合、これは agent workspace に入ります）

警告: `scope: "shared"` はセッション間の分離を無効にします。すべての sessions が
1 つの container と 1 つの workspace を共有します。

### Agent ごとの sandbox profiles（multi-agent）

multi-agent routing を使う場合、各 agent は sandbox + tool settings を上書きできます:
`agents.list[].sandbox` と `agents.list[].tools`（および `agents.list[].tools.sandbox.tools`）。これにより、1 つの gateway 内で
異なる access level を混在させて実行できます。

- フルアクセス（個人用 agent）
- 読み取り専用 tools + 読み取り専用 workspace（家族 / 仕事用 agent）
- filesystem / shell tools なし（公開 agent）

例、優先順位、トラブルシューティングは [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

### デフォルト動作

- イメージ: `openclaw-sandbox:bookworm-slim`
- agent ごとに 1 つの container
- Agent workspace access: `workspaceAccess: "none"`（デフォルト）では `~/.openclaw/sandboxes` を使用
  - `"ro"` では sandbox workspace を `/workspace` のままにし、agent workspace を `/agent` に読み取り専用で mount します（`write`/`edit`/`apply_patch` を無効化）
  - `"rw"` では agent workspace を `/workspace` に読み書き可能で mount
- Auto-prune: アイドル > 24h または作成後 > 7d
- Network: デフォルトは `none`（egress が必要な場合は明示的にオプトイン）
  - `host` はブロックされます。
  - `container:<id>` はデフォルトでブロックされます（namespace-join risk）。
- デフォルト allow: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- デフォルト deny: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### Sandboxing を有効にする

`setupCommand` で packages をインストールする予定がある場合は、次に注意してください。

- デフォルトの `docker.network` は `"none"`（egress なし）です。
- `docker.network: "host"` はブロックされます。
- `docker.network: "container:<id>"` はデフォルトでブロックされます。
- 緊急時の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
- `readOnlyRoot: true` は package installs をブロックします。
- `apt-get` には `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定）。
  OpenClaw は `setupCommand`（または docker config）が変わると自動的に containers を再作成しますが、
  container が**最近使用された**（約 5 分以内）場合は除きます。稼働中の containers では、
  正確な `openclaw sandbox recreate ...` コマンドを含む warning が出ます。

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

hardening knobs は `agents.defaults.sandbox.docker` 配下にあります:
`network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`,
`seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`,
`dangerouslyAllowContainerNamespaceJoin`（緊急時専用）。

multi-agent: `agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope` が `"shared"` の場合を除き、agent ごとに `agents.list[].sandbox.{docker,browser,prune}.*` で `agents.defaults.sandbox.{docker,browser,prune}.*` を上書きできます
（`"shared"` の場合は無視されます）。

### デフォルト sandbox image をビルドする

```bash
scripts/sandbox-setup.sh
```

これにより `Dockerfile.sandbox` を使って `openclaw-sandbox:bookworm-slim` がビルドされます。

### Sandbox common image（任意）

一般的な build tooling（Node, Go, Rust など）を含む sandbox image が欲しい場合は、common image をビルドしてください。

```bash
scripts/sandbox-common-setup.sh
```

これにより `openclaw-sandbox-common:bookworm-slim` がビルドされます。使用するには:

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### Sandbox browser image

sandbox 内で browser tool を実行するには、browser image をビルドしてください。

```bash
scripts/sandbox-browser-setup.sh
```

これにより
`Dockerfile.sandbox-browser` を使って `openclaw-sandbox-browser:bookworm-slim` がビルドされます。container は CDP を有効にした Chromium と、
任意の noVNC observer（Xvfb 経由の headful）を実行します。

注意:

- Headful（Xvfb）は headless より bot blocking を受けにくくなります。
- `agents.defaults.sandbox.browser.headless=true` を設定すれば、引き続き headless を使えます。
- 完全な desktop environment（GNOME）は不要です。Xvfb が display を提供します。
- Browser containers は、グローバルな `bridge` ではなく、専用の Docker network（`openclaw-sandbox-browser`）をデフォルトで使います。
- 任意の `agents.defaults.sandbox.browser.cdpSourceRange` で、container edge の CDP ingress を CIDR で制限できます（例: `172.21.0.1/32`）。
- noVNC observer access はデフォルトで password 保護されます。OpenClaw は短時間有効な observer token URL を提供し、password は URL query ではなく URL fragment に保持されるローカル bootstrap page を配信します。
- Browser container の起動デフォルトは共有 / コンテナ workload 向けに保守的に設定されており、次を含みます:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-software-rasterizer`
  - `--disable-gpu`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--metrics-recording-only`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--disable-extensions`
  - `agents.defaults.sandbox.browser.noSandbox` が設定されている場合は、`--no-sandbox` と
    `--disable-setuid-sandbox` も追加されます。
  - 上記 3 つの graphics hardening flags は任意です。workload で
    WebGL/3D が必要な場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定して
    `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`
    なしで実行してください。
  - Extension の動作は `--disable-extensions` で制御され、extension 依存のページや extension の多い workflow では `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` により無効化
    （つまり extensions を有効化）できます。
  - `--renderer-process-limit=2` も
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT` で設定でき、browser concurrency の調整が必要な場合は `0` にすると Chromium に
    デフォルトの process limit を選ばせることができます。

これらのデフォルトは同梱イメージでは既定で適用されます。異なる
Chromium flags が必要な場合は、カスタム browser image を使い、独自の entrypoint を指定してください。

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

カスタム browser image:

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

- sandbox browser control URL（`browser` tool 用）
- noVNC URL（有効かつ headless=false の場合）

覚えておいてください: tools に allowlist を使う場合は、`browser` を追加し（そして
deny から削除し）ない限り、その tool はブロックされたままです。
prune rules（`agents.defaults.sandbox.prune`）は browser containers にも適用されます。

### カスタム sandbox image

独自のイメージをビルドし、config でそれを指定してください。

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

### Tool policy（allow/deny）

- `deny` は `allow` に優先します。
- `allow` が空の場合: すべての tools（deny を除く）が利用可能です。
- `allow` が空でない場合: `allow` にある tools のみが利用可能です（deny を除く）。

### Pruning strategy

2 つの knobs があります。

- `prune.idleHours`: X 時間使われていない containers を削除（0 = 無効）
- `prune.maxAgeDays`: X 日より古い containers を削除（0 = 無効）

例:

- 稼働中の sessions は維持しつつ、寿命を制限する:
  `idleHours: 24`, `maxAgeDays: 7`
- 一切 prune しない:
  `idleHours: 0`, `maxAgeDays: 0`

### セキュリティに関する注意

- 強い隔離が適用されるのは **tools** のみです（exec/read/write/edit/apply_patch）。
- browser/camera/canvas のような host-only tools はデフォルトでブロックされます。
- sandbox で `browser` を許可すると **隔離が破れます**（browser は host 上で実行されます）。

## トラブルシューティング

- イメージがない: [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) でビルドするか、`agents.defaults.sandbox.docker.image` を設定してください。
- Container が動いていない: 必要になったとき、セッションごとに自動作成されます。
- sandbox で permission errors が出る: `docker.user` を
  mount した workspace の所有権に一致する UID:GID に設定する
  （または workspace folder を chown する）。
- custom tools が見つからない: OpenClaw は `sh -lc`（login shell）で commands を実行するため、
  `/etc/profile` を読み込み、PATH をリセットすることがあります。`docker.env.PATH` を設定して
  custom tool paths（例: `/custom/bin:/usr/local/share/npm-global/bin`）を前置するか、
  Dockerfile で `/etc/profile.d/` 配下に script を追加してください。
