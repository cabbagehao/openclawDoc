---
summary: "「openclaw フック」 (エージェント フック) の CLI リファレンス"
read_when:
  - エージェントフックを管理したい
  - フックをインストールまたは更新したい
title: "フック"
x-i18n:
  source_hash: "c9de9c21e7e474dc19753e2bed326510df02a3c8cd70c0cc0e0c54112230756a"
---

# `openclaw hooks`

エージェント フック (`/new`、`/reset` などのコマンドのイベント ドリブンの自動化、およびゲートウェイの起動) を管理します。

関連:

- フック: [フック](/automation/hooks)
- プラグインフック: [プラグイン](/tools/plugin#plugin-hooks)

## すべてのフックをリストする

```bash
openclaw hooks list
```

ワークスペース、管理対象ディレクトリ、およびバンドルされたディレクトリから検出されたすべてのフックをリストします。

**オプション:**

- `--eligible`: 対象となるフックのみを表示します (要件を満たしている)
- `--json`: JSON として出力
- `-v, --verbose`: 不足している要件を含む詳細情報を表示します

**出力例:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new command is issued
```

**例 (詳細):**

```bash
openclaw hooks list --verbose
```

不適格なフックの欠落要件を示します。

**例 (JSON):**

```bash
openclaw hooks list --json
```

プログラムで使用するために構造化された JSON を返します。

## フック情報の取得

```bash
openclaw hooks info <name>
```

特定のフックに関する詳細情報を表示します。

**引数:**

- `<name>`: フック名 (例: `session-memory`)

**オプション:**

- `--json`: JSON として出力

**例:**

```bash
openclaw hooks info session-memory
```

**出力:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new

Requirements:
  Config: ✓ workspace.dir
```

## フックの適格性を確認する

```bash
openclaw hooks check
```

フックの適格性ステータスの概要を表示します (準備ができているフックと準備ができていないフックの数)。

**オプション:**

- `--json`: JSON として出力

**出力例:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## フックを有効にする

```bash
openclaw hooks enable <name>
```

特定のフックを構成に追加して有効にします (`~/.openclaw/config.json`)。**注意:** プラグインによって管理されるフックでは、`openclaw hooks list` に `plugin:<id>` が表示され、
ここでは有効/無効にすることはできません。代わりにプラグインを有効/無効にします。

**引数:**

- `<name>`: フック名 (例: `session-memory`)

**例:**

```bash
openclaw hooks enable session-memory
```

**出力:**

```
✓ Enabled hook: 💾 session-memory
```

**機能:**

- フックが存在し、適格であるかどうかを確認します
- 構成内の `hooks.internal.entries.<name>.enabled = true` を更新します
- 構成をディスクに保存します

**有効化後:**

- フックがリロードされるようにゲートウェイを再起動します (macOS ではメニュー バー アプリを再起動するか、開発環境でゲートウェイ プロセスを再起動します)。

## フックを無効にする

```bash
openclaw hooks disable <name>
```

設定を更新して特定のフックを無効にします。

**引数:**

- `<name>`: フック名 (例: `command-logger`)

**例:**

```bash
openclaw hooks disable command-logger
```

**出力:**

```
⏸ Disabled hook: 📝 command-logger
```

**無効化後:**

- フックがリロードされるようにゲートウェイを再起動します

## フックをインストールする

```bash
openclaw hooks install <path-or-spec>
openclaw hooks install <npm-spec> --pin
```

ローカル フォルダー/アーカイブまたは npm からフック パックをインストールします。

Npm 仕様は **レジストリのみ** (パッケージ名 + オプションの **正確なバージョン** または
**距離タグ**)。 Git/URL/ファイルの仕様とサーバー範囲は拒否されます。依存関係
安全のため、インストールは `--ignore-scripts` で実行されます。

最低限のスペックと `@latest` は安定した軌道を維持します。 npm が次のいずれかを解決する場合
これらをプレリリースにすると、OpenClaw が停止し、明示的にオプトインするように求められます。
`@beta`/`@rc` などのプレリリース タグ、または正確なプレリリース バージョン。

**機能:**- フック パックを `~/.openclaw/hooks/<id>` にコピーします。

- `hooks.internal.entries.*` にインストールされているフックを有効にします
- `hooks.internal.installs` の下にインストールを記録します。

**オプション:**

- `-l, --link`: コピーする代わりにローカル ディレクトリをリンクします (`hooks.internal.load.extraDirs` に追加します)
- `--pin`: npm インストールを正確に解決された `name@version` として `hooks.internal.installs` に記録します。

**サポートされているアーカイブ:** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**例:**

```bash
# Local directory
openclaw hooks install ./my-hook-pack

# Local archive
openclaw hooks install ./my-hook-pack.zip

# NPM package
openclaw hooks install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw hooks install -l ./my-hook-pack
```

## フックを更新する

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

インストールされているフック パックを更新します (npm インストールのみ)。

**オプション:**

- `--all`: すべての追跡されたフック パックを更新します
- `--dry-run`: 書かずに何が変わるかを示します

保存された整合性ハッシュが存在し、フェッチされたアーティファクト ハッシュが変更された場合、
OpenClaw は警告を出力し、続行する前に確認を求めます。使用する
global `--yes` は、CI/非対話型実行でのプロンプトをバイパスします。

## 同梱フック

### セッションメモリ

`/new` を発行すると、セッション コンテキストがメモリに保存されます。

**有効にする:**

```bash
openclaw hooks enable session-memory
```

**出力:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参照:** [セッションメモリのドキュメント](/automation/hooks#session-memory)

### ブートストラップ追加ファイル

`agent:bootstrap` 中に追加のブートストラップ ファイル (モノリポローカル `AGENTS.md` / `TOOLS.md` など) を挿入します。

**有効にする:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参照:** [ブートストラップ追加ファイルのドキュメント](/automation/hooks#bootstrap-extra-files)

### コマンドロガーすべてのコマンド イベントを一元化された監査ファイルに記録します

**有効にする:**

```bash
openclaw hooks enable command-logger
```

**出力:** `~/.openclaw/logs/commands.log`

**ログの表示:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参照:** [コマンドロガーのドキュメント](/automation/hooks#command-logger)

### ブートMD

ゲートウェイの起動時 (チャネルの開始後) `BOOT.md` を実行します。

**イベント**: `gateway:startup`

**有効にする**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md ドキュメント](/automation/hooks#boot-md)
