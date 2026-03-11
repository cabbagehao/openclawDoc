---
summary: "セッション一覧の取得、履歴の取得、およびセッション間でのメッセージ送信のためのエージェント用セッションツール"
read_when:
  - セッションツールの仕様を確認、または変更する場合
title: "セッションツール"
x-i18n:
  source_hash: "6053e3cc952fd55d7b8cb3fa6971c2bc8f5681ff49689c5714b8d303ba3c2fb0"
---

# セッションツール

目的: エージェントがセッションの一覧を確認し、過去の履歴を取得し、別のセッションへメッセージを送信できるようにするための、シンプルで誤用しにくいツールセットを提供することです。

## ツール一覧

* `sessions_list`
* `sessions_history`
* `sessions_send`
* `sessions_spawn`

## セッションキーのモデル

* メインのダイレクトチャットは、常にリテラル（文字通り）のキー `"main"` を使用します（現在のエージェントのメインキーに解決されます）。
* グループチャットは `agent:<agentId>:<channel>:group:<id>` または `agent:<agentId>:<channel>:channel:<id>` の形式です（完全なキーを渡してください）。
* Cron ジョブは `cron:<job.id>` です。
* Webhook は明示的に設定されていない限り `hook:<uuid>` です。
* ノードセッションは明示的に設定されていない限り `node-<nodeId>` です。

`global` および `unknown` は予約された値であり、一覧には表示されません。`session.scope = "global"` の場合、すべてのツールにおいて `main` の別名として扱われるため、呼び出し側が `global` という値を直接目にすることはありません。

## `sessions_list`

セッションを配列形式で一覧表示します。

**パラメータ:**

* `kinds?: string[]`: フィルタリング。`"main" | "group" | "cron" | "hook" | "node" | "other"` のいずれかを指定。
* `limit?: number`: 最大取得件数（デフォルトはサーバー設定に従います。例：200件）。
* `activeMinutes?: number`: 指定した分以内に更新されたセッションのみを抽出。
* `messageLimit?: number`: 履歴を含めるかどうか。`0` = 含めない（デフォルト）、`>0` = 直近 N 件のメッセージを含める。

**挙動:**

* `messageLimit > 0` の場合、各セッションの `chat.history` から直近 N 件のメッセージを取得して含めます。
* 一覧出力からはツール実行結果（toolResult）は除外されます。ツールのメッセージを確認したい場合は `sessions_history` を使用してください。
* **サンドボックス化** されたエージェントセッションで実行している場合、セッションツールで見える範囲はデフォルトで **自身が生成（spawn）したもののみ** に制限されます（詳細は後述）。

**行のデータ構造 (JSON):**

