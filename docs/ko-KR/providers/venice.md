---
summary: "OpenClaw에서 Venice AI의 프라이버시 중심 모델 사용하기"
description: "OpenClaw에서 Venice AI의 프라이버시 중심 모델 사용하기"
read_when:
  - OpenClaw에서 프라이버시 중심 추론을 원할 때
  - Venice AI 설정 가이드를 원할 때
title: "Venice AI"
---

# Venice AI (Venice highlight)

**Venice**는 프라이버시 우선 추론을 위해, 그리고 선택적으로 익명화된 방식으로
독점 모델에 접근할 수 있도록 제공하는 대표적인 Venice 설정입니다.

Venice AI는 검열되지 않은 모델 지원과, 익명화된 프록시를 통한 주요 독점 모델
접근을 포함한 프라이버시 중심 AI 추론을 제공합니다. 모든 추론은 기본적으로
비공개입니다. 여러분의 데이터로 학습하지 않으며, 로그도 남기지 않습니다.

## OpenClaw에서 Venice를 사용하는 이유

- 오픈소스 모델에 대한 **비공개 추론**(로그 없음)
- 필요할 때 **검열되지 않은 모델**
- 품질이 중요할 때, 독점 모델(Opus/GPT/Gemini)에 대한 **익명화된 접근**
- OpenAI 호환 `/v1` 엔드포인트

## 프라이버시 모드

Venice는 두 가지 프라이버시 수준을 제공합니다. 어떤 모델을 선택할지 결정할 때
이를 이해하는 것이 중요합니다.

| 모드 | 설명                                                                                                                       | Models                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | 완전한 비공개. 프롬프트/응답은 **절대로 저장되거나 로깅되지 않습니다**. 일시적입니다.                                              | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored 등    |
| **Anonymized** | Venice를 통해 프록시되며 메타데이터가 제거됩니다. 기본 프로바이더(OpenAI, Anthropic, Google, xAI)는 익명화된 요청만 보게 됩니다. | Claude, GPT, Gemini, Grok                                     |

## 기능

- **프라이버시 중심**: "private"(완전 비공개)와 "anonymized"(프록시) 모드 중 선택 가능
- **검열되지 않은 모델**: 콘텐츠 제한 없는 모델 접근 가능
- **주요 모델 접근**: Venice의 익명화 프록시를 통해 Claude, GPT, Gemini, Grok 사용 가능
- **OpenAI 호환 API**: 쉬운 통합을 위한 표준 `/v1` 엔드포인트
- **Streaming**: ✅ 모든 모델에서 지원
- **Function calling**: ✅ 일부 모델에서 지원(모델 capability 확인 필요)
- **Vision**: ✅ vision capability가 있는 모델에서 지원
- **하드 레이트 리밋 없음**: 과도한 사용 시 fair-use throttling이 적용될 수 있음

## 설정

### 1. API Key 받기

