---
title: 정형 검증 (보안 모델)
summary: OpenClaw의 최고위험 경로를 위한 기계 검증 보안 모델.
read_when:
  - 정형 보안 모델의 보장 범위나 한계를 검토할 때
  - TLA+/TLC 보안 모델 검사를 재현하거나 업데이트할 때
permalink: /security/formal-verification/
x-i18n:
  source_path: "security/formal-verification.md"
---

# 정형 검증 (보안 모델)

이 페이지는 OpenClaw의 **정형 보안 모델**(현재는 TLA+/TLC, 필요에 따라 추가)을 추적합니다.

> 참고: 오래된 링크 중 일부는 이전 프로젝트 이름을 가리킬 수 있습니다.

**목표(북극성):** 명시된 가정 아래에서 OpenClaw가 의도한 보안 정책(권한 부여,
세션 격리, 도구 게이팅, 오구성 안전성)을 강제한다는 점을 기계 검증 가능한
형태로 제시하는 것입니다.

**이 문서가 현재 의미하는 것:** 실행 가능하고 공격자 관점으로 설계된
**보안 회귀 테스트 스위트**입니다.

- 각 주장에는 유한한 상태 공간에서 실행 가능한 model-check가 붙어 있습니다.
- 많은 주장에는 현실적인 버그 계열에 대한 counterexample trace를 생성하는 짝지어진 **negative model**이 있습니다.

**이 문서가 아직 의미하지 않는 것:** “OpenClaw가 모든 면에서 안전하다”는 증명이나 전체 TypeScript 구현이 정확하다는 증명은 아닙니다.

## 모델 위치

모델은 별도 저장소에서 관리됩니다:
[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## 중요한 주의사항

- 이것은 전체 TypeScript 구현이 아니라 **모델**입니다. 모델과 코드가 어긋날 가능성은 있습니다.
- 결과는 TLC가 탐색한 상태 공간 범위 안에서만 유효합니다. “green”이라고 해서 모델링된 가정과 범위를 넘어선 보안을 의미하지는 않습니다.
- 일부 주장은 명시적인 환경 가정(예: 올바른 배포, 올바른 config 입력)에 의존합니다.

## 결과 재현

현재 결과는 모델 저장소를 로컬에 clone한 뒤 TLC를 실행해 재현합니다(아래 참고).
향후에는 다음도 제공할 수 있습니다.

- 공개 아티팩트(counterexample trace, 실행 로그)와 함께 CI에서 모델 실행
- 작고 제한된 검사에 대한 호스팅된 “이 모델 실행” 워크플로

시작하기:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ 필요(TLC는 JVM에서 실행).
# 이 저장소는 고정 버전 `tla2tools.jar`(TLA+ 도구)를 포함하고, `bin/tlc` + Make 타깃을 제공합니다.

make <target>
```

### Gateway 노출과 open gateway 오구성

**주장:** loopback을 넘어 auth 없이 bind하면 원격 침해가 가능해지거나 노출이 증가할 수 있습니다. token/password는 인증되지 않은 공격자를 차단합니다(모델 가정 기준).

- Green 실행:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Red(예상):
  - `make gateway-exposure-v2-negative`

추가 참고: 모델 저장소의 `docs/gateway-exposure-matrix.md`

### Nodes.run 파이프라인(가장 위험한 기능)

**주장:** `nodes.run`에는 (a) node command allowlist와 선언된 명령, 그리고 (b) 설정된 경우 live approval이 필요합니다. approval은 재전송을 막기 위해 토큰화됩니다(모델 기준).

- Green 실행:
  - `make nodes-pipeline`
  - `make approvals-token`
- Red(예상):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Pairing store(DM 게이팅)

**주장:** pairing 요청은 TTL과 pending-request 상한을 준수합니다.

- Green 실행:
  - `make pairing`
  - `make pairing-cap`
- Red(예상):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress 게이팅(mentions + control-command 우회)

**주장:** mention이 필요한 group 컨텍스트에서는 권한 없는 “control command”가 mention 게이팅을 우회할 수 없습니다.

- Green:
  - `make ingress-gating`
- Red(예상):
  - `make ingress-gating-negative`

### 라우팅/세션 키 격리

**주장:** 서로 다른 peer의 DM은 명시적으로 연결/설정하지 않는 한 같은 세션으로 합쳐지지 않습니다.

- Green:
  - `make routing-isolation`
- Red(예상):
  - `make routing-isolation-negative`

## v1++: 추가 bounded 모델(동시성, 재시도, trace 정확성)

이 모델들은 실제 환경의 장애 모드(비원자적 업데이트, 재시도, 메시지 fan-out)에
대한 충실도를 높이는 후속 모델입니다.

### Pairing store 동시성 / 멱등성

**주장:** pairing store는 interleaving이 있더라도 `MaxPending`과 멱등성을
강제해야 합니다(즉, “check-then-write”는 원자적이거나 lock으로 보호되어야
하며, refresh는 중복을 만들면 안 됩니다).

의미:

- 동시 요청 상황에서도 채널별 `MaxPending`을 초과할 수 없습니다.
- 같은 `(channel, sender)`에 대한 반복 요청/refresh는 live pending row를 중복 생성하면 안 됩니다.

- Green 실행:
  - `make pairing-race` (원자적/locked 상한 검사)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Red(예상):
  - `make pairing-race-negative` (비원자적 begin/commit 상한 경쟁)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Ingress trace 상관관계 / 멱등성

**주장:** ingestion은 fan-out 전체에서 trace 상관관계를 유지해야 하며,
provider 재시도 아래에서도 멱등적이어야 합니다.

의미:

- 하나의 외부 이벤트가 여러 개의 내부 메시지로 바뀌어도 모든 조각은 같은 trace/event identity를 유지합니다.
- 재시도로 인해 이중 처리되면 안 됩니다.
- provider event ID가 없으면 dedupe는 안전한 키(예: trace ID)로 fallback해 서로 다른 이벤트가 잘못 버려지지 않게 해야 합니다.

- Green:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Red(예상):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Routing dmScope 우선순위 + identityLinks

**주장:** 라우팅은 기본적으로 DM 세션을 격리 상태로 유지해야 하며,
명시적으로 설정된 경우에만 세션을 합쳐야 합니다(채널 우선순위 +
identity links).

의미:

- 채널별 dmScope override는 전역 기본값보다 우선해야 합니다.
- identityLinks는 명시적으로 연결된 그룹 내부에서만 세션을 합쳐야 하며, 무관한 peer 사이까지 합치면 안 됩니다.

- Green:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Red(예상):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
