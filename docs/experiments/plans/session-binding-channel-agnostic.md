---
summary: "チャネル非依存のセッションバインディング設計と、Iteration 1 で実装する範囲"
read_when:
  - チャネル非依存のセッションルーティングとバインディングをリファクタリングするとき
  - チャネル間でのセッション配信の重複、古い状態、欠落を調査するとき
owner: "onutc"
status: "in-progress"
last_updated: "2026-02-21"
title: "Session Binding Channel Agnostic 計画"
x-i18n:
  source_hash: "9bf79098053da3d7a28ec4f7fe8289b5c39462c23b5ca1420a83ffb02191c7cd"
---

# Session Binding Channel Agnostic 計画

## 概要

この文書では、長期的に採用するチャネル非依存の session binding モデルと、次の実装イテレーションで扱う具体的な範囲を定義します。

目標:

- subagent にバインドされた session routing をコア機能にする
- チャネル固有の挙動は adapter 側に閉じ込める
- 通常の Discord 挙動で回帰を起こさない

## この文書が必要な理由

現行挙動では、次の関心事が混在しています。

- completion content policy
- destination routing policy
- Discord 固有の詳細

その結果、次のようなエッジケースが発生していました。

- 並行実行時に main と thread の両方へ重複配信される
- 再利用した binding manager で古いトークンを使ってしまう
- webhook 送信時の activity 記録が欠落する

## Iteration 1 の範囲

このイテレーションは意図的に限定しています。

### 1. チャネル非依存のコアインターフェースを追加する

binding と routing のためのコア型および service interface を追加します。

提案するコア型:

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

コア service 契約:

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

### 2. subagent completion 用のコア配信ルーターを 1 つ追加する

completion event に対して、単一の宛先解決経路を追加します。

router 契約:

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

このイテレーションでは:

- 新経路を通すのは `task_completion` のみ
- 他の event kind の既存経路はそのまま残す

### 3. Discord は adapter のまま維持する

最初の adapter 実装は引き続き Discord とします。

adapter の責務:

- thread conversation を作成または再利用する
- webhook または channel send によって bound message を送る
- thread の状態（archive / delete）を検証する
- adapter metadata（webhook identity、thread ID など）を扱う

### 4. 既知の正確性問題を修正する

このイテレーションで必須とする項目:

- 既存の thread binding manager を再利用する際に、最新トークンを使うようにする
- webhook ベースの Discord 送信で outbound activity を記録する
- session mode completion で bound thread destination が選ばれた場合、暗黙の main channel フォールバックを止める

### 5. 現在のランタイム安全デフォルトを維持する

thread-bound spawn を無効化しているユーザーには、挙動変更を発生させません。

デフォルトは維持:

- `channels.discord.threadBindings.spawnSubagentSessions = false`

結果:

- 通常の Discord ユーザーは現行挙動のままになる
- 新しいコア経路が影響するのは、有効化された bound session completion routing のみ

## Iteration 1 に含めないもの

明示的に後回しにする項目:

- ACP binding target（`targetKind: "acp"`）
- Discord 以外の新しい channel adapter
- すべての配信経路の全面置換（`spawn_ack`、将来の `subagent_message`）
- protocol レベルの変更
- すべての binding persistence に対する store migration / versioning の再設計

ACP に関する注記:

- interface 設計上は ACP を拡張できる余地を残す
- ACP 実装自体はこのイテレーションでは開始しない

## ルーティング不変条件

Iteration 1 では、次の不変条件を必須とします。

- 宛先選択とコンテンツ生成は別ステップであること
- session mode completion が active な bound destination に解決された場合、配信は必ずその宛先へ送られること
- bound destination から main channel への隠れた reroute を行わないこと
- fallback 挙動は明示的で観測可能であること

## 互換性とロールアウト

互換性目標:

- thread-bound spawn がオフのユーザーに回帰がないこと
- このイテレーションでは非 Discord チャンネルに変更を入れないこと

ロールアウト:

1. interface と router を既存の feature gate の背後で導入する
2. Discord の completion mode における bound delivery を router 経由にする
3. 非 bound flow には従来経路を残す
4. 対象テストと canary runtime log で検証する

## Iteration 1 で必要なテスト

必要な unit / integration カバレッジ:

- manager の token rotation が、manager 再利用後も最新トークンを使うこと
- webhook 送信が channel activity timestamp を更新すること
- 同一 requester channel に 2 つの active bound session があっても main channel に重複配信しないこと
- bound session mode run の completion が thread destination のみに解決されること
- spawn flag を無効化した場合、従来挙動が変わらないこと

## 提案する実装ファイル

Core:

- `src/infra/outbound/session-binding-service.ts`（新規）
- `src/infra/outbound/bound-delivery-router.ts`（新規）
- `src/agents/subagent-announce.ts`（completion destination 解決の統合）

Discord adapter と runtime:

- `src/discord/monitor/thread-bindings.manager.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/send.outbound.ts`

Tests:

- `src/discord/monitor/provider*.test.ts`
- `src/discord/monitor/reply-delivery.test.ts`
- `src/agents/subagent-announce.format.test.ts`

## Iteration 1 の完了条件

- コア interface が存在し、completion routing に接続されていること
- 上記の正確性修正がテスト付きでマージされていること
- session mode の bound run で main と thread の completion 配信が重複しないこと
- bound spawn を無効化したデプロイメントで挙動変更がないこと
- ACP が明示的に deferred のままであること
