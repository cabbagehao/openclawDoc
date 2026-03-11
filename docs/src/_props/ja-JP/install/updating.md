---
summary: "OpenClaw を安全にアップデートする方法（グローバルインストールまたはソース）、およびロールバック戦略"
read_when:
  - OpenClaw をアップデートする場合
  - アップデート後に何かが壊れた場合
title: "アップデート"
---

# アップデート (Updating)

OpenClaw は急速に進化しています（「1.0」以前の状態です）。アップデートはインフラのデプロイのように扱ってください：アップデート → チェックの実行 → 再起動（または再起動を伴う `openclaw update` を使用）→ 検証。

## 推奨：ウェブサイトのインストーラーを再実行する（インプレースアップグレード）

**推奨される** アップデートパスは、ウェブサイトからインストーラーを再実行することです。既存のインストールを検出し、その場でアップグレードし、必要に応じて `openclaw doctor` を実行します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

注意：

* オンボーディングウィザードを再度実行したくない場合は、`--no-onboard` を追加してください。

* **ソースインストール** の場合は、以下を使用します：

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
  ```

  インストーラーは、リポジトリがクリーンな場合に**のみ** `git pull --rebase` を実行します。

* **グローバルインストール** の場合、スクリプトは内部で `npm install -g openclaw@latest` を使用します。

* レガシーに関する注意：`clawdbot` は互換性のためのシム（shim）として引き続き利用可能です。

## アップデートの前に

* インストール方法を確認してください：**グローバル** (npm/pnpm) か **ソースから** (git clone) か。
* ゲートウェイの実行方法を確認してください：**フォアグラウンドのターミナル** か **管理されたサービス** (launchd/systemd) か。
* 現在の設定のスナップショット（バックアップ）を取ってください：
  * 構成：`~/.openclaw/openclaw.json`
  * 認証情報：`~/.openclaw/credentials/`
  * ワークスペース：`~/.openclaw/workspace`

## アップデート（グローバルインストール）

グローバルインストール（いずれかを選択）：

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

ゲートウェイの実行環境として Bun は推奨しません（WhatsApp/Telegram のバグのため）。

アップデートチャンネルを切り替えるには（git または npm インストール）：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --channel stable
```

一度限りのインストールタグ/バージョンを指定するには、`--tag <dist-tag|version>` を使用してください。

チャンネルの意味とリリースノートについては、[開発チャンネル](/install/development-channels) を参照してください。

注意：npm インストールの場合、ゲートウェイは起動時にアップデートのヒントをログに記録します（現在のチャンネルタグを確認します）。`update.checkOnStart: false` で無効化できます。

### コア自動アップデーター（オプション）

自動アップデーターは**デフォルトでオフ**になっており、コアゲートウェイの機能です（プラグインではありません）。

```json
{
  "update": {
    "channel": "stable",
    "auto": {
      "enabled": true,
      "stableDelayHours": 6,
      "stableJitterHours": 12,
      "betaCheckIntervalHours": 1
    }
  }
}
```

動作：

* `stable`：新しいバージョンがリリースされると、OpenClaw は `stableDelayHours` だけ待機し、その後 `stableJitterHours` 内でインストールごとの決定論的なジッター（ばらつき）を設けて適用します（段階的ロールアウト）。
* `beta`：`betaCheckIntervalHours`（デフォルト：1時間）おきにチェックし、アップデートがあれば適用します。
* `dev`：自動適用は行われません。手動で `openclaw update` を使用してください。

自動化を有効にする前に、`openclaw update --dry-run` を使用してアップデート内容をプレビューしてください。

その後：

```bash
openclaw doctor
openclaw gateway restart
openclaw health
```

注意：

* ゲートウェイをサービスとして実行している場合は、PID を kill するよりも `openclaw gateway restart` を推奨します。
* 特定のバージョンに固定している場合は、下記の「ロールバック / バージョン固定」を参照してください。

## アップデート (`openclaw update`)

**ソースインストール**（git チェックアウト）の場合は、以下を推奨します：

```bash
openclaw update
```

これは安全性を考慮したアップデートフローを実行します：

* クリーンなワークツリーが必要です。
* 選択されたチャンネル（タグまたはブランチ）に切り替えます。
* 設定されたアップストリーム（dev チャンネル）に対して fetch + rebase を行います。
* 依存関係のインストール、ビルド、コントロール UI のビルドを実行し、`openclaw doctor` を実行します。
* デフォルトでゲートウェイを再起動します（スキップするには `--no-restart` を使用）。

