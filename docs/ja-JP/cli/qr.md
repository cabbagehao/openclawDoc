---
summary: "「openclaw qr」の CLI リファレンス (iOS ペアリング QR + セットアップ コードの生成)"
read_when:
  - iOS アプリをゲートウェイとすばやくペアリングしたい
  - リモート/手動共有にはセットアップコード出力が必要です
title: "qr"
x-i18n:
  source_hash: "1ca1f1bd3812f105a7fd62d90004ecbdeeaa5894470e6d981e4fc7534157c1d6"
---

# `openclaw qr`

現在のゲートウェイ構成から iOS ペアリング QR とセットアップ コードを生成します。

## 使用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws --token '<token>'
```

## オプション

- `--remote`: `gateway.remote.url` と構成からのリモート トークン/パスワードを使用します
- `--url <url>`: ペイロードで使用されるゲートウェイ URL を上書きします
- `--public-url <url>`: ペイロードで使用されるパブリック URL をオーバーライドします。
- `--token <token>`: ペイロードのゲートウェイ トークンを上書きします
- `--password <password>`: ペイロードのゲートウェイ パスワードを上書きします
- `--setup-code-only`: セットアップ コードのみを出力します
- `--no-ascii`: ASCII QR レンダリングをスキップします
- `--json`: JSON を出力します (`setupCode`、`gatewayUrl`、`auth`、`urlSource`)

## 注意事項- `--token` と `--password` は相互に排他的です

- `--remote` では、事実上アクティブなリモート資格情報が SecretRef として構成されており、`--token` または `--password` を渡さない場合、コマンドはアクティブなゲートウェイ スナップショットからそれらを解決します。ゲートウェイが使用できない場合、コマンドはすぐに失敗します。
- `--remote` がない場合、CLI 認証オーバーライドが渡されない場合、ローカル ゲートウェイ認証 SecretRef は解決されます。
  - `gateway.auth.token` は、トークン認証が勝てる場合に解決されます (明示的な `gateway.auth.mode="token"` またはパスワード ソースが勝てない推論モード)。
  - `gateway.auth.password` は、パスワード認証が勝利できる場合に解決されます (明示的な `gateway.auth.mode="password"` または auth/env からの勝利トークンのない推論モード)。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され (SecretRefs を含む)、`gateway.auth.mode` が設定されていない場合、モードが明示的に設定されるまでセットアップ コードの解決は失敗します。
- ゲートウェイのバージョンに関する注意: このコマンド パスには、`secrets.resolve` をサポートするゲートウェイが必要です。古いゲートウェイは、不明なメソッドのエラーを返します。
- スキャン後、次のデバイスとのペアリングを承認します。
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
