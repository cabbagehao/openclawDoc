---
summary: "ペアリングの概要: 誰があなたに DM を送信できるか、どのノードが参加できるかを承認します"
read_when:
  - DMアクセス制御の設定
  - 新しい iOS/Android ノードのペアリング
  - OpenClaw のセキュリティ体制の見直し
title: "ペアリング"
x-i18n:
  source_hash: "65894ceee288fcd03547a4570ee06b9bdc6721cf6e32745a5f9507c34935eba3"
---

# ペアリング

「ペアリング」は、OpenClaw の明示的な **所有者の承認** ステップです。
次の 2 つの場所で使用されます。

1. **DM ペアリング** (ボットとの会話を許可されるユーザー)
2. **ノードのペアリング** (ゲートウェイ ネットワークへの参加を許可されるデバイス/ノード)

セキュリティコンテキスト: [セキュリティ](/gateway/security)

## 1) DM ペアリング (インバウンド チャット アクセス)

チャネルが DM ポリシー `pairing` で構成されている場合、不明な送信者はショート コードを受け取り、承認されるまでメッセージは **処理されません**。

デフォルトの DM ポリシーは、[セキュリティ](/gateway/security) に文書化されています。

ペアリングコード:

- 8 文字、大文字、あいまいな文字は含まれません (`0O1I`)。
- **1 時間後に期限切れになります**。ボットは、新しいリクエストが作成されたときにのみペアリング メッセージを送信します (送信者ごとに 1 時間に 1 回程度)。
- 保留中の DM ペアリング要求は、デフォルトで **チャネルごとに 3** に制限されます。追加のリクエストは、期限が切れるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

サポートされているチャネル: `telegram`、`whatsapp`、`signal`、`imessage`、`discord`、`slack`、`feishu`。

### ステータスの保存場所

`~/.openclaw/credentials/` に保存されます:

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認された許可リスト ストア:
  - デフォルトのアカウント: `<channel>-allowFrom.json`
  - デフォルト以外のアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントのスコープ動作:

- デフォルト以外のアカウントは、スコープ指定された許可リスト ファイルのみを読み取り/書き込みします。
- デフォルト アカウントは、チャネル スコープの（スコープ指定されていない）許可リスト ファイルを使用します。

これらは機密情報として扱ってください（アシスタントへのアクセスを制限するものです）。

## 2) ノードデバイスのペアリング (iOS/Android/macOS/ヘッドレスノード)

ノードは、`role: node` として **デバイス** 形式でゲートウェイに接続します。ゲートウェイは、承認が必要なデバイス ペアリング要求を作成します。

### Telegram 経由でペアリング (iOS の場合推奨)

`device-pair` プラグインを使用すると、初回のデバイス ペアリングをすべて Telegram から行うことができます。

1. Telegram で、ボットにメッセージを送信します: `/pair`
2. ボットは 2 つのメッセージで応答します。1 つは指示メッセージ、もう 1 つは個別の **セットアップ コード** メッセージ (Telegram で簡単にコピー/ペーストできます) です。
3. スマートフォンで、OpenClaw iOS アプリを開き、[Settings] → [Gateway] を選択します。
4. セットアップコードを貼り付けて接続します。
5. Telegram に戻り、`/pair approve` を送信します。

セットアップ コードは base64 でエンコードされた JSON ペイロードで、以下が含まれます。

- `url`: ゲートウェイの WebSocket URL (`ws://...` または `wss://...`)
- `token`: 有効期間の短いペアリング トークン

セットアップ コードは、有効な間はパスワードのように扱ってください。

### ノードデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### ノードペアリング状態のストレージ

`~/.openclaw/devices/` に保存されます:

- `pending.json` (短命なリクエスト。保留中のリクエストは期限切れになります)
- `paired.json` (ペアリング済みデバイス + トークン)

### 注記

- 従来の `node.pair.*` API (CLI: `openclaw nodes pending/approve`) は、ゲートウェイが所有する別のペアリング ストアです。WS ノードでは引き続きデバイスのペアリングが必要です。

## 関連ドキュメント

- セキュリティ モデル + プロンプト インジェクション: [セキュリティ](/gateway/security)
- 安全に更新 (openclaw doctor を実行): [更新](/install/updating)
- チャネル構成:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (レガシー): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
