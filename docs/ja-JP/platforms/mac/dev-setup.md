---
summary: "OpenClaw macOS アプリを開発する開発者向けのセットアップ ガイド"
read_when:
  - macOS 開発環境のセットアップ
title: "macOS 開発セットアップ"
x-i18n:
  source_hash: "1cb41c449e4a314f6327c63458006aeb4d7723f093f3e3866a76f5ffaa00e2d3"
---

# macOS 開発者セットアップ

このガイドでは、OpenClaw macOS アプリケーションをソースからビルドして実行するために必要な手順について説明します。

## 前提条件

アプリを構築する前に、以下がインストールされていることを確認してください。

1. **Xcode 26.2+**: Swift 開発に必要です。
2. **Node.js 22+ および pnpm**: ゲートウェイ、CLI、およびパッケージ化スクリプトに必要です。

## 1. 依存関係をインストールする

プロジェクト全体の依存関係をインストールします。

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化する

macOS アプリをビルドして `dist/OpenClaw.app` にパッケージ化するには、次のコマンドを実行します。

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 証明書をお持ちでない場合、スクリプトは自動的に **アドホック署名** (`-`) を使用します。

開発実行モード、署名フラグ、チーム ID のトラブルシューティングについては、macOS アプリの README を参照してください。
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**: アドホック署名されたアプリはセキュリティ プロンプトをトリガーする場合があります。アプリが「トラップ 6 の中止」ですぐにクラッシュする場合は、[トラブルシューティング](#troubleshooting) セクションを参照してください。

## 3. CLI をインストールする

macOS アプリでは、バックグラウンド タスクを管理するためにグローバル `openclaw` CLI のインストールが必要です。

**インストールするには (推奨):**

1. OpenClaw アプリを開きます。
2. [**一般**] 設定タブに移動します。
3. **「CLI のインストール」** をクリックします。

あるいは、手動でインストールします。

```bash
npm install -g openclaw@<version>
```

## トラブルシューティング

### ビルド失敗: ツールチェーンまたは SDK の不一致macOS アプリのビルドには、最新の macOS SDK および Swift 6.2 ツールチェーンが必要です

**システムの依存関係 (必須):**

- **ソフトウェア アップデートで利用可能な最新の macOS バージョン** (Xcode 26.2 SDK に必要)
- **Xcode 26.2** (Swift 6.2 ツールチェーン)

**チェック:**

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS/Xcode を更新し、ビルドを再実行します。

### 権限付与時にアプリがクラッシュする

**音声認識**または**マイク**のアクセスを許可しようとしたときにアプリがクラッシュする場合は、TCC キャッシュの破損または署名の不一致が原因である可能性があります。

**修正:**

1. TCC 権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. これが失敗した場合は、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) の `BUNDLE_ID` を一時的に変更して、macOS を強制的に「白紙の状態」にします。

### ゲートウェイ「開始中...」が無期限に表示される

ゲートウェイのステータスが「開始中...」のままの場合は、ゾンビ プロセスがポートを保持しているかどうかを確認します。

```bash
openclaw gateway status
openclaw gateway stop

# If you’re not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行によりポートが保持されている場合は、そのプロセスを停止します (Ctrl+C)。最後の手段として、上記で見つけた PID を強制終了します。
