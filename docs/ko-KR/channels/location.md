---
summary: "수신 채널 위치 파싱(Telegram + WhatsApp)과 컨텍스트 필드"
read_when:
  - 채널 위치 파싱을 추가하거나 수정할 때
  - 에이전트 프롬프트나 tool에서 위치 컨텍스트 필드를 사용할 때
title: "Channel Location Parsing"
description: "OpenClaw가 Telegram, WhatsApp, Matrix에서 공유된 위치를 어떻게 본문 텍스트와 구조화된 컨텍스트 필드로 정규화하는지 설명합니다."
x-i18n:
  source_path: "channels/location.md"
---

# 채널 위치 파싱

OpenClaw는 채팅 채널에서 공유된 위치를 다음 두 가지로 정규화합니다.

- inbound body에 추가되는 사람이 읽기 쉬운 텍스트
- auto-reply context payload의 구조화된 필드

현재 지원:

- **Telegram** (location pin + venue + live location)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` with `geo_uri`)

## 텍스트 포맷

위치는 괄호 없이 읽기 쉬운 줄로 렌더링됩니다.

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Named place:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Live share:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

채널에 caption/comment가 포함되어 있으면 다음 줄에 추가됩니다.

```text
📍 48.858844, 2.294351 ±12m
Meet here
```

## 컨텍스트 필드

위치가 있으면 다음 필드가 `ctx`에 추가됩니다.

- `LocationLat` (number)
- `LocationLon` (number)
- `LocationAccuracy` (number, meters; optional)
- `LocationName` (string; optional)
- `LocationAddress` (string; optional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)

## 채널별 참고

- **Telegram**: venue는 `LocationName/LocationAddress`로 매핑되고, live
  location은 `live_period`를 사용합니다.
- **WhatsApp**: `locationMessage.comment`와 `liveLocationMessage.caption`은
  caption line으로 추가됩니다.
- **Matrix**: `geo_uri`는 pin location으로 파싱되며, altitude는 무시되고
  `LocationIsLive`는 항상 false입니다.
