---
summary: "計画: CDP を使用してブラウザの act:evaluate を Playwright のキューから分離し、エンドツーエンドの期限管理と安全な参照解決を実現する"
read_when:
  - ブラウザツールにおける `act:evaluate` のタイムアウト、中断、またはキューのブロッキング問題を修正する場合
  - evaluate 実行のための CDP ベースの分離構成を計画する場合
owner: "openclaw"
status: "draft"
last_updated: "2026-02-10"
title: "OpenClawブラウザEvaluateのCDP分離リファクタリング計画と設計論点"
description: "act:evaluate は、ページ内でユーザー指定の JavaScript を実行する機能です。現在は Playwright (page.evaluate または locator.evaluate) 経由で実行されています。"
x-i18n:
  source_hash: "7176b8e2d41c3114657e57262938089635c7dbb3617c20ac796c2f8957e9dac2"
---
## 背景

`act:evaluate` は、ページ内でユーザー指定の JavaScript を実行する機能です。現在は Playwright (`page.evaluate` または `locator.evaluate`) 経由で実行されています。Playwright はページごとに CDP コマンドをシリアル化（直列化）するため、evaluate がスタックしたり長時間実行されたりすると、そのページのコマンドキューがブロックされ、その後の操作がすべて「スタック」したように見えてしまいます。

PR #13498 では実用的なセーフティネット（限定的な evaluate、中断の伝播、ベストエフォートでの復旧）が追加されました。本ドキュメントでは、`act:evaluate` を Playwright から本質的に分離し、スタックした実行が通常の Playwright 操作を妨げないようにする、より大規模なリファクタリングについて説明します。

## 目標

- `act:evaluate` が、同じタブにおけるその後のブラウザ操作を永続的にブロックしないようにする。
- タイムアウト設定をエンドツーエンドで唯一の「真実のソース」とし、呼び出し側が時間枠（バジェット）を信頼できるようにする。
- HTTP 経由およびインプロセスでのディスパッチの両方で、中断（Abort）とタイムアウトを同一に扱う。
- すべての機能を Playwright から切り替えることなく、evaluate での要素指定（targeting）をサポートする。
- 既存の呼び出し側やペイロードとの後方互換性を維持する。

## 非目標

- すべてのブラウザ操作（click, type, wait 等）を CDP 実装に置き換えること。
- PR #13498 で導入された既存のセーフティネットを削除すること（有用なフォールバックとして残します）。
- 既存の `browser.evaluateEnabled` ゲートを超えて、新しい安全でない機能を導入すること。
- evaluate のためのプロセス分離（ワーカープロセス/スレッド）を追加すること。本リファクタリング後も復旧困難なスタック状態が続くようであれば、今後の検討課題とします。

## 現在のアーキテクチャ（スタックする原因）

大まかな流れ:
- 呼び出し側が `act:evaluate` をブラウザ制御サービスに送信。
- ルートハンドラーが Playwright を呼び出して JavaScript を実行。
- Playwright はページコマンドをシリアル化するため、終了しない evaluate がキューをブロック。
- キューがスタックすると、その後の click/type/wait 操作がハングしたように見える。

## 提案するアーキテクチャ

### 1. 期限 (Deadline) の伝播

単一の「バジェット（時間枠）」という概念を導入し、すべてをそこから導出します:
- 呼び出し側が `timeoutMs`（または将来の期限）を設定。
- 外部リクエストのタイムアウト、ルートハンドラーのロジック、およびページ内での実行バジェットのすべてが同じバジェットを共有し、シリアル化のオーバーヘッドのためにわずかな余裕（ヘッドルーム）を持たせる。
- 中止（Abort）は `AbortSignal` としてどこへでも伝播され、一貫したキャンセルを実現。

実装の方向性:
- 以下を返す小さなヘルパー（例: `createBudget({ timeoutMs, signal })`）を追加:
  - `signal`: 紐付けられた AbortSignal
  - `deadlineAtMs`: 絶対的な期限（時刻）
  - `remainingMs()`: 子操作に割り当て可能な残り時間
- 以下の箇所でこのヘルパーを使用:
  - `src/browser/client-fetch.ts` (HTTP およびインプロセスディスパッチ)
  - `src/node-host/runner.ts` (プロキシパス)
  - ブラウザアクションの実装（Playwright および CDP）

### 2. evaluate エンジンの分離 (CDP パス)

Playwright のページごとのコマンドキューを共有しない、CDP ベースの evaluate 実装を追加します。重要なポイントは、evaluate 用の通信路が独立した WebSocket 接続であり、ターゲットにアタッチされた個別の CDP セッションであることです。

実装の方向性:
- 新しいモジュール（例: `src/browser/cdp-evaluate.ts`）を作成し、以下を実行:
  - 構成済みの CDP エンドポイント（ブラウザレベルのソケット）に接続。
  - `Target.attachToTarget({ targetId, flatten: true })` を使用して `sessionId` を取得。
  - ページレベルの実行には `Runtime.evaluate` を、要素レベルの実行には `DOM.resolveNode` + `Runtime.callFunctionOn` を使用。
- タイムアウトまたは中断時:
  - セッションに対してベストエフォートで `Runtime.terminateExecution` を送信。
  - WebSocket を閉じ、明確なエラーを返す。

補足:
- 依然としてページ内で JavaScript を実行するため、強制終了には副作用が伴う可能性があります。メリットは、Playwright のキューを固めることがなく、CDP セッションを破棄することで通信レイヤーでのキャンセルが可能になる点です。

