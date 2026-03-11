---
summary: "CLI reference for `openclaw memory` (`status`/`index`/`search`)"
read_when:
  - 시맨틱 메모리를 인덱싱하거나 검색하려고 할 때
  - 메모리 가용성이나 인덱싱을 디버깅하고 있을 때
title: "memory"
---

# `openclaw memory`

시맨틱 메모리 인덱싱과 검색을 관리합니다.
활성 메모리 플러그인이 제공합니다(기본값: `memory-core`, 비활성화하려면 `plugins.slots.memory = "none"` 설정).

관련 문서:

- 메모리 개념: [Memory](/concepts/memory)
- 플러그인: [Plugins](/tools/plugin)

## 예시

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 옵션

`memory status` 및 `memory index`:

- `--agent <id>`: 단일 agent 범위로 제한합니다. 이 옵션이 없으면 이 명령들은 구성된 각 agent 에 대해 실행되며, agent 목록이 구성되지 않았다면 기본 agent 로 대체됩니다.
- `--verbose`: 프로브 및 인덱싱 중 상세 로그를 출력합니다.

`memory status`:

- `--deep`: 벡터 + 임베딩 가용성을 검사합니다.
- `--index`: 저장소가 dirty 상태이면 재인덱싱을 실행합니다(`--deep` 포함).
- `--json`: JSON 출력을 표시합니다.

`memory index`:

- `--force`: 전체 재인덱싱을 강제로 수행합니다.

`memory search`:

- 쿼리 입력: 위치 인수 `[query]` 또는 `--query <text>` 중 하나를 전달합니다.
- 둘 다 제공하면 `--query` 가 우선합니다.
- 둘 다 제공하지 않으면 명령은 오류와 함께 종료됩니다.
- `--agent <id>`: 단일 agent 범위로 제한합니다(기본값: 기본 agent).
- `--max-results <n>`: 반환할 결과 수를 제한합니다.
- `--min-score <n>`: 점수가 낮은 일치 항목을 걸러냅니다.
- `--json`: JSON 결과를 표시합니다.

메모:

- `memory index --verbose` 는 단계별 세부 정보(provider, model, sources, batch activity)를 출력합니다.
- `memory status` 에는 `memorySearch.extraPaths` 를 통해 구성된 추가 경로가 포함됩니다.
- 실질적으로 활성화된 메모리 원격 API 키 필드가 SecretRef 로 구성된 경우, 이 명령은 활성 게이트웨이 스냅샷에서 해당 값을 해석합니다. 게이트웨이를 사용할 수 없으면 명령은 즉시 실패합니다.
- 게이트웨이 버전 불일치 참고: 이 명령 경로에는 `secrets.resolve` 를 지원하는 게이트웨이가 필요합니다. 이전 게이트웨이는 unknown-method 오류를 반환합니다.
