---
summary: "ノード: キャンバス/カメラ/スクリーン/デバイス/通知/システムのペアリング、機能、権限、および CLI ヘルパー"
read_when:
  - iOS/Android ノードとゲートウェイのペアリング
  - エージェントコンテキストにノードキャンバス/カメラを使用する
  - 新しいノード コマンドまたは CLI ヘルパーの追加
title: "ノード"
x-i18n:
  source_hash: "e41328845dfec03dbd9e31b90482ec2cd7aad57491e1aa413bf674eadc58d310"
---

ノード数

**ノード**は、`role: "node"` を使用してゲートウェイ **WebSocket** (オペレーターと同じポート) に接続し、コマンド サーフェス (例: `canvas.*`、`camera.*`、`device.*`、 `notifications.*`、`system.*`) `node.invoke` 経由。プロトコルの詳細: [ゲートウェイ プロトコル](/gateway/protocol)。

レガシートランスポート: [ブリッジプロトコル](/gateway/bridge-protocol) (TCP JSONL; 現在のノードでは非推奨/削除)。

macOS は **ノード モード** でも実行できます。メニューバー アプリはゲートウェイの WS サーバーに接続し、ローカルのキャンバス/カメラ コマンドをノードとして公開します (したがって、`openclaw nodes …` はこの Mac に対して機能します)。

注:

- ノードは**周辺機器**であり、ゲートウェイではありません。彼らはゲートウェイサービスを実行しません。
- 電報/WhatsAppなど。メッセージはノードではなく**ゲートウェイ**に到達します。
- トラブルシューティング ランブック: [/nodes/troubleshooting](/nodes/troubleshooting)

## ペアリング + ステータス

**WS ノードはデバイス ペアリングを使用します。** ノードは `connect` 中にデバイス ID を提示します。ゲートウェイ
`role: node` のデバイス ペアリング リクエストを作成します。デバイスの CLI (または UI) を介して承認します。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

注:

