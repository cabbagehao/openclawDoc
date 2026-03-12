---
title: "Fly.io"
seoTitle: "Fly.io へ OpenClaw をデプロイして運用する手順"
description: "Fly.io 上で OpenClaw を常時稼働させるためのデプロイ、永続ストレージ、HTTPS、運用手順を説明します。"
summary: "永続ストレージと HTTPS を備えた OpenClaw のための Fly.io デプロイのステップバイステップ"
read_when:
  - OpenClaw を Fly.io にデプロイする場合
  - Fly のボリューム、シークレット、および初回実行時の設定を行う場合
---
**目標:** 永続ストレージ、自動 HTTPS、Discord などのチャネル接続を備えた [Fly.io](https://fly.io) マシン上で OpenClaw ゲートウェイを実行することです。

## 必要なもの

- インストール済みの [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io アカウント (無料枠で機能します)
- モデル認証: 使用するモデルプロバイダーの API キー
- チャネル認証情報: Discord ボットトークン、Telegram トークンなど

## 初心者向けのクイックパス

1. リポジトリのクローン → `fly.toml` のカスタマイズ
2. アプリ + ボリュームの作成 → シークレットの設定
3. `fly deploy` でデプロイ
4. SSH で接続して設定を作成するか、Control UI を使用する

## 1) Fly アプリの作成

```bash
# リポジトリのクローン
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 新しい Fly アプリを作成します (自分の名前を選択してください)
fly apps create my-openclaw

# 永続ボリュームを作成します (通常は 1GB で十分です)
fly volumes create openclaw_data --size 1 --region iad
```

**ヒント:** 自分に近いリージョンを選択してください。一般的なオプション: `lhr` (ロンドン)、`iad` (バージニア)、`sjc` (サンノゼ)。

## 2) fly.toml の設定

アプリ名と要件に合わせて `fly.toml` を編集します。

**セキュリティに関する注意:** デフォルトの設定では、パブリック URL が公開されます。パブリック IP のない強化されたデプロイメントについては、[プライベートデプロイメント](#プライベートデプロイメント-強化版) を参照するか、`fly.private.toml` を使用してください。

```toml
app = "my-openclaw"  # あなたのアプリ名
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  OPENCLAW_PREFER_PNPM = "1"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

[mounts]
  source = "openclaw_data"
  destination = "/data"
```

**主な設定:**

| 設定                           | 理由                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `--bind lan`                   | Fly のプロキシが Gateway に到達できるように `0.0.0.0` にバインドします                                 |
| `--allow-unconfigured`         | 設定ファイルなしで起動します (後で作成します)                                                          |
| `internal_port = 3000`         | Fly のヘルスチェックのために `--port 3000` (または `OPENCLAW_GATEWAY_PORT`) と一致させる必要があります |
| `memory = "2048mb"`            | 512MB では小さすぎます。2GB を推奨します                                                               |
| `OPENCLAW_STATE_DIR = "/data"` | ボリューム上に状態を永続化します                                                                       |

## 3) シークレットの設定

```bash
# 必須: Gateway トークン (非ループバックバインディング用)
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# モデルプロバイダの API キー
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# オプション: その他のプロバイダ
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_API_KEY=...

# チャネルトークン
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

**注意:**

- 非ループバックバインド (`--bind lan`) には、セキュリティのために `OPENCLAW_GATEWAY_TOKEN` が必要です。
- これらのトークンはパスワードのように扱ってください。
- すべての API キーとトークンには、**設定ファイルよりも環境変数を優先**してください。これにより、シークレットが誤って公開されたりログに記録されたりする可能性がある `openclaw.json` からシークレットを遠ざけることができます。

## 4) デプロイ

```bash
fly deploy
```

最初のデプロイでは Docker イメージがビルドされます (約 2〜3 分)。以降のデプロイはより高速になります。

デプロイ後、確認します:

```bash
fly status
fly logs
```

以下のように表示されるはずです:

```
[gateway] listening on ws://0.0.0.0:3000 (PID xxx)
[discord] logged in to discord as xxx
```

## 5) 設定ファイルの作成

マシンに SSH で接続して、適切な設定を作成します:

```bash
fly ssh console
```

設定ディレクトリとファイルを作成します:

```bash
mkdir -p /data
cat > /data/openclaw.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": ["anthropic/claude-sonnet-4-5", "openai/gpt-4o"]
      },
      "maxConcurrent": 4
    },
    "list": [
      {
        "id": "main",
        "default": true
      }
    ]
  },
  "auth": {
    "profiles": {
      "anthropic:default": { "mode": "token", "provider": "anthropic" },
      "openai:default": { "mode": "token", "provider": "openai" }
    }
  },
  "bindings": [
    {
      "agentId": "main",
      "match": { "channel": "discord" }
    }
  ],
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "allowlist",
      "guilds": {
        "YOUR_GUILD_ID": {
          "channels": { "general": { "allow": true } },
          "requireMention": false
        }
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "auto"
  },
  "meta": {
    "lastTouchedVersion": "2026.1.29"
  }
}
EOF
```

**注意:** `OPENCLAW_STATE_DIR=/data` の場合、設定パスは `/data/openclaw.json` です。

**注意:** Discord トークンは次のいずれかから取得できます:

- 環境変数: `DISCORD_BOT_TOKEN` (シークレットに推奨)
- 設定ファイル: `channels.discord.token`

環境変数を使用する場合、設定にトークンを追加する必要はありません。Gateway は自動的に `DISCORD_BOT_TOKEN` を読み取ります。

再起動して適用します:

```bash
exit
fly machine restart <machine-id>
```

## 6) ゲートウェイへのアクセス

### Control UI

ブラウザで開きます:

```bash
fly open
```

または `https://my-openclaw.fly.dev/` にアクセスします。

