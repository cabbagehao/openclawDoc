---
summary: "모델 CLI: 목록, 설정, 별칭, 폴백, 스캔, 상태"
read_when:
  - 모델 CLI(models list/set/scan/aliases/fallbacks)를 추가하거나 수정할 때
  - 모델 폴백 동작이나 선택 UX를 변경할 때
  - 모델 스캔 프로브(도구/이미지)를 업데이트할 때
title: "모델 CLI"
---

# 모델 CLI

인증 프로필 순환(Rotation), 재사용 대기 시간(Cooldowns), 그리고 폴백과의 상호작용에 대한 자세한 내용은 [/concepts/model-failover](/concepts/model-failover) 문서를 참조하세요.
제공업체(Provider) 개요 및 설정 예시는 [/concepts/model-providers](/concepts/model-providers)에서 확인할 수 있습니다.

## 모델 선택 작동 방식

OpenClaw는 다음 순서에 따라 사용할 모델을 결정합니다.

1. **기본(Primary)** 모델: `agents.defaults.model.primary` 또는 `agents.defaults.model` 설정을 확인합니다.
2. **폴백(Fallbacks)**: `agents.defaults.model.fallbacks`에 정의된 순서대로 시도합니다.
3. **제공업체 인증 실패 시 대응(Failover)**: 다음 모델로 넘어가기 전, 현재 제공업체 내에서 사용 가능한 다른 인증 수단을 먼저 시도합니다.

관련 설정 항목:

* `agents.defaults.models`: OpenClaw에서 사용할 수 있는 모델들의 허용 목록(Allowlist) 및 카탈로그입니다. 별칭(Aliases) 설정도 포함됩니다.
* `agents.defaults.imageModel`: 기본 모델이 이미지 입력을 지원하지 않을 때만 사용되는 이미지 전용 모델입니다.
* 에이전트별 설정: `agents.list[].model` 및 바인딩 설정을 통해 `agents.defaults.model` 값을 재정의할 수 있습니다. 자세한 내용은 [/concepts/multi-agent](/concepts/multi-agent)를 참조하세요.

## 권장 모델 정책

* 기본 모델은 현재 사용 가능한 가장 강력한 최신 세대 모델로 설정하는 것이 좋습니다.
* 비용이나 지연 시간(Latency)이 중요한 작업, 또는 일상적인 가벼운 채팅에는 폴백 모델을 활용하세요.
* 도구 사용 기능이 활성화된 에이전트나 출처를 알 수 없는 입력을 처리할 때는 성능이 낮은 구형 모델 사용을 지양하세요.

## 설정 마법사 (권장 방식)

설정 파일을 직접 수정하는 대신, 다음 명령어를 실행하여 단계별로 설정을 진행할 수 있습니다.

```bash
openclaw onboard
```

이 마법사는 **OpenAI Code (Codex) 구독**(OAuth) 및 **Anthropic**(API 키 또는 `claude setup-token`)을 포함한 주요 제공업체의 모델과 인증 설정을 도와줍니다.

## 주요 설정 키 (Overview)

* `agents.defaults.model.primary` 및 `agents.defaults.model.fallbacks`
* `agents.defaults.imageModel.primary` 및 `agents.defaults.imageModel.fallbacks`
* `agents.defaults.models`: 허용 목록, 별칭, 제공업체 파라미터 설정
* `models.providers`: `models.json`에 기록되는 사용자 정의 제공업체 정보

모델 참조명(Model refs)은 모두 소문자로 처리됩니다. `z.ai/*`와 같은 제공업체 별칭은 `zai/*` 형식으로 정규화됩니다.

