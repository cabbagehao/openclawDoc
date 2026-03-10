---
summary: "1 つのホスト上で複数の OpenClaw ゲートウェイを実行 (分離、ポート、プロファイル)"
read_when:
  - 同じマシン上で複数のゲートウェイを実行する
  - ゲートウェイごとに分離された構成/状態/ポートが必要です
title: "複数のゲートウェイ"
x-i18n:
  source_hash: "493bd45bc6939ae7328afcd0351ca7cb4c93c17b819e8ad0fdf0f0312bf9b639"
---

# 複数のゲートウェイ (同じホスト)

1 つのゲートウェイで複数のメッセージング接続とエージェントを処理できるため、ほとんどのセットアップでは 1 つのゲートウェイを使用する必要があります。より強力な分離または冗長性 (レスキュー ボットなど) が必要な場合は、分離されたプロファイル/ポートを使用して別のゲートウェイを実行します。

## 隔離チェックリスト (必須)

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの構成ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、認証情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとのワークスペース ルート
- `gateway.port` (または `--port`) — インスタンスごとに一意
- 派生ポート (ブラウザ/キャンバス) は重複してはなりません

これらを共有すると、構成の競合やポートの競合が発生します。

## 推奨: プロファイル (`--profile`)

自動スコープ `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` とサフィックス サービス名をプロファイルします。

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

プロファイルごとのサービス:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## レスキューボット ガイド

同じホスト上で 2 番目のゲートウェイを独自のゲートウェイで実行します。

- プロファイル/設定
- 状態ディレクトリ
- ワークスペース
- ベースポート (および派生ポート)

これにより、レスキュー ボットがメイン ボットから隔離された状態に保たれるため、プライマリ ボットがダウンした場合でも、レスキュー ボットはデバッグしたり、構成の変更を適用したりできます。

ポート間隔: 派生ブラウザ/キャンバス/CDP ポートが衝突しないように、ベース ポート間に少なくとも 20 のポートを残します。

### インストール方法（レスキューボット）

```bash
# Main bot (existing or fresh, without --profile param)
# Runs on port 18789 + Chrome CDC/Canvas/... Ports
openclaw onboard
openclaw gateway install

# Rescue bot (isolated profile + ports)
openclaw --profile rescue onboard
# Notes:
# - workspace name will be postfixed with -rescue per default
# - Port should be at least 18789 + 20 Ports,
#   better choose completely different base port, like 19789,
# - rest of the onboarding is the same as normal

# To install the service (if not happened automatically during onboarding)
openclaw --profile rescue gateway install
```

## ポートマッピング (派生)

ベースポート = `gateway.port` (または `OPENCLAW_GATEWAY_PORT` / `--port`)。- ブラウザ制御サービス ポート = ベース + 2 (ループバックのみ)

- キャンバス ホストはゲートウェイ HTTP サーバーで提供されます (`gateway.port` と同じポート)
- ブラウザ プロファイルの CDP ポートは `browser.controlPort + 9 .. + 108` から自動割り当てされます。

config または env でこれらのいずれかをオーバーライドする場合は、インスタンスごとにそれらを一意に保つ必要があります。

## ブラウザ/CDP のメモ (一般的なフットガン)

- `browser.cdpUrl` を複数のインスタンスで同じ値に固定しないでください\*\*。
- 各インスタンスには、独自のブラウザ制御ポートと CDP 範囲 (ゲートウェイ ポートから派生) が必要です。
- 明示的な CDP ポートが必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定します。
- リモート Chrome: `browser.profiles.<name>.cdpUrl` を使用します (プロファイルごと、インスタンスごと)。

## 手動環境の例

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
