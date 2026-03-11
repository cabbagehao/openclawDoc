---
summary: "수신 채널 위치 파싱(Telegram + WhatsApp)과 컨텍스트 필드"
read_when:
  - 채널 위치 파싱을 추가하거나 수정할 때
  - 에이전트 프롬프트나 도구에서 위치 컨텍스트 필드를 사용할 때
title: "채널 위치 파싱"
---

# 채널 위치 파싱

OpenClaw는 채팅 채널에서 공유된 위치를 다음과 같이 정규화합니다:

- 수신 본문에 사람이 읽기 쉬운 텍스트를 덧붙이고,
- 자동 응답 컨텍스트 페이로드에 구조화된 필드를 추가합니다.

현재 지원:

- **Telegram** (위치 핀 + 장소 + 실시간 위치)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`geo_uri`가 있는 `m.location`)

## 텍스트 형식

위치는 괄호 없이 읽기 쉬운 줄 형식으로 렌더링됩니다:

- 핀:
  - `📍 48.858844, 2.294351 ±12m`
- 이름 있는 장소:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- 실시간 공유:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

채널에 캡션/코멘트가 포함되어 있으면 다음 줄에 덧붙입니다:

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## 컨텍스트 필드

위치가 있으면 다음 필드가 `ctx`에 추가됩니다:

- `LocationLat` (숫자)
- `LocationLon` (숫자)
- `LocationAccuracy` (숫자, 미터; 선택 사항)
- `LocationName` (문자열; 선택 사항)
- `LocationAddress` (문자열; 선택 사항)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (불리언)

## 채널 참고 사항

- **Telegram**: 장소는 `LocationName/LocationAddress`에 매핑되며, 실시간 위치는 `live_period`를 사용합니다.
- **WhatsApp**: `locationMessage.comment`와 `liveLocationMessage.caption`은 캡션 줄에 덧붙여집니다.
- **Matrix**: `geo_uri`는 핀 위치로 파싱되며, 고도는 무시되고 `LocationIsLive`는 항상 false입니다.
