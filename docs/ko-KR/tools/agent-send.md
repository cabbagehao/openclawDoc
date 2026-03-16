---
summary: "채팅 유입 없이 `openclaw agent`로 직접 agent turn을 실행하는 방법을 설명합니다."
description: "OpenClaw에서 `openclaw agent` 명령으로 session을 지정해 직접 agent를 실행하고, 선택적으로 채널로 다시 전달하는 방법을 안내합니다."
read_when:
  - agent CLI 진입점을 추가하거나 수정할 때
title: "Agent Send"
x-i18n:
  source_path: "tools/agent-send.md"
---

# `openclaw agent` (직접 agent 실행)

`openclaw agent`는 들어오는 채팅 메시지 없이 단일 agent turn을 실행합니다.
기본적으로는 **Gateway를 통해** 실행되며, 현재 머신의 embedded runtime을 강제하려면 `--local`을 추가하세요.

## 동작

- 필수: `--message <text>`
- 세션 선택:
  - `--to <dest>`가 session key를 유도합니다. group/channel target은 격리를 유지하고, direct chat은 `main`으로 합쳐집니다. **또는**
  - `--session-id <id>`로 기존 session id를 재사용, **또는**
  - `--agent <id>`로 구성된 agent를 직접 지정. 이 경우 해당 agent의 `main` session key를 사용합니다.
- 일반 inbound reply와 같은 embedded agent runtime을 실행합니다.
- thinking/verbose flag는 session store에 유지됩니다.
- 출력:
  - 기본값: 답장 텍스트 출력(추가로 `MEDIA:<url>` 줄)
  - `--json`: 구조화된 payload + metadata 출력
- `--deliver` + `--channel`로 선택한 channel에 reply를 다시 전달할 수 있습니다. target 형식은 `openclaw message --target`과 같습니다.
- session을 바꾸지 않고 delivery만 override하려면 `--reply-channel`/`--reply-to`/`--reply-account`를 사용하세요.

Gateway에 연결할 수 없으면 CLI는 **embedded local run으로 fallback**합니다.

## 예시

```bash
openclaw agent --to +15555550123 --message "status update"
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --to +15555550123 --message "Summon reply" --deliver
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## Flags

- `--local`: 로컬에서 실행(셸에 model provider API key 필요)
- `--deliver`: 선택한 channel로 reply 전송
- `--channel`: 전달 채널 (`whatsapp|telegram|discord|googlechat|slack|signal|imessage`, 기본값: `whatsapp`)
- `--reply-to`: delivery target override
- `--reply-channel`: delivery channel override
- `--reply-account`: delivery account id override
- `--thinking <off|minimal|low|medium|high|xhigh>`: thinking level 유지(GPT-5.2 + Codex 모델만)
- `--verbose <on|full|off>`: verbose level 유지
- `--timeout <seconds>`: agent timeout override
- `--json`: 구조화된 JSON 출력
