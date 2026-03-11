---
summary: "수신된 채널 위치 정보(Telegram, WhatsApp 등)의 파싱 방식 및 컨텍스트 필드 안내"
read_when:
  - 채팅 채널의 위치 정보 파싱 로직을 추가하거나 수정하고자 할 때
  - 에이전트 프롬프트나 도구에서 위치 컨텍스트 필드를 활용할 때
title: "위치 정보 파싱"
x-i18n:
  source_path: "channels/location.md"
---

# 위치 정보 파싱 (Location Parsing)

OpenClaw는 다양한 채팅 채널로부터 수신된 공유 위치 정보를 다음과 같이 표준화함:

* 수신 메시지 본문에 사람이 읽기 쉬운 텍스트 형식으로 추가.
* 자동 응답용 컨텍스트(Context) 페이로드에 구조화된 데이터 필드로 주입.

## 지원 채널

* **Telegram**: 위치 핀(Pin), 장소 정보(Venues), 실시간 위치(Live locations) 지원.
* **WhatsApp**: 일반 위치(`locationMessage`) 및 실시간 위치(`liveLocationMessage`) 지원.
* **Matrix**: `geo_uri`가 포함된 `m.location` 타입 지원.

## 텍스트 렌더링 형식

위치 정보는 가독성을 고려하여 다음과 같이 변환되어 본문에 포함됨:

* **단순 핀 (Pin)**:
  * `📍 48.858844, 2.294351 ±12m`
* **명명된 장소 (Named place)**:
  * `📍 에펠탑 — 프랑스 파리 (48.858844, 2.294351 ±12m)`
* **실시간 위치 공유**:
  * `🛰 실시간 위치: 48.858844, 2.294351 ±12m`

메시지에 캡션(Caption)이나 코멘트가 포함된 경우 다음 줄에 자동으로 덧붙여짐:

```text
📍 48.858844, 2.294351 ±12m
여기서 만나요
```

## 컨텍스트 필드 (Context Fields)

위치 정보가 포함된 메시지 수신 시, 에이전트의 `ctx` 객체에 다음 필드들이 추가됨:

* **`LocationLat`**: 위도 (숫자)
* **`LocationLon`**: 경도 (숫자)
* **`LocationAccuracy`**: 정확도 (미터 단위 숫자, 선택 사항)
* **`LocationName`**: 장소 이름 (문자열, 선택 사항)
* **`LocationAddress`**: 장소 주소 (문자열, 선택 사항)
* **`LocationSource`**: 정보 소스 (`pin` | `place` | `live`)
* **`LocationIsLive`**: 실시간 공유 여부 (불리언)

## 채널별 특이 사항

* **Telegram**: 장소 정보는 `LocationName` 및 `LocationAddress` 필드에 매핑됨. 실시간 위치는 제공된 유효 기간(`live_period`) 정보를 활용함.
* **WhatsApp**: `locationMessage.comment` 또는 `liveLocationMessage.caption` 필드 내용이 본문의 캡션 라인으로 사용됨.
* **Matrix**: `geo_uri`를 분석하여 위치 핀 정보를 생성함. 고도(Altitude) 정보는 무시되며, `LocationIsLive` 값은 항상 `false`로 설정됨.
