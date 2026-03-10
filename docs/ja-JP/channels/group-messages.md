---
summary: "WhatsAppグループメッセージの処理動作と設定（mentionPatternsは複数のサーフェスで共有されます）"
read_when:
  - グループメッセージのルールやメンションを変更する場合
title: "グループメッセージ"
x-i18n:
  source_path: "channels/group-messages.md"
  source_hash: "181a72f12f5021af77c2e4c913120f711e0c0bc271d218d75cb6fe80dab675bb"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:36:49.684Z"
---

# グループメッセージ（WhatsApp webチャンネル）

目標：ClawdをWhatsAppグループに参加させ、メンションされた時のみ起動し、そのスレッドを個人DMセッションとは別に保つ。

注：`agents.list[].groupChat.mentionPatterns`は現在Telegram/Discord/Slack/iMessageでも使用されています。このドキュメントはWhatsApp固有の動作に焦点を当てています。マルチエージェント設定の場合は、エージェントごとに`agents.list[].groupChat.mentionPatterns`を設定してください（またはグローバルフォールバックとして`messages.groupChat.mentionPatterns`を使用）。

## 実装済みの機能（2025-12-03）

- 起動モード：`mention`（デフォルト）または`always`。`mention`はメンション（`mentionedJids`経由の実際のWhatsApp @メンション、正規表現パターン、またはテキスト内のボットのE.164番号）が必要です。`always`はすべてのメッセージでエージェントを起動しますが、有意義な価値を追加できる場合のみ返信する必要があります。それ以外の場合はサイレントトークン`NO_REPLY`を返します。デフォルトは設定（`channels.whatsapp.groups`）で設定でき、`/activation`でグループごとに上書きできます。`channels.whatsapp.groups`が設定されている場合、グループ許可リストとしても機能します（すべてを許可するには`"*"`を含めてください）。
- グループポリシー：`channels.whatsapp.groupPolicy`はグループメッセージを受け入れるかどうかを制御します（`open|disabled|allowlist`）。`allowlist`は`channels.whatsapp.groupAllowFrom`を使用します（フォールバック：明示的な`channels.whatsapp.allowFrom`）。デフォルトは`allowlist`（送信者を追加するまでブロック）です。
- グループごとのセッション：セッションキーは`agent:<agentId>:whatsapp:group:<jid>`のような形式なので、`/verbose on`や`/think high`などのコマンド（スタンドアロンメッセージとして送信）はそのグループにスコープされます。個人DMの状態は影響を受けません。ハートビートはグループスレッドではスキップされます。
- コンテキスト注入：実行をトリガー*しなかった***保留中のみ**のグループメッセージ（デフォルト50件）は`[Chat messages since your last reply - for context]`の下にプレフィックスが付けられ、トリガーメッセージは`[Current message - respond to this]`の下に配置されます。既にセッションにあるメッセージは再注入されません。
- 送信者の表示：すべてのグループバッチは`[from: Sender Name (+E164)]`で終わるため、Piは誰が話しているかを把握できます。
- エフェメラル/一度だけ表示：テキスト/メンションを抽出する前にそれらをアンラップするため、その中のメンションでもトリガーされます。
- グループシステムプロンプト：グループセッションの最初のターン（および`/activation`でモードが変更されるたびに）、システムプロンプトに`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.`のような短い説明を注入します。メタデータが利用できない場合でも、エージェントにグループチャットであることを伝えます。

## 設定例（WhatsApp）

`~/.openclaw/openclaw.json`に`groupChat`ブロックを追加して、WhatsAppがテキスト本文の視覚的な`@`を削除した場合でも表示名メンションが機能するようにします：

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

注：

- 正規表現は大文字小文字を区別しません。`@openclaw`のような表示名メンションと、`+`/スペースの有無にかかわらず生の番号をカバーします。
- 誰かが連絡先をタップすると、WhatsAppは`mentionedJids`経由で正規のメンションを送信するため、番号フォールバックはほとんど必要ありませんが、有用な安全策です。

### 起動コマンド（オーナーのみ）

グループチャットコマンドを使用：

- `/activation mention`
- `/activation always`

オーナー番号（`channels.whatsapp.allowFrom`から、または未設定の場合はボット自身のE.164）のみがこれを変更できます。グループ内でスタンドアロンメッセージとして`/status`を送信すると、現在の起動モードが表示されます。

## 使用方法

1. WhatsAppアカウント（OpenClawを実行しているもの）をグループに追加します。
2. `@openclaw …`と言う（または番号を含める）。`groupPolicy: "open"`を設定しない限り、許可リストに登録された送信者のみがトリガーできます。
3. エージェントプロンプトには最近のグループコンテキストと末尾の`[from: …]`マーカーが含まれるため、適切な人に対応できます。
4. セッションレベルのディレクティブ（`/verbose on`、`/think high`、`/new`または`/reset`、`/compact`）はそのグループのセッションにのみ適用されます。スタンドアロンメッセージとして送信して登録してください。個人DMセッションは独立したままです。

## テスト/検証

- 手動スモークテスト：
  - グループで`@openclaw`メンションを送信し、送信者名を参照する返信を確認します。
  - 2回目のメンションを送信し、履歴ブロックが含まれ、次のターンでクリアされることを確認します。
- Gatewayログ（`--verbose`で実行）を確認して、`from: <groupJid>`と`[from: …]`サフィックスを示す`inbound web message`エントリを確認します。

## 既知の考慮事項

- ハートビートは、ノイズの多いブロードキャストを避けるため、グループでは意図的にスキップされます。
- エコー抑制は結合されたバッチ文字列を使用します。メンションなしで同じテキストを2回送信した場合、最初のもののみが応答を受け取ります。
- セッションストアエントリは、セッションストア（デフォルトでは`~/.openclaw/agents/<agentId>/sessions/sessions.json`）に`agent:<agentId>:whatsapp:group:<jid>`として表示されます。エントリがない場合は、グループがまだ実行をトリガーしていないことを意味します。
- グループでのタイピングインジケーターは`agents.defaults.typingMode`に従います（デフォルト：メンションされていない場合は`message`）。
