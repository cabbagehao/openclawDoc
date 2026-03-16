---
summary: "하나의 WhatsApp 채팅에서 여러 에이전트가 동시에 응답하도록 구성하는 Broadcast Groups"
description: "Broadcast Groups를 사용해 WhatsApp 그룹이나 DM에서 여러 에이전트를 함께 실행하는 방법과 설정, 동작 방식, 제한 사항을 설명합니다."
read_when:
  - broadcast groups를 구성할 때
  - WhatsApp에서 multi-agent 응답을 디버깅할 때
status: experimental
title: "Broadcast Groups"
x-i18n:
  source_path: "channels/broadcast-groups.md"
---

# Broadcast Groups

**Status:** Experimental
**Version:** 2026.1.9에 추가됨

## 개요

Broadcast Groups를 사용하면 여러 에이전트가 동일한 메시지를 동시에 처리하고 응답할 수 있습니다. 이를 통해 하나의 WhatsApp 그룹이나 DM에서 하나의 전화번호만 사용하면서, 함께 동작하는 특화된 에이전트 팀을 구성할 수 있습니다.

현재 범위: **WhatsApp only** (web channel).

Broadcast groups는 channel allowlists와 group activation rules가 평가된 뒤 적용됩니다. WhatsApp 그룹에서는 OpenClaw가 원래 응답했을 상황에서 broadcast가 실행된다는 뜻입니다. 예를 들어 group settings에 따라 mention이 있을 때 실행됩니다.

## 사용 사례

### 1. Specialized Agent Teams

원자적이고 집중된 책임을 가진 여러 에이전트를 배치할 수 있습니다.

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

각 에이전트는 같은 메시지를 처리하면서도 자신만의 전문적인 관점을 제공합니다.

### 2. Multi-Language Support

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Quality Assurance Workflows

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Task Automation

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Configuration

### Basic Setup

최상위에 `broadcast` 섹션을 추가합니다(`bindings` 옆). 키는 WhatsApp peer id입니다.

