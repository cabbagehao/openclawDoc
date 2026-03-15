# Discord 채널 및 Telegram 토픽용 ACP 영구 바인딩

Status: Draft

## Summary

다음을 매핑하는 영구 ACP 바인딩을 도입합니다:

- Discord 채널(필요한 경우 기존 스레드 포함)
- 그룹/슈퍼그룹의 Telegram 포럼 토픽(`chatId:topic:topicId`)

바인딩 상태는 명시적 바인딩 타입을 사용하는 최상위 `bindings[]` 항목에 저장되며, 이들은 장기 실행 ACP 세션에 연결됩니다.

이로써 트래픽이 많은 메시징 채널에서의 ACP 사용이 예측 가능하고 지속 가능해지며, 사용자는 `codex`, `claude-1`, `claude-myrepo` 같은 전용 채널/토픽을 만들 수 있습니다.

## Why

현재의 스레드 바인딩 ACP 동작은 일시적인 Discord 스레드 워크플로에 최적화되어 있습니다. Telegram은 같은 스레드 모델을 사용하지 않고, 그룹/슈퍼그룹의 포럼 토픽을 사용합니다. 사용자는 일시적인 스레드 세션뿐 아니라 채팅 표면에서 안정적이고 항상 켜져 있는 ACP "workspace"를 원합니다.

## Goals

- 다음을 위한 지속 가능한 ACP 바인딩 지원:
  - Discord 채널/스레드
  - Telegram 포럼 토픽(그룹/슈퍼그룹)
- 바인딩 source of truth를 config 기반으로 만듭니다.
- `/acp`, `/new`, `/reset`, `/focus`, 그리고 전달 동작을 Discord와 Telegram 전반에서 일관되게 유지합니다.
- 즉석 사용을 위한 기존 임시 바인딩 흐름은 유지합니다.

## Non-Goals

- ACP runtime/session 내부 구조의 전체 재설계
- 기존 ephemeral 바인딩 흐름 제거
- 첫 번째 반복에서 모든 채널로 확장
- 이번 단계에서 Telegram 채널 direct-messages 토픽(`direct_messages_topic_id`) 구현
- 이번 단계에서 Telegram private-chat 토픽 변형 구현

## UX Direction

### 1) 두 가지 바인딩 타입

- **Persistent binding**: config에 저장되며, 시작 시 재조정되고, "이름 있는 workspace" 채널/토픽을 위한 용도입니다.
- **Temporary binding**: runtime 전용이며, idle/max-age 정책에 따라 만료됩니다.

### 2) 명령 동작

- `/acp spawn ... --thread here|auto|off`는 계속 사용할 수 있습니다.
- 명시적인 bind lifecycle 제어를 추가합니다:
  - `/acp bind [session|agent] [--persist]`
  - `/acp unbind [--persist]`
  - `/acp status`는 바인딩이 `persistent`인지 `temporary`인지 포함합니다.
- 바인딩된 대화에서 `/new`와 `/reset`은 바인딩된 ACP 세션을 그 자리에서 재설정하고, 바인딩은 계속 유지합니다.

### 3) 대화 식별자

- 정규화된 canonical conversation ID를 사용합니다:
  - Discord: 채널/스레드 ID
  - Telegram 토픽: `chatId:topic:topicId`
- Telegram 바인딩을 topic ID 단독 값으로 키잉하지 않습니다.

## Config Model (Proposed)

