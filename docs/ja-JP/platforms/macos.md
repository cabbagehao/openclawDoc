---
summary: "OpenClaw macOS コンパニオン アプリ (メニュー バー + ゲートウェイ ブローカー)"
read_when:
  - macOS アプリ機能の実装
  - macOS でのゲートウェイのライフサイクルまたはノード ブリッジングの変更
title: "macOS アプリ"
x-i18n:
  source_hash: "e9e6a8af9c8eaec6b51a41a330667f826fdc52a95de169a61268ac5e0e8772ed"
---

# OpenClaw macOS Companion (メニューバー + ゲートウェイブローカー)

macOS アプリは、OpenClaw の **メニューバー コンパニオン**です。権限を所有しており、
ゲートウェイをローカルで管理/接続し (launchd または手動で)、macOS を公開します
エージェントにノードとしての機能を提供します。

## 何をするのか

- メニューバーにネイティブの通知とステータスを表示します。
- TCC プロンプトを所有します (通知、アクセシビリティ、画面録画、マイク、
  音声認識、オートメーション/AppleScript)。
- ゲートウェイ (ローカルまたはリモート) を実行または接続します。
- macOS 専用ツール (キャンバス、カメラ、画面録画、`system.run`) を公開します。
- ローカル ノード ホスト サービスを **remote** モード (launchd) で開始し、**local** モードで停止します。
- オプションで、UI 自動化のために **PeekabooBridge** をホストします。
- リクエストに応じて、npm/pnpm 経由でグローバル CLI (`openclaw`) をインストールします (ゲートウェイ ランタイムには推奨されません)。

## ローカルモードとリモートモード

- **ローカル** (デフォルト): アプリは、実行中のローカル ゲートウェイが存在する場合はそれに接続します。
  それ以外の場合は、`openclaw gateway install` 経由で launchd サービスを有効にします。
- **リモート**: アプリは SSH/Tailscale 経由でゲートウェイに接続しますが、起動しません
  ローカルプロセス。
  アプリはローカル **ノード ホスト サービス**を開始し、リモート ゲートウェイがこの Mac に到達できるようにします。
  アプリはゲートウェイを子プロセスとして生成しません。

## コントロールを起動しましたアプリは、`ai.openclaw.gateway` というラベルの付いたユーザーごとの LaunchAgent を管理します

(または、`--profile`/`OPENCLAW_PROFILE` を使用する場合は `ai.openclaw.<profile>`、従来の `com.openclaw.*` は引き続きアンロードされます)。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルを実行する場合は、ラベルを `ai.openclaw.<profile>` に置き換えます。

LaunchAgent がインストールされていない場合は、アプリから有効にするか、次のコマンドを実行します。
`openclaw gateway install`。

## ノードの機能 (Mac)

macOS アプリはそれ自体をノードとして表示します。一般的なコマンド:

