---
summary: "Android アプリ (ノード): 接続 Runbook + Connect/Chat/Voice/Canvas コマンド サーフェス"
read_when:
  - Android ノードのペアリングまたは再接続
  - Android ゲートウェイの検出または認証のデバッグ
  - クライアント間でのチャット履歴の同等性の検証
title: "Androidアプリ"
x-i18n:
  source_hash: "39e9206a770d78adc09aa35c30cecfb07093605a7f432d942b68014332b3c56b"
---

# Android アプリ (ノード)

## スナップショットのサポート

- 役割: コンパニオン ノード アプリ (Android はゲートウェイをホストしません)。
- ゲートウェイが必要: はい (macOS、Linux、または Windows 上で WSL2 経由で実行します)。
- インストール: [はじめに](/start/getting-started) + [ペアリング](/channels/pairing)。
- ゲートウェイ: [ランブック](/gateway) + [構成](/gateway/configuration)。
  - プロトコル: [ゲートウェイ プロトコル](/gateway/protocol) (ノード + コントロール プレーン)。

## システム制御

システム制御 (launchd/systemd) はゲートウェイ ホスト上にあります。 [ゲートウェイ](/gateway) を参照してください。

## 接続ランブック

Android ノード アプリ ⇄ (mDNS/NSD + WebSocket) ⇄ **ゲートウェイ**

Android は、ゲートウェイ WebSocket (デフォルト `ws://<host>:18789`) に直接接続し、デバイス ペアリング (`role: node`) を使用します。

### 前提条件

- 「マスター」マシン上でゲートウェイを実行できます。
- Android デバイス/エミュレータはゲートウェイ WebSocket に到達できます。
  - mDNS/NSD を使用した同じ LAN、**または**
  - Wide-Area Bonjour / ユニキャスト DNS-SD を使用した同じ Tailscale テールネット (以下を参照)、**または**
  - 手動ゲートウェイ ホスト/ポート (フォールバック)
- ゲートウェイ マシン上で (または SSH 経由で) CLI (`openclaw`) を実行できます。

### 1) ゲートウェイを開始します

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような内容が表示されることを確認します。

- `listening on ws://0.0.0.0:18789`

テールネットのみのセットアップ (ウィーン ⇄ ロンドンに推奨) の場合は、ゲートウェイをテールネット IP にバインドします。- ゲートウェイ ホストの `~/.openclaw/openclaw.json` に `gateway.bind: "tailnet"` を設定します。

- Gateway / macOS メニューバー アプリを再起動します。

### 2) 検出の検証 (オプション)

ゲートウェイ マシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

その他のデバッグ メモ: [Bonjour](/gateway/bonjour)。

#### ユニキャスト DNS-SD 経由のテールネット (ウィーン ⇄ ロンドン) 検出

Android NSD/mDNS 検出はネットワークを越えません。 Android ノードとゲートウェイが異なるネットワーク上にあるものの、Tailscale 経由で接続されている場合は、代わりに Wide-Area Bonjour / ユニキャスト DNS-SD を使用します。

1. ゲートウェイ ホスト上に DNS-SD ゾーン (例 `openclaw.internal.`) を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. その DNS サーバーを指す、選択したドメインの Tailscale スプリット DNS を構成します。

CoreDNS 構成の詳細と例: [Bonjour](/gateway/bonjour)。

### 3) Android から接続する

Android アプリの場合:

- アプリは、**フォアグラウンド サービス** (永続的な通知) を介してゲートウェイ接続を維持します。
- [**接続**] タブを開きます。
- **セットアップ コード** または **手動** モードを使用します。
- 検出がブロックされている場合は、**高度な制御**で手動のホスト/ポート (および必要に応じて TLS/トークン/パスワード) を使用します。

最初のペアリングが成功すると、Android は起動時に自動的に再接続します。

- 手動エンドポイント (有効な場合)、それ以外の場合
- 最後に検出されたゲートウェイ (ベストエフォート)。

### 4) ペアリングの承認 (CLI)

ゲートウェイ マシン上で次のようにします。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [ペアリング](/channels/pairing)。

### 5) ノードが接続されていることを確認します

- ノード経由のステータス:

  ```bash
  openclaw nodes status
  ```

- ゲートウェイ経由:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) チャット + 履歴

Android の [チャット] タブでは、セッションの選択がサポートされています (デフォルトの `main` と他の既存のセッション)。

- 履歴: `chat.history`
- 送信: `chat.send`
- プッシュ更新 (ベストエフォート): `chat.subscribe` → `event:"chat"`

### 7) キャンバス + カメラ

#### ゲートウェイ キャンバス ホスト (Web コンテンツに推奨)

エージェントがディスク上で編集できる実際の HTML/CSS/JS をノードに表示したい場合は、ノードをゲートウェイ キャンバス ホストにポイントします。

注: ノードはゲートウェイ HTTP サーバー (`gateway.port` と同じポート、デフォルトは `18789`) からキャンバスをロードします。

1. ゲートウェイ ホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。

2. ノードをそのノード (LAN) に移動します。

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

テールネット (オプション): 両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名またはテールネット IP を使用します。 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーはライブ リロード クライアントを HTML に挿入し、ファイルの変更時にリロードします。
A2UI ホストは `http://<gateway-host>:18789/__openclaw__/a2ui/` にあります。

Canvas コマンド (前景のみ):

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate` (デフォルトのスキャフォールドに戻すには、`{"url":""}` または `{"url":"/"}` を使用します)。 `canvas.snapshot` は `{ format, base64 }` (デフォルトは `format="jpeg"`) を返します。
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` レガシー エイリアス)

カメラ コマンド (前景のみ、許可ゲート型):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

パラメータと CLI ヘルパーについては、[カメラ ノード](/nodes/camera) を参照してください。

### 8) 音声 + 拡張された Android コマンド サーフェス

- 音声: Android は、トランスクリプト キャプチャと TTS 再生を備えた [音声] タブで単一のマイク オン/オフ フローを使用します (イレブンラボが構成されている場合、システム TTS フォールバック)。アプリがフォアグラウンドを離れると音声が停止します。
- 音声ウェイク/トークモードの切り替えは現在、Android UX/ランタイムから削除されています。
- 追加の Android コマンド ファミリ (利用できるかどうかはデバイスと権限によって異なります):
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `motion.activity`、`motion.pedometer`
