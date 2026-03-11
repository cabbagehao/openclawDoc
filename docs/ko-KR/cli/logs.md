---
summary: "RPC를 통해 Gateway 서버 로그를 실시간으로 확인(Tail)하는 `openclaw logs` 명령어 레퍼런스"
read_when:
  - SSH 접속 없이 원격으로 Gateway 로그를 실시간 모니터링하고자 할 때
  - 로그 분석 도구 연동을 위해 JSON 형식의 로그 데이터가 필요할 때
title: "logs"
x-i18n:
  source_path: "cli/logs.md"
---

# `openclaw logs`

RPC 통신을 통해 Gateway 서버의 파일 로그를 실시간으로 확인(Tail)함. 원격 연결 모드에서도 동일하게 작동함.

**관련 문서:**
- 로깅 시스템 개요: [Logging](/logging)

## 사용 예시

```bash
# 최근 로그 출력
openclaw logs

# 실시간 로그 스트리밍 (Tail -f)
openclaw logs --follow

# 기계 판독 가능한 JSON 형식으로 출력
openclaw logs --json

# 출력할 로그 라인 수 제한
openclaw logs --limit 500

# 타임스탬프를 현재 접속 중인 기기의 로컬 시간대로 표시
openclaw logs --local-time

# 실시간 스트리밍 시 로컬 시간대 적용
openclaw logs --follow --local-time
```

**팁**: 서버 로그는 기본적으로 UTC 또는 서버 시간대를 따르나, `--local-time` 플래그를 사용하면 사용자의 현재 시간대로 자동 변환하여 표시되므로 분석이 용이함.
