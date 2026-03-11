---
summary: "테스트 스위트, Docker runner, 그리고 각 테스트가 무엇을 검증하는지 정리한 가이드"
read_when:
  - 로컬 또는 CI에서 테스트를 실행할 때
  - model/provider 버그에 대한 회귀 테스트를 추가할 때
  - gateway와 agent 동작을 디버깅할 때
title: "테스트"
x-i18n:
  source_path: "help/testing.md"
---

# 테스트

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker runner가 있습니다.

이 문서는 "우리가 어떻게 테스트하는가"에 대한 가이드입니다.

- 각 스위트가 무엇을 검증하는지, 그리고 의도적으로 무엇을 검증하지 않는지
- 일반적인 워크플로(local, pre-push, debugging)마다 어떤 명령을 실행해야 하는지
- live 테스트가 credentials를 어떻게 찾고 model/provider를 어떻게 선택하는지
- 실제 model/provider 이슈에 대한 회귀 테스트를 어떻게 추가하는지

## 빠른 시작

대부분의 날에는 다음이면 충분합니다.

- 전체 게이트. push 전 기대값: `pnpm build && pnpm check && pnpm test`

테스트를 건드렸거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 provider/model을 디버깅할 때. 실제 credentials 필요:

- Live 스위트(model + gateway tool/image probe): `pnpm test:live`

팁: 실패 사례 하나만 보면 될 때는 아래의 allowlist 환경 변수로 live 테스트 범위를 좁히는 편이 낫습니다.

## 테스트 스위트(무엇이 어디서 실행되는가)

각 스위트는 "현실성이 점점 높아지는 단계"라고 생각하면 됩니다. 동시에 flakiness와 비용도 함께 늘어납니다.

### Unit / integration(기본)

- 명령: `pnpm test`
- 설정: `scripts/test-parallel.mjs` (`vitest.unit.config.ts`, `vitest.extensions.config.ts`, `vitest.gateway.config.ts` 실행)
- 파일: `src/**/*.test.ts`, `extensions/**/*.test.ts`
- 범위:
  - 순수 unit 테스트
  - 프로세스 내부 integration 테스트(gateway auth, routing, tooling, parsing, config)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대값:
  - CI에서 실행됨
  - 실제 키 불필요
  - 빠르고 안정적이어야 함
- Pool 참고:
  - OpenClaw는 Node 22/23에서 더 빠른 unit shard를 위해 Vitest `vmForks`를 사용합니다.
  - Node 24 이상에서는 Node VM linking 오류(`ERR_VM_MODULE_LINK_FAILURE` / `module is already linked`)를 피하기 위해 자동으로 일반 `forks`로 폴백합니다.
  - 수동 재정의: `OPENCLAW_TEST_VM_FORKS=0`이면 `forks` 강제, `OPENCLAW_TEST_VM_FORKS=1`이면 `vmForks` 강제

### E2E(gateway smoke)

- 명령: `pnpm test:e2e`
- 설정: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`
- 런타임 기본값:
  - 파일 시작 속도를 높이기 위해 Vitest `vmForks` 사용
  - 적응형 workers 사용(CI: 2-4, 로컬: 4-8)
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent mode 실행
- 유용한 재정의:
  - `OPENCLAW_E2E_WORKERS=<n>`: worker 수 강제. 최대 16
  - `OPENCLAW_E2E_VERBOSE=1`: 자세한 콘솔 출력 다시 활성화
- 범위:
  - 다중 인스턴스 gateway의 end-to-end 동작
  - WebSocket/HTTP 표면, node pairing, 더 무거운 네트워킹
- 기대값:
  - 파이프라인에서 활성화된 경우 CI에서 실행
  - 실제 키 불필요
  - unit 테스트보다 움직이는 부품이 많아 더 느릴 수 있음

### Live(실제 provider + 실제 model)

- 명령: `pnpm test:live`
- 설정: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`
- 기본값: `pnpm test:live`가 **활성화**합니다. `OPENCLAW_LIVE_TEST=1` 설정
- 범위:
  - "오늘 이 provider/model이 실제 credentials로 정말 동작하는가?"
  - provider 포맷 변경, tool-calling 특이점, auth 문제, rate limit 동작 포착
