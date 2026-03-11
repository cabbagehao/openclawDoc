---
summary: "하나의 WhatsApp 메시지를 여러 에이전트에 브로드캐스트"
read_when:
  - 브로드캐스트 그룹을 설정할 때
  - WhatsApp에서 멀티 에이전트 응답을 디버깅할 때
status: experimental
title: "브로드캐스트 그룹"
x-i18n:
  source_path: "channels/broadcast-groups.md"
---

# 브로드캐스트 그룹

**상태:** Experimental  
**버전:** 2026.1.9에 추가

## 개요

브로드캐스트 그룹은 여러 에이전트가 같은 메시지를 동시에 처리하고 응답할 수 있게 합니다. 이를 통해 하나의 WhatsApp 그룹이나 DM 안에서, 전화번호 하나만으로 함께 일하는 특화 에이전트 팀을 만들 수 있습니다.

현재 범위: **WhatsApp 전용** (web channel).

브로드캐스트 그룹은 채널 allowlist와 그룹 activation 규칙이 평가된 뒤에 적용됩니다. 즉 WhatsApp 그룹에서는 OpenClaw가 원래 응답했을 상황(예: 그룹 설정에 따라 mention이 들어온 경우)에 브로드캐스트가 실행됩니다.

## 사용 사례

### 1. 특화 에이전트 팀

원자적이고 집중된 책임을 가진 여러 에이전트를 배치합니다.

```
Group: "Development Team"
Agents:
  - CodeReviewer (코드 스니펫 검토)
  - DocumentationBot (문서 생성)
  - SecurityAuditor (취약점 점검)
  - TestGenerator (테스트 케이스 제안)
```

각 에이전트는 같은 메시지를 처리하면서 자신의 전문 관점을 제공합니다.

### 2. 다국어 지원

```
Group: "International Support"
Agents:
  - Agent_EN (영어로 응답)
  - Agent_DE (독일어로 응답)
  - Agent_ES (스페인어로 응답)
```

### 3. 품질 보증 워크플로

```
Group: "Customer Support"
Agents:
  - SupportAgent (답변 제공)
  - QAAgent (품질 검토, 문제를 찾았을 때만 응답)
```

### 4. 작업 자동화

```
Group: "Project Management"
Agents:
  - TaskTracker (작업 데이터베이스 갱신)
  - TimeLogger (소요 시간 기록)
  - ReportGenerator (요약 생성)
```

## 설정

### 기본 설정

최상위 `broadcast` 섹션을 추가하세요(`bindings` 옆). 키는 WhatsApp peer id입니다.