**npm/pnpm** 経由でインストールした場合（git メタデータがない場合）、`openclaw update` はパッケージマネージャーを介してアップデートを試みます。インストールを検出できない場合は、代わりに上記の「アップデート（グローバルインストール）」を使用してください。

## アップデート（コントロール UI / RPC）

コントロール UI には「**Update & Restart**」（RPC: `update.run`）があります。これは：

1. `openclaw update` と同じソースアップデートフローを実行します（git チェックアウトのみ）。
2. 再起動の目印（センチネル）を構造化されたレポート（stdout/stderr の末尾）と共に書き込みます。
3. ゲートウェイを再起動し、最後にアクティブだったセッションにレポートと共に通知を送ります。

rebase に失敗した場合、ゲートウェイはアップデートを適用せずに中断し、再起動します。

## アップデート（ソースから）

リポジトリのチェックアウトディレクトリから：

推奨：

```bash
openclaw update
```

手動（ほぼ同等）：

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # 初回実行時に UI の依存関係を自動インストール
openclaw doctor
openclaw health
```

注意：

* パッケージ化された `openclaw` バイナリ（[`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)）を実行する場合や、Node で `dist/` を実行する場合は `pnpm build` が重要です。
* グローバルインストールなしでリポジトリのチェックアウトから実行する場合は、CLI コマンドに `pnpm openclaw ...` を使用してください。
* TypeScript から直接実行する場合（`pnpm openclaw ...`）、再ビルドは通常不要ですが、**設定の移行は依然として適用される**ため、doctor を実行してください。
* グローバルインストールと git インストールの切り替えは簡単です：もう一方の形式をインストールし、`openclaw doctor` を実行すれば、Gateway サービスののエントリポイントが現在のインストールに書き換えられます。

## 常に実行：`openclaw doctor`

Doctor は「安全なアップデート」のためのコマンドです。意図的に退屈な内容（修復 + 移行 + 警告）になっています。

注意：**ソースインストール**（git チェックアウト）の場合、`openclaw doctor` は最初に `openclaw update` を実行することを提案します。

主な実行内容：

* 非推奨の設定キー / レガシーな設定ファイルの場所を移行します。
* DM ポリシーを監査し、リスクのある「open」設定に警告を出します。
* Gateway のヘルスチェックを行い、再起動を提案できます。
* 古い Gateway サービス（launchd/systemd、レガシーな schtasks）を検出し、現在の OpenClaw サービスに移行します。
* Linux で、systemd ユーザーのリンガリング（ログアウト後も Gateway が存続すること）を確保します。

詳細：[Doctor](/gateway/doctor)

## Gateway の起動 / 停止 / 再起動

CLI（OS に依存せず動作）：

```bash
openclaw gateway status
openclaw gateway stop
openclaw gateway restart
openclaw gateway --port 18789
openclaw logs --follow
```

サービス管理下にある場合：

* macOS launchd（アプリに同梱された LaunchAgent）：`launchctl kickstart -k gui/$UID/ai.openclaw.gateway`（`ai.openclaw.<profile>` を使用。レガシーな `com.openclaw.*` も引き続き動作します）
* Linux systemd ユーザーサービス：`systemctl --user restart openclaw-gateway[-<profile>].service`
* Windows (WSL2)：`systemctl --user restart openclaw-gateway[-<profile>].service`
  * `launchctl`/`systemctl` はサービスがインストールされている場合にのみ動作します。そうでない場合は `openclaw gateway install` を実行してください。

ランブックと正確なサービスラベル：[Gateway ランブック](/gateway)

## ロールバック / バージョン固定（何かが壊れた場合）

### バージョン固定（グローバルインストール）

既知の正常なバージョンをインストールします（`<version>` を最後に動作していたものに置き換えてください）：

```bash
npm i -g openclaw@<version>
```

```bash
pnpm add -g openclaw@<version>
```

ヒント：現在公開されているバージョンを確認するには、`npm view openclaw version` を実行してください。

その後、再起動して doctor を再実行します：

```bash
openclaw doctor
openclaw gateway restart
```

### 日付による固定（ソースインストール）

特定の日付のコミットを選択します（例：「2026-01-01 時点の main の状態」）：

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

その後、依存関係を再インストールして再起動します：

```bash
pnpm install
pnpm build
openclaw gateway restart
```

後で最新の状態に戻したい場合：

```bash
git checkout main
git pull
```

## 困ったときは

* もう一度 `openclaw doctor` を実行し、出力を注意深く読んでください（解決策が示されていることが多いです）。
* チェック：[トラブルシューティング](/gateway/troubleshooting)
* Discord で質問する：[https://discord.gg/clawd](https://discord.gg/clawd)
