---
summary: "저장된 세션 목록 조회 및 유지보수 관리를 위한 `openclaw sessions` 명령어 레퍼런스"
read_when:
  - 저장된 대화 세션 목록을 확인하거나 최근 활동 내역을 파악하고자 할 때
  - 세션 데이터를 정리하고 디스크 사용량을 최적화하고 싶을 때
title: "sessions"
x-i18n:
  source_path: "cli/sessions.md"
---

# `openclaw sessions`

저장된 모든 대화 세션 목록을 조회함.

## 사용법

```bash
# 기본 에이전트의 세션 목록 조회
openclaw sessions

# 특정 에이전트('work')의 세션 목록 조회
openclaw sessions --agent work

# 모든 에이전트의 세션 목록을 합쳐서 조회
openclaw sessions --all-agents

# 최근 120분 이내에 활동이 있었던 세션만 필터링
openclaw sessions --active 120

# 결과를 JSON 형식으로 출력
openclaw sessions --json
```

### 범위 선택 옵션

- **기본값**: 설정된 기본 에이전트 저장소를 대상으로 함.
- **`--agent <id>`**: 특정 에이전트 ID의 저장소만 대상으로 함.
- **`--all-agents`**: 구성된 모든 에이전트의 저장소 데이터를 집계함.
- **`--store <path>`**: 특정 `sessions.json` 파일 경로를 직접 지정함 (다른 에이전트 관련 플래그와 혼용 불가).

---

## 세션 정리 및 유지보수 (Cleanup)

주기적인 자동 정리 시점까지 기다리지 않고, 즉시 세션 유지보수 작업을 실행함.

```bash
# 실제 삭제 없이 정리 대상만 미리 확인 (Dry-run)
openclaw sessions cleanup --dry-run

# 특정 에이전트의 세션 정리 시뮬레이션
openclaw sessions cleanup --agent work --dry-run

# 설정된 유지보수 모드가 'warn'이더라도 강제로 정리 수행
openclaw sessions cleanup --enforce

# 특정 세션('agent:main:telegram:dm:123')은 디스크 용량 관리 대상에서 제외(보호)
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:dm:123"

# 정리 결과를 JSON 형식으로 요약 출력
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 명령어는 설정 파일의 `session.maintenance` 섹션 정의를 따름.

### 참고 사항

- **범위 제한**: 이 명령어는 오직 **세션 저장소 및 대화 이력(Transcript)** 데이터만을 관리함. 크론 작업의 실행 로그(`cron/runs/*.jsonl`)는 포함되지 않으며, 해당 데이터는 [크론 설정 가이드](/automation/cron-jobs#configuration)의 별도 옵션에 의해 관리됨.
- **`--dry-run`**: 실제 데이터 수정 없이 얼마나 많은 세션이 삭제되거나 제한될지 미리 보여줌. 텍스트 모드에서는 각 세션별 조치 테이블(`Action`, `Key`, `Age`, `Model`, `Flags`)을 출력하여 유지/삭제 여부를 한눈에 확인할 수 있게 함.
- **`--active-key <key>`**: 디스크 용량 제한으로 인해 오래된 세션이 삭제될 때, 특정 세션은 최신 상태와 관계없이 삭제 대상에서 제외함.

### 관련 문서

- 세션 관리 설정 상세: [Configuration reference](/gateway/configuration-reference#session)