- 기대값:
  - 설계상 CI에서 안정적이지 않음. 실제 네트워크, 실제 provider 정책, quota, outage가 개입
  - 비용이 들고 rate limit을 소모함
  - "전부 실행"보다 범위를 좁힌 실행을 권장
  - live 실행은 누락된 API 키를 찾기 위해 `~/.profile`을 source함
- API 키 회전(provider별):
  - `*_API_KEYS`에 comma/semicolon 형식, 또는 `*_API_KEY_1`, `*_API_KEY_2`를 설정합니다.
    예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`
  - 또는 live 전용 재정의 `OPENCLAW_LIVE_*_KEY`
  - 테스트는 rate limit 응답 시 재시도합니다.

## 어떤 스위트를 실행해야 하나요?

다음 표처럼 판단하세요.

- 로직/테스트 수정: `pnpm test` 실행. 변경이 많다면 `pnpm test:coverage`도 추가
- gateway 네트워킹 / WS 프로토콜 / pairing 수정: `pnpm test:e2e` 추가
- "봇이 죽었다", provider별 실패, tool calling 디버깅: 범위를 좁힌 `pnpm test:live`

## Live: Android node capability sweep

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android node가 현재 광고하는 **모든 명령**을 호출하고, 명령 계약 동작을 검증
- 범위:
  - 사전 준비가 필요한 수동 설정. 이 스위트는 앱 설치/실행/pairing을 하지 않음
  - 선택한 Android node에 대해 명령별 gateway `node.invoke` 검증
- 필수 사전 준비:
  - Android 앱이 이미 gateway에 연결 및 paired 상태
  - 앱을 foreground에 유지
  - 통과시키고 싶은 capability에 필요한 permission/capture consent 허용
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- 전체 Android 설정은 [Android App](/platforms/android) 참고

## Live: model smoke(profile keys)

live 테스트는 실패 지점을 분리하기 위해 두 계층으로 나뉩니다.

- "Direct model"은 주어진 키로 provider/model이 최소한 응답하는지 알려줍니다.
- "Gateway smoke"는 같은 model에 대해 gateway+agent 전체 파이프라인(세션, 히스토리, 도구, sandbox 정책 등)이 동작하는지 알려줍니다.

### Layer 1: Direct model completion(no gateway)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델 나열
  - `getApiKeyForModel`을 사용해 credentials가 있는 모델 선택
  - 모델당 작은 completion 실행. 필요한 경우 타깃 회귀 테스트도 포함
- 활성화 방법:
  - `pnpm test:live` 또는 Vitest를 직접 부를 때 `OPENCLAW_LIVE_TEST=1`
- 이 스위트를 실제로 돌리려면 `OPENCLAW_LIVE_MODELS=modern` 또는 `all`을 설정해야 합니다.
  그렇지 않으면 `pnpm test:live`의 초점을 gateway smoke에 맞추기 위해 skip됩니다.
- 모델 선택 방법:
  - `OPENCLAW_LIVE_MODELS=modern`: modern allowlist 실행. Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4
  - `OPENCLAW_LIVE_MODELS=all`: modern allowlist의 alias
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."`처럼 comma allowlist
- provider 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`처럼 comma allowlist
- 키 출처:
  - 기본: profile store + env fallback
  - **profile store 전용**으로 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- 존재 이유:
  - "provider API가 깨졌는가 / 키가 잘못됐는가"와 "gateway agent 파이프라인이 깨졌는가"를 분리
  - 작고 고립된 회귀를 담기 위함. 예: OpenAI Responses/Codex Responses reasoning replay + tool-call 흐름

### Layer 2: Gateway + dev agent smoke("`@openclaw`가 실제로 하는 일")

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 프로세스 내부 gateway를 띄움
  - `agent:dev:*` 세션을 생성/패치. 실행마다 model override 적용
  - 키가 있는 모델을 순회하며 다음을 검증
    - "의미 있는" 응답(도구 없음)
    - 실제 도구 호출 성공(read probe)
    - 선택적 추가 도구 probe 성공(exec+read probe)
    - OpenAI 회귀 경로(tool-call-only → follow-up)가 계속 동작
- Probe 세부 사항:
  - `read` probe: 테스트가 workspace에 nonce 파일을 쓰고, agent에게 이를 `read`해서 nonce를 되돌려 달라고 요청
  - `exec+read` probe: agent에게 `exec`로 임시 파일에 nonce를 쓰게 한 뒤, 다시 `read`하게 요청
  - image probe: 생성한 PNG(cat + 랜덤 코드)를 첨부하고 model이 `cat <CODE>`를 반환하는지 확인
  - 구현 참조: `src/gateway/gateway-models.profiles.live.test.ts`, `src/gateway/live-image-probe.ts`
- 활성화 방법:
  - `pnpm test:live` 또는 Vitest를 직접 부를 때 `OPENCLAW_LIVE_TEST=1`
- 모델 선택 방법:
  - 기본: modern allowlist(Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.5, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`: modern allowlist alias
  - 또는 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`이나 comma list로 축소
- provider 선택 방법. "OpenRouter 전부"를 피하려면:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`
- 이 live 테스트에서는 tool + image probe가 항상 활성화됩니다.
  - `read` probe + `exec+read` probe(도구 스트레스)
  - model이 image input 지원을 광고하면 image probe 실행
  - 고수준 흐름:
    - 테스트가 `src/gateway/live-image-probe.ts`로 "CAT" + 랜덤 코드를 넣은 작은 PNG 생성
    - 이를 `agent`에 `attachments: [{ mimeType: "image/png", content: "<base64>" }]`로 전송
    - Gateway가 첨부를 `images[]`로 파싱. `src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`
    - 내장 agent가 멀티모달 사용자 메시지를 model로 전달
    - 검증: 응답에 `cat` + 코드가 포함됨. OCR 오차로 인한 경미한 실수는 허용

