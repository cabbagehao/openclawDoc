---
summary: "OpenClaw ゲートウェイ CLI (「openclaw ゲートウェイ」) — ゲートウェイの実行、クエリ、および検出"
read_when:
  - CLI (開発またはサーバー) からゲートウェイを実行する
  - ゲートウェイ認証、バインド モード、および接続のデバッグ
  - Bonjour 経由でのゲートウェイの検出 (LAN + テールネット)
title: "ゲートウェイ"
x-i18n:
  source_hash: "6777ffdef99e09b54bd495e40cb3fee336a511addfed509f715dfe5e8001bddf"
---

# ゲートウェイ CLI

ゲートウェイは OpenClaw の WebSocket サーバー (チャネル、ノード、セッション、フック) です。

このページのサブコマンドは `openclaw gateway …` の下にあります。

関連ドキュメント:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## ゲートウェイを実行する

ローカル ゲートウェイ プロセスを実行します。

```bash
openclaw gateway
```

前景のエイリアス:

```bash
openclaw gateway run
```

注:

- デフォルトでは、`~/.openclaw/openclaw.json` に `gateway.mode=local` が設定されていない限り、ゲートウェイは起動を拒否します。アドホック/開発の実行には `--allow-unconfigured` を使用します。
- 認証なしのループバックを超えるバインディングはブロックされます (安全ガードレール)。
- `SIGUSR1` は、承認されたときにプロセス内再起動をトリガーします (`commands.restart` はデフォルトで有効になっています。手動再起動をブロックするには `commands.restart: false` を設定しますが、ゲートウェイ ツール/構成の適用/更新は許可されたままです)。
- `SIGINT`/`SIGTERM` ハンドラーはゲートウェイ プロセスを停止しますが、カスタム端末状態は復元しません。 CLI を TUI または raw モード入力でラップする場合は、終了する前に端末を復元します。

### オプション- `--port <port>`: WebSocket ポート (デフォルトは config/env から取得されます。通常は `18789`)

- `--bind <loopback|lan|tailnet|auto|custom>`: リスナーバインドモード。
- `--auth <token|password>`: 認証モードのオーバーライド。
- `--token <token>`: トークンのオーバーライド (プロセスの `OPENCLAW_GATEWAY_TOKEN` も設定します)。
- `--password <password>`: パスワードの上書き。警告: インライン パスワードはローカル プロセス リストに公開される可能性があります。
- `--password-file <path>`: ファイルからゲートウェイのパスワードを読み取ります。
- `--tailscale <off|serve|funnel>`: Tailscale 経由でゲートウェイを公開します。
- `--tailscale-reset-on-exit`: シャットダウン時に Tailscale サーブ/ファネル構成をリセットします。
- `--allow-unconfigured`: 構成に `gateway.mode=local` を指定せずにゲートウェイを起動できるようにします。
- `--dev`: 開発構成とワークスペースがない場合は作成します (BOOTSTRAP.md をスキップします)。
- `--reset`: 開発構成 + 認証情報 + セッション + ワークスペースをリセットします (`--dev` が必要)。
- `--force`: 開始する前に、選択したポート上の既存のリスナーを強制終了します。
- `--verbose`: 詳細ログ。
- `--claude-cli-logs`: コンソールに claude-cli ログのみを表示します (そしてその stdout/stderr を有効にします)。
- `--ws-log <auto|full|compact>`: WebSocket ログ スタイル (デフォルト `auto`)。
- `--compact`: `--ws-log compact` のエイリアス。
- `--raw-stream`: 生のモデル ストリーム イベントを jsonl に記録します。
- `--raw-stream-path <path>`: 生のストリーム jsonl パス。

## 実行中のゲートウェイをクエリする

すべてのクエリ コマンドは WebSocket RPC を使用します。

出力モード:- デフォルト: 人間が読める形式 (TTY で色付け)。

- `--json`: 機械可読 JSON (スタイル/スピナーなし)。
- `--no-color` (または `NO_COLOR=1`): ヒューマン レイアウトを維持しながら ANSI を無効にします。

共有オプション (サポートされている場合):

- `--url <url>`: ゲートウェイ WebSocket URL。
- `--token <token>`: ゲートウェイ トークン。
- `--password <password>`: ゲートウェイのパスワード。
- `--timeout <ms>`: タイムアウト/予算 (コマンドごとに異なります)。
- `--expect-final`: 「最終」応答 (エージェントの呼び出し) を待ちます。