- group chats: group JID (예: `120363403215116621@g.us`)
- DMs: E.164 phone number (예: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Result:** OpenClaw가 이 채팅에 응답해야 할 때 세 에이전트를 모두 실행합니다.

### Processing Strategy

에이전트가 메시지를 처리하는 방식을 제어할 수 있습니다.

#### Parallel (Default)

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

에이전트가 순서대로 처리합니다. 앞선 에이전트가 끝날 때까지 다음 에이전트는 기다립니다.

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Complete Example

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

## How It Works

### Message Flow

1. **Incoming message**가 WhatsApp 그룹에 도착합니다.
2. **Broadcast check**: 시스템이 peer ID가 `broadcast`에 있는지 확인합니다.
3. **If in broadcast list**:
   - 나열된 모든 에이전트가 메시지를 처리합니다.
   - 각 에이전트는 자신만의 session key와 격리된 context를 가집니다.
   - 에이전트는 parallel(기본값) 또는 sequential로 처리합니다.
4. **If not in broadcast list**:
   - 일반 routing이 적용됩니다(처음 매칭되는 binding).

참고: broadcast groups는 channel allowlists나 group activation rules(mentions/commands 등)를 우회하지 않습니다. 메시지를 처리할 자격이 생겼을 때 _어떤 에이전트가 실행되는지_ 만 바꿉니다.

### Session Isolation

Broadcast group의 각 에이전트는 다음을 완전히 분리해서 유지합니다.

- **Session keys** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Conversation history** (에이전트는 다른 에이전트의 메시지를 보지 못함)
- **Workspace** (설정된 경우 별도 sandbox)
- **Tool access** (서로 다른 allow/deny lists)
- **Memory/context** (별도의 `IDENTITY.md`, `SOUL.md` 등)
- **Group context buffer** (context에 사용되는 최근 그룹 메시지)는 peer 단위로 공유되므로, trigger될 때 모든 broadcast agent가 같은 context를 봄

이 덕분에 각 에이전트는 다음처럼 다르게 구성될 수 있습니다.

- 서로 다른 personality
- 서로 다른 tool access(예: read-only vs. read-write)
- 서로 다른 models(예: opus vs. sonnet)
- 서로 다른 installed skills

### Example: Isolated Sessions

그룹 `120363403215116621@g.us`에 `["alfred", "baerbel"]` 에이전트가 있을 때:

**Alfred's context:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/pascal/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel's context:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/pascal/openclaw-baerbel/
Tools: read only
```

## Best Practices

### 1. Keep Agents Focused

각 에이전트는 단일하고 명확한 책임을 갖도록 설계합니다.

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Good:** 각 에이전트에 작업 하나만 부여
❌ **Bad:** 범용 `"dev-helper"` 에이전트 하나에 모두 맡기기

### 2. Use Descriptive Names

각 에이전트가 무엇을 하는지 이름만 봐도 분명해야 합니다.

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Configure Different Tool Access

각 에이전트에는 필요한 도구만 부여합니다.

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Read-only
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
    }
  }
}
```

### 4. Monitor Performance

에이전트가 많다면 다음을 고려합니다.

- 속도를 위해 `"strategy": "parallel"`(기본값) 사용
- broadcast group당 에이전트 수를 5-10개로 제한
- 더 단순한 에이전트에는 더 빠른 model 사용

### 5. Handle Failures Gracefully

에이전트는 서로 독립적으로 실패합니다. 하나의 에이전트 오류가 다른 에이전트를 막지 않습니다.

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Compatibility

### Providers

Broadcast groups는 현재 다음 provider에서 동작합니다.

- ✅ WhatsApp (implemented)
- 🚧 Telegram (planned)
- 🚧 Discord (planned)
- 🚧 Slack (planned)

### Routing

Broadcast groups는 기존 routing과 함께 동작합니다.

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

- `GROUP_A`: alfred만 응답함(일반 routing)
- `GROUP_B`: agent1과 agent2가 모두 응답함(broadcast)

**Precedence:** `broadcast`가 `bindings`보다 우선합니다.

## Troubleshooting

### Agents Not Responding

**Check:**

1. agent ID가 `agents.list`에 존재하는지
2. peer ID 형식이 올바른지(예: `120363403215116621@g.us`)
3. agents가 deny lists에 들어가 있지 않은지

**Debug:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Only One Agent Responding

**Cause:** peer ID가 `bindings`에는 있지만 `broadcast`에는 없을 수 있습니다.

**Fix:** broadcast config에 추가하거나 bindings에서 제거합니다.

### Performance Issues

**If slow with many agents:**

- 그룹당 에이전트 수를 줄입니다
- 더 가벼운 models를 사용합니다(opus 대신 sonnet)
- sandbox startup time을 확인합니다

## Examples

### Example 1: Code Review Team

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

**User sends:** Code snippet
**Responses:**

- code-formatter: "Fixed indentation and added type hints"
- security-scanner: "⚠️ SQL injection vulnerability in line 12"
- test-coverage: "Coverage is 45%, missing tests for error cases"
- docs-checker: "Missing docstring for function `process_data`"

### Example 2: Multi-Language Support

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

## API Reference

### Config Schema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Fields

- `strategy` (optional): 에이전트 처리 방식
  - `"parallel"` (default): 모든 에이전트가 동시에 처리
  - `"sequential"`: 배열 순서대로 에이전트 처리
- `[peerId]`: WhatsApp group JID, E.164 number, 또는 다른 peer ID
  - 값: 메시지를 처리해야 하는 agent ID 배열

## Limitations

1. **Max agents:** 하드 제한은 없지만 10개를 넘으면 느릴 수 있습니다
2. **Shared context:** 에이전트는 서로의 응답을 보지 못합니다(의도된 설계)
3. **Message ordering:** parallel 응답은 어떤 순서로든 도착할 수 있습니다
4. **Rate limits:** 모든 에이전트가 WhatsApp rate limits에 함께 반영됩니다

## Future Enhancements

계획된 기능:

- [ ] Shared context mode (에이전트가 서로의 응답을 볼 수 있음)
- [ ] Agent coordination (에이전트끼리 신호를 주고받을 수 있음)
- [ ] Dynamic agent selection (메시지 내용에 따라 에이전트를 선택)
- [ ] Agent priorities (일부 에이전트가 다른 에이전트보다 먼저 응답)

## See Also

- [Multi-Agent Configuration](/tools/multi-agent-sandbox-tools)
- [Routing Configuration](/channels/channel-routing)
- [Session Management](/concepts/session)
