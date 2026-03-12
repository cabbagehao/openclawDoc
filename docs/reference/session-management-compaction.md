---
summary: "詳細: セッション ストア + トランスクリプト、ライフサイクル、および (自動) コンパクションの内部構造"
read_when:
  - セッション ID、トランスクリプト JSONL、または session.json フィールドをデバッグする必要があります
  - 自動圧縮動作を変更するか、「圧縮前」ハウスキーピングを追加します。
  - メモリフラッシュまたはサイレントシステムターンを実装したい
title: "セッション管理の詳細"
seoTitle: "OpenClawセッション管理と圧縮動作を確認するリファレンスガイド"
description: "このドキュメントでは、OpenClaw がセッションをエンドツーエンドで管理する方法について説明します。まず高レベルの概要を知りたい場合は、以下から始めてください。"
x-i18n:
  source_hash: "165198b4d850d95eec4bbf86008fe0e86c66191074ac7ed5b5b6b682efd422d0"
---
このドキュメントでは、OpenClaw がセッションをエンドツーエンドで管理する方法について説明します。

- **セッション ルーティング** (受信メッセージを `sessionKey` にマッピングする方法)
- **セッション ストア** (`sessions.json`) とその追跡内容
- **トランスクリプトの永続性** (`*.jsonl`) とその構造
- **トランスクリプトの衛生管理** (実行前のプロバイダー固有の修正)
- **コンテキストの制限** (コンテキスト ウィンドウと追跡されたトークン)
- **圧縮** (手動 + 自動圧縮) および圧縮前の作業をフックする場所
- **サイレント ハウスキーピング** (例: ユーザーに表示される出力を生成すべきではないメモリ書き込み)

まず高レベルの概要を知りたい場合は、以下から始めてください。

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## 真実の情報源: ゲートウェイ

OpenClaw は、セッション状態を所有する単一の **ゲートウェイ プロセス**を中心に設計されています。

- UI (macOS アプリ、Web コントロール UI、TUI) は、ゲートウェイにセッション リストとトークン数をクエリする必要があります。
- リモート モードでは、セッション ファイルはリモート ホスト上にあります。 「ローカル Mac ファイルの確認」には、ゲートウェイが使用している内容は反映されません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。1. **セッション ストア (`sessions.json`)**

- キー/値マップ: `sessionKey -> SessionEntry`
- 小さく、変更可能で、安全に編集 (またはエントリを削除)
- セッションのメタデータ (現在のセッション ID、最後のアクティビティ、トグル、トークン カウンターなど) を追跡します。

2. **トランスクリプト (`<sessionId>.jsonl`)**
   - ツリー構造の追加専用トランスクリプト (エントリには `id` + `parentId` があります)
   - 実際の会話 + ツール呼び出し + 圧縮サマリーを保存します
   - 将来のターンに向けてモデル コンテキストを再構築するために使用されます

---

## ディスク上の場所

ゲートウェイ ホスト上のエージェントごと:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - テレグラムトピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw は、`src/config/sessions.ts` を通じてこれらを解決します。

---

## ストアのメンテナンスとディスク制御

セッション永続性には、`sessions.json` およびトランスクリプト アーティファクトの自動メンテナンス制御 (`session.maintenance`) があります。- `mode`: `warn` (デフォルト) または `enforce`