머신에서 무엇을 테스트할 수 있는지, 그리고 정확한 `provider/model` ID를 확인하려면 다음을 실행하세요.

```bash
openclaw models list
openclaw models list --json
```

## Live: Anthropic setup-token smoke

- 테스트: `src/agents/anthropic.setup-token.live.test.ts`
- 목표: Claude Code CLI setup-token 또는 붙여넣은 setup-token profile이 Anthropic 프롬프트를 정상 처리하는지 검증
- 활성화:
  - `pnpm test:live` 또는 Vitest 직접 실행 시 `OPENCLAW_LIVE_TEST=1`
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- 토큰 출처. 하나 선택:
  - Profile: `OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - Raw token: `OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- 모델 재정의(선택):
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

설정 예시:

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## Live: CLI backend smoke(Claude Code CLI 또는 다른 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 config를 건드리지 않고 로컬 CLI backend로 Gateway + agent 파이프라인을 검증
- 활성화:
  - `pnpm test:live` 또는 Vitest 직접 실행 시 `OPENCLAW_LIVE_TEST=1`
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - Model: `claude-cli/claude-sonnet-4-6`
  - Command: `claude`
  - Args: `["-p","--output-format","json","--permission-mode","bypassPermissions"]`
- 재정의(선택):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`로 실제 이미지 첨부 전송. 경로는 프롬프트에 주입됨
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`로 프롬프트 주입 대신 CLI 인자로 이미지 파일 경로 전달
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` 또는 `"list"`로 `IMAGE_ARG` 사용 시 전달 방식 제어
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`로 두 번째 turn을 보내 resume 흐름 검증
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`이면 Claude Code CLI MCP config를 유지합니다. 기본값은 임시 빈 파일로 MCP config를 비활성화

예시:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### 권장 live 레시피

좁고 명시적인 allowlist가 가장 빠르고 가장 덜 flaky합니다.

- 단일 모델, direct(no gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 provider에 걸친 tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 중심(Gemini API key + Antigravity):
  - Gemini(API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API를 사용합니다. API key 방식
- `google-antigravity/...`는 Antigravity OAuth bridge를 사용합니다. Cloud Code Assist 스타일 agent endpoint
- `google-gemini-cli/...`는 로컬 머신의 Gemini CLI를 사용합니다. 별도의 auth 및 tooling 특성이 있습니다.
- Gemini API와 Gemini CLI의 차이:
  - API: OpenClaw가 Google의 호스팅 Gemini API를 HTTP로 호출합니다. API key 또는 profile auth 사용. 일반적으로 사용자가 말하는 "Gemini"는 이것입니다.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리를 셸 실행합니다. 자체 auth가 있고 streaming/tool support/version skew 면에서 다르게 동작할 수 있습니다.

## Live: model matrix(무엇을 커버하는가)

고정된 "CI model list"는 없습니다. live는 opt-in입니다. 하지만 개발 머신에서 키를 가지고 정기적으로 점검할 **권장 모델 세트**는 있습니다.

### Modern smoke set(tool calling + image)

이것이 우리가 계속 동작하기를 기대하는 "일반 모델" 묶음입니다.

- OpenAI(non-Codex): `openai/gpt-5.2`(선택적으로 `openai/gpt-5.1`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` 또는 `anthropic/claude-sonnet-4-5`
- Google(Gemini API): `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`. 구형 Gemini 2.x는 피함
- Google(Antigravity): `google-antigravity/claude-opus-4-6-thinking`, `google-antigravity/gemini-3-flash`
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

