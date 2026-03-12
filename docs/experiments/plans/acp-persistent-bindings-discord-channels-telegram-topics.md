---
summary: "Discord チャネルと Telegram フォーラムトピックを長寿命 ACP セッションへ結び付ける永続バインディング計画"
title: "OpenClawのDiscordチャネルとTelegramトピック向けACP永続バインディング設計"
description: "Discord チャネルや Telegram フォーラムトピックを長寿命 ACP セッションへ結び付ける設計計画です。背景、目標、永続バインディングの導入方針を確認できます。"
---
ステータス: 草案

## 概要

以下の要素を、長寿命な ACP セッションへとマッピングする「永続バインディング」機能を導入します。

- Discord チャネル（および必要に応じて既存のスレッド）
- グループ/スーパーグループ内の Telegram フォーラムトピック (`chatId:topic:topicId`)

バインディングの状態は、トップレベルの `bindings[]` エントリに明示的な型（type）を指定して保存されます。

これにより、トラフィックの多いメッセージングチャネルにおいても ACP の利用が予測可能かつ堅牢になり、ユーザーは `codex`, `claude-1`, `claude-myrepo` といった専用のチャネルやトピックを作成できるようになります。

## 背景

現在、スレッドに紐付いた ACP の挙動は、Discord の一時的なスレッドワークフロー向けに最適化されています。一方、Telegram には同様のスレッドモデルはなく、代わりにグループ/スーパーグループ内のフォーラムトピックが存在します。ユーザーはチャット画面において、一時的なスレッドセッションだけでなく、常に利用可能な安定した ACP 「ワークスペース」を求めています。

## 目標

- 以下の耐久性のある ACP バインディングをサポートする:
  - Discord のチャネルおよびスレッド
  - Telegram のフォーラムトピック（グループ/スーパーグループ）
- バインディングの「真実のソース」を構成ファイル主導にする。
- `/acp`, `/new`, `/reset`, `/focus`、および配信の挙動を Discord と Telegram で共通化する。
- アドホック（一時的）な利用のための既存のバインディングフローも維持する。

## 非目標

- ACP ランタイムやセッション内部の完全な再設計。
- 既存の一時的なバインディングフローの削除。
- 初回イテレーションですべてのチャネルへ拡大すること。
- このフェーズでの Telegram チャネルのダイレクトメッセージトピック（`direct_messages_topic_id`）の実装。
- このフェーズでの Telegram プライベートチャットのトピックバリアントの実装。

## UX の方向性

### 1) 2 種類のバインディング

- **永続バインディング**: 構成に保存され、起動時に同期されます。「名前付きワークスペース」としてのチャネルやトピックでの利用を想定しています。
- **一時バインディング**: 実行時のみ有効で、アイドル時間や最大存続時間ポリシーによって期限切れとなります。

### 2) コマンドの挙動

- `/acp spawn ... --thread here|auto|off` は引き続き利用可能です。
- 明示的なバインド制御コマンドを追加します:
  - `/acp bind [session|agent] [--persist]`
  - `/acp unbind [--persist]`
  - `/acp status` に、バインディングが `persistent` か `temporary` かを含めます。
- バインド済みの会話では、`/new` や `/reset` を実行しても ACP セッションのみがその場でリセットされ、バインディング（紐付け）は維持されます。

### 3) 会話の識別子 (Identity)

- 正規化された会話 ID を使用します:
  - Discord: チャネル/スレッド ID。
  - Telegram トピック: `chatId:topic:topicId`。
- Telegram のバインディングにおいて、単独のトピック ID をキーにすることはありません。

## 構成モデル（案）

