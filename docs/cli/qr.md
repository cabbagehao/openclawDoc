---
summary: "`openclaw qr` の CLI リファレンス (iOS ペアリング用 QR コードとセットアップコードの生成)"
read_when:
  - iOS アプリをゲートウェイと素早くペアリングしたい場合
  - リモート環境や手動共有のためにセットアップコードを表示したい場合
title: "qr"
seoTitle: "OpenClaw CLI: openclaw qr コマンドの使い方と主要オプション・実行例"
description: "現在のゲートウェイ構成に基づいて、iOS アプリのペアリング用 QR コードとセットアップコードを生成します。使用法、オプション、補足事項を確認できます。"
x-i18n:
  source_hash: "1ca1f1bd3812f105a7fd62d90004ecbdeeaa5894470e6d981e4fc7534157c1d6"
---
現在のゲートウェイ構成に基づいて、iOS アプリのペアリング用 QR コードとセットアップコードを生成します。

## 使用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws --token '<token>'
```

## オプション

- `--remote`: 構成ファイル内の `gateway.remote.url` およびリモート用トークン/パスワードを使用します。
- `--url <url>`: ペイロードに含めるゲートウェイ URL を上書きします。
- `--public-url <url>`: ペイロードに含めるパブリック URL を上書きします。
- `--token <token>`: ペイロードに使用するゲートウェイのトークンを上書きします。
- `--password <password>`: ペイロードに使用するゲートウェイのパスワードを上書きします。
- `--setup-code-only`: セットアップコードのみを表示します。
- `--no-ascii`: ターミナルへの ASCII アートによる QR コード表示をスキップします。
- `--json`: `setupCode`, `gatewayUrl`, `auth`, `urlSource` を含む JSON 形式で出力します。

## 補足事項

- `--token` と `--password` は同時には指定できません。
- `--remote` を指定し、かつ有効なリモート認証情報が SecretRef として構成されている場合、CLI 上でトークンやパスワードを直接指定しなければ、稼働中のゲートウェイのスナップショットから値が解決されます。ゲートウェイが利用できない場合は即座にエラーとなります。
- `--remote` を指定しない場合、CLI での認証情報上書きがなければ、ローカルゲートウェイの認証用 SecretRef が解決されます:
  - `gateway.auth.token` は、トークン認証が有効（明示的に `gateway.auth.mode="token"` が設定されているか、他のパスワードソースがない場合）であれば解決されます。
  - `gateway.auth.password` は、パスワード認証が有効（明示的に `gateway.auth.mode="password"` が設定されているか、有効なトークンがない場合）であれば解決されます。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成（SecretRef を含む）されており、かつ `gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでセットアップコードの解決は行われません。
- ゲートウェイのバージョンに関する注意: このパスを使用するには、`secrets.resolve` メソッドをサポートするゲートウェイが必要です。古いバージョンのゲートウェイでは、メソッド未定義エラーが返されます。
- QR コードをスキャンした後は、以下のコマンドでデバイスのペアリングを承認してください:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
