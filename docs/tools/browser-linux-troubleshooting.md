---
summary: "Linux 上の OpenClaw ブラウザ制御に関する Chrome/Brave/Edge/Chromium CDP 起動の問題を修正"
read_when: "Browser control fails on Linux, especially with snap Chromium"
title: "Browser Troubleshooting"
seoTitle: "OpenClawブラウザ機能のLinuxトラブル対処ガイド"
description: "OpenClaw のブラウザ コントロール サーバーは、次のエラーで Chrome/Brave/Edge/Chromium の起動に失敗します。問題: 「ポート 18800 で Chrome CDP を起動できませんでした」、根本原因、解決策 1: Google Chrome。"
x-i18n:
  source_hash: "bac2301022511a0bf8ebe1309606cc03e8a979ff74866c894f89d280ca3e514e"
---
## 問題: 「ポート 18800 で Chrome CDP を起動できませんでした」

OpenClaw のブラウザ コントロール サーバーは、次のエラーで Chrome/Brave/Edge/Chromium の起動に失敗します。

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

Ubuntu (および多くの Linux ディストリビューション) では、デフォルトの Chromium インストールは **スナップ パッケージ** です。 Snap の AppArmor の制限は、OpenClaw の生成とブラウザ プロセスの監視に干渉します。

`apt install chromium` コマンドは、スナップにリダイレクトするスタブ パッケージをインストールします。

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

これは実際のブラウザではなく、単なるラッパーです。

### 解決策 1: Google Chrome をインストールする (推奨)

スナップによってサンドボックス化されていない、公式の Google Chrome `.deb` パッケージをインストールします。

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

次に、OpenClaw 構成を更新します (`~/.openclaw/openclaw.json`)。

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### 解決策 2: アタッチ専用モードで Snap Chromium を使用する

スナップ Chromium を使用する必要がある場合は、手動で起動したブラウザに接続するように OpenClaw を構成します。

1. 構成を更新します。

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Chromium を手動で起動します。

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 必要に応じて、Chrome を自動起動する systemd ユーザー サービスを作成します。

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

`systemctl --user enable --now openclaw-browser.service` で有効にします

### ブラウザの動作を確認する

ステータスを確認します:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

テストブラウジング:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 構成リファレンス|オプション |説明 |デフォルト |

| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------- |
| `browser.enabled` |ブラウザ制御を有効にする | `true` |
| `browser.executablePath` | Chromium ベースのブラウザ バイナリへのパス (Chrome/Brave/Edge/Chromium) |自動検出 (Chromium ベースの場合はデフォルトのブラウザを優先します) |
| `browser.headless` | GUI なしで実行 | `false` |
| `browser.noSandbox` | `--no-sandbox` フラグを追加します (一部の Linux セットアップに必要)。 `false` |
| `browser.attachOnly` |ブラウザを起動せず、既存の | に接続するだけです。 `false` |
| `browser.cdpPort` | Chrome DevTools プロトコル ポート | `18800` |

### 問題: 「Chrome 拡張機能リレーは実行されていますが、タブが接続されていません」`chrome` プロファイル (拡張リレー) を使用しています。 OpenClaw を期待しています

ライブタブにアタッチされるブラウザ拡張機能。

修正オプション:

1. **管理対象ブラウザを使用します:** `openclaw browser start --browser-profile openclaw`
   (または `browser.defaultProfile: "openclaw"` を設定します)。
2. **拡張機能リレーを使用します:** 拡張機能をインストールし、タブを開いて、
   OpenClaw 拡張機能アイコンを添付します。

注:

- `chrome` プロファイルは、可能な場合、**システムのデフォルトの Chromium ブラウザ**を使用します。
- ローカル `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。リモート CDP に対してのみ設定してください。
