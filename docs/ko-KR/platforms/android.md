---
description: "Android 노드 앱의 Gateway 연결, pairing, command 표면과 디버깅 runbook을 설명합니다"
summary: "Android 앱(node): 연결 런북 + Connect/Chat/Voice/Canvas 명령 표면"
read_when:
  - Android node를 페어링하거나 다시 연결할 때
  - Android gateway discovery 또는 auth 문제를 디버깅할 때
  - 클라이언트 간 chat history 동등성을 확인할 때
title: "Android App"
x-i18n:
  source_path: "platforms/android.md"
---

# Android App (Node)

## Support snapshot

- 역할: companion node 앱(Android는 Gateway를 호스팅하지 않음)
- Gateway 필요 여부: 예(macOS, Linux 또는 WSL2를 통한 Windows에서 실행)
- 설치: [Getting Started](/start/getting-started) + [Pairing](/channels/pairing)
- Gateway: [Runbook](/gateway) + [Configuration](/gateway/configuration)
  - 프로토콜: [Gateway protocol](/gateway/protocol) (nodes + control plane)

## System control

system control(launchd/systemd)은 Gateway 호스트에 있습니다. [Gateway](/gateway)를 참고하세요.

## Connection Runbook

Android node app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android는 Gateway WebSocket(기본값 `ws://<host>:18789`)에 직접 연결하고 device pairing(`role: node`)을 사용합니다.

### Prerequisites

- “master” 머신에서 Gateway를 실행할 수 있어야 합니다.
- Android 기기/에뮬레이터가 gateway WebSocket에 접근할 수 있어야 합니다.
  - 같은 LAN에서 mDNS/NSD 사용, **또는**
  - 같은 Tailscale tailnet에서 Wide-Area Bonjour / unicast DNS-SD 사용(아래 참고), **또는**
  - 수동 gateway host/port 입력(fallback)
- gateway 머신에서 CLI(`openclaw`)를 실행할 수 있어야 합니다(또는 SSH 경유).

### 1) Start the Gateway

```bash
openclaw gateway --port 18789 --verbose
```

로그에서 다음과 비슷한 메시지가 보이는지 확인하세요.

- `listening on ws://0.0.0.0:18789`

tailnet 전용 구성(예: Vienna ⇄ London, 권장)의 경우 Gateway를 tailnet IP에 바인딩하세요.

- gateway 호스트의 `~/.openclaw/openclaw.json`에서 `gateway.bind: "tailnet"`을 설정합니다.
- Gateway 또는 macOS menubar app을 재시작합니다.

### 2) Verify discovery (optional)

gateway 머신에서:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

추가 디버깅 참고: [Bonjour](/gateway/bonjour)

#### Tailnet (Vienna ⇄ London) discovery via unicast DNS-SD

Android NSD/mDNS discovery는 네트워크를 넘지 못합니다. Android node와 gateway가 서로 다른 네트워크에 있지만 Tailscale로 연결되어 있다면, Wide-Area Bonjour / unicast DNS-SD를 대신 사용하세요.

1. gateway 호스트에서 DNS-SD zone(예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시합니다.
2. 선택한 도메인을 그 DNS 서버로 가리키도록 Tailscale split DNS를 구성합니다.

자세한 내용과 CoreDNS 예시는 [Bonjour](/gateway/bonjour)를 참고하세요.

### 3) Connect from Android

Android 앱에서:

- 앱은 **foreground service**(persistent notification)를 통해 gateway 연결을 유지합니다.
- **Connect** 탭을 엽니다.
- **Setup Code** 또는 **Manual** 모드를 사용합니다.
- discovery가 막혀 있으면 **Advanced controls**에서 host/port와 필요 시 TLS/token/password를 수동 입력하세요.

첫 페어링이 성공하면 Android는 앱 시작 시 자동 재연결합니다.

- 수동 endpoint가 활성화되어 있으면 그것을 우선 사용
- 아니면 마지막으로 발견된 gateway를 best-effort로 재사용

### 4) Approve pairing (CLI)

gateway 머신에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

페어링 세부 내용: [Pairing](/channels/pairing)

### 5) Verify the node is connected

- nodes 상태로 확인:

  ```bash
  openclaw nodes status
  ```

- Gateway를 통해 확인:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + history

Android Chat 탭은 세션 선택을 지원합니다. 기본은 `main`이며, 다른 기존 세션도 선택할 수 있습니다.

- History: `chat.history`
- Send: `chat.send`
- Push updates(best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host (recommended for web content)

node가 agent가 디스크에서 수정할 수 있는 실제 HTML/CSS/JS를 보여주게 하려면, node를 Gateway canvas host로 연결하세요.

참고: node는 Gateway HTTP server(기본값 `gateway.port`, 즉 `18789`)에서 canvas를 로드합니다.

1. gateway 호스트에 `~/.openclaw/workspace/canvas/index.html`을 만듭니다.

2. node를 해당 주소로 이동시킵니다(LAN).

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet(선택): 두 기기가 모두 Tailscale에 있으면 `.local` 대신 MagicDNS 이름이나 tailnet IP를 사용하세요. 예: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

이 서버는 HTML에 live-reload client를 주입하고 파일 변경 시 자동 새로고침합니다.
A2UI host는 `http://<gateway-host>:18789/__openclaw__/a2ui/`에 있습니다.

Canvas 명령(포그라운드에서만):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`
  기본 scaffold로 돌아가려면 `{"url":""}` 또는 `{"url":"/"}`를 사용합니다.
  `canvas.snapshot`은 `{ format, base64 }`를 반환하며 기본 `format="jpeg"`입니다.
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL`은 레거시 별칭)

Camera 명령(포그라운드에서만, permission 필요):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

파라미터와 CLI helper는 [Camera node](/nodes/camera)를 참고하세요.

### 8) Voice + expanded Android command surface

- Voice: Android는 Voice 탭에서 단일 mic on/off 흐름을 사용하며, transcript 캡처와 TTS 재생을 지원합니다. 설정되어 있으면 ElevenLabs를 사용하고, 아니면 시스템 TTS로 fallback 합니다. 앱이 포그라운드를 벗어나면 Voice는 중지됩니다.
- Voice wake/talk-mode 토글은 현재 Android UX/runtime에서 제거되어 있습니다.
- 추가 Android 명령 계열(기기 및 permission에 따라 사용 가능):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `motion.activity`, `motion.pedometer`
