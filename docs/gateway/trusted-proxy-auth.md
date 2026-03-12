---
summary: "ゲートウェイの認証を、信頼できるリバースプロキシ（Pomerium, Caddy, nginx + OAuthなど）に委任する方法"
read_when:
  - ID認識プロキシの背後でOpenClawを運用する場合
  - OpenClawの前段にOAuthを適用したPomerium, Caddy, nginx等を設置する場合
  - リバースプロキシ環境でWebSocketの「1008 unauthorized」エラーを解消したい場合
  - HSTSやその他のHTTPセキュリティヘッダーの設定場所を検討している場合
title: "信頼されたプロキシ認証 (Trusted Proxy Auth)"
---
> ⚠️ **セキュリティ上の重要な機能です。** このモードでは、認証を完全にリバースプロキシに委任します。設定を誤ると、ゲートウェイが不正アクセスにさらされる可能性があります。有効化する前に、このページをよくお読みください。

## 使用すべきケース

以下のような場合に `trusted-proxy` 認証モードを使用します。

- OpenClawを **ID認識プロキシ (Identity-Aware Proxy)** （Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward authなど）の背後で実行している場合
- プロキシがすべての認証を処理し、ユーザーの識別情報をヘッダー経由で渡す場合
- Kubernetesやコンテナ環境において、プロキシがゲートウェイへの唯一の経路である場合
- ブラウザがWebSocketのペイロードでトークンを渡せないことが原因で、WebSocketの `1008 unauthorized` エラーが発生している場合

## 使用すべきではないケース

- プロキシがユーザー認証を行わない場合（単なるTLS終端やロードバランサーとして動作している場合）
- プロキシを経由せずにゲートウェイにアクセスできる経路（ファイアウォールの穴、内部ネットワークからの直接アクセスなど）がある場合
- プロキシがクライアントからのヘッダーを正しく削除・上書きしているか確信が持てない場合
- 個人のシングルユーザーアクセスのみが必要な場合（よりシンプルなセットアップとして、Tailscale Serve + loopback の使用を検討してください）

## 仕組み

1. リバースプロキシがユーザーを認証します（OAuth, OIDC, SAMLなど）。
2. プロキシは、認証されたユーザーの識別情報（例：`x-forwarded-user: nick@example.com`）を含むヘッダーを追加します。
3. OpenClawは、リクエストが **信頼できるプロキシのIPアドレス** （`gateway.trustedProxies` で設定）から送信されていることを確認します。
4. OpenClawは、設定されたヘッダーからユーザーの識別情報を抽出します。
5. すべての検証が成功すると、リクエストが認可されます。

## Control UI のペアリング挙動

`gateway.auth.mode = "trusted-proxy"` が有効で、リクエストが信頼されたプロキシの検証を通過した場合、Control UIのWebSocketセッションは、デバイスペアリングによる識別なしで接続できます。

このことによる影響：

- このモードでは、ペアリングはControl UIアクセスの主要なゲートウェイではなくなります。
- リバースプロキシの認証ポリシーと `allowUsers` 設定が、実質的なアクセス制御となります。
- ゲートウェイへの進入トラフィックは、信頼できるプロキシのIPのみに制限してください（`gateway.trustedProxies` + ファイアウォール）。

## 設定方法

```json5
{
  gateway: {
    // 同一ホスト上のプロキシの場合は loopback を、リモートプロキシの場合は lan/custom を使用します
    bind: "loopback",

    // 重要：プロキシのIPアドレスのみをここに記述してください
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 認証されたユーザーの識別情報を含むヘッダー（必須）
        userHeader: "x-forwarded-user",

        // オプション：存在が必須となるヘッダー（プロキシの検証用）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // オプション：特定のユーザーのみに制限（空の場合はすべての認証済みユーザーを許可）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

`gateway.bind` が `loopback` の場合、`gateway.trustedProxies` にループバック用のプロキシアドレス（`127.0.0.1`, `::1` または同等のループバックCIDR）を含める必要があります。

### 設定リファレンス

| フィールド | 必須 | 説明 |
| :--- | :--- | :--- |
| `gateway.trustedProxies` | はい | 信頼するプロキシのIPアドレスの配列。他のIPからのリクエストは拒否されます。 |
| `gateway.auth.mode` | はい | `"trusted-proxy"` を指定する必要があります。 |
| `gateway.auth.trustedProxy.userHeader` | はい | 認証されたユーザーの識別情報を含むヘッダー名。 |
| `gateway.auth.trustedProxy.requiredHeaders` | いいえ | リクエストを信頼するために存在が必須となる追加のヘッダー。 |
| `gateway.auth.trustedProxy.allowUsers` | いいえ | ユーザー識別情報の許可リスト。空の場合はすべての認証済みユーザーを許可します。 |

## TLS 終端と HSTS

TLSの終端ポイントは1箇所に絞り、そこでHSTSを適用してください。

### 推奨パターン：プロキシでのTLS終端

リバースプロキシが `https://control.example.com` のようなドメインでHTTPSを処理する場合、そのプロキシ側で `Strict-Transport-Security` を設定してください。

