---
summary: "`openclaw logs`용 CLI 레퍼런스(RPC를 통한 gateway 로그 tail)"
read_when:
  - SSH 없이 원격으로 Gateway 로그를 tail해야 할 때
  - 도구 연동용 JSON 로그 라인이 필요할 때
title: "logs"
---

# `openclaw logs`

RPC를 통해 Gateway 파일 로그를 tail합니다(원격 모드에서 동작).

관련 문서:

- 로깅 개요: [Logging](/logging)

## 예시

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
```

타임스탬프를 로컬 시간대로 표시하려면 `--local-time`을 사용하세요.
