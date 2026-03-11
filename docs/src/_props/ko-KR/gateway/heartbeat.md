---
summary: "하트비트 폴링 메시지 동작 원리 및 알림 정책 안내"
read_when:
  - 하트비트 실행 주기나 메시지 내용을 조정하고자 할 때
  - 예약 작업 구현 시 하트비트와 크론(Cron) 중 적절한 방식을 선택해야 할 때
title: "하트비트 (자율 점검)"
x-i18n:
  source_path: "gateway/heartbeat.md"
---

# 하트비트 (Gateway Heartbeat)

> **하트비트 vs 크론?** 각 기능의 용도와 차이점은 [크론 vs 하트비트 비교 가이드](/automation/cron-vs-heartbeat)를 참조함.

하트비트(Heartbeat)는 메인 세션에서 **주기적으로 에이전트 턴(Turn)을 실행**하는 기능임. 이를 통해 모델은 사용자에게 불필요한 스팸을 보내지 않으면서도 주의가 필요한 사항을 스스로 판단하여 보고할 수 있음.

문제 해결 가이드: [/automation/troubleshooting](/automation/troubleshooting)

## 빠른 시작 (초보자용)

1. 하트비트 기능을 활성화 상태로 유지함 (기본값 `30m`, Anthropic OAuth/설정 토큰 사용 시 `1h`). 필요에 따라 주기를 변경할 수 있음.
2. 에이전트 워크스페이스에 간단한 `HEARTBEAT.md` 체크리스트 파일을 생성함 (권장 사항).
3. 메시지 전달 대상을 설정함 (기본값 `target: "none"`, 마지막 대화 상대에게 보내려면 `target: "last"`).
4. (선택 사항) 투명성을 위해 하트비트 사고 과정(Reasoning) 전달 기능을 활성화함.
5. (선택 사항) 하트비트 실행 시 `HEARTBEAT.md` 내용만 참조하도록 경량 부트스트랩 컨텍스트를 사용함.
6. (선택 사항) 하트비트 실행 시간을 특정 활동 시간대(로컬 시간 기준)로 제한함.

**설정 예시:**

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 대화 상대에게 명시적 전달 (기본값 "none")
        directPolicy: "allow", // 기본값: DM 전달 허용, 억제하려면 "block" 설정
        lightContext: true, // 선택: 부트스트랩 파일 중 HEARTBEAT.md만 주입
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 선택: 별도의 `Reasoning:` 메시지도 함께 전송
      },
    },
  },
}
```

## 기본 설정값

* **실행 간격**: `30m` (Anthropic OAuth/설정 토큰 인증 모드 감지 시 `1h`). `agents.defaults.heartbeat.every` 또는 에이전트별 `agents.list[].heartbeat.every`에서 설정하며, `0m`으로 지정 시 비활성화됨.
* **프롬프트 본문** (`agents.defaults.heartbeat.prompt`로 수정 가능):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
* 하트비트 프롬프트는 사용자 메시지로서 **원문 그대로** 전송됨. 시스템 프롬프트에는 "Heartbeat" 섹션이 추가되며, 내부적으로 해당 실행이 하트비트임을 인지함.
* **활동 시간대**(`heartbeat.activeHours`)는 설정된 타임존을 기준으로 검사됨. 지정된 시간 범위 밖에서는 다음 활성 시간까지 실행을 건너뜀.

## 하트비트 프롬프트의 용도

기본 프롬프트는 다음과 같은 광범위한 목적을 수행하도록 설계됨:

* **백그라운드 작업 처리**: "미결 업무 검토" 지시를 통해 에이전트가 인박스, 캘린더, 미리 알림, 대기 중인 작업을 확인하고 긴급한 사항을 보고하도록 유도함.
* **사용자 안부 확인**: 낮 시간대에는 "도움이 필요한지 가볍게 확인"하도록 유도함. 이때 설정된 로컬 타임존을 참조하여 밤 시간대에 불필요한 알림이 가지 않도록 방지함 ([타임존 개념](/concepts/timezone) 참조).

매우 구체적인 작업(예: "Gmail PubSub 통계 확인" 또는 "Gateway 헬스 체크")이 필요한 경우, 프롬프트 설정을 원하는 내용으로 오버라이드하여 사용할 수 있음.

## 응답 규격 (Contract)

* 별도의 조치가 필요 없는 경우 모델은 반드시 \*\*`HEARTBEAT_OK`\*\*로 응답해야 함.
* 하트비트 실행 중 OpenClaw는 응답의 **시작 또는 끝**에 `HEARTBEAT_OK`가 포함된 경우 이를 수신 확인(Ack)으로 처리함. 해당 토큰은 제거되며, 남은 텍스트 길이가 **`ackMaxChars`**(기본값 300) 이하인 경우 최종 응답을 전송하지 않고 무시함.
* 만약 `HEARTBEAT_OK`가 응답 **중간**에 나타나면 특별한 처리를 하지 않음.
* 알림이나 보고 사항이 있는 경우 `HEARTBEAT_OK`를 포함하지 말고 **보고 내용만** 작성해야 함.

하트비트 이외의 일반 대화에서 메시지 시작/끝에 `HEARTBEAT_OK`가 포함된 경우, 해당 토큰은 제거되고 로그에 기록됨. 메시지 전체가 `HEARTBEAT_OK`뿐인 경우 응답을 무시함.

## 상세 설정 레퍼런스

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 기본 간격 (0m은 비활성화)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 별도의 Reasoning: 메시지 전달 여부
        lightContext: false, // true 설정 시 HEARTBEAT.md만 컨텍스트에 포함
        target: "last", // 기본값 none | 옵션: last, none, <채널ID>
        to: "+82101234567", // 채널별 수신자 오버라이드
        accountId: "ops-bot", // 다중 계정 채널 사용 시 계정 ID
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 제외 응답 허용 최대 길이
      },
    },
  },
}
```

