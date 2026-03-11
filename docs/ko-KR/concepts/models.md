---
summary: "모델 CLI: 목록, 설정, 별칭, 폴백, 스캔, 상태"
read_when:
  - 모델 CLI(models list/set/scan/aliases/fallbacks)를 추가하거나 수정할 때
  - 모델 폴백 동작이나 선택 UX를 변경할 때
  - 모델 스캔 프로브(도구/이미지)를 업데이트할 때
title: "모델 CLI"
---

# 모델 CLI

인증 프로필 회전, 쿨다운, 그리고 그것이 폴백과 어떻게 상호작용하는지는
[/concepts/model-failover](/concepts/model-failover)를 참고하세요.
프로바이더 개요와 예시는 [/concepts/model-providers](/concepts/model-providers)에서 볼 수 있습니다.

## 모델 선택이 작동하는 방식

OpenClaw는 다음 순서로 모델을 선택합니다.

1. **기본(primary)** 모델(`agents.defaults.model.primary` 또는 `agents.defaults.model`)
2. `agents.defaults.model.fallbacks`의 **폴백**(순서대로)
3. 다음 모델로 넘어가기 전에 프로바이더 내부에서 **프로바이더 인증 failover** 수행

관련 항목:

- `agents.defaults.models`는 OpenClaw가 사용할 수 있는 모델의 allowlist/catalog입니다(별칭 포함).
- `agents.defaults.imageModel`은 기본 모델이 이미지를 받을 수 **없을 때만** 사용됩니다.
- 에이전트별 기본값은 `agents.list[].model`과 바인딩을 통해 `agents.defaults.model`을 재정의할 수 있습니다([/concepts/multi-agent](/concepts/multi-agent) 참고).

## 빠른 모델 정책

- 가능한 범위에서 가장 강력한 최신 세대 모델을 기본값으로 설정하세요.
- 비용/지연 시간에 민감한 작업이나 중요도가 낮은 채팅에는 폴백을 사용하세요.
- 도구 사용 에이전트나 신뢰할 수 없는 입력에는 오래되거나 약한 모델 티어를 피하세요.

## 설정 마법사(권장)

설정을 직접 손으로 편집하고 싶지 않다면 온보딩 마법사를 실행하세요.

```bash
openclaw onboard
```

이 마법사는 **OpenAI Code (Codex) 구독**(OAuth)과 **Anthropic**(API 키 또는 `claude setup-token`)을 포함한 일반적인 프로바이더의 모델 + 인증을 설정할 수 있습니다.

## 설정 키(개요)