라우팅과 영구 ACP 바인딩 설정을 명시적인 `type` 구분자를 가진 최상위 `bindings[]`로 통합합니다:

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace-main",
        "runtime": { "type": "embedded" },
      },
      {
        "id": "codex",
        "workspace": "~/.openclaw/workspace-codex",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "codex",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-a",
          },
        },
      },
      {
        "id": "claude",
        "workspace": "~/.openclaw/workspace-claude",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "claude",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-b",
          },
        },
      },
    ],
  },
  "acp": {
    "enabled": true,
    "backend": "acpx",
    "allowedAgents": ["codex", "claude"],
  },
  "bindings": [
    // Route bindings (existing behavior)
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
    },
    // Persistent ACP conversation bindings
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
      "acp": {
        "label": "codex-main",
        "mode": "persistent",
        "cwd": "/workspace/repo-a",
        "backend": "acpx",
      },
    },
    {
      "type": "acp",
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
      "acp": {
        "label": "claude-repo-b",
        "mode": "persistent",
        "cwd": "/workspace/repo-b",
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1001234567890:topic:42" },
      },
      "acp": {
        "label": "tg-codex-42",
        "mode": "persistent",
      },
    },
  ],
  "channels": {
    "discord": {
      "guilds": {
        "111111111111111111": {
          "channels": {
            "222222222222222222": {
              "enabled": true,
              "requireMention": false,
            },
            "333333333333333333": {
              "enabled": true,
              "requireMention": false,
            },
          },
        },
      },
    },
    "telegram": {
      "groups": {
        "-1001234567890": {
          "topics": {
            "42": {
              "requireMention": false,
            },
          },
        },
      },
    },
  },
}
```

### Minimal Example (No Per-Binding ACP Overrides)

```jsonc
{
  "agents": {
    "list": [
      { "id": "main", "default": true, "runtime": { "type": "embedded" } },
      {
        "id": "codex",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "codex", "backend": "acpx", "mode": "persistent" },
        },
      },
      {
        "id": "claude",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "claude", "backend": "acpx", "mode": "persistent" },
        },
      },
    ],
  },
  "acp": { "enabled": true, "backend": "acpx" },
  "bindings": [
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
    },

    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
    },
    {
      "type": "acp",
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1009876543210:topic:5" },
      },
    },
  ],
}
```

Notes:

- `bindings[].type`는 명시적입니다:
  - `route`: 일반 에이전트 라우팅
  - `acp`: 일치하는 대화에 대한 영구 ACP harness 바인딩
- `type: "acp"`의 경우, `match.peer.id`는 정규화된 conversation key입니다:
  - Discord 채널/스레드: 원시 channel/thread ID
  - Telegram 토픽: `chatId:topic:topicId`
- `bindings[].acp.backend`는 선택 사항입니다. Backend fallback 순서는 다음과 같습니다:
  1. `bindings[].acp.backend`
  2. `agents.list[].runtime.acp.backend`
  3. 전역 `acp.backend`
- `mode`, `cwd`, `label`은 같은 override 패턴을 따릅니다(`binding override -> agent runtime default -> global/default behavior`).
- 기존 `session.threadBindings.*` 및 `channels.discord.threadBindings.*`는 임시 바인딩 정책을 위해 유지합니다.
- 영구 항목은 desired state를 선언하고, runtime이 실제 ACP 세션/바인딩으로 재조정합니다.
- 대화 노드당 하나의 활성 ACP 바인딩이 의도된 모델입니다.
- 하위 호환성: `type`이 없으면 레거시 항목에 대해 `route`로 해석합니다.

### Backend Selection

- ACP 세션 초기화는 이미 spawn 시 구성된 backend selection을 사용합니다(현재는 `acp.backend`).
- 이 제안은 spawn/reconcile 로직을 확장해 typed ACP binding override를 우선 사용하게 합니다:
  - 대화 로컬 override용 `bindings[].acp.backend`
  - 에이전트별 기본값용 `agents.list[].runtime.acp.backend`
- override가 없으면 현재 동작(`acp.backend` 기본값)을 유지합니다.

## Architecture Fit in Current System

### 기존 컴포넌트 재사용

- `SessionBindingService`는 이미 채널 비종속 conversation reference를 지원합니다.
- ACP spawn/bind 흐름은 이미 서비스 API를 통한 바인딩을 지원합니다.
- Telegram은 이미 `MessageThreadId`와 `chatId`를 통해 topic/thread 컨텍스트를 전달합니다.

### 신규/확장 컴포넌트

- **Telegram binding adapter** (Discord adapter와 병렬):
  - Telegram account별 adapter 등록
  - 정규화된 conversation ID로 resolve/list/bind/unbind/touch 수행
- **Typed binding resolver/index**:
  - `bindings[]`를 `route`와 `acp` 뷰로 분리
  - `resolveAgentRoute`는 `route` 바인딩에만 유지
  - 영구 ACP intent는 `acp` 바인딩에서만 resolve
- **Telegram용 inbound binding resolution**:
  - bound session을 route 최종 결정 전에 resolve(Discord는 이미 이렇게 동작)
- **Persistent binding reconciler**:
  - 시작 시: 구성된 최상위 `type: "acp"` 바인딩을 로드하고, ACP 세션 존재 여부와 바인딩 존재 여부를 보장
  - config 변경 시: delta를 안전하게 적용
- **Cutover model**:
  - 채널 로컬 ACP 바인딩 fallback은 읽지 않음
  - 영구 ACP 바인딩은 오직 최상위 `bindings[].type="acp"` 항목에서만 가져옴

## Phased Delivery

### Phase 1: Typed binding schema foundation

- config schema를 확장해 `bindings[].type` 구분자를 지원합니다:
  - `route`
  - 선택적 `acp` override 객체(`mode`, `backend`, `cwd`, `label`)가 있는 `acp`
- ACP-native agent를 표시하기 위해 runtime descriptor를 agent schema에 추가합니다(`agents.list[].runtime.type`).
- route 바인딩과 ACP 바인딩을 분리하는 parser/indexer를 추가합니다.

### Phase 2: Runtime resolution + Discord/Telegram parity

- 다음에 대해 최상위 `type: "acp"` 항목에서 영구 ACP 바인딩을 resolve합니다:
  - Discord 채널/스레드
  - Telegram 포럼 토픽(`chatId:topic:topicId` canonical ID)
- Telegram binding adapter와 inbound bound-session override parity를 Discord와 동일하게 구현합니다.
- 이번 단계에는 Telegram direct/private topic 변형을 포함하지 않습니다.

### Phase 3: Command parity and resets

- 바인딩된 Telegram/Discord 대화에서 `/acp`, `/new`, `/reset`, `/focus` 동작을 정렬합니다.
- 설정된 대로 reset 흐름 이후에도 바인딩이 유지되도록 보장합니다.

### Phase 4: Hardening

- 더 나은 진단(`/acp status`, 시작 시 reconciliation 로그)
- 충돌 처리 및 상태 점검

## Guardrails and Policy

- ACP 활성화 여부와 sandbox 제한은 현재와 정확히 동일하게 존중합니다.
- 계정 간 오염을 피하기 위해 명시적인 account scoping(`accountId`)을 유지합니다.
- 라우팅이 모호하면 fail closed합니다.
- mention/access 정책 동작은 채널 config별로 명시적으로 유지합니다.

## Testing Plan

- Unit:
  - conversation ID normalization(특히 Telegram topic ID)
  - reconciler create/update/delete 경로
  - `/acp bind --persist` 및 unbind 흐름
- Integration:
  - inbound Telegram topic -> bound ACP session resolution
  - inbound Discord channel/thread -> persistent binding precedence
- Regression:
  - temporary bindings가 계속 동작함
  - 바인딩되지 않은 채널/토픽은 현재 라우팅 동작을 유지함

## Open Questions

- Telegram topic에서 `/acp spawn --thread auto`의 기본값은 `here`여야 할까요?
- 영구 바인딩은 bound conversation에서 항상 mention-gating을 우회해야 할까요, 아니면 명시적으로 `requireMention=false`가 필요할까요?
- `/focus`에 `/acp bind --persist`의 별칭으로 `--persist`를 추가해야 할까요?

## Rollout

- 대화별 opt-in으로 배포합니다(`bindings[].type="acp"` 항목이 존재할 때).
- Discord + Telegram부터 시작합니다.
- 다음 예시가 포함된 문서를 추가합니다:
  - "에이전트당 하나의 채널/토픽"
  - "서로 다른 `cwd`를 가진 동일 에이전트용 여러 채널/토픽"
  - "팀 명명 패턴(`codex-1`, `claude-repo-x`)"