- `nodes status` は、デバイス ペアリングの役割に `node` が含まれている場合、ノードを **ペアリング** としてマークします。
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject`) は別のゲートウェイ所有です
  ノードペアリングストア。 WS `connect` ハンドシェイクをゲート**しません**。## リモートノードホスト (system.run)

ゲートウェイが 1 台のマシン上で実行されており、コマンドが必要な場合は **ノード ホスト** を使用してください
別のもので実行します。モデルは引き続き **ゲートウェイ** と通信します。ゲートウェイ
`host=node` が選択されている場合、`exec` 呼び出しを **ノード ホスト**に転送します。

### 何がどこで実行されるか

- **ゲートウェイ ホスト**: メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。
- **ノード ホスト**: ノード マシン上で `system.run`/`system.which` を実行します。
- **承認**: `~/.openclaw/exec-approvals.json` 経由でノード ホストに適用されます。

### ノードホスト (フォアグラウンド) を起動します

ノードマシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由のリモート ゲートウェイ (ループバック バインド)

ゲートウェイがループバックにバインドされている場合 (`gateway.bind=loopback`、デフォルトはローカル モード)、
リモート ノード ホストは直接接続できません。 SSH トンネルを作成し、
トンネルのローカル側のノード ホスト。

例 (ノードホスト -> ゲートウェイホスト):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注:

- `openclaw node run` は、トークンまたはパスワード認証をサポートします。
- 環境変数が優先されます: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 構成フォールバックは `gateway.auth.token` / `gateway.auth.password` です。リモート モードでは、`gateway.remote.token` / `gateway.remote.password` も対象となります。
- レガシー `CLAWDBOT_GATEWAY_*` 環境変数は、ノード-ホスト認証解決によって意図的に無視されます。

### ノードホスト (サービス) を開始します

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### ペア + 名前

ゲートウェイ ホスト上:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

命名オプション:- `openclaw node run` 上の `--display-name` / `openclaw node install` (ノード上の `~/.openclaw/node.json` に保持されます)。

- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ゲートウェイ オーバーライド)。

### コマンドを許可リストに登録する

実行の承認は **ノード ホストごと**です。ゲートウェイからホワイトリスト エントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認は、`~/.openclaw/exec-approvals.json` のノード ホスト上に存在します。

### ノードで exec をポイントする

デフォルトを構成します (ゲートウェイ構成):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごと:

```
/exec host=node security=allowlist node=<id-or-name>
```

設定すると、`host=node` による `exec` 呼び出しがノード ホスト上で実行されます (
ノードの許可リスト/承認)。

関連:

- [ノードホスト CLI](/cli/node)
- [実行ツール](/tools/exec)
- [幹部の承認](/tools/exec-approvals)

## コマンドの呼び出し

低レベル (生の RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「エージェントにメディア添付ファイルを与える」ワークフローには、より高レベルのヘルパーが存在します。

## スクリーンショット (キャンバス スナップショット)

ノードが Canvas (WebView) を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー (一時ファイルに書き込み、`MEDIA:<path>` を出力します):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### キャンバス コントロール

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注:

- `canvas present` は、URL またはローカル ファイル パス (`--target`) に加えて、位置決め用のオプションの `--x/--y/--width/--height` を受け入れます。
- `canvas eval` は、インライン JS (`--js`) または位置引数を受け入れます。

### A2UI (キャンバス)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- A2UI v0.8 JSONL のみがサポートされています (v0.9/createSurface は拒否されます)。## 写真 + ビデオ (ノードカメラ)

写真 (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

ビデオ クリップ (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注:

- `canvas.*` および `camera.*` に対してノードは **フォアグラウンド** である必要があります (バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します)。
- サイズ超過の Base64 ペイロードを避けるために、クリップの継続時間はクランプされています (現在 `<= 60s`)。
- Android は、可能な場合、`CAMERA`/`RECORD_AUDIO` 権限の入力を求めます。拒否されたアクセス許可は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画 (ノード)

サポートされているノードは `screen.record` (mp4) を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` 可用性はノード プラットフォームによって異なります。
- 画面録画は `<= 60s` に固定されます。
- `--no-audio` は、サポートされているプラ​​ットフォームでのマイク キャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します。

## 場所 (ノード)

設定で位置情報が有効になっている場合、ノードは `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- 位置情報は**デフォルトではオフ**です。
- 「常に」にはシステム許可が必要です。バックグラウンドでの取得はベストエフォート型です。
- 応答には、緯度/経度、精度 (メートル)、およびタイムスタンプが含まれます。

## SMS (Android ノード)

ユーザーが **SMS** 権限を付与し、デバイスがテレフォニーをサポートしている場合、Android ノードは `sms.send` を公開する可能性があります。

低レベルの呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:- 機能がアドバタイズされる前に、Android デバイスで許可プロンプトが受け入れられる必要があります。

- 電話機能のない Wi-Fi 専用デバイスは `sms.send` をアドバタイズしません。

## Android デバイス + 個人データ コマンド

Android ノードは、対応する機能が有効になっている場合、追加のコマンド ファミリをアドバタイズできます。

利用可能なファミリー:

- `device.status`、`device.info`、`device.permissions`、`device.health`
- `notifications.list`、`notifications.actions`
- `photos.latest`
- `contacts.search`、`contacts.add`
- `calendar.events`、`calendar.add`
- `motion.activity`、`motion.pedometer`

例は以下を呼び出します:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注:

- モーション コマンドは、利用可能なセンサーによって機能ゲートされます。

## システムコマンド (ノードホスト/Mac ノード)

macOS ノードは、`system.run`、`system.notify`、および `system.execApprovals.get/set` を公開します。
ヘッドレス ノード ホストは、`system.run`、`system.which`、および `system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

注:- `system.run` は、ペイロード内の stdout/stderr/exit コードを返します。