- `agents.defaults.model.primary` 및 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 및 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models` (allowlist + 별칭 + provider params)
- `models.providers` (`models.json`에 기록되는 사용자 정의 프로바이더)

모델 ref는 소문자로 정규화됩니다. `z.ai/*` 같은 프로바이더 별칭은
`zai/*`로 정규화됩니다.

OpenCode Zen을 포함한 프로바이더 설정 예시는
[/gateway/configuration](/gateway/configuration#opencode-zen-multi-model-proxy)에 있습니다.

## "Model is not allowed"가 뜨고 응답이 멈추는 이유

`agents.defaults.models`가 설정되어 있으면 `/model`과 세션 재정의에 대한 **allowlist**가 됩니다. 사용자가 그 allowlist에 없는 모델을 선택하면 OpenClaw는 다음을 반환합니다.

```
Model "provider/model" is not allowed. Use /model to list available models.
```

이것은 일반 응답이 생성되기 **전에** 발생하므로, 메시지에 "응답하지 않은 것처럼" 느껴질 수 있습니다. 해결 방법은 다음 중 하나입니다.

- 모델을 `agents.defaults.models`에 추가
- allowlist를 비우기(`agents.defaults.models` 제거)
- `/model list`에서 모델 선택

allowlist 설정 예시:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## 채팅에서 모델 전환(`/model`)

재시작 없이 현재 세션의 모델을 전환할 수 있습니다.

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

참고:

- `/model`(및 `/model list`)은 간결한 번호 선택기입니다(모델 패밀리 + 사용 가능한 프로바이더).
- Discord에서는 `/model`과 `/models`가 프로바이더/모델 드롭다운과 Submit 단계를 가진 인터랙티브 선택기를 엽니다.
- `/model <#>`는 그 선택기의 번호를 선택합니다.
- `/model status`는 자세한 보기입니다(인증 후보와, 설정된 경우 provider endpoint의 `baseUrl` + `api` 모드).
- 모델 ref는 **첫 번째** `/`를 기준으로 나누어 파싱합니다. `/model <ref>`를 입력할 때는 `provider/model`을 사용하세요.
- 모델 ID 자체에 `/`가 포함되어 있으면(OpenRouter 스타일), provider 접두사를 반드시 포함해야 합니다(예: `/model openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 입력을 별칭 또는 **기본 provider**의 모델로 취급합니다(모델 ID에 `/`가 없을 때만 동작).

전체 명령 동작/설정: [슬래시 명령](/tools/slash-commands).

## CLI 명령

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`(서브커맨드 없음)는 `models status`의 단축 명령입니다.

### `models list`

기본적으로 설정된 모델을 보여줍니다. 유용한 플래그:

- `--all`: 전체 카탈로그
- `--local`: 로컬 프로바이더만
- `--provider <name>`: 프로바이더로 필터링
- `--plain`: 한 줄에 모델 하나
- `--json`: 기계 판독 가능 출력

### `models status`

해석된 기본 모델, 폴백, 이미지 모델, 그리고 설정된 프로바이더의 인증 개요를 보여줍니다. 또한 인증 저장소에서 찾은 프로필의 OAuth 만료 상태도 표면화합니다(기본적으로 24시간 이내 만료 경고). `--plain`은 해석된 기본 모델만 출력합니다.
OAuth 상태는 항상 표시되며(`--json` 출력에도 포함), 설정된 프로바이더에 자격 증명이 없으면 `models status`는 **Missing auth** 섹션을 출력합니다.
JSON에는 `auth.oauth`(경고 윈도우 + 프로필)와 `auth.providers`
(프로바이더별 유효 인증)가 포함됩니다.
자동화를 위해 `--check`를 사용하세요(누락/만료 시 종료 코드 `1`, 곧 만료 시 `2`).

인증 선택은 프로바이더/계정에 따라 달라집니다. 항상 켜져 있는 게이트웨이 호스트에서는 보통 API 키가 가장 예측 가능하고, 구독 토큰 흐름도 지원됩니다.

예시(Anthropic setup-token):

```bash
claude setup-token
openclaw models status
```

## 스캔(OpenRouter 무료 모델)

`openclaw models scan`은 OpenRouter의 **무료 모델 카탈로그**를 점검하고,
선택적으로 모델의 도구/이미지 지원을 프로빙할 수 있습니다.

주요 플래그:

- `--no-probe`: 라이브 프로브 건너뛰기(메타데이터만)
- `--min-params <b>`: 최소 파라미터 수(십억 단위)
- `--max-age-days <days>`: 오래된 모델 건너뛰기
- `--provider <name>`: 프로바이더 접두사 필터
- `--max-candidates <n>`: 폴백 목록 크기
- `--set-default`: `agents.defaults.model.primary`를 첫 선택으로 설정
- `--set-image`: `agents.defaults.imageModel.primary`를 첫 이미지 선택으로 설정

프로빙에는 OpenRouter API 키(인증 프로필 또는 `OPENROUTER_API_KEY`)가 필요합니다. 키가 없으면 `--no-probe`로 후보만 나열하세요.

스캔 결과는 다음 순서로 정렬됩니다.

1. 이미지 지원
2. 도구 지연 시간
3. 컨텍스트 크기
4. 파라미터 수

입력

- OpenRouter `/models` 목록(필터 `:free`)
- 인증 프로필 또는 `OPENROUTER_API_KEY`의 OpenRouter API 키 필요([/environment](/help/environment) 참고)
- 선택 필터: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- 프로브 제어: `--timeout`, `--concurrency`

TTY에서 실행하면 폴백을 대화형으로 선택할 수 있습니다. 비대화형 모드에서는 `--yes`를 넘겨 기본값을 수락하세요.

## 모델 레지스트리(`models.json`)

`models.providers`의 사용자 정의 프로바이더는 에이전트 디렉터리 아래의
`models.json`(기본 `~/.openclaw/agents/<agentId>/models.json`)에 기록됩니다. 이 파일은 `models.mode`가 `replace`로 설정되지 않는 한 기본적으로 merge됩니다.

같은 provider ID가 있을 때 merge 모드 우선순위:

- 에이전트 `models.json`에 이미 존재하는 비어 있지 않은 `baseUrl`이 우선합니다.
- 에이전트 `models.json`의 비어 있지 않은 `apiKey`는, 해당 provider가 현재 config/auth-profile 컨텍스트에서 SecretRef-managed가 아닐 때만 우선합니다.
- SecretRef-managed provider의 `apiKey` 값은 해석된 비밀을 저장하는 대신 원본 마커(`ENV_VAR_NAME` for env refs, `secretref-managed` for file/exec refs)에서 새로 고칩니다.
- 비어 있거나 없는 에이전트 `apiKey`/`baseUrl`은 config `models.providers`로 폴백합니다.
- 다른 provider 필드는 설정과 정규화된 카탈로그 데이터에서 새로 고쳐집니다.

이 마커 기반 영속화는 `openclaw agent` 같은 명령 기반 경로를 포함해, OpenClaw가 `models.json`을 재생성할 때마다 적용됩니다.
