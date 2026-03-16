---
summary: "노드용 위치 명령(location.get), 권한 모드, Android foreground 동작"
description: "`location.get` node command의 permission mode, Android foreground 제한, `node.invoke` payload와 error codes를 설명합니다."
read_when:
  - "위치 node 지원이나 permissions UI를 추가할 때"
  - "Android 위치 permissions 또는 foreground 동작을 설계할 때"
title: "위치 명령"
x-i18n:
  source_path: "nodes/location-command.md"
---

# 위치 명령(nodes)

## TL;DR

- `location.get`은 node command입니다(`node.invoke` 경유).
- 기본값은 꺼짐입니다.
- Android 앱 설정은 Off / While Using 선택자를 사용합니다.
- Precise Location은 별도 토글입니다.

## Why a selector (not just a switch)

OS permissions는 여러 단계로 나뉩니다. 앱 안에서는 selector를 노출할 수 있지만, 실제 grant는 여전히 OS가 결정합니다.

- iOS/macOS는 시스템 prompt/Settings에서 **While Using** 또는 **Always**를 노출할 수 있습니다.
- Android app은 현재 foreground location만 지원합니다.
- Precise location은 별도의 grant입니다 (iOS 14+ “Precise”, Android의 “fine” vs “coarse”).

UI의 selector는 우리가 요청하는 mode를 결정하고, 실제 grant는 OS settings에 있습니다.

## 설정 모델

Per node device:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 동작:

- `whileUsing`을 선택하면 foreground permission을 요청합니다.
- OS가 요청한 level을 거부하면, 가장 높은 granted level로 되돌리고 상태를 표시합니다.

## Permissions mapping (`node.permissions`)

선택 사항입니다. macOS node는 permissions map을 통해 `location`을 보고하며, iOS/Android는 생략할 수 있습니다.

## Command: `location.get`

`node.invoke`를 통해 호출됩니다.

Params (권장):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Response payload:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Errors (stable codes):

- `LOCATION_DISABLED`: selector가 off
- `LOCATION_PERMISSION_REQUIRED`: 요청한 mode의 permission이 없음
- `LOCATION_BACKGROUND_UNAVAILABLE`: app이 background인데 While Using만 허용됨
- `LOCATION_TIMEOUT`: 제때 위치를 얻지 못함
- `LOCATION_UNAVAILABLE`: system failure / provider 없음

## Background behavior

- Android app은 background 상태에서 `location.get`을 거부합니다.
- Android에서 위치를 요청할 때는 OpenClaw를 열어 두세요.
- 다른 노드 플랫폼은 다를 수 있습니다.

## Model/tooling integration

- Tool surface: `nodes` tool이 `location_get` action을 추가합니다 (node 필요)
- CLI: `openclaw nodes location get --node <id>`
- Agent guidelines: 사용자가 location을 활성화했고 범위를 이해할 때만 호출하세요.

## UX copy (suggested)

- Off: “Location sharing is disabled.”
- While Using: “Only when OpenClaw is open.”
- Precise: “Use precise GPS location. Toggle off to share approximate location.”
