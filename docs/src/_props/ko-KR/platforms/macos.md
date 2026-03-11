---
summary: "OpenClaw macOS companion app (menu bar + gateway broker)"
read_when:
  - macOS 앱 기능을 구현할 때
  - macOS에서 gateway 라이프사이클 또는 node bridging을 변경할 때
title: "macOS App"
---

# OpenClaw macOS Companion (menu bar + gateway broker)

macOS 앱은 OpenClaw의 **menu-bar companion**입니다. 이 앱은 권한을 소유하고, Gateway를 로컬에서 관리/연결하며(launchd 또는 수동), 에이전트에 macOS 기능을 node로 노출합니다.

## 역할

* menu bar에 네이티브 알림과 상태를 표시합니다.
* TCC prompt(Notifications, Accessibility, Screen Recording, Microphone, Speech Recognition, Automation/AppleScript)를 소유합니다.
* Gateway를 실행하거나 연결합니다(로컬 또는 원격).
* macOS 전용 tool(Canvas, Camera, Screen Recording, `system.run`)을 노출합니다.
* **remote** 모드에서는 로컬 node host service를 시작하고(launchd), **local** 모드에서는 중지합니다.
* 선택적으로 UI 자동화를 위해 **PeekabooBridge**를 호스팅합니다.
* 요청 시 npm/pnpm을 통해 전역 CLI(`openclaw`)를 설치합니다(Gateway runtime에는 bun 비권장).

## Local vs remote 모드

* **Local** (기본값): 앱은 실행 중인 로컬 Gateway가 있으면 여기에 연결하고, 없으면 `openclaw gateway install`을 통해 launchd 서비스를 활성화합니다.
* **Remote**: 앱은 SSH/Tailscale을 통해 Gateway에 연결하며 로컬 프로세스를 시작하지 않습니다.
  앱은 원격 Gateway가 이 Mac에 접근할 수 있도록 로컬 **node host service**를 시작합니다.
  앱은 Gateway를 child process로 spawn하지 않습니다.

## Launchd 제어

