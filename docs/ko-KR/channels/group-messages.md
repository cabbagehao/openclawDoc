---
summary: "WhatsApp 그룹 메시지 처리 동작과 설정 (`mentionPatterns`는 여러 채널에서 공유됨)"
read_when:
  - 그룹 메시지 규칙이나 멘션 동작을 바꿀 때
title: "그룹 메시지"
x-i18n:
  source_path: "channels/group-messages.md"
---

# 그룹 메시지 (WhatsApp 웹 채널)

목표: Clawd가 WhatsApp 그룹에 들어가 있다가 핑이 올 때만 깨어나고, 그 스레드를 개인 DM 세션과 분리해 유지하도록 하는 것입니다.

참고: `agents.list[].groupChat.mentionPatterns`는 이제 Telegram/Discord/Slack/iMessage에서도 사용됩니다. 이 문서는 WhatsApp 전용 동작에 초점을 둡니다. 멀티 에이전트 구성을 쓴다면 에이전트별로 `agents.list[].groupChat.mentionPatterns`를 설정하세요(또는 전역 fallback으로 `messages.groupChat.mentionPatterns`를 사용하세요).

## 구현된 내용 (2025-12-03)

- 활성화 모드: `mention`(기본값) 또는 `always`. `mention`은 핑이 필요합니다(실제 WhatsApp @-멘션 via `mentionedJids`, regex 패턴, 또는 텍스트 어디에든 있는 봇의 E.164). `always`는 모든 메시지에서 에이전트를 깨우지만, 의미 있는 값을 더할 수 있을 때만 답하고 그렇지 않으면 무음 토큰 `NO_REPLY`를 반환해야 합니다. 기본값은 config(`channels.whatsapp.groups`)에서 설정할 수 있고, 그룹별로 `/activation`으로 덮어쓸 수 있습니다. `channels.whatsapp.groups`가 설정되면 group allowlist 역할도 함께 합니다(모든 그룹을 허용하려면 `"*"` 포함).
- 그룹 정책: `channels.whatsapp.groupPolicy`가 그룹 메시지 수락 여부를 제어합니다(`open|disabled|allowlist`). `allowlist`는 `channels.whatsapp.groupAllowFrom`을 사용하며, 없으면 명시적 `channels.whatsapp.allowFrom`으로 fallback합니다. 기본값은 `allowlist`입니다(발신자를 추가하기 전까지 차단됨).
- 그룹별 세션: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>` 형태이므로 `/verbose on`이나 `/think high` 같은 명령(독립 메시지로 보냄)은 해당 그룹 범위에만 적용됩니다. 개인 DM 상태는 손대지 않습니다. 그룹 스레드에서는 heartbeat를 건너뜁니다.
- 컨텍스트 주입: 실행을 트리거하지 못한 **pending-only** 그룹 메시지(기본값 50개)는 `[Chat messages since your last reply - for context]` 아래에 앞부분으로 붙고, 실제 트리거 라인은 `[Current message - respond to this]` 아래에 붙습니다. 이미 세션에 들어간 메시지는 다시 주입되지 않습니다.
- 발신자 표면화: 이제 모든 그룹 배치 끝에 `[from: Sender Name (+E164)]`가 붙어서 Pi가 누가 말하는지 알 수 있습니다.
- ephemeral/view-once: 텍스트/멘션을 추출하기 전에 이를 unwrap하므로, 그 안의 핑도 여전히 트리거됩니다.
- 그룹 시스템 프롬프트: 그룹 세션의 첫 턴(그리고 `/activation`으로 모드가 바뀔 때마다) 시스템 프롬프트에 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 같은 짧은 설명을 주입합니다. 메타데이터가 없어도 그룹 채팅이라는 사실은 알려 줍니다.

## 설정 예시 (WhatsApp)

WhatsApp가 텍스트 본문에서 시각적 `@`를 제거하더라도 display-name 기반 핑이 동작하도록 `~/.openclaw/openclaw.json`에 `groupChat` 블록을 추가하세요.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

참고:

- 이 regex는 대소문자를 구분하지 않습니다. `@openclaw` 같은 display-name 핑과 `+`/공백 유무에 관계없는 원시 번호를 모두 커버합니다.
- 누군가 연락처를 탭해서 멘션하면 WhatsApp는 여전히 canonical mention을 `mentionedJids`로 보내므로, 번호 fallback은 거의 필요 없지만 안전장치로는 유용합니다.

### 활성화 명령 (소유자 전용)

그룹 채팅 명령 사용:

- `/activation mention`
- `/activation always`

이를 바꿀 수 있는 사람은 소유자 번호(`channels.whatsapp.allowFrom`, 없으면 봇 자신의 E.164)뿐입니다. 현재 활성화 모드를 보려면 그룹에 `/status`를 독립 메시지로 보내세요.

## 사용 방법

1. OpenClaw가 실행 중인 WhatsApp 계정을 그룹에 추가합니다.
2. `@openclaw ...`라고 말하거나 번호를 포함합니다. `groupPolicy: "open"`으로 두지 않았다면 allowlist된 발신자만 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 최근 그룹 컨텍스트와 마지막 `[from: ...]` 마커가 포함되어, 올바른 사람에게 응답할 수 있습니다.
4. 세션 수준 지시(`/verbose on`, `/think high`, `/new` 또는 `/reset`, `/compact`)는 해당 그룹 세션에만 적용됩니다. 반드시 독립 메시지로 보내야 인식됩니다. 개인 DM 세션은 별개로 유지됩니다.

## 테스트 / 검증

- 수동 스모크 테스트:
  - 그룹에서 `@openclaw` 핑을 보내고, 발신자 이름을 참조하는 응답이 오는지 확인합니다.
  - 두 번째 핑을 보내고, history 블록이 포함됐다가 다음 턴에서 비워지는지 확인합니다.
- gateway 로그(`--verbose`로 실행)에서 `from: <groupJid>`와 `[from: ...]` 접미사를 포함한 `inbound web message` 항목을 확인합니다.

## 알려진 고려사항

- 그룹에서는 시끄러운 브로드캐스트를 피하기 위해 heartbeat를 의도적으로 건너뜁니다.
- 에코 억제는 합쳐진 배치 문자열을 기준으로 동작하므로, 멘션 없이 동일한 텍스트를 두 번 보내면 첫 번째만 응답할 수 있습니다.
- 세션 저장소 항목은 기본적으로 `~/.openclaw/agents/<agentId>/sessions/sessions.json` 안에서 `agent:<agentId>:whatsapp:group:<jid>`로 보입니다. 항목이 없다는 것은 아직 그 그룹이 실행을 트리거하지 않았다는 뜻일 뿐입니다.
- 그룹에서의 typing indicator는 `agents.defaults.typingMode`를 따릅니다(기본값: 멘션이 없을 때 `message`).
