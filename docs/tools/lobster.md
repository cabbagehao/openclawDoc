---
title: "ロブスター"
seoTitle: "OpenClaw Lobsterツールの役割と利用フローを整理するガイド"
summary: "再開可能な承認ゲートを備えた OpenClaw 用の型付きワークフロー ランタイム。"
description: "Lobster は、OpenClaw が明示的な承認チェックポイントを備えた単一の決定論的な操作としてマルチステップ ツール シーケンスを実行できるようにするワークフロー シェルです。"
read_when:
  - 明示的な承認を伴う決定的な複数ステップのワークフローが必要な場合
  - 以前のステップを再実行せずにワークフローを再開する必要がある
x-i18n:
  source_hash: "c6d7c06865f4646797044511822a24395deb92f50c41f72316bfc9b6273b7259"
---
Lobster は、OpenClaw が明示的な承認チェックポイントを備えた単一の決定論的な操作としてマルチステップ ツール シーケンスを実行できるようにするワークフロー シェルです。

## フック

アシスタントは、それ自体を管理するツールを構築できます。ワークフローを依頼すると、30 分後には CLI と 1 回の呼び出しとして実行されるパイプラインが作成されます。 Lobster には、決定論的なパイプライン、明示的な承認、再開可能な状態という欠けている部分があります。

## なぜ

現在、複雑なワークフローではツール呼び出しを何度も往復する必要があります。各呼び出しにはトークンがかかり、LLM はすべてのステップを調整する必要があります。 Lobster は、そのオーケストレーションを型付きランタイムに移動します。

- **多数ではなく 1 回の呼び出し**: OpenClaw は Lobster ツール呼び出しを 1 回実行し、構造化された結果を取得します。
- **承認機能が組み込まれている**: 副作用 (電子メールの送信、コメントの投稿) が発生すると、明示的に承認されるまでワークフローが停止します。
- **再開可能**: 停止したワークフローはトークンを返します。すべてを再実行せずに承認して再開します。

## なぜプレーンなプログラムではなく DSL を使うのでしょうか?

ロブスターは意図的に小さいです。目標は「新しい言語」ではなく、第一級の承認と再開トークンを備えた、予測可能で AI に優しいパイプライン仕様です。- **承認/再開は組み込まれています**: 通常のプログラムは人間にプロンプ​​トを表示できますが、ランタイムを自分で開発しない限り、永続的なトークンを使用して「一時停止」および「再開」することはできません。

- **決定性 + 監査可能性**: パイプラインはデータであるため、ログ、比較、再生、レビューが簡単です。
- **AI 用の制約されたサーフェス**: 小さな文法と JSON パイピングにより、「創造的な」コード パスが削減され、検証が現実的になります。
- **安全ポリシーが組み込まれている**: タイムアウト、出力上限、サンドボックス チェック、および許可リストは、各スクリプトではなくランタイムによって適用されます。
- **まだプログラム可能**: 各ステップで任意の CLI またはスクリプトを呼び出すことができます。 JS/TS が必要な場合は、コードから `.lobster` ファイルを生成します。

## 仕組み

OpenClaw は、**ツール モード**でローカルの `lobster` CLI を起動し、標準出力から JSON エンベロープを解析します。
パイプラインが承認のために一時停止した場合、ツールは `resumeToken` を返すため、後で続行できます。

## パターン: 小規模な CLI + JSON パイプ + 承認

JSON を話す小さなコマンドを構築し、それらを単一の Lobster 呼び出しにチェーンします。 (以下のコマンド名の例 - 自分のコマンド名に置き換えてください。)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

パイプラインが承認をリクエストした場合は、トークンを使用して再開します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI がワークフローをトリガーします。 Lobster が手順を実行します。承認ゲートにより、副作用が明示的に監査可能に保たれます。

例: 入力項目をツール呼び出しにマップします。

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON のみの LLM ステップ (llm-task)**構造化 LLM ステップ**が必要なワークフローの場合は、オプションの

`llm-task` プラグイン ツールを作成し、Lobster から呼び出します。これによりワークフローが維持されます
決定論的でありながら、モデルを使用して分類/要約/草案を作成できます。

ツールを有効にします。

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

パイプラインで使用します。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

詳細と構成オプションについては、[LLM タスク](/tools/llm-task) を参照してください。

## ワークフロー ファイル (.lobster)

Lobster は、`name`、`args`、`steps`、`env`、`condition`、および `approval` フィールドを含む YAML/JSON ワークフロー ファイルを実行できます。 OpenClaw ツール呼び出しで、`pipeline` をファイル パスに設定します。

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

注:

- `stdin: $step.stdout` および `stdin: $step.json` は、前のステップの出力を渡します。
- `condition` (または `when`) は、`$step.approved` のステップをゲートできます。

