# Discord チャンネルと Telegram トピックの ACP 永続的バインディング

ステータス: ドラフト

## 概要

以下をマッピングする永続的な ACP バインディングを導入します。

- Discord チャンネル (および必要に応じて既存のスレッド)
- グループ/スーパーグループ内の電報フォーラムのトピック (`chatId:topic:topicId`)

明示的なバインディング タイプを使用して、バインディング状態が最上位の `bindings[]` エントリに保存されている、長期間存続する ACP セッションに適用されます。

これにより、トラフィックの多いメッセージング チャネルでの ACP の使用が予測可能かつ耐久性のあるものになり、ユーザーは `codex`、`claude-1`、`claude-myrepo` などの専用チャネル/トピックを作成できます。

## なぜ

現在のスレッドバインド ACP の動作は、一時的な Discord スレッド ワークフロー用に最適化されています。 Telegram には同じスレッド モデルがありません。グループ/スーパーグループのフォーラム トピックがあります。ユーザーは、一時的なスレッド セッションだけでなく、チャット サーフェスに安定した常時稼働の ACP 「ワークスペース」を望んでいます。

## 目標

- 以下の耐久性のある ACP バインディングをサポートします。
  - Discordチャンネル/スレッド
  - Telegram フォーラムのトピック (グループ/スーパーグループ)
- バインディングを信頼できるソース構成主導型にします。
- `/acp`、`/new`、`/reset`、`/focus`、および配信動作を Discord と Telegram 全体で一貫したものに保ちます。
- アドホックな使用のために既存の一時的なバインディング フローを保存します。

## 非目標- ACP ランタイム/セッション内部の完全な再設計

- 既存の一時的なバインディング フローを削除します。
- 最初の反復ですべてのチャネルに拡張します。
- このフェーズでは Telegram チャネルのダイレクト メッセージ トピック (`direct_messages_topic_id`) を実装します。
- このフェーズでは、Telegram のプライベート チャット トピックのバリアントを実装します。

## UX の方向性

### 1) 2 つのバインディング タイプ

- **永続的なバインディング**: 構成に保存され、起動時に調整され、「名前付きワークスペース」チャネル/トピックを対象としています。
- **一時バインディング**: ランタイムのみ、アイドル/最大経過時間ポリシーによって期限切れになります。

### 2) コマンドの動作

- `/acp spawn ... --thread here|auto|off` は引き続き利用可能です。
- 明示的なバインド ライフサイクル コントロールを追加します。
  - `/acp bind [session|agent] [--persist]`
  - `/acp unbind [--persist]`
  - `/acp status` には、バインディングが `persistent` であるか `temporary` であるかが含まれます。
- バインドされた会話では、`/new` および `/reset` はバインドされた ACP セッションを所定の位置にリセットし、バインディングの接続を維持します。

### 3) 会話のアイデンティティ

- 正規の会話 ID を使用します。
  - Discord: チャンネル/スレッド ID。
  - 電報トピック: `chatId:topic:topicId`。
- 裸のトピック ID だけで Telegram バインディングをキー化しないでください。

## 構成モデル (提案)

明示的な `type` 識別子を使用して、トップレベル `bindings[]` でルーティングと永続的な ACP バインディング構成を統合します。

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
      {
        "id": "claude",
        "workspace": "~/.openclaw/workspace-claude",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "claude",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-b",
          },
        },
      },
    ],
  },
  "acp": {
    "enabled": true,
    "backend": "acpx",
    "allowedAgents": ["codex", "claude"],
  },
  "bindings": [
    // Route bindings (existing behavior)
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
    },
    // Persistent ACP conversation bindings
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
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
      "acp": {
        "label": "claude-repo-b",
        "mode": "persistent",
        "cwd": "/workspace/repo-b",
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
  "channels": {
    "discord": {
      "guilds": {
        "111111111111111111": {
          "channels": {
            "222222222222222222": {
              "enabled": true,
              "requireMention": false,
            },
            "333333333333333333": {
              "enabled": true,
              "requireMention": false,
            },
          },
        },
      },
    },
    "telegram": {
      "groups": {
        "-1001234567890": {
          "topics": {
            "42": {
              "requireMention": false,
            },
          },
        },
      },
    },
  },
}
```

### 最小限の例 (バインドごとの ACP オーバーライドなし)

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
      {
        "id": "claude",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "claude", "backend": "acpx", "mode": "persistent" },
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
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
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
    {
      "type": "acp",
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1009876543210:topic:5" },
      },
    },
  ],
}
```

注:- `bindings[].type` は明示的です:

- `route`: 通常のエージェント ルーティング。
- `acp`: 一致した会話の永続的な ACP ハーネス バインディング。
- `type: "acp"` の場合、`match.peer.id` は正規の会話キーです。
  - Discord チャンネル/スレッド: 生のチャンネル/スレッド ID。
  - 電報トピック: `chatId:topic:topicId`。
- `bindings[].acp.backend` はオプションです。バックエンドのフォールバック順序:
  1. `bindings[].acp.backend`
  2. `agents.list[].runtime.acp.backend`
  3. グローバル `acp.backend`
- `mode`、`cwd`、および `label` は、同じオーバーライド パターン (`binding override -> agent runtime default -> global/default behavior`) に従います。
- 一時的なバインディング ポリシーとして、既存の `session.threadBindings.*` および `channels.discord.threadBindings.*` を保持します。
- 永続エントリは望ましい状態を宣言します。ランタイムは実際の ACP セッション/バインディングと一致します。
- 会話ノードごとに 1 つのアクティブな ACP バインディングが対象モデルです。
- 下位互換性: 欠落している `type` は、従来のエントリの `route` として解釈されます。

