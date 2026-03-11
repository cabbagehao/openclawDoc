---
summary: "페어링된 노드(카메라, 화면, 캔버스 등) 관리 및 명령어 실행을 위한 `openclaw nodes` 명령어 레퍼런스"
read_when:
  - 페어링된 노드 기기들을 관리하거나 상태를 확인하고자 할 때
  - 노드 승인 요청을 처리하거나 특정 노드에 명령을 직접 실행(Invoke)해야 할 때
title: "nodes"
x-i18n:
  source_path: "cli/nodes.md"
---

# `openclaw nodes`

페어링된 노드(기기)를 관리하고 노드 고유의 기능들을 호출(Invoke)함.

**관련 문서:**
- 노드 시스템 개요: [Nodes](/nodes)
- 카메라 노드: [Camera nodes](/nodes/camera)
- 이미지 처리 노드: [Image nodes](/nodes/images)

**공통 옵션:**
- `--url`, `--token`, `--timeout`, `--json`

## 주요 명령어

```bash
# 대기 중인 요청 및 페어링된 전체 노드 목록 조회
openclaw nodes list

# 현재 연결된 노드만 표시
openclaw nodes list --connected

# 최근 24시간 이내에 연결되었던 노드 필터링
openclaw nodes list --last-connected 24h

# 승인 대기 중인 노드 요청만 확인
openclaw nodes pending

# 특정 노드 페어링 요청 승인
openclaw nodes approve <requestId>

# 노드별 헬스 체크 및 상세 상태 확인
openclaw nodes status
```

`nodes list` 실행 시 대기(Pending) 및 페어링 완료(Paired) 테이블이 출력됨. 페어링된 노드 행에는 마지막 접속 이후 경과 시간(Last Connect) 정보가 포함됨.

## 명령어 실행 및 호출 (Invoke / Run)

```bash
# 특정 노드에 직접 명령어 및 파라미터 전달 (저수준 호출)
openclaw nodes invoke --node <ID|이름|IP> --command <명령어> --params <JSON>

# 특정 노드에서 셸 명령어 실행
openclaw nodes run --node <ID|이름|IP> <명령어...>

# 원시 셸 문자열 직접 실행 (예: git status)
openclaw nodes run --raw "git status"

# 특정 에이전트 맥락에서 특정 노드의 셸 명령어 실행
openclaw nodes run --agent main --node <ID|이름|IP> --raw "git status"
```

**`invoke` 상세 옵션:**
- `--params <json>`: 파라미터 JSON 문자열 (기본값: `{}`).
- `--invoke-timeout <ms>`: 노드 호출 타임아웃 (기본값: `15000`).
- `--idempotency-key <key>`: 중복 실행 방지를 위한 멱등성 키 지정.

### `run` 명령어 동작 및 보안 (Exec 스타일)

`nodes run` 명령어는 에이전트(모델)의 실제 실행 동작(기본 설정 및 승인 절차)을 그대로 따름:

- `tools.exec.*` 설정 및 에이전트별 오버라이드 설정을 참조함.
- `system.run` 호출 전 반드시 명령어 실행 승인(`exec.approval.request`) 절차를 거침.
- `tools.exec.node`가 미리 설정된 경우 `--node` 옵션을 생략할 수 있음.
- 해당 노드는 반드시 `system.run` 기능을 지원해야 함 (macOS 컴패니언 앱 또는 헤드리스 노드 호스트).

**`run` 추가 옵션:**
- **`--cwd <path>`**: 명령어 실행 작업 디렉터리 지정.
- **`--env <key=val>`**: 환경 변수 오버라이드 (반복 가능). 
  *참고: 노드 호스트는 보안상 `PATH` 오버라이드 설정을 무시할 수 있음.*
- **`--command-timeout <ms>`**: 실행될 명령어 자체의 시간 제한.
- **`--needs-screen-recording`**: 화면 기록 권한이 필요한 작업임을 명시.
- **`--raw <command>`**: `/bin/sh -lc` 또는 `cmd.exe /c`를 통한 원시 셸 실행.
  *Windows 노드의 경우, 허용 목록 모드에서도 셸 래퍼(`cmd.exe /c`) 실행 시 추가 승인이 필요할 수 있음.*
- **`--agent <id>`**: 특정 에이전트 범위의 승인 정책 및 허용 목록을 적용함.
- **`--ask <mode>`**, **`--security <mode>`**: 승인 프롬프트 및 보안 수준 개별 오버라이드.
