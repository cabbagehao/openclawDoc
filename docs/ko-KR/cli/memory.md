---
summary: "시맨틱 기억(Semantic Memory) 인덱싱 및 검색을 관리하는 `openclaw memory` 명령어 레퍼런스"
description: "시맨틱 memory의 상태를 점검하고, 인덱스를 다시 만들고, 검색 결과를 확인하는 `openclaw memory` CLI 흐름을 정리합니다."
read_when:
  - 에이전트의 기억 데이터를 인덱싱하거나 시맨틱 검색을 수행하고자 할 때
  - 기억 시스템의 가용성 또는 인덱싱 관련 문제를 디버깅할 때
title: "memory"
x-i18n:
  source_path: "cli/memory.md"
---

# `openclaw memory`

시맨틱 memory의 인덱싱과 검색을 관리합니다.
이 기능은 활성화된 memory plugin이 제공하며, 기본값은 `memory-core`입니다. 비활성화하려면 `plugins.slots.memory = "none"`을 설정하세요.

Related:

- Memory concept: [Memory](/concepts/memory)
- Plugins: [Plugins](/tools/plugin)

## 사용 예시

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

## Options

`memory status` 및 `memory index`:

- `--agent <id>`: 단일 agent로 범위를 제한합니다. 지정하지 않으면 구성된 각 agent에 대해 실행되고, agent 목록이 없으면 기본 agent로 fallback합니다.
- `--verbose`: probe 및 indexing 과정의 상세 로그를 출력합니다.

`memory status`:

- `--deep`: vector + embedding 가용성을 실제로 probe합니다.
- `--index`: store가 dirty 상태면 재인덱싱을 실행합니다. (`--deep` 포함)
- `--json`: JSON 형식으로 출력합니다.

`memory index`:

- `--force`: 전체 reindex를 강제로 수행합니다.

`memory search`:

- Query 입력은 위치 인자 `[query]` 또는 `--query <text>` 둘 중 하나를 사용합니다.
- 둘 다 제공하면 `--query`가 우선합니다.
- 둘 다 없으면 명령이 오류와 함께 종료됩니다.
- `--agent <id>`: 단일 agent로 범위를 제한합니다. 기본값은 default agent입니다.
- `--max-results <n>`: 반환할 결과 수를 제한합니다.
- `--min-score <n>`: score가 낮은 결과를 필터링합니다.
- `--json`: 결과를 JSON으로 출력합니다.

Notes:

- `memory index --verbose`는 provider, model, source, batch activity 등 단계별 상세 정보를 출력합니다.
- `memory status`에는 `memorySearch.extraPaths`로 설정한 추가 경로도 포함됩니다.
- 활성 memory의 remote API key가 SecretRef로 설정된 경우, 이 명령은 active gateway snapshot에서 값을 resolve합니다. gateway에 연결할 수 없으면 즉시 실패합니다.
- 이 경로는 `secrets.resolve`를 지원하는 gateway가 필요합니다. 구버전 gateway는 unknown-method 오류를 반환합니다.
