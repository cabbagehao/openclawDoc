---
summary: "WhatsApp メッセージを複数のエージェントへブロードキャストする"
read_when:
  - ブロードキャストグループを設定する場合
  - WhatsApp でのマルチエージェント返信をデバッグする場合
status: experimental
title: "OpenClawでWhatsApp Broadcast Groupsを設定・運用する方法"
description: "WhatsApp の Broadcast Groups を使って複数エージェントへ配信する方法をまとめます。実験的機能の前提、設定手順、運用上の注意点を確認できます。"
---
**ステータス:** 実験的<br />
**バージョン:** 2026.1.9 で追加

## 概要

ブロードキャストグループを使うと、複数のエージェントが同じメッセージを同時に処理し、それぞれ応答できます。これにより、1 つの WhatsApp グループまたは DM の中で、役割ごとに分担したエージェントチームを 1 つの電話番号で運用できます。

現在対応しているのは **WhatsApp のみ** です (`web` チャンネル)。

ブロードキャストグループは、チャンネルの allowlist とグループの有効化ルールを評価したあとに適用されます。WhatsApp グループでは、OpenClaw が通常なら返信する場面でのみブロードキャストが実行されます。たとえば、グループ設定によってはメンション時にだけ反応します。

## ユースケース

### 1. 特化したエージェントチーム

責務を小さく分けた複数のエージェントを配置できます。

```
グループ: "開発チーム"
エージェント:
  - CodeReviewer (コードスニペットをレビュー)
  - DocumentationBot (ドキュメントを生成)
  - SecurityAuditor (脆弱性をチェック)
  - TestGenerator (テストケースを提案)
```

各エージェントは同じメッセージを処理し、それぞれの専門領域から応答します。

### 2. 多言語サポート

```
グループ: "国際サポート"
エージェント:
  - Agent_EN (英語で応答)
  - Agent_DE (ドイツ語で応答)
  - Agent_ES (スペイン語で応答)
```

### 3. 品質保証ワークフロー

```
グループ: "カスタマーサポート"
エージェント:
  - SupportAgent (回答を提供)
  - QAAgent (品質をレビュー、問題が見つかった場合のみ応答)
```

### 4. タスク自動化

```
グループ: "プロジェクト管理"
エージェント:
  - TaskTracker (タスクデータベースを更新)
  - TimeLogger (費やした時間を記録)
  - ReportGenerator (要約を作成)
```

## 設定

### 基本設定

トップレベルに `broadcast` セクションを追加します (`bindings` と同じ階層です)。キーには WhatsApp の peer ID を使います。

