---
summary: "LLM 모델 공급자(Provider) 설정 가이드: 공급자별 인증 방식, 예시 설정 및 CLI 명령어 안내"
read_when:
  - 공급자별 모델 연동 및 설정 방법을 확인해야 할 때
  - 모델 공급자 설정을 위한 예시 구성 파일이나 CLI 온보딩 명령어가 필요할 때
title: "모델 공급자"
x-i18n:
  source_path: "concepts/model-providers.md"
---

# 모델 공급자 (Model Providers)

이 페이지는 OpenClaw에서 지원하는 **LLM 모델 공급자** 설정을 다룸. (WhatsApp이나 Telegram과 같은 채팅 채널 설정이 아님). 모델 선택 및 우선순위 규칙은 [모델 관리 가이드](/concepts/models)를 참조함.

## 핵심 규칙

* **모델 참조 방식**: `공급자/모델ID` 형식을 사용함 (예: `anthropic/claude-3-5-sonnet-latest`).
* **허용 목록**: `agents.defaults.models`를 설정하면 해당 모델들만 사용 가능한 허용 목록(Allowlist)이 됨.
* **CLI 지원 도구**: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>` 명령어를 활용함.

## API 키 자동 순환 (Rotation)

OpenClaw는 특정 공급자에 대해 여러 개의 API 키를 등록하고 자동으로 순환하여 사용하는 기능을 지원함.

* **키 등록 우선순위**:
  1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (실시간 오버라이드, 최우선 순위)
  2. `<PROVIDER>_API_KEYS` (쉼표 또는 세미콜론으로 구분된 목록)
  3. `<PROVIDER>_API_KEY` (기본 키)
  4. `<PROVIDER>_API_KEY_*` (번호가 붙은 목록, 예: `..._API_KEY_1`)
* **Google 공급자**: `GOOGLE_API_KEY` 환경 변수도 폴백(Fallback)으로 포함됨.
* **동작 방식**: 429 에러(속도 제한), 할당량 초과 등 특정 오류 발생 시에만 다음 키로 재시도함. 그 외 일반적인 에러 발생 시에는 즉시 실패 처리함.

## 기본 내장 공급자 (pi-ai 카탈로그)

별도의 `models.providers` 설정 없이 인증 정보만 등록하면 바로 사용 가능한 공급자들임.

### OpenAI

* **ID**: `openai`
* **인증**: `OPENAI_API_KEY` (순환 지원)
* **주요 모델**: `openai/gpt-4o`, `openai/gpt-4o-mini`
* **설정 팁**: 기본적으로 WebSocket 우선 연결을 시도하며, 실패 시 SSE로 전환함. `transport` 옵션으로 수동 고정 가능.

### Anthropic

* **ID**: `anthropic`
* **인증**: `ANTHROPIC_API_KEY` 또는 `claude setup-token` (순환 지원)
* **주요 모델**: `anthropic/claude-3-5-sonnet-latest`, `anthropic/claude-3-opus-latest`
* **보안 권장**: 구독 기반의 `setup-token` 방식보다는 정식 **API 키** 인증 사용을 강력히 권장함.

### OpenAI Code (Codex)

* **ID**: `openai-codex`
* **인증**: ChatGPT 계정의 OAuth 인증 정보 활용.
* **특징**: OpenClaw와 같은 외부 워크플로우 도구에서 공식적으로 지원되는 인증 경로임.

### OpenCode Zen

* **ID**: `opencode`
* **인증**: `OPENCODE_API_KEY` 사용.
* **가입 경로**: [opencode.ai](https://opencode.ai)

### Google Gemini

* **ID**: `google`
* **인증**: `GEMINI_API_KEY` (순환 지원)
* **주요 모델**: `google/gemini-1.5-pro-latest`, `google/gemini-1.5-flash-latest`

### 기타 지원 공급자

* **OpenRouter**: `openrouter` (`OPENROUTER_API_KEY`)
* **xAI (Grok)**: `xai` (`XAI_API_KEY`)
* **Mistral**: `mistral` (`MISTRAL_API_KEY`)
* **Groq**: `groq` (`GROQ_API_KEY`)
* **Hugging Face**: `huggingface` (`HF_TOKEN`) - OpenAI 호환 엔드포인트 지원.

## 커스텀 공급자 설정 (`models.providers`)

OpenAI 또는 Anthropic API 규격을 지원하는 타사 서비스나 로컬 프록시를 추가할 때 사용함.

### Moonshot AI (Kimi)

* **공급자 유형**: `openai-completions`
* **베이스 URL**: `https://api.moonshot.ai/v1`
* **모델 ID 예시**: `moonshot/kimi-k2.5`

### Ollama (로컬 실행)

Ollama는 OpenAI 호환 API를 제공하므로 별도의 키 없이 로컬 서버 연동이 가능함.

* **ID**: `ollama`
* **기본 주소**: `http://127.0.0.1:11434/v1` (자동 감지)
* **사용 방법**: `ollama pull llama3.1` 실행 후 모델 ID 지정.

### vLLM

* **ID**: `vllm`
* **기본 주소**: `http://127.0.0.1:8000/v1`
* **인증**: 서버 설정에 따라 `VLLM_API_KEY` 등록 필요.

## 설정 예시 (OpenAI 호환 커스텀 프록시)

```json5
{
  models: {
    providers: {
      myproxy: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "YOUR_KEY",
        api: "openai-completions",
        models: [
          {
            id: "custom-model-id",
            name: "My Custom Model",
            contextWindow: 128000,
            maxTokens: 4096
          }
        ]
      }
    }
  }
}
```

**주의 사항**:

* 비공식 엔드포인트를 사용하는 경우, `developer` 역할을 지원하지 않는 공급자의 400 에러를 방지하기 위해 OpenClaw가 자동으로 호환성 설정을 조정할 수 있음.
* 가급적 `contextWindow`와 `maxTokens` 값을 해당 모델의 실제 사양에 맞게 명시적으로 설정할 것을 권장함.

## CLI 활용 예시

```bash
# 온보딩 마법사를 통한 설정
openclaw onboard --auth-choice opencode-zen

# 기본 사용 모델 즉시 변경
openclaw models set anthropic/claude-3-5-sonnet-latest

# 가용 모델 목록 확인
openclaw models list
```

상세한 전체 설정 시나리오는 [Gateway 설정 예시](/gateway/configuration-examples) 참조.
