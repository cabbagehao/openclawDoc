---
summary: "エージェントごとのサンドボックス + ツールの制限、優先順位、および例"
title: "マルチエージェントサンドボックスとツール"
read_when: "You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway."
status: active
x-i18n:
  source_hash: "3e4de14530209ddb899d2366a40981b9063a081cf515cfd770f1d2144359acb9"
---

# マルチエージェントサンドボックスとツールの構成

## 概要

マルチエージェント設定内の各エージェントは、独自のものを持つことができるようになりました。

* **サンドボックス構成** (`agents.list[].sandbox` は `agents.defaults.sandbox` をオーバーライドします)
* **ツールの制限** (`tools.allow` / `tools.deny`、および `agents.list[].tools`)

これにより、異なるセキュリティ プロファイルを使用して複数のエージェントを実行できるようになります。

* フルアクセスが可能なパーソナルアシスタント
* 制限されたツールを使用する家族/職場エージェント
* サンドボックス内の一般向けエージェント

`setupCommand` は `sandbox.docker` (グローバルまたはエージェントごと) に属し、1 回実行されます
コンテナが作成されたとき。

認証はエージェントごとに行われます。各エージェントは、次の場所にある独自の `agentDir` 認証ストアから読み取ります。

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

資格情報はエージェント間で共有されません\*\*。エージェント間で `agentDir` を再利用しないでください。
認証情報を共有したい場合は、`auth-profiles.json` を他のエージェントの `agentDir` にコピーします。

実行時のサンドボックスの動作については、[サンドボックス](/gateway/sandboxing) を参照してください。
「なぜこれがブロックされるのか?」のデバッグについては、[サンドボックス vs ツール ポリシー vs 昇格](/gateway/sandbox-vs-tool-policy-vs-elevated) および `openclaw sandbox explain` を参照してください。

***

## 構成例

### 例 1: 個人 + 制限付き家族代理人

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**結果:**

* `main` エージェント: ホスト上で実行、完全なツール アクセス
* `family` エージェント: Docker で実行 (エージェントごとに 1 つのコンテナー)、`read` ツールのみ

***

### 例 2: 共有サンドボックスを使用した作業エージェント

````json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```---

### 例 2b: グローバルコーディングプロファイル + メッセージング専用エージェント

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
````

**結果:**

* デフォルトのエージェントはコーディングツールを入手します
* `support` エージェントはメッセージング専用です (+ Slack ツール)

***

### 例 3: エージェントごとに異なるサンドボックス モード

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public always sandboxed
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

***

## 構成の優先順位

グローバル (`agents.defaults.*`) 構成とエージェント固有 (`agents.list[].*`) 構成の両方が存在する場合:

### サンドボックス構成

エージェント固有の設定はグローバルをオーバーライドします。

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**注:**

* `agents.list[].sandbox.{docker,browser,prune}.*` は、そのエージェントの `agents.defaults.sandbox.{docker,browser,prune}.*` をオーバーライドします (サンドボックス スコープが `"shared"` に解決される場合は無視されます)。

### ツールの制限事項

フィルタリングの順序は次のとおりです。

1. **ツール プロファイル** (`tools.profile` または `agents.list[].tools.profile`)
2. **プロバイダー ツール プロファイル** (`tools.byProvider[provider].profile` または `agents.list[].tools.byProvider[provider].profile`)
3. **グローバル ツール ポリシー** (`tools.allow` / `tools.deny`)
4. **プロバイダー ツール ポリシー** (`tools.byProvider[provider].allow/deny`)
5. **エージェント固有のツール ポリシー** (`agents.list[].tools.allow/deny`)
6. **エージェント プロバイダー ポリシー** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **サンドボックス ツール ポリシー** (`tools.sandbox.tools` または `agents.list[].tools.sandbox.tools`)
8. **サブエージェント ツール ポリシー** (`tools.subagents.tools`、該当する場合)各レベルではツールをさらに制限できますが、以前のレベルで拒否されたツールを許可し直すことはできません。
   `agents.list[].tools.sandbox.tools` が設定されている場合、そのエージェントの `tools.sandbox.tools` が置き換えられます。
   `agents.list[].tools.profile` が設定されている場合、そのエージェントの `tools.profile` がオーバーライドされます。
   プロバイダー ツール キーは、`provider` (例: `google-antigravity`) または `provider/model` (例: `openai/gpt-5.2`) のいずれかを受け入れます。

### ツールグループ (略記)

ツール ポリシー (グローバル、エージェント、サンドボックス) は、複数の具体的なツールに拡張される `group:*` エントリをサポートします。

* `group:runtime`: `exec`、`bash`、`process`
* `group:fs`: `read`、`write`、`edit`、`apply_patch`
* `group:sessions`: `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
* `group:memory`: `memory_search`、`memory_get`
* `group:ui`: `browser`、`canvas`
* `group:automation`: `cron`、`gateway`
* `group:messaging`: `message`
* `group:nodes`: `nodes`
* `group:openclaw`: すべての組み込み OpenClaw ツール (プロバイダー プラグインを除く)