ルーティング設定と永続 ACP バインディング設定を、トップレベルの `bindings[]` に統合し、明示的な `type` 識別子で区別します:

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace-main",
        "runtime": { "type": "embedded" },
      },
      {
        "id": "codex",
        "workspace": "~/.openclaw/workspace-codex",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "codex",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-a",
          },
        },
      },
      // ...
    ],
  },
  "acp": {
    "enabled": true,
    "backend": "acpx",
    "allowedAgents": ["codex", "claude"],
  },
  "bindings": [
    // 通常のルーティング設定 (既存の挙動)
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    // 永続的な ACP 会話バインディング
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
      "acp": {
        "label": "codex-main",
        "mode": "persistent",
        "cwd": "/workspace/repo-a",
        "backend": "acpx",
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1001234567890:topic:42" },
      },
      "acp": {
        "label": "tg-codex-42",
        "mode": "persistent",
      },
    },
  ],
  // ...
}
```

### 最小構成の例 (バインドごとの個別設定なし)

```jsonc
{
  "agents": {
    "list": [
      { "id": "main", "default": true, "runtime": { "type": "embedded" } },
      {
        "id": "codex",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "codex", "backend": "acpx", "mode": "persistent" },
        },
      },
    ],
  },
  "acp": { "enabled": true, "backend": "acpx" },
  "bindings": [
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
    },
  ],
}
```

補足事項:

- `bindings[].type` は明示的に指定します:
  - `route`: 通常のエージェントルーティング。
  - `acp`: 一致した会話に対する永続的な ACP ハーネスバインディング。
- `type: "acp"` の場合、`match.peer.id` は正規化された会話キーとなります:
  - Discord チャネル/スレッド: 生のチャネル/スレッド ID。
  - Telegram トピック: `chatId:topic:topicId`。
- `bindings[].acp.backend` はオプションです。バックエンドの解決順序は以下の通りです:
  1. `bindings[].acp.backend`
  2. `agents.list[].runtime.acp.backend`
  3. グローバル設定 `acp.backend`
- `mode`, `cwd`, `label` も同様の上書きパターン (`バインディング個別設定 -> エージェント既定値 -> グローバル既定値`) に従います。
- 一時的なバインディングポリシーについては、既存の `session.threadBindings.*` や `channels.discord.threadBindings.*` を引き続き使用します。
- 永続エントリは「あるべき状態」を宣言するものであり、実行時に実際の ACP セッションやバインディングとの同期が行われます。
- 会話ノードごとに、アクティブな ACP バインディングは最大 1 つとなります。
- 後方互換性: `type` が欠落している古いエントリは `route` として解釈されます。

### バックエンドの選択

- ACP セッションの初期化時には、既に構成されているバックエンド（現在の `acp.backend`）が使用されます。
- 本提案では、型指定された ACP バインディングの上書き設定を優先するように拡張します。
  - 会話ごとの上書き: `bindings[].acp.backend`
  - エージェントごとの既定値: `agents.list[].runtime.acp.backend`
- 上書き設定がない場合は、現在の挙動（`acp.backend`）を維持します。

## システムへの組み込み

### 既存コンポーネントの再利用

- `SessionBindingService` は、既にチャネルに依存しない会話参照をサポートしています。
- ACP の spawn/bind フローは、既にサービス API を介したバインドをサポートしています。
- Telegram は、既に `MessageThreadId` と `chatId` を通じてトピック/スレッドのコンテキストを保持しています。

### 新規および拡張コンポーネント

- **Telegram バインディングアダプター** (Discord アダプターと並行実装):
  - Telegram アカウントごとにアダプターを登録。
  - 正規化された会話 ID による解決/一覧表示/バインド/解除/更新。
- **型指定バインディングリゾルバー/インデックス**:
  - `bindings[]` を `route` 用と `acp` 用のビューに分離。
  - `resolveAgentRoute` は `route` バインディングのみを対象とする。
  - 永続 ACP 設定は `acp` バインディングのみから解決する。
- **Telegram 向けのインバウンドバインディング解決**:
  - ルーティング確定前に、バインドされたセッションを解決（Discord では実装済み）。
- **永続バインディング同期 (Reconciler)**:
  - 起動時: トップレベルの `type: "acp"` 設定を読み込み、ACP セッションとバインディングの存在を保証。
  - 構成変更時: 差分を安全に適用。
- **切り替えモデル**:
  - チャネル個別の ACP バインディングフォールバックは読み込まれません。
  - 永続 ACP バインディングは、トップレベルの `bindings[].type="acp"` エントリからのみ供給されます。

## 段階的なリリース計画

### フェーズ 1: 型指定バインディングのスキーマ基盤

- 構成スキーマを拡張し、`bindings[].type` 識別子をサポート:
  - `route`
  - `acp` (オプションで `mode`, `backend`, `cwd`, `label` を含む上書きオブジェクト)
- エージェントのスキーマを拡張し、ACP ネイティブなエージェントを示すランタイム記述子を追加 (`agents.list[].runtime.type`)。
- ルーティング用と ACP 用のバインディングを分離して処理するパーサー/インデクサーを追加。

### フェーズ 2: 実行時解決と Discord/Telegram の共通化

- 以下のトップレベル `type: "acp"` エントリから永続バインディングを解決:
  - Discord チャネル/スレッド
  - Telegram フォーラムトピック (`chatId:topic:topicId`)
- Telegram 用のバインディングアダプターを実装し、インバウンドのセッション上書き挙動を Discord と共通化。
- このフェーズでは Telegram のダイレクト/プライベートトピックは対象外。

### フェーズ 3: コマンドの共通化とリセット

- バインドされた Telegram/Discord 会話において、`/acp`, `/new`, `/reset`, `/focus` の挙動を共通化。
- リセットフローを経ても、設定通りにバインディングが維持されることを確認。

### フェーズ 4: 堅牢化

- 診断機能の強化 (`/acp status`, 起動時の同期ログ)。
- 競合の解消とヘルスチェック。

## ガードレールとポリシー

- ACP の有効化設定やサンドボックスの制限は、現在と同様に尊重されます。
- アカウント間の情報漏洩を避けるため、明示的なアカウントスコープ (`accountId`) を維持します。
- ルーティングが曖昧な場合は、安全のために処理を拒否（fail-closed）します。
- メンション要件やアクセス権限のポリシーは、各チャネルの設定に従います。

## テスト計画

- ユニットテスト:
  - 会話 ID の正規化（特に Telegram のトピック ID）。
  - 同期処理（reconciler）における作成/更新/削除パス。
  - `/acp bind --persist` および解除フロー。
- 結合テスト:
  - 受信 Telegram トピック -> バインドされた ACP セッションへの解決。
  - 受信 Discord チャネル/スレッド -> 永続バインディングの優先適用。
- 回帰テスト:
  - 一時的なバインディングが引き続き動作すること。
  - バインドされていないチャネル/トピックが現在のルーティング挙動を維持すること。

## 未解決の課題

- Telegram トピックにおける `/acp spawn --thread auto` の既定値は `here` にすべきか？
- 永続バインドされた会話では常にメンション制限をバイパスすべきか、それとも明示的な `requireMention=false` を必要とすべきか？
- `/focus` に、`/acp bind --persist` の別名として `--persist` オプションを追加すべきか？

## ロールアウト

- 会話ごとのオプトイン形式で提供 (`bindings[].type="acp"` エントリが存在する場合のみ有効)。
- まずは Discord と Telegram から開始。
- 以下の例を含むドキュメントを追加:
  - 「エージェントごとに 1 つのチャネル/トピックを割り当てる」
  - 「同じエージェントに対し、異なる `cwd` で複数のチャネル/トピックを割り当てる」
  - 「チーム内での命名規則 (`codex-1`, `claude-repo-x` 等)」。
