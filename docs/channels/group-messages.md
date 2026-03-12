---
summary: "WhatsApp グループメッセージの挙動と設定"
read_when:
  - グループメッセージのルールやメンションを変更する場合
title: "Group Messages"
x-i18n:
  source_path: "channels/group-messages.md"
  source_hash: "181a72f12f5021af77c2e4c913120f711e0c0bc271d218d75cb6fe80dab675bb"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:36:49.684Z"
---
目的: Clawd を WhatsApp グループに参加させ、必要なときだけ起動し、そのスレッドを個人 DM セッションから分離して扱えるようにすることです。

注: `agents.list[].groupChat.mentionPatterns` は現在、Telegram、Discord、Slack、iMessage でも使われています。このページでは WhatsApp 固有の挙動に絞って説明します。マルチエージェント構成では、エージェントごとに `agents.list[].groupChat.mentionPatterns` を設定してください。グローバルなフォールバックとして `messages.groupChat.mentionPatterns` も利用できます。

## 実装済みの機能 (2025-12-03)

- 起動モード: `mention` (デフォルト) または `always` を使えます。`mention` では、実際の WhatsApp の @メンション (`mentionedJids`)、正規表現パターン、または本文内のボットの E.164 番号のいずれかが必要です。`always` ではすべてのメッセージでエージェントを起動しますが、意味のある応答ができる場合にのみ返信し、それ以外はサイレントトークン `NO_REPLY` を返します。既定値は `channels.whatsapp.groups` で設定でき、`/activation` でグループごとに上書きできます。`channels.whatsapp.groups` を設定した場合は、グループ allowlist としても機能します。すべてのグループを許可するには `"*"` を含めてください。
- グループポリシー: `channels.whatsapp.groupPolicy` でグループメッセージを受け付けるかどうかを制御します (`open|disabled|allowlist`)。`allowlist` では `channels.whatsapp.groupAllowFrom` を使い、未設定時は明示的な `channels.whatsapp.allowFrom` へフォールバックします。デフォルトは `allowlist` で、送信者を追加するまでブロックされます。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` の形式になります。そのため、`/verbose on` や `/think high` のようなコマンドを単独メッセージで送ると、そのグループだけに適用されます。個人 DM の状態には影響しません。ハートビートはグループスレッドでは実行されません。
- コンテキスト注入: 実行をトリガーしなかった保留中のグループメッセージだけが、`[Chat messages since your last reply - for context]` の下に付加されます (デフォルトは 50 件)。トリガーになったメッセージは `[Current message - respond to this]` の下に入ります。すでにセッションへ取り込まれたメッセージは再注入されません。
- 送信者表示: すべてのグループバッチの末尾には `[from: Sender Name (+E164)]` が付き、Pi が誰の発言か把握できるようになっています。
- エフェメラル / 1 回表示メッセージ: テキストやメンションを抽出する前にアンラップするため、その中のメンションでもトリガーできます。
- グループ用システムプロンプト: グループセッションの最初のターン、および `/activation` でモードが変わるたびに、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` のような短い説明をシステムプロンプトへ注入します。メタデータが取れない場合でも、グループチャットであることはエージェントへ伝えられます。

## 設定例 (WhatsApp)

`~/.openclaw/openclaw.json` に `groupChat` ブロックを追加すると、WhatsApp が本文中の見た目上の `@` を取り除いた場合でも、表示名によるメンションを検出できます。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

補足:

- 正規表現は大文字小文字を区別しません。`@openclaw` のような表示名メンションと、`+` や空白の有無にかかわらず生の番号を拾えるようにしています。
- 誰かが連絡先をタップした場合、WhatsApp は通常 `mentionedJids` 経由で正規のメンションを送るため、番号フォールバックは必須ではありません。ただし、安全策としては有用です。

### 起動コマンド (オーナーのみ)

グループチャットで次のコマンドを使います。

- `/activation mention`
- `/activation always`

これを変更できるのは、オーナー番号 (`channels.whatsapp.allowFrom`、未設定の場合はボット自身の E.164) だけです。グループで `/status` を単独メッセージとして送ると、現在の起動モードを確認できます。

## 使い方

1. OpenClaw を実行している WhatsApp アカウントをグループへ追加します。
2. `@openclaw ...` と送るか、番号を本文に含めます。`groupPolicy: "open"` にしていない限り、トリガーできるのは allowlist に登録された送信者だけです。
3. エージェントのプロンプトには最近のグループコンテキストと末尾の `[from: ...]` マーカーが入るため、誰に向けた返信か判断できます。
4. セッション単位の指示 (`/verbose on`、`/think high`、`/new`、`/reset`、`/compact`) は、そのグループのセッションにだけ適用されます。反映させるには単独メッセージで送ってください。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモークテスト:
  - グループで `@openclaw` メンションを送り、送信者名を参照した返信が返ることを確認します。
  - 2 回目のメンションを送り、履歴ブロックが含まれ、次のターンで消えることを確認します。
- ゲートウェイログを `--verbose` 付きで確認し、`from: <groupJid>` と `[from: ...]` のサフィックスが入った `inbound web message` エントリを確認します。

## 注意点

- ハートビートはノイズの多いブロードキャストを避けるため、グループでは意図的に無効化されています。
- エコー抑制は結合済みのバッチ文字列に対して働きます。メンションなしで同じテキストを 2 回送ると、返信は最初の 1 回だけになることがあります。
- セッションストアには `agent:<agentId>:whatsapp:group:<jid>` という形式でエントリが保存されます (デフォルトの保存先は `~/.openclaw/agents/<agentId>/sessions/sessions.json`)。エントリがない場合は、そのグループでまだ実行が発生していないことを意味します。
- グループでのタイピングインジケーターは `agents.defaults.typingMode` に従います。デフォルトは、未メンション時に `message` です。
