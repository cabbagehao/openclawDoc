---
summary: "컨텍스트 창 + compaction: OpenClaw 가 세션을 모델 한도 아래로 유지하는 방법"
read_when:
  - auto-compaction 과 /compact 를 이해하고 싶을 때
  - 긴 세션이 context 한도에 걸리는 문제를 디버깅할 때
title: "Compaction"
---

# Context Window & Compaction

모든 모델에는 **context window** (볼 수 있는 최대 토큰 수)가 있습니다. 오래 지속되는 채팅은 메시지와 tool result 를 계속 축적하므로, 창이 빡빡해지면 OpenClaw 는 한도 안에 머무르기 위해 오래된 기록을 **compact** 합니다.

## compaction 이란

compaction 은 **오래된 대화를 요약** 해서 압축된 summary entry 로 만들고, 최근 메시지는 그대로 둡니다. summary 는 session history 에 저장되므로, 이후 요청은 다음을 사용합니다:

- compaction summary
- compaction 지점 이후의 최근 메시지

compaction 은 session 의 JSONL history 에 **영속 저장** 됩니다.

## Configuration

`openclaw.json` 의 `agents.defaults.compaction` 설정으로 compaction 동작(mode, target tokens 등)을 구성하세요.
compaction summarization 은 기본적으로 opaque identifier 를 보존합니다(`identifierPolicy: "strict"`). 이를 `identifierPolicy: "off"` 로 바꾸거나, `identifierPolicy: "custom"` 과 `identifierInstructions` 로 사용자 정의 텍스트를 줄 수 있습니다.

선택적으로 `agents.defaults.compaction.model` 로 compaction summarization 전용 다른 모델을 지정할 수 있습니다. 기본 모델이 로컬 모델이거나 작은 모델이고, 더 강한 모델로 compaction summary 를 만들고 싶을 때 유용합니다. override 는 어떤 `provider/model-id` 문자열이든 받을 수 있습니다:

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

이는 로컬 모델과도 함께 사용할 수 있습니다. 예를 들어 summarization 전용 두 번째 Ollama 모델이나 fine-tuned compaction specialist 를 지정할 수 있습니다:

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

설정하지 않으면 compaction 은 agent 의 primary model 을 사용합니다.

## Auto-compaction (기본 활성화)

세션이 모델의 context window 에 가까워지거나 초과하면, OpenClaw 는 auto-compaction 을 트리거하고 compact 된 context 로 원래 요청을 재시도할 수 있습니다.

다음과 같이 표시됩니다:

- verbose mode 에서 `🧹 Auto-compaction complete`
- `/status` 에서 `🧹 Compactions: <count>`

compaction 전에 OpenClaw 는 durable note 를 디스크에 저장하기 위한 **silent memory flush** turn 을 실행할 수 있습니다. 자세한 내용과 설정은 [Memory](/concepts/memory) 를 참고하세요.

## Manual compaction

compaction pass 를 강제로 실행하려면 `/compact` (선택적으로 지시문 포함)를 사용하세요:

```
/compact Focus on decisions and open questions
```

## Context window source

context window 는 모델별로 다릅니다. OpenClaw 는 구성된 provider catalog 의 model definition 을 사용해 한도를 결정합니다.

## Compaction vs pruning

- **Compaction**: 요약하여 JSONL 에 **영속 저장**
- **Session pruning**: 오래된 **tool result** 만 request 단위로, **메모리 내에서만** trim

pruning 자세한 내용은 [/concepts/session-pruning](/concepts/session-pruning) 을 참고하세요.

## OpenAI server-side compaction

OpenClaw 는 호환 direct OpenAI 모델에 대해 OpenAI Responses server-side compaction hint 도 지원합니다. 이는 로컬 OpenClaw compaction 과는 별개이며 함께 사용할 수 있습니다.

- Local compaction: OpenClaw 가 요약해서 session JSONL 에 저장
- Server-side compaction: `store` + `context_management` 가 활성화되면 OpenAI 가 provider 측에서 context 를 compact

모델 params 와 override 는 [OpenAI provider](/providers/openai) 를 참고하세요.

## 팁

- 세션이 무거워지거나 stale 하다고 느껴질 때 `/compact` 를 사용하세요.
- 큰 tool output 은 이미 truncate 되지만, pruning 으로 tool-result 누적을 더 줄일 수 있습니다.
- 완전히 새로 시작하려면 `/new` 또는 `/reset` 으로 새 session id 를 만드세요.
