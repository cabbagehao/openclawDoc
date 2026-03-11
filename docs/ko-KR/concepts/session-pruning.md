---
title: "세션 가지치기"
summary: "컨텍스트 팽창을 줄이기 위한 도구 결과 잘라내기"
read_when:
  - 도구 출력 때문에 LLM 컨텍스트가 커지는 것을 줄이고 싶을 때
  - agents.defaults.contextPruning 을 조정하고 있을 때
---

# 세션 가지치기

세션 가지치기는 각 LLM 호출 직전에 메모리 내 컨텍스트에서 **오래된 도구 결과**를 잘라냅니다. 디스크에 저장된 세션 기록(`*.jsonl`)은 다시 쓰지 않습니다.

## 언제 실행되나

- `mode: "cache-ttl"`이 활성화되어 있고, 해당 세션의 마지막 Anthropic 호출이 `ttl`보다 오래됐을 때 실행됩니다.
- 그 요청에서 모델로 보내는 메시지에만 영향을 줍니다.
- Anthropic API 호출(및 OpenRouter Anthropic 모델)에만 적용됩니다.
- 최상의 결과를 위해 `ttl`을 모델의 `cacheRetention` 정책에 맞추세요(`short` = 5m, `long` = 1h).
- 가지치기가 한 번 실행되면 TTL 창이 재설정되므로, 이후 요청은 `ttl`이 다시 만료될 때까지 캐시를 유지합니다.

## 스마트 기본값(Anthropic)

- **OAuth 또는 setup-token** 프로필: `cache-ttl` 가지치기를 활성화하고 heartbeat 를 `1h`로 설정합니다.
- **API key** 프로필: `cache-ttl` 가지치기를 활성화하고, heartbeat 를 `30m`으로 설정하며, Anthropic 모델의 기본값으로 `cacheRetention: "short"`를 사용합니다.
- 이 값들 중 하나라도 명시적으로 설정하면 OpenClaw는 **덮어쓰지 않습니다**.

## 무엇이 개선되나(비용 + 캐시 동작)

- **왜 가지치기하나:** Anthropic 프롬프트 캐싱은 TTL 안에서만 적용됩니다. 세션이 TTL을 넘길 만큼 유휴 상태가 되면, 다음 요청은 먼저 잘라내지 않는 한 전체 프롬프트를 다시 캐시합니다.
- **무엇이 더 저렴해지나:** 가지치기는 TTL 만료 후 첫 요청의 **cacheWrite** 크기를 줄입니다.
- **왜 TTL 재설정이 중요한가:** 가지치기가 실행되면 캐시 창이 재설정되므로, 후속 요청은 전체 기록을 다시 캐시하는 대신 새로 캐시된 프롬프트를 재사용할 수 있습니다.
- **무엇을 하지 않나:** 가지치기는 토큰을 추가하거나 비용을 "두 배"로 만들지 않습니다. TTL 이후 첫 요청에서 무엇이 캐시되는지만 바꿉니다.

## 가지치기할 수 있는 항목

- `toolResult` 메시지만 대상입니다.
- 사용자 + 어시스턴트 메시지는 **절대** 수정되지 않습니다.
- 마지막 `keepLastAssistants`개의 어시스턴트 메시지는 보호되며, 그 컷오프 이후의 도구 결과는 가지치기되지 않습니다.
- 컷오프를 정할 만큼 어시스턴트 메시지가 충분하지 않으면 가지치기를 건너뜁니다.
- **이미지 블록**이 들어 있는 도구 결과는 건너뜁니다(절대 잘라내거나 비우지 않음).

## 컨텍스트 윈도우 추정

가지치기는 추정된 컨텍스트 윈도우를 사용합니다(문자 수 ≈ 토큰 × 4). 기본 윈도우는 다음 순서로 결정됩니다.

1. `models.providers.*.models[].contextWindow` 재정의값
2. 모델 정의의 `contextWindow`(모델 레지스트리에서)
3. 기본값 `200000` 토큰

`agents.defaults.contextTokens`가 설정되어 있으면, 결정된 윈도우와 비교해 더 작은 값이 상한으로 사용됩니다.

## 모드

### cache-ttl

- 마지막 Anthropic 호출이 `ttl`보다 오래된 경우에만 가지치기가 실행됩니다(기본값 `5m`).
- 실행될 때: 이전과 같은 soft-trim + hard-clear 동작을 적용합니다.

## 소프트 가지치기 vs 하드 가지치기

- **Soft-trim**: 너무 큰 도구 결과에만 적용됩니다.
  - 앞부분 + 뒷부분을 유지하고, `...`를 넣은 뒤, 원래 크기에 대한 메모를 덧붙입니다.
  - 이미지 블록이 있는 결과는 건너뜁니다.
- **Hard-clear**: 도구 결과 전체를 `hardClear.placeholder`로 대체합니다.

## 도구 선택

- `tools.allow` / `tools.deny`는 `*` 와일드카드를 지원합니다.
- deny 가 우선합니다.
- 매칭은 대소문자를 구분하지 않습니다.
- allow 목록이 비어 있으면 모든 도구가 허용됩니다.

## 다른 제한과의 상호작용

- 내장 도구는 이미 자체적으로 출력을 잘라냅니다. 세션 가지치기는 여기에 더해, 오래 이어지는 대화에서 모델 컨텍스트에 과도한 도구 출력이 쌓이지 않도록 막는 추가 계층입니다.
- 압축(compaction)은 별개입니다. 압축은 요약을 만들어 저장하고, 가지치기는 요청별로 일시적으로 적용됩니다. [/concepts/compaction](/concepts/compaction)을 참고하세요.

## 기본값(활성화된 경우)

- `ttl`: `"5m"`
- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50000`
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[Old tool result content cleared]" }`

## 예시

기본값(꺼짐):

```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } },
}
```

TTL 인지 가지치기 활성화:

```json5
{
  agents: { defaults: { contextPruning: { mode: "cache-ttl", ttl: "5m" } } },
}
```

특정 도구에만 가지치기 제한:

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

설정 참고: [Gateway Configuration](/gateway/configuration)
