---
summary: "ゲートウェイ認証を信頼できるリバース プロキシ (Pomerium、Caddy、nginx + OAuth) に委任します。"
read_when:
  - ID 認識プロキシの背後で OpenClaw を実行する
  - OpenClaw の前で OAuth を使用して Pomerium、Caddy、または nginx をセットアップする
  - リバース プロキシ設定による WebSocket 1008 の未承認エラーの修正
  - HSTS およびその他の HTTP 強化ヘッダーを設定する場所の決定
x-i18n:
  source_hash: "99cd59e634d2b7b5fe8244192e082101e2bf460678367da735eea13632c9d922"
---

# 信頼できるプロキシ認証

> ⚠️ **セキュリティに配慮した機能。** このモードは認証を完全にリバース プロキシに委任します。設定を誤ると、ゲートウェイが不正アクセスにさらされる可能性があります。有効にする前に、このページをよく読んでください。

## いつ使用するか

次の場合に `trusted-proxy` 認証モードを使用します。

- **アイデンティティ認識プロキシ**の背後で OpenClaw を実行している (Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + フォワード認証)
- プロキシがすべての認証を処理し、ヘッダー経由でユーザー ID を渡します
- プロキシがゲートウェイへの唯一のパスである Kubernetes またはコンテナ環境にいます。
- ブラウザが WS ペイロードでトークンを渡すことができないため、WebSocket `1008 unauthorized` エラーが発生します。

## 使用しない場合

- プロキシがユーザーを認証しない場合 (単なる TLS ターミネーターまたはロード バランサー)
- プロキシをバイパスするゲートウェイへのパスがある場合 (ファイアウォールのホール、内部ネットワーク アクセス)
- プロキシが転送されたヘッダーを正しく削除/上書きしているかどうか不明な場合
- 個人のシングルユーザー アクセスのみが必要な場合 (セットアップを簡素化するには、Tailscale Serve + ループバックを検討してください)

## 仕組み1. リバース プロキシはユーザーを認証します (OAuth、OIDC、SAML など)

2. プロキシは、認証されたユーザー ID を含むヘッダーを追加します (例: `x-forwarded-user: nick@example.com`)。
3. OpenClaw は、リクエストが **信頼できるプロキシ IP** (`gateway.trustedProxies` で構成) からのものであることを確認します。
4. OpenClaw は、設定されたヘッダーからユーザー ID を抽出します
5. すべてがチェックアウトされると、リクエストは承認されます。

## UI ペアリング動作の制御

`gateway.auth.mode = "trusted-proxy"` がアクティブでリクエストが成功した場合
信頼できるプロキシ チェック、コントロール UI WebSocket セッションはデバイスなしで接続可能
ペアリングのアイデンティティ。

影響:

- このモードでは、ペアリングはコントロール UI アクセスの主なゲートではなくなりました。
- リバース プロキシ認証ポリシーと `allowUsers` が効果的なアクセス制御になります。
- ゲートウェイのイングレスを信頼できるプロキシ IP のみにロックしておきます (`gateway.trustedProxies` + ファイアウォール)。

## 構成

```json5
{
  gateway: {
    // Use loopback for same-host proxy setups; use lan/custom for remote proxy hosts
    bind: "loopback",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

`gateway.bind` が `loopback` の場合、ループバック プロキシ アドレスを含めます
`gateway.trustedProxies` (`127.0.0.1`、`::1`、または同等のループバック CIDR)。

### 構成リファレンス|フィールド |必須 |説明 |

| ------------------------------------------ | -------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies` |はい |信頼するプロキシ IP アドレスの配列。他の IP からのリクエストは拒否されます。 |
| `gateway.auth.mode` |はい | `"trusted-proxy"` である必要があります |
| `gateway.auth.trustedProxy.userHeader` |はい |認証されたユーザー ID を含むヘッダー名 |
| `gateway.auth.trustedProxy.requiredHeaders` |いいえ |リクエストが信頼されるために存在する必要がある追加のヘッダー |
| `gateway.auth.trustedProxy.allowUsers` |いいえ |ユーザー ID の許可リスト。空は、認証されたすべてのユーザーを許可することを意味します。 |

## TLS 終端と HSTS

1 つの TLS 終端ポイントを使用し、そこに HSTS を適用します。

### 推奨パターン: プロキシ TLS 終端

リバース プロキシが `https://control.example.com` の HTTPS を処理する場合、次のように設定します。
`Strict-Transport-Security` はそのドメインのプロキシにあります。

- インターネットに接続された展開に適しています。
- 証明書と HTTP 強化ポリシーを 1 か所に保管します。
- OpenClaw は、プロキシの背後でループバック HTTP に留まることができます。

ヘッダー値の例:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### ゲートウェイ TLS 終端OpenClaw 自体が HTTPS を直接提供する場合 (TLS 終端プロキシなし)、次のように設定します

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

