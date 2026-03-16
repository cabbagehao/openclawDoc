---
summary: "Model provider overview with example configs + CLI flows"
description: "OpenClaw에서 사용하는 model provider별 auth 방식, example config, CLI onboarding flow를 한곳에서 정리합니다."
read_when:
  - provider별 model setup reference가 필요할 때
  - model provider용 example config나 CLI onboarding command가 필요할 때
title: "Model Providers"
x-i18n:
  source_path: "concepts/model-providers.md"
---

# Model providers

이 페이지는 **LLM/model provider**를 다룹니다.
(WhatsApp, Telegram 같은 chat channel 문서는 아님)
model selection rule은 [/concepts/models](/concepts/models)를 참고하세요.

## Quick rules

- model ref는 `provider/model` 형식을 사용합니다
  (예: `opencode/claude-opus-4-6`)
- `agents.defaults.models`를 설정하면 allowlist가 됩니다
- CLI helper:
  `openclaw onboard`,
  `openclaw models list`,
  `openclaw models set <provider/model>`

## API key rotation

- 선택된 provider에 대해 generic provider rotation을 지원합니다
- 여러 key는 다음 방식으로 설정합니다
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`
    (single live override, 최우선)
  - `<PROVIDER>_API_KEYS`
    (comma 또는 semicolon list)
  - `<PROVIDER>_API_KEY`
    (primary key)
  - `<PROVIDER>_API_KEY_*`
    (번호 목록, 예: `<PROVIDER>_API_KEY_1`)
- Google provider는 `GOOGLE_API_KEY`도 fallback으로 포함합니다
- key selection order는 priority를 보존하고 value를 dedupe합니다
- request는 rate-limit response에서만 다음 key로 retry합니다
  (예: `429`, `rate_limit`, `quota`, `resource exhausted`)
- rate-limit이 아닌 failure는 즉시 실패하며 key rotation을 시도하지 않습니다
- 모든 candidate key가 실패하면 마지막 시도의 error를 반환합니다

## Built-in providers (pi-ai catalog)

OpenClaw는 pi-ai catalog를 함께 제공합니다. 이 provider들은 `models.providers` config가
**필요 없고**, auth만 설정한 뒤 model을 고르면 됩니다.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optional rotation:
  `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`,
  그리고 `OPENCLAW_LIVE_OPENAI_KEY`
  (single override)
- Example models:
  `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI:
  `openclaw onboard --auth-choice openai-api-key`
- 기본 transport는 `auto`
  (WebSocket-first, SSE fallback)
- model별 override:
  `agents.defaults.models["openai/<model>"].params.transport`
  (`"sse"`, `"websocket"`, `"auto"`)
- OpenAI Responses WebSocket warm-up은
  `params.openaiWsWarmup`
  (`true`/`false`)로 기본 활성화
- OpenAI priority processing은
  `agents.defaults.models["openai/<model>"].params.serviceTier`로 활성화 가능

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY` 또는 `claude setup-token`
- Optional rotation:
  `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`,
  그리고 `OPENCLAW_LIVE_ANTHROPIC_KEY`
  (single override)
- Example model:
  `anthropic/claude-opus-4-6`
- CLI:
  `openclaw onboard --auth-choice token`
  (setup-token 붙여 넣기) 또는
  `openclaw models auth paste-token --provider anthropic`
- Policy note:
  setup-token 지원은 기술적 호환성을 의미합니다.
  Anthropic은 과거 Claude Code 외부의 일부 subscription usage를 막은 적이 있으므로,
  현재 terms를 확인하고 risk tolerance에 맞게 판단하세요
- Recommendation:
  Anthropic API key auth가 subscription setup-token auth보다 더 안전하고 권장되는 경로입니다

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth
  (ChatGPT)
- Example model:
  `openai-codex/gpt-5.4`
- CLI:
  `openclaw onboard --auth-choice openai-codex` 또는
  `openclaw models auth login --provider openai-codex`
- 기본 transport는 `auto`
  (WebSocket-first, SSE fallback)
- model별 override:
  `agents.defaults.models["openai-codex/<model>"].params.transport`
  (`"sse"`, `"websocket"`, `"auto"`)
- Policy note:
  OpenAI Codex OAuth는 OpenClaw 같은 external tool/workflow에서의 사용이 명시적으로
  지원됩니다

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode

- Auth: `OPENCODE_API_KEY`
  (또는 `OPENCODE_ZEN_API_KEY`)
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- Example models:
  `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI:
  `openclaw onboard --auth-choice opencode-zen` 또는
  `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Optional rotation:
  `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`,
  `GOOGLE_API_KEY` fallback,
  `OPENCLAW_LIVE_GEMINI_KEY`
  (single override)
- Example models:
  `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibility:
  legacy OpenClaw config의 `google/gemini-3.1-flash-preview`는
  `google/gemini-3-flash-preview`로 normalize됩니다
