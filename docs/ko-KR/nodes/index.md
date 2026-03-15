---
summary: "노드: canvas/camera/screen/device/notifications/system용 페어링, 기능, 권한, CLI 도우미"
read_when:
  - iOS/Android 노드를 게이트웨이에 페어링할 때
  - 에이전트 컨텍스트용 node canvas/camera를 사용할 때
  - 새 노드 명령이나 CLI 도우미를 추가할 때
title: "노드"
x-i18n:
  source_path: "nodes/index.md"
---

# 노드

**노드(node)** 는 Gateway **WebSocket**(운영자와 같은 포트)에 `role: "node"`로 연결되는 보조 기기(macOS/iOS/Android/헤드리스)이며, `node.invoke`를 통해 명령 표면(예: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`)을 제공합니다. 프로토콜 상세: [Gateway protocol](/gateway/protocol)

레거시 전송 방식: [Bridge protocol](/gateway/bridge-protocol) (TCP JSONL, 현재 노드에서는 deprecated/removed)

macOS도 **node mode** 로 실행할 수 있습니다. 메뉴 막대 앱이 Gateway WS 서버에 연결되고 로컬 canvas/camera 명령을 노드로 노출하므로, `openclaw nodes …` 를 이 Mac에 대해 사용할 수 있습니다.

참고:

- 노드는 **주변 장치(peripheral)** 이지 Gateway가 아닙니다. Gateway 서비스를 직접 실행하지 않습니다.
- Telegram/WhatsApp 등의 메시지는 **게이트웨이** 에 도착하며, 노드로 직접 가지 않습니다.
- 문제 해결 런북: [/nodes/troubleshooting](/nodes/troubleshooting)

## 페어링 + 상태

**WS 노드는 device pairing을 사용합니다.** 노드는 `connect` 시 device identity를 제시하고, Gateway는 `role: node`에 대한 device pairing 요청을 생성합니다. devices CLI(또는 UI)로 승인하세요.

빠른 CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

참고:

- `nodes status`는 해당 device pairing role에 `node`가 포함되어 있으면 노드를 **paired** 로 표시합니다.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject`)는 별도의 gateway-owned node pairing 저장소이며, WS `connect` 핸드셰이크 자체를 차단하지는 않습니다.

## 원격 node host (`system.run`)

Gateway가 한 머신에서 실행되고, 명령은 다른 머신에서 실행되길 원한다면 **node host** 를 사용하세요. 모델은 여전히 **게이트웨이** 와 대화하며, `host=node`가 선택되면 게이트웨이가 `exec` 호출을 **node host** 로 전달합니다.

### 어디에서 무엇이 실행되나

- **Gateway host**: 메시지 수신, 모델 실행, 도구 호출 라우팅
- **Node host**: 노드 머신에서 `system.run` / `system.which` 실행
- **승인(approvals)**: node host의 `~/.openclaw/exec-approvals.json`에서 강제

### node host 시작(포그라운드)

노드 머신에서:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH 터널을 통한 원격 Gateway(루프백 바인드)

Gateway가 loopback(`gateway.bind=loopback`, 로컬 모드 기본값)에 바인드되어 있으면, 원격 node host는 직접 연결할 수 없습니다. SSH 터널을 만들고 node host를 터널의 로컬 끝에 연결하세요.

예시(node host -> gateway host):