`strictTransportSecurity` は文字列ヘッダー値を受け入れるか、明示的に無効にする場合は `false` を受け入れます。

### 展開ガイダンス

- トラフィックを検証する際は、最初に短い最大経過時間 (`max-age=300` など) から開始します。
- 信頼性が高くなってからのみ、長期間の値 (`max-age=31536000` など) に増加します。
- すべてのサブドメインが HTTPS 対応である場合にのみ、`includeSubDomains` を追加します。
- 完全なドメイン セットのプリロード要件を意図的に満たす場合にのみ、プリロードを使用します。
- ループバックのみのローカル開発では HSTS のメリットが得られません。

## プロキシ設定の例

### ポメリウム

Pomerium は、`x-pomerium-claim-email` (または他のクレーム ヘッダー) で ID を渡し、`x-pomerium-jwt-assertion` で JWT を渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium's IP
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

Pomerium 構成スニペット:

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

### OAuth を使用したキャディ

`caddy-security` プラグインを備えた Caddy は、ユーザーを認証し、ID ヘッダーを渡すことができます。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // Caddy's IP (if on same host)
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

キャディファイルのスニペット:

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

oauth2-proxy はユーザーを認証し、`x-auth-request-email` で ID を渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx 設定スニペット:

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

### 転送認証を使用した Traefik

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik container IP
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

信頼できるプロキシ認証を有効にする前に、次のことを確認してください。- [ ] **プロキシが唯一のパス**: ゲートウェイ ポートはプロキシ以外のすべてからファイアウォールで保護されています

- [ ] **trustedProxies は最小限です**: サブネット全体ではなく、実際のプロキシ IP のみ
- [ ] **プロキシはヘッダーを削除します**: プロキシはクライアントからの `x-forwarded-*` ヘッダーを上書きします (追加はしません)。
- [ ] **TLS 終了**: プロキシは TLS を処理します。ユーザーはHTTPS経由で接続します
- [ ] **allowUsers が設定されています** (推奨): 認証されたユーザーを許可するのではなく、既知のユーザーに制限します

## セキュリティ監査

`openclaw security audit` は、信頼できるプロキシ認証に **重大** の重大度の検出結果を示すフラグを立てます。これは意図的なもので、プロキシ設定にセキュリティを委任していることを思い出させるものです。

監査では次のことがチェックされます。

- `trustedProxies` 構成がありません
- `userHeader` 構成がありません
- 空の `allowUsers` (認証されたユーザーを許可)

## トラブルシューティング

### "trusted_proxy_untrusted_source"

リクエストは `gateway.trustedProxies` の IP から送信されたものではありません。確認してください:

- プロキシ IP は正しいですか? (Docker コンテナの IP は変更される可能性があります)
- プロキシの前にロード バランサーはありますか?
- `docker inspect` または `kubectl get pods -o wide` を使用して実際の IP を検索します

### "trusted_proxy_user_missing"

ユーザーヘッダーが空か欠落していました。確認してください:

- プロキシは ID ヘッダーを渡すように構成されていますか?
- ヘッダー名は正しいですか? (大文字と小文字は区別されませんが、スペルは重要です)
- ユーザーは実際にプロキシで認証されていますか?### "trusted*proxy_missing_header*\*"

必要なヘッダーが存在しませんでした。確認してください:

- 特定のヘッダーのプロキシ構成
- チェーン内のどこかでヘッダーが削除されているかどうか

### "trusted_proxy_user_not_allowed"

ユーザーは認証されていますが、`allowUsers` では認証されていません。それらを追加するか、ホワイトリストを削除してください。

### WebSocket が依然として失敗する

プロキシを確認してください:

- WebSocket アップグレードのサポート (`Upgrade: websocket`、`Connection: upgrade`)
- WebSocket アップグレード要求 (HTTP だけでなく) に ID ヘッダーを渡します。
- WebSocket 接続用の個別の認証パスがありません

## トークン認証からの移行

トークン認証から信頼できるプロキシに移行する場合:

1. ユーザーを認証してヘッダーを渡すようにプロキシを構成する
2. プロキシ設定を個別にテストします (ヘッダー付きカール)
3. 信頼できるプロキシ認証を使用して OpenClaw 構成を更新します
4. ゲートウェイを再起動します
5. コントロール UI から WebSocket 接続をテストする
6. `openclaw security audit` を実行し、結果を確認します

## 関連

- [セキュリティ](/gateway/security) — 完全なセキュリティ ガイド
- [構成](/gateway/configuration) — 構成リファレンス
- [リモート アクセス](/gateway/remote) — 他のリモート アクセス パターン
- [Tailscale](/gateway/tailscale) — テールネットのみのアクセスのためのより簡単な代替手段
