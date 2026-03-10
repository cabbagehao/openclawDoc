---
summary: "ゲートウェイ ダッシュボード用の統合されたテールスケール サーブ/ファネル"
read_when:
  - ゲートウェイ コントロール UI をローカルホストの外部に公開する
  - テールネットまたはパブリック ダッシュボード アクセスの自動化
title: "テールスケール"
x-i18n:
  source_hash: "30c91f2ca5ab6aef19fbb166c170673020ce1c4e308a6abd6724774a5e595e9c"
---

# Tailscale (ゲートウェイ ダッシュボード)

OpenClaw は、Tailscale **Serve** (テールネット) または **Funnel** (パブリック) を自動構成できます。
ゲートウェイ ダッシュボードと WebSocket ポート。これにより、ゲートウェイはループバックにバインドされたままになります。
Tailscale は、HTTPS、ルーティング、および (Serve 用の) ID ヘッダーを提供します。

## モード

- `serve`: `tailscale serve` 経由でテールネットのみのサービスを提供します。ゲートウェイは `127.0.0.1` のままです。
- `funnel`: `tailscale funnel` 経由のパブリック HTTPS。 OpenClaw には共有パスワードが必要です。
- `off`: デフォルト (テールスケール自動化なし)。

## 認証

`gateway.auth.mode` を設定してハンドシェイクを制御します。

- `token` (`OPENCLAW_GATEWAY_TOKEN` が設定されている場合のデフォルト)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` または構成による共有秘密)`tailscale.mode = "serve"` および `gateway.auth.allowTailscale` が `true` の場合、
  コントロール UI/WebSocket 認証では Tailscale ID ヘッダーを使用できます
  (`tailscale-user-login`) トークン/パスワードを指定せずに。 OpenClaw は検証します
  ローカルの Tailscale 経由で `x-forwarded-for` アドレスを解決することによる ID
  デーモン (`tailscale whois`) を受け取り、それを受け入れる前にヘッダーと照合します。
  OpenClaw は、リクエストがループバックから到着した場合にのみ、リクエストをサービスとして扱います。
  Tailscale の `x-forwarded-for`、`x-forwarded-proto`、および `x-forwarded-host`
  ヘッダー。
  HTTP API エンドポイント (例: `/v1/*`、`/tools/invoke`、`/api/channels/*`)
  依然としてトークン/パスワード認証が必要です。
  このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。信頼できないローカルコードの場合
  同じホスト上で実行できる場合は、`gateway.auth.allowTailscale` を無効にし、次のことが必要です
  代わりにトークン/パスワード認証を使用します。
  明示的な認証情報を要求するには、`gateway.auth.allowTailscale: false` を設定するか、
  `gateway.auth.mode: "password"` を強制します。

## 構成例

### テールネットのみ (サービス)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く: `https://<magicdns>/` (または構成された `gateway.controlUi.basePath`)

### テールネットのみ (テールネット IP にバインド)

これは、ゲートウェイがテールネット IP (サーブ/ファンネルなし) で直接リッスンするようにする場合に使用します。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別のテールネット デバイスから接続します。

- コントロール UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

注: ループバック (`http://127.0.0.1:18789`) は、このモードでは機能しません\*\*。

### パブリック インターネット (ファネル + 共有パスワード)

````json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```パスワードをディスクにコミットするよりも、`OPENCLAW_GATEWAY_PASSWORD` を優先します。

## CLI の例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
````

## 注意事項

- Tailscale Serve/Funnel では、`tailscale` CLI をインストールしてログインする必要があります。
- `tailscale.mode: "funnel"` は、公開を避けるために認証モードが `password` でない限り起動を拒否します。
- OpenClaw で `tailscale serve` を元に戻す場合は、`gateway.tailscale.resetOnExit` を設定します。
  またはシャットダウン時の `tailscale funnel` 構成。
- `gateway.bind: "tailnet"` は、直接テールネット バインドです (HTTPS なし、サーブ/ファネルなし)。
- `gateway.bind: "auto"` はループバックを好みます。テールネットのみが必要な場合は、`tailnet` を使用してください。
- サーブ/ファネルは **ゲートウェイ コントロール UI + WS** のみを公開します。ノードは接続します
  同じ Gateway WS エンドポイントなので、Serve はノード アクセスに機能します。

## ブラウザ制御 (リモートゲートウェイ + ローカルブラウザ)

あるマシンでゲートウェイを実行しているが、別のマシンでブラウザを駆動したい場合は、
ブラウザ マシン上で **ノード ホスト**を実行し、両方を同じテールネット上に維持します。
ゲートウェイはブラウザーのアクションをノードにプロキシします。別個の制御サーバーやサービス URL は必要ありません。

ブラウザ制御用のファネルは避けてください。ノードのペアリングをオペレーターアクセスと同様に扱います。

## テールスケールの前提条件と制限- サービスには、テールネットで HTTPS が有効になっている必要があります。欠落している場合は、CLI からプロンプトが表示されます

- Serve は Tailscale ID ヘッダーを挿入します。ファンネルはそうではありません。
- ファネルには、Tailscale v1.38.3+、MagicDNS、有効な HTTPS、およびファネル ノード属性が必要です。
- ファネルは、TLS 経由でポート `443`、`8443`、および `10000` のみをサポートします。
- macOS 上の Funnel には、オープンソースの Tailscale アプリのバリアントが必要です。

## 詳細はこちら

- Tailscale サーブの概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel の概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
