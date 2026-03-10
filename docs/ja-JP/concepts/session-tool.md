---
summary: "セッションの一覧表示、履歴の取得、セッション間メッセージの送信のためのエージェント セッション ツール"
read_when:
  - セッションツールの追加または変更
title: "セッションツール"
x-i18n:
  source_hash: "6053e3cc952fd55d7b8cb3fa6971c2bc8f5681ff49689c5714b8d303ba3c2fb0"
---

# セッションツール

目標: エージェントがセッションを一覧表示し、履歴を取得し、別のセッションに送信できるようにする、小型で悪用されにくいツール セット。

## ツール名

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## キーモデル

- メインのダイレクト チャット バケットは常にリテラル キー `"main"` (現在のエージェントのメイン キーに解決されます) です。
- グループ チャットでは `agent:<agentId>:<channel>:group:<id>` または `agent:<agentId>:<channel>:channel:<id>` (完全なキーを渡します) を使用します。
- Cron ジョブは `cron:<job.id>` を使用します。
- 明示的に設定されていない限り、フックは `hook:<uuid>` を使用します。
- 明示的に設定されていない限り、ノード セッションは `node-<nodeId>` を使用します。

`global` および `unknown` は予約値であり、リストされることはありません。 `session.scope = "global"` の場合、呼び出し元には `global` が表示されないように、すべてのツールに対してエイリアスを `main` に設定します。

## セッションリスト

セッションを行の配列としてリストします。

パラメータ:

- `kinds?: string[]` フィルター: `"main" | "group" | "cron" | "hook" | "node" | "other"` のいずれか
- `limit?: number` 最大行数 (デフォルト: サーバーのデフォルト、クランプ、例: 200)
- `activeMinutes?: number` セッションのみ N 分以内に更新されました
- `messageLimit?: number` 0 = メッセージなし (デフォルトは 0)。 >0 = 最後の N メッセージを含めます

動作:

- `messageLimit > 0` はセッションごとに `chat.history` をフェッチし、最後の N 個のメッセージを含めます。
- ツールの結果はリスト出力で除外されます。ツールメッセージには `sessions_history` を使用してください。
- **サンドボックス** エージェント セッションで実行している場合、セッション ツールはデフォルトで **生成のみの表示** になります (以下を参照)。行の形状 (JSON):

- `key`: セッションキー (文字列)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (利用可能な場合はグループ表示ラベル)
- `updatedAt` (ミリ秒)
- `sessionId`
- `model`、`contextTokens`、`totalTokens`
- `thinkingLevel`、`verboseLevel`、`systemSent`、`abortedLastRun`
- `sendPolicy` (設定されている場合はセッション オーバーライド)
- `lastChannel`、`lastTo`
- `deliveryContext` (利用可能な場合は正規化された `{ channel, to, accountId }`)
- `transcriptPath` (ストア ディレクトリ + セッション ID から導出されるベストエフォート パス)
- `messages?` (`messageLimit > 0`の場合のみ)

## セッション履歴

1 つのセッションのトランスクリプトを取得します。

パラメータ:

- `sessionKey` (必須; `sessions_list` からのセッション キーまたは `sessionId` を受け入れます)
- `limit?: number` 最大メッセージ数 (サーバー クランプ)
- `includeTools?: boolean` (デフォルトは false)

動作:

- `includeTools=false` は `role: "toolResult"` メッセージをフィルターします。
- メッセージ配列を生のトランスクリプト形式で返します。
- `sessionId` が与えられると、OpenClaw はそれを対応するセッション キーに解決します (ID 欠落エラー)。

## セッション送信

別のセッションにメッセージを送信します。

パラメータ:

- `sessionKey` (必須。セッション キーまたは `sessions_list` からの `sessionId` を受け入れます)
- `message` (必須)
- `timeoutSeconds?: number` (デフォルト >0; 0 = ファイアアンドフォーゲット)

動作:- `timeoutSeconds = 0`: キューに入れて `{ runId, status: "accepted" }` を返します。

- `timeoutSeconds > 0`: 完了まで最大 N 秒待ってから、`{ runId, status: "ok", reply }` を返します。
- 待機がタイムアウトした場合: `{ runId, status: "timeout", error }`。実行は続行されます。後で `sessions_history` に電話してください。
- 実行が失敗した場合: `{ runId, status: "error", error }`。
- プライマリ実行の完了後に配信実行をアナウンスします (ベストエフォート型)。 `status: "ok"` は、アナウンスが配信されたことを保証するものではありません。
- ゲートウェイ `agent.wait` (サーバー側) を介して待機するため、再接続によって待機時間が短縮されません。
- エージェント間のメッセージ コンテキストがプライマリ実行に挿入されます。
- セッション間メッセージは `message.provenance.kind = "inter_session"` で保持されるため、トランスクリプト リーダーはルーティングされたエージェントの指示を外部ユーザー入力から区別できます。
- プライマリ実行が完了すると、OpenClaw は **返信ループ** を実行します。
  - ラウンド 2+ では、リクエスタとターゲット エージェントが交互に行われます。
  - ピンポンを停止するには、`REPLY_SKIP` と正確に返信してください。
  - 最大回転数は `session.agentToAgent.maxPingPongTurns` (0 ～ 5、デフォルトは 5) です。
- ループが終了すると、OpenClaw は **エージェント間アナウンス ステップ** (ターゲット エージェントのみ) を実行します。
  - 沈黙を保つために、`ANNOUNCE_SKIP` と正確に返信してください。
  - その他の応答はターゲット チャネルに送信されます。
  - アナウンス ステップには、元のリクエスト + ラウンド 1 応答 + 最新のピンポン応答が含まれます。

