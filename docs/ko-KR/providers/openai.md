---
summary: "OpenClaw에서 API 키 또는 Codex 구독으로 OpenAI 사용하기"
read_when:
  - OpenClaw에서 OpenAI 모델을 사용하고 싶을 때
  - API 키 대신 Codex 구독 인증을 쓰고 싶을 때
title: "OpenAI"
x-i18n:
  source_path: "providers/openai.md"
---

# OpenAI

OpenAI는 GPT 모델용 개발자 API를 제공합니다. Codex는 구독 기반 액세스를 위한
**ChatGPT 로그인**과 사용량 기반 액세스를 위한 **API 키 로그인**을 지원합니다.
Codex cloud는 ChatGPT 로그인이 필요합니다. OpenAI는 OpenClaw 같은 외부 도구/워크플로우에서
구독 OAuth를 사용하는 방식을 명시적으로 지원합니다.

## Option A: OpenAI API key (OpenAI Platform)

**Best for:** 직접 API에 접근하고 사용량 기반으로 과금할 때.
API 키는 OpenAI 대시보드에서 발급받으세요.

### CLI setup

```bash
openclaw onboard --auth-choice openai-api-key
# or non-interactive
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Config snippet

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAI의 현재 API 모델 문서에는 직접 OpenAI API 사용용으로 `gpt-5.4`와
`gpt-5.4-pro`가 나열되어 있습니다. OpenClaw는 둘 다 `openai/*` Responses 경로로 전달합니다.

## Option B: OpenAI Code (Codex) subscription

**Best for:** API 키 대신 ChatGPT/Codex 구독 액세스를 사용할 때.
Codex cloud는 ChatGPT 로그인이 필요하고, Codex CLI는 ChatGPT 로그인 또는 API 키 로그인을 지원합니다.

### CLI setup (Codex OAuth)

```bash
# Run Codex OAuth in the wizard
openclaw onboard --auth-choice openai-codex

# Or run OAuth directly
openclaw models auth login --provider openai-codex
```

### Config snippet (Codex subscription)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

OpenAI의 현재 Codex 문서에는 현재 Codex 모델로 `gpt-5.4`가 나열되어 있습니다.
OpenClaw는 이를 ChatGPT/Codex OAuth 용도에 맞게 `openai-codex/gpt-5.4`로 매핑합니다.

### Transport default

OpenClaw는 모델 스트리밍에 `pi-ai`를 사용합니다. `openai/*`와 `openai-codex/*` 모두에서
기본 transport는 `"auto"`입니다(WebSocket 우선, 이후 SSE 폴백).

`agents.defaults.models.<provider/model>.params.transport`를 설정할 수 있습니다.

- `"sse"`: SSE 강제 사용
- `"websocket"`: WebSocket 강제 사용
- `"auto"`: WebSocket을 시도한 뒤 SSE로 폴백

`openai/*`(Responses API)의 경우 WebSocket transport를 쓸 때 OpenClaw가 기본적으로
WebSocket warm-up(`openaiWsWarmup: true`)도 활성화합니다.

관련 OpenAI 문서:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI WebSocket warm-up

OpenAI 문서는 warm-up을 선택 사항으로 설명합니다. OpenClaw는 WebSocket transport 사용 시
첫 턴 지연 시간을 줄이기 위해 `openai/*`에 기본적으로 이를 활성화합니다.

### Disable warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Enable warm-up explicitly

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAI priority processing

OpenAI API는 `service_tier=priority`를 통해 priority processing을 노출합니다.
OpenClaw에서는 `agents.defaults.models["openai/<model>"].params.serviceTier`를 설정해
직접 `openai/*` Responses 요청에 그 값을 전달합니다.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

지원되는 값은 `auto`, `default`, `flex`, `priority`입니다.

### OpenAI Responses server-side compaction

직접 OpenAI Responses 모델(`api.openai.com`의 `baseUrl`과 `api: "openai-responses"`를 쓰는
`openai/*`)에서는 OpenClaw가 이제 OpenAI 서버 측 compaction payload hint를 자동으로 활성화합니다.

- `store: true`를 강제합니다(model compat에서 `supportsStore: false`를 지정하지 않은 경우).
- `context_management: [{ type: "compaction", compact_threshold: ... }]`를 주입합니다.

기본적으로 `compact_threshold`는 모델 `contextWindow`의 `70%`이며, 값을 알 수 없으면
`80000`을 사용합니다.

### Enable server-side compaction explicitly

호환되는 Responses 모델(예: Azure OpenAI Responses)에 `context_management` 주입을 강제로 적용하려면
다음과 같이 설정하세요.

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Enable with a custom threshold

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Disable server-side compaction

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction`은 `context_management` 주입만 제어합니다.
직접 OpenAI Responses 모델은 compat에서 `supportsStore: false`를 지정하지 않는 한
여전히 `store: true`를 강제합니다.

## Notes

- 모델 ref는 항상 `provider/model` 형식을 사용합니다([/concepts/models](/concepts/models) 참고).
- 인증 세부 사항과 재사용 규칙은 [/concepts/oauth](/concepts/oauth)에 있습니다.