- キャンバス: `canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- カメラ: `camera.snap`、`camera.clip`
- 画面: `screen.record`
- システム: `system.run`、`system.notify`

ノードは `permissions` マップを報告するため、エージェントは何を許可するかを決定できます。

ノードサービス + アプリ IPC:

・ ヘッドレスノードホストサービスが動作している場合(リモートモード)、ゲートウェイWSにノードとして接続します。

- `system.run` は、ローカル Unix ソケットを介して macOS アプリ (UI/TCC コンテキスト) で実行されます。プロンプトと出力はアプリ内に残ります。

図 (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 実行承認 (system.run)

`system.run` は、macOS アプリの **実行承認** によって制御されます ([設定] → [実行承認])。
セキュリティ + ask + ホワイトリストは、Mac 上の次の場所にローカルに保存されます。

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

注:- `allowlist` エントリは、解決されたバイナリ パスのグロブ パターンです。

- シェル制御または拡張構文を含む生のシェル コマンド テキスト (`&&`、`||`、`;`、`|`、` `) ``, `$`, `<**OC_I18N_0038**>`, `(`, `)`) はホワイトリスト ミスとして扱われ、明示的な承認 (またはシェル バイナリのホワイトリスト登録) が必要です。
- プロンプトで「常に許可」を選択すると、そのコマンドが許可リストに追加されます。
- `system.run` 環境オーバーライドはフィルター処理されます (`PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、 `RUBYOPT`、`SHELLOPTS`、`PS4`) を取得し、アプリの環境に統合します。
- シェル ラッパー (`bash|sh|zsh ... -c/-lc`) の場合、リクエスト スコープの環境オーバーライドは、小さな明示的な許可リスト (`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、 `FORCE_COLOR`)。
- ホワイトリスト モードでの常に許可の決定の場合、既知のディスパッチ ラッパー (`env`、`nice`、`nohup`、`stdbuf`、`timeout`) は、ラッパー パスの代わりに内部実行可能パスを保持します。ラップ解除が安全でない場合、ホワイトリストのエントリは自動的に保持されません。

## ディープリンク

アプリは、ローカル アクションの `openclaw://` URL スキームを登録します。

### `openclaw://agent`ゲートウェイ `agent` リクエストをトリガーします

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

クエリパラメータ:

- `message` (必須)
- `sessionKey` (オプション)
- `thinking` (オプション)
- `deliver` / `to` / `channel` (オプション)
- `timeoutSeconds` (オプション)
- `key` (オプションの無人モード キー)

安全性:

- `key` がない場合、アプリは確認を求めます。
- `key` がない場合、アプリは確認プロンプトのショート メッセージ制限を強制し、`deliver` / `to` / `channel` を無視します。
- 有効な `key` を使用すると、実行は無人で行われます (個人的な自動化を目的としています)。

## オンボーディング フロー (一般的)

1. **OpenClaw.app** をインストールして起動します。
2. 権限チェックリストを完了します (TCC プロンプト)。
3. **ローカル** モードがアクティブであり、ゲートウェイが実行されていることを確認します。
4. 端末アクセスが必要な場合は、CLI をインストールします。

## ディレクトリの配置を状態にします (macOS)

OpenClaw 状態ディレクトリを iCloud またはその他のクラウド同期フォルダーに置かないでください。
同期バックされたパスは遅延を追加し、場合によってはファイル ロック/同期競合を引き起こす可能性があります。
セッションと資格情報。

次のようなローカルの非同期状態パスを優先します。

```bash
OPENCLAW_STATE_DIR=~/.openclaw
```

`openclaw doctor` が次の状態を検出した場合:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

警告が表示され、ローカル パスに戻ることが推奨されます。

## ビルドと開発のワークフロー (ネイティブ)- `cd apps/macos && swift build`

- `swift run OpenClaw` (または Xcode)
- パッケージアプリ: `scripts/package-mac-app.sh`

## ゲートウェイ接続のデバッグ (macOS CLI)

デバッグ CLI を使用して、同じゲートウェイ WebSocket ハンドシェイクと検出を実行します。
アプリを起動せずに、macOS アプリが使用するロジック。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

接続オプション:

- `--url <ws://host:port>`: 構成を上書きします
- `--mode <local|remote>`: 構成から解決します (デフォルト: 構成またはローカル)
- `--probe`: 新しい正常性プローブを強制します
- `--timeout <ms>`: リクエストのタイムアウト (デフォルト: `15000`)
- `--json`: 差分用の構造化出力

検出オプション:

- `--include-local`: 「ローカル」としてフィルタリングされるゲートウェイを含めます
- `--timeout <ms>`: 全体的な検出ウィンドウ (デフォルト: `2000`)
- `--json`: 差分用の構造化出力

ヒント: `openclaw gateway discover --json` と比較して、
macOS アプリの検出パイプライン (NWBrowser + テールネット DNS‑SD フォールバック) は、
ノード CLI の `dns-sd` ベースの検出。

## リモート接続配管 (SSH トンネル)

macOS アプリが **リモート** モードで実行されると、SSH トンネルが開かれるため、ローカル UI
コンポーネントは、ローカルホスト上にあるかのようにリモート ゲートウェイと通信できます。

### 制御トンネル (ゲートウェイ WebSocket ポート)- **目的:** ヘルスチェック、ステータス、Web チャット、設定、およびその他のコントロール プレーン呼び出し

- **ローカル ポート:** ゲートウェイ ポート (デフォルト `18789`)、常に安定しています。
- **リモート ポート:** リモート ホスト上の同じゲートウェイ ポート。
- **動作:** ランダムなローカル ポートはありません。アプリは既存の正常なトンネルを再利用します
  または、必要に応じて再起動します。
- **SSH 形状:** `ssh -N -L <local>:127.0.0.1:<remote>` (BatchMode +)
  ExitOnForwardFailure + キープアライブ オプション。
- **IP レポート:** SSH トンネルはループバックを使用するため、ゲートウェイはノードを認識します。
  IP は `127.0.0.1` です。実際のクライアントが必要な場合は、**直接 (ws/wss)** トランスポートを使用してください
  表示される IP ([macOS リモート アクセス](/platforms/mac/remote) を参照)。

セットアップ手順については、[macOS リモート アクセス](/platforms/mac/remote) を参照してください。プロトコル用
詳細については、[ゲートウェイ プロトコル](/gateway/protocol) を参照してください。

## 関連ドキュメント

- [ゲートウェイ ランブック](/gateway)
- [ゲートウェイ (macOS)](/platforms/mac/bundled-gateway)
- [macOS 権限](/platforms/mac/permissions)
- [キャンバス](/platforms/mac/canvas)
