---
summary: "OpenClaw macOS アプリを開発するためのセットアップ ガイド"
read_when:
  - macOS 開発環境のセットアップ
title: "macOS 開発セットアップ"
x-i18n:
  source_hash: "1cb41c449e4a314f6327c63458006aeb4d7723f093f3e3866a76f5ffaa00e2d3"
---
このガイドでは、OpenClaw の macOS アプリをソースコードからビルドし、実行するまでの手順を説明します。

## 前提条件

アプリをビルドする前に、次の環境が整っていることを確認してください。

1. **Xcode 26.2 以降**: Swift 開発に必要です。
2. **Node.js 22 以降と pnpm**: ゲートウェイ、CLI、パッケージング用スクリプトに必要です。

## 1. 依存関係をインストールする

まず、プロジェクト全体の依存関係をインストールします。

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化する

macOS アプリをビルドし、`dist/OpenClaw.app` として出力するには、次を実行します。

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 証明書がない場合、このスクリプトは自動的に **ad-hoc signing**（`-`）を使用します。

開発実行モード、署名フラグ、Team ID 関連のトラブルシューティングについては、macOS アプリの README を参照してください。
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**: ad-hoc 署名のアプリではセキュリティ警告が表示されることがあります。アプリが `"Abort trap 6"` ですぐ終了する場合は、[トラブルシューティング](#troubleshooting) を参照してください。

## 3. CLI をインストールする

macOS アプリは、バックグラウンド タスクの管理にグローバルの `openclaw` CLI を利用します。

**推奨されるインストール手順:**

1. OpenClaw アプリを開きます。
2. **General** 設定タブを開きます。
3. **Install CLI** をクリックします。

手動でインストールすることもできます。

```bash
npm install -g openclaw@<version>
```

## トラブルシューティング

### ビルドに失敗する: ツールチェーンまたは SDK の不一致

macOS アプリのビルドには、最新の macOS SDK と Swift 6.2 ツールチェーンが必要です。

**必要なシステム依存関係:**

- **Software Update で提供される最新の macOS**
- **Xcode 26.2**（Swift 6.2 ツールチェーン）

**確認コマンド:**

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS と Xcode を更新してから再度ビルドしてください。

### 権限を許可するとアプリがクラッシュする

**Speech Recognition** または **Microphone** へのアクセスを許可した際にアプリがクラッシュする場合、TCC キャッシュの破損や署名の不一致が原因の可能性があります。

**対処方法:**

1. TCC の権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも解決しない場合は、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) の `BUNDLE_ID` を一時的に変更し、macOS 側の権限状態を初期化してください。

### ゲートウェイが "Starting..." のままになる

ゲートウェイのステータスが `"Starting..."` のまま変わらない場合は、ゾンビ プロセスがポートを保持していないか確認してください。

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent を使っていない場合（開発モード / 手動実行）は、待ち受けプロセスを確認します。
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行したプロセスがポートを保持している場合は、そのプロセスを停止してください（`Ctrl+C`）。どうしても解消しない場合のみ、確認した PID を強制終了します。