- インターネット公開デプロイに適しています。
- 証明書管理とHTTPのセキュリティ強化ポリシーを一箇所に集約できます。
- プロキシの背後にあるOpenClawは、ループバックのHTTPで待機させることができます。

ヘッダー値の例：

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### ゲートウェイでのTLS終端

OpenClaw自体が直接HTTPSを提供する（TLS終端プロキシがない）場合は、以下を設定します。

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` には文字列のヘッダー値を指定するか、明示的に無効にする場合は `false` を指定します。

### 導入時のガイドライン

- トラフィックの検証中は、まず短い有効期間（例：`max-age=300`）から始めてください。
- 十分な安全性が確認できてから、長期の有効期間（例：`max-age=31536000`）に延長してください。
- `includeSubDomains` を追加するのは、すべてのサブドメインがHTTPSに対応している場合のみにしてください。
- プリロード（preload）は、ドメイン全体でその要件を意図的に満たしている場合のみ使用してください。
- ループバックのみのローカル開発環境では、HSTSによるメリットはありません。

## プロキシ設定の例

### Pomerium

Pomeriumは `x-pomerium-claim-email` （またはその他のクレームヘッダー）で識別情報を渡し、`x-pomerium-jwt-assertion` でJWTを渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // PomeriumのIP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Pomeriumの設定スニペット：

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy (OAuth使用時)

`caddy-security` プラグインを使用したCaddyは、ユーザーを認証して識別情報ヘッダーを渡すことができます。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // 同一ホスト内のCaddyのIP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfileのスニペット：

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxyはユーザーを認証し、`x-auth-request-email` で識別情報を渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxyのIP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginxの設定スニペット：

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik (Forward Auth使用時)

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // TraefikコンテナのIP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## セキュリティチェックリスト

信頼されたプロキシ認証を有効にする前に、以下を確認してください。

- [ ] **経路の限定**: ゲートウェイのポートが、プロキシ以外からのアクセスをファイアウォールで遮断していること
- [ ] **trustedProxies の最小化**: サブネット全体ではなく、実際のプロキシIPのみを指定していること
- [ ] **プロキシによるヘッダーの制御**: プロキシがクライアントからの `x-forwarded-*` ヘッダーを（追加ではなく）上書きしていること
- [ ] **TLS終端**: プロキシがTLSを処理し、ユーザーがHTTPS経由で接続していること
- [ ] **allowUsers の設定（推奨）**: 認証された全員を許可するのではなく、既知のユーザーのみに制限していること

## セキュリティ監査

`openclaw security audit` は、信頼されたプロキシ認証が有効な場合に「クリティカル（critical）」な検出事項としてフラグを立てます。これは、セキュリティの責任をプロキシ設定に委任していることを再認識させるための意図的な挙動です。

監査では以下の項目がチェックされます。

- `trustedProxies` 設定の欠落
- `userHeader` 設定の欠落
- `allowUsers` が空（すべての認証済みユーザーを許可している状態）

## トラブルシューティング

### "trusted_proxy_untrusted_source"

リクエストが `gateway.trustedProxies` に含まれるIP以外から送信されました。以下を確認してください。

- プロキシのIPが正しいか（DockerコンテナのIPは変わる場合があります）
- プロキシの前段にロードバランサーがないか
- `docker inspect` や `kubectl get pods -o wide` を使用して実際のIPを確認してください

### "trusted_proxy_user_missing"

ユーザー識別情報のヘッダーが空、または欠落しています。以下を確認してください。

- プロキシが識別情報をヘッダーとして渡すように設定されているか
- ヘッダー名が正しいか（大文字小文字は区別されませんが、綴りに注意してください）
- ユーザーが実際にプロキシ側で認証されているか

### "trusted_proxy_missing_header_*"

必須ヘッダーが存在しません。以下を確認してください。

- プロキシ設定でそれらのヘッダーが正しく設定されているか
- 通信経路のどこかでヘッダーが削除されていないか

### "trusted_proxy_user_not_allowed"

ユーザーは認証されていますが、`allowUsers` に含まれていません。ユーザーを追加するか、許可リストを削除してください。

### WebSocket が依然として失敗する場合

プロキシが以下の条件を満たしているか確認してください。

- WebSocketのアップグレード（`Upgrade: websocket`, `Connection: upgrade`）をサポートしていること
- HTTPリクエストだけでなく、WebSocketアップグレードリクエストでも識別情報ヘッダーを渡していること
- WebSocket接続に対して、個別の認証経路が設定されていないこと

## トークン認証からの移行

トークン認証から信頼されたプロキシ認証へ移行する手順：

1. ユーザーを認証し、ヘッダーを渡すようにプロキシを設定する
2. プロキシ設定を単体でテストする（curlなどでヘッダーを確認）
3. OpenClawの設定を `trusted-proxy` 認証に更新する
4. ゲートウェイを再起動する
5. Control UIからWebSocket接続をテストする
6. `openclaw security audit` を実行し、内容を確認する

## 関連情報

- [セキュリティ](/gateway/security) — セキュリティガイド全般
- [設定](/gateway/configuration) — 設定リファレンス
- [リモートアクセス](/gateway/remote) — その他のリモートアクセスパターン
- [Tailscale](/gateway/tailscale) — テールネット限定アクセスのためのよりシンプルな代替案
