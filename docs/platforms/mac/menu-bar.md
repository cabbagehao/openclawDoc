---
summary: "メニュー バーのステータス ロジックとユーザーに表示される情報"
read_when:
  - Mac のメニュー UI またはステータス ロジックを調整するとき
title: "メニュー バー"
x-i18n:
  source_hash: "8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d"
---
## 表示内容

- 現在のエージェント作業状態は、メニューバー アイコンと、メニュー先頭のステータス行に表示されます。
- 作業中はヘルス状態を非表示にし、すべてのセッションがアイドルへ戻ると再表示します。
- メニュー内の `Nodes` ブロックには、クライアントや presence エントリではなく、**デバイス** のみを表示します。対象は `node.list` でペアリング済みのノードです。
- プロバイダー利用状況のスナップショットがある場合は、Context の下に `Usage` セクションが表示されます。

## 状態モデル

- Sessions: イベントには実行単位の `runId` と、ペイロード内の `sessionKey` が含まれます。`main` セッションは `main` キーで識別し、存在しない場合は最後に更新されたセッションへフォールバックします。
- Priority: 常に main を優先します。main がアクティブならその状態を即座に表示し、main がアイドルなら、直近でアクティブだった non-main セッションを表示します。動作中に表示が頻繁に入れ替わることはなく、現在のセッションがアイドルになるか、main がアクティブになったときだけ切り替えます。
- Activity kinds:
  - `job`: 高レベルのコマンド実行（`state: started|streaming|done|error`）
  - `tool`: `phase: start|result` と `toolName`、`meta/args`

## `IconState` 列挙型（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（デバッグ用オーバーライド）

### `ActivityKind` → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### 視覚表現

- `idle`: 通常の critter を表示します。
- `workingMain`: glyph 付きバッジ、フルの tint、脚の `working` アニメーションを表示します。
- `workingOther`: glyph 付きバッジを muted tint で表示し、scurry は行いません。
- `overridden`: 実際のアクティビティに関係なく、選択した glyph と tint を使います。

## ステータス行の文言（メニュー）

- 作業中: `<Session role> · <activity label>`
  - 例: `Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`
- アイドル時: ヘルス サマリー表示に戻ります。

## イベント取り込み

- Source: control-channel の `agent` イベント（`ControlChannel.handleAgentEvent`）
- 解析対象フィールド:
  - `stream: "job"` と `data.state` による開始 / 停止
  - `stream: "tool"` と `data.phase`、`name`、任意の `meta` / `args`
- Labels:
  - `exec`: `args.command` の 1 行目
  - `read` / `write`: 短縮したパス
  - `edit`: パスと `meta` / diff 件数から推測した変更種別
  - fallback: ツール名

## デバッグ用オーバーライド

- Settings ▸ Debug ▸ `Icon override` picker:
  - `System (auto)`（既定）
  - `Working: main`（ツール種別ごと）
  - `Working: other`（ツール種別ごと）
  - `Idle`
- 値は `@AppStorage("iconOverride")` で保存され、`IconState.overridden` に対応付けられます。

## テスト チェックリスト

- main セッションの job を発火し、アイコンが即座に切り替わり、ステータス行に main ラベルが出ることを確認します。
- main がアイドルの状態で non-main セッションの job を発火し、アイコンとステータスが non-main を示し、終了まで安定していることを確認します。
- 他セッションが動作中に main を開始し、アイコンがすぐ main に切り替わることを確認します。
- ツール実行が短時間に連続しても、バッジがちらつかないことを確認します（tool result に TTL の猶予を設けます）。
- すべてのセッションがアイドルに戻ったら、ヘルス行が再表示されることを確認します。
