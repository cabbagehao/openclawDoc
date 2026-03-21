---
summary: "WhatsApp 그룹 메시지 처리 동작과 설정(mentionPatterns는 여러 채널에서 공유)"
read_when:
  - 그룹 메시지 규칙이나 멘션 동작을 변경할 때
title: "Group Messages"
description: "WhatsApp 그룹에서 OpenClaw를 멘션 기반으로 깨우는 방법, 그룹 세션 분리, activation 모드, 컨텍스트 주입과 검증 절차를 설명합니다."
x-i18n:
  source_path: "channels/group-messages.md"
---

# 그룹 메시지 (WhatsApp web 채널)

목표: OpenClaw가 WhatsApp 그룹에 참여하되 ping이 있을 때만 깨어나고, 그
스레드를 개인 DM 세션과 분리해 유지하도록 하는 것입니다.

참고: `agents.list[].groupChat.mentionPatterns`는 이제 Telegram, Discord,
Slack, iMessage에서도 사용됩니다. 이 문서는 WhatsApp 전용 동작에 집중합니다.
멀티 에이전트 구성이면 에이전트별로
`agents.list[].groupChat.mentionPatterns`를 설정하세요(또는 전역 fallback으로
`messages.groupChat.mentionPatterns`를 사용).

## 구현된 내용(2025-12-03)

- Activation mode: `mention`(기본값) 또는 `always`.
  - `mention`은 ping이 필요합니다(실제 WhatsApp `mentionedJids` @-mention,
    regex pattern, 또는 텍스트 어디에나 있는 bot의 E.164).
  - `always`는 모든 메시지에서 에이전트를 깨우지만, 의미 있는 답변이 가능할
    때만 응답하고 그렇지 않으면 silent token `NO_REPLY`를 반환해야 합니다.
  - 기본값은 config(`channels.whatsapp.groups`)에서 설정할 수 있고, 그룹별로
    `/activation`으로 override할 수 있습니다. `channels.whatsapp.groups`를
    설정하면 그룹 allowlist 역할도 합니다(모두 허용하려면 `"*"` 포함).
- Group policy: `channels.whatsapp.groupPolicy`는 그룹 메시지 수락 여부를
  제어합니다(`open|disabled|allowlist`). `allowlist`는
  `channels.whatsapp.groupAllowFrom`을 사용합니다(fallback:
  명시적인 `channels.whatsapp.allowFrom`). 기본값은 `allowlist`입니다
  (sender를 추가하기 전까지 차단).
- 그룹별 세션: session key는 `agent:<agentId>:whatsapp:group:<jid>` 형식을
  사용하므로 `/verbose on`이나 `/think high` 같은 명령(단독 메시지로 전송)은
  해당 그룹에만 적용됩니다. 개인 DM 상태는 건드리지 않습니다. group thread는
  heartbeat를 건너뜁니다.
- Context injection: 실행을 트리거하지 않은 **pending-only** 그룹 메시지(기본
  50개)는 `[Chat messages since your last reply - for context]` 아래에
  붙고, 트리거한 줄은 `[Current message - respond to this]` 아래에
  들어갑니다. 이미 session에 있는 메시지는 다시 주입하지 않습니다.
- Sender surfacing: 각 그룹 batch 끝에는 `[from: Sender Name (+E164)]`가
  붙으므로 Pi가 누가 말하고 있는지 알 수 있습니다.
- Ephemeral/view-once: 텍스트와 멘션을 추출하기 전에 이를 unwrap하므로, 그
  안의 ping도 트리거됩니다.
- Group system prompt: 그룹 세션의 첫 턴(그리고 `/activation`으로 mode가 바뀔
  때마다)에는 `You are replying inside the WhatsApp group "<subject>"...`
  같은 짧은 설명을 system prompt에 주입합니다. metadata가 없어도 group chat
  이라는 점은 알려줍니다.

## Config 예시(WhatsApp)

WhatsApp가 텍스트 본문에서 시각적인 `@`를 제거하더라도 display-name ping이
동작하도록 `~/.openclaw/openclaw.json`에 `groupChat` block을 추가합니다.

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

- regex는 대소문자를 구분하지 않으며 `@openclaw` 같은 display-name ping과
  `+`/공백 유무와 관계없는 raw number를 모두 포괄합니다.
- WhatsApp는 사용자가 연락처를 탭하면 여전히 `mentionedJids`로 canonical
  mention을 보내므로, 번호 fallback은 자주 필요하지 않지만 유용한 안전장치입니다.

### Activation 명령(소유자 전용)

그룹 채팅 명령 사용:

- `/activation mention`
- `/activation always`

이 변경은 owner number(`channels.whatsapp.allowFrom`, 없으면 bot 자신의
E.164)만 할 수 있습니다. 현재 activation mode는 그룹에서 `/status`를 단독
메시지로 보내 확인하세요.

## 사용 방법

1. OpenClaw가 실행 중인 WhatsApp 계정을 그룹에 추가합니다.
2. `@openclaw ...`라고 말하거나 번호를 포함합니다. `groupPolicy: "open"`을
   설정하지 않았다면 allowlisted sender만 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 최근 그룹 컨텍스트와 마지막 `[from: ...]` marker가
   포함되므로 올바른 사람에게 답할 수 있습니다.
4. `/verbose on`, `/think high`, `/new`, `/reset`, `/compact` 같은
   session-level directive는 그 그룹의 session에만 적용됩니다. 인식되도록
   단독 메시지로 보내세요. 개인 DM session은 독립적으로 유지됩니다.

## 테스트 / 검증

- 수동 smoke:
  - 그룹에서 `@openclaw` ping을 보내고, sender name을 언급하는 답장이 오는지
    확인합니다.
  - 두 번째 ping을 보내 history block이 포함되었다가 다음 턴에 비워지는지
    확인합니다.
- `--verbose`로 gateway logs를 보고 `inbound web message` 항목에
  `from: <groupJid>`와 `[from: ...]` suffix가 나타나는지 확인합니다.

## 알려진 고려 사항

- Groups에서는 시끄러운 broadcast를 피하기 위해 heartbeat를 의도적으로
  건너뜁니다.
- Echo suppression은 결합된 batch string을 사용하므로, 멘션 없이 같은
  텍스트를 두 번 보내면 첫 번째만 응답을 받습니다.
- Session store entry는 session store(기본
  `~/.openclaw/agents/<agentId>/sessions/sessions.json`)에
  `agent:<agentId>:whatsapp:group:<jid>`로 나타납니다. 항목이 없다는 것은
  아직 그 그룹이 run을 트리거하지 않았다는 뜻일 뿐입니다.
- 그룹의 typing indicator는 `agents.defaults.typingMode`를 따릅니다
  (기본값: unmentioned 상태에서는 `message`).
