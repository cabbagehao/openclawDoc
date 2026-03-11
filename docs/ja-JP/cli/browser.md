---
summary: "`openclaw browser` の CLI リファレンス (プロファイル、タブ、アクション、拡張機能リレー)"
read_when:
  - "`openclaw browser` コマンドを使用しており、よくあるタスクの実行例を確認したい場合"
  - ノードホストを介して別のマシンで実行されているブラウザを制御したい場合
  - Chrome 拡張機能リレーを使用したい（ツールバーのボタンによるアタッチ/デタッチ）場合
title: "browser"
x-i18n:
  source_hash: "af35adfd68726fd519c704d046451effd330458c2b8305e713137fb07b2571fd"
---

# `openclaw browser`

OpenClaw のブラウザ制御サーバーを管理し、ブラウザ操作（タブ管理、スナップショット取得、スクリーンショット、ナビゲーション、クリック、入力など）を実行します。

関連ドキュメント:
- ブラウザツール + API: [ブラウザツール](/tools/browser)
- Chrome 拡張機能リレー: [Chrome 拡張機能](/tools/chrome-extension)

## よく使われるフラグ

- `--url <gatewayWsUrl>`: ゲートウェイの WebSocket URL (デフォルトは構成に従います)。
- `--token <token>`: ゲートウェイの認証トークン (必要な場合)。
- `--timeout <ms>`: リクエストのタイムアウト (ミリ秒)。
- `--browser-profile <name>`: ブラウザプロファイルを選択 (デフォルトは構成に従います)。
- `--json`: 機械可読な形式で出力。

## クイックスタート (ローカル環境)

```bash
openclaw browser --browser-profile chrome tabs
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## プロファイル

プロファイルはブラウザのルーティング設定に名前を付けたものです。主なものは以下の通りです:

- `openclaw`: OpenClaw が管理する専用の Chrome インスタンス (分離されたユーザーデータディレクトリを使用) を起動または接続します。
- `chrome`: Chrome 拡張機能リレーを介して、既存の Chrome タブを制御します。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser delete-profile --name work
```

特定のプロファイルを使用する場合:

```bash
openclaw browser --browser-profile work tabs
```

## タブ操作

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## スナップショット / スクリーンショット / アクション

スナップショットの取得:

```bash
openclaw browser snapshot
```

スクリーンショットの取得:

```bash
openclaw browser screenshot
```

ナビゲーション / クリック / 入力 (参照ベースの UI 自動化):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## Chrome 拡張機能リレー (ツールバーのボタンで接続)

このモードでは、手動でアタッチ（接続）した既存の Chrome タブをエージェントが制御できます（自動的にアタッチされることはありません）。

ビルド済みの拡張機能を安定したパスに配置します:

```bash
openclaw browser extension install
openclaw browser extension path
```

次に、Chrome で `chrome://extensions` を開き、「デベロッパー モード」を有効にしてから「パッケージ化されていない拡張機能を読み込む」を選択し、表示されたフォルダを選択してください。

詳細ガイド: [Chrome 拡張機能](/tools/chrome-extension)

## リモートブラウザ制御 (ノードホスト経由のプロキシ)

ゲートウェイがブラウザとは別のマシンで動作している場合は、Chrome、Brave、Edge、Chromium 等がインストールされているマシンで**ノードホスト**を実行してください。ゲートウェイはブラウザ操作をそのノードにプロキシ（中継）します（別途ブラウザ制御サーバーを用意する必要はありません）。

自動ルーティングの設定には `gateway.nodes.browser.mode` を、特定のノードに固定する場合は `gateway.nodes.browser.node` を使用します。

セキュリティとリモート設定の詳細: [ブラウザツール](/tools/browser), [リモートアクセス](/gateway/remote), [Tailscale](/gateway/tailscale), [セキュリティ](/gateway/security)
