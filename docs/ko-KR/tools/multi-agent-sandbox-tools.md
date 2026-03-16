---
title: "Multi-Agent Sandbox & Tools"
description: "멀티 에이전트 환경에서 agent별 sandbox, tool 제한, precedence와 구성 예시를 설명합니다."
summary: "에이전트별 sandbox + tool 제한, precedence, 예시"
x-i18n:
  source_path: "tools/multi-agent-sandbox-tools.md"
read_when: "멀티 에이전트 gateway에서 에이전트별 sandboxing 또는 에이전트별 tool allow/deny 정책이 필요할 때."
status: active
---

# Multi-Agent Sandbox & Tools Configuration

## 개요

멀티 에이전트 구성에서는 이제 각 에이전트가 다음을 각각 가질 수 있습니다:

- **Sandbox configuration** (`agents.list[].sandbox`가 `agents.defaults.sandbox`를 override)
- **Tool restrictions** (`tools.allow` / `tools.deny`, 그리고 `agents.list[].tools`)

이를 통해 서로 다른 보안 프로필을 가진 여러 에이전트를 실행할 수 있습니다:

- 전체 접근 권한이 있는 개인 비서
- 제한된 tool을 사용하는 가족/업무용 에이전트
- sandbox 안에서 실행되는 공개용 에이전트

`setupCommand`는 `sandbox.docker` 아래(전역 또는 에이전트별)에 두어야 하며,
컨테이너가 생성될 때 한 번 실행됩니다.

인증은 에이전트별입니다. 각 에이전트는 다음 위치의 자체 `agentDir` auth store를 읽습니다:

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

자격 증명은 **에이전트 간에 공유되지 않습니다**. 절대로 에이전트끼리 `agentDir`를 재사용하지 마세요.
자격 증명을 공유하고 싶다면 다른 에이전트의 `agentDir`로 `auth-profiles.json`을 복사하세요.

런타임에서 sandboxing이 어떻게 동작하는지는 [Sandboxing](/gateway/sandboxing)을 참고하세요.
“왜 이게 차단되지?”를 디버깅하려면 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)와 `openclaw sandbox explain`을 보세요.

---

## 구성 예시

### 예시 1: 개인 + 제한된 가족 에이전트

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**결과:**

- `main` 에이전트: 호스트에서 실행, 전체 tool 접근 가능
- `family` 에이전트: Docker에서 실행(에이전트당 컨테이너 1개), `read` tool만 사용 가능

---

### 예시 2: 공유 Sandbox를 사용하는 업무용 에이전트

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### 예시 2b: 전역 coding profile + messaging 전용 에이전트

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**결과:**

- 기본 에이전트는 coding tool을 사용합니다
- `support` 에이전트는 messaging 전용(+ Slack tool)입니다

---

### 예시 3: 에이전트별로 다른 Sandbox mode

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public always sandboxed
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Configuration Precedence

전역(`agents.defaults.*`)과 에이전트별(`agents.list[].*`) 구성이 모두 존재할 때:

### Sandbox Config

에이전트별 설정이 전역 설정보다 우선합니다:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**참고:**

- 해당 에이전트에서 `agents.list[].sandbox.{docker,browser,prune}.*`는 `agents.defaults.sandbox.{docker,browser,prune}.*`를 override합니다(sandbox scope가 `"shared"`로 resolve되면 무시됨).

### Tool Restrictions

필터링 순서는 다음과 같습니다:

1. **Tool profile** (`tools.profile` 또는 `agents.list[].tools.profile`)
2. **Provider tool profile** (`tools.byProvider[provider].profile` 또는 `agents.list[].tools.byProvider[provider].profile`)
3. **Global tool policy** (`tools.allow` / `tools.deny`)
4. **Provider tool policy** (`tools.byProvider[provider].allow/deny`)
5. **Agent-specific tool policy** (`agents.list[].tools.allow/deny`)
6. **Agent provider policy** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox tool policy** (`tools.sandbox.tools` 또는 `agents.list[].tools.sandbox.tools`)
8. **Subagent tool policy** (`tools.subagents.tools`, 해당하는 경우)

