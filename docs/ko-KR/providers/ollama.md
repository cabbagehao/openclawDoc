---
summary: "OpenClaw를 Ollama(로컬 LLM 런타임)와 함께 실행하기"
read_when:
  - Ollama를 통해 로컬 모델로 OpenClaw를 실행하고 싶을 때
  - Ollama 설정과 구성 가이드가 필요할 때
title: "Ollama"
x-i18n:
  source_path: "providers/ollama.md"
---

# Ollama

Ollama는 머신에서 오픈소스 모델을 쉽게 실행할 수 있게 해 주는 로컬 LLM 런타임입니다.
OpenClaw는 Ollama의 네이티브 API(`/api/chat`)와 통합되어 스트리밍과 tool calling을 지원하며,
`OLLAMA_API_KEY`(또는 auth profile)를 사용하고 명시적인 `models.providers.ollama` 항목을
정의하지 않으면 **tool-capable 모델을 자동 탐지**할 수 있습니다.

<Warning>
**원격 Ollama 사용자**: OpenClaw와 함께 `/v1` OpenAI 호환 URL(`http://host:11434/v1`)을 사용하지 마세요.
이렇게 하면 tool calling이 깨지고 모델이 원시 tool JSON을 일반 텍스트로 출력할 수 있습니다.
대신 네이티브 Ollama API URL을 사용하세요: `baseUrl: "http://host:11434"` (`/v1` 없음).
</Warning>

## Quick start

1. Ollama를 설치합니다: [https://ollama.ai](https://ollama.ai)

2. 모델을 가져옵니다.

```bash
ollama pull gpt-oss:20b
# or
ollama pull llama3.3
# or
ollama pull qwen2.5-coder:32b
# or
ollama pull deepseek-r1:32b
```

3. OpenClaw에서 Ollama를 활성화합니다(아무 값이나 가능, Ollama는 실제 키를 요구하지 않음).

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Or configure in your config file
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

4. Ollama 모델을 사용합니다.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gpt-oss:20b" },
    },
  },
}
```

## Model discovery (implicit provider)

`OLLAMA_API_KEY`(또는 auth profile)를 설정하고 `models.providers.ollama`를 **정의하지 않으면**,
OpenClaw는 `http://127.0.0.1:11434`의 로컬 Ollama 인스턴스에서 모델을 탐지합니다.

- `/api/tags`와 `/api/show`를 조회합니다.
- `tools` capability를 보고하는 모델만 유지합니다.
- 모델이 `thinking`을 보고하면 `reasoning`으로 표시합니다.
- 가능하면 `model_info["<arch>.context_length"]`에서 `contextWindow`를 읽습니다.
- `maxTokens`는 context window의 10배로 설정합니다.
- 모든 비용은 `0`으로 설정합니다.

이 방식은 수동 모델 등록 없이도 카탈로그를 Ollama의 실제 capability와 맞춰 줍니다.

사용 가능한 모델을 확인하려면:

```bash
ollama list
openclaw models list
```

새 모델을 추가하려면 Ollama로 그냥 pull 하세요.

```bash
ollama pull mistral
```

새 모델은 자동으로 탐지되어 바로 사용할 수 있습니다.

`models.providers.ollama`를 명시적으로 설정하면 자동 탐지는 건너뛰며, 모델을 직접 정의해야 합니다
(아래 참고).

## Configuration

### Basic setup (implicit discovery)

Ollama를 활성화하는 가장 단순한 방법은 환경 변수를 쓰는 것입니다.

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Explicit setup (manual models)

다음과 같은 경우에는 명시적 설정을 사용하세요.

- Ollama가 다른 호스트/포트에서 실행될 때
- 특정 context window나 모델 목록을 강제하고 싶을 때
- tool support를 보고하지 않는 모델도 포함하고 싶을 때

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

`OLLAMA_API_KEY`가 설정되어 있다면 provider 항목에서 `apiKey`를 생략해도 OpenClaw가
가용성 확인용으로 자동 채웁니다.

