---
summary: "GCP Compute Engine VM (Docker) 上で、永続状態を保ちながら OpenClaw ゲートウェイを 24 時間 365 日動かす"
description: "GCP Compute Engine と Docker を使って、永続状態を保ちながら OpenClaw Gateway を常時運用する手順です。"
read_when:
  - GCP 上で OpenClaw を 24 時間 365 日実行したい場合
  - 自分の VM 上で本番環境レベルの常時稼働 Gateway が必要な場合
  - 永続性、バイナリ、再起動の動作を完全に制御したい場合
title: "GCP"
seoTitle: "GCP Compute Engine で OpenClaw を常時運用する導入手順"
---
## 目標

永続状態、ビルド時に組み込んだバイナリ、安全な再起動挙動を備えた GCP Compute Engine VM 上で、Docker を使って OpenClaw ゲートウェイを常時稼働させます。

「月額約5〜12ドルで OpenClaw を 24 時間 365 日稼働させたい」場合、これは Google Cloud 上の信頼できるセットアップです。
価格はマシンの種類とリージョンによって異なります。ワークロードに適合する最小の VM を選択し、OOM (メモリ不足) が発生した場合はスケールアップしてください。

## 何をするのか (簡単に)

- GCP プロジェクトを作成し、課金を有効にします
- Compute Engine VM を作成します
- Docker (分離されたアプリランタイム) をインストールします
- Docker で OpenClaw ゲートウェイを起動します
- ホスト上で `~/.openclaw` + `~/.openclaw/workspace` を永続化します (再起動/再ビルド後も存続します)
- SSH トンネル経由でノート PC から Control UI にアクセスします

ゲートウェイへのアクセス方法は次のとおりです。

- ノート PC からの SSH ポートフォワーディング
- ファイアウォールとトークンを自分で管理する場合の直接のポート公開

このガイドでは、GCP Compute Engine 上の Debian を使用します。
Ubuntu も機能します。それに応じてパッケージをマッピングしてください。
一般的な Docker フローについては、[Docker](/install/docker) を参照してください。

---

## クイックパス (経験豊富なオペレーター向け)

1. GCP プロジェクトの作成 + Compute Engine API の有効化
2. Compute Engine VM の作成 (e2-small、Debian 12、20GB)
3. VM への SSH 接続
4. Docker のインストール
5. OpenClaw リポジトリのクローン
6. 永続的なホストディレクトリの作成
7. `.env` と `docker-compose.yml` の設定
8. 必要なバイナリの組み込み、ビルド、起動

---

## 必要なもの

- GCP アカウント (e2-micro の無料枠の対象)
- インストール済みの gcloud CLI (または Cloud Console を使用)
- ラップトップからの SSH アクセス
- SSH + コピー/ペーストに関する基本的な知識
- 約 20〜30 分
- Docker と Docker Compose
- モデルの認証情報
- オプションのプロバイダ認証情報
  - WhatsApp の QR
  - Telegram のボットトークン
  - Gmail の OAuth

---

## 1) gcloud CLI をインストールする (または Console を使う)

**オプション A: gcloud CLI** (自動化に推奨)

[https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) からインストールします。

初期化と認証を行います:

```bash
gcloud init
gcloud auth login
```

**オプション B: Cloud Console**

