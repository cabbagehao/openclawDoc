---
summary: "Context: what the model sees, how it is built, and how to inspect it"
description: "모델이 실제로 보는 context와 system prompt 구성 방식, context 점검 방법을 설명합니다."
read_when:
  - OpenClaw에서 context가 정확히 무엇을 뜻하는지 이해하고 싶을 때
  - 모델이 무엇을 알고 있거나 왜 잊었는지 디버깅할 때
  - context overhead를 줄이고 싶을 때
title: "Context"
x-i18n:
  source_path: "concepts/context.md"
---

# Context

“Context”는 **한 번의 run을 위해 OpenClaw가 모델에 보내는 모든 것**입니다.
이 양은 model의 **context window**(token limit)에 의해 제한됩니다.

초보자용 mental model:

- **System prompt** (OpenClaw가 구성): rule, tool, skill list, time/runtime, inject된 workspace file
- **Conversation history**: 이 session의 사용자 message와 assistant message
- **Tool call/result + attachment**: command output, file read, image/audio 등

context는 “memory”와 같은 것이 아닙니다.
memory는 disk에 저장되었다가 나중에 다시 로드될 수 있지만,
context는 현재 모델 window 안에 들어 있는 데이터입니다.

## Quick start (inspect context)

- `/status` → “내 window가 얼마나 찼나?”를 빠르게 확인 + session setting 확인
- `/context list` → 무엇이 inject되는지와 대략적인 size (file별 + total)
- `/context detail` → file별, tool schema별, skill entry별, system prompt 크기까지 더 상세한 breakdown
- `/usage tokens` → 일반 답변 하단에 reply별 usage footer 추가
- `/compact` → 오래된 history를 compact entry로 요약해 window 공간 확보

참고: [Slash commands](/tools/slash-commands), [Token use & costs](/reference/token-use), [Compaction](/concepts/compaction)

## Example output

값은 model, provider, tool policy, workspace 내용에 따라 달라집니다.

### `/context list`

```text
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```text
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## What counts toward the context window

모델이 받는 모든 것이 context window에 포함됩니다.

- system prompt (모든 section)
- conversation history
- tool call + tool result
- attachment/transcript (image/audio/file)
- compaction summary와 pruning artifact
- provider wrapper나 숨겨진 header (보이지 않아도 count됨)

## How OpenClaw builds the system prompt

system prompt는 **OpenClaw 소유**이며 run마다 다시 만들어집니다.
포함 항목:

- tool list와 짧은 description
- skill list (metadata only, 아래 참고)
- workspace location
- time (UTC + 설정된 경우 user time)
- runtime metadata (host/OS/model/thinking)
- **Project Context** 아래에 주입된 workspace bootstrap file

전체 breakdown: [System Prompt](/concepts/system-prompt)

## Injected workspace files (Project Context)

기본적으로 OpenClaw는 다음 workspace file을 inject합니다. (존재하는 경우)

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (first-run only)

큰 file은 `agents.defaults.bootstrapMaxChars`(기본값 `20000` chars)로 file별 truncate됩니다.
또한 OpenClaw는 file 전체 합계에 대해 `agents.defaults.bootstrapTotalMaxChars`(기본값 `150000` chars)를 적용합니다.
`/context`는 **raw vs injected** size와 truncation 여부를 보여 줍니다.

truncation이 발생하면 runtime은 Project Context 아래에 warning block을 inject할 수 있습니다.
이는 `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`, 기본값 `once`)으로 조절합니다.

## Skills: what’s injected vs loaded on-demand

system prompt에는 compact한 **skills list**만 포함됩니다. (name + description + location)
이 목록도 실제 overhead를 차지합니다.

skill instruction 본문은 기본적으로 포함되지 않습니다.
모델은 필요할 때만 skill의 `SKILL.md`를 `read` 하도록 설계되어 있습니다.

## Tools: there are two costs

tool은 context에 두 방식으로 영향을 줍니다.

1. system prompt 안의 **tool list text** (`Tooling`으로 보이는 부분)
2. **tool schema** (JSON). 모델이 tool을 호출할 수 있도록 함께 전송되며, plain text로 보이지 않아도 context를 차지합니다.

`/context detail`은 가장 큰 tool schema를 분해해서 무엇이 overhead를 지배하는지 보여 줍니다.

## Commands, directives, and “inline shortcuts”

slash command는 Gateway가 처리합니다. 동작 방식은 몇 가지로 나뉩니다.

- **Standalone command**: message가 `/...`만으로 구성되면 command로 실행
- **Directive**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue`는 모델이 보기 전에 제거됨
  - directive-only message는 session setting을 지속시킴
  - 일반 message 안의 inline directive는 per-message hint로 동작
- **Inline shortcut** (allowlisted sender만): 일반 message 안의 특정 `/...` token은 즉시 실행될 수 있으며(예: “hey /status”), 남은 text만 모델에 전달됨

자세한 내용: [Slash commands](/tools/slash-commands)

## Sessions, compaction, and pruning (what persists)

무엇이 message 사이에 유지되는지는 메커니즘마다 다릅니다.

- **Normal history**는 policy에 따라 compact/prune되기 전까지 transcript에 남습니다.
- **Compaction**은 summary를 transcript에 영구 저장하고 recent message는 유지합니다.
- **Pruning**은 한 run의 _in-memory_ prompt에서 오래된 tool result를 제거하지만 transcript를 다시 쓰지 않습니다.

문서: [Session](/concepts/session), [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning)

기본적으로 OpenClaw는 조립과 compaction에 built-in `legacy` context engine을 사용합니다.
`kind: "context-engine"`을 제공하는 plugin을 설치하고 `plugins.slots.contextEngine`으로 선택하면,
OpenClaw는 context assembly, `/compact`, 그리고 관련 subagent context lifecycle hook을 그 engine에 위임합니다.

## What `/context` actually reports

`/context`는 가능하면 최신 **run-built** system prompt report를 사용합니다.

- `System prompt (run)` = 마지막 embedded (tool-capable) run에서 캡처되어 session store에 저장된 값
- `System prompt (estimate)` = run report가 없을 때, 또는 CLI backend처럼 report를 생성하지 않는 경로에서 즉석 계산한 값

어느 경우든 size와 top contributor를 보고할 뿐, 전체 system prompt나 tool schema 전문을 덤프하지는 않습니다.
