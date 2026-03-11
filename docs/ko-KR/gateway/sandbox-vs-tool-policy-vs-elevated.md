---
title: Sandbox vs Tool Policy vs Elevated
summary: "도구가 막히는 이유: sandbox runtime, tool allow/deny policy, elevated exec gate"
read_when: "'sandbox jail' 이나 tool/elevated refusal 을 보고 정확히 어떤 config key 를 바꿔야 하는지 알고 싶을 때."
status: active
---

# Sandbox vs Tool Policy vs Elevated

OpenClaw 에는 서로 관련 있지만 다른 세 가지 제어가 있습니다:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) 는 **도구가 어디서 실행되는지** (Docker vs host)를 결정합니다.
2. **Tool policy** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) 는 **어떤 도구가 사용 가능/허용되는지** 를 결정합니다.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) 는 sandbox 상태에서 host 에서 실행하게 해 주는 **exec 전용 탈출구** 입니다.

## Quick debug

OpenClaw 가 _실제로_ 무엇을 하고 있는지 inspector 로 확인하세요:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

출력 내용:

- 유효 sandbox mode/scope/workspace access
- 현재 session 이 sandbox 상태인지 여부 (main vs non-main)
- 유효 sandbox tool allow/deny (그리고 agent/global/default 중 어디서 왔는지)
- elevated gate 와 fix-it key path

## Sandbox: 도구가 어디서 실행되는가

sandboxing 은 `agents.defaults.sandbox.mode` 로 제어됩니다:

- `"off"`: 모든 것이 host 에서 실행
- `"non-main"`: non-main session 만 sandbox 처리 (group/channel 에서 흔한 “뜻밖의 동작”)
- `"all"`: 전부 sandbox 처리

scope, workspace mount, image 를 포함한 전체 매트릭스는 [Sandboxing](/gateway/sandboxing) 을 참고하세요.

### Bind mounts (빠른 보안 체크)

- `docker.binds` 는 sandbox 파일시스템을 _관통_ 합니다: 마운트한 것은 설정한 모드(`:ro` 또는 `:rw`)대로 container 안에서 보입니다.
- 모드를 생략하면 기본값은 read-write 이므로, 소스/비밀에는 `:ro` 를 권장합니다.
- `scope: "shared"` 는 agent 별 bind 를 무시합니다(전역 bind 만 적용).
- `/var/run/docker.sock` 를 bind 하면 사실상 sandbox 에 host 제어권을 주는 셈이므로, 의도한 경우에만 하세요.
- workspace access (`workspaceAccess: "ro"`/`"rw"`)는 bind mode 와는 별개입니다.

## Tool policy: 어떤 도구가 존재하고 호출 가능한가

중요한 계층은 두 가지입니다:

- **Tool profile**: `tools.profile` 및 `agents.list[].tools.profile` (기본 allowlist)
- **Provider tool profile**: `tools.byProvider[provider].profile` 및 `agents.list[].tools.byProvider[provider].profile`
- **Global/per-agent tool policy**: `tools.allow`/`tools.deny` 및 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider tool policy**: `tools.byProvider[provider].allow/deny` 및 `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox tool policy** (sandbox 상태에서만 적용): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 및 `agents.list[].tools.sandbox.tools.*`

경험칙:

- `deny` 가 항상 우선합니다.
- `allow` 가 비어 있지 않으면, 나머지는 모두 차단된 것으로 간주됩니다.
- tool policy 는 최종 차단점입니다: 거부된 `exec` tool 은 `/exec` 로 override 할 수 없습니다.
- `/exec` 는 권한 있는 발신자에 대해 session 기본값만 바꿀 뿐, tool access 를 부여하지는 않습니다.
  provider tool key 는 `provider` (예: `google-antigravity`) 또는 `provider/model` (예: `openai/gpt-5.2`) 형식을 받을 수 있습니다.

### Tool groups (축약형)

tool policy (global, agent, sandbox)는 여러 tool 로 확장되는 `group:*` 항목을 지원합니다:

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

사용 가능한 group:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 모든 내장 OpenClaw tool (provider plugin 제외)

## Elevated: exec 전용 “host 에서 실행”

Elevated 는 추가 tool 을 부여하지 않습니다. `exec` 에만 영향을 줍니다.

- sandbox 상태라면 `/elevated on` (또는 `exec` 의 `elevated: true`) 으로 host 에서 실행합니다(approval 이 여전히 필요할 수 있음).
- session 에서 exec approval 을 건너뛰려면 `/elevated full` 을 사용하세요.
- 이미 direct 로 실행 중이라면 elevated 는 사실상 no-op 입니다(여전히 gate 는 적용됨).
- Elevated 는 **skill 범위가 아니며**, tool allow/deny 를 override 하지 않습니다.
- `/exec` 는 elevated 와 별개입니다. 권한 있는 발신자에 대한 session exec 기본값만 조정합니다.

게이트:

- Enablement: `tools.elevated.enabled` (선택적으로 `agents.list[].tools.elevated.enabled`)
- Sender allowlist: `tools.elevated.allowFrom.<provider>` (선택적으로 `agents.list[].tools.elevated.allowFrom.<provider>`)

자세한 내용은 [Elevated Mode](/tools/elevated) 를 참고하세요.

## 흔한 “sandbox jail” 해결

### “Tool X blocked by sandbox tool policy”

Fix-it key (하나 선택):

- sandbox 비활성화: `agents.defaults.sandbox.mode=off` (또는 agent 별 `agents.list[].sandbox.mode=off`)
- sandbox 안에서 tool 허용:
  - `tools.sandbox.tools.deny` (또는 agent 별 `agents.list[].tools.sandbox.tools.deny`)에서 제거
  - 또는 `tools.sandbox.tools.allow` (또는 agent 별 allow)에 추가

### “이게 main 인 줄 알았는데 왜 sandbox 지?”

`"non-main"` 모드에서는 group/channel key 는 main 이 아닙니다. `sandbox explain` 에 표시된 main session key 를 사용하거나 mode 를 `"off"` 로 바꾸세요.
