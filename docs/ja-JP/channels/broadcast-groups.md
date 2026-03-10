---
summary: "WhatsAppメッセージを複数のエージェントにブロードキャストする"
read_when:
  - ブロードキャストグループを設定する場合
  - WhatsAppでのマルチエージェントの返信をデバッグする場合
status: experimental
title: "Broadcast Groups"
---

# Broadcast Groups (ブロードキャストグループ)

**ステータス:** 実験的 (Experimental)  
**バージョン:** 2026.1.9で追加

## 概要

ブロードキャストグループを使用すると、複数のエージェントが同じメッセージを同時に処理して応答できます。これにより、1つのWhatsAppグループまたはDMで連携して作業する特化したエージェントチームを、すべて1つの電話番号を使用して作成できます。

現在のスコープ: **WhatsAppのみ** (Webチャンネル)。

ブロードキャストグループは、チャンネルの許可リストとグループのアクティベーションルールの後に評価されます。WhatsAppグループでは、これは、OpenClawが通常返信するタイミングでブロードキャストが発生することを意味します (例: グループの設定に応じて、メンション時など)。

## ユースケース

### 1. 特化したエージェントチーム

アトミックで焦点の絞られた責任を持つ複数のエージェントをデプロイします:

```
グループ: "開発チーム"
エージェント:
  - CodeReviewer (コードスニペットをレビュー)
  - DocumentationBot (ドキュメントを生成)
  - SecurityAuditor (脆弱性をチェック)
  - TestGenerator (テストケースを提案)
```

各エージェントは同じメッセージを処理し、それぞれの専門的な視点を提供します。

### 2. 多言語サポート

```
グループ: "国際サポート"
エージェント:
  - Agent_EN (英語で応答)
  - Agent_DE (ドイツ語で応答)
  - Agent_ES (スペイン語で応答)
```

### 3. 品質保証 (QA) ワークフロー

```
グループ: "カスタマーサポート"
エージェント:
  - SupportAgent (回答を提供)
  - QAAgent (品質をレビュー、問題が見つかった場合のみ応答)
```

### 4. タスクの自動化

```
グループ: "プロジェクト管理"
エージェント:
  - TaskTracker (タスクデータベースを更新)
  - TimeLogger (費やした時間を記録)
  - ReportGenerator (要約を作成)
```

## 設定

### 基本設定

トップレベルの `broadcast` セクション (`bindings` の隣) を追加します。キーはWhatsAppのピアIDです:

- グループチャット: グループJID (例: `120363403215116621@g.us`)
- DM: E.164電話番号 (例: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** OpenClawがこのチャットで返信する場合、3つのエージェントすべてが実行されます。

### 処理戦略

エージェントがメッセージをどのように処理するかを制御します:

#### Parallel (並列 - デフォルト)

すべてのエージェントが同時に処理します:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequential (順次)

エージェントは順番に処理します (前のエージェントの完了を待ちます):

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

## 仕組み

### メッセージフロー

1. **受信メッセージ**がWhatsAppグループに到着します。
2. **ブロードキャストチェック**: システムは、ピアIDが `broadcast` にあるかどうかを確認します。
3. **ブロードキャストリストにある場合**:
   - リストされたすべてのエージェントがメッセージを処理します。
   - 各エージェントには、独自のセッションキーと分離されたコンテキストがあります。
   - エージェントは並列 (デフォルト) または順次処理を行います。
4. **ブロードキャストリストにない場合**:
   - 通常のルーティングが適用されます (最初に一致するバインディング)。

注意: ブロードキャストグループは、チャンネルの許可リストやグループのアクティベーションルール (メンション/コマンドなど) をバイパスしません。これらは、メッセージが処理の対象となる場合に**どのエージェントが実行されるか**を変更するだけです。

### セッションの分離

ブロードキャストグループ内の各エージェントは、以下のものを完全に分離して保持します:

- **セッションキー** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **会話履歴** (エージェントは他のエージェントのメッセージを見ません)
- **ワークスペース** (設定されている場合、別々のサンドボックス)
- **ツールアクセス** (異なる許可/拒否リスト)
- **メモリ/コンテキスト** (別々の IDENTITY.md、SOUL.md など)
- **グループコンテキストバッファ** (コンテキストに使用される最近のグループメッセージ) はピアごとに共有されるため、トリガーされるとすべてのブロードキャストエージェントが同じコンテキストを見ます。

これにより、各エージェントは以下の異なるものを持つことができます:

- 異なる性格 (パーソナリティ)
- 異なるツールアクセス (例: 読み取り専用 vs 読み書き可能)
- 異なるモデル (例: opus vs sonnet)
- 異なるインストール済みスキル

### 例: 分離されたセッション

`["alfred", "baerbel"]` のエージェントがいるグループ `120363403215116621@g.us` の場合:

**Alfredのコンテキスト:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [ユーザーのメッセージ, alfredの過去の応答]
Workspace: /Users/pascal/openclaw-alfred/
Tools: read, write, exec
```

**Bärbelのコンテキスト:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [ユーザーのメッセージ, baerbelの過去の応答]
Workspace: /Users/pascal/openclaw-baerbel/
Tools: read only
```

## ベストプラクティス

### 1. エージェントの焦点を絞る

単一の明確な責任を持つように各エージェントを設計します:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **良い例:** 各エージェントが1つの仕事を持つ  
❌ **悪い例:** 1つの汎用的な「dev-helper」エージェント

### 2. 説明的な名前を使用する

各エージェントの役割を明確にします:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 異なるツールアクセスを設定する

エージェントに必要なツールのみを与えます:

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

### 4. パフォーマンスを監視する

多数のエージェントがいる場合は、以下を検討してください:

- 速度を上げるために `"strategy": "parallel"` (デフォルト) を使用する
- ブロードキャストグループを5〜10個のエージェントに制限する
- よりシンプルなエージェントにはより高速なモデルを使用する

### 5. 障害を適切に処理する

エージェントは独立して失敗します。あるエージェントのエラーが他のエージェントをブロックすることはありません:

```
メッセージ → [Agent A ✓, Agent B ✗ エラー, Agent C ✓]
結果: Agent A と C が応答し、Agent B はエラーをログに記録する
```

## 互換性

### プロバイダー

ブロードキャストグループは現在以下で機能します:

- ✅ WhatsApp (実装済み)
- 🚧 Telegram (予定)
- 🚧 Discord (予定)
- 🚧 Slack (予定)

### ルーティング

ブロードキャストグループは既存のルーティングと並行して機能します:

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

- `GROUP_A`: alfredのみが応答 (通常のルーティング)
- `GROUP_B`: agent1とagent2が応答 (ブロードキャスト)

**優先順位:** `broadcast` は `bindings` よりも優先されます。

## トラブルシューティング

### エージェントが応答しない

**確認事項:**

1. エージェントIDが `agents.list` に存在する
2. ピアIDの形式が正しい (例: `120363403215116621@g.us`)
3. エージェントが拒否リストに含まれていない

**デバッグ:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 1つのエージェントのみが応答する

**原因:** ピアIDが `bindings` にあり、`broadcast` にない可能性があります。

**修正:** `broadcast` 設定に追加するか、`bindings` から削除します。

### パフォーマンスの問題

**多数のエージェントで遅い場合:**

- グループあたりのエージェント数を減らす
- より軽量なモデルを使用する (opusの代わりにsonnet)
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

**ユーザー送信:** コードスニペット  
**応答:**

- code-formatter: "インデントを修正し、型ヒントを追加しました"
- security-scanner: "⚠️ 12行目にSQLインジェクションの脆弱性があります"
- test-coverage: "カバレッジは45%です。エラーケースのテストが不足しています"
- docs-checker: "関数 `process_data` のdocstringがありません"

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
  - `"parallel"` (デフォルト): すべてのエージェントが同時に処理します
  - `"sequential"`: エージェントは配列の順序で処理します
- `[peerId]`: WhatsAppグループJID、E.164番号、またはその他のピアID
  - 値: メッセージを処理する必要があるエージェントIDの配列

## 制限事項

1. **最大エージェント数:** 厳密な制限はありませんが、10個以上のエージェントは遅くなる可能性があります。
2. **共有コンテキスト:** エージェントは互いの応答を見ません (設計によるものです)。
3. **メッセージの順序:** 並列応答は任意の順序で到着する可能性があります。
4. **レート制限:** すべてのエージェントがWhatsAppのレート制限にカウントされます。

## 今後の機能強化

予定されている機能:

- [ ] 共有コンテキストモード (エージェントが互いの応答を見る)
- [ ] エージェントの連携 (エージェントが互いにシグナルを送ることができる)
- [ ] 動的エージェント選択 (メッセージ内容に基づいてエージェントを選択する)
- [ ] エージェントの優先順位 (一部のエージェントが他のエージェントよりも先に応答する)

## 関連項目

- [マルチエージェント設定](/tools/multi-agent-sandbox-tools)
- [ルーティング設定](/channels/channel-routing)
- [セッション管理](/concepts/session)
