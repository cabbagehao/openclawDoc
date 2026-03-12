---
summary: "iOS node app: Gateway への接続、pairing、canvas、troubleshooting"
read_when:
  - iOS node をペアリングまたは再接続するとき
  - iOS app を source から実行するとき
  - gateway discovery や canvas command を切り分けるとき
title: "iOS App"
seoTitle: "OpenClawのiOSアプリの接続設定と利用フローガイド"
description: "提供状況: internal preview。iOS app はまだ一般公開されていません。できること、要件、クイックスタート（pairing + 接続）を確認できます。"
x-i18n:
  source_hash: "aa473aad6bd953b8489c752467c1e4c33532e7b325a992d836fefad449ff960c"
---
提供状況: internal preview。iOS app はまだ一般公開されていません。

## できること

- Gateway へ WebSocket（LAN または tailnet）で接続する
- Canvas、Screen snapshot、Camera capture、Location、Talk mode、Voice wake などの node capability を公開する
- `node.invoke` command を受信し、node status event を報告する

## 要件

- 別デバイス上で動作する Gateway（macOS、Linux、または Windows + WSL2）
- ネットワーク経路:
  - Bonjour を使った同一 LAN、**または**
  - unicast DNS-SD を使った tailnet（例: `openclaw.internal.`）、**または**
  - manual host / port 指定（fallback）

## クイックスタート（pairing + 接続）

1. Gateway を起動する

```bash
openclaw gateway --port 18789
```

2. iOS app で Settings を開き、検出された gateway を選ぶ（または Manual Host を有効にして host / port を入力する）

3. gateway host で pairing request を承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
```

4. 接続を確認する

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## discovery 経路

### Bonjour（LAN）

Gateway は `local.` 上で `_openclaw-gw._tcp` を advertise します。iOS app はこれを自動で一覧表示します。

### tailnet（クロスネットワーク）

mDNS が遮断されている場合は、unicast DNS-SD zone（例: `openclaw.internal.`）と Tailscale split DNS を使います。CoreDNS の例は [Bonjour](/gateway/bonjour) を参照してください。

### manual host / port

Settings で **Manual Host** を有効にし、gateway host と port（デフォルト `18789`）を入力します。

## Canvas + A2UI

iOS node は WKWebView canvas を描画します。`node.invoke` で制御します。

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注:

- Gateway canvas host は `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します
- これは Gateway HTTP server（`gateway.port` と同じポート。デフォルト `18789`）から配信されます
- canvas host URL が advertise されている場合、iOS node は接続時に A2UI へ自動遷移します
- 組み込み scaffold に戻すには `canvas.navigate` と `{"url":""}` を使います

### canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk mode

- Voice wake と Talk mode は Settings から利用できます
- iOS は background audio を一時停止する場合があるため、app 非アクティブ時の voice 機能は best-effort と考えてください

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS app を foreground に戻してください（canvas / camera / screen command に必要です）
- `A2UI_HOST_NOT_CONFIGURED`: gateway が canvas host URL を advertise していません。[Gateway configuration](/gateway/configuration) の `canvasHost` を確認してください
- pairing prompt が出ない: `openclaw devices list` を実行し、手動で承認してください
- 再インストール後に再接続できない: Keychain 上の pairing token が消えているため、node を再ペアリングしてください

## 関連ドキュメント

- [Pairing](/channels/pairing)
- [Discovery](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
