---
summary: "Gateway Webサーフェス: Control UI、バインドモード、セキュリティ"
read_when:
  - Tailscale経由でGatewayにアクセスしたい場合
  - ブラウザControl UIと設定編集が必要な場合
title: "Web"
seoTitle: "OpenClaw Web画面一覧とダッシュボード・チャットの使い分けガイド"
description: "機能はControl UIにあります。このページはバインドモード、セキュリティ、Web向けサーフェスに焦点を当てています。Webhooks、設定（デフォルトで有効）、Tailscaleアクセスを確認できます。"
---
Gatewayは、Gateway WebSocketと同じポートから小さな**ブラウザControl UI**（Vite + Lit）を提供します:

- デフォルト: `http://<host>:18789/`
- オプションのプレフィックス: `gateway.controlUi.basePath`を設定（例: `/openclaw`）

機能は[Control UI](/web/control-ui)にあります。
このページはバインドモード、セキュリティ、Web向けサーフェスに焦点を当てています。

## Webhooks

`hooks.enabled=true`の場合、Gatewayは同じHTTPサーバー上に小さなウェブフックエンドポイントも公開します。
認証とペイロードについては[Gateway設定](/gateway/configuration) → `hooks`を参照してください。

## 設定（デフォルトで有効）

Control UIはアセットが存在する場合（`dist/control-ui`）、**デフォルトで有効**です。
設定で制御できます:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePathはオプション
  },
}
```

## Tailscaleアクセス

### 統合Serve（推奨）

Gatewayをloopback上に保持し、Tailscale Serveにプロキシさせます:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

次にgatewayを起動:

```bash
openclaw gateway
```

開く:

- `https://<magicdns>/`（または設定した`gateway.controlUi.basePath`）

### Tailnetバインド + トークン

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

次にgatewayを起動（非loopbackバインドにはトークンが必要）:

```bash
openclaw gateway
```

開く:

- `http://<tailscale-ip>:18789/`（または設定した`gateway.controlUi.basePath`）

### パブリックインターネット（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // またはOPENCLAW_GATEWAY_PASSWORD
  },
}
```

## セキュリティ注意事項

- Gateway認証はデフォルトで必要（トークン/パスワードまたはTailscale IDヘッダー）
- 非loopbackバインドでも共有トークン/パスワード（`gateway.auth`または環境変数）が**必要**
- ウィザードはデフォルトでgatewayトークンを生成（loopback上でも）
- UIは`connect.params.auth.token`または`connect.params.auth.password`を送信
- 非loopback Control UIデプロイメントの場合、`gateway.controlUi.allowedOrigins`を明示的に設定（完全なオリジン）。これがないと、gatewayの起動はデフォルトで拒否されます
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`はHostヘッダーオリジンフォールバックモードを有効にしますが、危険なセキュリティダウングレードです
- Serveの場合、`gateway.auth.allowTailscale`が`true`の場合、Tailscale IDヘッダーがControl UI/WebSocket認証を満たすことができます（トークン/パスワード不要）。HTTP APIエンドポイントは依然としてトークン/パスワードが必要です。明示的な認証情報を要求するには`gateway.auth.allowTailscale: false`を設定してください。[Tailscale](/gateway/tailscale)と[セキュリティ](/gateway/security)を参照してください。このトークンレスフローは、gatewayホストが信頼されていることを前提としています
- `gateway.tailscale.mode: "funnel"`には`gateway.auth.mode: "password"`（共有パスワード）が必要

## UIのビルド

Gatewayは`dist/control-ui`から静的ファイルを提供します。以下でビルド:

```bash
pnpm ui:build # 初回実行時にUI依存関係を自動インストール
```
