---
summary: "Linux support と companion app の現状"
read_when:
  - Linux companion app の状況を確認したいとき
  - platform coverage や contribution を検討するとき
title: "Linux App"
x-i18n:
  source_hash: "93b8250cd1267004a3342c8119462d0442af96704f9b3be250d8ee1eeeb7d4cd"
---

# Linux App

Gateway は Linux で完全サポートされています。**推奨ランタイムは Node** です。Bun は Gateway には推奨されません（WhatsApp / Telegram 周りに既知の不具合があります）。

native Linux companion app は今後対応予定です。構築に協力したい場合は contribution を歓迎します。

## 初学者向けクイックパス（VPS）

1. Node 22+ をインストールする
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 手元の laptop から `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>` を実行する
5. `http://127.0.0.1:18789/` を開き、token を貼り付ける

手順付きの VPS ガイドは [exe.dev](/install/exe-dev) を参照してください。

## インストール

- [Getting Started](/start/getting-started)
- [Install & updates](/install/updating)
- 任意のフロー: [Bun (experimental)](/install/bun)、[Nix](/install/nix)、[Docker](/install/docker)

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Gateway service のインストール（CLI）

次のいずれかを使います。

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

prompt が出たら **Gateway service** を選択してください。

修復 / 移行:

```
openclaw doctor
```

## system 制御（systemd user unit）

OpenClaw はデフォルトで systemd の **user** service としてインストールされます。共有サーバーや常時稼働サーバーでは、必要に応じて **system** service を使ってください。完全な unit 例と運用ガイドは [Gateway runbook](/gateway) にあります。

最小構成:

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

有効化:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
