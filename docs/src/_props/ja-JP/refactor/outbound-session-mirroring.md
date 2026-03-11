---
title: "アウトバウンド セッション ミラーリングのリファクタリング (問題 #1520)"
description: Track outbound session mirroring refactor notes, decisions, tests, and open items.
summary: "アウトバウンド送信をターゲット チャネル セッションにミラーリングするためのメモをリファクタリングする"
read_when:
  - アウトバウンドのトランスクリプト/セッションのミラーリング動作に取り組んでいます
  - 送信/メッセージ ツール パスの sessionKey 導出のデバッグ
x-i18n:
  source_hash: "45e457bcea47dfbffc5f30a852914f33051b7d8d9ed27119be8005262eb22f70"
---

# アウトバウンドセッションミラーリングのリファクタリング (問題 #1520)

## ステータス

* 進行中です。
* コア + プラグイン チャネル ルーティングがアウトバウンド ミラーリング用に更新されました。
* ゲートウェイ送信は、sessionKey が省略された場合にターゲット セッションを導出するようになりました。

## コンテキスト

アウトバウンド送信は、ターゲット チャネル セッションではなく、現在のエージェント セッション (ツール セッション キー) にミラーリングされました。インバウンドルーティングではチャネル/ピアセッションキーが使用されるため、アウトバウンド応答は間違ったセッションに到達し、ファーストコンタクトターゲットにはセッションエントリが欠けていることがよくありました。

## 目標

* 送信メッセージをターゲット チャネル セッション キーにミラーリングします。
* セッション エントリが見つからない場合は、アウトバウンドでセッション エントリを作成します。
* スレッド/トピックのスコープを受信セッション キーに合わせて維持します。
* コア チャネルとバンドルされた拡張機能をカバーします。

## 実装の概要

* 新しいアウトバウンド セッション ルーティング ヘルパー:
  * `src/infra/outbound/outbound-session.ts`
  * `resolveOutboundSessionRoute` は、`buildAgentSessionKey` (dmScope +identityLinks) を使用してターゲット sessionKey を構築します。
  * `ensureOutboundSessionEntry` は、`recordSessionMetaFromInbound` を介して最小限の `MsgContext` を書き込みます。

* `runMessageAction` (送信) はターゲットの sessionKey を取得し、それをミラーリングのために `executeSendAction` に渡します。

* `message-tool` は直接ミラーリングしなくなりました。現在のセッション キーから AgentId のみを解決します。

* プラグインは、派生した sessionKey を使用して `appendAssistantMessageToSessionTranscript` 経由でパス ミラーを送信します。

* ゲートウェイ送信は、ターゲット セッション キーが指定されていない場合 (デフォルト エージェント) に派生し、セッション エントリを保証します。## スレッド/トピックの処理

* Slack: ReplyTo/threadId -> `resolveThreadSessionKeys` (サフィックス)。

* Discord: threadId/replyTo -> `resolveThreadSessionKeys` と `useSuffix=false` を受信に一致させます (スレッド チャネル ID はすでにセッションをスコープしています)。

* テレグラム: トピック ID は `buildTelegramGroupPeerId` を介して `chatId:topic:<id>` にマップされます。

## 対象となる拡張機能

* Matrix、MS Teams、Mattermost、BlueBubbles、Nextcloud Talk、Zalo、Zalo Personal、Nostr、Tlon。
* 注:
  * Mattermost ターゲットは、DM セッション キー ルーティングのために `@` を削除するようになりました。
  * Zalo Personal は、1:1 ターゲットに対して DM ピアの種類を使用します (`group:` が存在する場合のみグループ)。
  * BlueBubbles グループ ターゲットは、受信セッション キーと一致するように `chat_*` プレフィックスを削除します。
  * Slack の自動スレッド ミラーリングは、大文字と小文字を区別せずにチャネル ID と一致します。
  * ゲートウェイは、ミラーリングの前に、提供された小文字のセッション キーを送信します。

## 決定

* **ゲートウェイ送信セッション導出**: `sessionKey` が提供されている場合は、それを使用します。省略した場合は、ターゲット + デフォルト エージェントから sessionKey を取得し、そこにミラーリングします。
* **セッション エントリの作成**: 常に、受信形式に合わせた `Provider/From/To/ChatType/AccountId/Originating*` とともに `recordSessionMetaFromInbound` を使用します。
* **ターゲットの正規化**: 送信ルーティングは、利用可能な場合は解決されたターゲット (`resolveChannelTarget` 以降) を使用します。
* **セッション キーの大文字と小文字の区別**: 書き込み時および移行中に、セッション キーを小文字に正規化します。

## テストが追加/更新されました- `src/infra/outbound/outbound.test.ts`

* Slack スレッドのセッションキー。
* テレグラムトピックセッションキー。
* dmScope アイデンティティ Discord とリンクします。
* `src/agents/tools/message-tool.test.ts`
  * セッションキーからagentIdを導出します(sessionKeyは渡されません)。
* `src/gateway/server-methods/send.test.ts`
  * 省略時にセッションキーを導出し、セッションエントリを作成します。

## 未解決の項目/フォローアップ

* 音声通話プラグインはカスタム `voice:<phone>` セッション キーを使用します。ここではアウトバウンドマッピングは標準化されていません。メッセージ ツールが音声通話の送信をサポートする必要がある場合は、明示的なマッピングを追加します。
* バンドルされたセットを超える非標準の `From/To` 形式を使用する外部プラグインがないか確認します。

## タッチされたファイル

* `src/infra/outbound/outbound-session.ts`
* `src/infra/outbound/outbound-send-service.ts`
* `src/infra/outbound/message-action-runner.ts`
* `src/agents/tools/message-tool.ts`
* `src/gateway/server-methods/send.ts`
* テスト対象:
  * `src/infra/outbound/outbound.test.ts`
  * `src/agents/tools/message-tool.test.ts`
  * `src/gateway/server-methods/send.test.ts`
