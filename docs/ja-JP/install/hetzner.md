---
summary: "耐久性のある状態とベイクインされたバイナリを備えた安価な Hetzner VPS (Docker) 上で OpenClaw Gateway を 24 時間年中無休で実行します"
read_when:
  - OpenClaw をクラウド VPS (ラップトップではなく) 上で 24 時間年中無休で実行したい場合
  - 独自の VPS 上に本番グレードの常時稼働ゲートウェイが必要な場合
  - 永続性、バイナリ、再起動動作を完全に制御したい
  - Hetzner または同様のプロバイダー上の Docker で OpenClaw を実行している
title: "ヘッツナー"
x-i18n:
  source_hash: "97339c7ddb8b9007fa51bb5c31b1fe5d2b1e190239216df3bd83ed8859f5dae1"
---

# Hetzner の OpenClaw (Docker、実稼働 VPS ガイド)

## Goal

Docker を使用して、Hetzner VPS 上で永続的な OpenClaw ゲートウェイを実行します。永続的な状態、ベイクインされたバイナリ、安全な再起動動作を備えています。

「OpenClaw を 24 時間年中無休で ~\$5 で利用したい」場合は、これが最もシンプルで信頼性の高いセットアップです。
Hetzner pricing changes;最小の Debian/Ubuntu VPS を選択し、OOM に達した場合はスケールアップします。

Security model reminder:

- 全員が同じ信頼境界内にあり、ランタイムがビジネス専用である場合、会社共有エージェントは問題ありません。
- 厳密な分離を維持します: 専用 VPS/ランタイム + 専用アカウント。そのホストには個人の Apple/Google/ブラウザ/パスワード マネージャー プロファイルはありません。
- ユーザーが互いに敵対する場合は、ゲートウェイ/ホスト/OS ユーザーごとに分割します。

[セキュリティ](/gateway/security) および [VPS ホスティング](/vps) を参照してください。

## 私たちは何をしているのでしょうか (簡単な言葉で)?

- 小規模な Linux サーバーをレンタルする (Hetzner VPS)
- Docker のインストール (分離されたアプリ ランタイム)
- Docker で OpenClaw ゲートウェイを開始する
- `~/.openclaw` + `~/.openclaw/workspace` をホスト上に保持します (再起動/再構築しても存続します)。
- SSH トンネル経由でラップトップからコントロール UI にアクセスします

ゲートウェイには次の方法でアクセスできます。

- ラップトップからの SSH ポート転送
- ファイアウォールとトークンを自分で管理する場合、ポートが直接公開されるこのガイドは、Hetzner 上の Ubuntu または Debian を前提としています。  
  別の Linux VPS を使用している場合は、それに応じてパッケージをマップします。
  一般的な Docker フローについては、「[Docker](/install/docker)」を参照してください。

---

## クイック パス (経験豊富なオペレーター)

1. Hetzner VPS のプロビジョニング
   2.Dockerをインストールする
2. OpenClaw リポジトリのクローンを作成する
3. 永続的なホスト ディレクトリを作成する
4. `.env` および `docker-compose.yml` を構成する
5. 必要なバイナリをイメージにベイクする
6. `docker compose up -d`
7. 永続性とゲートウェイ アクセスを確認する

---

## 必要なもの

- root アクセスのある Hetzner VPS
- ラップトップからの SSH アクセス
- SSH + コピー/ペーストによる基本的な快適さ
- ～20分
- Docker と Docker Compose
- モデル認証資格情報
- オプションのプロバイダー資格情報
  - WhatsApp QR
  - テレグラムボットトークン
  - Gmail OAuth

---

## 1) VPS をプロビジョニングする

Hetzner で Ubuntu または Debian VPS を作成します。

root として接続します。

```bash
ssh root@YOUR_VPS_IP
```

このガイドでは、VPS がステートフルであることを前提としています。
使い捨てのインフラとして扱わないでください。

---

## 2) Docker をインストールします (VPS 上)

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

---

## 3) OpenClaw リポジトリのクローンを作成します

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

このガイドでは、バイナリの永続性を保証するカスタム イメージを構築することを前提としています。

---

## 4) 永続的なホスト ディレクトリを作成する

Docker コンテナは一時的なものです。
すべての長期存続状態はホスト上に存在する必要があります。

