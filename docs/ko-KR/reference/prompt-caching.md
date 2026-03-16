---
title: "Prompt Caching"
description: prompt cache 재사용을 높이기 위한 cacheRetention, cache-ttl pruning, heartbeat, provider별 동작을 정리한 레퍼런스입니다.
summary: "프롬프트 캐싱 관련 설정, 병합 순서, provider 동작, 튜닝 패턴"
read_when:
  - cache retention으로 프롬프트 토큰 비용을 줄이고 싶을 때
  - multi-agent 구성에서 agent별 cache 동작이 필요할 때
  - heartbeat와 cache-ttl pruning을 함께 조정할 때
x-i18n:
  source_path: "reference/prompt-caching.md"
---

# Prompt caching

프롬프트 캐싱은 모델 provider가 매 턴마다 바뀌지 않는 프롬프트 접두부(보통 system/developer 지시와 기타 안정적인 컨텍스트)를 다시 처리하지 않고 재사용할 수 있게 하는 기능입니다. 처음 일치하는 요청은 cache token을 기록(`cacheWrite`)하고, 이후 일치하는 요청은 이를 다시 읽어옵니다(`cacheRead`).

왜 중요한가: 토큰 비용이 줄고, 응답이 빨라지며, 장기 세션에서 성능이 더 예측 가능해집니다. 캐싱이 없으면 입력 대부분이 같아도 반복 프롬프트는 매 턴 전체 프롬프트 비용을 계속 지불하게 됩니다.

이 페이지는 프롬프트 재사용과 토큰 비용에 영향을 주는 모든 cache 관련 설정을 다룹니다.

Anthropic 가격 정책은 다음 문서를 참고하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

## Primary knobs

### `cacheRetention` (model and per-agent)

model params에 cache retention을 설정합니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

agent별 override:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

config 병합 순서:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (일치하는 agent id, 키 단위 override)

### Legacy `cacheControlTtl`

레거시 값도 여전히 허용되며 다음과 같이 매핑됩니다.

- `5m` -> `short`
- `1h` -> `long`

새 설정에는 `cacheRetention`을 권장합니다.

### `contextPruning.mode: "cache-ttl"`

cache TTL 창이 지난 뒤 오래된 tool-result 컨텍스트를 prune하여, 유휴 이후 요청이 너무 큰 history를 다시 캐시하지 않도록 합니다.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

전체 동작은 [Session Pruning](/concepts/session-pruning)을 참고하세요.

### Heartbeat keep-warm

Heartbeat는 cache window를 따뜻하게 유지해, 유휴 구간 이후 반복적인 cache write를 줄일 수 있습니다.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

agent별 heartbeat는 `agents.list[].heartbeat`에서 지원합니다.

## Provider behavior

### Anthropic (direct API)

- `cacheRetention`을 지원합니다.
- Anthropic API-key auth profile을 사용할 때, OpenClaw는 값이 비어 있으면 Anthropic model ref에 대해 `cacheRetention: "short"`를 기본으로 채웁니다.

### Amazon Bedrock

- Anthropic Claude model ref(`amazon-bedrock/*anthropic.claude*`)는 명시적인 `cacheRetention` pass-through를 지원합니다.
- Anthropic이 아닌 Bedrock model은 런타임에 `cacheRetention: "none"`으로 강제됩니다.

### OpenRouter Anthropic models

`openrouter/anthropic/*` model ref의 경우, OpenClaw는 프롬프트 캐시 재사용을 높이기 위해 system/developer prompt block에 Anthropic `cache_control`을 주입합니다.

### Other providers

provider가 이 cache mode를 지원하지 않으면 `cacheRetention`은 아무 효과가 없습니다.

## Tuning patterns

### Mixed traffic (recommended default)

main agent에는 장기 baseline을 유지하고, bursty notifier agent에서는 캐싱을 끕니다.

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Cost-first baseline

- 기본 `cacheRetention: "short"` 설정
- `contextPruning.mode: "cache-ttl"` 활성화
- warm cache가 실제 이득이 있는 agent에만 heartbeat를 TTL 이하로 설정

## Cache diagnostics

OpenClaw는 embedded agent 실행을 위한 전용 cache-trace 진단 기능을 제공합니다.

### `diagnostics.cacheTrace` config

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

기본값:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env toggles (one-off debugging)

- `OPENCLAW_CACHE_TRACE=1` enables cache tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` overrides output path.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` toggles full message payload capture.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` toggles prompt text capture.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` toggles system prompt capture.

### What to inspect

- cache trace 이벤트는 JSONL이며 `session:loaded`, `prompt:before`, `stream:context`, `session:after` 같은 단계별 snapshot을 포함합니다.
- 턴별 cache token 영향은 일반 usage 표면에서도 `cacheRead`, `cacheWrite`로 확인할 수 있습니다. 예: `/usage full`, session usage summary

## Quick troubleshooting

- 대부분의 턴에서 `cacheWrite`가 높다: 변동이 큰 system-prompt 입력이 없는지 확인하고, model/provider가 cache 설정을 지원하는지도 점검하세요.
- `cacheRetention`이 효과가 없다: model key가 `agents.defaults.models["provider/model"]`와 정확히 일치하는지 확인하세요.
- Bedrock Nova/Mistral 요청에서 cache 설정이 무시된다: 런타임에서 `none`으로 강제되는 것이 정상입니다.

관련 문서:

- [Anthropic](/providers/anthropic)
- [Token Use and Costs](/reference/token-use)
- [Session Pruning](/concepts/session-pruning)
- [Gateway Configuration Reference](/gateway/configuration-reference)
