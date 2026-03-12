---
summary: "ノード: ペアリング、機能、権限、canvas / camera / screen / device / notifications / system 用 CLI helper"
read_when:
  - iOS / Android node を gateway にペアリングするとき
  - エージェントコンテキスト用に node の canvas / camera を使うとき
  - 新しい node command や CLI helper を追加するとき
title: "Nodes"
seoTitle: "OpenClawのノード機能の一覧と接続方式・活用シーンガイド"
description: "node は companion device（macOS / iOS / Android / headless）であり、role: \"node\" を使って Gateway の WebSocket（operator と同じポート）へ接続し、node.invoke 経由で。"
x-i18n:
  source_hash: "e41328845dfec03dbd9e31b90482ec2cd7aad57491e1aa413bf674eadc58d310"
---
**node** は companion device（macOS / iOS / Android / headless）であり、`role: "node"` を使って Gateway の **WebSocket**（operator と同じポート）へ接続し、`node.invoke` 経由で command surface（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開します。protocol の詳細は [Gateway protocol](/gateway/protocol) を参照してください。

legacy transport は [Bridge protocol](/gateway/bridge-protocol) です（TCP JSONL。現行 node では deprecated / removed）。

macOS は **node mode** でも動作できます。menubar app が Gateway の WS server に接続し、ローカルの canvas / camera command を node として公開するため、`openclaw nodes ...` をこの Mac 自身に対して使えます。

注:

- node は **peripheral** であり gateway ではありません。gateway service 自体は実行しません
- Telegram / WhatsApp などのメッセージは node ではなく **gateway** に着信します
- トラブルシューティング手順は [/nodes/troubleshooting](/nodes/troubleshooting) を参照してください

## ペアリングと状態

**WS node は device pairing を使います。** node は `connect` 時に device identity を提示し、Gateway は `role: node` 用の device pairing request を作成します。承認は devices CLI（または UI）で行います。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

注:

- `nodes status` は、device pairing role に `node` が含まれている場合、その node を **paired** と表示します
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject`）は、gateway 管理の別の node pairing store です。WS の `connect` handshake を制御するものでは **ありません**

## リモート node host（system.run）

Gateway が 1 台のマシンで動作しており、別のマシン上で command を実行したい場合は **node host** を使います。model は引き続き **gateway** と会話し、`host=node` が選ばれているときに gateway が `exec` call を **node host** へ転送します。

### どこで何が実行されるか

- **Gateway host**: メッセージを受信し、model を実行し、tool call をルーティングする
- **Node host**: node 側マシンで `system.run` / `system.which` を実行する
- **Approvals**: node host 上の `~/.openclaw/exec-approvals.json` で適用される

### node host を起動する（foreground）

node 側マシンで実行:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tunnel 経由で remote gateway に接続する（loopback bind）

Gateway が loopback に bind している場合（`gateway.bind=loopback`。local mode のデフォルト）、remote node host は直接接続できません。SSH tunnel を作成し、そのローカル終端へ node host を向けてください。

例（node host -> gateway host）:

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注:

- `openclaw node run` は token 認証と password 認証の両方をサポートします
- 環境変数 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` の利用を推奨します
- config のフォールバックは `gateway.auth.token` / `gateway.auth.password` です。remote mode では `gateway.remote.token` / `gateway.remote.password` も候補になります
- legacy の `CLAWDBOT_GATEWAY_*` 環境変数は、node-host 認証解決では意図的に無視されます

### node host を起動する（service）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### ペアリングと命名

gateway host 側:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

命名方法:

- `openclaw node run` / `openclaw node install` の `--display-name`（node 側の `~/.openclaw/node.json` に永続化される）
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 側 override）

### command を allowlist に追加する

exec approval は **node host ごと** に管理されます。gateway 側から allowlist entry を追加できます。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

approval 情報は node host 上の `~/.openclaw/exec-approvals.json` に保存されます。

### exec を node に向ける

gateway config でデフォルトを設定:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

または session ごと:

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後は、`host=node` 付きの `exec` call が node host 上で実行されます（node 側 allowlist / approval に従います）。

関連:

- [Node host CLI](/cli/node)
- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)

## コマンドの呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

「エージェントへ MEDIA 添付を渡す」系の一般的な用途には、より高レベルな helper も用意されています。

## スクリーンショット（canvas snapshot）

node 上で Canvas（WebView）が表示されている場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI helper（temp file に書き出し、`MEDIA:<path>` を表示）:

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas controls

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注:

- `canvas present` は URL またはローカルファイルパス（`--target`）を受け付け、必要なら `--x/--y/--width/--height` で位置も指定できます
- `canvas eval` は inline JS（`--js`）か、位置引数のどちらでも渡せます

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- サポートするのは A2UI v0.8 JSONL のみです（v0.9 / createSurface は拒否されます）

## 写真と動画（node camera）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注:

