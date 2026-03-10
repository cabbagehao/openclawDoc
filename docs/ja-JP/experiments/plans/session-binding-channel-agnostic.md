---
summary: "チャネルに依存しないセッション バインディング アーキテクチャとイテレーション 1 の配信範囲"
read_when:
  - チャネルに依存しないセッションのルーティングとバインディングのリファクタリング
  - チャネル間でのセッション配信の重複、古い、または欠落を調査する
owner: "onutc"
status: "in-progress"
last_updated: "2026-02-21"
title: "セッション バインディング チャネルに依存しないプラン"
x-i18n:
  source_hash: "9bf79098053da3d7a28ec4f7fe8289b5c39462c23b5ca1420a83ffb02191c7cd"
---

# セッション バインディング チャネルに依存しないプラン

## 概要

この文書は、長期的なチャネルに依存しないセッション バインディング モデルと、次の実装反復の具体的な範囲を定義します。

目標:

- サブエージェントにバインドされたセッションルーティングをコア機能にする
- アダプター内でチャネル固有の動作を維持する
- 通常の Discord の動作における回帰を回避します

## これが存在する理由

現在の動作は次のとおりです。

- 完了コンテンツポリシー
- 宛先ルーティングポリシー
- Discord固有の詳細

これにより、次のような特殊なケースが発生しました。

- 同時実行時のメインとスレッドの配信の重複
- 再利用されたバインディング マネージャーでの古いトークンの使用
- Webhook 送信を考慮したアクティビティが欠落しています

## 反復 1 のスコープ

この反復は意図的に制限されています。

### 1. チャネルに依存しないコア インターフェイスを追加する

バインディングとルーティング用のコア タイプとサービス インターフェイスを追加します。

提案されているコアのタイプ:

```ts
export type BindingTargetKind = "subagent" | "session";
export type BindingStatus = "active" | "ending" | "ended";

export type ConversationRef = {
  channel: string;
  accountId: string;
  conversationId: string;
  parentConversationId?: string;
};

export type SessionBindingRecord = {
  bindingId: string;
  targetSessionKey: string;
  targetKind: BindingTargetKind;
  conversation: ConversationRef;
  status: BindingStatus;
  boundAt: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
};
```

コアサービス契約:

```ts
export interface SessionBindingService {
  bind(input: {
    targetSessionKey: string;
    targetKind: BindingTargetKind;
    conversation: ConversationRef;
    metadata?: Record<string, unknown>;
    ttlMs?: number;
  }): Promise<SessionBindingRecord>;

  listBySession(targetSessionKey: string): SessionBindingRecord[];
  resolveByConversation(ref: ConversationRef): SessionBindingRecord | null;
  touch(bindingId: string, at?: number): void;
  unbind(input: {
    bindingId?: string;
    targetSessionKey?: string;
    reason: string;
  }): Promise<SessionBindingRecord[]>;
}
```

### 2. サブエージェント完了用のコア配信ルーターを 1 つ追加します

完了イベントに対して単一の宛先解決パスを追加します。

ルーター契約：

```ts
export interface BoundDeliveryRouter {
  resolveDestination(input: {
    eventKind: "task_completion";
    targetSessionKey: string;
    requester?: ConversationRef;
    failClosed: boolean;
  }): {
    binding: SessionBindingRecord | null;
    mode: "bound" | "fallback";
    reason: string;
  };
}
```

この反復の場合:

- `task_completion` のみがこの新しいパスを経由してルーティングされます
- 他のイベント種類の既存のパスはそのまま残ります

### 3. Discord をアダプターとして維持する

Discord は依然として最初のアダプター実装です。

アダプターの責任:- スレッドの会話を作成/再利用する

- Webhook またはチャネル送信経由でバインドされたメッセージを送信する
- スレッドの状態を検証します (アーカイブ/削除)
- マップアダプターのメタデータ (Webhook ID、スレッド ID)

### 4. 現在知られている正確性の問題を修正する

この反復では次のことが必要です。

- 既存のスレッド バインディング マネージャーを再利用する場合のリフレッシュ トークンの使用法
- Webhook ベースの Discord 送信のアウトバウンドアクティビティを記録します
- セッションモードの完了にバインドされたスレッド宛先が選択された場合、暗黙的なメインチャネルフォールバックを停止します。

### 5. 現在のランタイムの安全性のデフォルトを保持する

スレッド バインド スポーンが無効になっているユーザーの動作は変わりません。

デフォルトのまま:

- `channels.discord.threadBindings.spawnSubagentSessions = false`

結果:

- 通常の Discord ユーザーは現在の動作を維持します
- 新しいコア パスは、有効になっているバインドされたセッション完了ルーティングにのみ影響します。

## 反復 1 には含まれていません

明示的に延期される:

- ACP バインディング ターゲット (`targetKind: "acp"`)
- Discordを超えた新しいチャネルアダプター
- すべての配信パスのグローバル置換 (`spawn_ack`、将来の `subagent_message`)
- プロトコルレベルの変更
- すべてのバインディング永続性のためのストアの移行/バージョン管理の再設計

ACP に関する注意事項:

- インターフェイス設計は ACP のための余地を確保します
- この反復では ACP 実装は開始されません

## ルーティングの不変条件

これらの不変式は反復 1 では必須です。- 宛先の選択とコンテンツの生成は別のステップです

- セッション モードの完了がアクティブなバインドされた宛先に解決される場合、配信はその宛先をターゲットにする必要があります
- バインドされた宛先からメインチャネルへの非表示のリルートはありません
- フォールバック動作は明示的かつ観察可能でなければなりません

## 互換性と展開

互換性ターゲット:

- スレッドバウンドの生成がオフになっているユーザーに対する回帰なし
- このイテレーションでは非 Discord チャンネルに変更はありません

ロールアウト:

1. インターフェイスとルーターを現在の機能ゲートの背後に配置します。
2. Discord 完了モードのバウンド配信をルーター経由でルーティングします。
3. 非バインド フローのレガシー パスを保持します。
4. 対象のテストとカナリア ランタイム ログを使用して検証します。

## 反復 1 で必要なテスト

必要なユニットと統合の範囲:

- マネージャーのトークンのローテーションでは、マネージャーの再利用後に最新のトークンが使用されます。
- Webhook は更新チャネルアクティビティのタイムスタンプを送信します
- 同じリクエスター チャネル内の 2 つのアクティブなバインドされたセッションは、メイン チャネルに複製されません。
- バインドされたセッション モードの実行の完了は、スレッドの宛先のみに解決されます。
- スポーンフラグを無効にすると、従来の動作が変更されません。

## 提案された実装ファイル

コア:

- `src/infra/outbound/session-binding-service.ts` (新規)
- `src/infra/outbound/bound-delivery-router.ts` (新規)
- `src/agents/subagent-announce.ts` (完了宛先解決統合)

Discord アダプターとランタイム:

- `src/discord/monitor/thread-bindings.manager.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/send.outbound.ts`

テスト:- `src/discord/monitor/provider*.test.ts`

- `src/discord/monitor/reply-delivery.test.ts`
- `src/agents/subagent-announce.format.test.ts`

## 反復 1 の完了基準

- コア インターフェイスが存在し、完了ルーティング用に配線されている
- 上記の正確性の修正はテストにマージされます
- セッションモードバウンド実行ではメインとスレッドの重複完了配信はありません
- 無効化されたバウンドスポーンデプロイメントの動作は変更されません
- ACP は明示的に延期されたままになります
