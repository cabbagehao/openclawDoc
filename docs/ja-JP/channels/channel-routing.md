---
summary: "チャンネル(WhatsApp、Telegram、Discord、Slack)ごとのルーティングルールと共有コンテキスト"
read_when:
  - チャンネルルーティングまたは受信トレイの動作を変更する場合
title: "チャンネルルーティング"
x-i18n:
  source_path: "channels/channel-routing.md"
  source_hash: "0fd17f592ef24891ad8721a4cc34fe4b430fa568be843ee81d13def6e45dfa8f"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:32:27.083Z"
---

# チャンネルとルーティング

OpenClawは、メッセージが送信されてきた**チャンネルに返信をルーティング**します。モデルはチャンネルを選択せず、ルーティングは決定論的でホスト設定によって制御されます。

## 主要な用語

- **Channel**: `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`、`webchat`
- **AccountId**: チャンネルごとのアカウントインスタンス(サポートされている場合)
- オプションのチャンネルデフォルトアカウント: `channels.<channel>.defaultAccount`は、アウトバウンドパスが`accountId`を指定していない場合に使用されるアカウントを選択します
  - マルチアカウント設定では、2つ以上のアカウントが設定されている場合、明示的なデフォルト(`defaultAccount`または`accounts.default`)を設定してください。これがないと、フォールバックルーティングが最初の正規化されたアカウントIDを選択する可能性があります
- **AgentId**: 分離されたワークスペース + セッションストア(「脳」)
- **SessionKey**: コンテキストを保存し、同時実行を制御するために使用されるバケットキー

## セッションキーの形式(例)

ダイレクトメッセージはエージェントの**main**セッションに集約されます:

- `agent:<agentId>:<mainKey>` (デフォルト: `agent:main:main`)

グループとチャンネルはチャンネルごとに分離されたままです:

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャンネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discordスレッドは、ベースキーに`:thread:<threadId>`を追加します
- Telegramフォーラムトピックは、グループキーに`:topic:<topicId>`を埋め込みます

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## メインDMルートのピン留め

`session.dmScope`が`main`の場合、ダイレクトメッセージは1つのメインセッションを共有する可能性があります。セッションの`lastRoute`が所有者以外のDMによって上書きされるのを防ぐため、OpenClawは以下のすべてが真の場合、`allowFrom`からピン留めされた所有者を推測します:

- `allowFrom`にワイルドカードでないエントリが1つだけある
- そのエントリがそのチャンネルの具体的な送信者IDに正規化できる
- インバウンドDM送信者がそのピン留めされた所有者と一致しない

その不一致の場合、OpenClawはインバウンドセッションメタデータを記録しますが、メインセッションの`lastRoute`の更新をスキップします。

## ルーティングルール(エージェントの選択方法)

ルーティングは、各インバウンドメッセージに対して**1つのエージェント**を選択します:

1. **完全なピア一致**(`peer.kind` + `peer.id`を持つ`bindings`)
2. **親ピア一致**(スレッド継承)
3. **ギルド + ロール一致**(Discord)`guildId` + `roles`経由
4. **ギルド一致**(Discord)`guildId`経由
5. **チーム一致**(Slack)`teamId`経由
6. **アカウント一致**(チャンネル上の`accountId`)
7. **チャンネル一致**(そのチャンネル上の任意のアカウント、`accountId: "*"`)
8. **デフォルトエージェント**(`agents.list[].default`、それ以外は最初のリストエントリ、フォールバックは`main`)

バインディングに複数の一致フィールド(`peer`、`guildId`、`teamId`、`roles`)が含まれている場合、そのバインディングが適用されるには**提供されたすべてのフィールドが一致する必要があります**。

一致したエージェントが、どのワークスペースとセッションストアが使用されるかを決定します。

## ブロードキャストグループ(複数エージェントの実行)

ブロードキャストグループを使用すると、**OpenClawが通常返信する場合**(例: WhatsAppグループでメンション/アクティベーションゲーティング後)に、同じピアに対して**複数のエージェント**を実行できます。

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

参照: [ブロードキャストグループ](/channels/broadcast-groups)

## 設定の概要

- `agents.list`: 名前付きエージェント定義(ワークスペース、モデルなど)
- `bindings`: インバウンドチャンネル/アカウント/ピアをエージェントにマッピング

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

セッションストアは状態ディレクトリ(デフォルト`~/.openclaw`)の下に存在します:

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONLトランスクリプトはストアと並んで存在します

`session.store`と`{agentId}`テンプレートを使用して、ストアパスを上書きできます。

## WebChatの動作

WebChatは**選択されたエージェント**にアタッチし、デフォルトでエージェントのメインセッションになります。このため、WebChatでは、そのエージェントのクロスチャンネルコンテキストを1か所で確認できます。

## 返信コンテキスト

インバウンド返信には以下が含まれます:

- 利用可能な場合、`ReplyToId`、`ReplyToBody`、`ReplyToSender`
- 引用されたコンテキストは、`[Replying to ...]`ブロックとして`Body`に追加されます

これはチャンネル間で一貫しています。
