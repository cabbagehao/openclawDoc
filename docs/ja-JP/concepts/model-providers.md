---
summary: "設定例と CLI フローを含むモデル プロバイダーの概要"
read_when:
  - プロバイダーごとのモデル設定のリファレンスが必要です
  - モデルプロバイダー用のサンプル設定または CLI オンボーディングコマンドが必要な場合
title: "モデルプロバイダー"
x-i18n:
  source_hash: "800754ea7e78c3b73cd4881a481fc9dc3c9cea1a800c52f3f7374bcbc2660b09"
---

# モデルプロバイダー

このページでは **LLM/モデル プロバイダー** について説明します (WhatsApp/Telegram などのチャット チャネルではありません)。
モデル選択ルールについては、[/concepts/models](/concepts/models) を参照してください。

## 簡単なルール

- モデル参照は `provider/model` を使用します (例: `opencode/claude-opus-4-6`)。
- `agents.defaults.models` を設定するとホワイトリストになります。
- CLI ヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。

## API キーのローテーション

- 選択したプロバイダーの汎用プロバイダー ローテーションをサポートします。
- 次の方法で複数のキーを設定します。
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (単一ライブ オーバーライド、最高優先度)
  - `<PROVIDER>_API_KEYS` (カンマまたはセミコロンのリスト)
  - `<PROVIDER>_API_KEY` (主キー)
  - `<PROVIDER>_API_KEY_*` (番号付きリスト、例: `<PROVIDER>_API_KEY_1`)
- Google プロバイダーの場合、`GOOGLE_API_KEY` もフォールバックとして含まれます。
- キーの選択順序により優先順位が維持され、値の重複が排除されます。
- リクエストは、レート制限応答 (`429`、`rate_limit`、`quota`、`resource exhausted` など) の場合にのみ、次のキーを使用して再試行されます。
- レート制限なしの障害は直ちに失敗します。キーのローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行から最終エラーが返されます。

## 組み込みプロバイダー (pi-ai カタログ)

OpenClaw には pi‑ai カタログが付属しています。これらのプロバイダーは**必要ありません**
`models.providers` 構成;認証を設定してモデルを選択するだけです。

### OpenAI- プロバイダー: `openai`

- 認証: `OPENAI_API_KEY`
- オプションの回転: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY` (単一オーバーライド)
- モデル例: `openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトのトランスポートは `auto` (WebSocket ファースト、SSE フォールバック)
- `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`、`"websocket"`、または `"auto"`) を介してモデルごとにオーバーライドします。
- OpenAI Responses WebSocket ウォームアップは、`params.openaiWsWarmup` (`true`/`false`) 経由でデフォルトで有効になります。
- OpenAI 優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` 経由で有効にできます

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### 人間的

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY` または `claude setup-token`
- オプションの回転: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY` (単一オーバーライド)
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice token` (セットアップ トークンの貼り付け) または `openclaw models auth paste-token --provider anthropic`
- ポリシーに関するメモ: セットアップ トークンのサポートは技術的な互換性です。 Anthropic は過去に、Claude Code 以外でのサブスクリプションの使用をブロックしました。現在の Anthropic 条件を確認し、リスク許容度に基づいて決定してください。
- 推奨事項: Anthropic API キー認証は、サブスクリプション セットアップ トークン認証よりも安全で推奨されるパスです。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI コード (コーデックス)- プロバイダー: `openai-codex`

- 認証: OAuth (ChatGPT)
- モデル例: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトのトランスポートは `auto` (WebSocket ファースト、SSE フォールバック)
- `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`、`"websocket"`、または `"auto"`) を介してモデルごとにオーバーライドします。
- ポリシーに関するメモ: OpenAI Codex OAuth は、OpenClaw などの外部ツール/ワークフローに対して明示的にサポートされています。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode Zen