- CLI:
  `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex, Antigravity, and Gemini CLI

- Providers:
  `google-vertex`, `google-antigravity`, `google-gemini-cli`
- Auth:
  Vertex는 gcloud ADC,
  Antigravity/Gemini CLI는 각자의 auth flow 사용
- Caution:
  Antigravity와 Gemini CLI OAuth는 OpenClaw에서 unofficial integration입니다.
  일부 사용자는 third-party client 사용 후 Google account restriction을 경험했다고
  보고했습니다. 진행하기로 했다면 Google terms를 검토하고 중요하지 않은 account를
  사용하는 편이 낫습니다
- Antigravity OAuth는 bundled plugin
  (`google-antigravity-auth`)으로 제공되며 기본 비활성화
  - Enable:
    `openclaw plugins enable google-antigravity-auth`
  - Login:
    `openclaw models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth는 bundled plugin
  (`google-gemini-cli-auth`)으로 제공되며 기본 비활성화
  - Enable:
    `openclaw plugins enable google-gemini-cli-auth`
  - Login:
    `openclaw models auth login --provider google-gemini-cli --set-default`
  - Note:
    client id나 secret을 `openclaw.json`에 붙여 넣지 않습니다.
    CLI login flow는 token을 gateway host의 auth profile에 저장합니다

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Example model:
  `zai/glm-5`
- CLI:
  `openclaw onboard --auth-choice zai-api-key`
  - Alias:
    `z.ai/*`, `z-ai/*`는 `zai/*`로 normalize

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Example model:
  `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI:
  `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Example model:
  `kilocode/anthropic/claude-opus-4.6`
- CLI:
  `openclaw onboard --kilocode-api-key <key>`
- Base URL:
  `https://api.kilo.ai/api/gateway/`
- expanded built-in catalog에는 GLM-5 Free, MiniMax M2.5 Free, GPT-5.2,
  Gemini 3 Pro Preview, Gemini 3 Flash Preview, Grok Code Fast 1,
  Kimi K2.5가 포함됩니다

설정 세부 사항은 [/providers/kilocode](/providers/kilocode)를 보세요.

### Other built-in providers

- OpenRouter:
  `openrouter`
  (`OPENROUTER_API_KEY`)
- Example model:
  `openrouter/anthropic/claude-sonnet-4-5`
- Kilo Gateway:
  `kilocode`
  (`KILOCODE_API_KEY`)
- Example model:
  `kilocode/anthropic/claude-opus-4.6`
- xAI:
  `xai`
  (`XAI_API_KEY`)
- Mistral:
  `mistral`
  (`MISTRAL_API_KEY`)
- Example model:
  `mistral/mistral-large-latest`
- CLI:
  `openclaw onboard --auth-choice mistral-api-key`
- Groq:
  `groq`
  (`GROQ_API_KEY`)
- Cerebras:
  `cerebras`
  (`CEREBRAS_API_KEY`)
  - Cerebras의 GLM model id는 `zai-glm-4.7`, `zai-glm-4.6`
  - OpenAI-compatible base URL:
    `https://api.cerebras.ai/v1`