1. [venice.ai](https://venice.ai)에서 가입합니다
2. **Settings → API Keys → Create new key**로 이동합니다
3. API 키를 복사합니다(형식: `vapi_xxxxxxxxxxxx`)

### 2. OpenClaw 설정

**옵션 A: Environment Variable**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**옵션 B: Interactive Setup (권장)**

```bash
openclaw onboard --auth-choice venice-api-key
```

이 과정에서 다음이 수행됩니다.

1. API 키 입력을 요청합니다(또는 기존 `VENICE_API_KEY` 사용)
2. 사용 가능한 모든 Venice 모델을 보여줍니다
3. 기본 모델을 선택하게 합니다
4. 프로바이더를 자동으로 설정합니다

**옵션 C: Non-interactive**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. 설정 확인

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## 모델 선택

설정이 끝나면 OpenClaw는 사용 가능한 모든 Venice 모델을 보여줍니다. 필요에 맞게
선택하세요.

- **기본 모델**: 강력한 비공개 추론과 vision을 위해 `venice/kimi-k2-5`
- **고성능 옵션**: 가장 강력한 익명화 Venice 경로인 `venice/claude-opus-4-6`
- **Privacy**: 완전한 비공개 추론을 원하면 "private" 모델 선택
- **Capability**: Venice 프록시를 통해 Claude, GPT, Gemini에 접근하려면 "anonymized" 모델 선택

기본 모델은 언제든 변경할 수 있습니다.

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

사용 가능한 모든 모델 목록 보기:

```bash
openclaw models list | grep venice
```

## `openclaw configure`로 설정하기

1. `openclaw configure`를 실행합니다
2. **Model/auth**를 선택합니다
3. **Venice AI**를 선택합니다

## 어떤 모델을 사용해야 하나요?

| Use Case                   | Recommended Model                | Why                                 |
| -------------------------- | -------------------------------- | ----------------------------------- |
| **일반 대화 (기본값)**     | `kimi-k2-5`                      | 강력한 비공개 추론 + vision         |
| **전반적으로 최고의 품질** | `claude-opus-4-6`                | 가장 강력한 익명화 Venice 옵션      |
| **프라이버시 + 코딩**      | `qwen3-coder-480b-a35b-instruct` | 큰 컨텍스트를 가진 비공개 코딩 모델 |
| **비공개 vision**          | `kimi-k2-5`                      | private mode를 벗어나지 않는 vision |
| **빠르고 저렴함**          | `qwen3-4b`                       | 가벼운 추론 모델                    |
| **복잡한 비공개 작업**     | `deepseek-v3.2`                  | 강한 추론, 단 Venice tool 미지원    |
| **검열 없음**              | `venice-uncensored`              | 콘텐츠 제한 없음                    |

## 사용 가능한 모델 (총 41개)

### Private Models (26) — 완전 비공개, 로깅 없음

| Model ID                               | Name                                | Context | Features                   |
| -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Default, reasoning, vision |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                  |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | General                    |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | General                    |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | General, tools disabled    |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Reasoning                  |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | General                    |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Coding                     |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Coding                     |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Reasoning, vision          |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | General                    |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                     |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Fast, reasoning            |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Reasoning, tools disabled  |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Uncensored, tools disabled |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                     |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                     |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | General                    |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | General                    |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Reasoning                  |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | General                    |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Reasoning                  |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Reasoning                  |
| `zai-org-glm-5`                        | GLM 5                               | 198k    | Reasoning                  |
| `minimax-m21`                          | MiniMax M2.1                        | 198k    | Reasoning                  |
| `minimax-m25`                          | MiniMax M2.5                        | 198k    | Reasoning                  |

### Anonymized Models (15) — Venice Proxy 경유

| Model ID                        | Name                           | Context | Features                  |
| ------------------------------- | ------------------------------ | ------- | ------------------------- |
| `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Reasoning, vision         |
| `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Reasoning, vision         |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Reasoning, vision         |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Reasoning, vision         |
| `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Reasoning, vision         |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Reasoning, vision, coding |
| `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Reasoning                 |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Reasoning, vision, coding |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Vision                    |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Vision                    |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Reasoning, vision         |
| `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Reasoning, vision         |
| `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Reasoning, vision         |
| `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Reasoning, vision         |
| `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Reasoning, coding         |

## 모델 탐색

`VENICE_API_KEY`가 설정되어 있으면 OpenClaw는 Venice API에서 모델을 자동으로
탐색합니다. API에 접근할 수 없으면 정적 카탈로그로 폴백합니다.

`/models` 엔드포인트는 공개되어 있어 모델 목록 조회에는 auth가 필요 없지만,
추론에는 유효한 API 키가 필요합니다.

## Streaming 및 Tool 지원

| Feature              | Support                                                 |
| -------------------- | ------------------------------------------------------- |
| **Streaming**        | ✅ 모든 모델                                            |
| **Function calling** | ✅ 대부분의 모델(API의 `supportsFunctionCalling` 확인) |
| **Vision/Images**    | ✅ "Vision" 기능이 표시된 모델                          |
| **JSON mode**        | ✅ `response_format`을 통해 지원                        |

## 가격

Venice는 credit 기반 시스템을 사용합니다. 최신 요금은
[venice.ai/pricing](https://venice.ai/pricing)에서 확인하세요.

- **Private models**: 일반적으로 더 저렴함
- **Anonymized models**: 직접 API 가격 + 소규모 Venice 수수료와 유사

## 비교: Venice vs Direct API

| Aspect       | Venice (Anonymized)             | Direct API          |
| ------------ | ------------------------------- | ------------------- |
| **Privacy**  | 메타데이터 제거, 익명화         | 계정이 직접 연결됨  |
| **Latency**  | +10-50ms (프록시)               | 직접 연결           |
| **Features** | 대부분의 기능 지원              | 전체 기능           |
| **Billing**  | Venice credits                  | Provider billing    |

## 사용 예시

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## 문제 해결

### API 키를 인식하지 못함

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

키가 `vapi_`로 시작하는지 확인하세요.

### 모델을 사용할 수 없음

Venice 모델 카탈로그는 동적으로 업데이트됩니다. 현재 사용 가능한 모델을 보려면
`openclaw models list`를 실행하세요. 일부 모델은 일시적으로 오프라인일 수 있습니다.

### 연결 문제

Venice API는 `https://api.venice.ai/api/v1`에 있습니다. 네트워크가 HTTPS 연결을
허용하는지 확인하세요.

## config 파일 예시

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## 링크

- [Venice AI](https://venice.ai)
- [API Documentation](https://docs.venice.ai)
- [Pricing](https://venice.ai/pricing)
- [Status](https://status.venice.ai)
