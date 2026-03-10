---
summary: "「openclaw セッション」の CLI リファレンス (保存されたセッションと使用状況のリスト)"
read_when:
  - 保存されたセッションを一覧表示し、最近のアクティビティを確認したい
title: "セッション"
x-i18n:
  source_hash: "e609bd7f303cc74977d12caae6a8af9fa4c16537fae6294c970bb80e3e472f18"
---

# `openclaw sessions`

保存されている会話セッションをリストします。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --json
```

範囲の選択:

- デフォルト: 設定されたデフォルトのエージェント ストア
- `--agent <id>`: 1 つの構成済みエージェント ストア
- `--all-agents`: 構成されているすべてのエージェント ストアを集約します。
- `--store <path>`: 明示的なストア パス (`--agent` または `--all-agents` と組み合わせることはできません)

JSON の例:

`openclaw sessions --all-agents --json`:

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

## クリーンアップメンテナンス

(次の書き込みサイクルを待たずに) 今すぐメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:dm:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は、構成の `session.maintenance` 設定を使用します。

- スコープに関する注記: `openclaw sessions cleanup` はセッション ストア/トランスクリプトのみを維持します。 cron 実行ログ (`cron/runs/<jobId>.jsonl`) は削除されません。これらは、[Cron 構成](/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` および `cron.runLog.keepLines` によって管理され、[Cron メンテナンス](/automation/cron-jobs#maintenance) で説明されています。- `--dry-run`: 書き込みなしでプルーニング/キャップされるエントリの数をプレビューします。
  - テキスト モードでは、ドライランによりセッションごとのアクション テーブル (`Action`、`Key`、`Age`、`Model`、`Flags`) が出力されるため、何が保持されるのか、何が削除されるのかを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。
- `--active-key <key>`: 特定のアクティブ キーをディスク バジェットのエビクションから保護します。
- `--agent <id>`: 構成されている 1 つのエージェント ストアに対してクリーンアップを実行します。
- `--all-agents`: 構成されているすべてのエージェント ストアのクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON 概要を出力します。 `--all-agents` の場合、出力にはストアごとに 1 つの概要が含まれます。

`openclaw sessions cleanup --all-agents --dry-run --json`:

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

関連:

- セッション構成: [構成リファレンス](/gateway/configuration-reference#session)
