---
summary: "Telegram 봇 지원 상태, 기능, 설정"
read_when:
  - Telegram 기능이나 webhook 작업을 할 때
title: "Telegram"
x-i18n:
  source_path: "channels/telegram.md"
---

# Telegram (Bot API)

상태: grammY 기반 봇 DM + 그룹에 대해 production-ready입니다. 기본 모드는 long polling이며, webhook 모드는 선택 사항입니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    Telegram의 기본 DM 정책은 pairing입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/gateway/configuration">
    전체 채널 config 패턴과 예시.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="BotFather에서 bot token 만들기">
    Telegram을 열고 **@BotFather**와 대화하세요(handle이 정확히 `@BotFather`인지 확인).

    `/newbot`을 실행하고 안내에 따라 token을 저장하세요.

  </Step>

  <Step title="token과 DM 정책 설정">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    환경 변수 fallback: `TELEGRAM_BOT_TOKEN=...` (기본 계정만).
    Telegram은 **`openclaw channels login telegram`을 사용하지 않습니다**. config/env에 token을 넣은 뒤 gateway를 시작하세요.

  </Step>

  <Step title="gateway 시작 후 첫 DM 승인">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    pairing 코드는 1시간 후 만료됩니다.

  </Step>

  <Step title="그룹에 bot 추가">
    bot을 그룹에 추가한 다음, 접근 모델에 맞게 `channels.telegram.groups`와 `groupPolicy`를 설정하세요.
  </Step>
</Steps>

<Note>
Token 해석 순서는 account-aware입니다. 실제로는 config 값이 env fallback보다 우선하며, `TELEGRAM_BOT_TOKEN`은 기본 계정에만 적용됩니다.
</Note>

## Telegram 측 설정

<AccordionGroup>
  <Accordion title="Privacy mode와 그룹 가시성">
    Telegram bot은 기본적으로 **Privacy Mode**를 사용하므로 받을 수 있는 그룹 메시지가 제한됩니다.

    bot이 모든 그룹 메시지를 봐야 한다면 다음 중 하나를 하세요.

    - `/setprivacy`로 privacy mode 끄기
    - bot을 그룹 관리자(admin)로 승격

    privacy mode를 바꾼 뒤에는 각 그룹에서 bot을 제거했다가 다시 추가해야 Telegram이 변경사항을 적용합니다.

  </Accordion>

  <Accordion title="그룹 권한">
    관리자 상태는 Telegram 그룹 설정에서 제어합니다.

    관리자인 bot은 모든 그룹 메시지를 수신하므로, 항상 켜져 있는 그룹 동작에 유용합니다.

  </Accordion>

  <Accordion title="유용한 BotFather 토글">

    - `/setjoingroups`로 그룹 추가 허용/차단
    - `/setprivacy`로 그룹 가시성 동작 제어

  </Accordion>
</AccordionGroup>

