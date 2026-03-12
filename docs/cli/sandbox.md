---
title: "OpenClaw CLI: openclaw sandbox コマンドの使い方と主要オプション・実行例"
summary: "サンドボックスコンテナの管理と現在のポリシーの確認"
read_when:
description: "エージェントを分離して実行するための Docker ベースのサンドボックスコンテナを管理します。概要、コマンド一覧、openclaw sandbox explainを確認できます。"
status: active
x-i18n:
  source_hash: "6e1186f26c77e188206ce5e198ab624d6b38bc7bb7c06e4d2281b6935c39e347"
---
エージェントを分離して実行するための Docker ベースのサンドボックスコンテナを管理します。

## 概要

OpenClaw はセキュリティ向上のため、分離された Docker コンテナ内でエージェントを実行できます。`sandbox` コマンドは、アップデート後や構成変更時などにこれらのコンテナを管理するのに役立ちます。

## コマンド一覧

### `openclaw sandbox explain`

**実際に適用されている**サンドボックスモード、スコープ、ワークスペースへのアクセス権限、ツールポリシー、および権限昇格ゲートの状態を確認します。修正が必要な場合の構成キーのパスも表示されます。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

すべてのサンドボックスコンテナの状態と構成を一覧表示します。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # ブラウザ用コンテナのみを表示
openclaw sandbox list --json     # JSON 形式で出力
```

**出力内容:**

- コンテナ名とステータス（実行中/停止中）
- Docker イメージ名、および構成と一致しているか
- 作成からの経過時間
- 最終使用からのアイドル時間
- 紐付けられているセッションまたはエージェント

### `openclaw sandbox recreate`

サンドボックスコンテナを削除し、最新のイメージや構成で強制的に再作成します。

```bash
openclaw sandbox recreate --all                # すべてのコンテナを再作成
openclaw sandbox recreate --session main       # 特定のセッション用のみ
openclaw sandbox recreate --agent mybot        # 特定のエージェント用のみ
openclaw sandbox recreate --browser            # ブラウザ用コンテナのみ
openclaw sandbox recreate --all --force        # 確認プロンプトをスキップ
```

**オプション:**

- `--all`: すべてのサンドボックスコンテナを再作成
- `--session <キー>`: 特定のセッションのコンテナを再作成
- `--agent <id>`: 特定のエージェントのコンテナを再作成
- `--browser`: ブラウザ用コンテナのみを再作成
- `--force`: 確認プロンプトを表示せずに実行

**重要:** コンテナは、そのエージェントが次回使用される際に自動的に再作成されます。

## ユースケース

### Docker イメージを更新したとき

```bash
# 新しいイメージを取得
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 構成ファイルを更新して新しいイメージを指定
# 編集箇所: agents.defaults.sandbox.docker.image (または agents.list[].sandbox.docker.image)

# コンテナを再作成
openclaw sandbox recreate --all
```

### サンドボックスの構成を変更したとき

```bash
# 構成ファイルを編集: agents.defaults.sandbox.* (または agents.list[].sandbox.*)

# 新しい設定を適用するためにコンテナを再作成
openclaw sandbox recreate --all
```

### `setupCommand` を変更したとき

```bash
openclaw sandbox recreate --all
# または特定のエージェントのみ:
openclaw sandbox recreate --agent family
```

### 特定のエージェントのみを更新したいとき

```bash
# 特定のエージェントのコンテナのみを更新
openclaw sandbox recreate --agent alfred
```

## なぜこの操作が必要なのか

**問題:** サンドボックス用の Docker イメージや構成を更新しても、以下の状況が発生します:

- 既存のコンテナは古い設定のまま動き続ける
- コンテナは 24 時間以上アイドル状態でなければ自動削除されない
- 頻繁に使用されるエージェントでは、古いコンテナがいつまでも残り続ける

**解決策:** `openclaw sandbox recreate` を使用して古いコンテナを強制的に削除してください。次に必要になった際に、最新の設定で自動的に再作成されます。

ヒント: 手動で `docker rm` を行うよりも、`openclaw sandbox recreate` の使用を推奨します。ゲートウェイのコンテナ命名規則に従って処理されるため、スコープやセッションキーが変更された際の不一致を避けることができます。

## 構成設定

サンドボックスの設定は `~/.openclaw/openclaw.json` の `agents.defaults.sandbox` 配下に記述します（エージェントごとの上書きは `agents.list[].sandbox` で行います）:

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
          // ... その他の Docker オプション
        },
        "prune": {
          "idleHours": 24, // 24時間アイドル状態で自動削除
          "maxAgeDays": 7, // 作成から7日で自動削除
        },
      },
    },
  },
}
```

## 関連情報

- [サンドボックス詳細ドキュメント](/gateway/sandboxing)
- [エージェント構成](/concepts/agent-workspace)
- [Doctor コマンド](/gateway/doctor) - サンドボックス環境のチェック
