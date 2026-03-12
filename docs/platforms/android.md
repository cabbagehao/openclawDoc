---
summary: "Android アプリ（node）: 接続 runbook と Connect / Chat / Voice / Canvas の command surface"
read_when:
  - Android node をペアリングまたは再接続するとき
  - Android 側の gateway discovery や認証を切り分けるとき
  - クライアント間で chat history の整合性を確認するとき
title: "Android App"
seoTitle: "OpenClawのAndroidアプリの接続設定とペアリング運用ガイド"
description: "system 制御（launchd / systemd）は Gateway host 側にあります。詳しくは Gateway を参照してください。サポート概要、system 制御、接続 runbookを確認できます。"
x-i18n:
  source_hash: "39e9206a770d78adc09aa35c30cecfb07093605a7f432d942b68014332b3c56b"
---
## サポート概要

- 役割: companion node app（Android 自体は Gateway をホストしません）
- Gateway 必須: はい（macOS、Linux、または Windows + WSL2 上で実行）
- install: [Getting Started](/start/getting-started) + [Pairing](/channels/pairing)
- gateway: [Runbook](/gateway) + [Configuration](/gateway/configuration)
  - protocol: [Gateway protocol](/gateway/protocol)（nodes + control plane）

## system 制御

system 制御（launchd / systemd）は Gateway host 側にあります。詳しくは [Gateway](/gateway) を参照してください。

## 接続 runbook

Android node app ⇄（mDNS / NSD + WebSocket）⇄ **Gateway**

Android は Gateway WebSocket（デフォルト `ws://<host>:18789`）へ直接接続し、device pairing（`role: node`）を使います。

### 前提条件

- “master” マシン上で Gateway を実行できる
- Android device / emulator から Gateway WebSocket へ到達できる
  - 同一 LAN 上で mDNS / NSD を使う、**または**
  - 同一 Tailscale tailnet 上で Wide-Area Bonjour / unicast DNS-SD を使う（後述）、**または**
  - 手動で gateway host / port を指定する（fallback）
- Gateway マシン上で `openclaw` CLI を使える（または SSH 越しに実行できる）

### 1) Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような表示が出ることを確認してください。

- `listening on ws://0.0.0.0:18789`

tailnet 専用構成（Vienna ⇄ London のような構成に推奨）では、gateway を tailnet IP に bind します。

- Gateway host 上の `~/.openclaw/openclaw.json` に `gateway.bind: "tailnet"` を設定する
- Gateway / macOS menubar app を再起動する

### 2) discovery を確認する（任意）

gateway machine 上で:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

追加のデバッグメモは [Bonjour](/gateway/bonjour) を参照してください。

#### tailnet（Vienna ⇄ London）での unicast DNS-SD discovery

Android の NSD / mDNS discovery はネットワーク境界を越えません。Android node と gateway が別ネットワーク上にあり、Tailscale で接続している場合は、代わりに Wide-Area Bonjour / unicast DNS-SD を使います。

1. gateway host 上に DNS-SD zone（例: `openclaw.internal.`）を設定し、`_openclaw-gw._tcp` record を公開する
2. その DNS server を向くように、選んだ domain の Tailscale split DNS を設定する

詳細と CoreDNS 設定例は [Bonjour](/gateway/bonjour) を参照してください。

### 3) Android から接続する

Android app 側では:

- app は **foreground service**（永続 notification）により gateway connection を維持します
- **Connect** タブを開く
- **Setup Code** または **Manual** mode を使う
- discovery が通らない場合は **Advanced controls** で手動 host / port を設定し、必要に応じて TLS / token / password も指定する

最初の pairing が成功した後は、Android は起動時に自動再接続します。

- manual endpoint が有効ならそれを使う
- そうでなければ、最後に検出した gateway へ best-effort で再接続する

### 4) pairing を承認する（CLI）

gateway machine 上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

pairing の詳細は [Pairing](/channels/pairing) を参照してください。

### 5) node が接続済みか確認する

- nodes status 経由:

  ```bash
  openclaw nodes status
  ```

- Gateway 経由:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat と履歴

Android の Chat タブでは session selection をサポートしています（デフォルトの `main` と、その他の既存 session を選択可能）。

- 履歴: `chat.history`
- 送信: `chat.send`
- push update（best-effort）: `chat.subscribe` → `event:"chat"`

### 7) Canvas と camera

#### Gateway Canvas Host（Web コンテンツ向け推奨）

agent が disk 上で編集できる本物の HTML / CSS / JS を node に表示したい場合は、node を Gateway canvas host へ向けます。

注: node は Gateway HTTP server（`gateway.port` と同じポート。デフォルト `18789`）から canvas を読み込みます。

1. gateway host 上に `~/.openclaw/workspace/canvas/index.html` を作成する

2. node をその URL へ移動する（LAN）

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（任意）: 両端末が Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使います。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

この server は HTML へ live-reload client を注入し、ファイル変更時に自動 reload します。A2UI host は `http://<gateway-host>:18789/__openclaw__/a2ui/` にあります。

Canvas command（foreground 限定）:

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`
  デフォルト scaffold へ戻すには `{"url":""}` または `{"url":"/"}` を使います。`canvas.snapshot` は `{ format, base64 }` を返し、デフォルトの `format` は `"jpeg"` です
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset`（legacy alias: `canvas.a2ui.pushJSONL`）

camera command（foreground 限定、権限ゲートあり）:

- `camera.snap`（jpg）
- `camera.clip`（mp4）

パラメータや CLI helper は [Camera node](/nodes/camera) を参照してください。

### 8) Voice と拡張 Android command surface

- Voice: Android は Voice タブで単一の mic on / off フローを使い、transcript capture と TTS playback を行います（ElevenLabs が設定されていればそれを使用し、なければ system TTS へ fallback します）。app が foreground を離れると Voice は停止します
- voice wake / talk-mode toggle は、現時点では Android の UX / runtime から削除されています
- 追加の Android command family（利用可否は device と permission に依存）:
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `motion.activity`、`motion.pedometer`