ゲートウェイトークン (`OPENCLAW_GATEWAY_TOKEN` の値) を貼り付けて認証します。

### ログ

```bash
fly logs              # ライブログ
fly logs --no-tail    # 最近のログ
```

### SSH コンソール

```bash
fly ssh console
```

## トラブルシューティング

### "App is not listening on expected address"

ゲートウェイが `0.0.0.0` ではなく `127.0.0.1` に bind しています。

**修正:** `fly.toml` のプロセスコマンドに `--bind lan` を追加します。

### ヘルスチェック失敗 / connection refused

Fly が設定ポート上のゲートウェイへ到達できません。

**修正:** `internal_port` が Gateway のポートと一致していることを確認します (`--port 3000` または `OPENCLAW_GATEWAY_PORT=3000` を設定します)。

### OOM / メモリ不足

コンテナが再起動を繰り返すか、強制終了されます。兆候: `SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`、またはサイレントな再起動。

**修正:** `fly.toml` でメモリを増やします:

```toml
[[vm]]
  memory = "2048mb"
```

または、既存のマシンを更新します:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意:** 512MB では小さすぎます。1GB でも機能する可能性がありますが、負荷がかかったり、冗長なログ記録が行われたりすると OOM になる可能性があります。**2GB を推奨します。**

### ゲートウェイのロック問題

「すでに実行中です (already running)」というエラーで Gateway が起動を拒否します。

これは、コンテナは再起動したものの、PID ロックファイルがボリューム上に残っている場合に発生します。

**修正:** ロックファイルを削除します:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ロックファイルは `/data/gateway.*.lock` にあります (サブディレクトリではありません)。

### 設定が読み込まれない

`--allow-unconfigured` を使用している場合、Gateway は最小限の設定を作成します。`/data/openclaw.json` にあるカスタム設定は、再起動時に読み込まれるはずです。

設定が存在することを確認します:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH 経由での設定の書き込み

`fly ssh console -C` コマンドはシェルのリダイレクトをサポートしていません。設定ファイルを書き込むには:

```bash
# echo + tee を使用します (ローカルからリモートへパイプします)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# または sftp を使用します
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注意:** ファイルがすでに存在する場合、`fly sftp` は失敗する可能性があります。最初に削除します:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状態が永続化されない

再起動後に認証情報やセッションが失われる場合、状態ディレクトリがコンテナのファイルシステムに書き込まれています。

**修正:** `fly.toml` で `OPENCLAW_STATE_DIR=/data` が設定されていることを確認し、再デプロイします。

## アップデート

```bash
# 最新の変更を取得します
git pull

# 再デプロイします
fly deploy

# 正常性を確認します
fly status
fly logs
```

### マシンコマンドの更新

完全な再デプロイを行わずに起動コマンドを変更する必要がある場合:

```bash
# マシン ID を取得します
fly machines list

# コマンドを更新します
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# またはメモリの増加と一緒に
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注意:** `fly deploy` の後、マシンコマンドは `fly.toml` にあるものにリセットされる可能性があります。手動で変更を加えた場合は、デプロイ後に再適用してください。

