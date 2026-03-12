---
summary: "同一ホスト上での複数の OpenClaw ゲートウェイの実行 (分離、ポート設定、およびプロファイル)"
read_when:
  - 同じマシン上で複数のゲートウェイを動作させたい場合
  - ゲートウェイごとに構成、状態、ポートを分離する必要がある場合
title: "マルチゲートウェイ"
x-i18n:
  source_hash: "493bd45bc6939ae7328afcd0351ca7cb4c93c17b819e8ad0fdf0f0312bf9b639"
---
OpenClaw は単一のゲートウェイで複数のメッセージング接続やエージェントを処理できるため、通常は 1 つのゲートウェイで十分です。より厳格な分離が必要な場合や、冗長性の確保（例: 救旧用のレスキューボットなど）を目的とする場合にのみ、プロファイルとポートを分けた個別のゲートウェイを起動してください。

## 分離のためのチェックリスト (必須)

インスタンスごとに以下を一意（ユニーク）にする必要があります:

- `OPENCLAW_CONFIG_PATH`: インスタンスごとの構成ファイル。
- `OPENCLAW_STATE_DIR`: インスタンスごとのセッション、認証情報、キャッシュ。
- `agents.defaults.workspace`: インスタンスごとのワークスペースルート。
- `gateway.port` (または `--port`): ゲートウェイごとのポート番号。
- **派生ポート**: ブラウザ制御や Canvas 用のポートが重複しないように注意してください。

これらが共有されていると、構成の書き込み競合やポートの衝突が発生します。

## 推奨: プロファイル機能 (`--profile`)

`--profile` フラグを使用すると、`OPENCLAW_STATE_DIR` と `OPENCLAW_CONFIG_PATH` のスコープが自動的に設定され、サービス名にもサフィックスが付与されます。

```bash
# メイン (main)
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# レスキュー (rescue)
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

プロファイルごとのサービス管理:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## レスキューボット（救旧用）の導入ガイド

メインのボットが停止した際のデバッグや構成変更の適用を目的として、独立した構成・状態・ワークスペース・ポートを持つ 2 つ目のゲートウェイを同じホスト上で実行します。

ポートの設定: 派生するブラウザ、Canvas、CDP 用のポートが衝突しないよう、ベースポートの間隔は少なくとも 20 以上空けるようにしてください。

### インストール手順 (レスキューボット)

```bash
# メインボット (既存の設定、または --profile 指定なし)
# ポート 18789 + 各種派生ポートで動作
openclaw onboard
openclaw gateway install

# レスキューボット (分離されたプロファイルとポート)
openclaw --profile rescue onboard
# 補足事項:
# - ワークスペース名の末尾にはデフォルトで -rescue が付与されます。
# - ポートは 18789 から 20 以上離してください（例: 19789 などの全く別の番号を推奨）。
# - その他のオンボーディング手順は通常と同じです。

# サービスのインストール (オンボーディング中に自動で行われなかった場合)
openclaw --profile rescue gateway install
```

## 派生ポートのマッピングルール

ベースポートを `gateway.port` (または `OPENCLAW_GATEWAY_PORT`, `--port`) とすると:

- ブラウザ制御サービスポート = ベースポート + 2 (ループバック限定)
- Canvas ホスト = ゲートウェイの HTTP サーバー上で動作 (ベースポートと同じ)
- ブラウザプロファイルの CDP ポート = `browser.controlPort + 9` から `+ 108` までの範囲で自動割り当て

構成ファイルや環境変数でこれらを上書きする場合は、インスタンス間で重複しないように手動で管理する必要があります。

## ブラウザ / CDP に関する注意点

- `browser.cdpUrl` を複数のインスタンスで同じ値に固定しないでください。
- 各インスタンスには、独自のブラウザ制御ポートと（ベースポートから派生した）CDP ポート範囲が必要です。
- CDP ポートを明示的に指定したい場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- リモートの Chrome を使用する場合: インスタンスごとのプロファイルに対して `browser.profiles.<name>.cdpUrl` を設定してください。

## 環境変数を手動で設定する例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## クイックチェック

```bash
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```