## 접근 제어와 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.telegram.dmPolicy`는 direct message 접근을 제어합니다.

    - `pairing` (기본값)
    - `allowlist` (`allowFrom`에 최소 한 개의 sender ID 필요)
    - `open` (`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `channels.telegram.allowFrom`은 숫자형 Telegram user ID를 받습니다. `telegram:` / `tg:` prefix도 허용되며 정규화됩니다.
    `allowFrom`이 빈 상태의 `dmPolicy: "allowlist"`는 모든 DM을 차단하며 config validation에서 거부됩니다.
    온보딩 wizard는 `@username` 입력을 받아 숫자형 ID로 해석합니다.
    업그레이드 후 config에 `@username` allowlist 항목이 남아 있다면 `openclaw doctor --fix`를 실행해 해결하세요(best-effort, Telegram bot token 필요).
    이전에 pairing-store allowlist 파일에 의존했다면, `openclaw doctor --fix`가 allowlist 흐름에서 `channels.telegram.allowFrom`으로 항목을 복구할 수 있습니다(예: `dmPolicy: "allowlist"`에 아직 명시적 ID가 없을 때).

    소유자가 한 명뿐인 bot이라면, 과거 pairing 승인에 의존하기보다 config에 정책을 영속적으로 남길 수 있도록 명시적 숫자 `allowFrom` ID와 함께 `dmPolicy: "allowlist"`를 권장합니다.

    ### 내 Telegram user ID 찾기

    더 안전한 방법(서드파티 bot 없음):

    1. bot에게 DM을 보냅니다.
    2. `openclaw logs --follow`를 실행합니다.
    3. `from.id`를 읽습니다.

    공식 Bot API 방법:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    서드파티 방법(덜 프라이빗함): `@userinfobot` 또는 `@getidsbot`.

  </Tab>

  <Tab title="그룹 정책과 allowlist">
    두 가지 제어가 함께 적용됩니다.

    1. **어떤 그룹을 허용할지** (`channels.telegram.groups`)
       - `groups` config가 없을 때:
         - `groupPolicy: "open"`이면 어느 그룹이든 group-ID 검사를 통과할 수 있음
         - `groupPolicy: "allowlist"`(기본값)이면 `groups` 항목(또는 `"*"`)을 추가하기 전까지 그룹이 차단됨
       - `groups`가 설정돼 있으면 allowlist 역할을 함(명시적 ID 또는 `"*"`)

    2. **그룹 안에서 어떤 발신자를 허용할지** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (기본값)
       - `disabled`

    `groupAllowFrom`은 그룹 발신자 필터링에 사용됩니다. 설정하지 않으면 Telegram은 `allowFrom`으로 fallback합니다.
    `groupAllowFrom` 항목은 숫자형 Telegram user ID여야 합니다(`telegram:` / `tg:` prefix는 정규화됨).
    숫자가 아닌 항목은 발신자 인증에서 무시됩니다.
    보안 경계(`2026.2.25+`): 그룹 발신자 인증은 **DM pairing-store 승인 항목을 상속하지 않습니다**.
    pairing은 DM 전용으로 유지됩니다. 그룹에서는 `groupAllowFrom` 또는 그룹/토픽별 `allowFrom`을 설정하세요.
    런타임 참고: `channels.telegram` 블록이 완전히 없으면 `channels.defaults.groupPolicy`가 명시되지 않은 한 런타임 기본값은 fail-closed `groupPolicy="allowlist"`입니다.

    예시: 특정 그룹 하나에서는 어떤 멤버든 허용

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

  </Tab>

  <Tab title="멘션 동작">
    그룹 응답은 기본적으로 멘션이 필요합니다.

    멘션은 다음에서 올 수 있습니다.

    - native `@botusername` 멘션
    - 다음의 mention pattern:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    세션 수준 명령 토글:

    - `/activation always`
    - `/activation mention`

    이 토글은 세션 상태만 갱신합니다. 영속성은 config로 관리하세요.

    영속 config 예시:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    그룹 chat ID 얻기:

    - 그룹 메시지를 `@userinfobot` / `@getidsbot`에 전달
    - 또는 `openclaw logs --follow`에서 `chat.id` 읽기
    - 또는 Bot API `getUpdates` 확인

  </Tab>
</Tabs>

## 런타임 동작

- Telegram 연결은 gateway 프로세스가 소유합니다.
- 라우팅은 결정론적입니다. Telegram 인바운드는 다시 Telegram으로 답합니다(모델이 채널을 고르지 않음).
- 인바운드 메시지는 reply metadata와 media placeholder를 포함한 공통 채널 envelope로 정규화됩니다.
- 그룹 세션은 group ID별로 격리됩니다. Forum topic은 `:topic:<threadId>`를 붙여 서로 분리합니다.
- DM 메시지는 `message_thread_id`를 가질 수 있으며, OpenClaw는 thread-aware session key로 라우팅하고 reply에도 thread ID를 보존합니다.
- Long polling은 chat/thread별 순서를 보장하는 grammY runner를 사용합니다. 전체 runner sink 동시성은 `agents.defaults.maxConcurrent`를 따릅니다.
- Telegram Bot API에는 read-receipt 지원이 없습니다(`sendReadReceipts`는 적용되지 않음).

## 기능 참조

<AccordionGroup>
  <Accordion title="라이브 스트림 프리뷰 (message edit)">
    OpenClaw는 부분 응답을 실시간으로 스트리밍할 수 있습니다.

    - direct chat: 프리뷰 메시지 + `editMessageText`
    - 그룹/topic: 프리뷰 메시지 + `editMessageText`

    요구 사항:

    - `channels.telegram.streaming`은 `off | partial | block | progress` 중 하나입니다(기본값: `partial`)
    - `progress`는 Telegram에서 `partial`로 매핑됩니다(채널 간 이름 호환)
    - 레거시 `channels.telegram.streamMode`와 boolean `streaming` 값은 자동 매핑됩니다

    텍스트 전용 응답에서는:

    - DM: OpenClaw가 같은 프리뷰 메시지를 유지하면서 마지막에 제자리 edit를 합니다(두 번째 메시지 없음)
    - 그룹/topic: OpenClaw가 같은 프리뷰 메시지를 유지하면서 마지막에 제자리 edit를 합니다(두 번째 메시지 없음)

    복합 응답(예: media payload)에서는 OpenClaw가 일반 최종 전달로 fallback한 뒤 프리뷰 메시지를 정리합니다.

    프리뷰 스트리밍과 block 스트리밍은 별개입니다. Telegram에서 block 스트리밍을 명시적으로 켜면 이중 스트리밍을 피하기 위해 프리뷰 스트림을 건너뜁니다.

    native draft transport를 사용할 수 없거나 거부되면 OpenClaw는 자동으로 `sendMessage` + `editMessageText`로 fallback합니다.

    Telegram 전용 reasoning stream:

    - `/reasoning stream`은 생성 중 reasoning을 라이브 프리뷰로 전송합니다
    - 최종 답변은 reasoning 텍스트 없이 전송됩니다

  </Accordion>

  <Accordion title="서식과 HTML fallback">
    아웃바운드 텍스트는 Telegram `parse_mode: "HTML"`을 사용합니다.

    - Markdown 비슷한 텍스트는 Telegram 안전 HTML로 렌더링됩니다.
    - raw model HTML은 Telegram 파싱 실패를 줄이기 위해 escape됩니다.
    - Telegram이 파싱된 HTML을 거부하면 OpenClaw는 plain text로 재시도합니다.

    링크 프리뷰는 기본적으로 켜져 있으며 `channels.telegram.linkPreview: false`로 끌 수 있습니다.

  </Accordion>

  <Accordion title="네이티브 명령과 custom command">
    Telegram command menu 등록은 시작 시 `setMyCommands`로 처리됩니다.

    네이티브 명령 기본값:

    - `commands.native: "auto"`는 Telegram에서 native command를 활성화합니다

    custom command menu 항목 추가:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git 백업" },
        { command: "generate", description: "이미지 생성" },
      ],
    },
  },
}
```

    규칙:

    - 이름은 정규화됩니다(앞의 `/` 제거, 소문자화)
    - 유효 패턴: `a-z`, `0-9`, `_`, 길이 `1..32`
    - custom command는 native command를 덮어쓸 수 없습니다
    - 충돌/중복 항목은 건너뛰고 로그에 남깁니다

    참고:

    - custom command는 menu entry만 추가하며, 동작을 자동 구현하지는 않습니다
    - plugin/skill command는 Telegram 메뉴에 보이지 않아도 직접 입력하면 동작할 수 있습니다

    native command가 비활성화되어 있으면 built-in은 제거됩니다. custom/plugin command는 설정돼 있으면 여전히 등록될 수 있습니다.

    흔한 설정 실패:

    - `setMyCommands failed`는 보통 `api.telegram.org`로 나가는 DNS/HTTPS가 막혀 있다는 뜻입니다.

    ### Device pairing 명령 (`device-pair` plugin)

    `device-pair` plugin이 설치돼 있으면:

    1. `/pair`가 setup code를 생성
    2. iOS 앱에 코드를 붙여 넣음
    3. `/pair approve`가 가장 최근 pending 요청을 승인

    자세한 내용: [Pairing](/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline 버튼">
    inline keyboard 범위 설정:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    계정별 override:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    범위:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (기본값)

    레거시 `capabilities: ["inlineButtons"]`는 `inlineButtons: "all"`로 매핑됩니다.

    message action 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "옵션을 선택하세요:",
  buttons: [
    [
      { text: "예", callback_data: "yes" },
      { text: "아니오", callback_data: "no" },
    ],
    [{ text: "취소", callback_data: "cancel" }],
  ],
}
```

    callback 클릭은 다음 텍스트로 에이전트에 전달됩니다.
    `callback_data: <value>`

  </Accordion>

  <Accordion title="에이전트와 자동화를 위한 Telegram message action">
    Telegram tool action:

    - `sendMessage` (`to`, `content`, 선택적 `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, 선택적 `iconColor`, `iconCustomEmojiId`)

    채널 message action은 사용하기 쉬운 alias를 노출합니다(`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    게이팅 제어:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (기본값: disabled)

    참고: `edit`와 `topic-create`는 현재 기본 활성화이며 별도 `channels.telegram.actions.*` 토글이 없습니다.

    reaction 제거 semantics: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading 태그">
    Telegram은 생성된 출력에서 명시적 reply threading 태그를 지원합니다.

    - `[[reply_to_current]]`는 트리거한 메시지에 답합니다
    - `[[reply_to:<id>]]`는 특정 Telegram message ID에 답합니다

    `channels.telegram.replyToMode`가 처리 방식을 제어합니다.

    - `off` (기본값)
    - `first`
    - `all`

    참고: `off`는 암묵적 reply threading을 비활성화합니다. 하지만 명시적 `[[reply_to_*]]` 태그는 여전히 존중됩니다.

  </Accordion>

  <Accordion title="Forum topic과 thread 동작">
    Forum supergroup:

    - topic session key는 `:topic:<threadId>`를 붙입니다
    - reply와 typing은 해당 topic thread를 대상으로 합니다
    - topic config 경로:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic (`threadId=1`) 특수 처리:

    - 메시지 전송은 `message_thread_id`를 생략합니다(Telegram은 `sendMessage(...thread_id=1)`을 거부함)
    - typing action은 여전히 `message_thread_id`를 포함합니다

    Topic 상속: topic 항목은 override가 없는 한 그룹 설정(`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)을 상속합니다.
    `agentId`는 topic 전용이며 그룹 기본값에서 상속되지 않습니다.

    **토픽별 에이전트 라우팅**: topic config에 `agentId`를 넣으면 각 topic을 다른 에이전트로 라우팅할 수 있습니다. topic마다 별도 workspace, memory, session을 갖게 됩니다. 예시:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    각 topic의 session key는 이렇게 됩니다. `agent:zu:telegram:group:-1001234567890:topic:3`

    **영속 ACP topic binding**: forum topic은 최상위 typed ACP binding을 통해 ACP harness session을 고정할 수 있습니다.

    - `bindings[]`에서 `type: "acp"`와 `match.channel: "telegram"` 사용

    예시:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    현재 이 기능은 그룹 및 supergroup의 forum topic에 한정됩니다.

    **채팅에서 thread-bound ACP spawn**:

    - `/acp spawn <agent> --thread here|auto`는 현재 Telegram topic을 새 ACP session에 바인드할 수 있습니다.
    - 이후 topic 메시지는 bound ACP session으로 직접 라우팅됩니다(`/acp steer` 불필요).
    - 바인딩 성공 후 OpenClaw는 spawn 확인 메시지를 해당 topic에 고정합니다.
    - `channels.telegram.threadBindings.spawnAcpSessions=true`가 필요합니다.

    템플릿 컨텍스트에는 다음이 포함됩니다.

    - `MessageThreadId`
    - `IsForum`

    DM thread 동작:

    - private chat에서 `message_thread_id`가 오면 DM 라우팅은 유지하되 thread-aware session key/reply target을 사용합니다.

  </Accordion>

  <Accordion title="오디오, 비디오, 스티커">
    ### 오디오 메시지

    Telegram은 voice note와 audio file을 구분합니다.

    - 기본값: audio file 동작
    - 에이전트 응답에 `[[audio_as_voice]]` 태그를 넣으면 voice-note 전송 강제

    message action 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 비디오 메시지

    Telegram은 video file과 video note를 구분합니다.

    message action 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    video note는 caption을 지원하지 않으므로, 제공한 메시지 텍스트는 별도로 전송됩니다.

    ### 스티커

    인바운드 스티커 처리:

    - 정적 WEBP: 다운로드 후 처리(placeholder `<media:sticker>`)
    - 애니메이션 TGS: 건너뜀
    - 비디오 WEBM: 건너뜀

    스티커 컨텍스트 필드:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    스티커 캐시 파일:

    - `~/.openclaw/telegram/sticker-cache.json`

    스티커는 가능할 때 한 번만 설명하고 캐시에 저장해 반복 vision 호출을 줄입니다.

    스티커 action 활성화:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    스티커 전송 action:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    캐시된 스티커 검색:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "손 흔드는 고양이",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="리액션 알림">
    Telegram 리액션은 `message_reaction` update로 들어옵니다(메시지 payload와 별도).

    활성화되면 OpenClaw는 다음 같은 system event를 queue에 넣습니다.

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    설정:

    - `channels.telegram.reactionNotifications`: `off | own | all` (기본값: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (기본값: `minimal`)

    참고:

    - `own`은 bot이 보낸 메시지에 대한 사용자 리액션만 의미합니다(sent-message cache 기준 best-effort).
    - 리액션 이벤트도 Telegram 접근 제어(`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)를 따르며, 권한 없는 발신자는 버려집니다.
    - Telegram은 reaction update에 thread ID를 제공하지 않습니다.
      - non-forum 그룹은 group chat session으로 라우팅
      - forum 그룹은 정확한 원본 topic이 아니라 group general-topic session(`:topic:1`)으로 라우팅

    polling/webhook의 `allowed_updates`에는 `message_reaction`이 자동으로 포함됩니다.

  </Accordion>

  <Accordion title="Ack 리액션">
    `ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인용 이모지를 보냅니다.

    해석 순서:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Telegram은 unicode emoji(예: `"👀"`)를 기대합니다.
    - 채널 또는 계정의 리액션을 끄려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="Telegram 이벤트와 명령에서의 config 쓰기">
    채널 config 쓰기는 기본적으로 활성화되어 있습니다(`configWrites !== false`).

    Telegram에서 트리거되는 쓰기에는 다음이 포함됩니다.

    - 그룹 migration 이벤트(`migrate_to_chat_id`)로 `channels.telegram.groups` 갱신
    - `/config set`, `/config unset` (command enablement 필요)

    비활성화:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs webhook">
    기본값: long polling.

    webhook 모드:

    - `channels.telegram.webhookUrl` 설정
    - `channels.telegram.webhookSecret` 설정(webhook URL을 쓸 때 필수)
    - 선택적 `channels.telegram.webhookPath` (기본값 `/telegram-webhook`)
    - 선택적 `channels.telegram.webhookHost` (기본값 `127.0.0.1`)
    - 선택적 `channels.telegram.webhookPort` (기본값 `8787`)

    webhook 모드의 기본 로컬 listener는 `127.0.0.1:8787`에 바인드됩니다.

    공개 endpoint가 다르다면 앞단에 reverse proxy를 두고 `webhookUrl`을 공개 URL로 지정하세요.
    의도적으로 외부 ingress가 필요할 때는 `webhookHost`를 설정하세요(예: `0.0.0.0`).

  </Accordion>

  <Accordion title="제한, 재시도, CLI 대상">
    - `channels.telegram.textChunkLimit` 기본값은 4000입니다.
    - `channels.telegram.chunkMode="newline"`은 길이 분할 전에 문단 경계(빈 줄)를 우선 사용합니다.
    - `channels.telegram.mediaMaxMb`(기본값 100)는 Telegram 미디어의 인바운드/아웃바운드 최대 크기를 제한합니다.
    - `channels.telegram.timeoutSeconds`는 Telegram API client timeout을 override합니다(미설정 시 grammY 기본값 적용).
    - 그룹 context history는 `channels.telegram.historyLimit` 또는 `messages.groupChat.historyLimit`(기본값 50)을 사용합니다. `0`이면 비활성화됩니다.
    - DM history 제어:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config는 복구 가능한 아웃바운드 API 에러에 대해 Telegram send helper(CLI/tools/actions)에 적용됩니다.

    CLI send 대상은 숫자형 chat ID 또는 username을 사용할 수 있습니다.

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram poll은 `openclaw message poll`을 사용하며 forum topic도 지원합니다.

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 전용 poll 플래그:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum topic용 `--thread-id`(또는 `:topic:` target 사용)

    Action gating:

    - `channels.telegram.actions.sendMessage=false`는 poll을 포함한 Telegram 아웃바운드 메시지를 비활성화합니다
    - `channels.telegram.actions.poll=false`는 일반 send는 두고 Telegram poll 생성만 비활성화합니다

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="멘션 없는 그룹 메시지에 bot이 응답하지 않음">

    - `requireMention=false`라면 Telegram privacy mode가 전체 가시성을 허용해야 합니다.
      - BotFather: `/setprivacy` -> Disable
      - 그 후 bot을 그룹에서 제거했다가 다시 추가
    - `openclaw channels status`는 config가 멘션 없는 그룹 메시지를 기대할 때 경고를 띄웁니다.
    - `openclaw channels status --probe`는 명시적 숫자 group ID는 검사할 수 있지만 wildcard `"*"`는 membership probe할 수 없습니다.
    - 빠른 session 테스트: `/activation always`.

  </Accordion>

  <Accordion title="bot이 그룹 메시지를 전혀 보지 못함">

    - `channels.telegram.groups`가 존재하면 해당 그룹이 목록에 있어야 합니다(또는 `"*"` 포함)
    - bot이 그룹에 실제로 들어가 있는지 확인하세요
    - `openclaw logs --follow`에서 skip 이유를 확인하세요

  </Accordion>

  <Accordion title="명령이 부분적으로만 동작하거나 전혀 동작하지 않음">

    - 발신자 identity를 승인하세요(pairing 및/또는 숫자형 `allowFrom`)
    - group policy가 `open`이어도 command authorization은 계속 적용됩니다
    - `setMyCommands failed`는 보통 `api.telegram.org`에 대한 DNS/HTTPS 도달성 문제입니다

  </Accordion>

  <Accordion title="Polling 또는 네트워크 불안정">

    - Node 22+ + custom fetch/proxy 조합에서는 AbortSignal 타입이 안 맞으면 즉시 abort되는 동작이 발생할 수 있습니다.
    - 일부 호스트는 `api.telegram.org`를 IPv6 우선으로 해석하며, 깨진 IPv6 egress는 간헐적인 Telegram API 실패를 유발할 수 있습니다.
    - 로그에 `TypeError: fetch failed` 또는 `Network request for 'getUpdates' failed!`가 보이면 OpenClaw는 이를 복구 가능한 네트워크 에러로 재시도합니다.
    - VPS처럼 직접 egress/TLS가 불안정한 호스트에서는 `channels.telegram.proxy`를 통해 Telegram API 호출을 우회하세요.

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+는 기본적으로 `autoSelectFamily=true`(WSL2 제외)와 `dnsResultOrder=ipv4first`를 사용합니다.
    - 호스트가 WSL2이거나 IPv4-only 동작이 더 잘 맞는다면 family 선택을 강제하세요.

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 환경 변수 override(임시):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 응답 검증:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

더 많은 도움말: [채널 문제 해결](/channels/troubleshooting).

## Telegram config reference 포인터

주요 참조:

- `channels.telegram.enabled`: 채널 시작 활성화/비활성화.
- `channels.telegram.botToken`: bot token (BotFather).
- `channels.telegram.tokenFile`: 파일 경로에서 token 읽기.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: pairing).
- `channels.telegram.allowFrom`: DM allowlist (숫자형 Telegram user ID). `allowlist`는 최소 한 개 sender ID가 필요합니다. `open`은 `"*"`가 필요합니다. `openclaw doctor --fix`는 레거시 `@username` 항목을 ID로 해석할 수 있고, allowlist migration 흐름에서 pairing-store 파일의 항목을 복구할 수 있습니다.
- `channels.telegram.actions.poll`: Telegram poll 생성 허용/비허용 (기본값: enabled, 단 `sendMessage`도 필요).
- `channels.telegram.defaultTo`: CLI `--deliver`가 명시적 `--reply-to` 없이 사용할 기본 Telegram 대상.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (기본값: allowlist).
- `channels.telegram.groupAllowFrom`: 그룹 발신자 allowlist (숫자형 Telegram user ID). `openclaw doctor --fix`는 레거시 `@username` 항목을 ID로 해석할 수 있습니다. 숫자가 아닌 항목은 auth 시 무시됩니다. 그룹 auth는 DM pairing-store fallback을 사용하지 않습니다(`2026.2.25+`).
- 멀티 계정 우선순위:
  - account ID가 둘 이상 설정되면, 기본 라우팅을 명시적으로 만들기 위해 `channels.telegram.defaultAccount`(또는 `channels.telegram.accounts.default`)를 설정하세요.
  - 둘 다 없으면 OpenClaw는 첫 번째 정규화된 account ID로 fallback하고 `openclaw doctor`가 경고합니다.
  - `channels.telegram.accounts.default.allowFrom`과 `channels.telegram.accounts.default.groupAllowFrom`은 `default` 계정에만 적용됩니다.
  - 이름 있는 계정은 account-level 값이 비어 있을 때 `channels.telegram.allowFrom`과 `channels.telegram.groupAllowFrom`을 상속합니다.
  - 이름 있는 계정은 `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`은 상속하지 않습니다.
- `channels.telegram.groups`: 그룹별 기본값 + allowlist (`"*"`는 전역 기본값용).
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy의 그룹별 override (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: 기본 mention gating.
  - `channels.telegram.groups.<id>.skills`: skill filter (생략 = 모든 스킬, 빈값 = 없음).
  - `channels.telegram.groups.<id>.allowFrom`: 그룹별 발신자 allowlist override.
  - `channels.telegram.groups.<id>.systemPrompt`: 그룹용 추가 system prompt.
  - `channels.telegram.groups.<id>.enabled`: `false`일 때 그룹 비활성화.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: topic별 override (그룹 필드 + topic 전용 `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: 이 topic을 특정 agent로 라우팅(그룹 수준과 binding 라우팅보다 우선).
  - `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy의 topic별 override (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: topic별 mention gating override.
  - 최상위 `bindings[]`에서 `type: "acp"`와 canonical topic ID `chatId:topic:topicId`를 `match.peer.id`로 사용: 영속 ACP topic binding 필드([ACP Agents](/tools/acp-agents#channel-specific-settings) 참고).
  - `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM topic을 특정 agent로 라우팅(forum topic과 동일 동작).
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (기본값: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: 계정별 override.
- `channels.telegram.commands.nativeSkills`: Telegram native skills command 활성화/비활성화.
- `channels.telegram.replyToMode`: `off | first | all` (기본값: `off`).
- `channels.telegram.textChunkLimit`: 아웃바운드 chunk 크기(문자 수).
- `channels.telegram.chunkMode`: `length`(기본값) 또는 `newline`; 길이 분할 전에 빈 줄(문단 경계)을 우선 사용합니다.
- `channels.telegram.linkPreview`: 아웃바운드 메시지 링크 프리뷰 토글(기본값: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (라이브 스트림 프리뷰; 기본값: `partial`; `progress`는 `partial`로 매핑; `block`은 레거시 프리뷰 호환 모드). Telegram 프리뷰 스트리밍은 하나의 프리뷰 메시지를 제자리에서 edit합니다.
- `channels.telegram.mediaMaxMb`: Telegram 미디어 인바운드/아웃바운드 상한(MB, 기본값: 100).
- `channels.telegram.retry`: 복구 가능한 아웃바운드 API 에러에 대한 Telegram send helper(CLI/tools/actions) 재시도 정책(attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: Node autoSelectFamily override (true=enable, false=disable). Node 22+에서는 기본 활성화, WSL2는 기본 비활성화.
- `channels.telegram.network.dnsResultOrder`: DNS 결과 순서 override (`ipv4first` 또는 `verbatim`). Node 22+에서는 기본적으로 `ipv4first`.
- `channels.telegram.proxy`: Bot API 호출용 proxy URL (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: webhook 모드 활성화(`channels.telegram.webhookSecret` 필요).
- `channels.telegram.webhookSecret`: webhook secret (`webhookUrl` 설정 시 필수).
- `channels.telegram.webhookPath`: 로컬 webhook 경로 (기본값 `/telegram-webhook`).
- `channels.telegram.webhookHost`: 로컬 webhook bind host (기본값 `127.0.0.1`).
- `channels.telegram.webhookPort`: 로컬 webhook bind port (기본값 `8787`).
- `channels.telegram.actions.reactions`: Telegram tool reaction 게이트.
- `channels.telegram.actions.sendMessage`: Telegram tool message send 게이트.
- `channels.telegram.actions.deleteMessage`: Telegram tool message delete 게이트.
- `channels.telegram.actions.sticker`: Telegram sticker action(send/search) 게이트 (기본값: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — 어떤 리액션이 system event를 트리거할지 제어 (기본값: 미설정 시 `own`).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — 에이전트의 reaction capability 제어 (기본값: 미설정 시 `minimal`).

- [Configuration reference - Telegram](/gateway/configuration-reference#telegram)

Telegram 전용 고신호 필드:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*`
- 접근 제어: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, 최상위 `bindings[]` (`type: "acp"`)
- 명령/메뉴: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (프리뷰), `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/network: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## 관련 문서

- [페어링](/channels/pairing)
- [채널 라우팅](/channels/channel-routing)
- [멀티 에이전트 라우팅](/concepts/multi-agent)
- [문제 해결](/channels/troubleshooting)
