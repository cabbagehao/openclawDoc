---
summary: "macOS 의 Gateway runtime (외부 launchd 서비스)"
read_when:
  - OpenClaw.app 을 패키징할 때
  - macOS gateway launchd 서비스를 디버깅할 때
  - macOS 용 gateway CLI 를 설치할 때
title: "Gateway on macOS"
---

# macOS 의 Gateway (외부 launchd)

OpenClaw\.app 은 더 이상 Node/Bun 이나 Gateway runtime 을 번들하지 않습니다. macOS 앱은 **외부** `openclaw` CLI 설치를 기대하며, Gateway 를 child process 로 spawn 하지 않고, 사용자별 launchd 서비스를 관리해 Gateway 를 계속 실행 상태로 유지합니다(또는 이미 실행 중인 로컬 Gateway 가 있으면 여기에 attach 합니다).

## CLI 설치(Local mode 에 필수)

Mac 에 Node 22+ 가 필요하며, 이후 `openclaw` 를 전역 설치하세요:

```bash
npm install -g openclaw@<version>
```

macOS 앱의 **Install CLI** 버튼도 npm/pnpm 을 통해 같은 흐름을 실행합니다(Gateway runtime 에 Bun 은 권장되지 않음).

## Launchd (LaunchAgent 로서의 Gateway)

Label:

* `ai.openclaw.gateway` (또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*` 가 남아 있을 수 있음)

Plist 위치(사용자별):

* `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (또는 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

* macOS 앱이 Local mode 에서 LaunchAgent 설치/업데이트를 소유합니다.
* CLI 로도 설치할 수 있습니다: `openclaw gateway install`

동작:

* "OpenClaw Active" 는 LaunchAgent 를 활성화/비활성화합니다.
* 앱을 종료해도 gateway 는 중지되지 않습니다(launchd 가 유지)
* 설정된 포트에서 Gateway 가 이미 실행 중이면 앱은 새 인스턴스를 시작하지 않고 attach 합니다.

로깅:

* launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## 버전 호환성

macOS 앱은 gateway 버전을 자신의 버전과 비교합니다. 호환되지 않으면 전역 CLI 를 앱 버전에 맞춰 업데이트하세요.

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