## ロブスターをインストールする

OpenClaw Gateway を実行する **同じホスト** に Lobster CLI をインストールし ([Lobster リポジトリ](https://github.com/openclaw/lobster) を参照)、`lobster` が `PATH` 上にあることを確認します。

## ツールを有効にする

Lobster は **オプション** プラグイン ツールです (デフォルトでは有効になっていません)。

推奨（添加剤、安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

またはエージェントごと:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

制限的な許可リスト モードで実行する予定がない限り、`tools.allow: ["lobster"]` の使用は避けてください。注: ホワイトリストはオプションのプラグインに対してオプトインされています。許可リストに名前のみがある場合
プラグイン ツール (`lobster` など)、OpenClaw はコア ツールを有効に保ちます。コアを制限するには
ツールの場合は、許可リストに必要なコア ツールまたはグループも含めます。

## 例: 電子メールの優先順位付け

ロブスターなし:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

ロブスター付き:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

JSON エンベロープ (切り詰められた) を返します。

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

ユーザーが承認→再開:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

ワークフローは 1 つ。決定論的。安全。

## ツールパラメータ

### `run`

パイプラインをツール モードで実行します。

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

引数を指定してワークフロー ファイルを実行します。

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

承認後に停止したワークフローを続行します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### オプションの入力

- `cwd`: パイプラインの相対作業ディレクトリ (現在のプロセスの作業ディレクトリ内に存在する必要があります)。
- `timeoutMs`: この期間 (デフォルト: 20000) を超える場合、サブプロセスを強制終了します。
- `maxStdoutBytes`: 標準出力がこのサイズ (デフォルト: 512000) を超える場合、サブプロセスを強制終了します。
- `argsJson`: `lobster run --args-json` に渡される JSON 文字列 (ワークフロー ファイルのみ)。

## 出力エンベロープ

Lobster は、次の 3 つのステータスのいずれかを含む JSON エンベロープを返します。

- `ok` → 正常に終了しました
- `needs_approval` → 一時停止;再開するには `requiresApproval.resumeToken` が必要です
- `cancelled` → 明示的に拒否またはキャンセルされましたこのツールは、`content` (きれいな JSON) と `details` (生のオブジェクト) の両方でエンベロープを表示します。

## 承認

`requiresApproval` が存在する場合は、プロンプトを調べて次のことを決定します。

- `approve: true` → 再開および続行の副作用
- `approve: false` → ワークフローをキャンセルして終了します

`approve --preview-from-stdin --limit N` を使用して、カスタム jq/heredoc グルーを使用せずに JSON プレビューを承認リクエストに添付します。再開トークンはコンパクトになりました。Lobster はワークフローの再開状態を状態ディレクトリに保存し、小さなトークン キーを返します。

## OpenProse

OpenProse は Lobster とよく連携します。`/prose` を使用してマルチエージェントの準備を調整し、確定的な承認のために Lobster パイプラインを実行します。 Prose プログラムに Lobster が必要な場合は、`tools.subagents.tools` 経由でサブエージェントに `lobster` ツールを許可します。 [OpenProse](/prose) を参照してください。

## 安全性

- **ローカル サブプロセスのみ** — プラグイン自体からのネットワーク呼び出しはありません。
- **秘密はありません** — Lobster は OAuth を管理しません。これを行う OpenClaw ツールを呼び出します。
- **サンドボックス対応** — ツール コンテキストがサンドボックス化されている場合は無効になります。
- **強化** — `PATH` の実行可能ファイル名 (`lobster`) を修正しました。タイムアウトと出力上限が適用されます。

## トラブルシューティング- **`lobster subprocess timed out`** → `timeoutMs` を増やすか、長いパイプラインを分割します

- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` を上げるか、出力サイズを減らします。
- **`lobster returned invalid JSON`** → パイプラインがツール モードで実行され、JSON のみが出力されることを確認します。
- **`lobster failed (code …)`** → 端末で同じパイプラインを実行して標準エラー出力を検査します。

## 詳細はこちら

- [プラグイン](/tools/plugin)
- [プラグインツールのオーサリング](/plugins/agent-tools)

## ケーススタディ: コミュニティ ワークフロー

公開されている例の 1 つは、3 つの Markdown ボールト (個人、パートナー、共有) を管理する「第 2 の脳」の CLI + Lobster パイプラインです。 CLI は、統計、受信トレイのリスト、および古いスキャンの JSON を出力します。 Lobster は、これらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` などのワークフローにチェーンし、それぞれに承認ゲートを設けます。 AI は、利用可能な場合は判断 (分類) を処理し、利用できない場合は決定論的なルールに戻ります。

- スレッド: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- リポジトリ: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)
