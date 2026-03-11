---
summary: "耐久性のある状態とビルド時に組み込んだバイナリを備え、安価な Hetzner VPS 上で OpenClaw ゲートウェイを 24 時間 365 日動かす"
read_when:
  - OpenClaw をノート PC ではなくクラウド VPS 上で常時稼働させたい
  - 自前の VPS 上で本番向けの常時稼働ゲートウェイを構築したい
  - 永続化、バイナリ、再起動挙動を完全に制御したい
  - Hetzner または類似プロバイダー上で Docker 版 OpenClaw を運用している
title: "Hetzner"
x-i18n:
  source_hash: "97339c7ddb8b9007fa51bb5c31b1fe5d2b1e190239216df3bd83ed8859f5dae1"
---

# Hetzner 上の OpenClaw (Docker、本番 VPS ガイド)

## 目標

Hetzner の VPS 上で Docker を使って、状態が永続化され、必要なバイナリをビルド時に組み込み、安全に再起動できる OpenClaw ゲートウェイを常時稼働させます。

「月額およそ 5 ドルで OpenClaw を 24 時間 365 日動かしたい」場合、この構成が最もシンプルで信頼しやすい選択です。Hetzner の料金は変わることがあるため、まずは最小の Debian / Ubuntu VPS を選び、OOM が出たらスケールアップしてください。

セキュリティモデルに関する前提:

* 全員が同じ信頼境界に属し、ランタイムが業務専用なら、社内共有エージェント構成でも問題ありません
* 専用 VPS / 専用ランタイム / 専用アカウントを保ち、そのホストに個人用の Apple、Google、ブラウザ、パスワードマネージャープロファイルを置かないでください
* 利用者同士を相互に信頼できない場合は、ゲートウェイ、ホスト、OS ユーザー単位で分離してください

[Security](/gateway/security) と [VPS hosting](/vps) も参照してください。

## 何をするのか (簡単に)

* Hetzner で小さな Linux サーバーを借りる
* Docker を入れて、アプリ実行環境を分離する
* Docker 内で OpenClaw ゲートウェイを起動する
* `~/.openclaw` と `~/.openclaw/workspace` をホスト側に永続化する
* ノート PC から SSH トンネル経由で Control UI へアクセスする

ゲートウェイへの到達方法は次の 2 通りです。

* ノート PC からの SSH ポートフォワーディング
* ファイアウォールとトークン管理を自前で行う前提での直接ポート公開

このガイドでは、Hetzner 上の Ubuntu または Debian を前提にしています。別の Linux VPS を使う場合は、パッケージ名などを適宜読み替えてください。汎用的な Docker フローについては [Docker](/install/docker) を参照してください。

***

## クイックパス (慣れている運用者向け)

1. Hetzner VPS を用意する
2. Docker をインストールする
3. OpenClaw リポジトリを clone する
4. 永続化用のホストディレクトリを作る
5. `.env` と `docker-compose.yml` を設定する
6. 必要なバイナリをイメージへ組み込む
7. `docker compose up -d` を実行する
8. 永続化とゲートウェイ到達性を確認する

***

## 必要なもの

* root アクセス可能な Hetzner VPS
* ノート PC からの SSH アクセス
* SSH とコピー/ペースト操作の基本知識
* 20 分程度の作業時間
* Docker と Docker Compose
* モデル用の認証情報
* 任意のプロバイダー認証情報
  * WhatsApp QR
  * Telegram ボットトークン
  * Gmail OAuth

***

## 1) VPS を用意する

Hetzner で Ubuntu または Debian の VPS を作成します。

root で接続します。

```bash
ssh root@YOUR_VPS_IP
```

このガイドは、VPS を stateful に運用する前提です。使い捨てインフラとして扱わないでください。

***

## 2) Docker をインストールする (VPS 上)

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

確認:

```bash
docker --version
docker compose version
```

***

## 3) OpenClaw リポジトリを clone する

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

このガイドでは、バイナリの永続性を確保するためにカスタムイメージをビルドする前提です。

***

## 4) 永続化用のホストディレクトリを作成する

Docker コンテナは一時的です。長期間残る状態はすべてホスト側に置く必要があります。

```bash
mkdir -p /root/.openclaw/workspace

# Set ownership to the container user (uid 1000):
chown -R 1000:1000 /root/.openclaw
```

***

## 5) 環境変数を設定する

リポジトリルートに `.env` を作成します。

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.openclaw
OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

