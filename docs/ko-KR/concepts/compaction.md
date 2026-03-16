---
summary: "Context window + compaction: how OpenClaw keeps sessions under model limits"
description: "긴 session이 model context limit에 가까워질 때 OpenClaw가 auto-compaction과 manual compaction으로 window를 관리하는 방식을 설명합니다."
read_when:
  - auto-compaction과 `/compact` 동작을 이해하고 싶을 때
  - 긴 session이 context limit에 부딪히는 문제를 디버깅할 때
title: "Compaction"
x-i18n:
  source_path: "concepts/compaction.md"
---

# Context Window & Compaction

모든 model에는 **context window**가 있습니다. (볼 수 있는 최대 token 수)
오래 실행되는 chat은 message와 tool result가 누적되고, window가 빡빡해지면
OpenClaw는 오래된 history를 **compaction**하여 limit 안에 머무릅니다.

## What compaction is

compaction은 **오래된 대화 내용을 요약**하여 compact summary entry로 만들고,
최근 message는 그대로 유지합니다. 이후 요청은 다음을 사용합니다.

- compaction summary
- compaction 시점 이후의 recent message

compaction은 session의 JSONL history에 **영구 저장**됩니다.

## Configuration

`openclaw.json`의 `agents.defaults.compaction`으로 compaction 동작(mode, target token 등)을 설정합니다.
기본적으로 compaction 요약은 opaque identifier를 보존합니다. (`identifierPolicy: "strict"`)
필요하면 `identifierPolicy: "off"`로 끄거나, `identifierPolicy: "custom"`과 `identifierInstructions`로 custom text를 줄 수 있습니다.

compaction 요약용 model을 별도로 지정할 수도 있습니다. (`agents.defaults.compaction.model`)
primary model이 local model이거나 작은 model일 때 더 강한 model로 요약하게 하고 싶다면 유용합니다.
override는 임의의 `provider/model-id` string을 받습니다.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-5"
      }
    }
  }
}
```

local model도 사용할 수 있습니다. 예를 들어 요약 전용 Ollama model이나 fine-tuned compaction specialist:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

설정하지 않으면 agent의 primary model을 사용합니다.

## Auto-compaction (default on)

session이 model context window에 근접하거나 초과하면, OpenClaw는 auto-compaction을 실행하고
compacted context로 원래 요청을 다시 시도할 수 있습니다.

다음에서 확인할 수 있습니다.

- verbose mode: `🧹 Auto-compaction complete`
- `/status`: `🧹 Compactions: <count>`

compaction 전에 OpenClaw는 durable note를 disk에 저장하기 위한 **silent memory flush** turn을 실행할 수 있습니다.
자세한 내용과 config는 [Memory](/concepts/memory)를 참고하세요.

## Manual compaction

`/compact`를 사용하면 강제로 compaction을 실행할 수 있습니다. instruction을 덧붙일 수도 있습니다.

```text
/compact Focus on decisions and open questions
```

## Context window source

context window 크기는 model별로 다릅니다.
OpenClaw는 configured provider catalog의 model definition을 사용해 limit를 결정합니다.

## Compaction vs pruning

- **Compaction**: 요약하고 JSONL에 **영구 저장**
- **Session pruning**: 오래된 **tool result**만 request별로 **in-memory** trim

pruning 상세 내용은 [/concepts/session-pruning](/concepts/session-pruning)을 참고하세요.

## OpenAI server-side compaction

OpenClaw는 direct OpenAI model 중 호환되는 경우 OpenAI Responses의 server-side compaction hint도 지원합니다.
이것은 local OpenClaw compaction과 별개이며 함께 사용할 수 있습니다.

- Local compaction: OpenClaw가 요약하고 session JSONL에 저장
- Server-side compaction: `store` + `context_management`가 켜져 있을 때 provider 측에서 context를 압축

model parameter와 override는 [OpenAI provider](/providers/openai)를 참고하세요.

## Tips

- session이 stale하게 느껴지거나 context가 너무 부풀면 `/compact`를 사용하세요.
- 큰 tool output은 이미 truncate되며, pruning은 tool-result 누적을 더 줄여 줍니다.
- 완전히 새로 시작하고 싶으면 `/new` 또는 `/reset`으로 새 session id를 시작하세요.
