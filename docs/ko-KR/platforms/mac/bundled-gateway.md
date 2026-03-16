---
summary: "macOS app이 외부 launchd service로 Gateway를 관리하는 방식을 설명합니다."
description: "OpenClaw.app이 더 이상 bundled Gateway runtime을 포함하지 않고 외부 CLI와 launchd service에 의존하는 구조를 설명합니다."
read_when:
  - OpenClaw.app을 packaging할 때
  - macOS gateway launchd service를 디버깅할 때
  - macOS용 gateway CLI를 설치할 때
title: "Gateway on macOS"
x-i18n:
  source_path: "platforms/mac/bundled-gateway.md"
---

# macOS 의 Gateway (외부 launchd)

OpenClaw.app은 더 이상 Node/Bun이나 Gateway runtime을 번들하지 않습니다. macOS app은 **외부** `openclaw` CLI 설치를 기대하며, Gateway를 child process로 spawn하지 않고 사용자별 launchd service를 관리해 Gateway를 계속 실행 상태로 유지합니다. 이미 실행 중인 local Gateway가 있으면 여기에 attach합니다.

## CLI 설치(Local mode 에 필수)

Mac에는 Node 22+가 필요하며, 이후 `openclaw`를 전역 설치하세요.

```bash
npm install -g openclaw@<version>
```

macOS app의 **Install CLI** 버튼도 npm/pnpm을 통해 같은 흐름을 실행합니다. Gateway runtime에는 Bun을 권장하지 않습니다.

## Launchd (LaunchAgent 로서의 Gateway)

Label:

- `ai.openclaw.gateway` (또는 `ai.openclaw.<profile>`; legacy `com.openclaw.*`가 남아 있을 수 있음)

Plist 위치(사용자별):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (또는 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

- macOS app이 Local mode에서 LaunchAgent install/update를 소유합니다.
- CLI로도 설치할 수 있습니다: `openclaw gateway install`

동작:

- `"OpenClaw Active"`는 LaunchAgent를 활성화/비활성화합니다.
- app을 종료해도 gateway는 중지되지 않습니다(launchd가 유지).
- 설정된 port에서 Gateway가 이미 실행 중이면 app은 새 instance를 시작하지 않고 attach합니다.

로깅:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## 버전 호환성

macOS app은 gateway 버전을 자신의 버전과 비교합니다. 호환되지 않으면 전역 CLI를 app 버전에 맞춰 업데이트하세요.

## Smoke check

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

그다음:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
