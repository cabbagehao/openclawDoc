---
summary: "プラットフォーム サポートの概要 (ゲートウェイ + コンパニオン アプリ)"
read_when:
  - OS のサポートまたはインストール パスを探しています
  - ゲートウェイを実行する場所の決定
title: "プラットフォーム"
x-i18n:
  source_hash: "653f395598b9558cb15b58ab42ed931dba47c70780be1c803d33dd795bad6503"
---

# プラットフォーム

OpenClaw コアは TypeScript で書かれています。 **ノードは推奨ランタイムです**。
Bun はゲートウェイには推奨されません (WhatsApp/Telegram のバグ)。

コンパニオン アプリは、macOS (メニュー バー アプリ) とモバイル ノード (iOS/Android) 用に存在します。ウィンドウズと
Linux コンパニオン アプリも計画されていますが、ゲートウェイは現在完全にサポートされています。
Windows 用のネイティブ コンパニオン アプリも計画されています。ゲートウェイは WSL2 経由をお勧めします。

## OSを選択してください

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- アンドロイド: [アンドロイド](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS とホスティング

- VPS ハブ: [VPS ホスティング](/vps)
- Fly.io: [Fly.io](/install/fly)
- ヘッツナー (Docker): [ヘッツナー](/install/hetzner)
- GCP (コンピューティング エンジン): [GCP](/install/gcp)
- exe.dev (VM + HTTPS プロキシ): [exe.dev](/install/exe-dev)

## 共通リンク

- インストールガイド: [はじめに](/start/getting-started)
- ゲートウェイ ランブック: [ゲートウェイ](/gateway)
- ゲートウェイ構成: [構成](/gateway/configuration)
- サービスステータス: `openclaw gateway status`

## ゲートウェイ サービスのインストール (CLI)

次のいずれかを使用します (すべてサポートされています)。

- ウィザード (推奨): `openclaw onboard --install-daemon`
- 直接: `openclaw gateway install`
- フローの構成: `openclaw configure` → **ゲートウェイ サービス** を選択
- 修復/移行: `openclaw doctor` (サービスのインストールまたは修正を提案)

サービスの対象は OS によって異なります。- macOS: LaunchAgent (`ai.openclaw.gateway` または `ai.openclaw.<profile>`、レガシー `com.openclaw.*`)

- Linux/WSL2: systemd ユーザー サービス (`openclaw-gateway[-<profile>].service`)
