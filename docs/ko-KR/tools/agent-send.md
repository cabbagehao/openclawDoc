---
summary: "직접 `openclaw agent` CLI 실행(선택적 전달 포함)"
read_when:
  - agent CLI 진입점을 추가하거나 수정할 때
title: "Agent Send"
---

# `openclaw agent` (직접 agent 실행)

`openclaw agent` 는 들어오는 채팅 메시지 없이 단일 agent 턴을 실행합니다.
기본적으로는 **Gateway 를 통해** 실행되며, 현재 머신의 embedded
runtime 을 강제하려면 `--local` 을 추가하세요.

## 동작

- 필수: `--message <text>`
- 세션 선택:
  - `--to <dest>` 가 session key 를 유도합니다(그룹/채널 대상은 격리를 유지하고, direct chat 은 `main` 으로 합쳐짐), **또는**
  - `--session-id <id>` 로 기존 세션 id 를 재사용, **또는**
  - `--agent <id>` 로 구성된 agent 를 직접 지정(그 agent 의 `main` session key 사용)
- 일반 인바운드 답장과 같은 embedded agent runtime 을 실행합니다.
- thinking/verbose 플래그는 세션 저장소에 유지됩니다.
- 출력:
  - 기본값: 답장 텍스트 출력(추가로 `MEDIA:<url>` 줄)
  - `--json`: 구조화된 payload + metadata 출력
- `--deliver` + `--channel` 로 선택한 채널에 답장을 다시 전달할 수 있습니다(대상 형식은 `openclaw message --target` 과 동일).
- 세션을 바꾸지 않고 전달을 덮어쓰려면 `--reply-channel`/`--reply-to`/`--reply-account` 를 사용하세요.

Gateway 에 연결할 수 없으면, CLI 는 **embedded local run 으로 폴백** 합니다.

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
- `--deliver`: 선택한 채널로 답장 전송
- `--channel`: 전달 채널 (`whatsapp|telegram|discord|googlechat|slack|signal|imessage`, 기본값: `whatsapp`)
- `--reply-to`: 전달 대상 재정의
- `--reply-channel`: 전달 채널 재정의
- `--reply-account`: 전달 account id 재정의
- `--thinking <off|minimal|low|medium|high|xhigh>`: thinking level 유지(GPT-5.2 + Codex 모델만)
- `--verbose <on|full|off>`: verbose level 유지
- `--timeout <seconds>`: agent timeout 재정의
- `--json`: 구조화된 JSON 출력
