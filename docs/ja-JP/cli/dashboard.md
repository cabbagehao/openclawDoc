---
summary: "「openclaw ダッシュボード」の CLI リファレンス (コントロール UI を開きます)"
read_when:
  - 現在のトークンを使用してコントロール UI を開きたい
  - ブラウザを起動せずにURLを印刷したい
title: "ダッシュボード"
x-i18n:
  source_hash: "a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94"
---

# `openclaw dashboard`

現在の認証を使用してコントロール UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注:

- `dashboard` は、可能な場合、構成された `gateway.auth.token` SecretRef を解決します。
- SecretRef 管理のトークン (解決済みまたは未解決) の場合、`dashboard` は、端末出力、クリップボード履歴、またはブラウザー起動引数で外部シークレットが公開されるのを避けるために、トークン化されていない URL を印刷/コピー/開きます。
- `gateway.auth.token` が SecretRef で管理されているが、このコマンド パスで未解決の場合、コマンドは無効なトークン プレースホルダーを埋め込む代わりに、トークン化されていない URL と明示的な修復ガイダンスを出力します。
