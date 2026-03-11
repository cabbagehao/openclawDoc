---
summary: "단일 호스트에서 여러 개의 OpenClaw Gateway를 실행하기 위한 격리 및 프로필 설정 가이드"
read_when:
  - 동일한 머신에서 두 개 이상의 Gateway 인스턴스를 운용하고자 할 때
  - 인스턴스별로 설정, 상태 데이터 및 포트를 독립적으로 격리해야 할 때
title: "멀티 Gateway 운영"
x-i18n:
  source_path: "gateway/multiple-gateways.md"
---

# 멀티 Gateway 운영 (동일 호스트)

일반적으로 하나의 Gateway만으로도 여러 메시징 연결과 에이전트를 충분히 처리할 수 있으므로 단일 인스턴스 사용을 권장함. 하지만 보안상의 이유로 강력한 격리가 필요하거나 장애 대비용 시스템(예: 레스큐 봇)을 구축해야 하는 경우에는 별도의 프로필과 포트를 할당하여 여러 개의 Gateway를 병렬로 실행할 수 있음.

## 격리 필수 체크리스트

인스턴스 간 충돌을 방지하기 위해 다음 항목들을 반드시 독립적으로 구성해야 함:

- **`OPENCLAW_CONFIG_PATH`**: 인스턴스별 고유 설정 파일 경로.
- **`OPENCLAW_STATE_DIR`**: 세션, 인증 정보, 캐시 등이 저장될 인스턴스별 상태 디렉터리.
- **`agents.defaults.workspace`**: 각 인스턴스가 사용할 워크스페이스 루트 경로.
- **`gateway.port` (또는 `--port`)**: 인스턴스별 고유 대기 포트.
- **파생 포트 (Browser/Canvas)**: 하위 서비스용 포트들이 서로 겹치지 않도록 주의해야 함.

위 항목들을 공유할 경우 설정 값 경합(Config race)이나 포트 충돌이 발생하여 시스템이 정상적으로 작동하지 않음.

## 권장 방법: 프로필 (`--profile`) 사용

프로필 기능을 사용하면 `OPENCLAW_STATE_DIR` 및 `OPENCLAW_CONFIG_PATH` 경로가 자동으로 분리되고, 서비스 이름에 접미사(Suffix)가 붙어 관리가 용이해짐.

```bash
# 메인 인스턴스 (Main)
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# 레스큐 인스턴스 (Rescue)
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

**프로필별 서비스 등록:**

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
# 1. 메인 봇 설정 (기존 설치본 또는 신규 설치, --profile 생략 시 기본값 사용)
# 기본 포트 18789 및 관련 파생 포트 사용
openclaw onboard
openclaw gateway install

# 2. 레스큐 봇 설정 (격리된 프로필 및 포트 사용)
openclaw --profile rescue onboard
# 참고: 
# - 워크스페이스 이름 뒤에 자동으로 '-rescue' 접미사가 붙음.
# - 포트는 메인 포트(18789)와 겹치지 않도록 20개 이상 차이를 두거나, 
#   아예 다른 대역(예: 19789)을 선택할 것을 권장함.
# - 나머지 온보딩 과정은 일반적인 절차와 동일함.

# 3. 레스큐 봇 서비스 등록 (온보딩 중 자동 등록되지 않은 경우)
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
# 메인 인스턴스 실행
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

# 레스큐 인스턴스 실행
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
