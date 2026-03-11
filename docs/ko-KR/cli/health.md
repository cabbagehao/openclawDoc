---
summary: "`openclaw health`용 CLI 레퍼런스(RPC를 통한 gateway health 엔드포인트)"
read_when:
  - 실행 중인 Gateway의 상태를 빠르게 확인하려고 할 때
title: "health"
---

# `openclaw health`

실행 중인 Gateway에서 health 정보를 가져옵니다.

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

참고:

- `--verbose`는 실시간 프로브를 실행하며, 여러 계정이 설정된 경우 계정별 타이밍을 출력합니다.
- 여러 에이전트가 설정된 경우 출력에는 에이전트별 세션 저장소가 포함됩니다.
