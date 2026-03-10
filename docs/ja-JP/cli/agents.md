---
summary: "「openclaw エージェント」の CLI リファレンス (リスト/追加/削除/バインディング/バインド/バインド解除/アイデンティティの設定)"
read_when:
  - 複数の独立したエージェント (ワークスペース + ルーティング + 認証) が必要な場合
title: "エージェント"
x-i18n:
  source_hash: "b6a6b7b9ac330a6eb35dbbb6c080fcca621b6310983534fe7ad10b90e7f0c38c"
---

# `openclaw agents`

分離されたエージェントを管理します (ワークスペース + 認証 + ルーティング)。

関連:

- マルチエージェントルーティング: [マルチエージェントルーティング](/concepts/multi-agent)
- エージェント ワークスペース: [エージェント ワークスペース](/concepts/agent-workspace)

## 例

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

## ルーティングバインディング

ルーティング バインディングを使用して、受信チャネル トラフィックを特定のエージェントに固定します。

バインディングのリスト:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

バインディングを追加します。

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId` (`--bind <channel>`) を省略した場合、OpenClaw はチャネルのデフォルトとプラグインのセットアップ フック (利用可能な場合) から解決します。

### バインディングスコープの動作

- `accountId` のないバインディングは、チャネルのデフォルト アカウントにのみ一致します。
- `accountId: "*"` はチャネル全体のフォールバック (すべてのアカウント) であり、明示的なアカウント バインディングほど具体的ではありません。
- 同じエージェントに `accountId` のない一致するチャネル バインディングがすでにあり、後で明示的または解決された `accountId` を使用してバインドする場合、OpenClaw は重複を追加する代わりに、その既存のバインディングを適切な場所にアップグレードします。

例:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

アップグレード後、そのバインディングのルーティングのスコープは `telegram:ops` になります。デフォルト アカウントのルーティングも必要な場合は、明示的に追加します (`--bind telegram:default` など)。

バインディングを削除します。

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## ID ファイル

各エージェント ワークスペースには、ワークスペース ルートに `IDENTITY.md` を含めることができます。- パスの例: `~/.openclaw/workspace/IDENTITY.md`

- `set-identity --from-identity` はワークスペース ルート (または明示的な `--identity-file`) から読み取ります。

アバター パスは、ワークスペース ルートを基準にして解決されます。

## ID を設定する

`set-identity` はフィールドを `agents.list[].identity` に書き込みます。

- `name`
- `theme`
- `emoji`
- `avatar` (ワークスペースの相対パス、http(s) URL、またはデータ URI)

`IDENTITY.md` からロード:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

フィールドを明示的にオーバーライドします。

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

構成サンプル:

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
