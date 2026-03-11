---
summary: "OpenClaw 에서 NVIDIA 의 OpenAI 호환 API 사용하기"
read_when:
  - OpenClaw 에서 NVIDIA 모델을 사용하고 싶을 때
  - NVIDIA_API_KEY 설정이 필요할 때
title: "NVIDIA"
---

# NVIDIA

NVIDIA 는 `https://integrate.api.nvidia.com/v1` 에서 Nemotron 및 NeMo 모델용 OpenAI 호환 API 를 제공합니다. [NVIDIA NGC](https://catalog.ngc.nvidia.com/) 의 API key 로 인증하세요.

## CLI 설정

키를 한 번 export 한 뒤, onboarding 을 실행하고 NVIDIA 모델을 설정합니다.

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

여전히 `--token` 을 전달한다면 셸 히스토리와 `ps` 출력에 남는다는 점을 기억하세요. 가능하면 env var 를 우선하세요.

## Config snippet

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## Model IDs

- `nvidia/llama-3.1-nemotron-70b-instruct` (기본값)
- `meta/llama-3.3-70b-instruct`
- `nvidia/mistral-nemo-minitron-8b-8k-instruct`

## 메모

- OpenAI 호환 `/v1` 엔드포인트이며, NVIDIA NGC 의 API key 를 사용합니다.
- `NVIDIA_API_KEY` 가 설정되면 provider 가 자동 활성화되며, 정적 기본값(131,072 토큰 컨텍스트 창, 4,096 최대 토큰)을 사용합니다.