* `key`: セッションキー（文字列）
* `kind`: `main | group | cron | hook | node | other`
* `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
* `displayName`: グループの表示名（利用可能な場合）
* `updatedAt`: 最終更新日時（ミリ秒）
* `sessionId`: セッション ID
* `model`, `contextTokens`, `totalTokens`: 使用モデルとトークン統計
* `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`: 実行設定とステータス
* `sendPolicy`: セッションごとの送信ポリシー上書き設定
* `lastChannel`, `lastTo`: 最終送信先情報
* `deliveryContext`: 正規化された配信コンテキスト（`{ channel, to, accountId }`）
* `transcriptPath`: 履歴ファイルのパス（ベストエフォート）
* `messages?`: `messageLimit > 0` の場合にのみ含まれるメッセージ配列

## `sessions_history`

特定のセッションの会話記録（トランスクリプト）を取得します。

**パラメータ:**

* `sessionKey`: 必須。セッションキー、または `sessions_list` から取得した `sessionId`。
* `limit?: number`: 最大メッセージ取得数。
* `includeTools?: boolean`: ツールメッセージを含めるかどうか（デフォルトは `false`）。

**挙動:**

* `includeTools=false` の場合、`role: "toolResult"` のメッセージを除外します。
* メッセージを生の記録形式の配列で返します。
* `sessionId` が指定された場合、OpenClaw は対応するセッションキーを自動的に解決します。

## `sessions_send`

別のセッションに対してメッセージを送信します。

**パラメータ:**

* `sessionKey`: 必須。送信先のセッションキー、または `sessionId`。
* `message`: 必須。送信するメッセージ内容。
* `timeoutSeconds?: number`: 待機時間（デフォルトは 0 より大きい値。`0` は送信のみ行う fire-and-forget 方式）。

**挙動:**

* `timeoutSeconds = 0`: 実行キューに追加し、即座に `{ runId, status: "accepted" }` を返します。
* `timeoutSeconds > 0`: 完了まで最大 N 秒待機し、`{ runId, status: "ok", reply }` を返します。
* タイムアウトした場合: `{ runId, status: "timeout", error }`。実行自体は継続されるため、後で `sessions_history` で結果を確認してください。
* 実行が失敗した場合: `{ runId, status: "error", error }`。
* 通知（Announce）の配信は、メインの実行完了後にベストエフォートで行われます。`status: "ok"` は通知の到達を保証するものではありません。
* ゲートウェイの `agent.wait` を介して待機するため、通信が一時的に切断されても待機状態は維持されます。
* 送信先のエージェントには、エージェント間メッセージである旨のコンテキストが注入されます。
* メッセージには `message.provenance.kind = "inter_session"` が付与されるため、履歴を確認する際にユーザー入力とエージェントからの指示を区別できます。
* メインの実行完了後、OpenClaw は **返信ループ（ピンポン）** を実行します:
  * 2 ターン目以降は、依頼元と送信先のエージェントが交互に応答します。
  * ループを終了するには、メッセージとして正確に `REPLY_SKIP` と返します。
  * 最大ターン数は `session.agentToAgent.maxPingPongTurns` (0〜5、デフォルト 5) です。
* ループ終了後、送信先エージェントのみが **アナウンスステップ** を実行します:
  * 何も送信したくない場合は `ANNOUNCE_SKIP` と返します。
  * それ以外の場合、最終的な応答がチャネルに送信されます。
  * アナウンス内容には、最初の依頼内容、1 回目の返信、および最新のやり取りが含まれます。

## チャネルフィールドの扱い

* グループの場合、セッションエントリに記録されたチャネルが `channel` となります。
* ダイレクトチャットの場合、`lastChannel` からマップされます。
* Cron/Webhook/ノードの場合、`channel` は `internal` です。
* 不明な場合は `unknown` となります。

## セキュリティ / 送信ポリシー

チャネルやチャット形式に基づいたブロック設定が可能です。

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

実行時の上書き（セッションごと）:

* `sendPolicy: "allow" | "deny"` (未設定時は構成を継承)
* `sessions.patch` ツール、または所有者による `/send on|off|inherit` コマンドで設定可能。

適用タイミング:

* `chat.send` / `agent` (ゲートウェイ)
* 自動応答の配信ロジック

## `sessions_spawn`

分離されたセッションでサブエージェントを起動し、その結果を依頼元のチャットチャネルに通知します。

**パラメータ:**

* `task`: 必須。実行させるタスク内容。
* `label?`: 任意。ログや UI で使用されるラベル。
* `agentId?`: 任意。許可されていれば、別のエージェント ID として起動。
* `model?`: 任意。サブエージェントが使用するモデルを上書き。
* `thinking?`: 任意。サブエージェントの思考レベルを上書き。
* `runTimeoutSeconds?`: 実行タイムアウト秒数（デフォルトは `agents.defaults.subagents.runTimeoutSeconds`）。
* `thread?`: 任意（デフォルト `false`）。チャネルが対応している場合、スレッドに紐付いたルーティングを要求。
* `mode?`: `run | session` (デフォルト `run`)。`thread=true` の場合は `session` がデフォルト。
* `cleanup?`: `delete | keep` (デフォルト `keep`)。終了後の処理。
* `sandbox?`: `inherit | require` (デフォルト `inherit`)。`require` の場合、送信先がサンドボックス化されていないと起動を拒否。
* `attachments?`: 任意。インラインファイルの配列（サブエージェントランタイムのみ）。ファイルは `.openclaw/attachments/<uuid>/` に作成されます。
* `attachAs?`: 任意。将来のマウント実装用のヒント。

**許可リスト:**

* `agents.list[].subagents.allowAgents`: 指定可能なエージェント ID のリスト（`["*"]` で全許可）。デフォルトは依頼元と同じ ID のみ。
* サンドボックス継承ガード: 依頼元のセッションがサンドボックス化されている場合、サンドボックスなしで実行されるターゲットへの `sessions_spawn` は拒否されます。

**挙動:**

* `deliver: false` 設定で、新しい `agent:<agentId>:subagent:<uuid>` セッションを開始します。
* サブエージェントは、デフォルトで **セッションツールを除いた** すべてのツールを利用可能です（`tools.subagents.tools` で変更可能）。
* サブエージェントがさらに `sessions_spawn` を呼び出すことはできません（入れ子の生成は不可）。
* 常に非ブロッキング（非同期）で動作し、即座に `{ status: "accepted", runId, childSessionKey }` を返します。
* 完了後、OpenClaw は **アナウンスステップ** を実行し、結果を依頼元のチャネルに投稿します。
  * モデルの返信が空の場合、履歴内の最後の `toolResult` が `Result` として採用されます。
* アナウンスを行いたくない場合は、アナウンスステップ中に `ANNOUNCE_SKIP` と返してください。
* 投稿される内容は `Status`, `Result`, `Notes` に正規化されます。`Status` はモデルのテキストではなく、実際の実行結果から決定されます。
* サブエージェントのセッションは、`agents.defaults.subagents.archiveAfterMinutes`（デフォルト 60 分）経過後に自動的にアーカイブされます。

## サンドボックスセッションの可視性

セッションツールがアクセスできる範囲を制限して、セッションを跨いだ操作を抑制できます。

**デフォルトの挙動:**

* `tools.sessions.visibility` はデフォルトで `tree` (現在のセッション + 自身が生成したサブエージェント) です。
* サンドボックス化されたセッションでは、`agents.defaults.sandbox.sessionToolsVisibility` によってさらに厳格に制限できます。

**構成例:**

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
  agents: {
    defaults: {
      sandbox: {
        // デフォルト: "spawned"
        sessionToolsVisibility: "spawned", // または "all"
      },
    },
  },
}
```

補足:

* `self`: 現在のセッションのみ。
* `tree`: 現在のセッションと、そこから派生したすべてのセッション。
* `agent`: 現在のエージェント ID に属するすべてのセッション。
* `all`: すべてのセッション（エージェントを跨ぐ場合は `tools.agentToAgent` の許可も必要）。
* セッションがサンドボックス化され、`sessionToolsVisibility="spawned"` が設定されている場合、`tools.sessions.visibility="all"` と設定していても、OpenClaw は強制的に `tree` の範囲に制限します。
