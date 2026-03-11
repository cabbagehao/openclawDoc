---
summary: "OpenClaw を完全にアンインストールする（CLI、サービス、状態、ワークスペース）"
read_when:
  - マシンから OpenClaw を削除したい場合
  - アンインストール後も Gateway サービスがまだ実行されている場合
title: "アンインストール"
---

# アンインストール

方法は 2 通りあります。

* `openclaw` がまだ入っている場合の **簡単な方法**
* CLI は消えているがサービスだけ残っている場合の **手動サービス削除**

## 簡単な方法（CLI がインストールされている場合）

推奨: 組み込みのアンインストーラーを使います。

```bash
openclaw uninstall
```

非対話型（自動化 / npx）：

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手動で行う場合も、結果は同じです。

1. Gateway サービスを停止します：

```bash
openclaw gateway stop
```

2. Gateway サービス（launchd/systemd/schtasks）をアンインストールします：

```bash
openclaw gateway uninstall
```

3. 状態（state）と設定を削除します：

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH` を状態ディレクトリ以外のカスタムの場所に設定している場合は、そのファイルも削除してください。

4. ワークスペースを削除します（オプション。エージェントのファイルを削除します）：

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI のインストールを削除します（使用したものを選んでください）：

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS アプリをインストールした場合は、以下を削除します：

```bash
rm -rf /Applications/OpenClaw.app
```

注意：

* プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用していた場合は、各状態ディレクトリ（デフォルトは `~/.openclaw-<profile>`）に対して手順 3 を繰り返してください。
* リモートモードの場合、状態ディレクトリは **Gateway ホスト** 上にあるため、そこでも手順 1〜4 を実行してください。

## 手動でのサービス削除（CLI がインストールされていない場合）

Gateway サービスは実行され続けているが `openclaw` コマンドがない場合に使用します。

### macOS (launchd)

デフォルトのラベルは `ai.openclaw.gateway` です（または `ai.openclaw.<profile>`。レガシーな `com.openclaw.*` が残っている場合もあります）：

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

プロファイルを使用していた場合は、ラベルと plist 名を `ai.openclaw.<profile>` に置き換えてください。古い `com.openclaw.*` の plist があれば、それも削除してください。

### Linux (systemd ユーザーユニット)

デフォルトのユニット名は `openclaw-gateway.service` です（または `openclaw-gateway-<profile>.service`）：

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (タスク スケジューラ)

デフォルトのタスク名は `OpenClaw Gateway` です（または `OpenClaw Gateway (<profile>)`）。
タスクスクリプトは状態ディレクトリの下にあります。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

プロファイルを使用していた場合は、一致するタスク名と `~\.openclaw-<profile>\gateway.cmd` を削除してください。

## 通常のインストール vs ソースチェックアウト

### 通常のインストール (install.sh / npm / pnpm / bun)

`https://openclaw.ai/install.sh` または `install.ps1` を使用した場合、CLI は `npm install -g openclaw@latest` でインストールされています。
`npm rm -g openclaw` で削除してください（他の方法でインストールした場合は、`pnpm remove -g` または `bun remove -g` を使用してください）。

### ソースチェックアウト (git clone)

リポジトリのチェックアウト（`git clone` + `openclaw ...` / `bun run openclaw ...`）から実行している場合：

1. リポジトリを削除する **前** に、Gateway サービスをアンインストールしてください（上記の「簡単な方法」または「手動でのサービス削除」を使用）。
2. リポジトリディレクトリを削除します。
3. 上記のように状態とワークスペースを削除します。
