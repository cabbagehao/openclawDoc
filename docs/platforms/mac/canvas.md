---
summary: "WKWebView とカスタム URL スキームで埋め込まれた、エージェント制御の Canvas パネル"
read_when:
  - macOS キャンバス パネルの実装
  - ビジュアルワークスペースのエージェントコントロールの追加
  - WKWebView キャンバスのロードのデバッグ
title: "Canvas"
seoTitle: "OpenClawのmacOS Canvas の仕組み・設定手順・運用ガイド"
description: "macOS アプリには、WKWebView を使ったエージェント制御の Canvas パネルが組み込まれています。これは HTML / CSS / JS、A2UI、小規模なインタラクティブ UI を扱うための軽量なビジュアル ワークスペースです。"
x-i18n:
  source_hash: "b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1"
---
macOS アプリには、`WKWebView` を使ったエージェント制御の **Canvas パネル**が組み込まれています。これは HTML / CSS / JS、A2UI、小規模なインタラクティブ UI を扱うための軽量なビジュアル ワークスペースです。

## Canvas の保存場所

Canvas の状態は Application Support 配下に保存されます。

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、これらのファイルを **カスタム URL スキーム** 経由で配信します。

- `openclaw-canvas://<session>/<path>`

例:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

ルートに `index.html` が存在しない場合は、アプリが **組み込みのスキャフォールド ページ** を表示します。

## パネルの挙動

- メニューバー付近、またはマウスカーソル付近に表示される、枠なしでリサイズ可能なパネルです。
- サイズと位置はセッションごとに記憶されます。
- ローカルの Canvas ファイルが変更されると自動で再読み込みされます。
- 同時に表示できる Canvas パネルは 1 つだけで、必要に応じてセッションが切り替わります。

Canvas は、設定の **Allow Canvas** から無効化できます。無効な場合、Canvas ノード コマンドは `CANVAS_DISABLED` を返します。

## エージェント API

Canvas は **ゲートウェイ WebSocket** 経由で公開されるため、エージェントは次の操作を実行できます。

- パネルの表示と非表示
- パスまたは URL への移動
- JavaScript の評価
- スナップショット画像の取得

CLI の例:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注:

- `canvas.navigate` は **ローカル Canvas パス**、`http(s)` URL、`file://` URL を受け付けます。
- `"/"` を渡すと、Canvas にはローカルのスキャフォールド、または `index.html` が表示されます。

## Canvas 上の A2UI

A2UI はゲートウェイの Canvas host によって配信され、Canvas パネル内に描画されます。ゲートウェイが Canvas host を通知している場合、macOS アプリは最初に Canvas を開いたとき、自動的に A2UI host ページへ移動します。

デフォルトの A2UI host URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI コマンド（v0.8）

Canvas は現在、**A2UI v0.8** の server-to-client メッセージを受け付けます。

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface`（v0.9）はサポートされていません。

CLI の例:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

クイックスモーク:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas からエージェント実行を開始する

Canvas はディープリンク経由で新しいエージェント実行を開始できます。

- `openclaw://agent?...`

例（JS の場合）:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

有効なキーが指定されていない限り、アプリは確認ダイアログを表示します。

## セキュリティに関する注意事項

- Canvas スキームではディレクトリ トラバーサルを防止しており、ファイルは必ずセッション ルート配下に置く必要があります。
- ローカル Canvas コンテンツはカスタム スキームで提供されるため、ループバック サーバーは不要です。
- 外部 `http(s)` URL は、明示的にナビゲートされた場合にのみ許可されます。
