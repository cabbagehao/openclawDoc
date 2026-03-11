---
summary: "「openclaw プラグイン」の CLI リファレンス (リスト、インストール、アンインストール、有効化/無効化、ドクター)"
read_when:
  - インプロセス ゲートウェイ プラグインをインストールまたは管理したい
  - プラグインの読み込みエラーをデバッグしたい
title: "プラグイン"
x-i18n:
  source_hash: "3e2a92dcf47a441a026ac65faf9f0de123171b6753c3897f950e3db2a0d750f1"
---

# `openclaw plugins`

ゲートウェイのプラグイン/拡張機能を管理します (プロセス中にロードされます)。

関連:

* プラグインシステム: [プラグイン](/tools/plugin)
* プラグイン マニフェスト + スキーマ: [プラグイン マニフェスト](/plugins/manifest)
* セキュリティ強化: [セキュリティ](/gateway/security)

## コマンド

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
```

バンドルされたプラグインは OpenClaw に同梱されていますが、最初は無効になっています。 `plugins enable` を使用して、
それらをアクティブ化します。

すべてのプラグインは、インライン JSON スキーマを含む `openclaw.plugin.json` ファイルを同梱する必要があります
(`configSchema`、空の場合でも)。マニフェストまたはスキーマが欠落しているか無効であるため、
プラグインがロードできなくなり、構成の検証に失敗します。

### インストール

```bash
openclaw plugins install <path-or-spec>
openclaw plugins install <npm-spec> --pin
```

セキュリティ上の注意: プラグインのインストールはコードを実行するように扱います。固定バージョンを推奨します。

Npm 仕様は **レジストリのみ** (パッケージ名 + オプションの **正確なバージョン** または
**距離タグ**)。 Git/URL/ファイルの仕様とサーバー範囲は拒否されます。依存関係
安全のため、インストールは `--ignore-scripts` で実行されます。

最低限のスペックと `@latest` は安定した軌道を維持します。 npm が次のいずれかを解決する場合
これらをプレリリースにすると、OpenClaw が停止し、明示的にオプトインするように求められます。
`@beta`/`@rc` などのプレリリース タグ、または次のような正確なプレリリース バージョン
`@1.2.3-beta.4`。ベア インストール仕様がバンドルされたプラグイン ID (`diffs` など) と一致する場合、OpenClaw
バンドルされたプラグインを直接インストールします。同じものを使用して npm パッケージをインストールするには
名前を指定するには、明示的なスコープ仕様 (`@scope/diffs` など) を使用します。

サポートされているアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。

ローカル ディレクトリのコピーを回避するには、`--link` を使用します (`plugins.load.paths` に追加)。

```bash
openclaw plugins install -l ./my-plugin
```

npm インストールで `--pin` を使用して、解決された正確な仕様 (`name@version`) を保存します。
`plugins.installs` デフォルトの動作を固定解除したままにします。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、`plugins.installs`、からプラグイン レコードを削除します。
プラグイン許可リスト、および該当する場合はリンクされた `plugins.load.paths` エントリ。
アクティブなメモリ プラグインの場合、メモリ スロットは `memory-core` にリセットされます。

デフォルトでは、アンインストールすると、アクティブなディレクトリの下にあるプラグインのインストール ディレクトリも削除されます。
状態ディレクトリ拡張子ルート (`$OPENCLAW_STATE_DIR/extensions/<id>`)。使用する
`--keep-files` はファイルをディスク上に保持します。

`--keep-config` は、`--keep-files` の非推奨のエイリアスとしてサポートされています。

### アップデート

```bash
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update <id> --dry-run
```

更新は、npm からインストールされたプラグインにのみ適用されます (`plugins.installs` で追跡されます)。保存された整合性ハッシュが存在し、フェッチされたアーティファクト ハッシュが変更された場合、
OpenClaw は警告を出力し、続行する前に確認を求めます。使用する
global `--yes` は、CI/非対話型実行でのプロンプトをバイパスします。
