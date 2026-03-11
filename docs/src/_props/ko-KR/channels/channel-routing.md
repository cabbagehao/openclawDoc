---
summary: "채팅 채널별 라우팅 규칙(WhatsApp, Telegram, Discord, Slack) 및 세션/에이전트 매핑 가이드"
read_when:
  - 채널별 메시지 라우팅 또는 수신함 처리 로직을 수정할 때
title: "채널 라우팅"
x-i18n:
  source_path: "channels/channel-routing.md"
---

# 채널 및 라우팅 (Routing)

OpenClaw는 **메시지가 수신된 동일한 채널로 응답을 보냄**. 모델이 응답 채널을 스스로 선택하는 것이 아니며, 라우팅은 호스트 설정에 의해 결정론적으로 제어됨.

## 주요 용어 정의

* **채널 (Channel)**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
* **계정 ID (AccountId)**: 채널별 계정 인스턴스 (지원되는 경우).
* **기본 계정**: `channels.<channel>.defaultAccount` 설정을 통해 아웃바운드 경로에 계정 ID가 명시되지 않았을 때 사용할 기본 계정을 지정함.
  * 다중 계정 환경에서는 명시적인 기본값 설정을 권장함. 미설정 시 첫 번째로 정규화된 계정 ID가 자동으로 선택될 수 있음.
* **에이전트 ID (AgentId)**: 독립된 워크스페이스와 세션 저장소를 가진 논리적 실행 단위 ("두뇌").
* **세션 키 (SessionKey)**: 대화 맥락을 저장하고 동시성 제어(레인 관리)를 위한 식별자.

## 세션 키 구조 예시

개인 대화(DM)는 에이전트의 **메인(Main)** 세션으로 통합됨:

* `agent:<agentId>:<mainKey>` (기본값: `agent:main:main`)

그룹 및 채널 대화는 각 방마다 격리된 세션을 유지함:

* **그룹 대화**: `agent:<agentId>:<channel>:group:<id>`
* **공개 채널/룸**: `agent:<agentId>:<channel>:channel:<id>`

스레드 및 포럼 주제 처리:

* **Slack/Discord 스레드**: 기본 키 뒤에 `:thread:<threadId>`가 추가됨.
* **Telegram 포럼 주제**: 그룹 키 내에 `:topic:<topicId>` 정보가 포함됨.

**예시:**

* `agent:main:telegram:group:-1001234567890:topic:42`
* `agent:main:discord:channel:123456:thread:987654`

## 메인 DM 경로 고정 (Route Pinning)

`session.dmScope`가 `"main"`인 경우, 여러 명의 발신자가 하나의 메인 세션을 공유할 수 있음. 이때 세션의 `lastRoute`(마지막 응답 경로) 정보가 원치 않게 변경되는 것을 방지하기 위해 다음 조건 충족 시 **소유자 고정**이 적용됨:

* `allowFrom` 설정에 와일드카드가 없는 항목이 정확히 하나만 존재할 때.
* 해당 항목이 유효한 발신자 ID로 정규화 가능할 때.
* 현재 메시지의 발신자가 위 소유자와 일치하지 않을 때.

이 경우 OpenClaw는 메시지 이력은 기록하지만, 응답을 엉뚱한 곳으로 보내지 않도록 메인 세션의 `lastRoute` 정보는 갱신하지 않음.

## 라우팅 규칙 (에이전트 선택 프로세스)

수신된 각 메시지는 다음 우선순위에 따라 **단 하나의 에이전트**에게 할당됨:

1. **정확한 피어 일치**: `bindings`의 `peer.kind`와 `peer.id`가 모두 일치.
2. **부모 피어 일치**: 스레드 답장의 경우 원본 메시지의 피어 정보를 상속함.
3. **서버 및 역할 일치 (Discord)**: `guildId`와 `roles`가 모두 일치.
4. **서버 일치 (Discord)**: `guildId`가 일치.
5. **팀 일치 (Slack)**: `teamId`가 일치.
6. **계정 일치**: 특정 채널의 `accountId`와 일치.
7. **채널 전체 일치**: 해당 채널의 모든 계정 대상 (`accountId: "*"`).
8. **기본 에이전트 설정**: `agents.list[].default: true` 인 항목, 또는 목록의 첫 번째 에이전트 (최종 폴백은 `main`).

<Note>
  **주의**: 바인딩 설정에 여러 필드(`peer`, `guildId`, `roles` 등)가 함께 정의된 경우, 해당 필드가 \*\*모두 일치(AND)\*\*해야 규칙이 적용됨.
</Note>

## 브로드캐스트 그룹 (멀티 에이전트 실행)

브로드캐스트 그룹을 설정하면 동일한 수신 메시지에 대해 **여러 에이전트**가 동시에 응답하도록 할 수 있음. 이는 일반적인 응답 조건(멘션, 명령어 등)이 충족되었을 때 실행됨.

상세 가이드: [브로드캐스트 그룹](/channels/broadcast-groups)

## 설정 예시

```json5
{
  agents: {
    list: [
      { id: "support", name: "고객 지원", workspace: "~/.openclaw/workspace-support" }
    ],
  },
  bindings: [
    // 특정 Slack 워크스페이스의 모든 메시지를 support 에이전트로 전달
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    // 특정 Telegram 그룹 메시지를 support 에이전트로 전달
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 세션 데이터 저장

세션 데이터는 상태 디렉터리(기본값: `~/.openclaw`) 하위에 저장됨:

* **인덱스 파일**: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
* **대화 이력**: 인덱스 파일과 동일한 위치에 JSONL 형식으로 저장됨.

`session.store` 설정을 통해 저장 경로를 커스터마이징할 수 있음.

## WebChat 동작 원리

WebChat은 **선택된 에이전트**에 직접 연결되며 기본적으로 해당 에이전트의 메인 세션을 사용함. 이를 통해 사용자는 여러 채널에서 발생한 대화 맥락을 WebChat 한곳에서 통합하여 확인할 수 있음.

## 답장 맥락 처리 (Reply Context)

수신된 답장 메시지에는 다음 정보가 포함됨:

* `ReplyToId`, `ReplyToBody`, `ReplyToSender` (사용 가능한 경우).
* 인용된 내용은 에이전트에게 전달될 때 본문 끝에 `[Replying to ...]` 블록 형식으로 자동 추가됨.

이 처리 방식은 모든 통신 채널에서 동일하게 적용됨.
