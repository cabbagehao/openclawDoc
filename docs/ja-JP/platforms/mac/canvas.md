---
summary: "WKWebView + カスタム URL スキームを介して埋め込まれたエージェント制御のキャンバス パネル"
read_when:
  - macOS キャンバス パネルの実装
  - ビジュアルワークスペースのエージェントコントロールの追加
  - WKWebView キャンバスのロードのデバッグ
title: "キャンバス"
x-i18n:
  source_hash: "b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1"
---

# キャンバス (macOS アプリ)

macOS アプリには、`WKWebView` を使用してエージェント制御の **キャンバス パネル**が埋め込まれています。それ
HTML/CSS/JS、A2UI、および小規模なインタラクティブな軽量のビジュアル ワークスペースです。
UI サーフェス。

## Canvas が存在する場所

キャンバスの状態は、アプリケーション サポートの下に保存されます。

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、**カスタム URL スキーム** を介してこれらのファイルを提供します。

- `openclaw-canvas://<session>/<path>`

例:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

`index.html` がルートに存在しない場合、アプリは **組み込みのスキャフォールド ページ**を表示します。

## パネルの動作

- メニュー バー (またはマウス カーソル) の近くに固定された、枠のないサイズ変更可能なパネル。
- セッションごとにサイズ/位置を記憶します。
- ローカルのキャンバス ファイルが変更されると自動再ロードされます。
- 一度に表示できるキャンバス パネルは 1 つだけです (セッションは必要に応じて切り替えられます)。

キャンバスは、[設定] → [**キャンバスを許可**] から無効にできます。無効にすると、キャンバス
ノードコマンドは `CANVAS_DISABLED` を返します。

## エージェント API サーフェス

キャンバスは **ゲートウェイ WebSocket** を介して公開されるため、エージェントは次のことができます。

- パネルの表示/非表示
- パスまたは URL に移動します
- JavaScriptを評価する
- スナップショット画像をキャプチャする

CLI の例:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注:

- `canvas.navigate` は、**ローカル キャンバス パス**、`http(s)` URL、および `file://` URL を受け入れます。
- `"/"` を渡すと、キャンバスにはローカル スキャフォールドまたは `index.html` が表示されます。## キャンバスの A2UI

A2UI はゲートウェイ キャンバス ホストによってホストされ、キャンバス パネル内にレンダリングされます。
ゲートウェイがキャンバス ホストをアドバタイズすると、macOS アプリは自動的に
最初に開いたときの A2UI ホスト ページ。

デフォルトの A2UI ホスト URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI コマンド (v0.8)

Canvas は現在 **A2UI v0.8** サーバー→クライアント メッセージを受け入れます。

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) はサポートされていません。

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

## キャンバスからエージェントを実行するトリガー

Canvas はディープリンク経由で新しいエージェントの実行をトリガーできます。

- `openclaw://agent?...`

例 (JS の場合):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

有効なキーが指定されない限り、アプリは確認を求めます。

## セキュリティに関する注意事項

- Canvas スキームはディレクトリのトラバーサルをブロックします。ファイルはセッション ルートの下に存在する必要があります。
- ローカル キャンバス コンテンツはカスタム スキームを使用します (ループバック サーバーは必要ありません)。
- 外部 `http(s)` URL は、明示的にナビゲートされた場合にのみ許可されます。
