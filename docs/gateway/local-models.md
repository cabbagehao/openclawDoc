---
summary: "ローカル LLM (LM Studio, vLLM, LiteLLM, またはカスタムの OpenAI エンドポイント) で OpenClaw を動かす"
description: "LM Studio や OpenAI 互換ローカルプロキシで OpenClaw を動かす際の推奨モデル、構成例、フォールバック、注意点を整理します。"
read_when:
  - 自身の GPU 搭載マシンでモデルを動かしたい場合
  - LM Studio や OpenAI 互換のプロキシを設定する場合
  - 最も安全なローカルモデルの運用指針が必要な場合
title: "ローカルモデル"
seoTitle: "OpenClaw ローカルモデル運用ガイド LM Studio・vLLM 設定"
---
ローカル環境での運用は可能ですが、OpenClaw は巨大なコンテキストサイズと、プロンプトインジェクションに対する強力な防御性能をモデルに期待します。能力の低い小規模モデルでは、コンテキストが入り切らずに切り捨てられたり、安全ガードレールが機能しなかったりするリスクがあります。高い目標を掲げるなら、**フルスペックの Mac Studio 2 台、あるいは同等の GPU リグ（目安 30,000ドル以上）** を推奨します。単一の **24GB** GPU では、遅延が大きく、かつ軽量なプロンプトでの運用に限定されます。**実行可能な範囲で最大サイズ / フルサイズのモデルバリアント** を使用してください。過度に量子化されたものや「Small」バリアントは、プロンプトインジェクションのリスクを高めます（詳細は [セキュリティ](/gateway/security) を参照）。

## 推奨: LM Studio + MiniMax M2.5 (Responses API, Full-size)

現時点で最高のローカルスタックです。MiniMax M2.5 を LM Studio にロードし、ローカルサーバー（デフォルト `http://127.0.0.1:1234`）を有効にします。さらに、Responses API を使用することで、推論プロセス（Reasoning）を最終回答のテキストから分離して扱うことができます。

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

- LM Studio をインストール: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio 内で、**利用可能な最大の MiniMax M2.5 ビルド** をダウンロードしてください（「Small」や過度に量子化されたものは避けてください）。
- サーバーを起動し、`http://127.0.0.1:1234/v1/models` でモデルがリストされていることを確認します。
- モデルは常にロード（常駐）させておいてください。リクエスト時のロード（コールドスタート）は大きな遅延の原因となります。
- 使用する LM Studio ビルドに合わせて `contextWindow` / `maxTokens` を調整してください。
- WhatsApp 等を利用する場合は、最終テキストのみが送信されるように Responses API の使用を推奨します。

ローカルモデルを使用する場合でも、ホスト型モデルの設定は残しておいてください。`models.mode: "merge"` を使用することで、ローカルマシンがダウンした際でもフォールバック（代替）モデルを利用可能に保つことができます。

### ハイブリッド構成: ホスト型を優先、ローカルをフォールバックにする例

```json5
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
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### ローカル優先、ホスト型をセーフティネットにする例

上記の `primary` と `fallbacks` の順序を入れ替えてください。`providers` ブロックと `models.mode: "merge"` を維持することで、ローカルマシンが停止した際に Sonnet や Opus へ自動で切り替えることができます。

### リージョン指定ホスティング / データのルーティング

- MiniMax, Kimi, GLM 等のバリアントは OpenRouter にも存在し、リージョン固定のエンドポイント（例: US ホスト）が利用可能です。データ流出を特定の法域内に留めたい場合はリージョンバリアントを選択しつつ、`models.mode: "merge"` で Anthropic/OpenAI のフォールバックを維持してください。
- 完全にローカルのみで運用するのが最も強力なプライバシー保護となります。ホスト型のリージョン指定ルーティングは、プロバイダーの機能を利用しつつデータフローを制御したい場合の折衷案として有効です。

## その他の OpenAI 互換ローカルプロキシ

vLLM, LiteLLM, OAI-proxy, または自作のゲートウェイであっても、OpenAI スタイルの `/v1` エンドポイントを公開していれば利用可能です。上記の構成例のプロバイダーブロックを、自身のエンドポイントとモデル ID に書き換えてください:

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
```

常に `models.mode: "merge"` を維持し、ホスト型モデルを予備として使えるようにしておくことを推奨します。

## トラブルシューティング

- **ゲートウェイがプロキシに届かない**: `curl http://127.0.0.1:1234/v1/models` で確認してください。
- **LM Studio のモデルがアンロードされている**: 再ロードしてください。コールドスタートは「応答が返ってこない」ように見える原因の第一位です。
- **コンテキストエラー**: `contextWindow` の設定値を下げるか、サーバー側の制限値を上げてください。
- **安全性**: ローカルモデルはプロバイダー側のフィルタリングをスキップします。エージェントの権限範囲を絞り、圧縮（コンパクション）を有効にして、プロンプトインジェクションの影響範囲を限定してください。
