---
summary: "ローカル LLM で OpenClaw を実行する (LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント)"
read_when:
  - 独自の GPU ボックスからモデルを提供したい
  - LM Studio または OpenAI 互換プロキシを接続している
  - 最も安全なローカルモデルのガイダンスが必要です
title: "ローカルモデル"
x-i18n:
  source_hash: "eb72d23e5ca41482ec918c2eb8ef67d46a8e5a661339ce072c53c6c30a09c3cf"
---

# ローカルモデル

ローカルは実行可能ですが、OpenClaw は大規模なコンテキストとプロンプト インジェクションに対する強力な防御を期待します。小さなカードはコンテキストを切り捨て、安全性を漏らします。目標は高く、**最大 2 台の Mac Studio または同等の GPU リグ (~30,000 ドル以上)** を目指します。単一の **24 GB** GPU は、待ち時間が長く、軽いプロンプトでのみ機能します。 **実行可能な最大/フルサイズのモデル バリアント**を使用してください。積極的に量子化されたチェックポイントや「小さな」チェックポイントは、即時挿入のリスクを高めます ([セキュリティ](/gateway/security) を参照)。

## 推奨: LM Studio + MiniMax M2.5 (応答 API、フルサイズ)

現在の最良のローカル スタック。 MiniMax M2.5 を LM Studio にロードし、ローカル サーバー (デフォルト `http://127.0.0.1:1234`) を有効にし、応答 API を使用して推論を最終テキストから切り離します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**セットアップチェックリスト**

- LM Studio をインストールします: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio で、**利用可能な最大の MiniMax M2.5 ビルド** (「小さい」/大量に量子化されたバリアントは避けてください) をダウンロードし、サーバーを起動し、`http://127.0.0.1:1234/v1/models` リストにあることを確認します。
- モデルをロードしたままにします。 cold-load は起動遅延を追加します。
- LM Studio のビルドが異なる場合は、`contextWindow`/`maxTokens` を調整します。
- WhatsApp の場合は、最終テキストのみが送信されるように Responses API に固執します。

ローカルで実行している場合でも、ホストされたモデルの構成を維持します。 `models.mode: "merge"` を使用して、フォールバックを引き続き利用できるようにします。

### ハイブリッド構成: ホスト型プライマリ、ローカル フォールバック

````json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["lmstudio/minimax-m2.5-gs32", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "lmstudio/minimax-m2.5-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```### ホスト型セーフティネットによるローカルファースト

プライマリとフォールバックの順序を交換します。同じプロバイダー ブロックと `models.mode: "merge"` を維持して、ローカル ボックスがダウンしたときに Sonnet または Opus にフォールバックできるようにします。

### 地域ホスティング/データルーティング

- ホスト型 MiniMax/Kimi/GLM バリアントは、地域固定エンドポイント (米国ホスト型など) を備えた OpenRouter にも存在します。そこで地域のバリアントを選択すると、Anthropic/OpenAI フォールバックに `models.mode: "merge"` を使用しながら、選択した管轄区域内でトラフィックを維持できます。
- ローカルのみが依然として最強のプライバシー パスです。ホスト型リージョナル ルーティングは、プロバイダー機能が必要だが、データ フローを制御したい場合の中間点です。

## その他の OpenAI 互換ローカル プロキシ

vLLM、LiteLLM、OAI プロキシ、またはカスタム ゲートウェイは、OpenAI スタイルの `/v1` エンドポイントを公開する場合に機能します。上記のプロバイダー ブロックをエンドポイントとモデル ID に置き換えます。

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
````

`models.mode: "merge"` を保持して、ホストされたモデルをフォールバックとして利用できるようにします。

## トラブルシューティング

- ゲートウェイはプロキシに到達できますか? `curl http://127.0.0.1:1234/v1/models`。
- LM Studio モデルがアンロードされましたか?リロード;コールド スタートは一般的な「ハング」の原因です。
- コンテキストエラー? `contextWindow` を下げるか、サーバー制限を上げてください。
- 安全性: ローカル モデルはプロバイダー側​​のフィルターをスキップします。エージェントの幅を狭め、圧縮を続けて、即時噴射の爆発範囲を制限します。
