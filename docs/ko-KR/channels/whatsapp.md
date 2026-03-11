---
summary: "WhatsApp 채널 지원, 접근 제어, 전달 동작, 운영"
read_when:
  - WhatsApp/web 채널 동작이나 inbox routing 작업을 할 때
title: "WhatsApp"
---

# WhatsApp (Web channel)

상태: WhatsApp Web(Baileys)을 통한 프로덕션 준비 완료. Gateway가 linked session을 소유합니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    알 수 없는 발신자에 대한 기본 DM 정책은 pairing입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 설정" icon="settings" href="/gateway/configuration">
    전체 채널 config 패턴과 예시입니다.
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

  <Step title="WhatsApp 연결(QR)">

```bash
openclaw channels login --channel whatsapp
```

    특정 account용:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="gateway 시작">

```bash
openclaw gateway
```

  </Step>

  <Step title="첫 pairing 요청 승인(pairing mode 사용 시)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing 요청은 1시간 후 만료됩니다. 대기 요청은 채널당 3개로 제한됩니다.

  </Step>
</Steps>

<Note>
가능하면 OpenClaw는 WhatsApp을 별도 번호로 운영할 것을 권장합니다. (채널 메타데이터와 onboarding 흐름이 그 구성에 최적화되어 있지만, 개인 번호 구성도 지원합니다.)
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 번호(권장)">
    가장 깔끔한 운영 모드입니다.

    - OpenClaw 전용의 분리된 WhatsApp identity
    - 더 명확한 DM allowlist와 routing 경계
    - self-chat 혼동 가능성 감소

    최소 정책 패턴:

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

  <Accordion title="개인 번호 대체 구성">
    Onboarding은 personal-number mode를 지원하며 self-chat에 적합한 기본선을 기록합니다.

    - `dmPolicy: "allowlist"`
    - `allowFrom` 에 개인 번호 포함
    - `selfChatMode: true`

    런타임에서 self-chat 보호는 linked self number와 `allowFrom` 을 기준으로 동작합니다.

  </Accordion>

  <Accordion title="WhatsApp Web 전용 채널 범위">
    현재 OpenClaw 채널 아키텍처에서 messaging platform 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    내장 chat-channel registry에는 별도의 Twilio WhatsApp messaging channel이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp socket과 reconnect loop를 소유합니다.
- Outbound send에는 대상 account에 대한 활성 WhatsApp listener가 필요합니다.
- Status 및 broadcast chat은 무시됩니다(`@status`, `@broadcast`).
- Direct chat은 DM session 규칙을 사용합니다(`session.dmScope`; 기본값 `main` 은 DM을 agent main session으로 합칩니다).
- Group session은 격리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).

## 접근 제어 및 activation

