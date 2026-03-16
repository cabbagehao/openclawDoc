---
summary: "WhatsApp 채널 지원 상태, 접근 제어, 전달 동작, 운영 포인트 요약"
description: "OpenClaw에서 WhatsApp Web 채널을 설정하는 방법, Baileys 기반 연결, DM 및 그룹 접근 제어, 전달 및 운영 동작을 정리합니다."
read_when:
  - WhatsApp/Web 채널 동작이나 inbox routing을 작업할 때
title: "WhatsApp"
x-i18n:
  source_path: "channels/whatsapp.md"
---

# WhatsApp (Web channel)

상태: WhatsApp Web (Baileys) 기반으로 production-ready입니다. Gateway가 연결된 session을 소유합니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    알 수 없는 발신자에 대한 기본 DM 정책은 pairing입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/gateway/configuration">
    전체 채널 설정 패턴과 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="WhatsApp 접근 정책 설정">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp 연결 (QR)">

```bash
openclaw channels login --channel whatsapp
```

    특정 account에 연결할 때:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="gateway 시작">

```bash
openclaw gateway
```

  </Step>

  <Step title="첫 pairing 요청 승인 (pairing mode 사용 시)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing 요청은 1시간 후 만료됩니다. pending request는 채널당 최대 3개입니다.

  </Step>
</Steps>

<Note>
가능하면 OpenClaw용 WhatsApp은 별도 번호로 운영하는 것이 좋습니다. 채널 metadata와 onboarding 흐름은 그 구성을 기준으로 최적화되어 있지만, 개인 번호 구성도 지원합니다.
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 번호 (권장)">
    가장 깔끔한 운영 방식입니다.

    - OpenClaw 전용 WhatsApp identity 사용
    - 더 명확한 DM allowlist와 routing 경계
    - self-chat 혼동 가능성 감소

    최소 정책 예시:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="개인 번호 fallback">
    Onboarding은 개인 번호 모드를 지원하며 self-chat에 안전한 기본 구성을 기록합니다.

    - `dmPolicy: "allowlist"`
    - `allowFrom`에 개인 번호 포함
    - `selfChatMode: true`

    런타임에서는 연결된 self number와 `allowFrom`을 기준으로 self-chat 보호가 동작합니다.

  </Accordion>

  <Accordion title="WhatsApp Web 전용 채널 범위">
    현재 OpenClaw 채널 아키텍처에서 이 메시징 플랫폼 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    내장 chat-channel registry에는 별도의 Twilio WhatsApp messaging channel이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp socket과 reconnect loop를 소유합니다.
- outbound send는 대상 account에 active WhatsApp listener가 있어야 합니다.
- status chat과 broadcast chat은 무시됩니다. (`@status`, `@broadcast`)
- direct chat은 DM session 규칙을 사용합니다. (`session.dmScope`; 기본 `main`은 DM을 agent main session으로 합침)
- group session은 분리됩니다. (`agent:<agentId>:whatsapp:group:<jid>`)

