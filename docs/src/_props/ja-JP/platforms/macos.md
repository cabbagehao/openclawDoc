---
summary: "OpenClaw macOS コンパニオン アプリ (メニュー バー + ゲートウェイ ブローカー)"
read_when:
  - macOS アプリ機能を実装するとき
  - macOS 上でのゲートウェイ ライフサイクルや node bridging を変更するとき
title: "macOS アプリ"
x-i18n:
  source_hash: "e9e6a8af9c8eaec6b51a41a330667f826fdc52a95de169a61268ac5e0e8772ed"
---

# OpenClaw macOS Companion (メニュー バー + ゲートウェイ broker)

macOS アプリは、OpenClaw の **メニュー バー companion** です。各種アクセス許可を管理し、ローカルではゲートウェイを管理または接続し (launchd または手動起動)、macOS 固有の機能を node としてエージェントへ公開します。

## 役割

* メニュー バーにネイティブ通知と状態を表示します。
* TCC プロンプト (Notifications、Accessibility、Screen Recording、Microphone、Speech Recognition、Automation / AppleScript) を担当します。
* ゲートウェイを実行するか、既存のゲートウェイへ接続します (local / remote 両対応)。
* macOS 専用ツール (Canvas、Camera、Screen Recording、`system.run`) を公開します。
* **remote** モードではローカルの node host service を起動し、**local** モードでは停止します。
* 必要に応じて、UI 自動化用の **PeekabooBridge** をホストします。
* 要求に応じて、グローバル CLI (`openclaw`) を npm / pnpm 経由でインストールします。ゲートウェイ ランタイム用途では bun は推奨されません。

## Local と Remote の違い

* **Local** (既定): 既にローカル ゲートウェイが起動していればそれに接続し、存在しなければ `openclaw gateway install` を通じて launchd service を有効化します。
* **Remote**: SSH / Tailscale 経由でリモート ゲートウェイへ接続し、ローカルのゲートウェイは起動しません。
  この場合、リモート ゲートウェイがこの Mac に到達できるように、ローカルの **node host service** を起動します。
  アプリがゲートウェイを子プロセスとして生成することはありません。

## Launchd による制御

アプリは、ユーザー単位の LaunchAgent `ai.openclaw.gateway` を管理します。`--profile` または `OPENCLAW_PROFILE` を使う場合は `ai.openclaw.<profile>` になり、従来の `com.openclaw.*` も引き続き unload 対象として扱います。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付き profile を使う場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

LaunchAgent が未インストールであれば、アプリ側から有効化するか、`openclaw gateway install` を実行してください。

## node として公開される機能 (macOS)

macOS アプリは自身を node として公開します。代表的な command は次のとおりです。

* Canvas: `canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
* Camera: `camera.snap`、`camera.clip`
* Screen: `screen.record`
* System: `system.run`、`system.notify`

node は `permissions` map を報告するため、エージェントは利用可能な機能を判断できます。

Node service + app IPC:

* ヘッドレスの node host service が動作している場合 (remote mode)、それは node としてゲートウェイ WS へ接続します。
* `system.run` は、ローカル Unix socket を介して macOS アプリ側 (UI / TCC context) で実行されます。承認プロンプトや出力はアプリ内に残ります。

図 (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run` は、macOS アプリの **Exec approvals** (Settings → Exec approvals) によって制御されます。security、ask、allowlist は、Mac ローカルの次のファイルに保存されます。

```
~/.openclaw/exec-approvals.json
```

例:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

補足:

* `allowlist` の各項目は、解決済みバイナリ パスに対する glob pattern です。
* 生の shell command に `&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)` のような shell 制御または展開構文が含まれている場合は、allowlist miss として扱い、明示的な承認が必要です。例外にしたいなら shell バイナリ自体を allowlist へ追加してください。
* プロンプトで "Always Allow" を選ぶと、その command は allowlist に追加されます。
* `system.run` の環境変数 override は、`PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4` を除外したうえで、アプリの環境へマージされます。
* shell wrapper (`bash|sh|zsh ... -c/-lc`) の場合、リクエスト単位の環境変数 override は、`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR` だけに縮小されます。
* allowlist mode で "always allow" を保存する際、`env`、`nice`、`nohup`、`stdbuf`、`timeout` のような既知の dispatch wrapper については、wrapper 自身ではなく内部の executable path を保存します。安全に unwrap できない場合は、自動保存しません。

## ディープリンク