도구 + 이미지가 포함된 gateway smoke 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling(Read + optional Exec)

provider 계열마다 최소 하나는 고르세요.

- OpenAI: `openai/gpt-5.2` 또는 `openai/gpt-5-mini`
- Anthropic: `anthropic/claude-opus-4-6` 또는 `anthropic/claude-sonnet-4-5`
- Google: `google/gemini-3-flash-preview` 또는 `google/gemini-3.1-pro-preview`
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.5`

선택적 추가 커버리지:

- xAI: `xai/grok-4` 또는 최신 모델
- Mistral: `mistral/...` 중 tools 지원 모델 하나
- Cerebras: `cerebras/...` 접근 권한이 있을 때
- LM Studio: `lmstudio/...` 로컬. tool calling은 API 모드에 따라 달라짐

### Vision: image send(attachment → multimodal message)

`OPENCLAW_LIVE_GATEWAY_MODELS`에 최소 하나의 이미지 지원 모델을 포함하세요. Claude/Gemini/OpenAI의 vision 지원 변형 등. 그래야 image probe가 실행됩니다.

### Aggregator / 대체 gateway

키가 활성화되어 있다면 다음 경로도 테스트할 수 있습니다.

- OpenRouter: `openrouter/...`. 수백 개의 모델. `openclaw models scan`으로 tool+image 지원 후보 탐색
- OpenCode Zen: `opencode/...`. 인증은 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`

live matrix에 넣을 수 있는 추가 provider:

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 경유(custom endpoint): `minimax`(cloud/API)와 OpenAI/Anthropic 호환 proxy 전반. LM Studio, vLLM, LiteLLM 등

팁: 문서에 "all models"를 하드코딩하지 마세요. 권위 있는 목록은 결국 현재 머신의 `discoverModels(...)` 결과와 사용 가능한 키 조합입니다.

## Credentials(절대 커밋 금지)

live 테스트는 CLI와 같은 방식으로 credentials를 찾습니다. 실무적으로는 다음 뜻입니다.

- CLI가 동작하면 live 테스트도 같은 키를 찾아야 합니다.
- live 테스트가 "no creds"라고 하면 `openclaw models list`나 모델 선택 문제를 디버깅하듯이 점검하면 됩니다.

- Profile store: `~/.openclaw/credentials/`. 선호 경로이며, 테스트에서 말하는 "profile keys"가 이것입니다.
- Config: `~/.openclaw/openclaw.json` 또는 `OPENCLAW_CONFIG_PATH`

환경 변수 키에 의존하고 싶다면, 예를 들어 `~/.profile`에 export해 두었다면, `source ~/.profile` 후 로컬 테스트를 실행하거나 아래 Docker runner를 사용하세요. 컨테이너 안에 `~/.profile`을 마운트할 수 있습니다.

## Deepgram live(오디오 전사)

