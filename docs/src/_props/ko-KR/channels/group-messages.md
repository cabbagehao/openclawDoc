---
summary: "WhatsApp 그룹 메시지 처리 방식 및 설정 가이드 (멘션 패턴 공유 및 그룹 세션 격리)"
read_when:
  - 그룹 메시지 응답 규칙이나 멘션 감지 설정을 수정하고자 할 때
title: "그룹 메시지"
x-i18n:
  source_path: "channels/group-messages.md"
---

# 그룹 메시지 (WhatsApp 웹 채널)

**목표**: 에이전트가 WhatsApp 그룹 대화에 참여하되 명시적인 호출(Ping)이 있을 때만 활성화되도록 하며, 해당 대화 이력을 개인 DM 세션과 완전히 분리하여 관리하는 것임.

<Note>
  `agents.list[].groupChat.mentionPatterns` 설정은 이제 Telegram, Discord, Slack, iMessage 등 모든 채널에서 공통으로 사용됨. 이 문서는 WhatsApp 전용 동작을 중심으로 설명하며, 멀티 에이전트 환경에서는 에이전트별로 패턴을 다르게 설정할 수 있음.
</Note>

## 주요 기능 및 구현 현황

* **활성화 모드 (Activation Modes)**: `mention` (기본값) 또는 `always`.
  * `mention`: 명시적인 호출 시에만 응답함. 실제 WhatsApp @멘션, 정규표현식 패턴 또는 텍스트 내 봇의 전화번호 포함 여부를 감지함.
  * `always`: 모든 메시지에 대해 에이전트를 활성화함. 에이전트는 내용을 검토한 뒤 유의미한 답변이 가능한 경우에만 응답하며, 그렇지 않을 경우 `NO_REPLY` 토큰을 사용하여 무음 처리함.
  * **설정**: `channels.whatsapp.groups`에서 기본값을 설정하고, 채팅창에서 `/activation` 명령어로 그룹별 오버라이드가 가능함.
* **그룹 정책 (Group Policy)**: `channels.whatsapp.groupPolicy`를 통해 그룹 메시지 수락 여부(`open`, `allowlist`, `disabled`)를 제어함. `allowlist` 사용 시 `groupAllowFrom`에 등록된 발신자만 에이전트를 호출할 수 있음.
* **그룹별 독립 세션**: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>` 형식을 사용함. 따라서 그룹 내에서 실행한 `/think high`나 `/verbose on` 등의 설정은 해당 그룹에만 적용되며 개인 DM 상태에는 영향을 주지 않음. 그룹 세션에서는 하트비트(Heartbeat) 실행을 건너뜀.
* **지능적 컨텍스트 주입**: 직접적인 응답을 트리거하지 않은 이전 메시지들(최대 50개)은 `[Chat messages since your last reply - for context]` 섹션에 포함되어 에이전트에게 전달됨. 현재 응답 대상 메시지는 `[Current message - respond to this]` 아래에 배치됨.
* **발신자 식별**: 모든 메시지 조각 끝에 `[from: 이름 (+번호)]` 마커를 추가하여 에이전트가 현재 누구와 대화 중인지 명확히 인식할 수 있게 함.
* **휘발성/일회성 메시지 지원**: 일회성 보기(View-once) 메시지 내부의 텍스트나 멘션도 정상적으로 추출하여 응답을 트리거함.
* **그룹 전용 시스템 프롬프트**: 그룹 세션 시작 시 그룹명, 멤버 목록, 활성화 모드 정보가 담긴 안내 문구를 시스템 프롬프트에 동적으로 주입함.

## 설정 예시 (WhatsApp)

표시 이름 기반의 멘션이 텍스트에서 누락되더라도 정상적으로 작동하도록 `mentionPatterns`를 설정함:

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

**참고 사항:**

* 정규표현식은 대소문자를 구분하지 않음.
* 연락처를 직접 선택하여 발생하는 표준 멘션(`mentionedJids`)은 패턴 설정 없이도 항상 우선적으로 처리됨.

### 활성화 모드 즉시 변경 (소유자 전용)

그룹 채팅 창에서 직접 명령어를 입력함:

* `/activation mention`: 멘션 시에만 응답.
* `/activation always`: 모든 메시지에 응답 시도.

이 명령어는 `allowFrom`에 등록된 소유자 번호만 실행 가능함. 현재 모드는 `/status` 명령어로 확인 가능함.

## 사용 방법

1. OpenClaw가 구동 중인 WhatsApp 계정을 대상 그룹에 추가함.
2. `@이름` 또는 전화번호를 포함하여 메시지를 보냄. `groupPolicy`가 `allowlist`인 경우 승인된 사용자만 에이전트를 깨울 수 있음.
3. 에이전트의 프롬프트에는 이전 대화 흐름과 발신자 정보가 포함되어 적절한 대상에게 답변을 제공함.
4. `/new`, `/reset`, `/compact` 등의 세션 제어 명령어는 해당 그룹 세션에만 국한되어 적용됨.

## 테스트 및 검증

* **동작 확인**:
  * 그룹에서 봇을 호출하고, 답변에서 발신자의 이름을 올바르게 언급하는지 확인함.
  * 연속된 대화 시 이전 메시지들이 문맥 섹션에 정상적으로 포함되는지 확인함.
* **로그 분석**: `--verbose` 모드로 실행 중인 Gateway 로그에서 `inbound web message` 항목의 `from: <groupJid>` 및 `[from: ...]` 접미사 추가 여부를 모니터링함.

## 알려진 고려 사항

* **하트비트 생략**: 그룹 내 불필요한 공지 발송을 막기 위해 그룹 세션에서는 하트비트 기능을 수행하지 않음.
* **중복 응답 억제**: 멘션이 없는 동일한 텍스트가 반복 수신될 경우, 첫 번째 메시지에 대해서만 응답을 생성함.
* **세션 저장소**: 그룹 세션 데이터는 `agent:<agentId>:whatsapp:group:<jid>` 키값으로 저장됨.
* **입력 중 표시**: 그룹에서의 입력 중 상태 표시는 `agents.defaults.typingMode` 설정을 따르며, 멘션이 없는 경우에는 보통 응답 생성이 시작된 이후(`message` 모드)에만 나타남.