### Custom base URL (explicit config)

Ollama가 다른 호스트나 포트에서 실행 중이라면(명시적 설정은 auto-discovery를 끄므로 모델을 수동 정의해야 함)
다음과 같이 설정하세요.

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
        api: "ollama", // Set explicitly to guarantee native tool-calling behavior
      },
    },
  },
}
```

<Warning>
URL에 `/v1`을 붙이지 마세요. `/v1` 경로는 OpenAI 호환 모드를 사용하므로 tool calling이 안정적이지 않습니다.
경로 접미사 없는 기본 Ollama URL을 사용하세요.
</Warning>

### Model selection

구성이 끝나면 모든 Ollama 모델을 사용할 수 있습니다.

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

## Advanced

### Reasoning models

OpenClaw는 `/api/show`에서 Ollama가 `thinking`을 보고하면 해당 모델을 reasoning-capable로 표시합니다.

```bash
ollama pull deepseek-r1:32b
```

### Model Costs

Ollama는 무료이며 로컬에서 실행되므로 모든 모델 비용은 $0으로 설정됩니다.

### Streaming Configuration

OpenClaw의 Ollama 통합은 기본적으로 **네이티브 Ollama API**(`/api/chat`)를 사용하며,
스트리밍과 tool calling을 동시에 완전히 지원합니다. 별도 설정은 필요 없습니다.

#### Legacy OpenAI-Compatible Mode

<Warning>
**OpenAI 호환 모드에서는 tool calling이 안정적이지 않습니다.** 프록시 때문에 OpenAI 포맷이 꼭 필요하고
네이티브 tool calling 동작에 의존하지 않을 때만 이 모드를 사용하세요.
</Warning>

OpenAI 호환 엔드포인트를 대신 사용해야 한다면(예: OpenAI 포맷만 지원하는 프록시 뒤에 있을 때)
`api: "openai-completions"`를 명시적으로 설정하세요.

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

이 모드는 스트리밍과 tool calling을 동시에 지원하지 못할 수 있습니다. 모델 설정의
`params: { streaming: false }`로 스트리밍을 꺼야 할 수도 있습니다.

Ollama에 `api: "openai-completions"`를 사용할 때 OpenClaw는 기본적으로 `options.num_ctx`를 주입해
Ollama가 조용히 4096 context window로 되돌아가지 않도록 합니다. 프록시/업스트림이 알 수 없는
`options` 필드를 거부한다면 이 동작을 끄세요.

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

### Context windows

자동 탐지된 모델의 경우 OpenClaw는 가능하면 Ollama가 보고한 context window를 사용하고,
없으면 기본값 `8192`를 사용합니다. 명시적 provider 설정에서는 `contextWindow`와 `maxTokens`를
직접 재정의할 수 있습니다.

## Troubleshooting

### Ollama not detected

Ollama가 실행 중인지, `OLLAMA_API_KEY`(또는 auth profile)를 설정했는지, 그리고
명시적 `models.providers.ollama` 항목을 **정의하지 않았는지** 확인하세요.

```bash
ollama serve
```

API에 접근 가능한지도 확인하세요.

```bash
curl http://localhost:11434/api/tags
```

### No models available

OpenClaw는 tool support를 보고하는 모델만 자동 탐지합니다. 모델이 목록에 없다면 다음 중 하나를 하세요.

- tool-capable 모델을 pull 하거나
- `models.providers.ollama`에 모델을 명시적으로 정의하세요.

모델을 추가하려면:

```bash
ollama list  # See what's installed
ollama pull gpt-oss:20b  # Pull a tool-capable model
ollama pull llama3.3     # Or another model
```

### Connection refused

Ollama가 올바른 포트에서 실행 중인지 확인하세요.

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

## See Also

- [Model Providers](/concepts/model-providers) - 모든 제공업체 개요
- [Model Selection](/concepts/models) - 모델 선택 방법
- [Configuration](/gateway/configuration) - 전체 설정 레퍼런스
