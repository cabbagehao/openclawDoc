---
summary: "モデルプロバイダーの概要、構成例、および CLI でのセットアップ手順"
read_when:
  - プロバイダーごとのモデル設定方法を確認したい場合
  - 設定ファイルの記述例や、オンボーディング用の CLI コマンドを知りたい場合
title: "OpenClawのモデルプロバイダーの役割と切替設計を理解するガイド"
description: "このページでは、LLM（大規模言語モデル）のプロバイダー に関する設定を説明します（WhatsApp や Telegram などのチャットチャネルではありません）。モデルの選択ルールについては、モデル を参照してください。"
x-i18n:
  source_hash: "800754ea7e78c3b73cd4881a481fc9dc3c9cea1a800c52f3f7374bcbc2660b09"
---
このページでは、**LLM（大規模言語モデル）のプロバイダー** に関する設定を説明します（WhatsApp や Telegram などのチャットチャネルではありません）。
モデルの選択ルールについては、[モデル](/concepts/models) を参照してください。

## 基本ルール

- モデルの指定には `provider/model` 形式を使用します（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` を設定すると、それが利用可能なモデルの許可リスト（カタログ）になります。
- 管理用コマンド: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`。

## API キーのローテーション

- 主要なプロバイダーにおいて、複数の API キーを自動で切り替えるローテーション機能をサポートしています。
- 複数のキーを設定するには、以下の環境変数を使用します（上から優先順位が高い順）:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`: 単一の実行時上書き用。最優先。
  - `<PROVIDER>_API_KEYS`: カンマまたはセミコロン区切りのリスト。
  - `<PROVIDER>_API_KEY`: メインのキー。
  - `<PROVIDER>_API_KEY_*`: 連番付きのリスト（例: `<PROVIDER>_API_KEY_1`）。
- Google プロバイダーの場合、`GOOGLE_API_KEY` もフォールバックとして含まれます。
- キーの選択順序は優先順位を維持し、重複した値は自動的に除外されます。
- レート制限エラー（`429`, `rate_limit`, `quota`, `resource exhausted` など）が発生した場合にのみ、次のキーを使用して再試行します。
- それ以外のエラー（認証失敗、リクエスト不正など）の場合は即座にエラーとなり、ローテーションは行われません。
- すべての候補キーを試しても失敗した場合は、最後の試行時に発生したエラーが返されます。

## 標準プロバイダー (pi-ai カタログ)

OpenClaw には `pi-ai` モデルカタログが組み込まれています。以下のプロバイダーは、構成ファイルでの `models.providers` の定義は**不要**です。認証情報を設定してモデルを選択するだけで利用できます。

### OpenAI

- プロバイダー ID: `openai`
- 認証: `OPENAI_API_KEY`
- ローテーション設定: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, および `OPENCLAW_LIVE_OPENAI_KEY`
- モデル例: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- セットアップ: `openclaw onboard --auth-choice openai-api-key`
- 通信方式（transport）はデフォルトで `auto`（WebSocket 優先、SSE フォールバック）です。
- モデルごとに `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, `"auto"`) で上書き可能です。
- OpenAI Responses WebSocket のウォームアップ（事前接続）は `params.openaiWsWarmup` (`true`/`false`) で制御可能です。
- 優先処理（priority processing）は `agents.defaults.models["openai/<model>"].params.serviceTier` で設定可能です。

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー ID: `anthropic`
- 認証: `ANTHROPIC_API_KEY` または `claude setup-token`
- ローテーション設定: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, および `OPENCLAW_LIVE_ANTHROPIC_KEY`
- モデル例: `anthropic/claude-opus-4-6`
- セットアップ: `openclaw onboard --auth-choice token`（setup-token を貼り付け）または `openclaw models auth paste-token --provider anthropic`
- 補足: setup-token の利用は技術的な互換性維持のためのものであり、Anthropic のポリシーにより Claude Code 以外での利用が制限される場合があります。リスクを理解した上で利用してください。
- 推奨: サブスクリプションベースの setup-token よりも、API キーによる認証の方が安定しており推奨されます。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- プロバイダー ID: `openai-codex`
- 認証: OAuth (ChatGPT アカウント)
- モデル例: `openai-codex/gpt-5.4`
- セットアップ: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- 通信方式はデフォルトで `auto` です。
- 補足: OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode Zen

