---
summary: "`openclaw sessions` の CLI リファレンス (保存されたセッションの一覧表示とメンテナンス)"
read_when:
  - 保存されている会話セッションの一覧を確認したり、最近のアクティビティを見たい場合
title: "sessions"
x-i18n:
  source_hash: "e609bd7f303cc74977d12caae6a8af9fa4c16537fae6294c970bb80e3e472f18"
---

# `openclaw sessions`

保存されている会話セッションを一覧表示します。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --json
```

## 範囲（スコープ）の選択

- デフォルト: 構成済みのデフォルトエージェントのストア
- `--agent <id>`: 指定したエージェントのストアのみ
- `--all-agents`: 構成されているすべてのエージェントのストアを集約
- `--store <パス>`: 明示的に指定したストアファイル（`--agent` や `--all-agents` との併用はできません）

## JSON 出力の例

`openclaw sessions --all-agents --json` 実行時:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-5" }
  ]
}
```

---

## クリーンアップメンテナンス (`cleanup`)

次の自動クリーンアップサイクルを待たずに、今すぐメンテナンス（古いセッションの削除など）を実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:dm:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は、構成ファイル内の `session.maintenance` 設定を使用します。

- 補足: このコマンドはセッションストアとトランスクリプト（会話履歴）ファイルのみを対象とします。Cron の実行ログ (`cron/runs/<jobId>.jsonl`) は対象外です（Cron ログは [Cron 構成](/automation/cron-jobs#configuration) 内の `cron.runLog` 設定によって管理されます）。

オプション:
- `--dry-run`: 実際に削除は行わず、削除対象となるエントリ数などをプレビューします。
  - テキストモードでのドライランでは、セッションごとのアクション表 (`Action`, `Key`, `Age`, `Model`, `Flags`) が表示され、何が保持され何が削除されるかを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` (警告のみ) に設定されている場合でも、強制的に削除を適用します。
- `--active-key <キー>`: 特定のセッションキーを、ディスク容量制限による自動削除から保護します。
- `--agent <id>`: 特定のエージェントのストアに対してクリーンアップを実行します。
- `--all-agents`: すべてのエージェントのストアに対してクリーンアップを実行します。
- `--store <パス>`: 特定の `sessions.json` ファイルを指定して実行します。
- `--json`: クリーンアップ結果のサマリーを JSON 形式で出力します。`--all-agents` 指定時はストアごとのサマリーが含まれます。

`openclaw sessions cleanup --all-agents --dry-run --json` 実行時の出力例:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

関連ドキュメント:
- セッション構成: [構成リファレンス - Session](/gateway/configuration-reference#session)