<Tabs>
  <Tab title="DM 정책">
    `channels.whatsapp.dmPolicy` 는 direct chat 접근을 제어합니다.

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`allowFrom` 에 `"*"` 포함 필요)
    - `disabled`

    `allowFrom` 은 E.164 형식 번호를 받습니다(내부적으로 normalize됨).

    Multi-account override: `channels.whatsapp.accounts.<id>.dmPolicy` (및 `allowFrom`)가 해당 account에 대해 채널 수준 기본값보다 우선합니다.

    런타임 동작 세부:

    - pairing은 채널 allow-store에 저장되며 설정된 `allowFrom` 과 병합됩니다
    - allowlist가 전혀 설정되지 않으면 linked self number가 기본적으로 허용됩니다
    - outbound `fromMe` DM은 자동 pairing되지 않습니다

  </Tab>

  <Tab title="그룹 정책 + allowlist">
    Group 접근은 두 층으로 구성됩니다.

    1. **Group membership allowlist** (`channels.whatsapp.groups`)
       - `groups` 가 없으면 모든 group이 대상이 됩니다
       - `groups` 가 있으면 group allowlist 역할을 합니다(`"*"` 허용)

    2. **Group sender 정책** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: sender allowlist 우회
       - `allowlist`: sender는 `groupAllowFrom` (또는 `*`)과 일치해야 함
       - `disabled`: 모든 group inbound 차단

    Sender allowlist fallback:

    - `groupAllowFrom` 이 설정되지 않으면, 런타임은 가능한 경우 `allowFrom` 으로 fallback합니다
    - sender allowlist는 mention/reply activation보다 먼저 평가됩니다

    참고: `channels.whatsapp` 블록 자체가 전혀 없으면, `channels.defaults.groupPolicy` 가 설정되어 있어도 런타임 group-policy fallback은 `allowlist` 입니다(경고 로그 포함).

  </Tab>

  <Tab title="Mention + /activation">
    Group reply는 기본적으로 mention이 필요합니다.

    Mention 감지는 다음을 포함합니다.

    - bot identity에 대한 명시적 WhatsApp mention
    - 설정된 mention regex 패턴(`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - bot에 답장했는지에 대한 암묵적 감지(reply sender가 bot identity와 일치)

    보안 참고:

    - quote/reply는 mention gating만 만족시킬 뿐, sender authorization을 **부여하지 않습니다**
    - `groupPolicy: "allowlist"` 에서는 allowlist에 없는 sender가 allowlist 사용자의 메시지에 답장해도 여전히 차단됩니다

    Session 수준 activation 명령:

    - `/activation mention`
    - `/activation always`

    `activation` 은 전역 config가 아니라 session state를 갱신합니다. owner-gated입니다.

  </Tab>
</Tabs>

## 개인 번호 및 self-chat 동작

linked self number가 `allowFrom` 에도 포함되어 있으면, WhatsApp self-chat safeguard가 활성화됩니다.

- self-chat turn에서는 read receipt를 건너뜀
- 자신을 ping하게 만들 수 있는 mention-JID auto-trigger 동작을 무시
- `messages.responsePrefix` 가 설정되지 않았다면, self-chat reply는 기본적으로 `[{identity.name}]` 또는 `[openclaw]`

## 메시지 normalize 및 context

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    수신 WhatsApp 메시지는 공통 inbound envelope로 래핑됩니다.

    quoted reply가 있으면 context가 다음 형식으로 추가됩니다.

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Reply 메타데이터 필드도 가능할 때 채워집니다(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="미디어 placeholder와 위치/연락처 추출">
    미디어만 있는 inbound 메시지는 다음과 같은 placeholder로 normalize됩니다.

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    위치 및 연락처 payload는 routing 전에 텍스트 context로 normalize됩니다.

  </Accordion>

  <Accordion title="대기 중인 group history 주입">
    Group에서는 처리되지 않은 메시지를 버퍼링했다가, bot가 실제로 trigger될 때 context로 주입할 수 있습니다.

    - 기본 제한: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` 이면 비활성화

    주입 마커:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipt는 허용된 inbound WhatsApp 메시지에 대해 기본적으로 활성화됩니다.

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

    Account별 override:

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

    전역 활성화 상태여도 self-chat turn에서는 read receipt를 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 전달, chunking, 미디어

<AccordionGroup>
  <Accordion title="텍스트 chunking">
    - 기본 chunk 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 문단 경계(빈 줄)를 우선 사용하고, 그 다음 길이 안전 chunking으로 fallback합니다
  </Accordion>

  <Accordion title="Outbound 미디어 동작">
    - image, video, audio (PTT voice-note), document payload 지원
    - `audio/ogg` 는 voice-note 호환성을 위해 `audio/ogg; codecs=opus` 로 다시 씁니다
    - animated GIF 재생은 video send 시 `gifPlayback: true` 로 지원됩니다
    - multi-media reply payload 전송 시 caption은 첫 번째 미디어 항목에 적용됩니다
    - 미디어 source는 HTTP(S), `file://`, 또는 로컬 경로를 사용할 수 있습니다
  </Accordion>

  <Accordion title="미디어 크기 제한 및 fallback 동작">
    - inbound 미디어 저장 한도: `channels.whatsapp.mediaMaxMb` (기본값 `50`)
    - outbound 미디어 전송 한도: `channels.whatsapp.mediaMaxMb` (기본값 `50`)
    - account별 override는 `channels.whatsapp.accounts.<accountId>.mediaMaxMb` 사용
    - 이미지는 제한에 맞도록 자동 최적화됩니다(resize/quality sweep)
    - 미디어 전송 실패 시, 첫 항목 fallback은 응답을 조용히 버리지 않고 텍스트 경고를 보냅니다
  </Accordion>
</AccordionGroup>

## Acknowledgment reaction

WhatsApp은 `channels.whatsapp.ackReaction` 을 통해 inbound 수신 직후 즉시 ack reaction을 지원합니다.

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

- inbound가 허용된 직후(응답 전) 즉시 전송됨
- 실패는 로그에 남지만 일반 reply 전달을 막지 않음
- group mode `mentions` 는 mention-trigger된 turn에 reaction함; group activation `always` 는 이 검사에 대한 우회로 동작함
- WhatsApp은 `channels.whatsapp.ackReaction` 을 사용합니다(legacy `messages.ackReaction` 은 여기서 사용되지 않음)

## Multi-account 및 자격 증명

<AccordionGroup>
  <Accordion title="Account 선택과 기본값">
    - account id는 `channels.whatsapp.accounts` 에서 옴
    - 기본 account 선택: `default` 가 있으면 그것, 없으면 설정된 account id 중 첫 번째(정렬 기준)
    - account id는 lookup을 위해 내부적으로 normalize됩니다
  </Accordion>

  <Accordion title="자격 증명 경로와 legacy 호환성">
    - 현재 auth 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 백업 파일: `creds.json.bak`
    - `~/.openclaw/credentials/` 의 legacy default auth도 default-account 흐름에서는 계속 인식/마이그레이션됩니다
  </Accordion>

  <Accordion title="로그아웃 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]` 는 해당 account의 WhatsApp auth state를 지웁니다.

    legacy auth 디렉터리에서는 `oauth.json` 은 유지되고 Baileys auth 파일만 제거됩니다.

  </Accordion>
</AccordionGroup>

## Tools, action, config write

- Agent tool 지원에는 WhatsApp reaction action(`react`)이 포함됩니다.
- Action gate:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Channel initiated config write는 기본적으로 활성화됩니다(`channels.whatsapp.configWrites=false` 로 비활성화).

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음(QR 필요)">
    증상: channel status에 not linked로 표시됨.

    해결:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="연결됐지만 disconnected / reconnect loop">
    증상: linked account가 반복적으로 disconnect되거나 reconnect를 시도함.

    해결:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    필요하면 `channels login` 으로 다시 연결하세요.

  </Accordion>

  <Accordion title="전송 시 활성 listener 없음">
    대상 account에 대한 활성 gateway listener가 없으면 outbound send는 즉시 실패합니다.

    gateway가 실행 중이고 account가 연결되어 있는지 확인하세요.

  </Accordion>

  <Accordion title="Group 메시지가 예상치 않게 무시됨">
    다음 순서로 확인하세요.

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist 항목
    - mention gating (`requireMention` + mention pattern)
    - `openclaw.json` 의 중복 key (JSON5): 나중 항목이 이전 항목을 override하므로, scope별로 `groupPolicy` 는 하나만 두세요

  </Accordion>

  <Accordion title="Bun 런타임 경고">
    WhatsApp gateway runtime은 Node를 사용해야 합니다. Bun은 안정적인 WhatsApp/Telegram gateway 운영과 호환되지 않는 것으로 표시됩니다.
  </Accordion>
</AccordionGroup>

## Configuration reference 안내

기본 참고 문서:

- [Configuration reference - WhatsApp](/gateway/configuration-reference#whatsapp)

신호가 큰 WhatsApp 필드:

- 접근 제어: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 전달: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, account 수준 override
- 운영: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- session 동작: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## 관련 문서

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
