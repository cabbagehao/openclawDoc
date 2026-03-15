---
summary: "Gateway를 통해 에이전트의 단일 턴(Turn)을 실행하는 `openclaw agent` 명령어 레퍼런스"
read_when:
  - 셸 스크립트 등에서 에이전트의 1회성 작업을 실행하고 싶을 때
  - 특정 메시지에 대해 에이전트의 응답을 생성하고 전달하고자 할 때
title: "agent"
x-i18n:
  source_path: "cli/agent.md"
---

# `openclaw agent`

Gateway를 통해(또는 `--local` 플래그를 사용하여 내장 모드로) 에이전트의 단일 턴(Turn)을 실행함. `--agent <id>` 옵션을 사용하여 특정 에이전트 인스턴스를 직접 지정할 수 있음.

**관련 도구:**
- 에이전트 메시지 전송: [Agent send](/tools/agent-send)

## 사용 예시

```bash
# 특정 번호로 메시지를 보내고 응답을 생성하여 전송함
openclaw agent --to +15555550123 --message "현재 상태 요약해줘" --deliver

# 특정 에이전트('ops')에게 로그 요약 작업을 요청함
openclaw agent --agent ops --message "시스템 로그 분석해줘"

# 특정 세션 ID를 지정하고 사고 수준(Thinking)을 설정함
openclaw agent --session-id 1234 --message "수신함 요약" --thinking medium

# 보고서를 생성한 후 특정 Slack 채널로 응답을 전송함
openclaw agent --agent ops --message "리포트 생성해" --deliver --reply-channel slack --reply-to "#reports"
```

## 참고 사항

- 이 명령어가 `models.json` 파일의 재생성을 트리거할 경우, 시크릿 참조(SecretRef)로 관리되는 공급자 자격 증명은 실제 평문 비밀 정보가 아닌 비공개 마커(예: 환경 변수명 또는 `secretref-managed` 문자열) 형태로 저장됨.
- `--deliver` 플래그 사용 시 에이전트의 답변이 해당 채널로 실제 전송됨.
- `--local` 모드 사용 시 Gateway 서버를 거치지 않고 로컬 런타임에서 직접 에이전트를 구동함.
