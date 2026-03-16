---
title: "Session Pruning"
summary: "Session pruning: tool-result trimming to reduce context bloat"
description: "오래된 tool result를 요청 시점에만 정리해 Anthropic cache 비용과 context 팽창을 줄이는 session pruning을 설명합니다."
read_when:
  - "tool output 때문에 LLM context가 커지는 것을 줄이고 싶을 때"
  - "agents.defaults.contextPruning을 조정해야 할 때"
x-i18n:
  source_path: "concepts/session-pruning.md"
---

# Session Pruning

session pruning은 각 LLM call 직전에 in-memory context에서 **오래된 tool result**를
잘라냅니다. on-disk session history
(`*.jsonl`)는 다시 쓰지 않습니다.

## When it runs

- `mode: "cache-ttl"`이 켜져 있고, 해당 session의 마지막 Anthropic call이 `ttl`보다
  오래됐을 때 실행됩니다
- 그 요청에서 모델에 보내는 message에만 영향을 줍니다
- Anthropic API call
  (및 OpenRouter Anthropic model)에서만 active합니다
- 가장 좋은 결과를 위해 `ttl`을 model의 `cacheRetention` 정책과 맞추세요
  (`short` = 5m, `long` = 1h)
- prune가 한 번 실행되면 TTL window가 reset되어, 이후 request는 다시 `ttl`이 만료될
  때까지 cache를 유지합니다

## Smart defaults (Anthropic)

- **OAuth 또는 setup-token** profile:
  `cache-ttl` pruning 활성화, heartbeat `1h`
- **API key** profile:
  `cache-ttl` pruning 활성화, heartbeat `30m`,
  Anthropic model의 기본 `cacheRetention: "short"`
- 사용자가 값을 명시적으로 설정하면 OpenClaw는 override하지 않습니다

## What this improves (cost + cache behavior)

- **왜 prune하는가:** Anthropic prompt caching은 TTL 안에서만 적용됩니다. session이 TTL
  이상 idle 상태가 되면 다음 request는 full prompt를 다시 cache write하게 되므로,
  그 전에 trim하는 편이 유리합니다
- **무엇이 더 저렴해지는가:** TTL 만료 후 첫 요청의 **cacheWrite** 크기가 줄어듭니다
- **TTL reset이 중요한 이유:** pruning이 한 번 실행되면 cache window가 새로 시작되어,
  뒤따르는 request는 새 prompt cache를 재사용할 수 있습니다
- **하지 않는 일:** pruning은 token을 추가하거나 비용을 "두 배"로 만들지 않습니다.
  첫 post-TTL request에서 cache 대상이 무엇인지 바꿀 뿐입니다

## What can be pruned

- `toolResult` message만 대상입니다
- user + assistant message는 **절대** 수정하지 않습니다
- 마지막 `keepLastAssistants`개의 assistant message는 보호되며,
  그 cutoff 이후의 tool result는 prune되지 않습니다
- cutoff를 정할 만큼 assistant message가 충분하지 않으면 pruning을 건너뜁니다
- **image block**이 포함된 tool result는 건너뜁니다
  (trim/clear하지 않음)

## Context window estimation

pruning은 예상 context window
(chars ≈ tokens × 4)를 사용합니다.
base window는 다음 순서로 결정됩니다.

1. `models.providers.*.models[].contextWindow` override
2. model registry의 `contextWindow`
3. 기본값 `200000` token

`agents.defaults.contextTokens`가 설정돼 있으면, resolved window에 대한 상한 cap처럼
취급합니다
(더 작은 값을 사용).

## Mode

### cache-ttl

- 마지막 Anthropic call이 `ttl`
  (기본값 `5m`)보다 오래된 경우에만 pruning 실행
- 실행 시에는 이전과 같은 soft-trim + hard-clear 동작을 적용

## Soft vs hard pruning

- **Soft-trim:** oversized tool result에만 적용
  - 앞부분과 뒷부분을 남기고, 중간에 `...`를 넣고, 원본 크기 note를 덧붙입니다
  - image block이 있으면 건너뜁니다
- **Hard-clear:** tool result 전체를 `hardClear.placeholder`로 교체합니다

## Tool selection

- `tools.allow` / `tools.deny`는 `*` wildcard를 지원합니다
- deny가 우선합니다
- case-insensitive matching입니다
- allow list가 비어 있으면 모든 tool을 허용합니다

## Interaction with other limits

- built-in tool도 자체적으로 output을 truncate하지만, session pruning은 긴 대화에서
  model context에 tool output이 과도하게 누적되는 것을 막는 추가 계층입니다
- compaction은 별도 기능입니다. compaction은 요약 후 저장하고, pruning은 요청마다
  일시적으로 적용됩니다.
  [/concepts/compaction](/concepts/compaction)을 참고하세요

## Defaults (when enabled)

- `ttl`: `"5m"`
- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50000`
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[Old tool result content cleared]" }`

## Examples

Default (off):

```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } },
}
```

Enable TTL-aware pruning:

```json5
{
  agents: { defaults: { contextPruning: { mode: "cache-ttl", ttl: "5m" } } },
}
```

Restrict pruning to specific tools:

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl",
        tools: { allow: ["exec", "read"], deny: ["*image*"] },
      },
    },
  },
}
```

설정 reference:
[Gateway Configuration](/gateway/configuration)