### 昇格モード

`tools.elevated` はグローバル ベースライン (送信者ベースの許可リスト) です。 `agents.list[].tools.elevated` は、特定のエージェントの昇格をさらに制限できます (両方が許可する必要があります)。

軽減パターン:- 信頼できないエージェントに対して `exec` を拒否する (`agents.list[].tools.deny: ["exec"]`)

* 制限されたエージェントにルーティングする送信者を許可リストに登録しないようにします
* サンドボックス実行のみが必要な場合は、昇格をグローバルに無効にします (`tools.elevated.enabled: false`)。
* 機密プロファイルのエージェントごとの昇格を無効にする (`agents.list[].tools.elevated.enabled: false`)

***

## 単一エージェントからの移行

**前 (単一エージェント):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**後 (異なるプロファイルを持つマルチエージェント):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

レガシー `agent.*` 構成は `openclaw doctor` によって移行されます。今後は `agents.defaults` + `agents.list` を優先します。

***

## ツール制限の例

### 読み取り専用エージェント

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### 安全な実行エージェント (ファイルの変更なし)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### 通信専用エージェント

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

***

## よくある落とし穴: 「非メイン」

`agents.defaults.sandbox.mode: "non-main"` は `session.mainKey` (デフォルトは `"main"`) に基づいています。
エージェントIDではありません。グループ/チャネル セッションは常に独自のキーを取得するため、
は非メインとして扱われ、サンドボックス化されます。エージェントに絶対にさせたくない場合
サンドボックス、`agents.list[].sandbox.mode: "off"` を設定します。

***

## テスト

マルチエージェント サンドボックスとツールを構成した後:

1. **エージェントの解決策を確認します:**

   ```exec
   openclaw agents list --bindings
   ```

2. **サンドボックス コンテナを確認します:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **テストツールの制限:**
   * 制限されたツールを必要とするメッセージを送信する
   * エージェントが拒否されたツールを使用できないことを確認する

4. **ログの監視:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

\---## トラブルシューティング

### `mode: "all"` にもかかわらず、エージェントはサンドボックス化されていません

* それをオーバーライドするグローバル `agents.defaults.sandbox.mode` があるかどうかを確認します。
* エージェント固有の設定が優先されるため、`agents.list[].sandbox.mode: "all"` を設定します。

### 拒否リストにもかかわらずツールは引き続き利用可能

* ツールのフィルタリング順序を確認します: グローバル → エージェント → サンドボックス → サブエージェント
* 各レベルはさらに制限することのみが可能であり、元に戻すことはできません
* ログで確認: `[tools] filtering tools for agent:${agentId}`

### コンテナがエージェントごとに分離されていない

* エージェント固有のサンドボックス構成で `scope: "agent"` を設定します
* デフォルトは `"session"` で、セッションごとに 1 つのコンテナを作成します。

***

## 関連項目

* [マルチエージェントルーティング](/concepts/multi-agent)
* [サンドボックス構成](/gateway/configuration#agentsdefaults-sandbox)
* [セッション管理](/concepts/session)
