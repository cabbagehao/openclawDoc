---
summary: "시스템 이벤트 예약, 하트비트 제어 및 상태 정보 확인을 위한 `openclaw system` 명령어 레퍼런스"
read_when:
  - 크론 작업을 별도로 생성하지 않고 즉시 시스템 이벤트를 대기열에 추가하고자 할 때
  - 하트비트(Heartbeat) 기능을 활성화하거나 비활성화해야 할 때
  - 시스템 상태 표시(Presence) 항목들을 확인하고 싶을 때
title: "system"
x-i18n:
  source_path: "cli/system.md"
---

# `openclaw system`

Gateway 서버를 위한 시스템 수준의 헬퍼 도구임. 시스템 이벤트를 대기열에 추가하거나 하트비트 동작을 제어하고, 현재 연결된 기기들의 상태 정보를 확인할 수 있음.

## 주요 명령어

```bash
# 긴급 후속 조치 확인 이벤트를 즉시 실행 대기열에 추가
openclaw system event --text "긴급 후속 조치 사항 확인 바람" --mode now

# 하트비트 기능 활성화
openclaw system heartbeat enable

# 마지막 하트비트 이벤트 정보 확인
openclaw system heartbeat last

# 현재 시스템 상태 표시(Presence) 목록 조회
openclaw system presence
```

## `system event`

**메인(Main)** 세션의 대기열에 시스템 이벤트를 추가함. 추가된 이벤트는 다음 하트비트 실행 시 프롬프트에 `System:` 접두사와 함께 주입됨.

**주요 옵션:**

* **`--text <text>`**: (필수) 삽입할 시스템 이벤트 메시지 본문.
* **`--mode <mode>`**: 실행 시점 지정.
  * `now`: 즉시 하트비트를 트리거하여 이벤트를 실행함.
  * `next-heartbeat`: 다음 예약된 틱(Tick) 시점까지 대기함 (기본값).
* **`--json`**: 결과를 JSON 형식으로 출력.

## `system heartbeat last|enable|disable`

하트비트 시스템의 동작을 제어함:

* **`last`**: 가장 최근에 발생한 하트비트 이벤트 내역을 표시함.
* **`enable`**: 비활성화된 하트비트 기능을 다시 활성화함.
* **`disable`**: 하트비트 실행을 일시 중단함.

**주요 옵션:**

* **`--json`**: 결과를 JSON 형식으로 출력.

## `system presence`

Gateway가 관리하는 현재 시스템 상태 표시(Presence) 항목(노드, 인스턴스 및 각종 상태 정보) 목록을 나열함.

**주요 옵션:**

* **`--json`**: 결과를 JSON 형식으로 출력.

## 참고 사항

* **Gateway 연결 필수**: 현재 설정(로컬 또는 원격)을 통해 접근 가능한 실행 중인 Gateway 서버가 반드시 필요함.
* **휘발성 데이터**: 시스템 이벤트는 메모리 상에서만 관리되며, 서버 재시작 시 보존되지 않는 휘발성 데이터임.
