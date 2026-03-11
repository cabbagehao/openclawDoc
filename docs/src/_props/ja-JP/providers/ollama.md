---
summary: "Ollama で OpenClaw を実行する (ローカル LLM ランタイム)"
read_when:
  - Ollama 経由でローカル モデルで OpenClaw を実行したい
  - Ollama のセットアップと構成のガイダンスが必要です
title: "オラマ"
x-i18n:
  source_hash: "bdd202620fbdb26db54a45554ec4c33910bde53dd37da5729ab60bb57fbccedf"
---

# オラマ

Ollama は、マシン上でオープンソース モデルを簡単に実行できるようにするローカル LLM ランタイムです。 OpenClaw は Ollama のネイティブ API (`/api/chat`) と統合し、ストリーミングとツール呼び出しをサポートし、`OLLAMA_API_KEY` (または認証プロファイル) でオプトインし、明示的な `models.providers.ollama` エントリを定義しない場合、**ツール対応モデルを自動検出**できます。

<Warning>
  **リモート Ollama ユーザー**: `/v1` OpenAI 互換 URL (`http://host:11434/v1`) を OpenClaw で使用しないでください。これによりツールの呼び出しが中断され、モデルは生のツール JSON をプレーン テキストとして出力する可能性があります。代わりに、ネイティブの Ollama API URL を使用してください: `baseUrl: "http://host:11434"` (`/v1` は使用できません)。
</Warning>

## クイックスタート

1. Ollama をインストールします: [https://ollama.ai](https://ollama.ai)

2. モデルをプルします。

```bash
ollama pull gpt-oss:20b
# or
ollama pull llama3.3
# or
ollama pull qwen2.5-coder:32b
# or
ollama pull deepseek-r1:32b
```

3. OpenClaw に対して Ollama を有効にします (任意の値が機能します。Ollama には実際のキーは必要ありません)。

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Or configure in your config file
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

4. Ollama モデルを使用します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gpt-oss:20b" },
    },
  },
}
```

## モデル検出 (暗黙的なプロバイダー)

`OLLAMA_API_KEY` (または認証プロファイル) を設定し、**OC\_I18N\_0024\_\_ を定義しない**場合、OpenClaw は `http://127.0.0.1:11434` にあるローカル Ollama インスタンスからモデルを検出します。- クエリ `/api/tags` および `/api/show`

* `tools` 機能をレポートするモデルのみを保持します
* モデルが `thinking` を報告する場合、 `reasoning` をマークします。
* 利用可能な場合、`model_info["<arch>.context_length"]` から `contextWindow` を読み取ります
* `maxTokens` をコンテキスト ウィンドウの 10 倍に設定します
* すべてのコストを `0` に設定します

これにより、カタログを Ollama の機能に合わせた状態に保ちながら、手動でモデルを入力する必要がなくなります。

利用可能なモデルを確認するには:

```bash
ollama list
openclaw models list
```

新しいモデルを追加するには、Ollama を使用してそれをプルするだけです。

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、使用できるようになります。

`models.providers.ollama` を明示的に設定した場合、自動検出はスキップされ、モデルを手動で定義する必要があります (以下を参照)。

## 構成

### 基本セットアップ (暗黙的な検出)

Ollama を有効にする最も簡単な方法は、環境変数を使用することです。

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 明示的なセットアップ (手動モデル)

次の場合に明示的な構成を使用します。

* Ollama は別のホスト/ポートで実行されます。
* 特定のコンテキスト ウィンドウまたはモデル リストを強制したい。
* ツールのサポートを報告しないモデルを含めたい。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

`OLLAMA_API_KEY` が設定されている場合は、プロバイダー エントリの `apiKey` を省略でき、OpenClaw が可用性チェックのためにそれを入力します。

### カスタムベース URL (明示的な構成)

Ollama が別のホストまたはポートで実行されている場合 (明示的な構成により自動検出が無効になるため、モデルを手動で定義します):

```json5
{
models: {
providers: {
ollama: {
apiKey: "ollama-local",
baseUrl: "<http://ollama-host:11434>", // No /v1 - use native Ollama API URL
api: "ollama", // Set explicitly to guarantee native tool-calling behavior
},
},
},
}

```

<Warning>
  URL に `/v1` を追加しないでください。 `/v1` パスでは OpenAI 互換モードが使用されており、ツールの呼び出しは信頼できません。パス接尾辞のないベース Ollama URL を使用します。
</Warning>

### モデルの選択

構成が完了すると、すべての Ollama モデルが使用可能になります。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## 上級者向け

### 推論モデル

Ollama が `/api/show` で `thinking` を報告すると、OpenClaw はモデルを推論可能としてマークします。

```bash
ollama pull deepseek-r1:32b
```

### モデルのコスト

Ollama は無料でローカルで実行できるため、すべてのモデルのコストは 0 ドルに設定されます。

### ストリーミング構成

OpenClaw の Ollama 統合では、**ネイティブ Ollama API** (`/api/chat`) がデフォルトで使用され、ストリーミングとツール呼び出しの同時サポートが完全にサポートされます。特別な構成は必要ありません。

#### 従来の OpenAI 互換モード

<Warning>
  **OpenAI 互換モードではツール呼び出しは信頼できません。** このモードは、プロキシに OpenAI 形式が必要で、ネイティブ ツールの呼び出し動作に依存しない場合にのみ使用してください。
</Warning>

代わりに OpenAI 互換エンドポイントを使用する必要がある場合 (たとえば、OpenAI 形式のみをサポートするプロキシの背後で)、明示的に `api: "openai-completions"` を設定します。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // default: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

このモードでは、ストリーミングとツールの呼び出しを同時にサポートできない場合があります。モデル設定で `params: { streaming: false }` を使用してストリーミングを無効にする必要がある場合があります。`api: "openai-completions"` が Ollama で使用される場合、OpenClaw はデフォルトで `options.num_ctx` を挿入するため、Ollama は黙って 4096 コンテキスト ウィンドウにフォールバックしません。プロキシ/アップストリームが不明な `options` フィールドを拒否する場合は、この動作を無効にします。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### コンテキストウィンドウ

自動検出されたモデルの場合、OpenClaw は、利用可能な場合は Ollama によって報告されたコンテキスト ウィンドウを使用します。それ以外の場合は、デフォルトの `8192` が使用されます。明示的なプロバイダー構成で `contextWindow` および `maxTokens` をオーバーライドできます。

## トラブルシューティング

### オラマが検出されませんでした

Ollama が実行中であること、`OLLAMA_API_KEY` (または認証プロファイル) を設定していること、および明示的な `models.providers.ollama` エントリを**定義していない**ことを確認してください。

```bash
ollama serve
```

API にアクセスできること:

```bash
curl http://localhost:11434/api/tags
```

### 利用可能なモデルはありません

OpenClaw は、レポート ツールがサポートするモデルのみを自動検出します。お使いのモデルがリストにない場合は、次のいずれかを行ってください。

* ツール対応モデルをプルする、または
* `models.providers.ollama` でモデルを明示的に定義します。

モデルを追加するには:

```bash
ollama list  # See what's installed
ollama pull gpt-oss:20b  # Pull a tool-capable model
ollama pull llama3.3     # Or another model
```

### 接続が拒否されました

Ollama が正しいポートで実行されていることを確認します。

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

## 関連項目

* [モデルプロバイダー](/concepts/model-providers) - すべてのプロバイダーの概要
* [機種選定](/concepts/models) - 機種の選び方
* [構成](/gateway/configuration) - 完全な構成リファレンス