- プロバイダー: `opencode`
- 認証: `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`)
- モデル例: `opencode/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice opencode-zen`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API キー)

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- オプションのローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY` (単一オーバーライド)
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`、`google/gemini-3.1-flash-lite-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使用する従来の OpenClaw 構成は `google/gemini-3-flash-preview` に正規化され、裸の `google/gemini-3.1-flash-lite` は `google/gemini-3.1-flash-lite-preview` に正規化されます。
- CLI: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex、Antigravity、および Gemini CLI- プロバイダー: `google-vertex`、`google-antigravity`、`google-gemini-cli`

- 認証: Vertex は gcloud ADC を使用します。 Antigravity/Gemini CLI はそれぞれの認証フローを使用します
- 注意: OpenClaw の Antigravity と Gemini CLI OAuth は非公式の統合です。一部のユーザーは、サードパーティのクライアントを使用した後に Google アカウントの制限を報告しました。 Google の利用規約を確認し、続行する場合は重要ではないアカウントを使用してください。
- Antigravity OAuth はバンドルされたプラグインとして出荷されます (`google-antigravity-auth`、デフォルトで無効になっています)。
  - 有効化: `openclaw plugins enable google-antigravity-auth`
  - ログイン: `openclaw models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth はバンドルされたプラグインとして出荷されます (`google-gemini-cli-auth`、デフォルトで無効になっています)。
  - 有効化: `openclaw plugins enable google-gemini-cli-auth`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 注: クライアント ID またはシークレットを `openclaw.json` に貼り付けないでください\*\*。 CLI ログイン フロー ストア
    ゲートウェイ ホスト上の認証プロファイル内のトークン。