- プロバイダー ID: `opencode`
- 認証: `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`)
- モデル例: `opencode/claude-opus-4-6`
- セットアップ: `openclaw onboard --auth-choice opencode-zen`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API キー方式)

- プロバイダー ID: `google`
- 認証: `GEMINI_API_KEY`
- ローテーション設定: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` (フォールバック), および `OPENCLAW_LIVE_GEMINI_KEY`
- モデル例: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 互換性: 以前の形式（`-preview` なしの名称など）は、自動的に最新のプレビュー版名称へ正規化されます。
- セットアップ: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex, Antigravity, および Gemini CLI

- プロバイダー ID: `google-vertex`, `google-antigravity`, `google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用。その他はそれぞれの認証フローに従います。
- 注意: Antigravity および Gemini CLI の OAuth 連携は非公式なものです。サードパーティ製クライアントの使用により Google アカウントに制限がかかったという報告もあります。リスクを承知の上で、重要度の低いアカウントで使用することを検討してください。
- Antigravity OAuth は同梱プラグイン (`google-antigravity-auth`) として提供されています。
  - 有効化: `openclaw plugins enable google-antigravity-auth`
  - ログイン: `openclaw models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth も同梱プラグイン (`google-gemini-cli-auth`) として提供されています。
  - 有効化: `openclaw plugins enable google-gemini-cli-auth`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 補足: クライアント ID やシークレットを構成ファイルに記述する必要はありません。CLI のログインフローにより、ゲートウェイホスト上の認証プロファイルにトークンが保存されます。

### Z.AI (GLM)

- プロバイダー ID: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5`
- セットアップ: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` や `z-ai/*` は `zai/*` に自動的に正規化されます。

### Vercel AI Gateway

- プロバイダー ID: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- セットアップ: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー ID: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/anthropic/claude-opus-4.6`
- セットアップ: `openclaw onboard --kilocode-api-key <key>`
- ベース URL: `https://api.kilo.ai/api/gateway/`
- 組み込みカタログには、GLM-5 Free, MiniMax M2.5 Free, GPT-5.2, Gemini 3 Pro/Flash Preview, Grok Code Fast 1, Kimi K2.5 などが含まれます。

詳細は [/providers/kilocode](/providers/kilocode) を参照してください。

### その他の標準プロバイダー

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- xAI: `xai` (`XAI_API_KEY`)
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` 等)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` 等)

## `models.providers` を介したカスタム設定 (ベース URL 指定)

独自のエンドポイントやプロキシ（OpenAI/Anthropic 互換）を使用する場合は、`models.providers`（または `models.json`）で定義します。

### Moonshot AI (Kimi)

OpenAI 互換エンドポイントを使用するため、カスタムプロバイダーとして構成します:

- プロバイダー ID: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.5`

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

### Volcano Engine / 火山引擎 (Doubao)

Doubao（豆包）などのモデルへのアクセスを提供します。

- プロバイダー ID: `volcengine`
- 認証: `VOLCANO_ENGINE_API_KEY`
- モデル例: `volcengine/doubao-seed-1-8-251228`
- セットアップ: `openclaw onboard --auth-choice volcengine-api-key`

利用可能なモデルは以下のとおりです。

### Ollama

ローカルで動作する LLM ランタイムです。OpenAI 互換 API を提供します:

- プロバイダー ID: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- 公式サイト: [https://ollama.ai](https://ollama.ai)

ローカルホストのデフォルトポート (`http://127.0.0.1:11434/v1`) で動作していれば、自動的に検出されます。詳細は [/providers/ollama](/providers/ollama) を参照してください。

### ローカルプロキシ (LM Studio, vLLM, LiteLLM など)

OpenAI 互換サーバーの設定例:

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
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
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

補足:
- カスタムプロバイダーでは、`reasoning`, `input`, `cost`, `contextWindow`, `maxTokens` などのフィールドはオプションです。省略時は OpenClaw の安全なデフォルト値が使用されます。
- プロキシ側の制限に合わせて、これらの値を明示的に設定することを推奨します。
- OpenAI 以外のエンドポイントで `api: "openai-completions"` を使用する場合、OpenClaw は互換性のために `compat.supportsDeveloperRole: false` を強制的に適用し、サポートされていない `developer` ロールによるエラーを防ぎます。

## CLI の実行例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

設定全体の例については、[ゲートウェイ構成](/gateway/configuration) も参照してください。
