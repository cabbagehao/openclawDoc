---
summary: "Platform support の概要（Gateway + companion app）"
read_when:
  - OS ごとのサポート状況や install path を確認したいとき
  - Gateway をどこで動かすか決めたいとき
title: "Platforms"
x-i18n:
  source_hash: "653f395598b9558cb15b58ab42ed931dba47c70780be1c803d33dd795bad6503"
---

# Platforms

OpenClaw core は TypeScript 製で、**推奨ランタイムは Node** です。Bun は Gateway には推奨されません（WhatsApp / Telegram 周りに既知の不具合があります）。

companion app は macOS（menu bar app）と mobile node（iOS / Android）向けに提供されています。Windows と Linux の companion app は今後対応予定ですが、Gateway 自体はすでに完全サポートされています。Windows 向け native companion app も計画中で、Gateway は現時点では WSL2 経由の利用を推奨します。

## OS を選ぶ

* macOS: [macOS](/platforms/macos)
* iOS: [iOS](/platforms/ios)
* Android: [Android](/platforms/android)
* Windows: [Windows](/platforms/windows)
* Linux: [Linux](/platforms/linux)

## VPS とホスティング

* VPS hub: [VPS hosting](/vps)
* Fly.io: [Fly.io](/install/fly)
* Hetzner（Docker）: [Hetzner](/install/hetzner)
* GCP（Compute Engine）: [GCP](/install/gcp)
* exe.dev（VM + HTTPS proxy）: [exe.dev](/install/exe-dev)

## よく使うリンク

* install guide: [Getting Started](/start/getting-started)
* gateway runbook: [Gateway](/gateway)
* gateway configuration: [Configuration](/gateway/configuration)
* service status: `openclaw gateway status`

## Gateway service のインストール（CLI）

次のいずれでもインストールできます（すべてサポート対象です）。

* Wizard（推奨）: `openclaw onboard --install-daemon`
* 直接実行: `openclaw gateway install`
* 設定フロー: `openclaw configure` → **Gateway service** を選択
* 修復 / 移行: `openclaw doctor`（service の install / 修正を提案）

service の配置先は OS によって異なります。

* macOS: LaunchAgent（`ai.openclaw.gateway` または `ai.openclaw.<profile>`、legacy は `com.openclaw.*`）
* Linux / WSL2: systemd user service（`openclaw-gateway[-<profile>].service`）