```bash
mkdir -p /root/.openclaw/workspace

# Set ownership to the container user (uid 1000):
chown -R 1000:1000 /root/.openclaw
```

---

## 5) 環境変数を設定するリポジトリのルートに `.env` を作成します

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

Generate strong secrets:

```bash
openssl rand -hex 32
```

**このファイルはコミットしないでください。**

---

## 6) Docker Compose の構成

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

`--allow-unconfigured` はブートストラップの便宜のみを目的としており、適切なゲートウェイ構成に代わるものではありません。引き続き認証 (`gateway.auth.token` またはパスワード) を設定し、展開にセーフ バインド設定を使用します。

---

## 7) 必要なバイナリをイメージにベイクする (重要)

実行中のコンテナ内にバイナリをインストールするのは罠です。
実行時にインストールされたものはすべて、再起動時に失われます。

スキルに必要なすべての外部バイナリは、イメージのビルド時にインストールする必要があります。

以下の例では、3 つの一般的なバイナリのみを示しています。

- `gog` Gmail アクセス用
- `goplaces` Google プレイス用
- `wacli` WhatsApp 用

これらは例であり、完全なリストではありません。
同じパターンを使用して、必要な数のバイナリをインストールできます。

追加のバイナリに依存する新しいスキルを後で追加する場合は、次のことを行う必要があります。

1.Dockerfileを更新する2. Rebuild the image 3. コンテナを再起動します

**Example Dockerfile**

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

---

## 8) ビルドして起動する

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Verify binaries:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Expected output:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 9) ゲートウェイの検証

```bash
docker compose logs -f openclaw-gateway
```

成功:

```
[gateway] listening on ws://0.0.0.0:18789
```

ラップトップから:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

Open:`http://127.0.0.1:18789/`

ゲートウェイ トークンを貼り付けます。

---

## 何がどこに存続するか (真実の情報源)

OpenClaw は Docker で実行されますが、Docker は真実の情報源ではありません。
すべての長期間存続する状態は、再起動、再構築、および再起動後も存続する必要があります。|コンポーネント |場所 |永続化メカニズム |メモ |
| ------------------- | --------------------------------- | ---------------------- | -------------------------------- |
|ゲートウェイ構成 | `/home/node/.openclaw/` |ホストボリュームのマウント | `openclaw.json`、トークンが含まれます。
|モデル認証プロファイル | `/home/node/.openclaw/` |ホストボリュームのマウント | OAuth トークン、API キー |
|スキル構成 | `/home/node/.openclaw/skills/` |ホストボリュームのマウント |スキルレベルの状態 |
|エージェントワークスペース | `/home/node/.openclaw/workspace/` |ホストボリュームのマウント |コードとエージェントのアーティファクト |
| WhatsApp セッション | `/home/node/.openclaw/` |ホストボリュームのマウント | QR ログインを保持 |
| Gmail キーホルダー | `/home/node/.openclaw/` |ホストボリューム + パスワード | `GOG_KEYRING_PASSWORD` が必要です |
|外部バイナリ | `/usr/local/bin/` | Docker イメージ |ビルド時にベイクする必要があります |
|ノードランタイム |コンテナファイルシステム | Docker イメージ |すべてのイメージ ビルドを再構築 |
| OS パッケージ |コンテナファイルシステム | Docker イメージ |実行時にインストールしない |
| Dockerコンテナ |一時的な |再起動可能 |破壊しても安全 |

---## コードとしてのインフラストラクチャ (Terraform)

コードとしてのインフラストラクチャのワークフローを好むチームの場合、コミュニティが管理する Terraform セットアップは以下を提供します。

- リモート状態管理を備えたモジュラー Terraform 構成
- Cloud-init による自動プロビジョニング
- 導入スクリプト (ブートストラップ、導入、バックアップ/復元)
- セキュリティ強化 (ファイアウォール、UFW、SSH のみのアクセス)
- ゲートウェイアクセス用のSSHトンネル構成

**リポジトリ:**

- インフラストラクチャ: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 構成: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

このアプローチは、再現可能なデプロイメント、バージョン管理されたインフラストラクチャ、および自動化された災害復旧によって、上記の Docker セットアップを補完します。

> **注:** コミュニティによって管理されています。問題や貢献については、上記のリポジトリ リンクを参照してください。
