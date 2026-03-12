---
summary: "`openclaw hooks` (エージェントフック) の CLI リファレンス"
read_when:
  - エージェントフックを管理したい場合
  - フックのインストールや更新を行いたい場合
title: "hooks"
x-i18n:
  source_hash: "c9de9c21e7e474dc19753e2bed326510df02a3c8cd70c0cc0e0c54112230756a"
---
エージェントフック（`/new`、`/reset`、ゲートウェイの起動などのイベントに基づいて実行される自動化スクリプト）を管理します。

関連ドキュメント:
- フックの概要: [フック](/automation/hooks)
- プラグインフック: [プラグイン](/tools/plugin#plugin-hooks)

## すべてのフックを一覧表示する

```bash
openclaw hooks list
```

ワークスペース、管理ディレクトリ、および同梱ディレクトリから検出されたすべてのフックを表示します。

**オプション:**

- `--eligible`: 実行条件を満たしているフックのみを表示
- `--json`: JSON 形式で出力
- `-v, --verbose`: 不足している要件などの詳細情報を表示

**出力例:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - ゲートウェイ起動時に BOOT.md を実行
  📎 bootstrap-extra-files ✓ - エージェント起動時（bootstrap）に追加ファイルを注入
  📝 command-logger ✓ - すべてのコマンドイベントを中央監査ファイルに記録
  💾 session-memory ✓ - /new コマンド実行時にセッションコンテキストを記憶に保存
```

## フックの詳細情報を取得する

```bash
openclaw hooks info <name>
```

特定のフックに関する詳細情報を表示します。

**引数:**

- `<name>`: フック名 (例: `session-memory`)

**オプション:**

- `--json`: JSON 形式で出力

## フックの実行可否をチェックする

```bash
openclaw hooks check
```

フックの実行可否ステータスのサマリーを表示します（準備完了数 vs 未準備数）。

## フックを有効にする

```bash
openclaw hooks enable <name>
```

構成ファイル (`~/.openclaw/config.json`) を更新して、特定のフックを有効にします。

**注意:** プラグインによって提供されるフックは `openclaw hooks list` で `plugin:<id>` と表示され、ここから個別に有効・無効を切り替えることはできません。代わりにプラグイン自体の有効・無効を切り替えてください。

## フックを無効にする

```bash
openclaw hooks disable <name>
```

構成ファイルを更新して、特定のフックを無効にします。

## フックをインストールする

```bash
openclaw hooks install <path-or-spec>
openclaw hooks install <npm-spec> --pin
```

ローカルフォルダ、アーカイブ、または npm からフックパックをインストールします。

npm スペックは**レジストリ経由のみ**（パッケージ名 + オプションで**正確なバージョン**または **dist-tag**）をサポートします。Git、URL、ローカルファイルパスによる指定やセマンティックバージョニングの範囲指定は拒否されます。依存関係のインストールは安全のため `--ignore-scripts` 付きで実行されます。

**インストール時の動作:**

- フックパックを `~/.openclaw/hooks/<id>` にコピーします。
- `hooks.internal.entries.*` でインストールしたフックを有効にします。
- インストール情報を `hooks.internal.installs` に記録します。

**オプション:**

- `-l, --link`: コピーする代わりにローカルディレクトリをリンクします（`hooks.internal.load.extraDirs` に追加）。
- `--pin`: npm インストール時に、解決された正確な `name@version` を記録します。

## フックを更新する

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

インストール済みのフックパック（npm インストールのみ）を更新します。

## 同梱されているフックの例

### session-memory

`/new` コマンド実行時にセッションコンテキストを記憶として保存します。

**有効化:** `openclaw hooks enable session-memory`
**出力先:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

### bootstrap-extra-files

エージェントのセットアップ（`agent:bootstrap`）中に、追加の構成ファイル（モノリポ内の `AGENTS.md` や `TOOLS.md` など）を注入します。

**有効化:** `openclaw hooks enable bootstrap-extra-files`

### command-logger

すべてのコマンドイベントを中央監査ファイルに記録します。

**有効化:** `openclaw hooks enable command-logger`
**出力先:** `~/.openclaw/logs/commands.log`

### boot-md

ゲートウェイの起動直後（チャネルの開始後）に `BOOT.md` を実行します。

**イベント:** `gateway:startup`
**有効化:** `openclaw hooks enable boot-md`
