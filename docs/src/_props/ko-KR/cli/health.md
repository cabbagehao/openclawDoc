---
summary: "RPC를 통한 Gateway 서버 헬스 체크 및 상태 조회를 위한 `openclaw health` 명령어 레퍼런스"
read_when:
  - 현재 실행 중인 Gateway 서버의 가동 상태를 빠르게 확인하고자 할 때
title: "health"
x-i18n:
  source_path: "cli/health.md"
---

# `openclaw health`

현재 실행 중인 Gateway 서버로부터 상태(Health) 정보를 가져옴.

## 사용 예시

```bash
# 기본 헬스 체크 정보 출력
openclaw health

# 상태 정보를 JSON 형식으로 출력
openclaw health --json

# 실시간 프로브 결과 및 상세 정보 포함
openclaw health --verbose
```

## 참고 사항

* **상세 출력 (`--verbose`)**: 실시간 프로브를 수행하며, 여러 개의 채널 계정이 설정된 경우 각 계정별 응답 시간(Timing) 정보를 상세히 출력함.
* **멀티 에이전트 지원**: 여러 에이전트가 운영 중인 경우, 각 에이전트별 세션 저장소 상태 정보가 결과에 포함됨.