すべての手順は、[https://console.cloud.google.com](https://console.cloud.google.com) のウェブ UI 経由で実行できます。

---

## 2) GCP プロジェクトを作成する

**CLI:**

```bash
gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
gcloud config set project my-openclaw-project
```

[https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) で課金を有効にします (Compute Engine に必要です)。

Compute Engine API を有効にします:

```bash
gcloud services enable compute.googleapis.com
```

**Console:**

1. IAM と管理 (IAM & Admin) > プロジェクトの作成 (Create Project) に移動します。
2. 名前を付けて作成します。
3. プロジェクトの課金を有効にします。
4. API とサービス (APIs & Services) > API を有効にする (Enable APIs) に移動し、「Compute Engine API」を検索して有効化 (Enable) します。

---

## 3) VM の作成

**マシンの種類:**

| 種類      | スペック               | コスト         | 備考                                                      |
| --------- | ---------------------- | -------------- | --------------------------------------------------------- |
| e2-medium | 2 vCPU, 4GB RAM        | 月額約 25 ドル | ローカルの Docker ビルドに最も信頼性がある                |
| e2-small  | 2 vCPU, 2GB RAM        | 月額約 12 ドル | Docker ビルドに推奨される最小要件                         |
| e2-micro  | 2 vCPU (共有), 1GB RAM | 無料枠の対象   | Docker ビルドの OOM (終了コード 137) で失敗することが多い |

**CLI:**

```bash
gcloud compute instances create openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

**Console:**

1. Compute Engine > VM インスタンス (VM instances) > インスタンスを作成 (Create instance) に移動します。
2. 名前 (Name): `openclaw-gateway`
3. リージョン (Region): `us-central1`、ゾーン (Zone): `us-central1-a`
4. マシンの種類 (Machine type): `e2-small`
5. ブートディスク (Boot disk): Debian 12、20GB
6. 作成 (Create) します。

---

## 4) VM への SSH 接続

**CLI:**

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

**Console:**

Compute Engine ダッシュボードで、VM の横にある「SSH」ボタンをクリックします。

注意: SSH キーの伝播には、VM の作成後 1〜2 分かかる場合があります。接続が拒否された場合は、待ってから再試行してください。

---

## 5) Docker のインストール (VM 上)

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

グループの変更を適用するために、ログアウトして再度ログインします:

```bash
exit
```

その後、再度 SSH で接続します:

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

確認します:

```bash
docker --version
docker compose version
```

---

## 6) OpenClaw リポジトリのクローン

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

このガイドでは、バイナリの永続性を保証するためにカスタムイメージをビルドすることを前提としています。

---

## 7) 永続的なホストディレクトリの作成

Docker コンテナは一時的なものです。
長期的な状態はすべてホスト上に置く必要があります。

```bash
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
```

---

## 8) 環境変数の設定

リポジトリのルートに `.env` を作成します。

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

強力なシークレットを生成します:

```bash
openssl rand -hex 32
```

**このファイルをコミットしないでください。**

---

## 9) Docker Compose の設定

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
      # 推奨: VM 上では Gateway をループバックのみに保ち、SSH トンネル経由でアクセスします。
      # パブリックに公開するには、`127.0.0.1:` のプレフィックスを削除し、適宜ファイアウォールを設定します。
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
      ]
```

---

## 10) 必要なバイナリをイメージに組み込む (重要)

実行中のコンテナ内にバイナリをインストールするのは罠です。
実行時にインストールされたものはすべて再起動時に失われます。

スキルに必要なすべての外部バイナリは、イメージのビルド時にインストールする必要があります。

以下の例は、3 つの一般的なバイナリのみを示しています:

- `gog` (Gmail アクセス用)
- `goplaces` (Google プレイス用)
- `wacli` (WhatsApp 用)

これらは例であり、完全なリストではありません。
同じパターンを使用して、必要な数のバイナリをインストールできます。

後で追加のバイナリに依存する新しいスキルを追加する場合は、以下を行う必要があります:

1. Dockerfile の更新
2. イメージの再ビルド
3. コンテナの再起動

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

# 同じパターンを使用して、以下にさらにバイナリを追加します

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

## 11) ビルドと起動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` の実行中に `Killed` / `exit code 137` でビルドが失敗した場合、VM はメモリ不足です。 最小で `e2-small`、またはより信頼性の高い最初のビルドには `e2-medium` を使用してください。

LAN にバインドする場合 (`OPENCLAW_GATEWAY_BIND=lan`) は、続行する前に信頼できるブラウザのオリジンを設定します:

```bash
docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
```

Gateway のポートを変更した場合は、`18789` を設定したポートに置き換えてください。

バイナリを確認します:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

予想される出力:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 12) ゲートウェイを確認する

```bash
docker compose logs -f openclaw-gateway
```

成功:

