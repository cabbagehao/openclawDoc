---
summary: "Together AI 설정(auth + 모델 선택)"
description: "Together AI 설정(auth + 모델 선택)"
read_when:
  - OpenClaw 에서 Together AI 를 사용하고 싶을 때
  - API 키 env var 또는 CLI auth choice 가 필요할 때
---

# Together AI

[Together AI](https://together.ai) 는 Llama, DeepSeek, Kimi 등 주요 오픈소스 모델에 접근할 수 있는 통합 API 를 제공합니다.

- provider: `together`
- 인증: `TOGETHER_API_KEY`
- API: OpenAI 호환

## 빠른 시작

1. API 키 를 설정합니다(권장: Gateway 용으로 저장):

```bash
openclaw onboard --auth-choice together-api-key
```

2. 기본 모델을 설정합니다:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

이렇게 하면 `together/moonshotai/Kimi-K2.5` 가 기본 모델로 설정됩니다.

## 환경 메모

Gateway 가 daemon(launchd/systemd)으로 실행된다면, `TOGETHER_API_KEY` 가
그 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는
`env.shellEnv` 를 통해).

## 사용 가능한 모델

Together AI 는 많은 인기 오픈소스 모델에 접근을 제공합니다:

- **GLM 4.7 Fp8** - 200K context window 를 가진 기본 모델
- **Llama 3.3 70B Instruct Turbo** - 빠르고 효율적인 instruction following
- **Llama 4 Scout** - 이미지 이해 기능이 있는 vision 모델
- **Llama 4 Maverick** - 고급 vision 및 reasoning
- **DeepSeek V3.1** - 강력한 코딩 및 reasoning 모델
- **DeepSeek R1** - 고급 reasoning 모델
- **Kimi K2 Instruct** - 262K context window 를 가진 고성능 모델

모든 모델은 표준 chat completions 를 지원하며 OpenAI API 와 호환됩니다.