- `system.notify` は、macOS アプリの通知許可状態を尊重します。
- 認識されないノード `platform` / `deviceFamily` メタデータは、`system.run` および `system.which` を除外する保守的なデフォルトの許可リストを使用します。不明なプラットフォームに対してこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` を介して明示的に追加します。
- `system.run` は、`--cwd`、`--env KEY=VAL`、`--command-timeout`、および `--needs-screen-recording` をサポートします。
- シェル ラッパー (`bash|sh|zsh ... -c/-lc`) の場合、リクエスト スコープの `--env` 値は明示的な許可リスト (`TERM`、`LANG`、`LC_*`、`COLORTERM`、 `NO_COLOR`、`FORCE_COLOR`)。
- ホワイトリスト モードでの常に許可の決定の場合、既知のディスパッチ ラッパー (`env`、`nice`、`nohup`、`stdbuf`、`timeout`) は、ラッパー パスの代わりに内部実行可能パスを保持します。ラップ解除が安全でない場合、ホワイトリストのエントリは自動的に保持されません。
- ホワイトリスト モードの Windows ノード ホストでは、`cmd.exe /c` 経由でシェル ラッパーを実行するには承認が必要です (ホワイトリスト エントリだけではラッパー フォームが自動的に許可されません)。
- `system.notify` は、`--priority <passive|active|timeSensitive>` および `--delivery <system|overlay|auto>` をサポートします。- ノード ホストは `PATH` オーバーライドを無視し、危険なスタートアップ/シェル キー (`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、 `RUBYOPT`、`SHELLOPTS`、`PS4`)。追加の PATH エントリが必要な場合は、`--env` 経由で `PATH` を渡すのではなく、ノード ホスト サービス環境を構成します (または標準の場所にツールをインストールします)。
- macOS ノード モードでは、`system.run` は macOS アプリの実行承認によってゲートされます ([設定] → [実行承認])。
  Ask/allowlist/full はヘッドレス ノード ホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレス ノード ホストでは、`system.run` は実行承認 (`~/.openclaw/exec-approvals.json`) によってゲートされます。

## ノードバインディングを実行する

複数のノードが使用可能な場合は、exec を特定のノードにバインドできます。
これにより、`exec host=node` のデフォルト ノードが設定されます (エージェントごとにオーバーライドできます)。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとのオーバーライド:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

設定を解除すると、任意のノードが許可されます。

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 権限マップ

ノードには、ブール値 (`true` = 許可) を持つ権限名 (例: `screenRecording`、`accessibility`) をキーとした `node.list` / `node.describe` の `permissions` マップが含まれる場合があります。

## ヘッドレス ノード ホスト (クロスプラットフォーム)OpenClaw は、ゲートウェイに接続する **ヘッドレス ノード ホスト** (UI なし) を実行できます

WebSocket を使用して `system.run` / `system.which` を公開します。これは Linux/Windows で便利です
または、サーバーと並行して最小限のノードを実行する場合にも使用できます。

始めましょう:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注:

- ペアリングは依然として必要です (ゲートウェイはデバイスのペアリング プロンプトを表示します)。
- ノード ホストは、ノード ID、トークン、表示名、およびゲートウェイ接続情報を `~/.openclaw/node.json` に保存します。
- 幹部の承認は `~/.openclaw/exec-approvals.json` 経由でローカルに適用されます
  ([幹部の承認](/tools/exec-approvals) を参照)。
- macOS では、ヘッドレス ノード ホストはデフォルトで `system.run` をローカルで実行します。セット
  `OPENCLAW_NODE_EXEC_HOST=app` は、コンパニオン アプリ実行ホスト経由で `system.run` をルーティングします。追加する
  `OPENCLAW_NODE_EXEC_FALLBACK=0` はアプリ ホストを要求し、それが使用できない場合はフェールクローズします。
- Gateway WS が TLS を使用する場合、`--tls` / `--tls-fingerprint` を追加します。

## Mac ノードモード

- macOS メニューバー アプリは、ゲートウェイ WS サーバーにノードとして接続します (したがって、`openclaw nodes …` はこの Mac に対して機能します)。
- リモート モードでは、アプリはゲートウェイ ポートの SSH トンネルを開き、`localhost` に接続します。