```
[gateway] listening on ws://0.0.0.0:18789
```

---

## 13) ノート PC からアクセスする

ゲートウェイのポートを転送する SSH トンネルを作成します。

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

ブラウザで開きます:

`http://127.0.0.1:18789/`

新しいトークン化されたダッシュボードのリンクを取得します:

```bash
docker compose run --rm openclaw-cli dashboard --no-open
```

その URL からトークンを貼り付けます。

Control UI に `unauthorized` または `disconnected (1008): pairing required` と表示された場合は、ブラウザデバイスを承認します:

```bash
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

---

## 何がどこに永続化されるか (信頼できる情報源)

OpenClaw は Docker で実行されますが、Docker は信頼できる情報源ではありません。
すべての長期的な状態は、再起動、再ビルド、およびマシンの再起動後も存続する必要があります。

| コンポーネント             | 場所                              | 永続化メカニズム              | 備考                                   |
| -------------------------- | --------------------------------- | ----------------------------- | -------------------------------------- |
| Gateway 設定               | `/home/node/.openclaw/`           | ホストのボリュームマウント    | `openclaw.json`、トークンを含む        |
| モデル認証プロファイル     | `/home/node/.openclaw/`           | ホストのボリュームマウント    | OAuth トークン、API キー               |
| スキル設定                 | `/home/node/.openclaw/skills/`    | ホストのボリュームマウント    | スキルレベルの状態                     |
| エージェントワークスペース | `/home/node/.openclaw/workspace/` | ホストのボリュームマウント    | コードとエージェントのアーティファクト |
| WhatsApp セッション        | `/home/node/.openclaw/`           | ホストのボリュームマウント    | QR ログインを維持します                |
| Gmail キーリング           | `/home/node/.openclaw/`           | ホストボリューム + パスワード | `GOG_KEYRING_PASSWORD` が必要          |
| 外部バイナリ               | `/usr/local/bin/`                 | Docker イメージ               | ビルド時に組み込む必要があります       |
| Node ランタイム            | コンテナのファイルシステム        | Docker イメージ               | イメージのビルドごとに再構築されます   |
| OS パッケージ              | コンテナのファイルシステム        | Docker イメージ               | 実行時にインストールしないでください   |
| Docker コンテナ            | エフェメラル (一時的)             | 再起動可能                    | 破棄しても安全です                     |

---

## アップデート

VM 上の OpenClaw を更新するには:

```bash
cd ~/openclaw
git pull
docker compose build
docker compose up -d
```

---

## トラブルシューティング

**SSH connection refused**

SSH キーの伝播には、VM の作成後 1〜2 分かかる場合があります。待ってから再試行してください。

**OS Login の問題**

OS Login プロファイルを確認します:

```bash
gcloud compute os-login describe-profile
```

アカウントに必要な IAM 権限 (Compute OS Login または Compute OS Admin Login) があることを確認してください。

**メモリ不足 (OOM)**

`pnpm install --frozen-lockfile` 中に `Killed` や `exit code 137` で Docker ビルドが失敗した場合、VM は OOM によりキルされました。e2-small (最小要件) または e2-medium (ローカルビルドの信頼性を高めるために推奨) にアップグレードしてください。

```bash
# まず VM を停止します
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# マシンの種類を変更します
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM を開始します
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## サービスアカウント (セキュリティのベストプラクティス)

個人での使用には、デフォルトのユーザーアカウントで問題なく機能します。

自動化または CI/CD パイプラインの場合は、最小限の権限を持つ専用のサービスアカウントを作成します。

1. サービスアカウントを作成します:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute インスタンス管理者ロール (またはより限定的なカスタムロール) を付与します:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

自動化に「オーナー」ロールを使用することは避けてください。最小特権の原則を使用します。

IAM ロールの詳細については、[https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) を参照してください。

---

## 次のステップ

- メッセージングチャネルの設定: [チャネル](/channels)
- ローカルデバイスをノードとしてペアリング: [ノード](/nodes)
- ゲートウェイの設定: [Gateway 設定](/gateway/configuration)