- GitHub Copilot:
  `github-copilot`
  (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference:
  `huggingface`
  (`HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`)
  — OpenAI-compatible router
  - Example model:
    `huggingface/deepseek-ai/DeepSeek-R1`
  - CLI:
    `openclaw onboard --auth-choice huggingface-api-key`
  - 문서:
    [Hugging Face (Inference)](/providers/huggingface)

## Providers via `models.providers` (custom/base URL)

**custom** provider나 OpenAI/Anthropic-compatible proxy를 추가할 때는
`models.providers`
(또는 `models.json`)를 사용하세요.

### Moonshot AI (Kimi)

Moonshot은 OpenAI-compatible endpoint를 사용하므로 custom provider로 설정합니다.

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Example model:
  `moonshot/kimi-k2.5`

Kimi K2 model id:

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`

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

### Kimi Coding

Kimi Coding은 Moonshot AI의 Anthropic-compatible endpoint를 사용합니다.

- Provider: `kimi-coding`
- Auth: `KIMI_API_KEY`
- Example model:
  `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth (free tier)

Qwen은 device-code flow를 통해 Qwen Coder + Vision에 대한 OAuth access를 제공합니다.
bundled plugin을 켠 뒤 login하세요.

```bash
openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

Model ref:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

설정과 주의사항은 [/providers/qwen](/providers/qwen)을 참고하세요.

### Volcano Engine (Doubao)

Volcano Engine은 중국에서 Doubao와 다른 model access를 제공합니다.

- Provider:
  `volcengine`
  (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Example model:
  `volcengine/doubao-seed-1-8-251228`
- CLI:
  `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine/doubao-seed-1-8-251228" } },
  },
}
```

Available models:

- `volcengine/doubao-seed-1-8-251228`
  (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127`
  (Kimi K2.5)
- `volcengine/glm-4-7-251222`
  (GLM 4.7)
- `volcengine/deepseek-v3-2-251201`
  (DeepSeek V3.2 128K)

Coding models
(`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK는 international user를 위해 Volcano Engine과 같은 model access를
제공합니다.

- Provider:
  `byteplus`
  (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Example model:
  `byteplus/seed-1-8-251228`
- CLI:
  `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus/seed-1-8-251228" } },
  },
}
```

Available models:

- `byteplus/seed-1-8-251228`
  (Seed 1.8)
- `byteplus/kimi-k2-5-260127`
  (Kimi K2.5)
- `byteplus/glm-4-7-251222`
  (GLM 4.7)

Coding models
(`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic은 `synthetic` provider 뒤에서 Anthropic-compatible model을 제공합니다.

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Example model:
  `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI:
  `openclaw onboard --auth-choice synthetic-api-key`

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

### MiniMax

MiniMax는 custom endpoint를 사용하므로 `models.providers`로 설정합니다.

- MiniMax
  (Anthropic-compatible):
  `--auth-choice minimax-api`
- Auth: `MINIMAX_API_KEY`

setup detail, model option, config snippet은
[/providers/minimax](/providers/minimax)를 보세요.

### Ollama

Ollama는 OpenAI-compatible API를 제공하는 local LLM runtime입니다.

- Provider: `ollama`
- Auth: 필요 없음
  (local server)
- Example model:
  `ollama/llama3.3`
- Installation:
  [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY`로 opt in하면 Ollama는 local의 `http://127.0.0.1:11434`에서
자동 감지되며, `openclaw onboard`가 first-class provider처럼 직접 설정할 수 있습니다.
onboarding, cloud/local mode, custom configuration은
[/providers/ollama](/providers/ollama)를 보세요.

### vLLM

vLLM은 local 또는 self-hosted OpenAI-compatible server입니다.

- Provider: `vllm`
- Auth: optional
  (server 설정에 따름)
- Default base URL:
  `http://127.0.0.1:8000/v1`

local auto-discovery를 opt in하려면
(server가 auth를 강제하지 않아도 아무 값이나 가능):

```bash
export VLLM_API_KEY="vllm-local"
```

그다음 `/v1/models`가 반환한 id 중 하나를 model로 설정합니다.

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/providers/vllm)을 참고하세요.

### Local proxies (LM Studio, vLLM, LiteLLM, etc.)

예시
(OpenAI-compatible):

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

Notes:

- custom provider에서 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는
  optional입니다
- 생략하면 OpenClaw 기본값은 다음과 같습니다
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recommendation:
  proxy/model의 실제 제한에 맞는 explicit 값을 설정하는 편이 좋습니다
- `api: "openai-completions"`를 non-native endpoint에서 쓸 때
  (`baseUrl`이 비어 있지 않고 host가 `api.openai.com`이 아님),
  OpenClaw는 unsupported `developer` role로 인한 provider 400 error를 피하려고
  `compat.supportsDeveloperRole: false`를 강제합니다
- `baseUrl`이 비어 있거나 생략되면, OpenClaw는 기본 OpenAI behavior를 유지합니다
  (`api.openai.com`으로 resolve)
- 안전을 위해 explicit `compat.supportsDeveloperRole: true`도
  non-native `openai-completions` endpoint에서는 override됩니다

## CLI examples

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

전체 configuration example은 [/gateway/configuration](/gateway/configuration)을
참고하세요.