OpenCode Zen을 포함한 상세 제공업체 설정 예시는 [/gateway/configuration](/gateway/configuration#opencode-zen-multi-model-proxy) 섹션에서 확인할 수 있습니다.

## "Model is not allowed" 오류 및 응답 중단 현상

`agents.defaults.models` 설정이 활성화되어 있으면, 해당 항목은 `/model` 명령어 및 세션 재정의를 위한 **허용 목록(Allowlist)** 역할을 합니다. 허용 목록에 없는 모델을 선택하려고 하면 다음과 같은 오류 메시지가 표시됩니다.

```
Model "provider/model" is not allowed. Use /model to list available models.
```

이 오류는 실제 응답이 생성되기 **전**에 발생하므로, 사용자 입장에서는 에이전트가 아무런 응답을 하지 않는 것처럼 느껴질 수 있습니다. 이 경우 다음 방법 중 하나로 해결할 수 있습니다.

* 해당 모델을 `agents.defaults.models` 목록에 추가합니다.
* 허용 목록 설정을 삭제하여 제한을 해제합니다 (`agents.defaults.models` 항목 제거).
* `/model list` 명령어로 확인된 허용된 모델 중 하나를 선택합니다.

허용 목록 설정 예시:

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

## 채팅 중 모델 전환 (`/model`)

게이트웨이를 재시작하지 않고도 현재 세션에서 사용할 모델을 즉시 변경할 수 있습니다.

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

참고 사항:

* `/model` 및 `/model list` 명령어는 모델군과 제공업체를 번호로 선택할 수 있는 간결한 목록을 보여줍니다.
* 디스코드(Discord)에서는 `/model` 또는 `/models` 입력 시 제공업체 및 모델을 선택할 수 있는 드롭다운 메뉴와 전송 버튼이 포함된 인터랙티브 UI가 나타납니다.
* `/model <번호>` 형식을 통해 목록의 특정 모델을 즉시 선택할 수 있습니다.
* `/model status`는 현재 사용 중인 인증 정보, 제공업체 엔드포인트(`baseUrl`), API 모드 등 상세 정보를 보여줍니다.
* 모델 참조명은 첫 번째 나타나는 `/` 기호를 기준으로 구분됩니다. 직접 입력할 때는 `/model 제공업체/모델명` 형식을 사용하세요.
* 모델 ID 자체에 `/`가 포함된 경우(예: OpenRouter 스타일), 반드시 제공업체 접두사를 포함해야 합니다 (예: `/model openrouter/moonshotai/kimi-k2`).
* 제공업체명을 생략하면 OpenClaw는 이를 별칭으로 간주하거나 **기본 제공업체**의 모델로 처리합니다 (모델 ID에 `/`가 없는 경우에만 작동).

상세 명령어 동작 및 설정은 [슬래시 명령어](/tools/slash-commands) 문서를 참조하세요.

## CLI 명령어

```bash
openclaw models list
openclaw models status
openclaw models set <제공업체/모델명>
openclaw models set-image <제공업체/모델명>

openclaw models aliases list
openclaw models aliases add <별칭> <제공업체/모델명>
openclaw models aliases remove <별칭>

openclaw models fallbacks list
openclaw models fallbacks add <제공업체/모델명>
openclaw models fallbacks remove <제공업체/모델명>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <제공업체/모델명>
openclaw models image-fallbacks remove <제공업체/모델명>
openclaw models image-fallbacks clear
```

`openclaw models` (서브커맨드 생략 시) 명령어는 `models status`와 동일하게 작동합니다.

### `models list`

현재 설정된 모델 목록을 보여줍니다.

* `--all`: 전체 카탈로그 표시
* `--local`: 로컬 제공업체만 표시
* `--provider <이름>`: 특정 제공업체로 필터링
* `--plain`: 모델명만 한 줄씩 출력
* `--json`: 기계 판독이 가능한 JSON 형식으로 출력

### `models status`

확정된 기본 모델, 폴백 모델, 이미지 모델 정보 및 각 제공업체의 인증 상태 개요를 보여줍니다. 인증 저장소에 등록된 프로필의 OAuth 만료 상태도 확인할 수 있습니다 (기본적으로 만료 24시간 전부터 경고 표시).

* `--plain`: 확정된 기본 모델명만 출력합니다.
* OAuth 상태 정보는 항상 표시되며 `--json` 출력 결과에도 포함됩니다.
* 인증 정보가 설정되지 않은 제공업체가 있는 경우 **Missing auth** 섹션에 표시됩니다.
* JSON 출력에는 `auth.oauth` (만료 경고 기간 및 프로필 정보) 및 `auth.providers` (각 제공업체별 유효 인증 수단) 정보가 포함됩니다.
* 자동화 스크립트 등에서는 `--check` 플래그를 사용하세요 (인증 정보 누락/만료 시 종료 코드 `1`, 만료 임박 시 `2` 반환).

인증 방식은 제공업체나 계정 유형에 따라 다릅니다. 상시 가동되는 게이트웨이 서버의 경우 API 키 방식이 가장 안정적이며, 구독 기반의 토큰 흐름도 지원됩니다.

예시 (Anthropic setup-token 사용 시):

```bash
claude setup-token
openclaw models status
```

## 모델 스캔 (Scanning)

`openclaw models scan` 명령어는 OpenRouter의 **무료 모델 카탈로그**를 점검하고, 선택적으로 각 모델의 도구 사용 및 이미지 지원 여부를 직접 테스트(Probing)합니다.

주요 플래그:

* `--no-probe`: 실제 테스트를 건너뛰고 메타데이터만 확인합니다.
* `--min-params <b>`: 최소 파라미터 수 제한 (십억 단위).
* `--max-age-days <일수>`: 오래된 모델은 제외합니다.
* `--provider <이름>`: 특정 제공업체 접두사로 필터링합니다.
* `--max-candidates <개수>`: 폴백 목록에 포함할 최대 모델 수.
* `--set-default`: 스캔 결과 첫 번째 모델을 `agents.defaults.model.primary`로 자동 설정합니다.
* `--set-image`: 스캔 결과 첫 번째 이미지 지원 모델을 `agents.defaults.imageModel.primary`로 자동 설정합니다.

테스트(Probing) 기능을 사용하려면 OpenRouter API 키가 필요합니다 (인증 프로필 또는 `OPENROUTER_API_KEY` 환경 변수). 키가 없는 경우 `--no-probe` 플래그를 사용하여 후보 목록만 확인하세요.

스캔 결과는 다음 우선순위에 따라 정렬됩니다.

1. 이미지 지원 여부
2. 도구 사용 시 지연 시간(Latency)
3. 컨텍스트 크기(Context size)
4. 파라미터 수

동작 원리:

* OpenRouter의 `/models` 목록에서 무료(`:free`) 필터를 적용하여 가져옵니다.
* OpenRouter API 키가 필요합니다 ([환경 변수](/help/environment) 문서 참조).
* `--max-age-days`, `--min-params`, `--provider`, `--max-candidates` 등 다양한 필터를 지원합니다.
* `--timeout`, `--concurrency` 플래그로 테스트 과정을 제어할 수 있습니다.

터미널(TTY) 환경에서 실행 시 폴백 모델을 직접 선택할 수 있으며, 비대화형 모드에서는 `--yes` 플래그를 사용하여 기본 설정을 적용할 수 있습니다.

## 모델 레지스트리 (`models.json`)

`models.providers`에 설정된 사용자 정의 제공업체 정보는 에이전트 디렉터리 내의 `models.json` 파일에 저장됩니다 (기본 위치: `~/.openclaw/agents/<agentId>/models.json`). 이 파일은 `models.mode` 설정이 `replace`가 아닌 한 기존 내용과 자동으로 병합(Merge)됩니다.

동일한 제공업체 ID가 충돌할 때의 병합 우선순위는 다음과 같습니다.

* 에이전트 전용 `models.json`에 이미 정의된 값이 비어 있지 않은 `baseUrl`이 우선합니다.
* 에이전트 전용 `models.json`의 `apiKey`는, 해당 제공업체가 현재 설정이나 인증 프로필에서 SecretRef로 관리되지 않는 경우에만 우선합니다.
* SecretRef로 관리되는 제공업체의 `apiKey` 값은 실제 비밀번호를 저장하는 대신 참조 마커(환경 변수 참조의 경우 `ENV_VAR_NAME`, 파일/명령 참조의 경우 `secretref-managed`)를 유지하며 필요 시 새로 고침합니다.
* 에이전트 설정에 `apiKey`나 `baseUrl`이 없는 경우 메인 설정의 `models.providers` 값을 사용합니다.
* 기타 필드들은 메인 설정 및 정규화된 카탈로그 데이터를 바탕으로 최신 상태로 유지됩니다.

이러한 마커 기반의 영속성 관리는 `openclaw agent` 명령을 포함하여 OpenClaw가 `models.json` 파일을 다시 생성할 때마다 적용됩니다.
