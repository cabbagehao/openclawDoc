---
summary: "コアおよびプラグインベースのランタイムのファーストクラス ACP コントロール プレーンを介して ACP コーディング エージェントを統合します (acpx ファースト)"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "ACP スレッドバインドされたエージェント"
x-i18n:
  source_hash: "c98e5e02f369fb4a849906d02b9c8e58f227effd6383aea58c2e3d5a75348e55"
---

# ACP スレッドバインドされたエージェント

## 概要

この計画は、OpenClaw が実稼働レベルのライフサイクルとリカバリを備えたスレッド対応チャネル (最初は Discord) で ACP コーディング エージェントをサポートする方法を定義します。

関連文書:

- [統合ランタイムストリーミングリファクタリング計画](/experiments/plans/acp-unified-streaming-refactor)

対象となるユーザー エクスペリエンス:

- ユーザーが ACP セッションをスレッドに生成またはフォーカスします
- そのスレッド内のユーザー メッセージは、バインドされた ACP セッションにルーティングされます。
- エージェントの出力ストリームは同じスレッド ペルソナに戻されます
- セッションは永続的にすることも、明示的なクリーンアップ制御を使用してワンショットにすることもできます

## 決定の概要

長期的な推奨事項は、ハイブリッド アーキテクチャです。

- OpenClaw コアには ACP コントロール プレーンに関する懸念があります
  - セッション ID とメタデータ
  - スレッドのバインディングとルーティングの決定
  - 配信不変条件と重複抑制
  - ライフサイクルのクリーンアップとリカバリのセマンティクス
- ACP ランタイム バックエンドはプラグ可能です
  - 最初のバックエンドは acpx-backed プラグイン サービスです
  - ランタイムは ACP トランスポート、キューイング、キャンセル、再接続を行います

OpenClaw はコアで ACP トランスポート内部を再実装しないでください。
OpenClaw は、ルーティングのために純粋なプラグインのみのインターセプト パスに依存すべきではありません。

## 北極建築 (聖杯)

ACP を、プラグ可能なランタイム アダプターを備えた OpenClaw のファーストクラスのコントロール プレーンとして扱います。

交渉不可能な不変条件:- すべての ACP スレッド バインディングは有効な ACP セッション レコードを参照します

- すべての ACP セッションには明示的なライフサイクル状態があります (`creating`、`idle`、`running`、`cancelling`、`closed`、`error`)
- すべての ACP 実行には明示的な実行状態があります (`queued`、`running`、`completed`、`failed`、`cancelled`)
- スポーン、バインド、および最初のエンキューはアトミックです
- コマンドの再試行はべき等です (重複した実行や重複した Discord 出力はありません)
- バインド スレッド チャネルの出力は ACP 実行イベントの投影であり、アドホックな副作用はありません

長期所有モデル:

- `AcpSessionManager` は単一の ACP ライターおよびオーケストレーターです
- マネージャーは最初にゲートウェイプロセスに存在します。後で同じインターフェースの背後にある専用のサイドカーに移動できます
- ACP セッション キーごとに、マネージャーは 1 つのメモリ内アクターを所有します (シリアル化されたコマンド実行)
- アダプター (`acpx`、将来のバックエンド) はトランスポート/ランタイム実装のみです

長期永続性モデル:

- ACP コントロール プレーンの状態を OpenClaw 状態ディレクトリの下の専用 SQLite ストア (WAL モード) に移動します。
- `SessionEntry.acp` を、信頼できる情報源ではなく、移行中の互換性予測として保持します。
- ACP イベントを追加専用で保存して、リプレイ、クラッシュ回復、確定的配信をサポートします

### 配信戦略 (聖杯への架け橋)- 短期ブリッジ

- 現在のスレッド バインディング メカニズムと既存の ACP 構成サーフェスを維持します
- メタデータ ギャップのバグを修正し、ACP ターンを単一のコア ACP ブランチ経由でルーティングします。
- べき等性キーとフェールクローズされたルーティング チェックをすぐに追加します
- 長期的なカットオーバー
  - ACP の信頼できる情報源をコントロール プレーン DB + アクターに移動
  - 純粋にイベント投影ベースでバインドされたスレッド配信を行う
  - 日和見的なセッション エントリ メタデータに依存する従来のフォールバック動作を削除します

## 純粋なプラグインだけではだめな理由

現在のプラグイン フックでは、コアを変更せずにエンドツーエンドの ACP セッション ルーティングを行うには十分ではありません。

- スレッド バインディングからのインバウンド ルーティングは、最初にコア ディスパッチでセッション キーに解決されます
- メッセージ フックはファイア アンド フォーゲットであり、メインの応答パスを短絡することはできません
- プラグイン コマンドは制御操作には適していますが、コアごとのターン ディスパッチ フローの置き換えには適していません。