앱은 사용자별 LaunchAgent `ai.openclaw.gateway`를 관리합니다(`--profile`/`OPENCLAW_PROFILE` 사용 시 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`도 여전히 unload 가능).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

이름 있는 profile을 실행 중이라면 label을 `ai.openclaw.<profile>`로 바꾸세요.

LaunchAgent가 설치되어 있지 않다면 앱에서 활성화하거나 `openclaw gateway install`을 실행하세요.

## Node 기능 (mac)

macOS 앱은 자신을 node로 제시합니다. 일반적인 명령:

* Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
* Camera: `camera.snap`, `camera.clip`
* Screen: `screen.record`
* System: `system.run`, `system.notify`

이 node는 `permissions` 맵을 보고하여 에이전트가 무엇이 허용되는지 판단할 수 있게 합니다.

Node 서비스 + 앱 IPC:

* 헤드리스 node host service가 실행 중이면(remote 모드), Gateway WS에 node로 연결됩니다.
* `system.run`은 로컬 Unix socket을 통해 macOS 앱(UI/TCC 컨텍스트)에서 실행됩니다. prompt와 출력은 앱 내부에 머뭅니다.

다이어그램 (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run`은 macOS 앱의 **Exec approvals**(Settings → Exec approvals)로 제어됩니다.
보안 + ask + allowlist는 Mac 로컬의 다음 위치에 저장됩니다.

```
~/.openclaw/exec-approvals.json
```

예시:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

참고:

* `allowlist` 항목은 해석된 바이너리 경로에 대한 glob pattern입니다.
* shell 제어 또는 확장 구문(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)을 포함하는 raw shell command text는 allowlist miss로 처리되며, 명시적 승인(또는 shell 바이너리 allowlisting)이 필요합니다.
* prompt에서 “Always Allow”를 선택하면 해당 명령이 allowlist에 추가됩니다.
* `system.run` environment override는 필터링 후(`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` 제거) 앱 환경과 병합됩니다.
* shell wrapper(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 environment override는 작은 명시적 allowlist(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)로 축소됩니다.
* allowlist 모드에서 allow-always 결정을 할 때, 알려진 dispatch wrapper(`env`, `nice`, `nohup`, `stdbuf`, `timeout`)는 wrapper 경로 대신 내부 실행 파일 경로를 저장합니다. 안전하게 unwrapping할 수 없으면 allowlist 항목이 자동 저장되지 않습니다.

## Deep link

앱은 로컬 작업을 위해 `openclaw://` URL scheme를 등록합니다.

### `openclaw://agent`

Gateway `agent` 요청을 트리거합니다.

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

Query parameter:

* `message` (required)
* `sessionKey` (optional)
* `thinking` (optional)
* `deliver` / `to` / `channel` (optional)
* `timeoutSeconds` (optional)
* `key` (optional unattended mode key)

안전성:

* `key`가 없으면 앱이 확인 prompt를 표시합니다.
* `key`가 없으면 앱은 확인 prompt에 대해 짧은 메시지 제한을 적용하고 `deliver` / `to` / `channel`을 무시합니다.
* 유효한 `key`가 있으면 실행은 unattended 방식으로 진행됩니다(개인 자동화용).

## Onboarding 흐름 (일반적)

1. **OpenClaw\.app**을 설치하고 실행합니다.
2. 권한 체크리스트(TCC prompt)를 완료합니다.
3. **Local** 모드가 활성화되어 있고 Gateway가 실행 중인지 확인합니다.
4. 터미널 접근이 필요하면 CLI를 설치합니다.

## 상태 디렉터리 위치 (macOS)

OpenClaw 상태 디렉터리를 iCloud나 다른 클라우드 동기화 폴더에 두지 마세요.
동기화 기반 경로는 지연을 늘리고 세션 및 자격 증명에서 파일 잠금/동기화 경쟁을 일으킬 수 있습니다.

다음처럼 로컬 비동기화 상태 경로를 사용하는 것이 좋습니다.

```bash
OPENCLAW_STATE_DIR=~/.openclaw
```

`openclaw doctor`가 다음 위치 아래의 상태를 감지하면:

* `~/Library/Mobile Documents/com~apple~CloudDocs/...`
* `~/Library/CloudStorage/...`

경고를 표시하고 로컬 경로로 다시 옮길 것을 권장합니다.

## Build & dev workflow (native)

* `cd apps/macos && swift build`
* `swift run OpenClaw` (또는 Xcode)
* 앱 패키징: `scripts/package-mac-app.sh`

## Debug gateway connectivity (macOS CLI)

앱을 실행하지 않고도 macOS 앱이 사용하는 동일한 Gateway WebSocket handshake 및 discovery 로직을 시험하려면 debug CLI를 사용하세요.

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

Connect 옵션:

* `--url <ws://host:port>`: config override
* `--mode <local|remote>`: config에서 해석 (기본값: config 또는 local)
* `--probe`: 새로운 health probe를 강제
* `--timeout <ms>`: 요청 timeout (기본값: `15000`)
* `--json`: diffing용 구조화 출력

Discovery 옵션:

* `--include-local`: “local”로 필터링될 gateway도 포함
* `--timeout <ms>`: 전체 discovery window (기본값: `2000`)
* `--json`: diffing용 구조화 출력

팁: macOS 앱의 discovery pipeline(NWBrowser + tailnet DNS-SD fallback)이 Node CLI의 `dns-sd` 기반 discovery와 다른지 확인하려면 `openclaw gateway discover --json`과 비교하세요.

## 원격 연결 plumbing (SSH tunnel)

macOS 앱이 **Remote** 모드에서 실행되면, 로컬 UI 구성 요소가 원격 Gateway를 localhost처럼 사용할 수 있도록 SSH tunnel을 엽니다.

### Control tunnel (Gateway WebSocket port)

* **Purpose:** health check, status, Web Chat, config 및 기타 control-plane 호출
* **Local port:** Gateway 포트(기본값 `18789`), 항상 고정
* **Remote port:** 원격 호스트의 동일한 Gateway 포트
* **Behavior:** 임의의 로컬 포트 사용 없음. 앱은 기존의 healthy tunnel을 재사용하거나 필요 시 재시작합니다.
* **SSH shape:** BatchMode + ExitOnForwardFailure + keepalive 옵션을 포함한 `ssh -N -L <local>:127.0.0.1:<remote>`
* **IP reporting:** SSH tunnel은 loopback을 사용하므로 gateway는 node IP를 `127.0.0.1`로 보게 됩니다. 실제 client IP가 표시되길 원하면 **Direct (ws/wss)** transport를 사용하세요([macOS remote access](/platforms/mac/remote) 참고).

설정 단계는 [macOS remote access](/platforms/mac/remote)를 참고하세요. 프로토콜 상세는 [Gateway protocol](/gateway/protocol)을 참고하세요.

## 관련 문서

* [Gateway runbook](/gateway)
* [Gateway (macOS)](/platforms/mac/bundled-gateway)
* [macOS permissions](/platforms/mac/permissions)
* [Canvas](/platforms/mac/canvas)
