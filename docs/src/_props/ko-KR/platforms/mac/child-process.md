---
summary: "macOS 의 Gateway 라이프사이클(launchd)"
read_when:
  - mac 앱을 gateway 라이프사이클과 통합할 때
title: "Gateway Lifecycle"
---

# macOS 의 Gateway 라이프사이클

macOS 앱은 기본적으로 **launchd 를 통해 Gateway 를 관리** 하며, Gateway 를 child process 로 직접 spawn 하지 않습니다. 먼저 설정된 포트에서 이미 실행 중인 Gateway 에 attach 를 시도하고, 접근 가능한 인스턴스가 없으면 외부 `openclaw` CLI 를 통해 launchd 서비스를 활성화합니다(embedded runtime 없음). 이렇게 하면 로그인 시 자동 시작과 크래시 후 재시작이 안정적으로 동작합니다.

현재는 child-process 모드(앱이 Gateway 를 직접 spawn)는 **사용하지 않습니다**.
UI 와 더 강하게 결합해야 한다면, Gateway 를 터미널에서 수동 실행하세요.

## 기본 동작(launchd)

* 앱은 사용자별 LaunchAgent `ai.openclaw.gateway`
  (`--profile`/`OPENCLAW_PROFILE` 사용 시 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*` 도 지원) 를 설치합니다.
* Local mode 가 활성화되면 앱은 LaunchAgent 가 로드되었는지 확인하고 필요 시 Gateway 를 시작합니다.
* 로그는 launchd gateway 로그 경로에 기록됩니다(Debug Settings 에서 확인 가능).

자주 쓰는 명령:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

이름 있는 profile 을 사용할 때는 label 을 `ai.openclaw.<profile>` 로 바꾸세요.

## 서명되지 않은 개발 빌드

`scripts/restart-mac.sh --no-sign` 은 서명 키가 없을 때 빠른 로컬 빌드를 위한 옵션입니다. launchd 가 서명되지 않은 relay binary 를 가리키지 않도록 다음을 수행합니다:

* `~/.openclaw/disable-launchagent` 작성

서명된 `scripts/restart-mac.sh` 실행은 이 마커가 있으면 override 를 해제합니다. 수동으로 초기화하려면:

```bash
rm ~/.openclaw/disable-launchagent
```

## Attach-only 모드

macOS 앱이 **절대로 launchd 를 설치하거나 관리하지 않게** 하려면 `--attach-only` (또는 `--no-launchd`)로 실행하세요. 그러면 `~/.openclaw/disable-launchagent` 가 설정되고, 앱은 이미 실행 중인 Gateway 에만 attach 합니다. Debug Settings 에서도 같은 동작을 토글할 수 있습니다.

## Remote mode

Remote mode 는 로컬 Gateway 를 시작하지 않습니다. 앱은 원격 호스트로 SSH tunnel 을 열고 그 터널을 통해 연결합니다.

## 왜 launchd 를 선호하나

* 로그인 시 자동 시작
* 내장된 restart/KeepAlive 의미론
* 예측 가능한 로그와 supervision

진정한 child-process 모드가 다시 필요해진다면, 별도의 명시적 dev 전용 모드로 문서화되어야 합니다.
