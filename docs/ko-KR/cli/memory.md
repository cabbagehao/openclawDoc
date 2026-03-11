---
summary: "시맨틱 기억(Semantic Memory) 인덱싱 및 검색을 관리하는 `openclaw memory` 명령어 레퍼런스"
read_when:
  - 에이전트의 기억 데이터를 인덱싱하거나 시맨틱 검색을 수행하고자 할 때
  - 기억 시스템의 가용성 또는 인덱싱 관련 문제를 디버깅할 때
title: "memory"
x-i18n:
  source_path: "cli/memory.md"
---

# `openclaw memory`

시맨틱 기억(Semantic Memory)의 인덱싱 및 검색 기능을 관리함. 이 기능은 활성화된 메모리 플러그인(기본값: `memory-core`)에 의해 제공되며, 비활성화하려면 `plugins.slots.memory = "none"` 설정을 사용함.

**관련 문서:**
- 기억 시스템 개념: [Memory](/concepts/memory)
- 플러그인 관리: [Plugins](/tools/plugin)

## 사용 예시

```bash
# 기억 시스템 요약 상태 확인
openclaw memory status

# 벡터 가용성 및 임베딩 상태 상세 점검
openclaw memory status --deep

# 인덱스 강제 재구축
openclaw memory index --force

# 특정 키워드로 시맨틱 검색 수행
openclaw memory search "회의록"

# 검색어 지정 및 최대 결과 개수 제한
openclaw memory search --query "배포 가이드" --max-results 20

# 특정 에이전트('main')의 상태 확인 및 인덱싱
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 주요 옵션

### `memory status` 및 `memory index` 공통
- **`--agent <id>`**: 특정 에이전트 인스턴스로 대상을 한정함. 미지정 시 설정된 모든 에이전트를 대상으로 순차 실행함.
- **`--verbose`**: 점검 및 인덱싱 과정의 상세 로그를 출력함.

### `memory status` 전용
- **`--deep`**: 실제 벡터 데이터베이스 및 임베딩 모델의 가용성을 직접 테스트함.
- **`--index`**: 데이터가 최신 상태가 아닐 경우 자동으로 재인덱싱을 수행함 (`--deep` 포함).
- **`--json`**: 결과 데이터를 JSON 형식으로 출력함.

### `memory index` 전용
- **`--force`**: 변경 사항 유무와 관계없이 전체 인덱스를 처음부터 다시 생성함.

### `memory search` 전용
- **쿼리 입력**: 검색어는 위치 인자로 직접 입력하거나 `--query <text>` 옵션을 사용함. 두 방식 모두 사용 시 `--query` 값이 우선함.
- **`--max-results <n>`**: 반환할 검색 결과의 최대 개수 지정.
- **`--min-score <n>`**: 검색 결과 중 유사도 점수가 특정 수치 미만인 항목을 필터링함.

## 참고 사항

- **인덱싱 상세**: `memory index --verbose` 사용 시 공급자 정보, 모델명, 인덱싱 대상 소스 및 배치 처리 현황을 상세히 확인할 수 있음.
- **추가 경로**: `memory status` 결과에는 `memorySearch.extraPaths` 설정으로 추가된 외부 기억 경로 정보가 포함됨.
- **시크릿 관리**: 원격 임베딩 API 키가 시크릿 참조(SecretRef)로 설정된 경우, CLI는 실행 중인 Gateway로부터 실제 키 값을 안전하게 가져와 사용함. Gateway 서버에 연결할 수 없는 경우 실행이 즉시 중단됨.
- **버전 호환성**: 이 기능은 `secrets.resolve` 메서드를 지원하는 최신 버전의 Gateway 서버를 필요로 함.