- 테스트: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 테스트: `src/agents/byteplus.live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Docker runners(선택적 "Linux에서도 동작하는가" 점검)

이 runner들은 저장소 Docker 이미지 안에서 `pnpm test:live`를 실행합니다. 로컬 config 디렉터리와 workspace를 마운트하고, 마운트된 경우 `~/.profile`도 source합니다.

- Direct models: `pnpm test:docker:live-models` 스크립트: `scripts/test-live-models-docker.sh`
- Gateway + dev agent: `pnpm test:docker:live-gateway` 스크립트: `scripts/test-live-gateway-models-docker.sh`
- Onboarding wizard(TTY, 전체 scaffolding): `pnpm test:docker:onboard` 스크립트: `scripts/e2e/onboard-docker.sh`
- Gateway networking(컨테이너 2개, WS auth + health): `pnpm test:docker:gateway-network` 스크립트: `scripts/e2e/gateway-network-docker.sh`
- Plugins(custom extension load + registry smoke): `pnpm test:docker:plugins` 스크립트: `scripts/e2e/plugins-docker.sh`

live-model Docker runner는 현재 checkout도 읽기 전용으로 bind mount하고, 컨테이너 내부 임시 workdir에 staging합니다. 덕분에 런타임 이미지는 슬림하게 유지하면서도 현재 로컬 소스/config에 대해 정확히 Vitest를 실행할 수 있습니다.

수동 ACP plain-language thread smoke(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버깅 워크플로를 위해 유지하세요. ACP thread routing 검증이 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 환경 변수:

- `OPENCLAW_CONFIG_DIR=...` 기본값: `~/.openclaw`. `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...` 기본값: `~/.openclaw/workspace`. `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...` 기본값: `~/.profile`. `/home/node/.profile`에 마운트되며 테스트 전 source됨
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 실행 범위 축소
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` credentials가 env가 아니라 profile store에서 오도록 강제

## 문서 기본 점검

문서를 수정했다면 `pnpm docs:list`로 문서 점검을 실행하세요.

## 오프라인 회귀(CI 안전)

실제 provider 없이도 "실제 파이프라인"을 검증하는 회귀들입니다.

- Gateway tool calling(mock OpenAI, 실제 gateway + agent loop): `src/gateway/gateway.test.ts` 사례: "runs a mock OpenAI tool call end-to-end via gateway agent loop"
- Gateway wizard(WS `wizard.start`/`wizard.next`, config 쓰기 + auth 강제): `src/gateway/gateway.test.ts` 사례: "runs wizard over ws and writes auth token config"

## Agent reliability evals(skills)

이미 몇 가지 CI-safe 테스트가 "agent reliability evals"처럼 동작합니다.

- 실제 gateway + agent loop를 통한 mock tool-calling. `src/gateway/gateway.test.ts`
- session wiring과 config 효과를 검증하는 end-to-end wizard 흐름. `src/gateway/gateway.test.ts`

[Skills](/tools/skills) 관점에서 아직 부족한 부분:

- **Decisioning:** 프롬프트에 skills가 나열되었을 때 agent가 올바른 skill을 선택하는가. 또는 무관한 skill을 피하는가
- **Compliance:** 사용 전에 `SKILL.md`를 읽고 요구된 단계/인자를 따르는가
- **Workflow contracts:** tool 순서, session history 이월, sandbox 경계를 검증하는 multi-turn 시나리오

향후 eval은 우선 결정적이어야 합니다.

- mock provider를 사용해 tool call + 순서, skill file 읽기, session wiring을 검증하는 시나리오 runner
- skill 중심의 작은 시나리오 스위트. 사용해야 하는 경우와 피해야 하는 경우, gating, prompt injection
- CI-safe 스위트가 자리 잡은 뒤에만 선택적으로 live eval 추가. env-gated opt-in

## 회귀 추가 가이드

live에서 발견한 provider/model 이슈를 수정했다면:

- 가능하면 CI-safe 회귀를 추가하세요. mock/stub provider 또는 정확한 request-shape 변환 포착
- 본질적으로 live 전용 이슈라면 rate limit, auth policy 등 live 테스트는 좁고 env 변수로 opt-in되게 유지하세요
- 버그를 가장 작은 계층에서 잡도록 목표를 정하세요.
  - provider request conversion/replay 버그 → direct models 테스트
  - gateway session/history/tool pipeline 버그 → gateway live smoke 또는 CI-safe gateway mock 테스트
