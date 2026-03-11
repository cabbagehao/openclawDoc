---
summary: "WhatsApp, Telegram, Discord 등 다양한 채널에서의 그룹 대화 동작 방식 및 멘션 게이팅 설정 가이드"
read_when:
  - 그룹 대화의 응답 규칙이나 멘션 필터링 로직을 변경하고자 할 때
title: "그룹 대화 관리"
x-i18n:
  source_path: "channels/groups.md"
---

# 그룹 대화 관리 (Groups)

OpenClaw는 WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Zalo 등 연동된 모든 채널의 그룹 대화에 대해 일관된 관리 체계를 제공함.

## 입문 가이드 (2분 요약)

OpenClaw 에이전트는 사용자의 기존 메시징 계정 내에서 "함께 상주"하는 형태임. 별도의 봇 계정을 운영하는 것이 아니므로, **사용자**가 참여 중인 모든 그룹 대화 내용을 에이전트도 실시간으로 확인할 수 있으며 설정에 따라 응답함.

**기본 동작 원칙:**
- **접근 제한**: 그룹 대화는 기본적으로 제한된 상태(`groupPolicy: "allowlist"`)로 운영됨.
- **멘션 필수**: 멘션 게이팅을 명시적으로 해제하지 않는 한, 에이전트는 본인이 멘션(@이름)되었을 때만 답변함.

즉, **허용된 발신자**가 에이전트를 **멘션**할 때만 에이전트가 활성화됨.

> **핵심 요약 (TL;DR)**
> - **개인 대화(DM)**: `*.allowFrom` 설정으로 제어.
> - **그룹 참여**: `*.groupPolicy` 및 허용 목록(`*.groups`, `*.groupAllowFrom`)으로 제어.
> - **응답 트리거**: 멘션 게이팅(`requireMention`, `/activation` 명령어)으로 제어.

**그룹 메시지 처리 흐름:**
```
그룹 정책(groupPolicy)이 'disabled'인가? -> 메시지 무시
그룹 정책이 'allowlist'인가? -> 허용된 그룹인가? -> 아니오: 메시지 무시
멘션 필수(requireMention)인가? -> 멘션되었는가? -> 아니오: 대화 이력(Context)으로만 저장
위 조건 통과 시 -> 에이전트 응답 생성
```

## 세션 키 (Session Keys)

- **그룹 대화**: `agent:<agentId>:<channel>:group:<id>` 키를 사용하여 세션을 관리함. (공개 채널/룸의 경우 `...:channel:<id>` 사용)
- **Telegram 포럼**: 각 주제(Topic)마다 독립된 세션을 갖도록 그룹 ID 뒤에 `:topic:<threadId>`가 추가됨.
- **하트비트**: 불필요한 알림 방지를 위해 그룹 세션에서는 하트비트(Heartbeat) 실행을 건너뜀.

## 권장 패턴: 개인용 DM + 공개용 그룹 (단일 에이전트 구성)

하나의 에이전트("두뇌")를 유지하면서, 대화 채널에 따라 보안 수준을 다르게 적용하고 싶을 때 유용한 패턴임.

**이유**: 단일 에이전트 모드에서 DM은 **메인 세션**(`agent:main:main`)으로, 그룹은 **비메인 세션**(`agent:main:<channel>:group:<id>`)으로 분류됨. 샌드박스 모드를 `"non-main"`으로 설정하면 다음과 같은 하이브리드 운영이 가능함:

- **개인 DM**: 호스트 권한의 모든 도구 사용 가능 (전체 권한).
- **그룹 대화**: Docker 샌드박스 내에서 격리된 상태로 실행되며 제한된 도구만 사용 가능.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // 그룹/채널 대화만 샌드박스 적용
        scope: "session", // 세션별로 독립된 컨테이너 할당
        workspaceAccess: "none", // 호스트 워크스페이스 접근 차단
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: ["group:messaging", "group:sessions"], // 메시징 및 세션 관리 도구만 허용
        deny: ["group:runtime", "group:fs", "nodes", "cron", "gateway"], // 시스템 도구 전체 차단
      },
    },
  },
}
```

특정 폴더만 그룹 대화 에이전트에게 노출하고 싶다면 샌드박스 설정의 `binds` 옵션을 활용함.

## 그룹 정책 (Group Policy) 상세

각 채널별로 그룹 메시지 수락 정책을 개별적으로 제어할 수 있음:

| 정책 (Policy) | 동작 설명 |
| :--- | :--- |
| `"open"` | 모든 그룹 메시지를 수락함. (단, 멘션 게이팅 규칙은 여전히 적용됨) |
| `"disabled"` | 해당 채널의 모든 그룹 메시지를 완전히 무시함. |
| `"allowlist"` | 설정된 허용 목록과 일치하는 그룹/룸의 메시지만 처리함. |

<Note>
**주의**: 설정 파일에 특정 채널 블록(`channels.<provider>`)이 아예 없는 경우, 시스템은 보안을 위해 해당 채널의 그룹 메시지를 거부(`allowlist` 모드이나 목록이 비어 있는 상태) 처리함.
</Note>

## 멘션 게이팅 (Mention Gating)

에이전트가 모든 대화에 끼어들지 않도록 제어하는 기능임. 봇의 답변에 사용자가 '답장(Reply)' 기능을 사용하여 메시지를 보내는 경우, 시스템은 이를 암묵적인 멘션으로 간주함.

**설정 예시:**
```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true }, // 모든 그룹에서 멘션 필수
        "123@g.us": { requireMention: false }, // 특정 그룹은 모든 메시지에 응답
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+8210..."], // 커스텀 멘션 패턴
          historyLimit: 50, // 참조할 이전 메시지 개수
        },
      },
    ],
  },
}
```

## 그룹/채널 전용 도구 제한

특정 그룹이나 채널 내에서 에이전트가 사용할 수 있는 도구 권한을 더 세밀하게 제어할 수 있음.

**우선순위 (구체적인 설정이 우선됨):**
1. 그룹 내 특정 발신자별 설정 (`toolsBySender`)
2. 해당 그룹 전체 설정 (`tools`)
3. 기본 발신자 설정 (`"*"`)
4. 기본 도구 설정

## 그룹 허용 목록 (Group Allowlists)

`groups` 섹션의 키값으로 그룹 ID를 등록하면 해당 그룹이 허용 목록에 추가됨. `"*"` 키를 사용하면 모든 그룹을 대상으로 기본 동작(멘션 필수 여부 등)을 일괄 적용할 수 있음.

## 활성화 제어 (Activation - 소유자 전용)

그룹의 소유자(관리자)는 대화 창에서 직접 에이전트의 반응 모드를 변경할 수 있음 (현재 WhatsApp 지원):
- `/activation mention`: 멘션 시에만 답변하도록 설정.
- `/activation always`: 모든 메시지에 대해 답변 시도.

## iMessage 및 WhatsApp 특이 사항

- **iMessage**: 라우팅 및 허용 목록 설정 시 `chat_id:<id>` 형식을 권장함. `imsg chats` 명령어로 ID 확인 가능.
- **WhatsApp**: 상세한 대화 이력 주입 로직 및 멘션 처리 방식은 [WhatsApp 그룹 메시지 상세 가이드](/channels/group-messages) 참조.
