---
summary: "예시 설정과 CLI 흐름을 포함한 모델 프로바이더 개요"
read_when:
  - 프로바이더별 모델 설정 참조가 필요할 때
  - 모델 프로바이더용 예시 설정이나 CLI 온보딩 명령을 원할 때
title: "모델 프로바이더"
---

# 모델 프로바이더

이 페이지는 **LLM/모델 프로바이더**를 다룹니다(WhatsApp/Telegram 같은 채팅 채널이 아님).
모델 선택 규칙은 [/concepts/models](/concepts/models)를 참고하세요.

## 빠른 규칙

- 모델 ref는 `provider/model` 형식을 사용합니다(예: `opencode/claude-opus-4-6`).
- `agents.defaults.models`를 설정하면 allowlist가 됩니다.
- CLI 도우미: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.

## API 키 회전

- 선택된 프로바이더에 대해 일반적인 프로바이더 회전을 지원합니다.
- 여러 키는 다음으로 구성합니다.
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 라이브 재정의, 최우선)
  - `<PROVIDER>_API_KEYS`(쉼표 또는 세미콜론 목록)
  - `<PROVIDER>_API_KEY`(기본 키)
  - `<PROVIDER>_API_KEY_*`(번호 목록, 예: `<PROVIDER>_API_KEY_1`)
- Google 프로바이더의 경우 `GOOGLE_API_KEY`도 폴백으로 포함됩니다.
- 키 선택 순서는 우선순위를 유지하며 중복 값을 제거합니다.
- 요청은 rate-limit 응답(예: `429`, `rate_limit`, `quota`, `resource exhausted`)에서만 다음 키로 재시도됩니다.
- 비 rate-limit 실패는 즉시 실패하며, 키 회전은 시도하지 않습니다.
- 모든 후보 키가 실패하면 마지막 시도의 최종 오류를 반환합니다.

## 내장 프로바이더(pi-ai 카탈로그)

OpenClaw는 pi-ai 카탈로그를 함께 제공합니다. 이 프로바이더들은
`models.providers` 설정이 **전혀 필요하지 않습니다**. 인증만 설정하고 모델을 고르면 됩니다.

### OpenAI

- 프로바이더: `openai`
- 인증: `OPENAI_API_KEY`
- 선택적 회전: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, 그리고 `OPENCLAW_LIVE_OPENAI_KEY`(단일 재정의)
- 예시 모델: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 기본 전송은 `auto`(WebSocket 우선, SSE 폴백)
- 모델별 재정의: `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, `"auto"`)
- OpenAI Responses WebSocket warm-up은 `params.openaiWsWarmup`(`true`/`false`)으로 기본 활성화
- OpenAI priority processing은 `agents.defaults.models["openai/<model>"].params.serviceTier`로 활성화 가능

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- 프로바이더: `anthropic`
- 인증: `ANTHROPIC_API_KEY` 또는 `claude setup-token`
- 선택적 회전: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, 그리고 `OPENCLAW_LIVE_ANTHROPIC_KEY`(단일 재정의)
- 예시 모델: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice token`(setup-token 붙여넣기) 또는 `openclaw models auth paste-token --provider anthropic`
- 정책 참고: setup-token 지원은 기술적 호환성입니다. Anthropic은 과거 Claude Code 외부의 일부 구독 사용을 차단한 적이 있습니다. 현재 Anthropic 약관을 확인하고 자신의 위험 허용도에 맞게 결정하세요.
- 권장 사항: Anthropic API 키 인증이 구독 setup-token 인증보다 더 안전하고 권장되는 경로입니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- 프로바이더: `openai-codex`
- 인증: OAuth (ChatGPT)
- 예시 모델: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` 또는 `openclaw models auth login --provider openai-codex`
- 기본 전송은 `auto`(WebSocket 우선, SSE 폴백)
- 모델별 재정의: `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, `"auto"`)
- 정책 참고: OpenAI Codex OAuth는 OpenClaw 같은 외부 도구/워크플로우에서의 사용이 명시적으로 지원됩니다.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode Zen

