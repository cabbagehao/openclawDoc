---
summary: "リモートアクセス用に exe.dev（VM + HTTPS プロキシ）上で OpenClaw ゲートウェイを動かす"
read_when:
  - ゲートウェイ用に安価で常時稼働する Linux ホストがほしい
  - 自前の VPS を立てずにリモートの Control UI へアクセスしたい
title: "exe.dev"
---

# exe.dev

目的は、exe.dev の VM 上で OpenClaw ゲートウェイを動かし、手元の PC から `https://<vm-name>.exe.xyz` で到達できるようにすることです。

このページでは、exe.dev 既定の **exeuntu** イメージを前提にしています。別のディストリビューションを選んだ場合は、パッケージ名などを適宜読み替えてください。

## 初心者向けの最短ルート

1. [https://exe.new/openclaw](https://exe.new/openclaw) を開く
2. 必要に応じて認証キーやトークンを入力する
3. VM の横にある「Agent」をクリックして待つ
4. ???
5. 完了

## 必要なもの

* exe.dev アカウント
* [exe.dev](https://exe.dev) 仮想マシンへ `ssh exe.dev` できる環境（任意）

## Shelley を使った自動インストール

[exe.dev](https://exe.dev) のエージェントである Shelley は、次のプロンプトで OpenClaw をすぐにセットアップできます。

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動インストール

## 1) VM を作成

手元の端末から次を実行します。

```bash
ssh exe.dev new
```

その後、VM に接続します。

```bash
ssh <vm-name>.exe.xyz
```

補足: この VM は **stateful** のまま運用してください。OpenClaw は状態を `~/.openclaw/` と `~/.openclaw/workspace/` に保存します。

## 2) 前提パッケージをインストール（VM 上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw をインストール

OpenClaw のインストールスクリプトを実行します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) OpenClaw を port 8000 にプロキシする nginx を設定

`/etc/nginx/sites-enabled/default` を次の内容に編集します。

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

## 5) OpenClaw にアクセスして権限を付与

`https://<vm-name>.exe.xyz/` にアクセスします。URL はオンボーディング中に表示される Control UI の出力を参照してください。

認証を求められた場合は、VM 上の `gateway.auth.token` を貼り付けます。取得方法は次のいずれかです。

* `openclaw config get gateway.auth.token`
* `openclaw doctor --generate-gateway-token`

デバイス承認は `openclaw devices list` と `openclaw devices approve <requestId>` で行います。迷った場合は、ブラウザから Shelley を使う方法でも構いません。

## リモートアクセス

リモートアクセス自体は [exe.dev](https://exe.dev) 側の認証で保護されます。既定では、port 8000 に来た HTTP トラフィックが、メール認証付きで `https://<vm-name>.exe.xyz` へ転送されます。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

ガイド: [Updating](/install/updating)
