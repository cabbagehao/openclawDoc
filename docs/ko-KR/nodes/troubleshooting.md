---
summary: "노드 페어링, foreground 요구 사항, 권한, 도구 실패 문제 해결"
read_when:
  - 노드는 연결되어 있지만 camera/canvas/screen/exec 도구가 실패할 때
  - node pairing과 approvals의 차이를 정리하고 싶을 때
title: "노드 문제 해결"
x-i18n:
  source_path: "nodes/troubleshooting.md"
---

# 노드 문제 해결

status에는 노드가 보이지만 node tool이 실패할 때 이 페이지를 사용하세요.

## 명령 사다리

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그다음 노드 전용 점검:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

정상 신호:

- 노드가 연결되어 있고 `node` role로 paired 상태
- `nodes describe`에 호출하려는 capability가 포함됨
- Exec approvals가 예상한 mode/allowlist를 표시함

## Foreground 요구 사항

`canvas.*`, `camera.*`, `screen.*`는 iOS/Android node에서 foreground 전용입니다.

빠른 확인 및 수정:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE`가 보이면 노드 앱을 foreground로 가져온 뒤 다시 시도하세요.

## 권한 매트릭스

| Capability                   | iOS                                     | Android                                      | macOS node app                | Typical failure code           |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera (+ mic for clip audio)           | Camera (+ mic for clip audio)                | Camera (+ mic for clip audio) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Screen Recording (+ mic optional)       | Screen capture prompt (+ mic optional)       | Screen Recording              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | While Using or Always (depends on mode) | Foreground/Background location based on mode | Location permission           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (node host path)                    | n/a (node host path)                         | Exec approvals required       | `SYSTEM_RUN_DENIED`            |

## Pairing과 approvals의 차이

이 둘은 서로 다른 게이트입니다.

1. **Device pairing**: 이 노드가 gateway에 연결할 수 있는가
2. **Exec approvals**: 이 노드가 특정 shell command를 실행할 수 있는가

빠른 점검:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Pairing이 없다면 먼저 노드 device를 승인하세요.
Pairing은 정상인데 `system.run`이 실패한다면 exec approvals/allowlist를 고치세요.

## 일반적인 노드 오류 코드

- `NODE_BACKGROUND_UNAVAILABLE` → 앱이 background 상태. foreground로 전환하세요.
- `CAMERA_DISABLED` → node settings에서 camera toggle이 꺼짐
- `*_PERMISSION_REQUIRED` → OS permission이 없거나 거부됨
- `LOCATION_DISABLED` → location mode가 off
- `LOCATION_PERMISSION_REQUIRED` → 요청한 location mode 권한이 없음
- `LOCATION_BACKGROUND_UNAVAILABLE` → 앱이 background인데 While Using만 있음
- `SYSTEM_RUN_DENIED: approval required` → exec 요청에 명시적 승인이 필요
- `SYSTEM_RUN_DENIED: allowlist miss` → allowlist mode에서 command가 차단됨
  Windows node host에서는 allowlist mode에서 `cmd.exe /c ...` 같은 shell-wrapper 형식이 ask flow로 승인되지 않는 한 allowlist miss로 처리됩니다.

## 빠른 복구 루프

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

그래도 해결되지 않으면:

- device pairing을 다시 승인
- node app을 다시 열기(foreground)
- OS permission 다시 부여
- exec approval policy를 다시 만들거나 조정

관련 문서:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
