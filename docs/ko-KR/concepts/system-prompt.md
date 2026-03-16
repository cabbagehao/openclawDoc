---
summary: "What the OpenClaw system prompt contains and how it is assembled"
description: "OpenClaw system prompt의 섹션 구성, prompt mode, bootstrap injection, skills/documentation 주입 방식을 설명합니다."
read_when:
  - system prompt text, tool list, time/heartbeat section을 수정할 때
  - workspace bootstrap이나 skills injection 동작을 바꿔야 할 때
title: "System Prompt"
x-i18n:
  source_path: "concepts/system-prompt.md"
---

# System Prompt

OpenClaw는 agent run마다 custom system prompt를 만듭니다. 이 prompt는
**OpenClaw-owned**이며, pi-coding-agent의 default prompt를 사용하지 않습니다.

prompt는 OpenClaw가 조립해서 각 agent run에 inject합니다.

## Structure

prompt는 의도적으로 compact하며 고정된 section을 사용합니다.

- **Tooling**:
  현재 tool list와 짧은 설명
- **Safety**:
  power-seeking behavior나 oversight 우회를 피하라는 짧은 guardrail reminder
- **Skills**
  (있을 때):
  필요 시 skill instruction을 load하는 방법
- **OpenClaw Self-Update**:
  `config.apply`, `update.run` 실행 방법
- **Workspace**:
  working directory
  (`agents.defaults.workspace`)
- **Documentation**:
  local OpenClaw docs path와 언제 읽어야 하는지
- **Workspace Files (injected)**:
  bootstrap file이 아래에 포함된다는 안내
- **Sandbox**
  (활성화 시):
  sandbox runtime, sandbox path, elevated exec 가능 여부
- **Current Date & Time**:
  user local time, timezone, time format
- **Reply Tags**:
  지원 provider용 reply tag syntax
- **Heartbeats**:
  heartbeat prompt와 ack behavior
- **Runtime**:
  host, OS, node, model, repo root
  (감지된 경우), thinking level
- **Reasoning**:
  현재 visibility level과 `/reasoning` toggle hint

system prompt의 safety guardrail은 advisory입니다. model behavior를 유도하지만 policy를
강제하지는 않습니다. 강제는 tool policy, exec approval, sandbox, channel allowlist로
해야 하며, 운영자는 설계상 이를 비활성화할 수도 있습니다.

## Prompt modes

OpenClaw는 sub-agent를 위해 더 작은 system prompt를 렌더링할 수 있습니다.
runtime은 각 run에 대해 user-facing config가 아닌 `promptMode`를 설정합니다.

- `full`
  (기본값):
  위의 모든 section 포함
- `minimal`:
  sub-agent용. **Skills**, **Memory Recall**, **OpenClaw Self-Update**,
  **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**,
  **Silent Replies**, **Heartbeats**를 생략.
  Tooling, **Safety**, Workspace, Sandbox, Current Date & Time
  (알려진 경우), Runtime, injected context는 유지
- `none`:
  base identity line만 반환

`promptMode=minimal`일 때 추가 injected prompt의 label은
**Group Chat Context**가 아니라 **Subagent Context**가 됩니다.

## Workspace bootstrap injection

bootstrap file은 trim된 뒤 **Project Context** 아래에 붙습니다. 그래서 모델은 별도
read 없이 identity와 profile context를 볼 수 있습니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`
  (brand-new workspace일 때만)
- `MEMORY.md` 및/또는 `memory.md`
  (workspace에 존재하면 둘 다 또는 하나만 inject될 수 있음)

이 file들은 모두 **매 turn마다 context window에 inject**되므로 token을 소비합니다.
특히 `MEMORY.md`는 시간이 지나며 커질 수 있으니 짧게 유지하세요.
그렇지 않으면 context usage가 예상보다 커지고 compaction이 더 자주 일어날 수 있습니다.

> **Note:** `memory/*.md`의 daily file은 자동 inject되지 않습니다.
> 필요할 때 `memory_search`와 `memory_get` tool로 읽으므로, 모델이 명시적으로 읽지
> 않는 한 context window를 차지하지 않습니다.

큰 file은 marker와 함께 잘립니다. file당 최대 크기는
`agents.defaults.bootstrapMaxChars`
(기본값 20000)이고, 전체 injected bootstrap content의 합계는
`agents.defaults.bootstrapTotalMaxChars`
(기본값 150000)로 제한됩니다.
누락된 file은 짧은 missing-file marker를 inject합니다.
truncation이 발생하면 OpenClaw는 Project Context에 warning block을 inject할 수 있고,
이는 `agents.defaults.bootstrapPromptTruncationWarning`
(`off`, `once`, `always`; 기본값 `once`)로 제어합니다.

sub-agent session은 context를 작게 유지하기 위해 `AGENTS.md`와 `TOOLS.md`만
inject합니다
(다른 bootstrap file은 filter out).

internal hook은 `agent:bootstrap`에서 이 단계를 가로채 bootstrap file을 mutate하거나
교체할 수 있습니다. 예를 들어 `SOUL.md`를 다른 persona로 바꾸는 식입니다.

각 injected file의 기여량
(raw vs injected, truncation, tool schema overhead 포함)을 보려면
`/context list` 또는 `/context detail`을 사용하세요.
[Context](/concepts/context)도 참고하세요.

## Time handling

user timezone이 알려져 있으면 system prompt에 dedicated
**Current Date & Time** section이 포함됩니다.
다만 prompt를 cache-stable하게 유지하기 위해 이제는 **timezone만** 포함하고,
동적인 clock이나 time format은 넣지 않습니다.

agent가 현재 시각이 필요하면 `session_status`를 사용하세요.
status card에는 timestamp line이 포함됩니다.

설정:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`
  (`auto` | `12` | `24`)

전체 동작은 [Date & Time](/date-time)을 참고하세요.

## Skills

eligible skill이 있으면 OpenClaw는 compact한 **available skills list**
(`formatSkillsForPrompt`)를 inject하며, 각 skill의 **file path**를 함께 포함합니다.
prompt는 모델에게 listed location의 `SKILL.md`를 `read`로 load하라고 지시합니다
(workspace, managed, bundled location 모두 가능).
eligible skill이 없으면 Skills section은 생략됩니다.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이 방식은 base prompt를 작게 유지하면서도 필요한 skill만 targeted하게 사용할 수 있게
해줍니다.

## Documentation

가능한 경우 system prompt는 **Documentation** section을 포함하며,
local OpenClaw docs directory
(repo workspace의 `docs/` 또는 bundled npm package docs)를 가리킵니다.
또 public mirror, source repo, community Discord, skill discovery용
ClawHub
([https://clawhub.com](https://clawhub.com))도 함께 언급합니다.

prompt는 모델에게 OpenClaw behavior, command, configuration, architecture를 알아야 할
때 local docs를 먼저 참고하라고 지시합니다. 가능하다면 `openclaw status`도 agent
스스로 실행하고, 접근 권한이 없을 때만 user에게 물어보도록 유도합니다.