### バックエンドの選択

- ACP セッションの初期化では、生成中に設定されたバックエンド選択がすでに使用されています (今日の `acp.backend`)。
- この提案は、型指定された ACP バインディング オーバーライドを優先するように生成/調整ロジックを拡張します。
  - `bindings[].acp.backend` は会話ローカルのオーバーライド用です。
  - `agents.list[].runtime.acp.backend` エージェントごとのデフォルト。
- オーバーライドが存在しない場合は、現在の動作を維持します (`acp.backend` デフォルト)。

## 現在のシステムに適合するアーキテクチャ

### 既存のコンポーネントを再利用する- `SessionBindingService` は、チャネルに依存しない会話参照をすでにサポートしています

- ACP のスポーン/バインド フローは、サービス API を介したバインドをすでにサポートしています。
- Telegram はすでに `MessageThreadId` および `chatId` を介してトピック/スレッド コンテキストを伝送しています。

### 新規/拡張コンポーネント

- **Telegram バインディング アダプター** (Discord アダプターと並行):
  - Telegram アカウントごとにアダプターを登録します。
  - 正規の会話 ID による解決/リスト/バインド/アンバインド/タッチ。
- **型付きバインディング リゾルバー/インデックス**:
  - `bindings[]` を `route` ビューと `acp` ビューに分割します。
  - `resolveAgentRoute` を `route` バインディングのみに保持します。
  - `acp` バインディングのみから永続的な ACP インテントを解決します。
- **Telegram のインバウンド バインディング解決**:
  - ルートの最終化の前にバインドされたセッションを解決します (Discord はすでにこれを行っています)。
- **永続的なバインディング リコンサイラー**:
  - 起動時: 構成されたトップレベルの `type: "acp"` バインディングをロードし、ACP セッションが存在することを確認し、バインディングが存在することを確認します。
  - 構成変更時: デルタを安全に適用します。
- **カットオーバー モデル**:
  - チャネルローカル ACP バインディング フォールバックは読み取られません。
  - 永続的な ACP バインディングは、トップレベルの `bindings[].type="acp"` エントリからのみ供給されます。

## 段階的配信

### フェーズ 1: 型付きバインディング スキーマの基礎- `bindings[].type` 識別子をサポートするように構成スキーマを拡張します

- `route`、
- `acp` とオプションの `acp` オーバーライド オブジェクト (`mode`、`backend`、`cwd`、`label`)。
- ACP ネイティブ エージェントをマークするためのランタイム記述子を使用してエージェント スキーマを拡張します (`agents.list[].runtime.type`)。
- ルートと ACP バインディングに対するパーサー/インデクサーの分割を追加します。

### フェーズ 2: ランタイム解決 + Discord/Telegram パリティ

- 以下の最上位 `type: "acp"` エントリからの永続的な ACP バインディングを解決します。
  - Discord チャンネル/スレッド、
  - Telegram フォーラムのトピック (`chatId:topic:topicId` 正規 ID)。
- Telegram バインディング アダプターとインバウンド バインド セッション オーバーライド パリティを Discord と実装します。
- このフェーズには Telegram の直接/プライベート トピックのバリアントを含めないでください。

### フェーズ 3: コマンド パリティとリセット

- バインドされた Telegram/Discord 会話における `/acp`、`/new`、`/reset`、および `/focus` の動作を調整します。
- バインディングが設定どおりのリセット フローに耐えることを確認します。

### フェーズ 4: 硬化

- 診断の改善 (`/acp status`、起動調整ログ)。
- 競合の処理とヘルスチェック。

## ガードレールとポリシー- 現在と同様に、ACP の有効化とサンドボックスの制限を尊重します

- アカウント間の出血を避けるために、明示的なアカウントのスコープ設定 (`accountId`) を維持します。
- あいまいなルーティングではフェールクローズされます。
- チャネル設定ごとにメンション/アクセス ポリシーの動作を明示的に保ちます。

## テスト計画

- 単位:
  - 会話 ID の正規化 (特に Telegram トピック ID)、
  - リコンサイラーのパスの作成/更新/削除、
  - `/acp bind --persist` とフローのバインドを解除します。
- 統合:
  - インバウンド Telegram トピック -> バインドされた ACP セッション解決、
  - インバウンド Discord チャネル/スレッド -> 永続的なバインディングの優先順位。
- 回帰:
  - 一時的なバインディングは引き続き機能します。
  - バインドされていないチャネル/トピックは、現在のルーティング動作を維持します。

## 未解決の質問

- Telegram トピックの `/acp spawn --thread auto` はデフォルトで `here` にすべきですか?
- 永続的なバインディングは、バインドされた会話でのメンションゲーティングを常にバイパスする必要がありますか、それとも明示的な `requireMention=false` を要求する必要がありますか?
- `/focus` は `/acp bind --persist` のエイリアスとして `--persist` を取得する必要がありますか?

## ロールアウト

- 会話ごとにオプトインとして送信します (`bindings[].type="acp"` エントリが存在します)。
- Discord + Telegram のみで開始します。
- 以下の例を含むドキュメントを追加します。
  - 「エージェントごとに 1 つのチャネル/トピック」
  - 「同じエージェントごとに異なる `cwd` を持つ複数のチャネル/トピック」
  - 「チームの命名パターン (`codex-1`、`claude-repo-x`)」。