結果:

- ACP ランタイムはプラグイン化可能
- ACP ルーティング ブランチがコアに存在する必要があります

## 再利用する既存の基盤

すでに実装されており、正規のままにする必要があります。- スレッド バインディング ターゲットは `subagent` および `acp` をサポートします

- インバウンドスレッドルーティングのオーバーライドは、通常のディスパッチの前にバインドすることで解決されます。
- 返信配信時の Webhook 経由のアウトバウンド スレッド ID
- `/focus` および `/unfocus` フローは ACP ターゲットと互換性があります
- 起動時に復元できる永続的なバインディング ストア
- アーカイブのライフサイクルのバインド解除、削除、フォーカス解除、リセット、および削除

この計画は、その基盤を置き換えるのではなく、拡張します。

## アーキテクチャ

### 境界モデル

コア (OpenClaw コア内にある必要があります):

- 応答パイプラインの ACP セッション モード ディスパッチ ブランチ
- 親スレッドとスレッドの重複を避けるための配信調停
- ACP コントロール プレーンの永続性 (移行中の `SessionEntry.acp` 互換性プロジェクションを使用)
- セッションのリセット/削除に関連付けられたライフサイクル アンバインドとランタイム デタッチ セマンティクス

プラグイン バックエンド (acpx 実装):

- ACP ランタイムワーカーの監視
- acpx プロセスの呼び出しとイベントの解析
- ACP コマンド ハンドラー (`/acp ...`) およびオペレーター UX
- バックエンド固有の設定のデフォルトと診断

### ランタイム所有権モデル

- 1 つのゲートウェイ プロセスが ACP オーケストレーション状態を所有します
- ACP の実行は、acpx バックエンドを介して監視された子プロセスで実行されます。
- プロセス戦略は、メッセージごとではなく、アクティブな ACP セッション キーごとに長く存続します。

これにより、すべてのプロンプトでの起動コストが回避され、キャンセルと再接続のセマンティクスの信頼性が維持されます。

### コアランタイム契約コア ACP ランタイム コントラクトを追加すると、ルーティング コードが CLI の詳細に依存せず、ディスパッチ ロジックを変更せずにバックエンドを切り替えることができます

```ts
export type AcpRuntimePromptMode = "prompt" | "steer";

export type AcpRuntimeHandle = {
  sessionKey: string;
  backend: string;
  runtimeSessionName: string;
};

export type AcpRuntimeEvent =
  | { type: "text_delta"; stream: "output" | "thought"; text: string }
  | { type: "tool_call"; name: string; argumentsText: string }
  | { type: "done"; usage?: Record<string, number> }
  | { type: "error"; code: string; message: string; retryable?: boolean };

export interface AcpRuntime {
  ensureSession(input: {
    sessionKey: string;
    agent: string;
    mode: "persistent" | "oneshot";
    cwd?: string;
    env?: Record<string, string>;
    idempotencyKey: string;
  }): Promise<AcpRuntimeHandle>;

  submit(input: {
    handle: AcpRuntimeHandle;
    text: string;
    mode: AcpRuntimePromptMode;
    idempotencyKey: string;
  }): Promise<{ runtimeRunId: string }>;

  stream(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId: string;
    onEvent: (event: AcpRuntimeEvent) => Promise<void> | void;
    signal?: AbortSignal;
  }): Promise<void>;

  cancel(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId?: string;
    reason?: string;
    idempotencyKey: string;
  }): Promise<void>;

  close(input: { handle: AcpRuntimeHandle; reason: string; idempotencyKey: string }): Promise<void>;

  health?(): Promise<{ ok: boolean; details?: string }>;
}
```

実装の詳細:

- 最初のバックエンド: `AcpxRuntime` プラグイン サービスとして出荷
- コアはレジストリを介してランタイムを解決し、ACP ランタイム バックエンドが使用できない場合は明示的なオペレータ エラーで失敗します。

### コントロールプレーンのデータモデルと永続性

長期的な信頼できる情報源は、トランザクション更新とクラッシュセーフなリカバリのための専用の ACP SQLite データベース (WAL モード) です。- `acp_sessions`

- `session_key` (パッケージ)、`backend`、`agent`、`mode`、`cwd`、`state`、`created_at`、 `updated_at`、`last_error`
- `acp_runs`
  - `run_id` (PK)、`session_key` (FK)、`state`、`requester_message_id`、`idempotency_key`、`started_at`、`ended_at`、 `error_code`、`error_message`
- `acp_bindings`
  - `binding_key` (PK)、`thread_id`、`channel_id`、`account_id`、`session_key` (FK)、`expires_at`、`bound_at`