注: `--url` を設定すると、CLI は構成または環境の資格情報にフォールバックしません。
`--token` または `--password` を明示的に渡します。明示的な資格情報が欠落しているとエラーになります。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` は、ゲートウェイ サービス (launchd/systemd/schtasks) とオプションの RPC プローブを示しています。

```bash
openclaw gateway status
openclaw gateway status --json
```

オプション:

- `--url <url>`: プローブ URL をオーバーライドします。
- `--token <token>`: プローブのトークン認証。
- `--password <password>`: プローブのパスワード認証。
- `--timeout <ms>`: プローブのタイムアウト (デフォルト `10000`)。
- `--no-probe`: RPC プローブをスキップします (サービスのみのビュー)。
- `--deep`: システムレベルのサービスもスキャンします。

注:- `gateway status` は、可能な場合、プローブ認証用に構成された認証 SecretRef を解決します。

- 必要な認証 SecretRef がこのコマンド パスで解決されていない場合、プローブ認証は失敗する可能性があります。 `--token`/`--password` を明示的に渡すか、最初にシークレット ソースを解決してください。
- Linux systemd インストールでは、サービス認証ドリフト チェックは、ユニットから `Environment=` 値と `EnvironmentFile=` 値の両方を読み取ります (`%h`、引用符で囲まれたパス、複数のファイル、およびオプションの `-` ファイルを含む)。

### `gateway probe`

`gateway probe` は「すべてをデバッグ」コマンドです。常に次のことを調査します。

- 設定済みのリモート ゲートウェイ (設定されている場合)、および
- localhost (ループバック) **リモートが構成されている場合でも**。

複数のゲートウェイに到達可能な場合は、すべてのゲートウェイが出力されます。分離されたプロファイル/ポート (レスキュー ボットなど) を使用する場合、複数のゲートウェイがサポートされますが、ほとんどのインストールでは依然として単一のゲートウェイが実行されます。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

#### SSH 経由のリモート (Mac アプリのパリティ)

macOS アプリの「SSH 経由のリモート」モードはローカル ポート転送を使用するため、リモート ゲートウェイ (ループバックのみにバインドされている可能性があります) が `ws://127.0.0.1:<port>` で到達可能になります。

CLI に相当するもの:

```bash
openclaw gateway probe --ssh user@gateway-host
```

オプション:

- `--ssh <target>`: `user@host` または `user@host:port` (ポートのデフォルトは `22`)。
- `--ssh-identity <path>`: ID ファイル。
- `--ssh-auto`: 最初に検出されたゲートウェイ ホストを SSH ターゲットとして選択します (LAN/WAB のみ)。

構成 (オプション、デフォルトとして使用):- `gateway.remote.sshTarget`

- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベルの RPC ヘルパー。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## ゲートウェイ サービスを管理する

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

注:

- `gateway install` は、`--port`、`--runtime`、`--token`、`--force`、`--json` をサポートします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決されたトークンをサービス環境メタデータに保持しません。
- トークン認証にトークンが必要で、構成されたトークン SecretRef が未解決の場合、フォールバック プレーンテキストを永続化する代わりに、インストールは失敗して閉じられます。
- `gateway run` でのパスワード認証には、インライン `--password` よりも、`OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef をサポートする `gateway.auth.password` を優先します。
- 推論認証モードでは、シェルのみの `OPENCLAW_GATEWAY_PASSWORD`/`CLAWDBOT_GATEWAY_PASSWORD` はインストール トークンの要件を緩和しません。マネージド サービスをインストールするときは、永続的な構成 (`gateway.auth.password` または構成 `env`) を使用します。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が設定されていない場合、モードが明示的に設定されるまでインストールはブロックされます。
- ライフサイクル コマンドは、スクリプト作成に `--json` を受け入れます。

## ゲートウェイの検出 (Bonjour)

`gateway discover` はゲートウェイ ビーコン (`_openclaw-gw._tcp`) をスキャンします。- マルチキャスト DNS-SD: `local.`

- ユニキャスト DNS-SD (ワイドエリア Bonjour): ドメイン (例: `openclaw.internal.`) を選択し、分割 DNS + DNS サーバーを設定します。 [/gateway/bonjour](/gateway/bonjour) を参照してください。

Bonjour 検出が有効になっている (デフォルト) ゲートウェイのみがビーコンをアドバタイズします。

広域検出レコードには次のものが含まれます (TXT):

- `role` (ゲートウェイの役割のヒント)
- `transport` (トランスポートヒント、例: `gateway`)
- `gatewayPort` (WebSocket ポート、通常は `18789`)
- `sshPort` (SSH ポート。存在しない場合はデフォルトの `22`)
- `tailnetDns` (MagicDNS ホスト名、利用可能な場合)
- `gatewayTls` / `gatewayTlsSha256` (TLS 有効 + 証明書フィンガープリント)
- `cliPath` (リモート インストールのオプションのヒント)

### `gateway discover`

```bash
openclaw gateway discover
```

オプション:

- `--timeout <ms>`: コマンドごとのタイムアウト (参照/解決)。デフォルトは `2000` です。
- `--json`: 機械可読出力 (スタイル/スピナーも無効になります)。

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