### Z.AI (GLM)

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` および `z-ai/*` は `zai/*` に正規化されます。

### Vercel AI ゲートウェイ

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### キロゲートウェイ- プロバイダー: `kilocode`

- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --kilocode-api-key <key>`
- ベース URL: `https://api.kilo.ai/api/gateway/`
- 拡張された内蔵カタログには、GLM-5 Free、MiniMax M2.5 Free、GPT-5.2、Gemini 3 Pro Preview、Gemini 3 Flash Preview、Grok Code Fast 1、および Kim K2.5 が含まれます。

セットアップの詳細については、[/providers/kilocode](/providers/kilocode) を参照してください。

### 他の組み込みプロバイダー

- オープンルーター: `openrouter` (`OPENROUTER_API_KEY`)
- モデル例: `openrouter/anthropic/claude-sonnet-4-5`
- キロゲートウェイ: `kilocode` (`KILOCODE_API_KEY`)
- モデル例: `kilocode/anthropic/claude-opus-4.6`
- xAI: `xai` (`XAI_API_KEY`)
- ミストラル: `mistral` (`MISTRAL_API_KEY`)
- モデル例: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- 大脳: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras の GLM モデルは、ID `zai-glm-4.7` および `zai-glm-4.6` を使用します。
  - OpenAI 互換のベース URL: `https://api.cerebras.ai/v1`。
- GitHub コパイロット: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- ハグ顔推論: `huggingface` (`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`) — OpenAI 互換ルーター。モデル例: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`。 [ハグ顔 (推論)](/providers/huggingface) を参照してください。

## `models.providers` 経由のプロバイダー (カスタム/ベース URL)

`models.providers` (または `models.json`) を使用して **カスタム** プロバイダーを追加するか、
OpenAI/Anthropic 互換のプロキシ。### ムーンショットAI (キミ)

Moonshot は OpenAI 互換エンドポイントを使用するため、カスタム プロバイダーとして構成します。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.5`

キミ K2 モデル ID:

{/_Moonshot-kimi-k2-model-refs:start_/}

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
  {/_ムーンショット-キミ-k2-モデル-refs:end_/}

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### キミコーディング

Kimicoding は、Moonshot AI の Anthropic 互換エンドポイントを使用します。

- プロバイダー: `kimi-coding`
- 認証: `KIMI_API_KEY`
- モデル例: `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth (無料利用枠)

Qwen は、デバイス コード フローを介して Qwen Coder + Vision への OAuth アクセスを提供します。
バンドルされているプラグインを有効にして、ログインします。

```bash
openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

モデル参照:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

セットアップの詳細と注意事項については、[/providers/qwen](/providers/qwen) を参照してください。

### 火山エンジン (豆宝)

Volcano Engine (火山引擎) は、中国の Doubao およびその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine` (コーディング: `volcengine-plan`)
- 認証: `VOLCANO_ENGINE_API_KEY`
- モデル例: `volcengine/doubao-seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine/doubao-seed-1-8-251228" } },
  },
}
```

利用可能なモデル:

- `volcengine/doubao-seed-1-8-251228` (豆宝シード 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (キミ K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (ディープシーク V3.2 128K)

コーディング モデル (`volcengine-plan`):- `volcengine-plan/ark-code-latest`

- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (インターナショナル)

BytePlus ARK は、海外のユーザーに Volcano Engine と同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus` (コーディング: `byteplus-plan`)
- 認証: `BYTEPLUS_API_KEY`
- モデル例: `byteplus/seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus/seed-1-8-251228" } },
  },
}
```

利用可能なモデル:

- `byteplus/seed-1-8-251228` (シード 1.8)
- `byteplus/kimi-k2-5-260127` (キミ K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

コーディング モデル (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### 合成

Synthetic は、`synthetic` プロバイダーの背後にある Anthropic 互換モデルを提供します。

- プロバイダー: `synthetic`
- 認証: `SYNTHETIC_API_KEY`
- モデル例: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### ミニマックス

MiniMax はカスタム エンドポイントを使用するため、`models.providers` 経由で構成されます。

- MiniMax (人体互換): `--auth-choice minimax-api`
- 認証: `MINIMAX_API_KEY`

セットアップの詳細、モデル オプション、構成スニペットについては、[/providers/minimax](/providers/minimax) を参照してください。

### オラマ

Ollama は、OpenAI 互換 API を提供するローカル LLM ランタイムです。

- プロバイダー: `ollama`
- 認証: 不要 (ローカルサーバー)
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.ai](https://ollama.ai)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

````json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```Ollama は、`http://127.0.0.1:11434/v1` でローカルで実行すると自動的に検出されます。モデルの推奨事項とカスタム構成については、[/providers/ollama](/providers/ollama) を参照してください。

### vLLM

vLLM は、ローカル (または自己ホスト型) OpenAI 互換サーバーです。

- プロバイダー: `vllm`
- 認証: オプション (サーバーによって異なります)
- デフォルトのベース URL: `http://127.0.0.1:8000/v1`

ローカルで自動検出をオプトインするには (サーバーが認証を強制しない場合は、任意の値が機能します):

```bash
export VLLM_API_KEY="vllm-local"
````

次に、モデルを設定します (`/v1/models` によって返された ID の 1 つに置き換えます)。

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細については、[/providers/vllm](/providers/vllm) を参照してください。

### ローカル プロキシ (LM Studio、vLLM、LiteLLM など)

例 (OpenAI 互換):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

注:- カスタム プロバイダーの場合、`reasoning`、`input`、`cost`、`contextWindow`、および `maxTokens` はオプションです。
省略した場合、OpenClaw のデフォルトは次のとおりです。

- `reasoning: false`
- `input: ["text"]`
- `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
- `contextWindow: 200000`
- `maxTokens: 8192`
- 推奨: プロキシ/モデルの制限に一致する明示的な値を設定します。
- 非ネイティブ エンドポイント (ホストが `api.openai.com` ではない空でない `baseUrl`) 上の `api: "openai-completions"` の場合、OpenClaw は、サポートされていない `developer` ロールに対するプロバイダー 400 エラーを回避するために `compat.supportsDeveloperRole: false` を強制します。
- `baseUrl` が空または省略されている場合、OpenClaw はデフォルトの OpenAI 動作 (`api.openai.com` に解決されます) を維持します。
- 安全のため、明示的な `compat.supportsDeveloperRole: true` は、非ネイティブ `openai-completions` エンドポイントでもオーバーライドされます。

## CLI の例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

完全な構成例については、[/gateway/configuration](/gateway/configuration) も参照してください。