- 그룹 채팅: group JID (예: `120363403215116621@g.us`)
- DM: E.164 전화번호 (예: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**결과:** OpenClaw가 이 채팅에 응답할 때 세 에이전트를 모두 실행합니다.

### 처리 전략

에이전트가 메시지를 어떻게 처리할지 제어합니다.

#### Parallel (기본값)

모든 에이전트가 동시에 처리합니다.

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequential

에이전트가 순서대로 처리합니다(앞선 에이전트가 끝날 때까지 다음 에이전트가 기다림).

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 전체 예시

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 동작 방식

### 메시지 흐름

1. WhatsApp 그룹에 **인바운드 메시지**가 도착합니다.
2. **브로드캐스트 확인**: 시스템이 peer ID가 `broadcast`에 있는지 검사합니다.
3. **브로드캐스트 목록에 있으면**:
   - 나열된 모든 에이전트가 메시지를 처리합니다.
   - 각 에이전트는 자신만의 session key와 격리된 context를 가집니다.
   - 에이전트는 병렬(기본값) 또는 순차로 처리됩니다.
4. **브로드캐스트 목록에 없으면**:
   - 일반 라우팅이 적용됩니다(첫 번째로 일치한 binding).

참고: 브로드캐스트 그룹은 채널 allowlist나 그룹 activation 규칙(mentions/commands 등)을 우회하지 않습니다. 메시지가 처리 대상이 되었을 때 _어떤 에이전트가 실행되는지_ 만 바꿉니다.

### 세션 격리

브로드캐스트 그룹 안의 각 에이전트는 완전히 분리된 다음 항목을 유지합니다.

- **Session key** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **대화 기록** (에이전트는 다른 에이전트의 메시지를 보지 못함)
- **Workspace** (설정돼 있다면 각각 별도 sandbox)
- **도구 접근** (서로 다른 allow/deny 목록)
- **Memory/context** (서로 다른 IDENTITY.md, SOUL.md 등)
- **그룹 context buffer** (컨텍스트용 최근 그룹 메시지)는 peer 단위로 공유되므로, 브로드캐스트 에이전트 모두가 트리거 시 같은 컨텍스트를 봅니다.

따라서 각 에이전트는 다음처럼 다르게 구성할 수 있습니다.

- 서로 다른 성격
- 서로 다른 도구 접근(예: read-only vs. read-write)
- 서로 다른 모델(예: opus vs. sonnet)
- 서로 다른 설치 스킬

### 예시: 격리된 세션

그룹 `120363403215116621@g.us`에 `["alfred", "baerbel"]` 에이전트가 있을 때:

**Alfred의 컨텍스트:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/pascal/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel의 컨텍스트:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/pascal/openclaw-baerbel/
Tools: read only
```

## 모범 사례

### 1. 에이전트 역할을 좁게 유지하기

각 에이전트는 단 하나의 명확한 책임을 갖도록 설계하세요.

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **좋음:** 각 에이전트에 역할이 하나씩 있음  
❌ **나쁨:** 하나의 범용 "dev-helper" 에이전트

### 2. 설명적인 이름 사용

각 에이전트가 무슨 일을 하는지 이름만 봐도 드러나게 하세요.

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 서로 다른 도구 접근 설정

각 에이전트에 필요한 도구만 주세요.

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // 읽기 전용
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // 읽기-쓰기
    }
  }
}
```

### 4. 성능 모니터링

에이전트가 많다면 다음을 고려하세요.

- 속도를 위해 `"strategy": "parallel"`(기본값) 사용
- 그룹당 브로드캐스트 에이전트를 5~10개로 제한
- 단순한 에이전트에는 더 빠른 모델 사용

### 5. 실패를 우아하게 처리하기

에이전트는 서로 독립적으로 실패합니다. 하나의 에러가 다른 에이전트를 막지 않습니다.

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A와 C는 응답하고, Agent B는 오류를 로그에 남김
```

## 호환성

### Providers

현재 브로드캐스트 그룹이 동작하는 채널:

- ✅ WhatsApp (구현됨)
- 🚧 Telegram (계획됨)
- 🚧 Discord (계획됨)
- 🚧 Slack (계획됨)

### 라우팅

브로드캐스트 그룹은 기존 라우팅과 함께 동작합니다.

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: alfred만 응답(일반 라우팅)
- `GROUP_B`: agent1과 agent2가 모두 응답(브로드캐스트)

**우선순위:** `broadcast`가 `bindings`보다 우선합니다.

## 문제 해결

### 에이전트가 응답하지 않음

**확인할 것:**

1. `agents.list`에 agent ID가 존재하는지
2. peer ID 형식이 올바른지(예: `120363403215116621@g.us`)
3. 에이전트가 deny list에 들어 있지 않은지

**디버깅:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 한 에이전트만 응답함

**원인:** peer ID가 `bindings`에는 있지만 `broadcast`에는 없을 수 있습니다.

**해결:** broadcast config에 추가하거나 bindings에서 제거하세요.

### 성능 문제

**에이전트가 많아 느리다면:**

- 그룹당 에이전트 수를 줄이세요.
- 더 가벼운 모델을 쓰세요(opus 대신 sonnet).
- sandbox 시작 시간을 확인하세요.

## 예시

### 예시 1: 코드 리뷰 팀

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**사용자 입력:** 코드 스니펫  
**응답:**

- code-formatter: "들여쓰기를 고치고 type hint를 추가했습니다"
- security-scanner: "⚠️ 12번째 줄에 SQL injection 취약점이 있습니다"
- test-coverage: "커버리지가 45%이며 에러 케이스 테스트가 빠졌습니다"
- docs-checker: "함수 `process_data`에 docstring이 없습니다"

### 예시 2: 다국어 지원

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API reference

### Config schema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 필드

- `strategy` (선택): 에이전트를 어떻게 처리할지
  - `"parallel"` (기본값): 모든 에이전트가 동시에 처리
  - `"sequential"`: 배열 순서대로 처리
- `[peerId]`: WhatsApp group JID, E.164 번호, 또는 기타 peer ID
  - 값: 메시지를 처리해야 하는 agent ID 배열

## 제한 사항

1. **최대 에이전트 수:** 하드 제한은 없지만 10개를 넘기면 느려질 수 있습니다.
2. **공유 컨텍스트:** 에이전트는 서로의 응답을 보지 못합니다(의도된 동작).
3. **메시지 순서:** 병렬 응답은 어떤 순서로든 도착할 수 있습니다.
4. **레이트 리밋:** 모든 에이전트 응답은 WhatsApp rate limit에 함께 반영됩니다.

## 향후 개선

계획된 기능:

- [ ] 공유 컨텍스트 모드(에이전트가 서로의 응답을 볼 수 있게)
- [ ] 에이전트 협업(에이전트끼리 신호 전달)
- [ ] 동적 에이전트 선택(메시지 내용에 따라 에이전트 선택)
- [ ] 에이전트 우선순위(일부 에이전트가 먼저 응답)

## 함께 보기

- [Multi-Agent Configuration](/tools/multi-agent-sandbox-tools)
- [Routing Configuration](/channels/channel-routing)
- [Session Management](/concepts/session)