- グループチャット: グループ JID (例: `120363403215116621@g.us`)
- DM: E.164 形式の電話番号 (例: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** OpenClaw がこのチャットで返信対象になったとき、3 つのエージェントすべてが実行されます。

### 処理戦略

メッセージ処理の進め方も指定できます。

#### Parallel (並列、デフォルト)

すべてのエージェントが同時に処理します。

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequential (順次)

エージェントを順番に処理します。後続のエージェントは、前のエージェントの完了を待ちます。

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 完全な例

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 動作の仕組み

### メッセージフロー

1. **受信メッセージ** が WhatsApp グループに届きます。
2. **ブロードキャスト判定**: システムが peer ID が `broadcast` に含まれているか確認します。
3. **ブロードキャストリストにある場合**:
   - 指定されたすべてのエージェントがメッセージを処理します。
   - 各エージェントは固有のセッションキーと独立したコンテキストを持ちます。
   - 処理方式は並列 (デフォルト) または順次です。
4. **ブロードキャストリストにない場合**:
   - 通常のルーティングが適用されます (最初に一致した binding が使われます)。

注意: ブロードキャストグループは、チャンネル allowlist やグループの有効化ルール (メンション、コマンドなど) を迂回しません。変更されるのは、メッセージが処理対象になったときに **どのエージェントを実行するか** だけです。

### セッションの分離

ブロードキャストグループ内の各エージェントは、次の要素をそれぞれ独立して持ちます。

- **セッションキー** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **会話履歴** (ほかのエージェントの発言は見えません)
- **ワークスペース** (設定されている場合は別々のサンドボックス)
- **ツールアクセス** (異なる許可 / 拒否リスト)
- **メモリ/コンテキスト** (別々の IDENTITY.md、SOUL.md など)
- **グループコンテキストバッファ** (直近のグループメッセージに基づくコンテキスト) は peer ごとに共有されるため、トリガー時にはすべてのブロードキャストエージェントが同じ入力コンテキストを参照します。

この構成により、各エージェントごとに次の要素を変えられます。

- 異なる性格や役割
- 異なるツールアクセス (例: 読み取り専用と読み書き可能)
- 異なるモデル (例: `opus` と `sonnet`)
- 異なるインストール済みスキル

### 例: セッション分離

グループ `120363403215116621@g.us` に `["alfred", "baerbel"]` を割り当てた場合の例です。

**Alfred のコンテキスト**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [ユーザーメッセージ, alfred の過去の応答]
Workspace: /Users/pascal/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel のコンテキスト**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [ユーザーメッセージ, baerbel の過去の応答]
Workspace: /Users/pascal/openclaw-baerbel/
Tools: read only
```

## ベストプラクティス

### 1. エージェントの焦点を絞る

各エージェントは 1 つの明確な責務に絞って設計してください。

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **良い例:** 各エージェントが 1 つの仕事を持つ
❌ **悪い例:** 1 つの汎用的な「dev-helper」エージェント

### 2. 役割が分かる名前を付ける

エージェント名から役割が分かるようにします。

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 必要なツールだけ許可する

各エージェントには必要最小限のツールだけを与えます。

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // 読み取り専用
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // 読み書き可能
    }
  }
}
```

### 4. パフォーマンスを意識する

エージェント数が多い場合は、次の点を検討してください。

- 速度重視なら `"strategy": "parallel"` (デフォルト) を使う
- ブロードキャストグループの規模を 5〜10 エージェント程度に抑える
- 単純な役割のエージェントには高速なモデルを使う

### 5. 障害は個別に扱う

各エージェントは独立して失敗します。1 つのエージェントのエラーが、ほかのエージェントを止めることはありません。

```
メッセージ → [Agent A ✓, Agent B ✗ エラー, Agent C ✓]
結果: Agent A と C は応答し、Agent B はエラーをログに記録する
```

## 互換性

### プロバイダー

現時点でブロードキャストグループが動作するのは次のプロバイダーです。

- ✅ WhatsApp (実装済み)
- 🚧 Telegram (予定)
- 🚧 Discord (予定)
- 🚧 Slack (予定)

### ルーティング

ブロードキャストグループは既存のルーティング設定と併用できます。

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: `alfred` のみが応答します (通常ルーティング)
- `GROUP_B`: `agent1` と `agent2` が応答します (ブロードキャスト)

**優先順位:** `broadcast` は `bindings` より優先されます。

## トラブルシューティング

### エージェントが応答しない場合

**確認事項:**

1. エージェント ID が `agents.list` に存在する
2. peer ID の形式が正しい (例: `120363403215116621@g.us`)
3. エージェントが denylist に入っていない

**デバッグ:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 1 つのエージェントしか応答しない場合

**原因:** peer ID が `bindings` には存在するものの、`broadcast` に入っていない可能性があります。

**対処:** `broadcast` 設定へ追加するか、`bindings` から削除してください。

### パフォーマンスに問題がある場合

**多数のエージェントで遅いとき**

- 1 グループあたりのエージェント数を減らす
- より軽量なモデルを使う (`opus` の代わりに `sonnet`)
- サンドボックスの起動時間を確認する

## 例

### 例 1: コードレビューチーム

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**ユーザー入力:** コードスニペット
**応答:**

- code-formatter: "インデントを修正し、型ヒントを追加しました"
- security-scanner: "12 行目に SQL インジェクションの脆弱性があります"
- test-coverage: "カバレッジは 45% です。エラーケースのテストが不足しています"
- docs-checker: "関数 `process_data` の docstring がありません"

### 例 2: 多言語サポート

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API リファレンス

### Config Schema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### フィールド

- `strategy` (オプション): エージェントの処理方法
  - `"parallel"` (デフォルト): すべてのエージェントを同時に実行します
  - `"sequential"`: 配列の順序でエージェントを実行します
- `[peerId]`: WhatsApp グループ JID、E.164 番号、またはその他の peer ID
  - 値: その peer のメッセージを処理するエージェント ID の配列

## 制限事項

1. **最大エージェント数:** 厳密な上限はありませんが、10 個を超えると遅くなる可能性があります。
2. **共有コンテキスト:** エージェント同士は互いの応答を見ません。これは設計上の仕様です。
3. **メッセージ順序:** 並列実行時は応答順が保証されません。
4. **レート制限:** すべてのエージェント実行が WhatsApp のレート制限にカウントされます。

## 今後の機能強化

予定されている機能:

- [ ] 共有コンテキストモード (エージェント同士が互いの応答を参照できる)
- [ ] エージェント間の連携 (エージェント同士でシグナルを送れる)
- [ ] 動的なエージェント選択 (メッセージ内容に応じて実行対象を決める)
- [ ] エージェント優先順位 (一部のエージェントを先に応答させる)

## 関連項目

- [マルチエージェント設定](/tools/multi-agent-sandbox-tools)
- [ルーティング設定](/channels/channel-routing)
- [セッション管理](/concepts/session)