十分に強い秘密値は次で生成してください。

```bash
openssl rand -hex 32
```

**このファイルはコミットしないでください。**

***

## 6) Docker Compose を設定する

`docker-compose.yml` を作成または更新します。

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE}
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HOME=/home/node
      - NODE_ENV=production
      - TERM=xterm-256color
      - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
      - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
      - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
      - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    ports:
      # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
      # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${OPENCLAW_GATEWAY_BIND}",
        "--port",
        "${OPENCLAW_GATEWAY_PORT}",
        "--allow-unconfigured",
      ]
```

`--allow-unconfigured` は初回ブートストラップを簡単にするためだけの指定であり、適切なゲートウェイ設定の代わりにはなりません。`gateway.auth.token` またはパスワードによる認証は必ず設定し、デプロイ先に適した安全な bind 設定を使ってください。

***

## 7) 必要なバイナリをイメージに組み込む (重要)

実行中コンテナの中でバイナリを追加インストールするのは避けてください。ランタイム中に入れたものは、コンテナ再起動で失われます。

skills が必要とする外部バイナリは、すべてイメージビルド時にインストールしておく必要があります。

以下は、よく使う 3 つのバイナリだけを例示しています。

* Gmail アクセス用の `gog`
* Google Places 用の `goplaces`
* WhatsApp 用の `wacli`

これはあくまで例であり、完全な一覧ではありません。同じパターンで必要な数だけ追加できます。

後から追加した skill が別のバイナリに依存する場合は、次の対応が必要です。

1. Dockerfile を更新する
2. イメージを再ビルドする
3. コンテナを再起動する

**Dockerfile の例**

```dockerfile
FROM node:22-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

***

## 8) ビルドして起動する

```bash
docker compose build
docker compose up -d openclaw-gateway
```

バイナリ確認:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

期待される出力:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

***

## 9) ゲートウェイを確認する

```bash
docker compose logs -f openclaw-gateway
```

成功時の目安:

```
[gateway] listening on ws://0.0.0.0:18789
```

ノート PC 側では次を実行します。

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

開く URL:

`http://127.0.0.1:18789/`

ゲートウェイトークンを貼り付けて接続してください。

***

## 何がどこに残るか (source of truth)

OpenClaw 自体は Docker で動きますが、Docker 自体は source of truth ではありません。長期間残る状態は、再起動、再ビルド、再起動後も維持できる必要があります。

| Component           | Location                          | Persistence mechanism  | Notes                            |
| ------------------- | --------------------------------- | ---------------------- | -------------------------------- |
| Gateway config      | `/home/node/.openclaw/`           | Host volume mount      | Includes `openclaw.json`, tokens |
| Model auth profiles | `/home/node/.openclaw/`           | Host volume mount      | OAuth tokens, API keys           |
| Skill configs       | `/home/node/.openclaw/skills/`    | Host volume mount      | Skill-level state                |
| Agent workspace     | `/home/node/.openclaw/workspace/` | Host volume mount      | Code and agent artifacts         |
| WhatsApp session    | `/home/node/.openclaw/`           | Host volume mount      | Preserves QR login               |
| Gmail keyring       | `/home/node/.openclaw/`           | Host volume + password | Requires `GOG_KEYRING_PASSWORD`  |
| External binaries   | `/usr/local/bin/`                 | Docker image           | Must be baked at build time      |
| Node runtime        | Container filesystem              | Docker image           | Rebuilt every image build        |
| OS packages         | Container filesystem              | Docker image           | Do not install at runtime        |
| Docker container    | Ephemeral                         | Restartable            | Safe to destroy                  |

***

## Infrastructure as Code (Terraform)

インフラをコードで管理したいチーム向けに、コミュニティメンテナンスの Terraform 構成もあります。内容は次のとおりです。

* リモートステート管理を含むモジュール化 Terraform 構成
* cloud-init による自動プロビジョニング
* デプロイスクリプト (bootstrap、deploy、backup / restore)
* セキュリティ強化 (firewall、UFW、SSH のみのアクセス)
* ゲートウェイアクセス用 SSH トンネル設定

**リポジトリ:**

* Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
* Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

この方式は、上記の Docker セットアップに対して、再現可能なデプロイ、バージョン管理されたインフラ、自動ディザスタリカバリを補完します。

> **Note:** コミュニティメンテナンスです。問題報告やコントリビュート先は上記リポジトリを参照してください。
