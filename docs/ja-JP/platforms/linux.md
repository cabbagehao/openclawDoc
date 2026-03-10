---
summary: "Linux サポート + コンパニオン アプリのステータス"
read_when:
  - Linux コンパニオン アプリのステータスを探しています
  - プラットフォームの対象範囲または貢献の計画
title: "Linux アプリ"
x-i18n:
  source_hash: "93b8250cd1267004a3342c8119462d0442af96704f9b3be250d8ee1eeeb7d4cd"
---

# Linux アプリ

ゲートウェイは Linux で完全にサポートされています。 **ノードは推奨ランタイムです**。
Bun はゲートウェイには推奨されません (WhatsApp/Telegram のバグ)。

ネイティブ Linux コンパニオン アプリも計画されています。構築を支援したい場合は、貢献を歓迎します。

## 初心者向けクイック パス (VPS)

1. ノード 22+ をインストールする
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. ラップトップから: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` を開いてトークンを貼り付けます

ステップバイステップの VPS ガイド: [exe.dev](/install/exe-dev)

## インストール

- [はじめに](/start/getting-started)
- [インストールとアップデート](/install/updating)
- オプションのフロー: [Bun (実験的)](/install/bun)、[Nix](/install/nix)、[Docker](/install/docker)

## ゲートウェイ

- [ゲートウェイ ランブック](/gateway)
- [構成](/gateway/configuration)

## ゲートウェイ サービスのインストール (CLI)

次のいずれかを使用します。

```
openclaw onboard --install-daemon
```

または:

```
openclaw gateway install
```

または:

```
openclaw configure
```

プロンプトが表示されたら、**ゲートウェイ サービス** を選択します。

修復/移行:

```
openclaw doctor
```

## システム制御 (systemd ユーザーユニット)

OpenClaw は、デフォルトで systemd **user** サービスをインストールします。 **システム**を使用する
共有サーバーまたは常時接続サーバー用のサービス。完全な単元の例とガイダンス
[ゲートウェイ Runbook](/gateway) に存在します。

最小限のセットアップ:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` を作成します。

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

有効にします:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