## プライベートデプロイメント (強化版)

デフォルトでは、Fly はパブリック IP を割り当てるため、`https://your-app.fly.dev` で Gateway にアクセスできるようになります。これは便利ですが、インターネットスキャナー (Shodan、Censys など) によってデプロイメントが発見される可能性があることを意味します。

**パブリックに公開しない**強化されたデプロイメントの場合は、プライベートテンプレートを使用してください。

### プライベートデプロイメントを使用する場合

- **アウトバウンド**の呼び出し/メッセージのみを行う場合 (インバウンドの Webhook なし)
- Webhook コールバックに **ngrok または Tailscale** トンネルを使用する場合
- ブラウザの代わりに **SSH、プロキシ、または WireGuard** 経由でゲートウェイへアクセスする場合
- **インターネットスキャナーからデプロイメントを隠したい**場合

### セットアップ

標準の設定の代わりに `fly.private.toml` を使用します:

```bash
# プライベート設定でデプロイします
fly deploy -c fly.private.toml
```

または、既存のデプロイメントを変換します:

```bash
# 現在の IP を一覧表示します
fly ips list -a my-openclaw

# パブリック IP を解放します
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 今後のデプロイでパブリック IP が再割り当てされないように、プライベート設定に切り替えます
# ([http_service] を削除するか、プライベートテンプレートを使用してデプロイします)
fly deploy -c fly.private.toml

# プライベート専用の IPv6 を割り当てます
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list` は `private` タイプの IP のみを表示するはずです:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### プライベートデプロイメントへのアクセス

パブリック URL がないため、以下のいずれかの方法を使用します:

**オプション 1: ローカルプロキシ (最も簡単)**

```bash
# ローカルポート 3000 をアプリに転送します
fly proxy 3000:3000 -a my-openclaw

# その後、ブラウザで http://localhost:3000 を開きます
```

**オプション 2: WireGuard VPN**

```bash
# WireGuard 設定を作成します (1 回限り)
fly wireguard create

# WireGuard クライアントにインポートし、内部 IPv6 経由でアクセスします
# 例: http://[fdaa:x:x:x:x::x]:3000
```

**オプション 3: SSH のみ**

```bash
fly ssh console -a my-openclaw
```

### プライベートデプロイメントでの webhook

パブリックに公開せずに Webhook コールバック (Twilio、Telnyx など) が必要な場合:

1. **ngrok トンネル** - コンテナ内またはサイドカーとして ngrok を実行します
2. **Tailscale Funnel** - Tailscale 経由で特定のパスを公開します
3. **アウトバウンドのみ** - 一部のプロバイダ (Twilio) は、Webhook なしでもアウトバウンド通話で問題なく機能します

ngrok を使用した voice-call 設定の例:

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio",
          "tunnel": { "provider": "ngrok" },
          "webhookSecurity": {
            "allowedHosts": ["example.ngrok.app"]
          }
        }
      }
    }
  }
}
```

ngrok トンネルはコンテナ内で実行され、Fly アプリ自体を公開することなくパブリックな Webhook URL を提供します。転送されたホストヘッダーが受け入れられるように、`webhookSecurity.allowedHosts` をパブリックなトンネルのホスト名に設定してください。

### セキュリティ上の利点

| 側面                     | パブリック | プライベート |
| ------------------------ | ---------- | ------------ |
| インターネットスキャナー | 発見可能   | 隠蔽         |
| 直接攻撃                 | 可能       | ブロック     |
| Control UI アクセス      | ブラウザ   | プロキシ/VPN |
| Webhook の配信           | 直接       | トンネル経由 |

## 備考

- Fly.io は **x86 アーキテクチャ** を使用します (ARM ではありません)。
- Dockerfile は両方のアーキテクチャと互換性があります。
- WhatsApp/Telegram のオンボーディングには、`fly ssh console` を使用します。
- 永続データは `/data` のボリューム上にあります。
- Signal には Java + signal-cli が必要です。カスタムイメージを使用し、メモリを 2GB 以上に保ってください。

## コスト

推奨される設定 (`shared-cpu-2x`、2GB RAM) の場合:

- 使用量に応じて月額約 10〜15 ドル
- 無料枠には一定の余裕が含まれています

詳細については、[Fly.io の価格](https://fly.io/docs/about/pricing/)を参照してください。