```bash
# Terminal A (계속 실행): 로컬 18790 -> gateway 127.0.0.1:18789 포워딩
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: gateway token을 export하고 터널을 통해 연결
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

참고:

- `openclaw node run`은 token 또는 password 인증을 지원합니다.
- 환경 변수가 우선입니다: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- config fallback은 `gateway.auth.token` / `gateway.auth.password`이며, 원격 모드에서는 `gateway.remote.token` / `gateway.remote.password`도 후보입니다.
- 레거시 `CLAWDBOT_GATEWAY_*` 환경 변수는 node-host auth resolution에서 의도적으로 무시됩니다.

### node host 시작(서비스)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### 페어링 + 이름 지정

게이트웨이 호스트에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

이름 지정 옵션:

- `openclaw node run` / `openclaw node install`에 `--display-name` 사용(노드의 `~/.openclaw/node.json`에 저장)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway override)

### 명령 허용 목록 설정

Exec approvals는 **node host별** 입니다. 게이트웨이에서 allowlist 항목을 추가하세요.

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Approvals는 node host의 `~/.openclaw/exec-approvals.json`에 저장됩니다.

### exec를 노드로 지정

기본값 설정(gateway config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

또는 세션별로:

```
/exec host=node security=allowlist node=<id-or-name>
```

설정 후 `host=node`가 붙은 모든 `exec` 호출은 node host에서 실행됩니다(노드의 allowlist/approvals 적용).

관련 문서:

- [Node host CLI](/cli/node)
- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)

## 명령 호출

저수준(raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

에이전트에 `MEDIA` 첨부를 넘기는 일반적인 워크플로우용 고수준 도우미도 있습니다.

## 스크린샷(Canvas snapshots)

노드가 Canvas(WebView)를 표시 중이면 `canvas.snapshot`은 `{ format, base64 }`를 반환합니다.

CLI helper(임시 파일에 기록하고 `MEDIA:<path>` 출력):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 제어

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

참고:

- `canvas present`는 URL 또는 로컬 파일 경로(`--target`)를 받을 수 있고, 위치 지정을 위한 `--x/--y/--width/--height`도 지원합니다.
- `canvas eval`은 인라인 JS(`--js`) 또는 위치 인자를 받습니다.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

참고:

- A2UI v0.8 JSONL만 지원합니다(v0.9/createSurface는 거부됨).

## 사진 + 동영상(node camera)

사진(`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 기본: 전후면 모두(2개의 MEDIA 줄)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

