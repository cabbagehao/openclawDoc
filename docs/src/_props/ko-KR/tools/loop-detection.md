---
title: "Tool-loop detection"
description: "반복되거나 멈춘 tool-call loop 를 방지하기 위한 선택적 guardrail 구성"
summary: "반복적인 tool-call loop 를 감지하는 guardrail 을 활성화하고 조정하는 방법"
read_when:
  - 사용자들이 agent 가 tool call 을 반복하며 멈춘다고 보고할 때
  - 반복 호출 보호를 조정해야 할 때
  - agent tool/runtime policy 를 수정할 때
---

# Tool-loop detection

OpenClaw 는 agent 가 반복적인 tool-call 패턴에 갇히는 것을 막을 수 있습니다.
이 guard 는 **기본적으로 비활성화** 되어 있습니다.

엄격한 설정에서는 정당한 반복 호출도 막을 수 있으므로, 필요한 경우에만 활성화하세요.

## 왜 필요한가

* 진전이 없는 반복 시퀀스를 감지
* 높은 빈도의 no-result loop (같은 tool, 같은 입력, 반복 오류) 감지
* 알려진 polling tool 에 대한 특정 repeated-call 패턴 감지

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

agent 별 override (선택 사항):

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

### 필드 동작

* `enabled`: 마스터 스위치. `false` 면 loop detection 을 수행하지 않음
* `historySize`: 분석을 위해 유지하는 최근 tool call 수
* `warningThreshold`: 패턴을 warning-only 로 분류하기 전 임계치
* `criticalThreshold`: 반복 loop 패턴을 차단하는 임계치
* `globalCircuitBreakerThreshold`: 전역 no-progress breaker 임계치
* `detectors.genericRepeat`: 같은 tool + 같은 params 반복 패턴 감지
* `detectors.knownPollNoProgress`: 상태 변화가 없는 알려진 polling 류 패턴 감지
* `detectors.pingPong`: 번갈아 오가는 ping-pong 패턴 감지

## 권장 설정

* `enabled: true` 로 시작하고 기본값은 그대로 둡니다.
* 임계치는 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` 순서를 유지하세요.
* false positive 가 발생하면:
  * `warningThreshold` 와/또는 `criticalThreshold` 를 높이세요
  * (선택적으로) `globalCircuitBreakerThreshold` 도 높이세요
  * 문제를 일으키는 detector 만 비활성화하세요
  * 더 느슨한 과거 맥락을 위해 `historySize` 를 줄이세요

## 로그와 예상 동작

loop 가 감지되면, OpenClaw 는 loop event 를 보고하고 심각도에 따라 다음 tool-cycle 을 차단하거나 완화합니다.
이렇게 하면 runaway token spend 와 lockup 으로부터 사용자를 보호하면서 정상 tool access 는 유지합니다.

* 먼저 warning 과 임시 억제를 우선하세요.
* 반복된 증거가 쌓일 때만 상위 단계로 escalte 하세요.

## 메모

* `tools.loopDetection` 은 agent-level override 와 병합됩니다.
* agent 별 config 는 전역 값을 완전히 덮어쓰거나 확장할 수 있습니다.
* 아무 config 가 없으면 guardrail 은 꺼진 상태로 유지됩니다.
