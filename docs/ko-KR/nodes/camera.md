---
description: iOS, Android, macOS 노드에서 OpenClaw 에이전트가 사진과 짧은 동영상을 캡처하도록 설정하는 방법
summary: "에이전트용 카메라 캡처(iOS/Android 노드 + macOS 앱): 사진(jpg)과 짧은 동영상(mp4)"
read_when:
  - iOS/Android 노드 또는 macOS의 카메라 캡처를 추가/수정할 때
  - 에이전트 접근 가능한 MEDIA 임시 파일 워크플로우를 확장할 때
title: "카메라 캡처"
x-i18n:
  source_path: "nodes/camera.md"
---

# 카메라 캡처(에이전트)

OpenClaw는 에이전트 워크플로우를 위한 **카메라 캡처**를 지원합니다.

- **iOS node**(Gateway를 통해 페어링): `node.invoke`로 **사진**(`jpg`) 또는 **짧은 동영상 클립**(`mp4`, 오디오 선택 가능) 캡처
- **Android node**(Gateway를 통해 페어링): `node.invoke`로 **사진**(`jpg`) 또는 **짧은 동영상 클립**(`mp4`, 오디오 선택 가능) 캡처
- **macOS app**(Gateway를 통한 node): `node.invoke`로 **사진**(`jpg`) 또는 **짧은 동영상 클립**(`mp4`, 오디오 선택 가능) 캡처

모든 카메라 접근은 **사용자 제어 설정** 뒤에서만 허용됩니다.

## iOS node

### 사용자 설정(기본값 on)

- iOS Settings 탭 → **Camera** → **Allow Camera** (`camera.enabled`)
  - 기본값: **on** (키가 없으면 활성화로 간주)
  - 끄면 `camera.*` 명령이 `CAMERA_DISABLED`를 반환

### 명령(Gateway `node.invoke` 경유)

- `camera.list`
  - 응답 payload:
    - `devices`: `{ id, name, position, deviceType }` 배열

- `camera.snap`
  - Params:
    - `facing`: `front|back` (기본값: `front`)
    - `maxWidth`: number (선택 사항, iOS node 기본 `1600`)
    - `quality`: `0..1` (선택 사항, 기본 `0.9`)
    - `format`: 현재 `jpg`
    - `delayMs`: number (선택 사항, 기본 `0`)
    - `deviceId`: string (선택 사항, `camera.list`에서 획득)
  - 응답 payload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload guard: 사진은 base64 payload가 5MB 미만이 되도록 다시 압축됩니다.

- `camera.clip`
  - Params:
    - `facing`: `front|back` (기본값: `front`)
    - `durationMs`: number (기본 `3000`, 최대 `60000`으로 clamp)
    - `includeAudio`: boolean (기본 `true`)
    - `format`: 현재 `mp4`
    - `deviceId`: string (선택 사항, `camera.list`에서 획득)
  - 응답 payload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 포그라운드 요구 사항

`canvas.*`와 마찬가지로 iOS node는 **foreground** 에서만 `camera.*` 명령을 허용합니다. background 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### CLI helper(임시 파일 + MEDIA)

첨부 파일을 얻는 가장 쉬운 방법은 디코딩된 미디어를 temp file에 저장하고 `MEDIA:<path>`를 출력하는 CLI helper를 쓰는 것입니다.

예시:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `nodes camera snap`은 기본적으로 **전면과 후면 둘 다** 캡처해 에이전트에 두 시점을 모두 제공합니다.
- 출력 파일은 별도 wrapper를 만들지 않는 이상 OS temp 디렉터리에 있는 임시 파일입니다.

## Android node

### Android 사용자 설정(기본값 on)

- Android Settings sheet → **Camera** → **Allow Camera** (`camera.enabled`)
  - 기본값: **on** (키가 없으면 활성화로 간주)
  - 끄면 `camera.*` 명령이 `CAMERA_DISABLED`를 반환

### 권한

- Android는 런타임 권한이 필요합니다.
  - `camera.snap` 및 `camera.clip` 모두에 `CAMERA`
  - `camera.clip`에서 `includeAudio=true`이면 `RECORD_AUDIO`

권한이 없으면 앱이 가능한 경우 prompt를 띄우고, 거부되면 `camera.*` 요청이 `*_PERMISSION_REQUIRED` 오류로 실패합니다.

### Android 포그라운드 요구 사항

`canvas.*`와 마찬가지로 Android node도 **foreground** 에서만 `camera.*` 명령을 허용합니다. background 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### Android 명령(Gateway `node.invoke` 경유)

- `camera.list`
  - 응답 payload:
    - `devices`: `{ id, name, position, deviceType }` 배열

### Payload guard

사진은 base64 payload가 5MB 미만이 되도록 다시 압축됩니다.

## macOS app

### 사용자 설정(기본값 off)

macOS companion app은 다음 체크박스를 노출합니다.

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - 기본값: **off**
  - 끄면 카메라 요청이 “Camera disabled by user”를 반환

### CLI helper(node invoke)

메인 `openclaw` CLI를 사용해 macOS node에서 카메라 명령을 호출하세요.

예시:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `openclaw nodes camera snap`은 별도로 지정하지 않으면 기본 `maxWidth=1600`을 사용합니다.
- macOS에서는 `camera.snap`이 warm-up과 exposure settle 이후 `delayMs`(기본 2000ms)를 기다린 뒤 촬영합니다.
- 사진 payload는 base64가 5MB 미만이 되도록 다시 압축됩니다.

## 안전 및 실용적 제한

- 카메라와 마이크 접근은 일반적인 OS 권한 prompt를 띄우며(Info.plist usage string 필요), 사용자가 허용해야 합니다.
- 과도하게 큰 node payload(base64 오버헤드 + 메시지 제한)를 막기 위해 동영상 클립은 현재 `<= 60s`로 제한됩니다.

## macOS 화면 동영상(OS 수준)

카메라가 아니라 **화면 동영상**이 필요하면 macOS companion을 사용하세요.

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

참고:

- macOS **Screen Recording** 권한(TCC)이 필요합니다.