アプリは、ローカル操作用に `openclaw://` URL scheme を登録しています。

### `openclaw://agent`

ゲートウェイの `agent` リクエストを発火します。

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

クエリ パラメータ:

* `message` (必須)
* `sessionKey` (任意)
* `thinking` (任意)
* `deliver` / `to` / `channel` (任意)
* `timeoutSeconds` (任意)
* `key` (任意。無人実行モード用)

安全策:

* `key` がない場合、アプリは確認ダイアログを表示します。
* `key` がない場合、確認ダイアログでは短いメッセージ長の制限を課し、`deliver` / `to` / `channel` は無視します。
* 有効な `key` がある場合、実行は unattended で行われます。想定用途は個人用 automation です。

## 一般的なオンボーディング フロー

1. **OpenClaw\.app** をインストールして起動します。
2. アクセス許可チェックリストを完了し、TCC プロンプトへ応答します。
3. **Local** モードが有効で、ゲートウェイが起動していることを確認します。
4. ターミナルからも操作したい場合は CLI をインストールします。

## state dir の配置 (macOS)

OpenClaw の state dir は、iCloud やその他のクラウド同期フォルダーに置かないでください。同期対象のパスは遅延を増やし、session や認証情報のファイルロック、同期競合を引き起こすことがあります。

推奨されるのは、次のようなローカルの非同期パスです。

```bash
OPENCLAW_STATE_DIR=~/.openclaw
```

`openclaw doctor` が次のような場所に state dir を検出した場合:

* `~/Library/Mobile Documents/com~apple~CloudDocs/...`
* `~/Library/CloudStorage/...`

警告を表示し、ローカル パスへ戻すことを勧めます。

## ビルドと開発ワークフロー (ネイティブ)

* `cd apps/macos && swift build`
* `swift run OpenClaw` (または Xcode)
* パッケージ化: `scripts/package-mac-app.sh`

## ゲートウェイ接続のデバッグ (macOS CLI)

デバッグ CLI を使うと、アプリ本体を起動せずに、macOS アプリと同じゲートウェイ WebSocket handshake と discovery logic を確認できます。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

接続オプション:

* `--url <ws://host:port>`: 設定値を上書きします
* `--mode <local|remote>`: 設定から解決します (既定は config または local)
* `--probe`: 新しい health probe を強制実行します
* `--timeout <ms>`: リクエスト タイムアウト (既定 `15000`)
* `--json`: 差分確認しやすい構造化出力

discovery オプション:

* `--include-local`: 通常 "local" として除外されるゲートウェイも含めます
* `--timeout <ms>`: discovery 全体の待機時間 (既定 `2000`)
* `--json`: 差分確認しやすい構造化出力

ヒント: `openclaw gateway discover --json` と比較すると、macOS アプリ側の discovery pipeline (NWBrowser + tailnet DNS-SD fallback) と、Node CLI 側の `dns-sd` ベース discovery の差を確認できます。

## リモート接続の配線 (SSH トンネル)

macOS アプリが **Remote** モードで動作している場合、ローカル UI から見れば localhost 上にあるのと同じ感覚で、リモート ゲートウェイへ接続できるよう SSH トンネルを開きます。

### 制御トンネル (ゲートウェイ WebSocket ポート)

* **目的:** health check、status、Web Chat、config、そのほか control-plane call
* **ローカル ポート:** ゲートウェイ ポート (既定 `18789`)。常に固定です。
* **リモート ポート:** リモート ホスト側の同じゲートウェイ ポート
* **挙動:** ランダムなローカル ポートは使いません。既存の健全なトンネルがあれば再利用し、必要なら再起動します。
* **SSH 形状:** `ssh -N -L <local>:127.0.0.1:<remote>` に、BatchMode、ExitOnForwardFailure、keepalive 関連オプションを付けて実行します。
* **IP 表示:** SSH トンネルは loopback を使うため、ゲートウェイには node IP が `127.0.0.1` として見えます。実際のクライアント IP を出したい場合は、**Direct (ws/wss)** transport を使ってください ([macOS remote access](/platforms/mac/remote) を参照)。

セットアップ手順は [macOS remote access](/platforms/mac/remote) を、プロトコル詳細は [Gateway protocol](/gateway/protocol) を参照してください。

## 関連ドキュメント

* [Gateway runbook](/gateway)
* [Gateway (macOS)](/platforms/mac/bundled-gateway)
* [macOS permissions](/platforms/mac/permissions)
* [Canvas](/platforms/mac/canvas)
