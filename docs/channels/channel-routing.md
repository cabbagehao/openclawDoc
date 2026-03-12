---
summary: "チャンネルごとのルーティングルールと共有コンテキスト"
read_when:
  - チャンネルルーティングまたは受信トレイの動作を変更する場合
title: "Channel Routing"
x-i18n:
  source_path: "channels/channel-routing.md"
  source_hash: "0fd17f592ef24891ad8721a4cc34fe4b430fa568be843ee81d13def6e45dfa8f"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:32:27.083Z"
---
OpenClaw は、メッセージを受信した **同じチャンネルへ返信** します。モデルが返信先チャンネルを選ぶことはなく、ルーティングは決定的で、ホスト側の設定によって制御されます。

## 主要な用語

- **Channel**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`
- **AccountId**: チャンネルごとのアカウントインスタンスです。対応しているチャンネルで使用されます。
- チャンネルごとの既定アカウント: `channels.<channel>.defaultAccount` を使うと、送信時のパスで `accountId` を明示していない場合に使うアカウントを指定できます。
  - マルチアカウント構成では、2 つ以上のアカウントがある場合に明示的な既定値 (`defaultAccount` または `accounts.default`) を設定してください。設定しないと、フォールバックルーティングで最初に正規化されたアカウント ID が選ばれることがあります。
- **AgentId**: 分離されたワークスペースとセッションストアを持つエージェント識別子です。
- **SessionKey**: コンテキスト保存と同時実行制御に使うキーです。

## セッションキーの形式(例)

ダイレクトメッセージはエージェントの **main** セッションに集約されます。

- `agent:<agentId>:<mainKey>` (デフォルト: `agent:main:main`)

グループとチャンネルは、チャンネル単位で分離されたまま保持されます。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャンネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack / Discord のスレッドでは、ベースキーに `:thread:<threadId>` が追加されます。
- Telegram のフォーラムトピックでは、グループキーに `:topic:<topicId>` が含まれます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## メインDMルートのピン留め

`session.dmScope` が `main` の場合、ダイレクトメッセージは 1 つのメインセッションを共有することがあります。所有者以外の DM によってセッションの `lastRoute` が上書きされるのを防ぐため、OpenClaw は次の条件をすべて満たす場合に、`allowFrom` から固定対象の所有者を推定します。

- `allowFrom` にワイルドカード以外のエントリが 1 つだけある
- そのエントリを、当該チャンネルの具体的な送信者 ID に正規化できる
- 受信した DM の送信者が、その固定された所有者と一致しない

この不一致が起きた場合でも、OpenClaw は受信セッションのメタデータは記録しますが、メインセッションの `lastRoute` は更新しません。

## ルーティングルール(エージェントの選択方法)

ルーティングでは、各受信メッセージに対して **1 つのエージェント** が選ばれます。

1. **完全一致する peer** (`peer.kind` + `peer.id` を持つ `bindings`)
2. **親 peer 一致** (スレッド継承)
3. **ギルド + ロール一致** (Discord、`guildId` + `roles`)
4. **ギルド一致** (Discord、`guildId`)
5. **チーム一致** (Slack、`teamId`)
6. **アカウント一致** (チャンネル上の `accountId`)
7. **チャンネル一致** (そのチャンネル上の任意アカウント、`accountId: "*"`)
8. **既定エージェント** (`agents.list[].default`、なければ最初のリスト項目、さらにフォールバックとして `main`)

1 つのバインディングに複数の一致条件 (`peer`、`guildId`、`teamId`、`roles`) が含まれている場合は、**指定されたすべての条件が一致したときだけ** そのバインディングが適用されます。

どのワークスペースとセッションストアを使うかは、最終的に一致したエージェントによって決まります。

## ブロードキャストグループ(複数エージェントの実行)

ブロードキャストグループを使うと、**OpenClaw が通常返信する場面** で、同じ peer に対して **複数のエージェント** を実行できます。たとえば WhatsApp グループでは、メンションやアクティベーションの条件を通過したあとに適用されます。

設定:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

詳しくは [ブロードキャストグループ](/channels/broadcast-groups) を参照してください。

## 設定の概要

- `agents.list`: 名前付きエージェントの定義です。ワークスペースやモデルなどを指定します。
- `bindings`: 受信したチャンネル、アカウント、peer をどのエージェントへ割り当てるかを定義します。

例:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## セッションストレージ

セッションストアは、状態ディレクトリ (デフォルトは `~/.openclaw`) の下に配置されます。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 形式のトランスクリプトは、ストアと同じ場所に保存されます。

`session.store` と `{agentId}` テンプレートを使って保存先パスを上書きできます。

## WebChatの動作

WebChat は **選択したエージェント** に接続され、既定ではそのエージェントのメインセッションを使います。そのため、同じエージェントが持つクロスチャンネルのコンテキストを 1 か所から確認できます。

## 返信コンテキスト

受信した返信には、次の情報が含まれます。

- 利用可能な場合は `ReplyToId`、`ReplyToBody`、`ReplyToSender`
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追加されます。

この挙動は、どのチャンネルでも共通です。
