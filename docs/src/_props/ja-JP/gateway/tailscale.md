---
summary: "ゲートウェイダッシュボードのための Tailscale Serve/Funnel の統合"
read_when:
  - ゲートウェイのControl UIをローカルホスト以外から公開する場合
  - テールネットやパブリックなダッシュボードアクセスを自動化する場合
title: "Tailscale"
---

# Tailscale (ゲートウェイダッシュボード)

OpenClawは、ゲートウェイダッシュボードおよびWebSocketポート向けに、Tailscale **Serve** (テールネット内公開) または **Funnel** (インターネット公開) を自動設定できます。これにより、ゲートウェイをループバック（`127.0.0.1`）にバインドしたまま、Tailscaleを介してHTTPS、ルーティング、および（Serveの場合は）IDヘッダーを利用できます。

## モード

* `serve`: `tailscale serve` を使用したテールネット限定の公開です。ゲートウェイは `127.0.0.1` で待機し続けます。
* `funnel`: `tailscale funnel` を使用したパブリックなHTTPS公開です。OpenClawでは共有パスワードの設定が必須となります。
* `off`: デフォルト（Tailscaleの自動設定を行いません）。

## 認証

`gateway.auth.mode` を設定して、ハンドシェイクを制御します。

* `token` (デフォルト：`OPENCLAW_GATEWAY_TOKEN` が設定されている場合)
* `password` (共有シークレット：`OPENCLAW_GATEWAY_PASSWORD` または設定ファイルで指定)

`tailscale.mode = "serve"` かつ `gateway.auth.allowTailscale` が `true` の場合、Control UIおよびWebSocketの認証にTailscale IDヘッダー（`tailscale-user-login`）を使用でき、トークンやパスワードの入力なしでログインが可能になります。OpenClawは、ローカルのTailscaleデーモン（`tailscale whois`）を介して `x-forwarded-for` アドレスを解決し、ヘッダーと照合することで、そのIDを検証します。OpenClawは、Tailscaleによって注入された `x-forwarded-for`、`x-forwarded-proto`、および `x-forwarded-host` ヘッダーを伴うループバックからのリクエストのみをServe経由として扱います。

HTTP APIエンドポイント（例：`/v1/*`、`/tools/invoke`、`/api/channels/*`）は、引き続きトークンまたはパスワードによる認証が必要です。

このトークンレスの認証フローは、ゲートウェイホストが信頼されていることを前提としています。もし同一ホスト上で信頼できないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale` を `false` に設定し、トークンまたはパスワード認証を必須にしてください。

明示的な認証情報を常に要求する場合は、`gateway.auth.allowTailscale: false` を設定するか、`gateway.auth.mode: "password"` を強制してください。

## 設定例

### テールネット限定 (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

アクセス先：`https://<magicdns>/` （または設定された `gateway.controlUi.basePath`）

### テールネット限定 (テールネットIPへのバインド)

ServeやFunnelを使用せず、ゲートウェイをテールネットIPで直接待機させたい場合に使用します。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別のテールネットデバイスからの接続：

* Control UI: `http://<tailscale-ip>:18789/`
* WebSocket: `ws://<tailscale-ip>:18789`

注：このモードでは、ループバック経由（`http://127.0.0.1:18789`）のアクセスは**機能しません**。

### インターネット公開 (Funnel + 共有パスワード)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "ここをパスワードに変更" },
  },
}
```

パスワードを直接ファイルに書き込むよりも、`OPENCLAW_GATEWAY_PASSWORD` 環境変数を使用することを推奨します。

## CLI の例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事項

* Tailscale Serve/Funnelを使用するには、`tailscale` CLIがインストールされ、ログイン済みである必要があります。
* 公開状態になるのを防ぐため、`tailscale.mode: "funnel"` は認証モードが `password` でない限り起動しません。
* シャットダウン時にOpenClawが `tailscale serve` または `tailscale funnel` の設定を解除するようにしたい場合は、`gateway.tailscale.resetOnExit` を設定してください。
* `gateway.bind: "tailnet"` は直接的なテールネットバインドであり、HTTPSやServe/Funnelは提供されません。
* `gateway.bind: "auto"` はループバックを優先します。テールネット限定にしたい場合は `tailnet` を明示してください。
* Serve/Funnelは、**ゲートウェイのControl UIおよびWebSocket**のみを公開します。ノードは同じゲートウェイWebSocketエンドポイントを介して接続するため、Serveはノードアクセスにも利用可能です。

## ブラウザ制御 (リモートゲートウェイ + ローカルブラウザ)

あるマシンでゲートウェイを実行し、別のマシンのブラウザを操作したい場合は、ブラウザが動作しているマシンで**ノードホスト**を実行し、両方を同じテールネット（Tailscale）に参加させてください。ゲートウェイはブラウザ操作をノードへプロキシします。個別の制御サーバーやServe用のURLは不要です。

ブラウザ制御にFunnelを使用することは避け、ノードのペアリングはオペレーター権限へのアクセスと同様に慎重に扱ってください。

## 前提条件と制限

* Serveを利用するには、テールネットでHTTPSが有効である必要があります。無効な場合、CLIからプロンプトが表示されます。
* ServeはTailscaleのIDヘッダーを注入しますが、Funnelは注入しません。
* Funnelを利用するには、Tailscale v1.38.3以降、MagicDNS、有効なHTTPS、およびFunnelノード属性が必要です。
* FunnelはTLS経由で `443`, `8443`, `10000` ポートのみをサポートします。
* macOSでのFunnel利用には、オープンソース版のTailscaleアプリが必要です。

## 詳細情報

* Tailscale Serve 概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
* `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
* Tailscale Funnel 概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
* `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