## 접근 제어와 활성화

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy`는 direct chat 접근을 제어합니다.

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`allowFrom`에 `"*"`가 있어야 함)
    - `disabled`

    `allowFrom`은 E.164 형식 번호를 받으며, 내부적으로 정규화됩니다.

    멀티 계정 override: `channels.whatsapp.accounts.<id>.dmPolicy` 및 `allowFrom`이 해당 account의 채널 기본값보다 우선합니다.

    런타임 동작:

    - pairing은 채널 allow-store에 저장되며 설정된 `allowFrom`과 병합됩니다.
    - allowlist가 비어 있으면 연결된 self number가 기본적으로 허용됩니다.
    - outbound `fromMe` DM은 자동 pairing되지 않습니다.

  </Tab>

  <Tab title="Group policy + allowlists">
    그룹 접근은 두 단계로 구성됩니다.

    1. **그룹 멤버십 allowlist** (`channels.whatsapp.groups`)
       - `groups`가 없으면 모든 그룹이 대상이 될 수 있음
       - `groups`가 있으면 그룹 allowlist 역할을 함 (`"*"` 허용 가능)

    2. **그룹 발신자 정책** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 발신자 allowlist를 우회
       - `allowlist`: 발신자가 `groupAllowFrom` 또는 `*`와 일치해야 함
       - `disabled`: 모든 그룹 inbound 차단

    발신자 allowlist fallback:

    - `groupAllowFrom`이 unset이면, 런타임은 가능한 경우 `allowFrom`으로 fallback합니다.
    - 발신자 allowlist는 mention/reply activation보다 먼저 평가됩니다.

    참고: `channels.whatsapp` 블록이 전혀 없으면, `channels.defaults.groupPolicy`가 설정되어 있어도 런타임 그룹 정책은 `allowlist`로 fallback하며 경고 로그를 남깁니다.

  </Tab>

  <Tab title="Mentions + /activation">
    그룹 답장은 기본적으로 mention이 필요합니다.

    Mention 감지에는 다음이 포함됩니다.

    - bot identity에 대한 명시적 WhatsApp mention
    - 설정된 mention regex 패턴 (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - reply sender가 bot identity와 일치하는 implicit reply-to-bot 감지

    보안 참고:

    - quote/reply는 mention gating만 만족시킵니다. 발신자 권한을 **부여하지는 않습니다**
    - `groupPolicy: "allowlist"`에서는 allowlisted sender가 아닌 경우, allowlisted 사용자의 메시지에 reply하더라도 차단됩니다.

    세션 단위 activation 명령:

    - `/activation mention`
    - `/activation always`

    `activation`은 전역 config가 아니라 session state를 갱신합니다. owner-gated입니다.

  </Tab>
</Tabs>

## 개인 번호와 self-chat 동작

연결된 self number가 `allowFrom`에도 포함되어 있으면 WhatsApp self-chat 보호가 활성화됩니다.

- self-chat turn에서는 read receipt를 생략
- 자기 자신을 다시 ping하게 되는 mention-JID auto-trigger 동작을 무시
- `messages.responsePrefix`가 unset이면 self-chat reply의 기본 prefix는 `[{identity.name}]` 또는 `[openclaw]`

## 메시지 정규화와 컨텍스트

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    들어오는 WhatsApp 메시지는 공용 inbound envelope으로 래핑됩니다.

    quoted reply가 있으면 다음 형식으로 컨텍스트가 추가됩니다.

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    가능할 때는 reply metadata 필드도 채워집니다. (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)

  </Accordion>

  <Accordion title="Media placeholders, location, contact 추출">
    media-only inbound message는 다음과 같은 placeholder로 정규화됩니다.

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Location 및 contact payload는 라우팅 전에 텍스트 컨텍스트로 정규화됩니다.

  </Accordion>

  <Accordion title="Pending group history injection">
    그룹에서는, 처리되지 않은 메시지를 버퍼링했다가 bot이 실제로 트리거될 때 컨텍스트로 주입할 수 있습니다.

    - 기본 limit: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0`이면 비활성화

    주입 마커:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    허용된 inbound WhatsApp message에는 기본적으로 read receipt를 보냅니다.

    전역 비활성화:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    account별 override:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    self-chat turn에서는 전역 설정이 켜져 있어도 read receipt를 보내지 않습니다.

  </Accordion>
</AccordionGroup>

## 전달, 청킹, 미디어