각 단계는 tool을 더 제한할 수는 있지만, 앞선 단계에서 거부된 tool을 다시 허용할 수는 없습니다.
`agents.list[].tools.sandbox.tools`가 설정되어 있으면 해당 에이전트에서 `tools.sandbox.tools`를 대체합니다.
`agents.list[].tools.profile`이 설정되어 있으면 해당 에이전트에서 `tools.profile`을 override합니다.
Provider tool key는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.2`) 둘 다 허용합니다.

### Tool group (축약형)

Tool policy(전역, 에이전트, sandbox)는 여러 concrete tool로 확장되는 `group:*` 항목을 지원합니다:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 모든 내장 OpenClaw tool (provider plugin 제외)

### Elevated Mode

`tools.elevated`는 전역 baseline(발신자 기반 allowlist)입니다. `agents.list[].tools.elevated`는 특정 에이전트에서 elevated를 더 제한할 수 있습니다(둘 다 허용해야 함).

완화 패턴:

- 신뢰하지 않는 에이전트에 대해 `exec`를 deny (`agents.list[].tools.deny: ["exec"]`)
- 제한된 에이전트로 라우팅되는 발신자를 allowlist에 넣지 않기
- sandbox 실행만 원한다면 전역 elevated 비활성화 (`tools.elevated.enabled: false`)
- 민감한 프로필에는 에이전트별 elevated 비활성화 (`agents.list[].tools.elevated.enabled: false`)

---

## Single Agent에서 마이그레이션

**이전 (single agent):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**이후 (서로 다른 프로필을 가진 multi-agent):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

레거시 `agent.*` 구성은 `openclaw doctor`가 마이그레이션합니다. 앞으로는 `agents.defaults` + `agents.list`를 우선 사용하세요.

---

## Tool Restriction 예시

### Read-only 에이전트

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### 안전 실행 에이전트 (파일 수정 없음)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Communication 전용 에이전트

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

---

## 흔한 함정: "non-main"

`agents.defaults.sandbox.mode: "non-main"`은 agent id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다.
Group/channel session은 항상 자체 key를 가지므로 non-main으로 취급되어 sandboxed됩니다. 어떤 에이전트도 절대
sandbox하지 않으려면 `agents.list[].sandbox.mode: "off"`로 설정하세요.

---

## 테스트

멀티 에이전트 sandbox와 tool을 구성한 후:

1. **에이전트 해석 확인:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Sandbox 컨테이너 확인:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Tool restriction 테스트:**
   - 제한된 tool이 필요한 메시지를 보냅니다
   - 에이전트가 거부된 tool을 사용할 수 없는지 확인합니다

4. **로그 모니터링:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## 문제 해결

### `mode: "all"`인데 에이전트가 sandbox되지 않음

- 이를 override하는 전역 `agents.defaults.sandbox.mode`가 있는지 확인하세요
- 에이전트별 구성이 precedence를 가지므로 `agents.list[].sandbox.mode: "all"`을 설정하세요

### deny list가 있는데도 tool이 여전히 사용 가능함

- tool filtering 순서를 확인하세요: global → agent → sandbox → subagent
- 각 단계는 더 제한만 할 수 있고, 다시 허용할 수는 없습니다
- 로그로 확인하세요: `[tools] filtering tools for agent:${agentId}`

### 컨테이너가 에이전트별로 격리되지 않음

- 에이전트별 sandbox config에서 `scope: "agent"`를 설정하세요
- 기본값은 `"session"`이며 session당 컨테이너 1개를 만듭니다

---

## See Also

- [Multi-Agent Routing](/concepts/multi-agent)
- [Sandbox Configuration](/gateway/configuration#agentsdefaults-sandbox)
- [Session Management](/concepts/session)
