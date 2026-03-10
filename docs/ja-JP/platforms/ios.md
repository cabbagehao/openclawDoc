---
summary: "iOS ノード アプリ: ゲートウェイへの接続、ペアリング、キャンバス、トラブルシューティング"
read_when:
  - iOS ノードのペアリングまたは再接続
  - iOS アプリをソースから実行する
  - ゲートウェイ検出またはキャンバス コマンドのデバッグ
title: "iOSアプリ"
x-i18n:
  source_hash: "aa473aad6bd953b8489c752467c1e4c33532e7b325a992d836fefad449ff960c"
---

# iOS アプリ (ノード)

利用可能状況: 内部プレビュー。 iOS アプリはまだ一般公開されていません。

## 何をするのか

- WebSocket (LAN またはテールネット) 経由でゲートウェイに接続します。
- ノード機能を公開します: キャンバス、画面スナップショット、カメラ キャプチャ、位置情報、トーク モード、音声ウェイク。
- `node.invoke` コマンドを受信し、ノード ステータス イベントを報告します。

## 要件

- 別のデバイス (macOS、Linux、または WSL2 経由の Windows) で実行されているゲートウェイ。
- ネットワークパス:
  - Bonjour経由の同じLAN、**または**
  - ユニキャスト DNS-SD 経由のテールネット (ドメイン例: `openclaw.internal.`)、**または**
  - 手動ホスト/ポート (フォールバック)。

## クイックスタート (ペアリング + 接続)

1. ゲートウェイを起動します。

```bash
openclaw gateway --port 18789
```

2. iOS アプリで、[設定] を開き、検出されたゲートウェイを選択します (または、手動ホストを有効にしてホスト/ポートを入力します)。

3. ゲートウェイ ホストでペアリング要求を承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

4. 接続を確認します。

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 検出パス

### ボンジュール (LAN)

ゲートウェイは `_openclaw-gw._tcp` を `local.` でアドバタイズします。 iOS アプリはこれらを自動的にリストします。

### テールネット (クロスネットワーク)

mDNS がブロックされている場合は、ユニキャスト DNS-SD ゾーン (ドメインを選択します。例: `openclaw.internal.`) と Tailscale 分割 DNS を使用します。
CoreDNS の例については、[Bonjour](/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

[設定] で、**手動ホスト** を有効にし、ゲートウェイのホストとポート (デフォルトは `18789`) を入力します。

## キャンバス + A2UIiOS ノードは WKWebView キャンバスをレンダリングします。 `node.invoke` を使用して駆動します

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注:

- ゲートウェイ キャンバス ホストは、`/__openclaw__/canvas/` および `/__openclaw__/a2ui/` を提供します。
- ゲートウェイ HTTP サーバーから提供されます (`gateway.port` と同じポート、デフォルトは `18789`)。
- キャンバス ホスト URL がアドバタイズされると、iOS ノードは接続時に A2UI に自動的に移動します。
- `canvas.navigate` と `{"url":""}` を使用して組み込み足場に戻ります。

### キャンバスの評価/スナップショット

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + トーク モード

- 音声ウェイクおよび通話モードは設定で利用できます。
- iOS ではバックグラウンド オーディオが一時停止される場合があります。アプリがアクティブでないときは、音声機能をベストエフォートとして扱います。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドに移動します (キャンバス/カメラ/スクリーン コマンドで必要です)。
- `A2UI_HOST_NOT_CONFIGURED`: ゲートウェイはキャンバス ホスト URL をアドバタイズしませんでした。 [ゲートウェイ構成](/gateway/configuration) の `canvasHost` を確認してください。
- ペアリング プロンプトが表示されない: `openclaw devices list` を実行し、手動で承認します。
- 再インストール後に再接続が失敗する: キーチェーン ペアリング トークンがクリアされました。ノードを再ペアリングします。

## 関連ドキュメント

- [ペアリング](/channels/pairing)
- [発見](/gateway/discovery)
- [ボンジュール](/gateway/bonjour)