- `pruneAfter`: 古いエントリの年齢カットオフ (デフォルト `30d`)
- `maxEntries`: `sessions.json` のエントリを制限します (デフォルト `500`)
- `rotateBytes`: サイズが大きい場合に `sessions.json` を回転します (デフォルト `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持 (デフォルト: `pruneAfter` と同じ。`false` はクリーンアップを無効にします)
- `maxDiskBytes`: オプションのセッション ディレクトリの予算
- `highWaterBytes`: クリーンアップ後のオプションのターゲット (デフォルトの `80%` または `maxDiskBytes`)

ディスク バジェット クリーンアップの施行命令 (`mode: "enforce"`):

1. 最も古いアーカイブされた成果物または孤立したトランスクリプト成果物を最初に削除します。
2. まだ目標を超えている場合は、最も古いセッション エントリとそのトランスクリプト ファイルを削除します。
3. 使用量が `highWaterBytes` 以下になるまで続行します。

`mode: "warn"` では、OpenClaw はエビクションの可能性を報告しますが、ストア/ファイルは変更しません。

オンデマンドでメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行ではセッション エントリ/トランスクリプトも作成され、専用の保持制御が行われます。- `cron.sessionRetention` (デフォルト `24h`) は、分離された古い cron 実行セッションをセッション ストアから削除します (`false` は無効になります)。

- `cron.runLog.maxBytes` + `cron.runLog.keepLines` `~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを削除します (デフォルト: `2_000_000` バイトおよび `2000` 行)。

---

## セッションキー (`sessionKey`)

`sessionKey` は、現在いる会話バケットを識別します (ルーティング + 分離)。

よくあるパターン:

- メイン/ダイレクト チャット (エージェントごと): `agent:<agentId>:<mainKey>` (デフォルト `main`)
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャンネル (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- クロン: `cron:<job.id>`
- Webhook: `hook:<uuid>` (オーバーライドされない限り)

正規ルールは [/concepts/session](/concepts/session) に文書化されています。

---

## セッション ID (`sessionId`)

各 `sessionKey` は、現在の `sessionId` (会話を継続するトランスクリプト ファイル) を指します。

経験則:- **リセット** (`/new`、`/reset`) は、その `sessionKey` に対して新しい `sessionId` を作成します。

- **毎日リセット** (デフォルトはゲートウェイ ホストの現地時間午前 4 時) は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル有効期限** (`session.reset.idleMinutes` またはレガシー `session.idleMinutes`) は、アイドル ウィンドウの後にメッセージが到着すると、新しい `sessionId` を作成します。 Daily + Idle の両方が設定されている場合は、先に期限切れになった方が優先されます。
- **スレッド親フォーク ガード** (`session.parentForkMaxTokens`、デフォルト `100000`) は、親セッションがすでに大きすぎる場合、親トランスクリプトのフォークをスキップします。新しいスレッドは新しく始まります。 `0` を無効に設定します。

実装の詳細: 決定は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッション ストア スキーマ (`sessions.json`)

ストアの値の型は `src/config/sessions.ts` の `SessionEntry` です。

主要なフィールド (すべてではありません):- `sessionId`: 現在のトランスクリプト ID (`sessionFile` が設定されていない限り、ファイル名はこれから派生します)

- `updatedAt`: 最後のアクティビティのタイムスタンプ
- `sessionFile`: オプションの明示的なトランスクリプト パスのオーバーライド
- `chatType`: `direct | group | room` (UI とポリシーの送信に役立ちます)
- `provider`、`subject`、`room`、`space`、`displayName`: グループ/チャネルのラベル付けのメタデータ
- トグル:
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy` (セッションごとの上書き)
- モデルの選択:
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- トークンカウンター (ベストエフォート型 / プロバイダー依存):
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`: このセッション キーの自動圧縮が完了する頻度
- `memoryFlushAt`: 最後の圧縮前のメモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュが実行されたときの圧縮数

ストアは安全に編集できますが、ゲートウェイが権限を持ちます。ゲートウェイは、セッションの実行中にエントリを書き換えたり、再ハイドレートしたりする可能性があります。

---

## トランスクリプト構造 (`*.jsonl`)

トランスクリプトは `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。- 最初の行: セッションヘッダー (`type: "session"`、`id`、`cwd`、`timestamp`、オプションの `parentSession` を含む)

- 次に: `id` + `parentId` のセッション エントリ (ツリー)

注目すべきエントリの種類:

- `message`: ユーザー/アシスタント/ツール結果メッセージ
- `custom_message`: モデル コンテキストに _do_ 入る拡張機能によって挿入されたメッセージ (UI から非表示にすることができます)
- `custom`: モデル コンテキストに「入らない」拡張状態
- `compaction`: `firstKeptEntryId` および `tokensBefore` による永続化圧縮の概要
- `branch_summary`: ツリー ブランチを移動するときに持続される概要

OpenClaw は意図的にトランスクリプトを**「修正」しません**。ゲートウェイは `SessionManager` を使用してそれらの読み取り/書き込みを行います。

---

## コンテキスト ウィンドウと追跡されたトークン

2 つの異なる概念が重要です。

1. **モデル コンテキスト ウィンドウ**: モデルごとのハード キャップ (モデルに表示されるトークン)
2. **セッション ストア カウンター**: `sessions.json` に書き込まれるローリング統計 (/status およびダッシュボードに使用)

制限を調整している場合:

- コンテキスト ウィンドウはモデル カタログから取得されます (構成によってオーバーライドできます)。
- ストア内の `contextTokens` は実行時の推定値/レポート値です。厳密な保証として扱わないでください。

詳細については、[/token-use](/reference/token-use) を参照してください。

---

## 圧縮: 圧縮とは何か圧縮により、古い会話がトランスクリプト内の永続化された `compaction` エントリに要約され、最近のメッセージはそのまま保持されます

圧縮後、今後のターンでは次のようになります。

- 圧縮の概要
- `firstKeptEntryId` 以降のメッセージ

圧縮は**永続的**です(セッションのプルーニングとは異なります)。 [/concepts/session-pruning](/concepts/session-pruning) を参照してください。

---

## 自動圧縮が行われる場合 (Pi ランタイム)

埋め込み Pi エージェントでは、次の 2 つの場合に自動圧縮がトリガーされます。

1. **オーバーフロー回復**: モデルはコンテキスト オーバーフロー エラーを返し、→ 圧縮→ 再試行します。
2. **閾値メンテナンス**: ターンが成功した後、次の場合:

`contextTokens > contextWindow - reserveTokens`

場所:

- `contextWindow` はモデルのコンテキスト ウィンドウです
- `reserveTokens` は、プロンプト + 次のモデル出力用に予約されたヘッドルームです。

これらは Pi ランタイム セマンティクスです (OpenClaw はイベントを消費しますが、いつ圧縮するかを Pi が決定します)。

---

## 圧縮設定 (`reserveTokens`、`keepRecentTokens`)

Pi の圧縮設定は Pi 設定に反映されます。

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は、埋め込み実行に対して安全フロアも強制します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はそれをバンプします。
- デフォルトのフロアは `20000` トークンです。
- `agents.defaults.compaction.reserveTokensFloor: 0` を設定してフロアを無効にします。
- すでにそれより高い場合、OpenClaw はそれをそのままにします。

理由: 圧縮が避けられなくなる前に、複数ターンの「ハウスキーピング」 (メモリ書き込みなど) に備えて十分なヘッドルームを残しておく必要があります。実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` から呼び出されます)。

---

## ユーザーに見える表面

次の方法で圧縮とセッションの状態を観察できます。

- `/status` (チャット セッション中)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- 詳細モード: `🧹 Auto-compaction complete` + 圧縮カウント

---

## サイレントハウスキーピング (`NO_REPLY`)

OpenClaw は、ユーザーが中間出力を表示しないバックグラウンド タスクの「サイレント」ターンをサポートします。

規約:

- アシスタントは出力を `NO_REPLY` で開始し、「ユーザーに応答しない」ことを示します。
- OpenClaw は、配信層でこれを削除/抑制します。

`2026.1.10` 以降、OpenClaw は、部分チャンクが `NO_REPLY` で始まる場合、**ドラフト/タイピング ストリーミング**も抑制するため、サイレント操作によってターン中に部分的な出力が漏洩することはありません。

---

## 圧縮前の「メモリフラッシュ」(実装)

目標: 自動圧縮が行われる前に、永続的な書き込みを行うサイレント エージェント ターンを実行します。
状態をディスクに保存するため (例: エージェント ワークスペースの `memory/YYYY-MM-DD.md`)、圧縮はできません。
重要なコンテキストを消去します。

OpenClaw は **事前しきい値フラッシュ** アプローチを使用します。

1. セッションコンテキストの使用状況を監視します。
2. 「ソフトしきい値」(Pi の圧縮しきい値を下回る) を超えると、サイレント メソッドを実行します。
   「今すぐメモリに書き込む」という指示をエージェントに送信します。
3. ユーザーには何も表示されないように、`NO_REPLY` を使用します。

構成 (`agents.defaults.compaction.memoryFlush`):- `enabled` (デフォルト: `true`)

- `softThresholdTokens` (デフォルト: `4000`)
- `prompt` (フラッシュターンのユーザーメッセージ)
- `systemPrompt` (フラッシュ ターン用に追加された追加のシステム プロンプト)

注:

- デフォルトのプロンプト/システム プロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれています。
- フラッシュは圧縮サイクルごとに 1 回実行されます (`sessions.json` で追跡されます)。
- フラッシュは埋め込み Pi セッションに対してのみ実行されます (CLI バックエンドはフラッシュをスキップします)。
- セッション ワークスペースが読み取り専用 (`workspaceAccess: "ro"` または `"none"`) の場合、フラッシュはスキップされます。
- ワークスペースファイルのレイアウトと書き込みパターンについては、[メモリ](/concepts/memory)を参照してください。

Pi は拡張 API で `session_before_compact` フックも公開しますが、OpenClaw の
現在、フラッシュ ロジックはゲートウェイ側に存在します。

---

## トラブルシューティングのチェックリスト

- セッションキーが間違っていますか? [/concepts/session](/concepts/session) から始めて、`/status` の `sessionKey` を確認します。
- ストアとトランスクリプトの不一致? `openclaw status` からゲートウェイ ホストとストア パスを確認します。
- 圧縮スパム?確認してください:
  - モデル コンテキスト ウィンドウ (小さすぎる)
  - 圧縮設定 (`reserveTokens` がモデル ウィンドウに対して高すぎると、圧縮が早まる可能性があります)
  - ツール結果の肥大化: セッション プルーニングの有効化/調整
- サイレントターンが漏れていませんか？応答が `NO_REPLY` (正確なトークン) で始まり、ストリーミング抑制修正を含むビルドを使用していることを確認します。
