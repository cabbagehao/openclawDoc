---
title: "サンドボックス CLI"
summary: "サンドボックス コンテナを管理し、効果的なサンドボックス ポリシーを検査する"
read_when: "You are managing sandbox containers or debugging sandbox/tool-policy behavior."
status: active
x-i18n:
  source_hash: "6e1186f26c77e188206ce5e198ab624d6b38bc7bb7c06e4d2281b6935c39e347"
---

# サンドボックス CLI

分離されたエージェントを実行するために Docker ベースのサンドボックス コンテナーを管理します。

## 概要

OpenClaw は、セキュリティのために分離された Docker コンテナ内でエージェントを実行できます。 `sandbox` コマンドは、特に更新または構成変更後のこれらのコンテナーの管理に役立ちます。

## コマンド

### `openclaw sandbox explain`

**効果的な** サンドボックス モード/スコープ/ワークスペース アクセス、サンドボックス ツール ポリシー、および昇格されたゲート (fix-it config キー パスを含む) を検査します。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

すべてのサンドボックス コンテナーをそのステータスと構成とともにリストします。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**出力には以下が含まれます:**

- コンテナ名とステータス(実行中/停止中)
- Docker イメージとそれが構成と一致するかどうか
- 年齢（作成からの経過時間）
- アイドル時間 (最後に使用してからの時間)
- 関連するセッション/エージェント

### `openclaw sandbox recreate`

サンドボックス コンテナを削除して、更新されたイメージ/構成で強制的に再作成します。

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**オプション:**

- `--all`: すべてのサンドボックス コンテナを再作成します。
- `--session <key>`: 特定のセッションのコンテナを再作成します
- `--agent <id>`: 特定のエージェントのコンテナを再作成します
- `--browser`: ブラウザコンテナのみを再作成します
- `--force`: 確認プロンプトをスキップします

**重要:** コンテナは、エージェントが次回使用されるときに自動的に再作成されます。

## 使用例

### Docker イメージの更新後

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### サンドボックス構成の変更後

````bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```### setupCommand 変更後

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
````

### 特定のエージェントのみ

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## なぜこれが必要なのでしょうか?

**問題:** サンドボックス Docker イメージまたは構成を更新する場合:

- 既存のコンテナは古い設定で引き続き実行されます
- コンテナは、非アクティブ状態が 24 時間続いた場合にのみ削除されます。
- 定期的に使用されるエージェントは古いコンテナを無期限に実行し続けます

**解決策:** `openclaw sandbox recreate` を使用して古いコンテナを強制的に削除します。次に必要になったときに、現在の設定で自動的に再作成されます。

ヒント: 手動の `docker rm` よりも `openclaw sandbox recreate` をお勧めします。それは、
ゲートウェイのコンテナの名前付けと、スコープ/セッション キーが変更されたときの不一致を回避します。

## 構成

サンドボックス設定は、`agents.defaults.sandbox` の `~/.openclaw/openclaw.json` にあります (エージェントごとのオーバーライドは `agents.list[].sandbox` にあります)。

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## 関連項目

- [サンドボックス ドキュメント](/gateway/sandboxing)
- [エージェント構成](/concepts/agent-workspace)
- [ドクターコマンド](/gateway/doctor) - サンドボックスの設定を確認してください