- `acp_events`
  - `event_id` (PK)、`run_id` (FK)、`seq`、`kind`、`payload_json`、`created_at`
- `acp_delivery_checkpoint`
  - `run_id` (PK/FK)、`last_event_seq`、`last_discord_message_id`、`updated_at`
- `acp_idempotency`
  - `scope`、`idempotency_key`、`result_json`、`created_at`、一意の `(scope, idempotency_key)`

```ts
export type AcpSessionMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

保管ルール:

- 移行中の互換性予測として `SessionEntry.acp` を保持します
- プロセス ID とソケットはメモリ内にのみ残ります
- 耐久性のあるライフサイクルと実行ステータスは、汎用セッション JSON ではなく、ACP DB に保存されます。
- ランタイム所有者が死亡した場合、ゲートウェイは ACP DB からリハイドレートし、チェックポイントから再開します

### ルーティングと配送

インバウンド:- 現在のスレッド バインディング ルックアップを最初のルーティング ステップとして保持します

- バインドされたターゲットが ACP セッションの場合、`getReplyFromConfig` ではなく ACP ランタイム ブランチにルーティングします。
- 明示的な `/acp steer` コマンドは `mode: "steer"` を使用します

アウトバウンド:

- ACP イベント ストリームは OpenClaw 応答チャンクに正規化されます
- 配信ターゲットは、既存のバインドされた宛先パスを通じて解決されます
- バインドされたスレッドがそのセッションターンでアクティブである場合、親チャネルの完了は抑制されます

ストリーミングポリシー:

- 合体ウィンドウを使用したストリーム部分出力
- Discordのレート制限内に収まるように設定可能な最小間隔と最大チャンクバイト
- 完了または失敗時に常に最終メッセージが出力されます

### ステートマシンとトランザクション境界

セッションステートマシン:

- `creating -> idle -> running -> idle`
- `running -> cancelling -> idle | error`
- `idle -> closed`
- `error -> idle | closed`

ステートマシンを実行します。

- `queued -> running -> completed`
- `running -> failed | cancelled`
- `queued -> cancelled`

必要なトランザクション境界:

- トランザクションの生成
  - ACPセッション行を作成します
  - ACP スレッド バインディング行の作成/更新
  - 最初の実行行をキューに入れる
- 取引を終了する
  - セッションを終了としてマークします
  - バインディング行の削除/期限切れ
  - 最終クローズイベントを書き込む
- 取引をキャンセルする
  - ターゲット実行のキャンセルをマーク/冪等キーでキャンセル

これらの境界を越えて部分的に成功することは許されません。

### セッションごとのアクター モデル

`AcpSessionManager` は、ACP セッション キーごとに 1 つのアクターを実行します。- アクター メールボックスは、`submit`、`cancel`、`close`、および `stream` の副作用をシリアル化します。

- アクターは、そのセッションのランタイム ハンドル ハイドレーションとランタイム アダプター プロセスのライフサイクルを所有します。
- アクターは、Discord の配信前に実行イベントを順番に書き込みます (`seq`)。
- アクターは、アウトバウンド送信が成功した後に配信チェックポイントを更新します

これにより、クロスターンレースが排除され、スレッドの出力が重複したり順序が狂ったりすることがなくなります。

### 冪等性と配信予測

すべての外部 ACP アクションは冪等性キーを運ぶ必要があります。

- 冪等性キーを生成する
- プロンプト/ステアべき等性キー
- べき等性キーをキャンセルします
- 冪等性キーを閉じる

配送ルール:

- Discord メッセージは `acp_events` と `acp_delivery_checkpoint` から派生しています。
- 再試行は、すでに配信されたチャンクを再送信せずにチェックポイントから再開します
- 最終応答の出力は、投影ロジックからの実行ごとに 1 回だけです

### 回復と自己修復

ゲートウェイの起動時:

- 非ターミナル ACP セッションをロードします (`creating`、`idle`、`running`、`cancelling`、`error`)
- 最初のインバウンドイベントでアクターを遅延的に再作成するか、構成された上限の下で積極的にアクターを再作成します
- 欠落しているハートビートを実行している `running` を調整し、`failed` をマークするか、アダプター経由で回復します

受信した Discord スレッド メッセージ:- バインディングは存在するが ACP セッションが見つからない場合、明示的な stale-binding メッセージでフェールクローズされます。

- オプションで、オペレーターセーフ検証後に古いバインディングを自動アンバインドします
- 古い ACP バインディングを通常の LLM パスにサイレントにルーティングしないでください。

### ライフサイクルと安全性

サポートされている操作:

- 現在の実行をキャンセル: `/acp cancel`
- スレッドのバインド解除: `/unfocus`
- ACP セッションを閉じる: `/acp close`
- 効果的な TTL によりアイドル状態のセッションを自動終了します

TTL ポリシー:

- 有効な TTL は最小値です
  - グローバル/セッション TTL
  - DiscordスレッドバインディングTTL
  - ACP ランタイム所有者 TTL

安全管理:

- ACP エージェントを名前で許可リストに登録します
- ACP セッションのワークスペース ルートを制限する
- 環境許可リストのパススルー
- アカウントごとおよびグローバルでの最大同時 ACP セッション
- ランタイムクラッシュに対する制限付き再起動バックオフ

## 構成サーフェス

コアキー:

- `acp.enabled`
- `acp.dispatch.enabled` (独立した ACP ルーティング キル スイッチ)
- `acp.backend` (デフォルトは `acpx`)
- `acp.defaultAgent`
- `acp.allowedAgents[]`
- `acp.maxConcurrentSessions`
- `acp.stream.coalesceIdleMs`
- `acp.stream.maxChunkChars`
- `acp.runtime.ttlMinutes`
- `acp.controlPlane.store` (`sqlite` デフォルト)
- `acp.controlPlane.storePath`
- `acp.controlPlane.recovery.eagerActors`
- `acp.controlPlane.recovery.reconcileRunningAfterMs`
- `acp.controlPlane.checkpoint.flushEveryEvents`
- `acp.controlPlane.checkpoint.flushEveryMs`
- `acp.idempotency.ttlHours`
- `channels.discord.threadBindings.spawnAcpSessions`

プラグイン/バックエンド キー (acpx プラグイン セクション):- バックエンドコマンド/パスの上書き

- バックエンド環境の許可リスト
- エージェントごとのバックエンドのプリセット
- バックエンドの起動/停止タイムアウト
- セッションごとのバックエンドの最大インフライト実行数

## 実装仕様

### コントロールプレーンモジュール (新規)

専用の ACP コントロール プレーン モジュールをコアに追加します。

- `src/acp/control-plane/manager.ts`
  - ACP アクター、ライフサイクル遷移、コマンドのシリアル化を所有します。
- `src/acp/control-plane/store.ts`
  - SQLite スキーマ管理、トランザクション、クエリ ヘルパー
- `src/acp/control-plane/events.ts`
  - 型付き ACP イベント定義とシリアル化
- `src/acp/control-plane/checkpoint.ts`
  - 耐久性のある配信チェックポイントと再生カーソル
- `src/acp/control-plane/idempotency.ts`
  - 冪等性キーの予約と応答の再生
- `src/acp/control-plane/recovery.ts`
  - 起動時の調整とアクターの再水和計画

互換性のあるブリッジ モジュール:

- `src/acp/runtime/session-meta.ts`
  - `SessionEntry.acp` への投影のために一時的に残ります
  - 移行カットオーバー後は、信頼できる情報源であることを停止する必要があります

### 必須の不変式 (コード内で強制する必要があります)

- ACP セッションの作成とスレッド バインドはアトミックです (単一トランザクション)
- ACP セッション アクターごとに一度にアクティブな実行は最大 1 つです
- イベント `seq` は実行ごとに厳密に増加しています
- 配信チェックポイントが最後にコミットされたイベントを超えて進むことはありません
- 冪等性リプレイは、重複したコマンド キーに対する以前の成功ペイロードを返します
- 古い/欠落している ACP メタデータは、通常の非 ACP 応答パスにルーティングできません

### 主要なタッチポイント

変更するコアファイル:- `src/auto-reply/reply/dispatch-from-config.ts`

- ACP ブランチ呼び出し `AcpSessionManager.submit` とイベント投影配信
- コントロールプレーンの不変条件をバイパスする直接 ACP フォールバックを削除します
- `src/auto-reply/reply/inbound-context.ts` (または最も近い正規化されたコンテキスト境界)
  - ACP コントロール プレーンの正規化されたルーティング キーと冪等性シードを公開します
- `src/config/sessions/types.ts`
  - `SessionEntry.acp` を投影専用の互換性フィールドとして保持します
- `src/gateway/server-methods/sessions.ts`
  - リセット/削除/アーカイブでは、ACP マネージャーを呼び出す必要があります。トランザクション パスを閉じる/バインド解除します。
- `src/infra/outbound/bound-delivery-router.ts`
  - ACP バインドされたセッション ターンに対してフェールクローズされた宛先動作を強制します
- `src/discord/monitor/thread-bindings.ts`
  - コントロール プレーン ルックアップに接続された ACP の古いバインディング検証ヘルパーを追加します
- `src/auto-reply/reply/commands-acp.ts`
  - ACP マネージャー API を介したルートの生成/キャンセル/クローズ/ステアリング
- `src/agents/acp-spawn.ts`
  - アドホックなメタデータの書き込みを停止します。 ACP マネージャーを呼び出してトランザクションを生成する
- `src/plugin-sdk/**` とプラグイン ランタイム ブリッジ
  - ACP バックエンド登録とヘルス セマンティクスをクリーンに公開します

コア ファイルは明示的に置き換えられません:

- `src/discord/monitor/message-handler.preflight.ts`
  - 正規のセッションキーリゾルバーとしてスレッドバインディングオーバーライド動作を維持します

### ACP ランタイム レジストリ API

コア レジストリ モジュールを追加します。

- `src/acp/runtime/registry.ts`

必要な API:

```ts
export type AcpRuntimeBackend = {
  id: string;
  runtime: AcpRuntime;
  healthy?: () => boolean;
};

export function registerAcpRuntimeBackend(backend: AcpRuntimeBackend): void;
export function unregisterAcpRuntimeBackend(id: string): void;
export function getAcpRuntimeBackend(id?: string): AcpRuntimeBackend | null;
export function requireAcpRuntimeBackend(id?: string): AcpRuntimeBackend;
```

動作:- `requireAcpRuntimeBackend` が利用できない場合、型付き ACP バックエンド欠落エラーをスローします

- プラグイン サービスは `start` でバックエンドを登録し、`stop` で登録を解除します
- 実行時ルックアップは読み取り専用でプロセスローカルです

### acpx ランタイム プラグイン コントラクト (実装の詳細)

最初の運用バックエンド (`extensions/acpx`) の場合、OpenClaw と acpx は次のとおりです。
厳密なコマンド コントラクトに接続されています。

- バックエンド ID: `acpx`
- プラグイン サービス ID: `acpx-runtime`
- ランタイムハンドルエンコーディング: `runtimeSessionName = acpx:v1:<base64url(json)>`
- エンコードされたペイロード フィールド:
  - `name` (acpx という名前のセッション。OpenClaw `sessionKey` を使用)
  - `agent` (acpxエージェントコマンド)
  - `cwd` (セッション ワークスペース ルート)
  - `mode` (`persistent | oneshot`)

コマンドマッピング:

- セッションを確保します:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions ensure --name <name>`
- プロンプトターン:
  - `acpx --format json --json-strict --cwd <cwd> <agent> prompt --session <name> --file -`
- キャンセル:
  - `acpx --format json --json-strict --cwd <cwd> <agent> cancel --session <name>`
- 閉じる:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions close <name>`

ストリーミング:

- OpenClaw は `acpx --format json --json-strict` からの ndjson イベントを消費します
- `text` => `text_delta/output`
- `thought` => `text_delta/thought`
- `tool_call` => `tool_call`
- `done` => `done`
- `error` => `error`

### セッションスキーマパッチ

`src/config/sessions/types.ts` のパッチ `SessionEntry`:

```ts
type SessionAcpMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

永続フィールド:

- `SessionEntry.acp?: SessionAcpMeta`

移行ルール:- フェーズ A: デュアル書き込み (`acp` プロジェクション + ACP SQLite 真実の情報源)

- フェーズ B: ACP SQLite からのプライマリ読み取り、レガシー `SessionEntry.acp` からのフォールバック読み取り
- フェーズ C: 移行コマンドは、有効なレガシー エントリから欠落している ACP 行をバックフィルします。
- フェーズ D: フォールバック読み取りを削除し、UX のみのプロジェクションをオプションのままにします
- 従来のフィールド (`cliSessionIds`、`claudeCliSessionId`) は変更されません。

### エラー契約

安定した ACP エラー コードとユーザー向けメッセージを追加します。

- `ACP_BACKEND_MISSING`
  - メッセージ: `ACP runtime backend is not configured. Install and enable the acpx runtime plugin.`
- `ACP_BACKEND_UNAVAILABLE`
  - メッセージ: `ACP runtime backend is currently unavailable. Try again in a moment.`
- `ACP_SESSION_INIT_FAILED`
  - メッセージ: `Could not initialize ACP session runtime.`
- `ACP_TURN_FAILED`
  - メッセージ: `ACP turn failed before completion.`

ルール:

- 実用的なユーザーセーフメッセージをスレッド内に返します
- 詳細なバックエンド/システム エラーをランタイム ログにのみ記録します
- ACP ルーティングが明示的に選択されている場合、サイレントに通常の LLM パスにフォールバックすることはありません

### 重複配送の調停

ACP バウンド ターンの単一ルーティング ルール:

- ターゲット ACP セッションおよびリクエスタ コンテキストに対してアクティブなスレッド バインディングが存在する場合、そのバインドされたスレッドにのみ配信します
- 同じターンの親チャンネルにも送信しないでください
- バインドされた宛先の選択があいまいな場合、明示的なエラーでフェールクローズされます (暗黙的な親フォールバックはありません)。
- アクティブなバインディングが存在しない場合は、通常のセッション宛先動作を使用します。

### 可観測性と運用準備

必要なメトリクス:- バックエンドおよびエラー コード別の ACP 生成の成功/失敗数

- ACP 実行レイテンシーのパーセンタイル (キューの待機時間、ランタイムのターンタイム、配信予測時間)
- ACP アクターの再起動回数と再起動の理由
- 古いバインディングの検出数
- 冪等性リプレイヒット率
- Discord配信の再試行とレート制限カウンター

必要なログ:

- `sessionKey`、`runId`、`backend`、`threadId`、`idempotencyKey` をキーとする構造化ログ
- セッションおよび実行ステートマシンの明示的な状態遷移ログ
- リダクションセーフな引数と終了概要を含むアダプター コマンド ログ

必要な診断:

- `/acp sessions` には、状態、アクティブな実行、最後のエラー、バインディング ステータスが含まれます
- `/acp doctor` (または同等のもの) は、バックエンドの登録、ストアの健全性、および古いバインディングを検証します。

### 設定の優先順位と有効な値

ACP 有効化の優先順位:

- アカウントの上書き: `channels.discord.accounts.<id>.threadBindings.spawnAcpSessions`
- チャネルオーバーライド: `channels.discord.threadBindings.spawnAcpSessions`
- グローバル ACP ゲート: `acp.enabled`
- ディスパッチゲート: `acp.dispatch.enabled`
- バックエンドの可用性: `acp.backend` の登録済みバックエンド

自動有効化の動作:

- ACP が構成されている場合 (`acp.enabled=true`、`acp.dispatch.enabled=true`、または
  `acp.backend=acpx`)、プラグイン自動有効マーク `plugins.entries.acpx.enabled=true`
  拒否リストに登録されているか明示的に無効にされていない限り

TTL実効値：

- `min(session ttl, discord thread binding ttl, acp runtime ttl)`

### テストマップ

単体テスト:- `src/acp/runtime/registry.test.ts` (新規)

- `src/auto-reply/reply/dispatch-from-config.acp.test.ts` (新規)
- `src/infra/outbound/bound-delivery-router.test.ts` (ACP フェールクローズされたケースを拡張)
- `src/config/sessions/types.test.ts` または最も近いセッションストア テスト (ACP メタデータ永続性)

統合テスト:

- `src/discord/monitor/reply-delivery.test.ts` (バインドされた ACP 配信ターゲットの動作)
- `src/discord/monitor/message-handler.preflight*.test.ts` (バインドされた ACP セッション キーのルーティングの継続性)
- バックエンド パッケージでの acpx プラグイン ランタイム テスト (サービスの登録/開始/停止 + イベントの正規化)

ゲートウェイ e2e テスト:

- `src/gateway/server.sessions.gateway-server-sessions-a.e2e.test.ts` (ACP リセット/ライフサイクル範囲の削除)
- ACP スレッドは、生成、メッセージ、ストリーム、キャンセル、フォーカス解除、回復の再開のためにラウンドトリップ e2e を回転します

### ロールアウトガード

独立した ACP ディスパッチ キル スイッチを追加します。

- `acp.dispatch.enabled` 最初のリリースのデフォルト `false`
- 無効の場合:
  - ACP スポーン/フォーカス制御コマンドは引き続きセッションをバインドする可能性があります
  - ACP ディスパッチ パスがアクティブ化されない
  - ユーザーは、ACP ディスパッチがポリシーによって無効になっているという明示的なメッセージを受け取ります
- カナリア検証後、後のリリースではデフォルトを `true` に切り替えることができます

## コマンドと UX 計画

### 新しいコマンド

- `/acp spawn <agent-id> [--mode persistent|oneshot] [--thread auto|here|off]`
- `/acp cancel [session]`
- `/acp steer <instruction>`
- `/acp close [session]`
- `/acp sessions`

### 既存のコマンドの互換性

- `/focus <sessionKey>` は引き続き ACP ターゲットをサポートします
- `/unfocus` は現在のセマンティクスを維持します
- `/session idle` および `/session max-age` は古い TTL オーバーライドを置き換えます

## 段階的なロールアウト

### フェーズ 0 ADR とスキーマの凍結- ACP コントロール プレーンの所有権とアダプター境界の ADR を出荷

- DB スキーマの凍結 (`acp_sessions`、`acp_runs`、`acp_bindings`、`acp_events`、`acp_delivery_checkpoint`、`acp_idempotency`)
- 安定した ACP エラー コード、イベント コントラクト、および状態遷移ガードを定義します。

### フェーズ 1 コアのコントロール プレーン基盤

- `AcpSessionManager` とセッションごとのアクター ランタイムを実装する
- ACP SQLite ストアおよびトランザクション ヘルパーを実装する
- 冪等性ストアとリプレイヘルパーを実装する
- イベント追加 + 配信チェックポイント モジュールを実装する
- トランザクション保証付きで、生成/キャンセル/クローズ API をマネージャーに接続します

### フェーズ 2 コア ルーティングとライフサイクルの統合

- ルート スレッド バインド ACP がディスパッチ パイプラインから ACP マネージャーに変わります
- ACP バインディング/セッションの不変条件が失敗した場合にフェールクローズド ルーティングを強制する
- リセット/削除/アーカイブ/フォーカス解除ライフサイクルと ACP クローズ/バインド解除トランザクションを統合します
- 古いバインディングの検出とオプションの自動バインド解除ポリシーを追加します

### フェーズ 3 acpx バックエンド アダプター/プラグイン

- 実行時コントラクトに対して `acpx` アダプターを実装します (`ensureSession`、`submit`、`stream`、`cancel`、`close`)
- バックエンドのヘルスチェックと起動/破棄の登録を追加
- acpx ndjson イベントを ACP ランタイム イベントに正規化します
- バックエンドのタイムアウト、プロセスの監視、再起動/バックオフ ポリシーを強制します。

### フェーズ 4 配信計画とチャネル UX (Discord が最初)- チェックポイント再開によるイベント駆動型のチャネル プロジェクションを実装します (Discord が最初)

- レート制限を意識したフラッシュ ポリシーを使用してストリーミング チャンクを結合します
- 実行ごとに最終完了メッセージを 1 回保証する
- `/acp spawn`、`/acp cancel`、`/acp steer`、`/acp close`、`/acp sessions` を出荷します

### フェーズ 5 の移行とカットオーバー

- `SessionEntry.acp` プロジェクションと ACP SQLite の信頼できる情報源への二重書き込みを導入
- レガシー ACP メタデータ行の移行ユーティリティを追加
- ACP SQLite プライマリへの読み取りパスを反転します
- `SessionEntry.acp` の欠落に依存する従来のフォールバック ルーティングを削除します。

### フェーズ 6 の強化、SLO、スケール制限

- 同時実行制限 (グローバル/アカウント/セッション)、キュー ポリシー、およびタイムアウト バジェットを適用します。
- 完全なテレメトリ、ダッシュボード、アラートしきい値を追加します
- カオステストによるクラッシュ回復と重複配信の抑制
- バックエンドの停止、DB の破損、古いバインディングの修復のための Runbook を公開します。

### 完全な実装チェックリスト- コアのコントロールプレーンモジュールとテスト

- DBの移行とロールバック計画
- ディスパッチとコマンドにわたる ACP マネージャー API の統合
- プラグイン ランタイム ブリッジのアダプター登録インターフェイス
- acpxアダプターの実装とテスト
- チェックポイントリプレイを備えたスレッド対応のチャネル配信予測ロジック (Discord が最初)
- リセット/削除/アーカイブ/フォーカス解除のためのライフサイクルフック
- 古い結合の検出機能とオペレーター向けの診断機能
- すべての新しい ACP キーの構成検証と優先順位テスト
- 運用ドキュメントとトラブルシューティング ランブック

## テスト計画

単体テスト:

- ACP DB トランザクション境界 (スポーン/バインド/エンキューのアトミック性、キャンセル、クローズ)
- セッションと実行に対する ACP ステートマシン遷移ガード
- すべての ACP コマンドにわたる冪等性予約/再生セマンティクス
- セッションごとのアクターのシリアル化とキューの順序付け
- acpx イベントパーサーとチャンクコアレッサー
- ランタイムスーパーバイザの再起動およびバックオフポリシー
- 設定の優先順位と効果的な TTL 計算
- バックエンド/セッションが無効な場合のコア ACP ルーティング ブランチ選択とフェールクローズ動作

統合テスト:- 確定的なストリーミングとキャンセル動作のための偽の ACP アダプター プロセス

- ACP マネージャー + トランザクション永続性を備えたディスパッチ統合
- ACP セッションキーへのスレッドバインドされたインバウンドルーティング
- スレッドバインドされたアウトバウンド配信により、親チャネルの重複が抑制されます
- チェックポイントのリプレイは配信失敗後に回復し、最後のイベントから再開します
- プラグイン サービスの登録と ACP ランタイム バックエンドの破棄

ゲートウェイ e2e テスト:

- スレッドで ACP を生成し、マルチターン プロンプトを交換し、フォーカスを解除します
- ゲートウェイは永続化された ACP DB とバインディングを使用して再起動し、同じセッションを継続します。
- 複数のスレッドでの同時 ACP セッションにはクロストークがありません
- 重複したコマンドの再試行 (同じ冪等キー) では、重複した実行や応答は作成されません。
- 古いバインディングのシナリオにより、明示的なエラーとオプションの自動クリーン動作が発生します

## リスクと緩和策- 移行中の重複配信

- 軽減策: 単一宛先リゾルバーと冪等イベント チェックポイント
- 負荷がかかるとランタイムプロセスのチャーンが発生する
  - 軽減策: セッション所有者ごとの長期存続 + 同時実行の上限 + バックオフ
- プラグインが存在しないか、設定が正しくありません
  - 軽減策: 明示的なオペレーター向けエラーとフェールクローズされた ACP ルーティング (通常のセッション パスへの暗黙的なフォールバックはありません)
- サブエージェントと ACP ゲート間の構成の混乱
  - 軽減策: 明示的な ACP キーと効果的なポリシー ソースを含むコマンド フィードバック
- コントロール プレーン ストアの破損または移行のバグ
  - 軽減策: WAL モード、バックアップ/復元フック、移行スモーク テスト、読み取り専用フォールバック診断
- アクターのデッドロックまたはメールボックスの不足
  - 軽減策: ウォッチドッグ タイマー、アクターの健全性プローブ、拒否テレメトリによる制限されたメールボックスの深さ

## 受け入れチェックリスト- ACP セッション スポーンは、サポートされているチャネル アダプター (現在は Discord) でスレッドを作成またはバインドできます

- すべてのスレッド メッセージはバインドされた ACP セッションのみにルーティングされます
- ACP 出力は、ストリーミングまたはバッチと同じスレッド ID で表示されます。
- バインドされたターンの親チャンネルに重複した出力はありません
- spawn+bind+initial enqueue は永続ストアではアトミックです
- ACP コマンドの再試行は冪等であり、実行や出力が重複しません。
- キャンセル、閉じる、フォーカス解除、アーカイブ、リセット、削除により、決定的なクリーンアップを実行します。
- クラッシュリスタートはマッピングを保持し、複数ターンの連続性を再開します
- 同時スレッドバインドされた ACP セッションは独立して動作します
- ACP バックエンド欠落状態により、明確な対処可能なエラーが生成される
- 古いバインディングが検出され、明示的に表示されます (オプションの安全な自動クリーン機能を使用)
- オペレーターはコントロールプレーンのメトリクスと診断を利用できます
- 新しいユニット、統合、および e2e カバレッジ パス

## 付録: 現在の実装を対象としたリファクタリング (ステータス)

これらは、現在の機能セットが導入された後も ACP パスを維持できるようにするためのノンブロッキングのフォローアップです。

### 1) ACP ディスパッチポリシーの評価を一元化する (完了)

- `src/acp/policy.ts` の共有 ACP ポリシー ヘルパーを介して実装
- ディスパッチ、ACP コマンド ライフサイクル ハンドラー、および ACP 生成パスが共有ポリシー ロジックを使用するようになりました。

### 2) ACP コマンド ハンドラーをサブコマンド ドメインごとに分割する (完了)- `src/auto-reply/reply/commands-acp.ts` はシン ルーターになりました

- サブコマンドの動作は次のように分割されます。
  - `src/auto-reply/reply/commands-acp/lifecycle.ts`
  - `src/auto-reply/reply/commands-acp/runtime-options.ts`
  - `src/auto-reply/reply/commands-acp/diagnostics.ts`
  - `src/auto-reply/reply/commands-acp/shared.ts` の共有ヘルパー

### 3) ACP セッション マネージャーを責任ごとに分割する (完了)

- マネージャーは次のように分割されます。
  - `src/acp/control-plane/manager.ts` (公共ファサード + シングルトン)
  - `src/acp/control-plane/manager.core.ts` (マネージャー実装)
  - `src/acp/control-plane/manager.types.ts` (マネージャーのタイプ/deps)
  - `src/acp/control-plane/manager.utils.ts` (正規化 + ヘルパー関数)

### 4) オプションの acpx ランタイム アダプターのクリーンアップ

- `extensions/acpx/src/runtime.ts` は次のように分割できます。
- プロセスの実行/監視
- ndjson イベントの解析/正規化
- ランタイム API サーフェス (`submit`、`cancel`、`close` など)
- テスト容易性が向上し、バックエンドの動作を監査しやすくなります。
