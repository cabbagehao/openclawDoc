---
summary: "OpenClaw system prompt 에 무엇이 포함되고 어떻게 조립되는지"
read_when:
  - system prompt 텍스트, tools list, time/heartbeat section 을 편집할 때
  - workspace bootstrap 또는 skills injection 동작을 바꿀 때
title: "System Prompt"
---

# System Prompt

OpenClaw 는 각 agent run 마다 맞춤 system prompt 를 만듭니다. 이 prompt 는 **OpenClaw 가 소유** 하며 pi-coding-agent 의 기본 prompt 를 사용하지 않습니다.

prompt 는 OpenClaw 가 조립하여 각 agent run 에 주입합니다.

## Structure

prompt 는 의도적으로 간결하며 고정된 section 을 사용합니다:

- **Tooling**: 현재 tool 목록 + 짧은 설명
- **Safety**: 권력 추구 행동이나 감독 우회를 피하라는 짧은 guardrail 알림
- **Skills** (사용 가능한 경우): 필요 시 skill instruction 을 로드하는 방법 안내
- **OpenClaw Self-Update**: `config.apply` 와 `update.run` 실행 방법
- **Workspace**: 작업 디렉터리 (`agents.defaults.workspace`)
- **Documentation**: OpenClaw docs 의 로컬 경로(repo 또는 npm package)와 언제 읽어야 하는지
- **Workspace Files (injected)**: 아래에 bootstrap file 이 포함됨을 알림
- **Sandbox** (활성 시): sandboxed runtime, sandbox path, elevated exec 가능 여부
- **Current Date & Time**: 사용자 로컬 시간, timezone, time format
- **Reply Tags**: 지원 provider 용 선택적 reply tag 문법
- **Heartbeats**: heartbeat prompt 와 ack 동작
- **Runtime**: host, OS, node, model, repo root (감지된 경우), thinking level (한 줄)
- **Reasoning**: 현재 visibility level + /reasoning toggle 힌트

system prompt 의 safety guardrail 은 advisory 입니다. 모델 동작을 유도할 뿐 정책을 강제하지는 않습니다. 강제에는 tool policy, exec approvals, sandboxing, channel allowlist 를 사용하세요. 운영자는 설계상 이것들을 비활성화할 수 있습니다.

## Prompt modes

OpenClaw 는 sub-agent 를 위해 더 작은 system prompt 도 렌더링할 수 있습니다. runtime 은 각 run 에 대해 `promptMode` 를 설정합니다(사용자용 config 아님):

- `full` (기본): 위의 모든 section 포함
- `minimal`: sub-agent 용; **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies**, **Heartbeats** 를 생략. Tooling, **Safety**, Workspace, Sandbox, Current Date & Time (알려진 경우), Runtime, injected context 는 유지
- `none`: 기본 identity line 만 반환

`promptMode=minimal` 일 때, 추가 injected prompt 는 **Group Chat Context** 대신 **Subagent Context** 라벨을 사용합니다.

## Workspace bootstrap injection

bootstrap file 은 잘린 뒤 **Project Context** 아래에 추가되어, 모델이 명시적으로 읽지 않아도 identity 와 profile context 를 볼 수 있게 합니다:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (새 워크스페이스에서만)
- `MEMORY.md` 및/또는 `memory.md` (워크스페이스에 있으면, 둘 중 하나 또는 둘 다 주입될 수 있음)

이 파일들은 모두 매 턴 **context window 에 주입** 되므로 토큰을 소비합니다. 특히 시간이 지나며 커질 수 있는 `MEMORY.md` 는 간결하게 유지하세요. 그렇지 않으면 context usage 가 예상보다 커지고 compaction 이 더 자주 발생할 수 있습니다.

> **Note:** `memory/*.md` 일일 파일은 자동 주입되지 않습니다. 필요 시 `memory_search` 와 `memory_get` tool 로 접근하므로, 모델이 명시적으로 읽지 않는 한 context window 를 차지하지 않습니다.

큰 파일은 marker 와 함께 잘립니다. 파일별 최대 크기는 `agents.defaults.bootstrapMaxChars` (기본값: 20000)로 제어됩니다. 파일 전체에 걸친 총 injected bootstrap content 는 `agents.defaults.bootstrapTotalMaxChars` (기본값: 150000)로 제한됩니다. 없는 파일은 짧은 missing-file marker 를 주입합니다. truncation 이 발생하면 OpenClaw 는 Project Context 에 warning block 을 주입할 수 있으며, 이는 `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; 기본값: `once`)로 제어합니다.

sub-agent session 은 `AGENTS.md` 와 `TOOLS.md` 만 주입합니다(다른 bootstrap file 은 sub-agent context 를 작게 유지하기 위해 제외).

internal hook 는 `agent:bootstrap` 단계에 개입하여 injected bootstrap file 을 수정하거나 대체할 수 있습니다(예: `SOUL.md` 를 다른 persona 로 바꾸기).

각 injected file 이 얼마나 기여하는지(raw vs injected, truncation, tool schema overhead 포함) 보려면 `/context list` 또는 `/context detail` 을 사용하세요. [Context](/concepts/context) 참고.

## Time handling

사용자 timezone 을 알 수 있으면 system prompt 에 전용 **Current Date & Time** section 이 포함됩니다. prompt cache 안정성을 유지하기 위해 이제는 **time zone** 만 포함하고 동적인 clock 이나 time format 은 포함하지 않습니다.

agent 가 현재 시간이 필요하면 `session_status` 를 사용하세요. status card 에 timestamp line 이 포함됩니다.

구성 키:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작은 [Date & Time](/date-time) 을 참고하세요.

## Skills

사용 가능한 skill 이 있으면, OpenClaw 는 각 skill 의 **file path** 를 포함한 간결한 **available skills list** (`formatSkillsForPrompt`)를 주입합니다. prompt 는 모델에게 listed location(workspace, managed, bundled)의 SKILL.md 를 `read` 로 로드하라고 지시합니다. eligible skill 이 없으면 Skills section 은 생략됩니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이렇게 하면 base prompt 는 작게 유지하면서도, 필요한 경우 목표 지향적인 skill 사용이 가능합니다.

## Documentation

가능한 경우 system prompt 는 로컬 OpenClaw docs 디렉터리(repo workspace 의 `docs/` 또는 번들된 npm package docs)를 가리키는 **Documentation** section 을 포함합니다. 또한 public mirror, source repo, community Discord, skills discovery 용 ClawHub ([https://clawhub.com](https://clawhub.com))도 함께 언급합니다. prompt 는 OpenClaw 동작, 명령, 설정, 아키텍처에 대해서는 먼저 로컬 docs 를 참고하라고 지시하며, 가능하면 스스로 `openclaw status` 를 실행하고 액세스가 없을 때만 사용자에게 묻도록 안내합니다.
