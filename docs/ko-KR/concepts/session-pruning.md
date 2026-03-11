---
title: "세션 가지치기 (Session Pruning)"
summary: "도구 실행 결과 데이터를 선별적으로 제거하여 컨텍스트 팽창을 방지하는 세션 가지치기 가이드"
read_when:
  - 도구 출력 데이터로 인한 LLM 컨텍스트 급증을 억제하고 싶을 때
  - `agents.defaults.contextPruning` 설정값을 조정하고자 할 때
x-i18n:
  source_path: "concepts/session-pruning.md"
---

# 세션 가지치기 (Session Pruning)

세션 가지치기는 매 LLM 호출 직전, 메모리 내 컨텍스트에서 **오래된 도구 실행 결과(tool_result)**를 선별적으로 잘라내는 기능임. 이 작업은 디스크에 저장된 실제 세션 이력 파일(`*.jsonl`)에는 영향을 주지 않으며, 오직 해당 시점의 메모리 상에서만 수행됨.

## 실행 조건

- `mode: "cache-ttl"` 설정이 활성화되어 있고, 해당 세션의 마지막 Anthropic 호출 이후 경과 시간이 `ttl` 설정을 초과한 경우 실행됨.
- 해당 요청에서 모델로 전달되는 메시지 뭉치에만 적용됨.
- 현재 Anthropic API 호출(및 OpenRouter를 통한 Anthropic 모델 사용) 시에만 작동함.
- 최적의 효율을 위해 `ttl` 값을 모델의 `cacheRetention` 정책(`short` = 5분, `long` = 1시간)과 일치시킬 것을 권장함.
- 가지치기 실행 후에는 TTL 윈도우가 초기화되어, 다음 `ttl` 만료 전까지는 캐시된 상태를 유지함.

## 스마트 기본값 (Anthropic 기준)

- **OAuth 또는 setup-token** 프로필: `cache-ttl` 가지치기가 활성화되며 하트비트(Heartbeat) 주기가 `1시간`으로 설정됨.
- **API 키** 프로필: `cache-ttl` 가지치기가 활성화되며 하트비트 주기는 `30분`, Anthropic 모델의 기본값은 `cacheRetention: "short"`로 지정됨.
- 사용자가 설정 파일에서 해당 값을 명시적으로 지정한 경우, 시스템 기본값은 무시됨.

## 도입 효과 (비용 및 캐시 최적화)

- **배경**: Anthropic의 프롬프트 캐싱은 TTL 범위 내에서만 유효함. 세션이 유휴 상태로 TTL을 초과하면, 다음 요청 시 컨텍스트를 미리 정제하지 않을 경우 전체 이력을 다시 캐싱해야 함.
- **비용 절감**: 가지치기를 통해 TTL 만료 후 첫 요청 시 발생하는 **캐시 기록(cacheWrite)** 데이터 크기를 대폭 줄일 수 있음.
- **캐시 유지**: 가지치기 직후 캐시 윈도우가 새로 갱신되므로, 이어지는 후속 요청들은 전체 이력을 다시 읽는 대신 방금 캐싱된 프롬프트를 재사용할 수 있음.
- **안전성**: 가지치기는 기존 토큰을 변형하거나 중복 비용을 발생시키지 않으며, 오직 캐싱 효율을 높이는 방향으로만 작동함.

## 가지치기 대상 및 예외 규칙

- **대상**: 오직 `toolResult` (도구 실행 결과) 메시지만 처리함.
- **보호 대상**: 사용자의 질문(`user`)과 어시스턴트의 답변(`assistant`)은 **절대 수정되지 않음**.
- **최신성 보존**: 마지막 `keepLastAssistants` 개수만큼의 답변은 보호되며, 이 시점 이후의 도구 결과는 가지치기 대상에서 제외됨. 보호할 답변 개수가 부족할 경우 작업을 건너뜀.
- **미디어 보호**: **이미지 블록**이 포함된 도구 결과는 데이터 유실 방지를 위해 절대 잘라내거나 삭제하지 않음.

## 컨텍스트 창 용량 산정

가지치기 로직은 예측된 컨텍스트 창 크기(대략 1토큰 ≈ 4자)를 기준으로 작동함. 기준 용량은 다음 우선순위에 따라 결정됨:

1. `models.providers.*.models[].contextWindow` 오버라이드 값.
2. 모델 레지스트리에 정의된 해당 모델의 `contextWindow`.
3. 시스템 기본값인 `200,000` 토큰.

`agents.defaults.contextTokens` 설정이 있는 경우, 이를 최종 결정된 윈도우 크기의 상한(Min)으로 사용함.

## 가지치기 모드: cache-ttl

- 마지막 Anthropic 호출 시점이 `ttl`(기본값 5분)보다 오래된 경우에만 작동함.
- 실행 시 아래 설명된 소프트 트리밍과 하드 클리어 방식을 순차적으로 적용함.

## 소프트 트리밍 vs 하드 클리어

- **소프트 트리밍 (Soft-trim)**: 용량이 과도하게 큰 도구 결과에 적용됨.
  - 데이터의 앞부분과 뒷부분만 남기고 중간을 `...`로 대체하며, 원본 크기 정보를 주석으로 추가함.
  - 이미지 데이터가 포함된 경우 건너뜀.
- **하드 클리어 (Hard-clear)**: 오래된 도구 결과 전체를 지정된 문구(`hardClear.placeholder`)로 완전히 교체함.

## 대상 도구 필터링 (Tool Selection)

- `tools.allow` 및 `tools.deny`에서 와일드카드(`*`) 사용 가능.
- 차단(`deny`) 설정이 허용(`allow`) 설정보다 우선함.
- 대소문자를 구분하지 않으며, 허용 목록이 비어 있으면 모든 도구를 대상으로 함.

## 다른 제한 사항과의 관계

- 개별 도구들은 이미 자체적으로 출력 길이를 제한하고 있음. 세션 가지치기는 긴 대화 과정에서 모델 컨텍스트에 누적되는 전체 도구 결과물을 관리하는 추가적인 보안 계층임.
- **압축(Compaction)과의 차이**: 압축은 내용을 요약하여 세션 파일에 **영구 저장**하는 방식이며, 가지치기는 요청 시점에만 **일시적으로** 적용됨. 상세 내용은 [데이터 압축 가이드](/concepts/compaction) 참조.

## 기본 설정값 (활성화 시)

- `ttl`: `"5m"`
- `keepLastAssistants`: `3` (최신 답변 3개 보호)
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50,000` (최소 5만 자 이상일 때만 처리)
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[오래된 도구 실행 결과가 정리되었습니다]" }`

## 설정 예시

**기본값 (비활성화):**
```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } },
}
```

**TTL 기반 가지치기 활성화:**
```json5
{
  agents: { defaults: { contextPruning: { mode: "cache-ttl", ttl: "5m" } } },
}
```

**특정 도구에 대해서만 제한적으로 적용:**
```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl",
        tools: { 
          allow: ["exec", "read"], 
          deny: ["*image*"] 
        },
      },
    },
  },
}
```

상세 설정 스키마: [Gateway 설정 레퍼런스](/gateway/configuration)
