---
summary: "`openclaw status`용 CLI 레퍼런스(진단, 프로브, 사용량 스냅샷)"
read_when:
  - 채널 상태와 최근 세션 수신자를 빠르게 진단하려고 할 때
  - 디버깅용으로 붙여넣기 쉬운 전체 상태 출력이 필요할 때
title: "status"
---

# `openclaw status`

채널과 세션에 대한 진단을 제공합니다.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

참고:

- `--deep`는 실시간 프로브(WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal)를 실행합니다.
- 여러 에이전트가 설정된 경우 출력에는 에이전트별 세션 저장소가 포함됩니다.
- 가능하면 개요에 Gateway와 node host 서비스의 설치/런타임 상태가 포함됩니다.
- 개요에는 업데이트 채널과 git SHA도 포함됩니다(소스 체크아웃인 경우).
- 업데이트 정보는 개요에 표시되며, 사용 가능한 업데이트가 있으면 status가 `openclaw update`를 실행하라는 힌트를 출력합니다([Updating](/install/updating) 참고).
- 읽기 전용 status 표면(`status`, `status --json`, `status --all`)은 대상 설정 경로에 대해 지원되는 SecretRef를 가능하면 해석합니다.
- 지원되는 채널 SecretRef가 설정되어 있지만 현재 명령 경로에서 사용할 수 없으면, status는 크래시하지 않고 읽기 전용 상태를 유지하면서 저하된 출력임을 보고합니다. 사람용 출력에는 “configured token unavailable in this command path” 같은 경고가 표시되고, JSON 출력에는 `secretDiagnostics`가 포함됩니다.
