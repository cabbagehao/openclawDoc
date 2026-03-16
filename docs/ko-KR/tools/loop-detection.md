---
title: "Tool-loop detection"
description: "반복되거나 진전 없는 tool-call loops를 막기 위한 optional guardrails와 threshold 조정 방법을 설명합니다."
summary: "반복적인 tool-call loop를 감지하는 guardrail을 활성화하고 조정하는 방법"
read_when:
  - "사용자가 agent가 tool calls를 반복하며 멈춘다고 보고할 때"
  - "반복 호출 보호를 조정해야 할 때"
  - "agent tool/runtime policies를 수정할 때"
x-i18n:
  source_path: "tools/loop-detection.md"
---

# Tool-loop detection

OpenClaw는 agents가 반복적인 tool-call patterns에 갇히는 것을 막을 수 있습니다. 이 guard는 **기본적으로 비활성화**되어 있습니다.

엄격한 설정에서는 정당한 반복 호출도 막을 수 있으므로, 필요한 경우에만 활성화하세요.

## 왜 필요한가

- 진전이 없는 반복 sequence 감지
- 높은 빈도의 no-result loops (같은 tool, 같은 inputs, 반복 errors) 감지
- 알려진 polling tools에 대한 특정 repeated-call patterns 감지

## Configuration block

전역 기본값:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

per-agent override (선택 사항):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Field behavior

- `enabled`: master switch. `false`이면 loop detection을 수행하지 않음
- `historySize`: 분석을 위해 유지하는 최근 tool calls 수
- `warningThreshold`: pattern을 warning-only로 분류하기 전 threshold
- `criticalThreshold`: 반복 loop patterns를 차단하는 threshold
- `globalCircuitBreakerThreshold`: 전역 no-progress breaker threshold
- `detectors.genericRepeat`: 같은 tool + 같은 params 반복 패턴 감지
- `detectors.knownPollNoProgress`: 상태 변화가 없는 known polling-like patterns 감지
- `detectors.pingPong`: 번갈아 오가는 ping-pong patterns 감지

## 권장 설정

- `enabled: true`로 시작하고 기본값은 그대로 두세요.
- 임계치는 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` 순서를 유지하세요.
- false positives가 발생하면:
  - `warningThreshold`와/또는 `criticalThreshold`를 높이세요
  - (선택적으로) `globalCircuitBreakerThreshold`도 높이세요
  - 문제를 일으키는 detector만 비활성화하세요
  - 더 느슨한 historical context를 위해 `historySize`를 줄이세요

## 로그와 예상 동작

loop가 감지되면, OpenClaw는 loop event를 보고하고 심각도에 따라 다음 tool-cycle을 차단하거나 완화합니다. 이렇게 하면 runaway token spend와 lockups로부터 사용자를 보호하면서 정상 tool access는 유지합니다.

- 먼저 warnings와 temporary suppression을 우선하세요.
- 반복된 evidence가 쌓일 때만 상위 단계로 escalate하세요.

## 메모

- `tools.loopDetection`은 agent-level overrides와 병합됩니다.
- per-agent config는 전역 값을 완전히 override하거나 확장할 수 있습니다.
- 아무 config가 없으면 guardrails는 꺼진 상태로 유지됩니다.
