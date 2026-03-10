---
summary: "リモートアクセスのために exe.dev (VM + HTTPS プロキシ) 上で OpenClaw Gateway を実行する"
read_when:
  - Gateway 用の安価な常時稼働 Linux ホストが必要な場合
  - 独自の VPS を実行せずにリモートの Control UI アクセスが必要な場合
title: "exe.dev"
---

# exe.dev

目標: exe.dev の VM 上で OpenClaw Gateway を実行し、ラップトップから `https://<vm-name>.exe.xyz` 経由でアクセスできるようにすること。

このページは、exe.dev のデフォルトである **exeuntu** イメージを前提としています。別のディストリビューションを選択した場合は、それに応じてパッケージを読み替えてください。

## 初心者向けのクイックパス

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 必要に応じて認証キー/トークンを入力します
3. VM の横にある「Agent」をクリックして待ちます...
4. ???
5. 完了

## 必要なもの

- exe.dev アカウント
- [exe.dev](https://exe.dev) 仮想マシンへの `ssh exe.dev` アクセス (オプション)

## Shelley を使用した自動インストール

[exe.dev](https://exe.dev) のエージェントである Shelley は、プロンプトを使用して OpenClaw を即座にインストールできます。使用されるプロンプトは以下のとおりです:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動インストール

## 1) VM を作成する

デバイスから:

```bash
ssh exe.dev new
```

次に接続します:

```bash
ssh <vm-name>.exe.xyz
```

ヒント: この VM を**ステートフル**に保ちます。OpenClaw は `~/.openclaw/` と `~/.openclaw/workspace/` の下に状態を保存します。

## 2) 前提条件のインストール (VM 上)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw のインストール

OpenClaw インストールスクリプトを実行します:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) OpenClaw をポート 8000 にプロキシするための nginx のセットアップ

`/etc/nginx/sites-enabled/default` を以下のように編集します:

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 5) OpenClaw へのアクセスと権限の付与

`https://<vm-name>.exe.xyz/` にアクセスします (オンボーディングからの Control UI の出力を参照)。認証を求められたら、VM 上の `gateway.auth.token` からトークンを貼り付けます (`openclaw config get gateway.auth.token` で取得するか、`openclaw doctor --generate-gateway-token` で生成します)。`openclaw devices list` と `openclaw devices approve <requestId>` を使用してデバイスを承認します。疑問がある場合は、ブラウザから Shelley を使用してください!

## リモートアクセス

リモートアクセスは [exe.dev](https://exe.dev) の認証によって処理されます。デフォルトでは、ポート 8000 からの HTTP トラフィックは電子メール認証を使用して `https://<vm-name>.exe.xyz` に転送されます。

## アップデート

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

ガイド: [アップデート](/install/updating)
