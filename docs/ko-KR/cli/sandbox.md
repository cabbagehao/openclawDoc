---
title: "샌드박스 CLI"
summary: "샌드박스 컨테이너 관리 및 현재 적용된 샌드박스 정책 분석을 위한 명령어 가이드"
read_when: "샌드박스 컨테이너를 관리하거나 샌드박스 및 도구 정책의 동작을 디버깅할 때"
status: active
x-i18n:
  source_path: "cli/sandbox.md"
---

# 샌드박스 CLI

에이전트의 격리된 실행을 위한 Docker 기반 샌드박스 컨테이너를 관리함.

## 개요

OpenClaw는 보안을 위해 에이전트를 격리된 Docker 컨테이너 내에서 실행할 수 있음. `sandbox` 명령어는 특히 시스템 업데이트나 설정 변경 이후 이러한 컨테이너들을 효율적으로 관리할 수 있도록 돕는 도구임.

## 주요 명령어

### `openclaw sandbox explain`

현재 세션이나 에이전트에 **실제로 적용된(Effective)** 샌드박스 모드, 범위(Scope), 워크스페이스 접근 권한, 도구 정책 및 권한 상승 게이트(Elevated gates) 정보를 분석하여 표시함. 문제 발생 시 수정해야 할 설정 키 경로도 함께 안내함.

```bash
# 현재 환경의 유효 정책 분석
openclaw sandbox explain

# 특정 세션의 정책 분석
openclaw sandbox explain --session agent:main:main

# 특정 에이전트의 정책 분석
openclaw sandbox explain --agent work

# 분석 결과를 JSON 형식으로 출력
openclaw sandbox explain --json
```

### `openclaw sandbox list`

현재 생성된 모든 샌드박스 컨테이너의 목록과 상태 및 설정 정보를 나열함.

```bash
# 전체 샌드박스 목록 조회
openclaw sandbox list

# 브라우저 전용 컨테이너만 필터링
openclaw sandbox list --browser

# 목록을 JSON 형식으로 출력
openclaw sandbox list --json
```

**출력 포함 항목:**
- 컨테이너 이름 및 상태 (실행 중/중단됨)
- 사용 중인 Docker 이미지 및 설정 일치 여부
- 생성 후 경과 시간 (Age)
- 마지막 사용 후 유휴 시간 (Idle time)
- 연관된 세션 또는 에이전트 정보

### `openclaw sandbox recreate`

업데이트된 이미지나 설정을 즉시 반영하기 위해 기존 샌드박스 컨테이너를 강제로 삭제하고 재생성하도록 유도함.

```bash
# 모든 컨테이너 재생성
openclaw sandbox recreate --all

# 특정 세션용 컨테이너만 재생성
openclaw sandbox recreate --session main

# 특정 에이전트용 컨테이너만 재생성
openclaw sandbox recreate --agent mybot

# 브라우저 컨테이너만 재생성
openclaw sandbox recreate --browser

# 확인 프롬프트 없이 강제 실행
openclaw sandbox recreate --all --force
```

**옵션 상세:**
- `--all`: 모든 샌드박스 컨테이너를 재생성 대상으로 지정함.
- `--session <key>`: 특정 세션 키와 연결된 컨테이너만 재생성함.
- `--agent <id>`: 특정 에이전트 ID에 속한 컨테이너만 재생성함.
- `--browser`: 브라우저 자동화 전용 컨테이너만 재생성함.
- `--force`: 삭제 전 사용자 확인 단계를 건너뜀.

**중요**: 컨테이너 삭제 후, 해당 에이전트가 다음에 실행될 때 최신 설정을 바탕으로 컨테이너가 자동으로 다시 생성됨.

## 주요 활용 사례

### 1. Docker 이미지 업데이트 후 반영

```bash
# 최신 이미지 가져오기
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 설정 파일(openclaw.json)의 이미지 경로 업데이트:
# agents.defaults.sandbox.docker.image 값을 수정함.

# 변경된 이미지를 적용하기 위해 컨테이너 재생성
openclaw sandbox recreate --all
```

### 2. 샌드박스 설정 변경 후 적용

```bash
# 샌드박스 모드나 범위를 설정 파일에서 수정한 후:
# (예: agents.defaults.sandbox.*)

# 새 설정을 즉시 반영
openclaw sandbox recreate --all
```

### 3. 초기화 명령어(setupCommand) 변경 시

```bash
# 특정 에이전트의 패키지 설치 등 초기화 로직을 바꾼 경우:
openclaw sandbox recreate --agent family
```

## 이 명령어가 필요한 이유

**문제 상황**: 샌드박스 Docker 이미지나 설정을 변경하더라도 다음과 같은 현상이 발생할 수 있음:
- 기존에 실행 중인 컨테이너는 삭제 전까지 이전 설정을 그대로 유지함.
- 유휴 컨테이너는 기본적으로 24시간이 지나야 자동으로 정리(Prune)됨.
- 자주 사용하는 에이전트의 컨테이너는 수동으로 작업하지 않는 한 구버전 이미지를 무기한 사용할 위험이 있음.

**해결책**: `openclaw sandbox recreate` 명령어를 사용하여 명시적으로 구버전 컨테이너를 제거함으로써, 다음 실행 시 최신 설정이 즉시 적용되도록 보장함.

**팁**: 직접 `docker rm` 명령어를 사용하기보다는 이 명령어를 사용할 것을 권장함. Gateway의 컨테이너 명명 규칙을 자동으로 따르며, 세션 키나 범위 설정 변경 시 발생할 수 있는 이름 불일치 문제를 방지할 수 있음.

## 설정 가이드

샌드박스 설정은 `~/.openclaw/openclaw.json`의 `agents.defaults.sandbox` 섹션에서 관리하며, 에이전트별 오버라이드는 `agents.list[].sandbox`에서 수행함.

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... 추가 Docker 옵션
        },
        "prune": {
          "idleHours": 24, // 24시간 유휴 상태 시 자동 정리
          "maxAgeDays": 7, // 생성 후 7일 경과 시 자동 정리
        },
      },
    },
  },
}
```

## 관련 문서

- [샌드박스 가이드 상세](/gateway/sandboxing)
- [에이전트 워크스페이스 설정](/concepts/agent-workspace)
- [Doctor 진단 도구](/gateway/doctor): 샌드박스 환경 설치 상태 점검
