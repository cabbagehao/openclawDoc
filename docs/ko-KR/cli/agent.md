---
summary: "CLI reference for `openclaw agent` (Gateway 를 통해 한 번의 agent 턴 전송)"
read_when:
  - 스크립트에서 agent 턴을 한 번 실행하고 싶을 때(선택적으로 답장 전달)
title: "agent"
---

# `openclaw agent`

Gateway 를 통해 agent 턴을 실행합니다(embedded 모드는 `--local` 사용).
구성된 agent 를 직접 지정하려면 `--agent <id>` 를 사용하세요.

관련 문서:

- Agent send tool: [Agent send](/tools/agent-send)

## 예시

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## 메모

- 이 명령이 `models.json` 재생성을 트리거할 때, SecretRef 로 관리되는 provider 자격 증명은 해석된 비밀 평문이 아니라 비밀이 아닌 마커(예: env var 이름 또는 `secretref-managed`)로 저장됩니다.
