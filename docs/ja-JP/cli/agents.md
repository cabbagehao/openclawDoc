---
summary: "`openclaw agents` の CLI リファレンス (エージェントの一覧表示/追加/削除、ルーティングバインディングの設定、アイデンティティの設定)"
read_when:
  - ワークスペース、ルーティング、認証が分離された複数のエージェントを運用したい場合
title: "agents"
x-i18n:
  source_hash: "b6a6b7b9ac330a6eb35dbbb6c080fcca621b6310983534fe7ad10b90e7f0c38c"
---

# `openclaw agents`

ワークスペース、認証、ルーティングが分離された個別のエージェントを管理します。

関連ドキュメント:
- マルチエージェントルーティング: [マルチエージェントルーティング](/concepts/multi-agent)
- エージェントワークスペース: [エージェントワークスペース](/concepts/agent-workspace)

## 実行例

```bash
openclaw agents list
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## ルーティングバインディング (Routing bindings)

ルーティングバインディングを使用して、インバウンドのチャネルトラフィックを特定のエージェントに固定します。

バインディングの一覧表示:
```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

バインディングの追加:
```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId` を省略した形式 (`--bind <channel>`) で実行すると、OpenClaw はチャネルのデフォルト設定やプラグインのセットアップ情報からアカウント ID を自動的に解決しようと試みます。

### バインディングのスコープ動作

- `accountId` のないバインディングは、そのチャネルのデフォルトアカウントにのみ一致します。
- `accountId: "*"` は、そのチャネルのすべてのアカウントに一致するフォールバック設定となり、明示的なアカウント指定よりも優先度が低くなります。
- すでに特定のチャネルに対して `accountId` なしのバインディングが存在する状態で、後から明示的または自動解決された `accountId` を指定して再度バインドした場合、OpenClaw は重複を作成せずに既存のバインディングをアップグレード（書き換え）します。

例:
```bash
# 最初にチャネル全体（デフォルトアカウント）をバインド
openclaw agents bind --agent work --bind telegram

# その後、特定のアカウントスコープにアップグレード
openclaw agents bind --agent work --bind telegram:ops
```

アップグレード後は、そのバインディングによるルーティング対象は `telegram:ops` に限定されます。もしデフォルトアカウントのルーティングも継続したい場合は、`--bind telegram:default` のように明示的に追加してください。

バインディングの削除:
```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## アイデンティティファイル (Identity files)

各エージェントのワークスペースルートに `IDENTITY.md` を置くことができます:

- パスの例: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` コマンドを実行すると、ワークスペースルート (または `--identity-file` で指定したファイル) から情報を読み取ります。

アバター（画像）のパスは、ワークスペースルートからの相対パスとして解決されます。

## アイデンティティの設定

`set-identity` は `agents.list[].identity` の各フィールドを書き換えます:

- `name` (名前)
- `theme` (テーマ)
- `emoji` (絵文字)
- `avatar` (アバター画像。ワークスペース相対パス、http(s) URL、または data URI)

`IDENTITY.md` から読み込む例:
```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

各フィールドを明示的に指定して上書きする例:
```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

構成ファイルの記述例:
```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