- `canvas.*` と `camera.*` は node が **foreground** のときだけ実行できます（background 呼び出しは `NODE_BACKGROUND_UNAVAILABLE`）
- clip の duration は oversized な base64 payload を避けるため、現在 `<= 60s` にクランプされます
- Android では、可能なら `CAMERA` / `RECORD_AUDIO` 権限要求が表示され、拒否された場合は `*_PERMISSION_REQUIRED` で失敗します

## 画面録画（nodes）

サポートされる node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` の可用性は node platform に依存します
- 画面録画は `<= 60s` に制限されます
- `--no-audio` は、対応 platform でマイクキャプチャを無効化します
- 複数 display がある場合は `--screen <index>` で対象 display を選択できます

## 位置情報（nodes）

settings で location が有効な場合、node は `location.get` を公開します。

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- 位置情報は **デフォルトで off** です
- “Always” は system permission を必要とし、background fetch は best-effort です
- 応答には lat / lon、accuracy（meter）、timestamp が含まれます

## SMS（Android nodes）

ユーザーが **SMS** 権限を付与し、かつデバイスが telephony をサポートしている場合、Android node は `sms.send` を公開できます。

低レベル呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- capability が advertise される前に、Android device 上で permission prompt を許可しておく必要があります
- telephony を持たない Wi-Fi 専用 device は `sms.send` を advertise しません

## Android device と個人データ系コマンド

Android node は、対応 capability が有効な場合に追加の command family を advertise できます。

利用可能な family:

- `device.status`、`device.info`、`device.permissions`、`device.health`
- `notifications.list`、`notifications.actions`
- `photos.latest`
- `contacts.search`、`contacts.add`
- `calendar.events`、`calendar.add`
- `motion.activity`、`motion.pedometer`

呼び出し例:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注:

- motion command は、利用可能な sensor に応じて capability-gated されます

## system command（node host / mac node）

macOS node は `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。headless node host は `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

注:

- `system.run` は payload 内に stdout / stderr / exit code を返します
- `system.notify` は macOS app 側の通知権限状態に従います
- 未認識の node `platform` / `deviceFamily` metadata には、`system.run` と `system.which` を除外した保守的なデフォルト allowlist を適用します。未知の platform で意図的にこれらを許可したい場合は `gateway.nodes.allowCommands` で明示追加してください
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします
- shell wrapper（`bash|sh|zsh ... -c/-lc`）では、request 単位の `--env` 値は明示 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に縮約されます
- allowlist mode での allow-always 決定では、既知の dispatch wrapper（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）については wrapper path ではなく内部 executable path を永続化します。安全に unwrap できない場合、allowlist entry は自動保存されません
- Windows node host の allowlist mode では、`cmd.exe /c` 経由の shell-wrapper 実行には approval が必要です（allowlist entry だけでは wrapper 形式は自動許可されません）
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします
- node host は `PATH` 上書きを無視し、危険な startup / shell key（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）を除去します。追加の PATH entry が必要なら、`--env` で `PATH` を渡すのではなく、node host service 環境を設定するか標準パスへ tool を配置してください
- macOS node mode では、`system.run` は macOS app の exec approvals（Settings → Exec approvals）でゲートされます。Ask / allowlist / full の挙動は headless node host と同じで、拒否された prompt は `SYSTEM_RUN_DENIED` を返します
- headless node host では、`system.run` は `~/.openclaw/exec-approvals.json` による exec approvals でゲートされます

## exec の node binding

複数 node が利用可能な場合、exec を特定の node へ bind できます。これにより `exec host=node` 用のデフォルト node が決まり、agent ごとに上書きも可能です。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

agent ごとの override:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

binding を解除して任意の node を許可する:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## permissions map

node は `node.list` / `node.describe` に `permissions` map を含める場合があります。キーは permission 名（例: `screenRecording`、`accessibility`）、値は boolean（`true` = granted）です。

## headless node host（cross-platform）

OpenClaw は、UI を持たない **headless node host** を実行できます。これは Gateway WebSocket へ接続し、`system.run` / `system.which` を公開します。Linux / Windows や、server と並行して最小構成の node を動かしたい場合に有用です。

起動:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注:

- pairing は引き続き必要で、Gateway 側には device pairing prompt が表示されます
- node host は node id、token、display name、gateway 接続情報を `~/.openclaw/node.json` に保存します
- exec approvals は `~/.openclaw/exec-approvals.json` によりローカルで適用されます（[Exec approvals](/tools/exec-approvals) を参照）
- macOS では、headless node host はデフォルトで `system.run` をローカル実行します。`OPENCLAW_NODE_EXEC_HOST=app` を設定すると companion app の exec host 経由に切り替わります。`OPENCLAW_NODE_EXEC_FALLBACK=0` を追加すると app host 必須となり、利用不能時は fail closed します
- Gateway WS が TLS を使う場合は `--tls` / `--tls-fingerprint` を追加してください

## Mac node mode

- macOS menubar app は Gateway WS server に node として接続するため、`openclaw nodes ...` をこの Mac に対して実行できます
- remote mode では、アプリが Gateway port 向けの SSH tunnel を開き、`localhost` へ接続します
