---
title: Sandbox vs Tool Policy vs Elevated
description: 샌드박스 실행 위치, 도구 허용 정책, Elevated exec 게이트의 차이와 차단 원인별 설정 키를 설명합니다.
summary: "도구가 왜 막히는지: 샌드박스 런타임, 도구 허용/차단 정책, Elevated exec 게이트"
read_when: "샌드박스 격리 때문에 도구가 막히거나 tool/elevated 거부 메시지를 보고 어떤 설정 키를 바꿔야 할지 알고 싶을 때"
status: active
x-i18n:
  source_path: "gateway/sandbox-vs-tool-policy-vs-elevated.md"
---

# Sandbox vs Tool Policy vs Elevated

OpenClaw에는 서로 관련되어 있지만 역할이 다른 세 가지 제어 장치가 있습니다.

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)는 **도구가 어디에서 실행되는지**를 결정합니다. (Docker vs host)
2. **Tool policy** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`)는 **어떤 도구를 사용할 수 있는지**를 결정합니다.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`)는 샌드박스 안에 있을 때 호스트에서 실행하도록 하는 **`exec` 전용 탈출구**입니다.

## 빠른 디버깅

인스펙터를 사용하면 OpenClaw가 실제로 어떤 결정을 내리고 있는지 확인할 수 있습니다.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

출력에는 다음이 포함됩니다.

- 실제 적용된 sandbox mode / scope / workspace access
- 현재 세션이 샌드박스 대상인지 여부 (main vs non-main)
- 실제 sandbox tool allow/deny 결과와 그 출처(agent/global/default)
- elevated 게이트 상태와 수정할 설정 키 경로

## Sandbox: 도구가 실행되는 위치

샌드박싱은 `agents.defaults.sandbox.mode`로 제어합니다.

- `"off"`: 모든 도구가 호스트에서 실행됩니다.
- `"non-main"`: non-main 세션만 샌드박스에 넣습니다. 그룹/채널에서 예상 밖으로 샌드박싱되는 흔한 이유입니다.
- `"all"`: 모든 세션을 샌드박스에 넣습니다.

전체 매트릭스(scope, workspace mount, image)는 [Sandboxing](/gateway/sandboxing)을 참고하세요.

### Bind mounts 보안 빠른 점검

- `docker.binds`는 샌드박스 파일시스템을 관통합니다. 마운트한 경로는 지정한 모드(`:ro` 또는 `:rw`)로 컨테이너 안에서 그대로 보입니다.
- 모드를 생략하면 기본값은 read-write입니다. 소스 코드나 시크릿은 가능하면 `:ro`를 사용하세요.
- `scope: "shared"`에서는 agent별 bind가 무시되고 전역 bind만 적용됩니다.
- `/var/run/docker.sock`를 바인드하면 사실상 샌드박스에 호스트 제어권을 넘기는 것과 같습니다. 의도한 경우에만 사용하세요.
- workspace access (`workspaceAccess: "ro"` / `"rw"`)는 bind mount 모드와는 별개입니다.

## Tool policy: 어떤 도구가 존재하고 호출 가능한가

다음 계층을 함께 봐야 합니다.

- **Tool profile**: `tools.profile`, `agents.list[].tools.profile`
- **Provider tool profile**: `tools.byProvider[provider].profile`, `agents.list[].tools.byProvider[provider].profile`
- **Global / per-agent tool policy**: `tools.allow` / `tools.deny`, `agents.list[].tools.allow` / `agents.list[].tools.deny`
- **Provider tool policy**: `tools.byProvider[provider].allow/deny`, `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox tool policy**: 샌드박스 안에서만 적용되는 `tools.sandbox.tools.allow/deny`, `agents.list[].tools.sandbox.tools.*`

기억할 규칙:

- `deny`가 항상 우선합니다.
- `allow`가 비어 있지 않으면, 나머지는 모두 차단으로 간주합니다.
- tool policy가 최종 차단선입니다. `exec`가 `deny`되어 있으면 `/exec`로도 되살릴 수 없습니다.
- `/exec`는 권한 있는 발신자에 한해 세션 기본값만 바꿉니다. 도구 권한을 부여하지는 않습니다.
- provider tool 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.2`) 형식을 모두 받을 수 있습니다.

### 도구 그룹 축약 표기

도구 정책(global, agent, sandbox)에서는 여러 도구를 묶는 `group:*` 표기를 지원합니다.

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

사용 가능한 그룹:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: OpenClaw 내장 도구 전체(provider plugin 제외)

## Elevated: `exec`만 호스트에서 실행

Elevated는 **추가 도구를 허용하지 않습니다.** 오직 `exec`에만 영향을 줍니다.

- 샌드박스 상태라면 `/elevated on` 또는 `elevated: true`가 붙은 `exec`는 호스트에서 실행됩니다. 승인 절차는 여전히 적용될 수 있습니다.
- `/elevated full`을 사용하면 해당 세션에서 exec 승인을 건너뜁니다.
- 이미 direct 실행 상태라면 elevated는 사실상 no-op이지만, 게이트 자체는 여전히 적용됩니다.
- Elevated는 skill 범위 기능이 아니며 tool allow/deny를 무시하지도 않습니다.
- `/exec`는 elevated와 별개입니다. 권한 있는 발신자에 대해 세션별 exec 기본값만 조정합니다.

게이트:

- 활성화: `tools.elevated.enabled` (선택적으로 `agents.list[].tools.elevated.enabled`)
- 발신자 allowlist: `tools.elevated.allowFrom.<provider>` (선택적으로 `agents.list[].tools.elevated.allowFrom.<provider>`)

자세한 내용은 [Elevated Mode](/tools/elevated)를 참고하세요.

## 흔한 "sandbox jail" 해결법

### "Tool X blocked by sandbox tool policy"

다음 중 하나를 고르세요.

- 샌드박스를 끕니다: `agents.defaults.sandbox.mode=off` 또는 agent별 `agents.list[].sandbox.mode=off`
- 샌드박스 안에서 해당 도구를 허용합니다.
  - `tools.sandbox.tools.deny` 또는 `agents.list[].tools.sandbox.tools.deny`에서 제거
  - 또는 `tools.sandbox.tools.allow` / agent별 allow에 추가

### "main이라고 생각했는데 왜 샌드박스인가?"

`"non-main"` 모드에서는 group/channel key가 main이 아닙니다. `sandbox explain`으로 실제 main session key를 확인하거나 모드를 `"off"`로 바꾸세요.
