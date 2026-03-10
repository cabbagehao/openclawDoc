---
summary: "「openclaw ブラウザ」の CLI リファレンス (プロファイル、タブ、アクション、拡張機能リレー)"
read_when:
  - 「openclaw ブラウザ」を使用しており、一般的なタスクの例が必要です
  - 別のマシンで実行されているブラウザをノードホスト経由で制御したい
  - Chrome 拡張機能リレーを使用したい（ツールバー ボタンによるアタッチ/デタッチ）
title: "ブラウザ"
x-i18n:
  source_hash: "af35adfd68726fd519c704d046451effd330458c2b8305e713137fb07b2571fd"
---

# `openclaw browser`

OpenClaw のブラウザ コントロール サーバーを管理し、ブラウザ アクション (タブ、スナップショット、スクリーンショット、ナビゲーション、クリック、入力) を実行します。

関連:

- ブラウザツール + API: [ブラウザツール](/tools/browser)
- Chrome 拡張機能リレー: [Chrome 拡張機能](/tools/chrome-extension)

## 共通フラグ

- `--url <gatewayWsUrl>`: ゲートウェイ WebSocket URL (デフォルトは config)。
- `--token <token>`: ゲートウェイ トークン (必要な場合)。
- `--timeout <ms>`: リクエストのタイムアウト (ミリ秒)。
- `--browser-profile <name>`: ブラウザー プロファイルを選択します (構成からのデフォルト)。
- `--json`: 機械可読出力 (サポートされている場合)。

## クイックスタート (ローカル)

```bash
openclaw browser --browser-profile chrome tabs
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## プロファイル

プロファイルにはブラウザー ルーティング構成という名前が付けられます。実際には:

- `openclaw`: OpenClaw が管理する専用の Chrome インスタンス (分離されたユーザー データ ディレクトリ) を起動/接続します。
- `chrome`: Chrome 拡張機能リレーを介して既存の Chrome タブを制御します。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser delete-profile --name work
```

特定のプロファイルを使用します。

```bash
openclaw browser --browser-profile work tabs
```

## タブ

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## スナップショット / スクリーンショット / アクション

スナップショット:

```bash
openclaw browser snapshot
```

スクリーンショット:

```bash
openclaw browser screenshot
```

移動/クリック/入力 (参照ベースの UI オートメーション):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## Chrome 拡張機能リレー (ツールバー ボタンを使用して接続)

このモードでは、手動で接続した既存の Chrome タブをエージェントが制御できます (自動接続はされません)。

解凍された拡張機能を安定したパスにインストールします。

````bash
openclaw browser extension install
openclaw browser extension path
```次に、Chrome → `chrome://extensions` → 「開発者モード」を有効にする → 「解凍してロード」 → 印刷されたフォルダーを選択します。

完全ガイド: [Chrome 拡張機能](/tools/chrome-extension)

## リモートブラウザ制御 (ノードホストプロキシ)

ゲートウェイがブラウザとは別のマシンで実行されている場合は、Chrome/Brave/Edge/Chromium がインストールされているマシンで **ノード ホスト**を実行します。ゲートウェイは、ブラウザーのアクションをそのノードにプロキシします (別個のブラウザー制御サーバーは必要ありません)。

自動ルーティングを制御するには `gateway.nodes.browser.mode` を使用し、複数が接続されている場合に特定のノードを固定するには `gateway.nodes.browser.node` を使用します。

セキュリティ + リモート設定: [ブラウザ ツール](/tools/browser)、[リモート アクセス](/gateway/remote)、[テールスケール](/gateway/tailscale)、[セキュリティ](/gateway/security)
````