동영상 클립(`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

참고:

- `canvas.*`와 `camera.*`는 노드가 **foreground** 상태일 때만 동작합니다(background 호출은 `NODE_BACKGROUND_UNAVAILABLE` 반환).
- 과도한 base64 payload를 막기 위해 clip duration은 현재 `<= 60s`로 clamp됩니다.
- Android는 가능하면 `CAMERA` / `RECORD_AUDIO` 권한을 요청하며, 거부되면 `*_PERMISSION_REQUIRED`로 실패합니다.

## 화면 녹화(nodes)

지원되는 노드는 `screen.record`(mp4)를 노출합니다. 예:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

참고:

- `screen.record` 지원 여부는 노드 플랫폼에 따라 다릅니다.
- 화면 녹화는 `<= 60s`로 제한됩니다.
- `--no-audio`는 지원 플랫폼에서 마이크 캡처를 비활성화합니다.
- 여러 화면이 있을 때는 `--screen <index>`로 디스플레이를 선택하세요.

## 위치(nodes)

노드는 설정에서 Location이 활성화되어 있으면 `location.get`을 노출합니다.

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

참고:

- Location은 기본적으로 **꺼져 있습니다**.
- “Always”는 시스템 권한이 필요하며, background fetch는 best-effort입니다.
- 응답에는 lat/lon, accuracy(미터), timestamp가 포함됩니다.

## SMS (Android nodes)

Android 노드는 사용자가 **SMS** 권한을 부여하고 기기가 telephony를 지원하면 `sms.send`를 노출할 수 있습니다.

저수준 invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

참고:

- Android 기기에서 권한 프롬프트를 수락해야 capability가 광고됩니다.
- telephony가 없는 Wi-Fi 전용 기기는 `sms.send`를 광고하지 않습니다.

## Android device + personal data commands

Android 노드는 해당 capability가 활성화되어 있으면 추가 command family를 광고할 수 있습니다.

사용 가능한 family:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `motion.activity`, `motion.pedometer`

예시 invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

참고:

- Motion 명령은 사용 가능한 sensor에 따라 capability-gated 됩니다.

## 시스템 명령(node host / mac node)

macOS node는 `system.run`, `system.notify`, `system.execApprovals.get/set`을 노출합니다.
headless node host는 `system.run`, `system.which`, `system.execApprovals.get/set`을 노출합니다.

예시:

```bash
openclaw nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

참고:

- `system.run`은 payload에 stdout/stderr/exit code를 반환합니다.
- `system.notify`는 macOS 앱의 notification permission 상태를 따릅니다.
- 인식되지 않는 node `platform` / `deviceFamily` 메타데이터에는 `system.run`과 `system.which`를 제외하는 보수적 기본 allowlist가 적용됩니다. 알 수 없는 플랫폼에서 이 명령이 꼭 필요하다면 `gateway.nodes.allowCommands`로 명시적으로 추가하세요.
- `system.run`은 `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording`을 지원합니다.
- shell wrapper(`bash|sh|zsh ... -c/-lc`)를 사용할 때 request 범위의 `--env` 값은 명시적 allowlist(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)로 축소됩니다.
- allowlist 모드에서 allow-always를 결정할 때는 알려진 dispatch wrapper(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) 경로 대신 내부 실행 파일 경로가 저장됩니다. 안전하게 unwrap할 수 없으면 allowlist 항목은 자동 저장되지 않습니다.
- Windows node host의 allowlist 모드에서는 `cmd.exe /c`를 통한 shell-wrapper 실행에 승인이 필요합니다(allowlist entry만으로 wrapper 형식이 자동 허용되지는 않음).
- `system.notify`는 `--priority <passive|active|timeSensitive>`와 `--delivery <system|overlay|auto>`를 지원합니다.
- Node host는 `PATH` override를 무시하고 위험한 startup/shell key(`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`)를 제거합니다. 추가 PATH 항목이 필요하면 `--env`로 `PATH`를 넘기지 말고 node host 서비스 환경을 구성하거나 도구를 표준 위치에 설치하세요.
- macOS node mode에서 `system.run`은 macOS 앱의 exec approvals(Settings → Exec approvals)로 제어됩니다. Ask/allowlist/full은 headless node host와 동일하게 동작하며, 거부된 프롬프트는 `SYSTEM_RUN_DENIED`를 반환합니다.
- headless node host에서 `system.run`은 exec approvals(`~/.openclaw/exec-approvals.json`)로 제어됩니다.

## Exec node binding

여러 노드가 있을 때 exec를 특정 노드에 바인딩할 수 있습니다.
이 설정은 `exec host=node`의 기본 노드를 정하며(에이전트별 override 가능), 전역/에이전트 단위로 구성할 수 있습니다.

전역 기본값:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

에이전트별 override:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

어떤 노드든 허용하려면 unset:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Permissions map

노드는 `node.list` / `node.describe` 안에 `permissions` map을 포함할 수 있습니다. 키는 permission 이름(예: `screenRecording`, `accessibility`)이고, 값은 boolean(`true` = granted)입니다.

## Headless node host (cross-platform)

OpenClaw는 Gateway WebSocket에 연결되어 `system.run` / `system.which`를 노출하는 **headless node host**(UI 없음)를 실행할 수 있습니다. Linux/Windows나 서버 옆에서 최소 node를 돌릴 때 유용합니다.

시작:

```bash
openclaw node run --host <gateway-host> --port 18789
```

참고:

- Pairing은 여전히 필요합니다(Gateway에 device pairing prompt가 표시됨).
- node host는 node id, token, display name, gateway connection info를 `~/.openclaw/node.json`에 저장합니다.
- Exec approvals는 `~/.openclaw/exec-approvals.json`에서 로컬로 강제됩니다([Exec approvals](/tools/exec-approvals) 참고).
- macOS에서는 headless node host가 기본적으로 `system.run`을 로컬에서 실행합니다. companion app exec host로 라우팅하려면 `OPENCLAW_NODE_EXEC_HOST=app`을 설정하세요. app host가 없으면 닫힌 상태로 실패하게 하려면 `OPENCLAW_NODE_EXEC_FALLBACK=0`도 추가하세요.
- Gateway WS가 TLS를 사용하면 `--tls` / `--tls-fingerprint`를 추가하세요.

## Mac node mode

- macOS menubar app은 Gateway WS 서버에 노드로 연결되므로, `openclaw nodes …`를 이 Mac에 대해 사용할 수 있습니다.
- 원격 모드에서는 앱이 Gateway port에 대한 SSH tunnel을 열고 `localhost`에 연결합니다.