### 우선순위 및 범위

* `agents.defaults.heartbeat`: 전역 하트비트 동작 설정.
* `agents.list[].heartbeat`: 에이전트별 설정이 전역 설정을 덮어씀. 특정 에이전트에 하트비트 블록이 정의되면 **해당 에이전트들만** 하트비트를 수행함.
* `channels.defaults.heartbeat`: 모든 채널에 적용될 가시성 기본값.
* `channels.<channel>.heartbeat`: 개별 채널 설정이 기본값을 덮어씀.
* `channels.<channel>.accounts.<id>.heartbeat`: 다중 계정 채널의 경우 계정별로 더 세밀하게 제어 가능.

### 활동 시간대 설정 예시

특정 타임존의 업무 시간에만 하트비트가 작동하도록 제한할 수 있음:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "Asia/Seoul", // 미설정 시 userTimezone 또는 호스트 타임존 사용
        },
      },
    },
  },
}
```

해당 시간 창 밖(예: 오전 9시 이전 또는 오후 10시 이후)에는 하트비트가 실행되지 않음. 다음 예정된 실행 시점이 시간 창 안에 들어오면 정상적으로 재개됨.

### 24시간 가동 설정

제한 없이 상시 가동하려면 다음 중 하나를 선택함:

* `activeHours` 설정을 아예 생략함 (기본 동작).
* 전체 시간 범위를 지정함: `activeHours: { start: "00:00", end: "24:00" }`.

주의: `start`와 `end`를 동일한 시간(예: `08:00` \~ `08:00`)으로 설정하면 유효 범위가 없는 것으로 간주되어 하트비트가 실행되지 않음.

### 주요 필드 설명

* **`every`**: 실행 간격 (시간 단위 문자열, 기본값은 '분').
* **`model`**: 하트비트 실행에 사용할 별도의 모델 지정 (`provider/model`).
* **`includeReasoning`**: 활성화 시 `/reasoning on`과 동일하게 `Reasoning:` 접두사가 붙은 사고 과정을 별도 메시지로 전달함.
* **`lightContext`**: true 설정 시 부트스트랩 파일 중 `HEARTBEAT.md`만 유지하여 컨텍스트 토큰을 절약함.
* **`session`**: 실행에 사용할 세션 키 (기본값 `main`).
* **`target`**:
  * `last`: 마지막으로 사용된 외부 채널로 응답 전송.
  * 채널 ID: `whatsapp`, `telegram`, `discord` 등 특정 채널 지정.
  * `none` (기본값): 외부 전송 없이 내부 상태만 업데이트함.
* **`directPolicy`**: DM 전송 정책 제어. `allow` (기본값) 또는 `block` (억제) 지정.
* **`activeHours`**: 실행 시간 창 설정. `start` (포함), `end` (미포함) 형식이며 `timezone` 지정을 지원함.

## 전송 동작 특징

* 하트비트는 기본적으로 에이전트의 메인 세션(`agent:<id>:<mainKey>`)에서 실행됨. `session` 설정을 통해 특정 채널 세션으로 변경 가능함.
* `session` 설정은 오직 실행 컨텍스트에만 영향을 주며, 실제 외부 전송 여부는 `target`과 `to` 설정이 결정함.
* 메인 작업 대기열(Queue)이 사용 중인 경우 하트비트는 실행을 건너뛰고 나중에 다시 시도함.
* 하트비트 전용 응답은 세션을 '활성' 상태로 유지하지 않음. 마지막 대화 시점(`updatedAt`)이 복원되어 유휴 세션 만료 로직이 정상적으로 작동함.

## 가시성 제어 (Visibility)

기본적으로 `HEARTBEAT_OK` 응답은 무시되고 알림 내용만 전송됨. 이 동작은 채널이나 계정별로 조정 가능함:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK 숨김 (기본값)
      showAlerts: true # 알림 메시지 표시 (기본값)
      useIndicator: true # UI 상태 표시기 이벤트 발생 (기본값)
```

