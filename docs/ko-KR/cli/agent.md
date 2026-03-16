---
summary: "CLI reference for `openclaw agent` (send one agent turn via the Gateway)"
description: "OpenClaw Gateway를 통해 단일 agent turn을 실행하는 `openclaw agent` 명령의 사용 예시와 credential marker 동작을 간단히 정리합니다."
read_when:
  - script에서 단일 agent turn을 실행하려고 할 때
  - reply를 선택적으로 실제 채널에 전달하려고 할 때
title: "agent"
x-i18n:
  source_path: "cli/agent.md"
---

# `openclaw agent`

Gateway를 통해 agent turn 하나를 실행합니다. embedded mode를 쓰려면 `--local`을 사용하세요. 특정 configured agent를 직접 target하려면 `--agent <id>`를 사용합니다.

Related:

- Agent send tool: [Agent send](/tools/agent-send)

## Examples

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## Notes

- 이 명령이 `models.json` 재생성을 트리거하면, SecretRef-managed provider credential은 resolved secret plaintext가 아니라 non-secret marker로 저장됩니다. 예: env var name, `secretref-env:ENV_VAR_NAME`, `secretref-managed`
- marker write는 source-authoritative입니다. OpenClaw는 resolved runtime secret value가 아니라 active source config snapshot의 marker를 저장합니다.