## チャネルフィールド- グループの場合、`channel` はセッション エントリに記録されたチャネルです

- 直接チャットの場合、`channel` は `lastChannel` からマップされます。
- cron/フック/ノードの場合、`channel` は `internal` です。
- 欠落している場合、`channel` は `unknown` になります。

## セキュリティ/送信ポリシー

(セッション ID ごとではなく) チャネル/チャット タイプごとのポリシーベースのブロック。

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

実行時オーバーライド (セッション エントリごと):

- `sendPolicy: "allow" | "deny"` (設定解除 = 構成を継承)
- `sessions.patch` または所有者専用 `/send on|off|inherit` (スタンドアロン メッセージ) 経由で設定可能。

実施ポイント:

- `chat.send` / `agent` (ゲートウェイ)
- 自動返信配信ロジック

## セッションスポーン

分離されたセッションで実行されるサブエージェントを生成し、結果を要求者のチャット チャネルにアナウンスします。

パラメータ:- `task` (必須)

- `label?` (オプション; ログ/UI に使用)
- `agentId?` (オプション; 許可されている場合は別のエージェント ID で生成されます)
- `model?` (オプション; サブエージェント モデルをオーバーライドします; 無効な値のエラー)
- `thinking?` (オプション; サブエージェント実行の思考レベルをオーバーライドします)
- `runTimeoutSeconds?` (設定されている場合はデフォルトで `agents.defaults.subagents.runTimeoutSeconds`、それ以外の場合は `0` です。設定されている場合、N 秒後にサブエージェントの実行が中止されます)
- `thread?` (デフォルトは false; チャネル/プラグインでサポートされている場合、このスポーンのスレッドバインド ルーティングを要求します)
- `mode?` (`run|session`; デフォルトは `run` ですが、`thread=true`; `mode="session"` には `thread=true` が必要な場合、デフォルトは `session` になります)
- `cleanup?` (`delete|keep`、デフォルト `keep`)
- `sandbox?` (`inherit|require`、デフォルト `inherit`; `require` は、ターゲットの子ランタイムがサンドボックス化されていない限り、生成を拒否します)
- `attachments?` (オプションのインライン ファイル配列。サブエージェント ランタイムのみ、ACP は拒否)。各エントリ: `{ name, content, encoding?: "utf8" | "base64", mimeType? }`。ファイルは、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。ファイルごとに sha256 のレシートを返します。
- `attachAs?` (オプション; `{ mountPath? }` ヒントは将来のマウント実装のために予約されています)

許可リスト:- `agents.list[].subagents.allowAgents`: `agentId` 経由で許可されるエージェント ID のリスト (任意の場合は `["*"]`)。デフォルト: リクエスターエージェントのみ。

- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、 `sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

発見:

- `agents_list` を使用して、`sessions_spawn` に許可されているエージェント ID を確認します。

行動：- `deliver: false` との新しい `agent:<agentId>:subagent:<uuid>` セッションを開始します。

- サブエージェントは、デフォルトでフル ツール セット **セッション ツールを除く** (`tools.subagents.tools` 経由で構成可能) になります。
- サブエージェントは `sessions_spawn` を呼び出すことができません (サブエージェントなし → サブエージェントの生成)。
- 常に非ブロッキング: `{ status: "accepted", runId, childSessionKey }` をすぐに返します。
- `thread=true` を使用すると、チャネル プラグインは配信/ルーティングをスレッド ターゲットにバインドできます (Discord のサポートは `session.threadBindings.*` および `channels.discord.threadBindings.*` によって制御されます)。
- 完了後、OpenClaw はサブエージェント **アナウンス ステップ**を実行し、結果を要求者のチャット チャネルに投稿します。
  - アシスタントの最終応答が空の場合、サブエージェント履歴の最新の `toolResult` が `Result` として含まれます。
- 沈黙を保つために、アナウンスステップ中に `ANNOUNCE_SKIP` と正確に返信してください。
- アナウンスの返信は `Status`/`Result`/`Notes` に正規化されます。 `Status` は、(モデル テキストではなく) 実行時の結果から取得されます。
- サブエージェント セッションは、`agents.defaults.subagents.archiveAfterMinutes` の後に自動アーカイブされます (デフォルト: 60)。
- アナウンス応答には、統計行 (ランタイム、トークン、sessionKey/sessionId、トランスクリプト パス、およびオプションのコスト) が含まれます。

## サンドボックスセッションの可視性

セッションツールは、セッション間のアクセスを減らすために範囲を指定できます。

デフォルトの動作:- `tools.sessions.visibility` のデフォルトは `tree` (現在のセッション + 生成されたサブエージェント セッション)。

- サンドボックス セッションの場合、`agents.defaults.sandbox.sessionToolsVisibility` は可視性をハードクランプできます。

構成:

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      // default: "tree"
      visibility: "tree",
    },
  },
  agents: {
    defaults: {
      sandbox: {
        // default: "spawned"
        sessionToolsVisibility: "spawned", // or "all"
      },
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション。
- `agent`: 現在のエージェント ID に属する任意のセッション。
- `all`: 任意のセッション (エージェント間アクセスには `tools.agentToAgent` が必要です)。
- セッションがサンドボックス化されており、`sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` を設定した場合でも、OpenClaw は可視性を `tree` に固定します。