- 프로바이더: `opencode`
- 인증: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)
- 예시 모델: `opencode/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice opencode-zen`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini(API 키)

- 프로바이더: `google`
- 인증: `GEMINI_API_KEY`
- 선택적 회전: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` 폴백, 그리고 `OPENCLAW_LIVE_GEMINI_KEY`(단일 재정의)
- 예시 모델: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`, `google/gemini-3.1-flash-lite-preview`
- 호환성: 레거시 OpenClaw 설정에서 `google/gemini-3.1-flash-preview`는 `google/gemini-3-flash-preview`로, bare `google/gemini-3.1-flash-lite`는 `google/gemini-3.1-flash-lite-preview`로 정규화됩니다.
- CLI: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex, Antigravity, Gemini CLI

- 프로바이더: `google-vertex`, `google-antigravity`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC 사용, Antigravity/Gemini CLI는 각자의 인증 흐름 사용
- 주의: OpenClaw에서의 Antigravity와 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 서드파티 클라이언트 사용 후 Google 계정 제한을 경험했다고 보고했습니다. 진행하기 전에 Google 약관을 검토하고, 선택한다면 중요하지 않은 계정을 사용하세요.
- Antigravity OAuth는 번들 플러그인(`google-antigravity-auth`, 기본 비활성화)으로 제공됩니다.
  - 활성화: `openclaw plugins enable google-antigravity-auth`
  - 로그인: `openclaw models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth는 번들 플러그인(`google-gemini-cli-auth`, 기본 비활성화)으로 제공됩니다.
  - 활성화: `openclaw plugins enable google-gemini-cli-auth`
  - 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 참고: `openclaw.json`에 client id나 secret을 붙여 넣지 **않습니다**. CLI 로그인 흐름은 토큰을 게이트웨이 호스트의 auth profile에 저장합니다.

### Z.AI (GLM)

- 프로바이더: `zai`
- 인증: `ZAI_API_KEY`
- 예시 모델: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 별칭: `z.ai/*`와 `z-ai/*`는 `zai/*`로 정규화됩니다.

### Vercel AI Gateway

- 프로바이더: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예시 모델: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- 프로바이더: `kilocode`
- 인증: `KILOCODE_API_KEY`
- 예시 모델: `kilocode/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --kilocode-api-key <key>`
- Base URL: `https://api.kilo.ai/api/gateway/`
- 확장된 내장 카탈로그에는 GLM-5 Free, MiniMax M2.5 Free, GPT-5.2, Gemini 3 Pro Preview, Gemini 3 Flash Preview, Grok Code Fast 1, Kimi K2.5가 포함됩니다.

설정 세부사항은 [/providers/kilocode](/providers/kilocode)를 참고하세요.

### 기타 내장 프로바이더

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- 예시 모델: `openrouter/anthropic/claude-sonnet-4-5`
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- 예시 모델: `kilocode/anthropic/claude-opus-4.6`
- xAI: `xai` (`XAI_API_KEY`)
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- 예시 모델: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras의 GLM 모델은 `zai-glm-4.7`, `zai-glm-4.6` ID를 사용합니다.
  - OpenAI 호환 base URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`) — OpenAI 호환 라우터. 예시 모델: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. [Hugging Face (Inference)](/providers/huggingface) 참고.

## `models.providers`를 통한 프로바이더(커스텀/base URL)

**사용자 정의** 프로바이더 또는 OpenAI/Anthropic 호환 프록시를 추가하려면
`models.providers`(또는 `models.json`)를 사용하세요.

### Moonshot AI (Kimi)

Moonshot은 OpenAI 호환 엔드포인트를 사용하므로, 사용자 정의 프로바이더로 설정합니다.

- 프로바이더: `moonshot`
- 인증: `MOONSHOT_API_KEY`
- 예시 모델: `moonshot/kimi-k2.5`

Kimi K2 모델 ID:

{/_moonshot-kimi-k2-model-refs:start_/}

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
  {/_moonshot-kimi-k2-model-refs:end_/}

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

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다.

- 프로바이더: `kimi-coding`
- 인증: `KIMI_API_KEY`
- 예시 모델: `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth(무료 티어)

Qwen은 device-code 흐름을 통해 Qwen Coder + Vision용 OAuth 액세스를 제공합니다.
번들 플러그인을 활성화한 뒤 로그인하세요.

```bash
openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

모델 ref:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

설정 세부사항과 참고 사항은 [/providers/qwen](/providers/qwen)을 참고하세요.

### Volcano Engine (Doubao)

Volcano Engine(화산엔진, 火山引擎)은 중국에서 Doubao 및 기타 모델에 대한 액세스를 제공합니다.

- 프로바이더: `volcengine` (코딩: `volcengine-plan`)
- 인증: `VOLCANO_ENGINE_API_KEY`
- 예시 모델: `volcengine/doubao-seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine/doubao-seed-1-8-251228" } },
  },
}
```

사용 가능한 모델:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

코딩 모델(`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (국제판)

BytePlus ARK는 국제 사용자를 위해 Volcano Engine과 같은 모델에 대한 액세스를 제공합니다.

- 프로바이더: `byteplus` (코딩: `byteplus-plan`)
- 인증: `BYTEPLUS_API_KEY`
- 예시 모델: `byteplus/seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus/seed-1-8-251228" } },
  },
}
```

사용 가능한 모델:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

코딩 모델(`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic는 `synthetic` 프로바이더 뒤에서 Anthropic 호환 모델을 제공합니다.

- 프로바이더: `synthetic`
- 인증: `SYNTHETIC_API_KEY`
- 예시 모델: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

### MiniMax

MiniMax는 사용자 정의 엔드포인트를 사용하므로 `models.providers`로 구성합니다.

- MiniMax(Anthropic 호환): `--auth-choice minimax-api`
- 인증: `MINIMAX_API_KEY`

설정 세부사항, 모델 옵션, 설정 스니펫은 [/providers/minimax](/providers/minimax)를 참고하세요.

### Ollama

Ollama는 OpenAI 호환 API를 제공하는 로컬 LLM 런타임입니다.

- 프로바이더: `ollama`
- 인증: 필요 없음(로컬 서버)
- 예시 모델: `ollama/llama3.3`
- 설치: [https://ollama.ai](https://ollama.ai)

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

Ollama는 로컬의 `http://127.0.0.1:11434/v1`에서 실행 중이면 자동 감지됩니다. 모델 권장 사항과 사용자 정의 설정은 [/providers/ollama](/providers/ollama)를 참고하세요.

### vLLM

vLLM은 로컬(또는 셀프호스팅) OpenAI 호환 서버입니다.

- 프로바이더: `vllm`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:8000/v1`

로컬 자동 검색에 opt-in하려면(서버가 인증을 강제하지 않는다면 어떤 값이든 가능):

```bash
export VLLM_API_KEY="vllm-local"
```

그다음 모델을 설정하세요(`/v1/models`가 반환한 ID 중 하나로 교체).

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/providers/vllm)을 참고하세요.

### 로컬 프록시(LM Studio, vLLM, LiteLLM 등)

예시(OpenAI 호환):

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

참고:

- 사용자 정의 프로바이더에서 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다.
  생략하면 OpenClaw는 다음 기본값을 사용합니다.
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 권장 사항: 프록시/모델 한계와 일치하는 명시적 값을 설정하세요.
- 비네이티브 엔드포인트(`baseUrl`이 비어 있지 않고 호스트가 `api.openai.com`이 아닌 경우)의 `api: "openai-completions"`에 대해서는, 지원되지 않는 `developer` 역할로 인한 provider 400 오류를 피하기 위해 OpenClaw가 `compat.supportsDeveloperRole: false`를 강제합니다.
- `baseUrl`이 비어 있거나 생략되면 OpenClaw는 기본 OpenAI 동작(`api.openai.com`으로 해석)을 유지합니다.
- 안전을 위해, 비네이티브 `openai-completions` 엔드포인트에서는 명시적인 `compat.supportsDeveloperRole: true`도 여전히 덮어씁니다.

## CLI 예시

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

전체 설정 예시는 [/gateway/configuration](/gateway/configuration)을 참고하세요.
