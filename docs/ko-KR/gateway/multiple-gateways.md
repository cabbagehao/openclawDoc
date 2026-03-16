---
description: 한 호스트에서 여러 OpenClaw Gateway를 프로필, 상태 디렉터리, 포트 단위로 안전하게 격리해 운영하는 방법
summary: "단일 호스트에서 여러 개의 OpenClaw Gateway를 실행하기 위한 격리 및 프로필 설정 가이드"
read_when:
  - 동일한 머신에서 두 개 이상의 Gateway 인스턴스를 운용하고자 할 때
  - 인스턴스별로 설정, 상태 데이터 및 포트를 독립적으로 격리해야 할 때
title: "멀티 Gateway 운영"
x-i18n:
  source_path: "gateway/multiple-gateways.md"
---

# 멀티 Gateway 운영

대부분의 환경에서는 하나의 Gateway만으로도 여러 메시징 연결과 agent를 충분히 처리할 수 있으므로 단일 인스턴스를 권장합니다. 하지만 더 강한 격리나 장애 대비용 rescue bot이 필요하다면, 프로필과 포트를 분리해 여러 Gateway를 한 호스트에서 병렬로 실행할 수 있습니다.

## 격리 필수 체크리스트

인스턴스 간 충돌을 막으려면 다음 항목을 반드시 독립적으로 구성해야 합니다.

- **`OPENCLAW_CONFIG_PATH`**: 인스턴스별 config 파일 경로
- **`OPENCLAW_STATE_DIR`**: 인스턴스별 session, credential, cache 저장 위치
- **`agents.defaults.workspace`**: 인스턴스별 workspace root
- **`gateway.port` (또는 `--port`)**: 인스턴스별 고유 포트
- **파생 포트 (Browser/Canvas)**: 하위 서비스 포트가 겹치지 않도록 유지

이 값들을 공유하면 config race와 포트 충돌이 발생합니다.

## 권장 방법: 프로필 (`--profile`) 사용

profile을 사용하면 `OPENCLAW_STATE_DIR`과 `OPENCLAW_CONFIG_PATH`가 자동으로 분리되고 service 이름에도 suffix가 붙습니다.

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

프로필별 service 설치:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## 레스큐 봇(Rescue-bot) 구축 가이드

메인 봇의 장애 상황에 대비하여 동일 호스트에 독립적인 두 번째 Gateway를 실행함. 레스큐 봇은 다음과 같은 요소를 메인 봇과 완전히 분리하여 운용해야 함:

- 전용 프로필 및 설정 파일.
- 독립된 상태 디렉터리 및 워크스페이스.
- 기본 포트 및 파생 포트.

이렇게 격리된 레스큐 봇은 메인 봇이 가동 중단된 상태에서도 독립적으로 실행되어 디버깅을 수행하거나 설정을 복구하는 용도로 활용될 수 있음.

**포트 간격 주의**: 기본 포트 사이에는 최소 20개 이상의 여유 포트를 두어 브라우저 제어, 캔버스, CDP 포트 등이 서로 충돌하지 않도록 설정하는 것이 안전함.

### 레스큐 봇 설치 절차

```bash
# 1. Main bot setup (existing or fresh, without --profile)
# Uses base port 18789 and derived ports
openclaw onboard
openclaw gateway install

# 2. Rescue bot setup (isolated profile + ports)
openclaw --profile rescue onboard
# Notes:
# - workspace name gets a -rescue suffix by default
# - keep at least 20 ports away from the main base port (18789),
#   or choose a clearly separate base port such as 19789
# - the rest of onboarding is the same as normal

# 3. Install the rescue service (if onboarding did not already do it)
openclaw --profile rescue gateway install
```

## 파생 포트 매핑 규칙

기준 포트(Base port)는 `gateway.port` 설정 또는 `--port` 플래그 값을 따름.

- **브라우저 제어 서비스 포트**: 기준 포트 + 2 (루프백 전용).
- **캔버스 호스트**: Gateway HTTP 서버와 동일한 포트 사용.
- **브라우저 프로필 CDP 포트**: `browser.controlPort + 9` ~ `+ 108` 범위 내에서 자동 할당.

설정이나 환경 변수를 통해 위 포트들을 수동으로 오버라이드하는 경우, 반드시 인스턴스별로 중복되지 않도록 고유값을 유지해야 함.

## 브라우저/CDP 관련 주의 사항

- 여러 인스턴스에서 `browser.cdpUrl` 값을 동일하게 고정하여 사용하지 말 것.
- 각 인스턴스는 기준 포트에서 파생된 고유의 브라우저 제어 포트와 CDP 범위를 가져야 함.
- 특정 CDP 포트가 필요한 경우, 인스턴스별로 `browser.profiles.<name>.cdpPort`를 각각 설정함.
- 원격 크롬(Remote Chrome) 사용 시에는 프로필 및 인스턴스별로 `browser.profiles.<name>.cdpUrl`을 별도로 구성함.

## 환경 변수 수동 설정 예시 (참고용)

```bash
# main instance
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

# rescue instance
OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## 상태 확인 명령어

```bash
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```