<AccordionGroup>
  <Accordion title="Text chunking">
    - 기본 chunk limit: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 빈 줄 기준 문단 경계를 우선 사용하고, 불가능하면 길이 기준 청킹으로 fallback합니다.
  </Accordion>

  <Accordion title="Outbound media 동작">
    - image, video, audio (PTT voice-note), document payload 지원
    - `audio/ogg`는 voice-note 호환성을 위해 `audio/ogg; codecs=opus`로 재작성
    - animated GIF 재생은 video 전송 시 `gifPlayback: true`로 지원
    - multi-media reply payload에서는 caption이 첫 번째 media item에 적용됨
    - media source는 HTTP(S), `file://`, 로컬 경로를 지원
  </Accordion>

  <Accordion title="Media size limit과 fallback 동작">
    - inbound media 저장 제한: `channels.whatsapp.mediaMaxMb` (기본 `50`)
    - outbound media 전송 제한: `channels.whatsapp.mediaMaxMb` (기본 `50`)
    - account별 override: `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 이미지는 제한에 맞도록 자동 최적화됩니다. (resize/quality sweep)
    - media 전송 실패 시, 첫 항목 fallback은 응답을 조용히 버리지 않고 경고 텍스트를 전송합니다.
  </Accordion>
</AccordionGroup>

## Acknowledgment reactions

WhatsApp은 `channels.whatsapp.ackReaction`으로 inbound 수신 직후 즉시 ack reaction을 보낼 수 있습니다.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

동작 참고:

- inbound가 수락되면 reply 전에 즉시 전송
- 실패해도 로그만 남기고 일반 reply delivery는 막지 않음
- group mode `mentions`는 mention-triggered turn에서만 reaction을 보냄. group activation `always`는 이 검사를 우회하는 역할을 함
- WhatsApp은 `channels.whatsapp.ackReaction`을 사용합니다. (`messages.ackReaction` legacy 키는 여기서 사용되지 않음)

## 멀티 계정과 자격 증명

<AccordionGroup>
  <Accordion title="Account 선택과 기본값">
    - account id는 `channels.whatsapp.accounts`에서 옴
    - 기본 account 선택: `default`가 있으면 그것을 사용, 없으면 정렬된 첫 account id를 사용
    - account id는 내부 조회를 위해 정규화됩니다.
  </Accordion>

  <Accordion title="Credential 경로와 legacy 호환성">
    - 현재 auth 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - backup 파일: `creds.json.bak`
    - `~/.openclaw/credentials/`에 있던 legacy default auth도 default-account 흐름에서 인식되고 migration됩니다.
  </Accordion>

  <Accordion title="Logout 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]`는 해당 account의 WhatsApp auth state를 지웁니다.

    legacy auth directory에서는 `oauth.json`은 보존하고 Baileys auth 파일만 제거합니다.

  </Accordion>
</AccordionGroup>

## 도구, actions, config writes

- Agent tool은 WhatsApp reaction action(`react`)을 지원합니다.
- Action gate:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 채널에서 시작된 config write는 기본적으로 허용됩니다. (`channels.whatsapp.configWrites=false`로 비활성화)

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음 (QR 필요)">
    증상: channel status가 not linked를 보고함

    해결:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="연결은 되었지만 disconnect/reconnect loop 발생">
    증상: linked account인데 반복적인 disconnect 또는 reconnect 시도 발생

    해결:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    필요하면 `channels login`으로 다시 연결하세요.

  </Accordion>

  <Accordion title="전송 시 active listener가 없음">
    대상 account에 active gateway listener가 없으면 outbound send는 즉시 실패합니다.

    gateway가 실행 중이고 해당 account가 linked 상태인지 확인하세요.

  </Accordion>

  <Accordion title="그룹 메시지가 예상과 다르게 무시됨">
    다음 순서로 확인하세요.

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist 항목
    - mention gating (`requireMention` + mention patterns)
    - `openclaw.json`의 duplicate key (JSON5): 뒤에 오는 값이 앞의 값을 덮어쓰므로, scope별 `groupPolicy`는 하나만 유지하세요.

  </Accordion>

  <Accordion title="Bun runtime 경고">
    WhatsApp gateway runtime은 Node를 사용해야 합니다. Bun은 안정적인 WhatsApp/Telegram gateway 운영과 호환되지 않는 것으로 간주됩니다.
  </Accordion>
</AccordionGroup>

## 설정 레퍼런스 포인터

기본 레퍼런스:

- [Configuration reference - WhatsApp](/gateway/configuration-reference#whatsapp)

주요 WhatsApp 필드:

- access: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, account-level overrides
- operations: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- session behavior: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## 관련 문서

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
