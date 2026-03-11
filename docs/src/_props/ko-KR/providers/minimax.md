---
summary: "OpenClaw에서 MiniMax M2.5 사용하기"
read_when:
  - OpenClaw에서 MiniMax 모델을 쓰고 싶을 때
  - MiniMax 설정 가이드가 필요할 때
title: "MiniMax"
---

# MiniMax

MiniMax는 **M2/M2.5** 모델 계열을 만드는 AI 회사입니다. 현재 코딩 중심 릴리스는 **MiniMax M2.5**(2025년 12월 23일)이며, 실제 복합 작업을 위해 설계되었습니다.

출처: [MiniMax M2.5 release note](https://www.minimax.io/news/minimax-m25)

## Model overview (M2.5)

MiniMax는 M2.5에서 다음 개선점을 강조합니다.

* 더 강한 **다국어 코딩**(Rust, Java, Go, C++, Kotlin, Objective-C, TS/JS)
* 더 나은 **웹/앱 개발** 및 미적 출력 품질(네이티브 모바일 포함)
* interleaved thinking과 통합 제약 실행을 바탕으로 한 office-style workflow용 **복합 지시 처리** 개선
* 토큰 사용량을 줄이고 반복 속도를 높이는 **더 간결한 응답**
* **tool/agent framework** 호환성과 context management 강화(Claude Code, Droid/Factory AI, Cline, Kilo Code, Roo Code, BlackBox)
* 더 높은 품질의 **대화 및 기술 문서 작성** 출력

## MiniMax M2.5 vs MiniMax M2.5 Highspeed

* **속도:** `MiniMax-M2.5-highspeed`는 MiniMax 문서의 공식 fast tier입니다.
* **비용:** MiniMax 가격표는 input 비용은 같고 highspeed의 output 비용은 더 높게 제시합니다.
* **현재 model ID:** `MiniMax-M2.5` 또는 `MiniMax-M2.5-highspeed`를 사용하세요.

## Choose a setup

### MiniMax OAuth (Coding Plan) - recommended

**적합한 경우:** API key 없이 OAuth로 MiniMax Coding Plan을 빠르게 설정하고 싶을 때

번들된 OAuth plugin을 활성화하고 인증하세요.

```bash
openclaw plugins enable minimax-portal-auth  # 이미 로드되어 있으면 생략
openclaw gateway restart  # gateway가 이미 실행 중이면 재시작
openclaw onboard --auth-choice minimax-portal
```

다음 엔드포인트를 선택하라는 프롬프트가 나옵니다.

* **Global** - 해외 사용자 (`api.minimax.io`)
* **CN** - 중국 사용자 (`api.minimaxi.com`)

자세한 내용은 [MiniMax OAuth plugin README](https://github.com/openclaw/openclaw/tree/main/extensions/minimax-portal-auth)를 참고하세요.

### MiniMax M2.5 (API key)

**적합한 경우:** Anthropic 호환 API로 hosted MiniMax를 쓸 때

CLI에서 설정:

* `openclaw configure` 실행
* **Model/auth** 선택
* **MiniMax M2.5** 선택

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.5" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
          {
            id: "MiniMax-M2.5-highspeed",
            name: "MiniMax M2.5 Highspeed",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### MiniMax M2.5 as fallback (example)

**적합한 경우:** 가장 강한 최신 세대 모델을 primary로 유지하고, 실패 시 MiniMax M2.5로 fallback하고 싶을 때
아래 예시는 Opus를 primary로 든 것입니다. 원하는 최신 primary 모델로 바꿔도 됩니다.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
    },
  },
}
```

### Optional: Local via LM Studio (manual)

**적합한 경우:** LM Studio로 로컬 추론을 돌릴 때
강력한 하드웨어(데스크톱/서버 등)에서 LM Studio 로컬 서버와 함께 MiniMax M2.5를 사용했을 때 좋은 결과를 본 적이 있습니다.

`openclaw.json`에 수동 설정:

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Configure via `openclaw configure`

JSON을 직접 수정하지 않고 대화형 설정 마법사로 MiniMax를 지정할 수 있습니다.

1. `openclaw configure` 실행
2. **Model/auth** 선택
3. **MiniMax M2.5** 선택
4. 프롬프트가 나오면 기본 모델 선택

## Configuration options

* `models.providers.minimax.baseUrl`: `https://api.minimax.io/anthropic` 권장(Anthropic 호환), `https://api.minimax.io/v1`은 OpenAI 호환 payload용 선택 사항
* `models.providers.minimax.api`: `anthropic-messages` 권장, `openai-completions`은 OpenAI 호환 payload용 선택 사항
* `models.providers.minimax.apiKey`: MiniMax API key (`MINIMAX_API_KEY`)
* `models.providers.minimax.models`: `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` 정의
* `agents.defaults.models`: allowlist에 표시할 모델 alias 지정
* `models.mode`: built-in과 함께 MiniMax를 추가하려면 `merge` 유지

## Notes

* model ref는 `minimax/<model>` 형식입니다.
* 권장 model ID: `MiniMax-M2.5`, `MiniMax-M2.5-highspeed`
* Coding Plan usage API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (coding plan key 필요)
* 정확한 비용 추적이 필요하면 `models.json`의 가격 값을 업데이트하세요.
* MiniMax Coding Plan 추천 링크(10% 할인): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb\&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb\&source=link)
* provider 규칙은 [/concepts/model-providers](/concepts/model-providers)를 참고하세요.
* 전환은 `openclaw models list`, `openclaw models set minimax/MiniMax-M2.5`로 할 수 있습니다.

## Troubleshooting

### “Unknown model: minimax/MiniMax-M2.5”

이는 보통 **MiniMax provider가 설정되지 않았음**을 의미합니다. provider entry가 없고, MiniMax auth profile/env key도 발견되지 않은 상태입니다. 이 감지 로직 수정은 **2026.1.12**에 포함되어 있습니다(작성 시점 기준 미출시).

해결 방법:

* **2026.1.12**로 업그레이드하거나 소스 `main`에서 실행한 뒤 gateway 재시작
* `openclaw configure`를 실행해 **MiniMax M2.5** 선택
* `models.providers.minimax` block을 수동 추가
* `MINIMAX_API_KEY` 또는 MiniMax auth profile을 설정해 provider가 주입되도록 만들기

model id는 **대소문자를 구분**합니다.

* `minimax/MiniMax-M2.5`
* `minimax/MiniMax-M2.5-highspeed`

그다음 다음 명령으로 다시 확인하세요.

```bash
openclaw models list
```