### 3. 参照（Ref）の扱い (大幅な書き換えなしでの要素指定)

難関は要素指定です。CDP には DOM ハンドルまたは `backendDOMNodeId` が必要ですが、現在はスナップショットの参照に基づく Playwright のロケーターを使用しています。

推奨アプローチ: 既存の参照（ref）を維持しつつ、オプションで CDP 解決可能な ID を付加します。

#### 3.1 保存される参照情報の拡張
ロール参照のメタデータを拡張し、CDP ID を含められるようにします:
- 現状: `{ role, name, nth }`
- 提案: `{ role, name, nth, backendDOMNodeId?: number }`

これにより、既存の Playwright ベースのアクションを維持したまま、`backendDOMNodeId` が利用可能な場合には CDP evaluate を実行できるようになります。

#### 3.2 スナップショット生成時の ID 取得
ロールスナップショットを生成する際、以下の処理を行います:
1. 現在と同様にロール参照マップ（role, name, nth）を生成。
2. CDP (`Accessibility.getFullAXTree`) 経由で AX ツリーを取得し、同一の重複判定ルールを用いて `(role, name, nth) -> backendDOMNodeId` の並列マップを計算。
3. 取得した ID を現在のタブの参照情報にマージして保存。

マッピングに失敗した場合は `backendDOMNodeId` を未定義のままにします。これにより、本機能はベストエフォート（可能な範囲で実施）かつ安全に導入できます。

#### 3.3 参照を用いた evaluate の挙動
`act:evaluate` において:
- `ref` があり、かつ `backendDOMNodeId` が存在する場合、CDP 経由で要素 evaluate を実行。
- `ref` はあるが `backendDOMNodeId` がない場合、Playwright パス（セーフティネット付き）へフォールバック。

オプションの回避策:
- 高度な利用者やデバッグ向けに、`ref` とは別に `backendDOMNodeId` を直接受け取れるようにリクエスト形式を拡張。

### 4. 最終手段としての復旧パスの維持
CDP evaluate を導入しても、タブや接続が固まる要因は他にもあります。以下のケースのための「最終手段」として、既存の復旧メカニズム（実行終了 + Playwright 切断）を維持します:
- レガシーな呼び出し側
- CDP アタッチがブロックされている環境
- 予期せぬ Playwright のエッジケース

## 実装計画

### 成果物
- Playwright のコマンドキュー外で動作する CDP ベースの evaluate エンジン。
- 呼び出し側とハンドラーで一貫して使用される、単一のエンドツーエンドの期限/中断バジェット。
- 要素 evaluate のために `backendDOMNodeId` を保持可能な参照メタデータ。
- 可能な限り CDP エンジンを優先し、不可な場合にのみ Playwright へフォールバックする `act:evaluate`。
- スタックした evaluate がその後の操作を妨げないことを証明するテスト。
- 失敗やフォールバックを可視化するログ/メトリクス。

### 実装チェックリスト
1. `timeoutMs` + `AbortSignal` を統合する共通の「バジェット（時間枠）」ヘルパーを追加。
2. すべての呼び出しパスを更新し、`timeoutMs` の意味をどこでも統一。
3. `src/browser/cdp-evaluate.ts` の実装。
4. 参照メタデータを拡張し、`backendDOMNodeId` を保持可能にする。
5. スナップショット作成時に `backendDOMNodeId` をベストエフォートで取得・マージ。
6. `act:evaluate` のルーティング処理を更新（CDP 優先、Playwright フォールバック）。
7. 既存の復旧パスをデフォルトではなくフォールバックとして維持。
8. テストの追加（スタックした evaluate が後続の click を妨げないこと、中断が正しく機能すること、マッピング失敗時の適切なフォールバック等）。
9. 可観測性の向上（所要時間、タイムアウト、強制終了の使用回数、フォールバック率等の記録）。

### 合格基準
- 意図的にハングさせた `act:evaluate` が呼び出し側の時間枠内で終了し、その後の操作（click 等）が正常に行えること。
- `timeoutMs` が CLI、エージェントツール、ノードプロキシ、インプロセス呼び出しのすべてにおいて一貫した挙動を示すこと。
- `ref` が `backendDOMNodeId` にマッピング可能な場合は CDP が使用され、そうでない場合もフォールバックパスで安全に復旧可能であること。

## テスト計画
- ユニットテスト: ロール参照と AX ツリーノードのマッチングロジック、バジェットヘルパーの計算。
- 結合テスト: CDP evaluate のタイムアウトが適切に返り、次をブロックしないこと。中断が適切に実行終了をトリガーすること。
- コントラクトテスト: `BrowserActRequest` と `BrowserActResponse` の互換性維持の確認。

## リスクと緩和策
- マッピングの不完全さ: ベストエフォートでのマッピング、Playwright へのフォールバック、およびデバッグツールの提供で対応。
- `Runtime.terminateExecution` の副作用: タイムアウト/中断時のみに使用し、エラー内容にその旨を明記。
- オーバーヘッドの増加: スナップショット要求時のみ AX ツリーを取得し、ターゲットごとにキャッシュして CDP セッションを短命に保つ。
- 拡張機能リレーの制限: ページごとのソケットが利用できない場合はブラウザレベルのアタッチ API を使用し、既存の Playwright パスもフォールバックとして維持。
