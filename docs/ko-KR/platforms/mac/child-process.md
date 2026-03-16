---
summary: "macOS에서 Gateway lifecycle을 launchd로 관리하는 방식을 설명합니다."
description: "macOS app이 Gateway를 child process로 직접 띄우지 않고 launchd, attach-only mode, remote mode로 관리하는 이유와 동작을 정리합니다."
read_when:
  - mac app을 gateway lifecycle과 통합할 때
title: "Gateway Lifecycle"
x-i18n:
  source_path: "platforms/mac/child-process.md"
---

# macOS의 Gateway 라이프사이클

macOS app은 기본적으로 **launchd를 통해 Gateway를 관리**하며, Gateway를 child process로 직접 spawn하지 않습니다. 먼저 설정된 port에서 이미 실행 중인 Gateway에 attach를 시도하고, reachable한 instance가 없으면 외부 `openclaw` CLI를 통해 launchd service를 활성화합니다. embedded runtime은 사용하지 않습니다. 이 방식은 로그인 시 자동 시작과 crash 후 재시작을 안정적으로 제공합니다.

현재 child-process mode(app이 Gateway를 직접 spawn하는 방식)는 **사용하지 않습니다**. UI와 더 강하게 결합해야 한다면 Gateway를 terminal에서 수동으로 실행하세요.

## 기본 동작 (launchd)

- app은 사용자별 LaunchAgent `ai.openclaw.gateway`를 설치합니다.
  - `--profile` 또는 `OPENCLAW_PROFILE`을 쓰면 `ai.openclaw.<profile>`
  - legacy `com.openclaw.*`도 지원
- Local mode가 켜져 있으면 app은 LaunchAgent가 로드되었는지 확인하고, 필요하면 Gateway를 시작합니다.
- log는 launchd gateway log path에 기록되며 Debug Settings에서 볼 수 있습니다.

자주 쓰는 명령:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

named profile을 사용할 때는 label을 `ai.openclaw.<profile>`로 바꾸면 됩니다.

## 서명되지 않은 개발 빌드

`scripts/restart-mac.sh --no-sign`은 signing key가 없을 때 빠른 local build를 위한 옵션입니다. launchd가 unsigned relay binary를 가리키지 않도록 다음 marker를 씁니다.

- `~/.openclaw/disable-launchagent`

signed 상태의 `scripts/restart-mac.sh`를 실행하면 marker가 있을 때 이 override를 지웁니다. 수동으로 reset하려면:

```bash
rm ~/.openclaw/disable-launchagent
```

## Attach-only 모드

macOS app이 **절대로 launchd를 설치하거나 관리하지 않게** 하려면 `--attach-only`(또는 `--no-launchd`)로 실행하세요. 이렇게 하면 `~/.openclaw/disable-launchagent`가 설정되고, app은 이미 실행 중인 Gateway에만 attach합니다. 같은 동작은 Debug Settings에서도 토글할 수 있습니다.

## Remote mode

Remote mode는 local Gateway를 시작하지 않습니다. app은 remote host까지 SSH tunnel을 열고 그 tunnel 위로 연결합니다.

## 왜 launchd를 선호하나

- 로그인 시 자동 시작
- 내장된 restart/KeepAlive semantics
- 예측 가능한 log와 supervision

진짜 child-process mode가 다시 필요해지면, 별도의 명시적인 dev-only mode로 문서화하는 편이 맞습니다.
