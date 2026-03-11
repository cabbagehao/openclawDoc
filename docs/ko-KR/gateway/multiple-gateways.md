---
summary: "한 호스트에서 여러 OpenClaw Gateway 실행하기(격리, 포트, 프로필)"
read_when:
  - 같은 머신에서 Gateway를 두 개 이상 실행할 때
  - Gateway별로 config/state/port를 격리해야 할 때
title: "여러 Gateway"
---

# 여러 Gateway (같은 호스트)

대부분의 환경은 Gateway 하나를 사용해야 합니다. 단일 Gateway로도 여러 messaging connection과 agent를 처리할 수 있기 때문입니다. 더 강한 격리나 이중화(예: rescue bot)가 필요하다면, 프로필과 포트를 격리한 별도 Gateway를 실행하세요.

## 격리 체크리스트 (필수)

- `OPENCLAW_CONFIG_PATH` — 인스턴스별 config 파일
- `OPENCLAW_STATE_DIR` — 인스턴스별 세션, credential, cache
- `agents.defaults.workspace` — 인스턴스별 workspace 루트
- `gateway.port` (또는 `--port`) — 인스턴스별 고유 포트
- 파생 포트(browser/canvas)가 서로 겹치면 안 됨

이 값들을 공유하면 config race와 port conflict가 발생합니다.

## 권장: 프로필 (`--profile`)

프로필은 `OPENCLAW_STATE_DIR` 과 `OPENCLAW_CONFIG_PATH` 를 자동으로 scope 처리하고 서비스 이름에 suffix를 붙입니다.

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

프로필별 서비스:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Rescue-bot 가이드

같은 호스트에서 두 번째 Gateway를 실행하되, 다음 항목은 각각 별도로 가져가세요.

- profile/config
- state dir
- workspace
- base port(및 파생 포트)

이렇게 하면 rescue bot이 main bot과 격리된 상태를 유지하므로, primary bot이 내려가 있어도 디버깅하거나 config 변경을 적용할 수 있습니다.

포트 간격: base port 사이에 최소 20개 포트의 여유를 두어, 파생되는 browser/canvas/CDP 포트가 절대 충돌하지 않게 하세요.

### 설치 방법 (rescue bot)

```bash
# Main bot (기존 설정이 있거나 새로 설정, --profile 파라미터 없음)
# Runs on port 18789 + Chrome CDC/Canvas/... Ports
openclaw onboard
openclaw gateway install

# Rescue bot (격리된 profile + ports)
openclaw --profile rescue onboard
# Notes:
# - workspace name will be postfixed with -rescue per default
# - Port should be at least 18789 + 20 Ports,
#   better choose completely different base port, like 19789,
# - rest of the onboarding is the same as normal

# To install the service (if not happened automatically during onboarding)
openclaw --profile rescue gateway install
```

## 포트 매핑 (파생)

기준 포트 = `gateway.port` (또는 `OPENCLAW_GATEWAY_PORT` / `--port`).

- browser control service 포트 = 기준 포트 + 2 (loopback only)
- canvas host는 Gateway HTTP 서버에서 제공됨 (`gateway.port` 와 같은 포트)
- Browser profile CDP 포트는 `browser.controlPort + 9 .. + 108` 범위에서 자동 할당됨

config 또는 env에서 이 값들을 override하면, 인스턴스별로 반드시 고유하게 유지해야 합니다.

## Browser/CDP 메모 (자주 밟는 함정)

- 여러 인스턴스에서 `browser.cdpUrl` 을 같은 값으로 **고정하지 마세요**.
- 각 인스턴스는 자체 browser control 포트와 CDP 범위가 필요합니다(해당 인스턴스의 gateway port에서 파생됨).
- 명시적 CDP 포트가 필요하면 인스턴스별로 `browser.profiles.<name>.cdpPort` 를 설정하세요.
- Remote Chrome은 `browser.profiles.<name>.cdpUrl` 을 사용하세요(프로필별, 인스턴스별).

## 수동 env 예시

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## 빠른 확인

```bash
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```