**플래그별 역할:**

* `showOk`: 모델이 OK 응답만 했을 때도 메시지를 전송함.
* `showAlerts`: 모델이 보고 사항을 작성했을 때 내용을 전송함.
* `useIndicator`: UI 상의 상태 표시기 이벤트를 전송함.

위 세 가지 플래그가 모두 `false`인 경우, OpenClaw는 모델 호출 자체를 수행하지 않고 하트비트 실행을 완전히 건너뜀.

## HEARTBEAT.md 활용 (선택 사항)

워크스페이스에 `HEARTBEAT.md` 파일이 있으면 기본 프롬프트가 에이전트에게 해당 파일을 읽도록 지시함. 이를 "하트비트 체크리스트"로 활용하여 에이전트가 매 실행 시 점검해야 할 항목을 정의할 수 있음.

파일이 존재하지만 내용이 비어 있는 경우(헤더만 있거나 공백만 있는 경우), API 비용 절감을 위해 실행을 건너뜀. 파일이 없으면 모델이 상황에 따라 자율적으로 판단하여 행동함.

**작성 팁:**

* 프롬프트 비대화를 방지하기 위해 내용을 간결하게 유지함.
* 에이전트에게 "HEARTBEAT.md를 직접 수정하여 체크리스트를 최신화하라"고 지시할 수도 있음.
* **보안 주의**: 비밀번호나 API 키 등 민감한 정보는 프롬프트 컨텍스트에 포함되므로 절대 이 파일에 작성하지 말 것.

## 수동 실행 (On-demand)

필요할 때 즉시 하트비트를 트리거할 수 있음:

```bash
openclaw system event --text "긴급 업무 확인 요청" --mode now
```

`--mode next-heartbeat` 플래그를 사용하면 즉시 실행 대신 다음 스케줄 시점에 실행되도록 대기열에 추가함.

## 비용 및 성능 고려 사항

하트비트는 전체 에이전트 턴을 실행하므로 실행 주기가 짧을수록 토큰 소모가 증가함. 비용 최적화를 위해 `HEARTBEAT.md`를 작게 유지하고, 내부 상태 업데이트만 필요한 경우 저렴한 `model`을 지정하거나 `target: "none"` 설정을 활용하기 바람.
