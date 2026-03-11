---
summary: "`openclaw dashboard` の CLI リファレンス (コントロール UI を開く)"
read_when:
  - 現在の認証情報を使用してコントロール UI を開きたい場合
  - ブラウザを起動せずに URL のみを表示したい場合
title: "dashboard"
x-i18n:
  source_hash: "a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94"
---

# `openclaw dashboard`

現在の認証情報を使用してコントロール UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

補足事項:

* `dashboard` コマンドは、可能であれば構成された `gateway.auth.token` 用の SecretRef を解決します。
* SecretRef で管理されたトークンの場合（解決済み・未解決を問わず）、ターミナルの出力やクリップボードの履歴、ブラウザの起動引数に外部シークレットが露出するのを避けるため、トークンを含まない URL を表示/コピー/展開します。
* `gateway.auth.token` が SecretRef で管理されており、現在のパスで解決できない場合、コマンドは無効なトークンのプレースホルダーを埋め込むのではなく、トークンを含まない URL と具体的な解決策を表示します。
