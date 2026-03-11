---
summary: "Slack 설정과 런타임 동작 (Socket Mode + HTTP Events API)"
read_when:
  - Slack을 설정할 때
  - Slack socket/HTTP 모드를 디버깅할 때
title: "Slack"
x-i18n:
  source_path: "channels/slack.md"
---

# Slack

상태: Slack app integration을 통한 DM + 채널에 대해 production-ready입니다. 기본 모드는 Socket Mode이며, HTTP Events API 모드도 지원합니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    Slack DM의 기본 정책은 pairing입니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/tools/slash-commands">
    네이티브 명령 동작과 명령 카탈로그.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="Socket Mode (기본값)">
    <Steps>
      <Step title="Slack app과 token 만들기">
        Slack app 설정에서:

        - **Socket Mode** 활성화
        - `connections:write`가 붙은 **App Token**(`xapp-...`) 생성
        - app 설치 후 **Bot Token**(`xoxb-...`) 복사
      </Step>

      <Step title="OpenClaw 설정">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        환경 변수 fallback(기본 계정만):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="app event 구독">
        다음 bot event를 구독하세요.

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        DM용으로 App Home의 **Messages Tab**도 활성화하세요.
      </Step>

      <Step title="gateway 시작">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API 모드">
    <Steps>
      <Step title="Slack app을 HTTP용으로 설정">

        - 모드를 HTTP로 설정 (`channels.slack.mode="http"`)
        - Slack **Signing Secret** 복사
        - Event Subscriptions + Interactivity + Slash command Request URL을 같은 webhook path(기본값 `/slack/events`)로 설정

      </Step>

      <Step title="OpenClaw HTTP 모드 설정">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="멀티 계정 HTTP에는 고유 webhook path 사용">
        계정별 HTTP 모드를 지원합니다.

        등록 충돌을 막기 위해 계정마다 서로 다른 `webhookPath`를 주세요.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Token 모델

- Socket Mode에는 `botToken` + `appToken`이 필요합니다.
- HTTP 모드에는 `botToken` + `signingSecret`가 필요합니다.
- config token이 env fallback보다 우선합니다.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env fallback은 기본 계정에만 적용됩니다.
- `userToken` (`xoxp-...`)은 config 전용이며(env fallback 없음), 기본적으로 읽기 전용(`userTokenReadOnly: true`) 동작입니다.
- 선택 사항: 아웃바운드 메시지에 현재 agent identity(custom `username` 및 icon)를 쓰고 싶다면 `chat:write.customize` scope를 추가하세요. `icon_emoji`는 `:emoji_name:` 문법을 사용합니다.

<Tip>
action이나 directory read에서는 설정돼 있을 경우 user token을 우선 사용할 수 있습니다. write에는 bot token이 계속 우선이며, user-token write는 `userTokenReadOnly: false`이고 bot token이 없을 때만 허용됩니다.
</Tip>

## 접근 제어와 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.slack.dmPolicy`는 DM 접근을 제어합니다(레거시: `channels.slack.dm.policy`).

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`channels.slack.allowFrom`에 `"*"` 필요, 레거시: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM 플래그:

    - `dm.enabled` (기본값 true)
    - `channels.slack.allowFrom` (권장)
    - `dm.allowFrom` (레거시)
    - `dm.groupEnabled` (group DM 기본값 false)
    - `dm.groupChannels` (선택적 MPIM allowlist)

    멀티 계정 우선순위:

    - `channels.slack.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 이름 있는 계정은 자신의 `allowFrom`이 비어 있을 때 `channels.slack.allowFrom`을 상속합니다.
    - 이름 있는 계정은 `channels.slack.accounts.default.allowFrom`은 상속하지 않습니다.

    DM에서 pairing은 `openclaw pairing approve slack <code>`를 사용합니다.

  </Tab>

  <Tab title="채널 정책">
    `channels.slack.groupPolicy`는 채널 처리 방식을 제어합니다.

    - `open`
    - `allowlist`
    - `disabled`

    채널 allowlist는 `channels.slack.channels` 아래에 있습니다.

    런타임 참고: `channels.slack` 블록이 완전히 없으면(env-only 구성), `channels.defaults.groupPolicy`가 설정돼 있어도 런타임은 `groupPolicy="allowlist"`로 fallback하고 경고 로그를 남깁니다.

    이름/ID 해석:

    - 채널 allowlist 항목과 DM allowlist 항목은 token 접근이 가능하면 시작 시 해석됩니다
    - 해석되지 않은 항목은 config 그대로 유지됩니다
    - 인바운드 권한 매칭은 기본적으로 ID 우선이며, 직접 username/slug 매칭은 `channels.slack.dangerouslyAllowNameMatching: true`가 필요합니다

  </Tab>

  <Tab title="멘션과 채널 사용자">
    채널 메시지는 기본적으로 mention-gated입니다.

    멘션 소스:

    - 명시적 app mention (`<@botId>`)
    - mention regex pattern (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - 지원되는 경우 bot에게 reply한 thread 동작

    채널별 제어(`channels.slack.channels.<id|name>`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 키 형식: `id:`, `e164:`, `username:`, `name:`, 또는 `"*"` wildcard
      (레거시 무접두사 키는 여전히 `id:`로만 매핑)

  </Tab>
</Tabs>

## 명령과 slash 동작

- Slack에서는 native command auto-mode가 **꺼져 있습니다**(`commands.native: "auto"`는 Slack native command를 켜지 않음).
- `channels.slack.commands.native: true`(또는 전역 `commands.native: true`)로 native Slack command handler를 활성화하세요.
- native command를 켜면 Slack에도 매칭되는 slash command(`/<command>` 형식)를 등록해야 합니다. 예외는 하나입니다.
  - status 명령에는 `/agentstatus`를 등록하세요(Slack이 `/status`를 예약함)
- native command를 켜지 않았다면 `channels.slack.slashCommand`를 통해 단일 설정형 slash command를 실행할 수 있습니다.
- native arg menu는 이제 렌더링 전략을 적응적으로 바꿉니다.
  - 옵션 5개 이하: button block
  - 6~100개: static select menu
  - 100개 초과: interactivity option handler가 있으면 async option filtering이 가능한 external select
  - 인코딩된 option 값이 Slack 한도를 넘으면 버튼으로 fallback
- 긴 option payload의 경우 slash command 인자 메뉴는 선택값을 전달하기 전에 confirm dialog를 띄웁니다.

기본 slash command 설정:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Slash session은 격리된 key를 사용합니다.

- `agent:<agentId>:slack:slash:<userId>`

그리고 실제 대화 session(`CommandTargetSessionKey`)을 대상으로 명령 실행을 계속 라우팅합니다.

## Threading, session, reply tag

- DM은 `direct`, 채널은 `channel`, MPIM은 `group`으로 라우팅됩니다.
- 기본 `session.dmScope=main`에서는 Slack DM이 agent main session으로 합쳐집니다.
- 채널 session: `agent:<agentId>:slack:channel:<channelId>`.
- thread reply는 필요한 경우 thread session suffix(`:thread:<threadTs>`)를 만들 수 있습니다.
- `channels.slack.thread.historyScope` 기본값은 `thread`, `thread.inheritParent` 기본값은 `false`입니다.
- `channels.slack.thread.initialHistoryLimit`는 새 thread session이 시작될 때 가져올 기존 thread 메시지 수를 제어합니다(기본값 `20`, `0`이면 비활성화).

Reply threading 제어:

- `channels.slack.replyToMode`: `off|first|all` (기본값 `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel`별 설정
- direct chat용 레거시 fallback: `channels.slack.dm.replyToMode`

수동 reply tag도 지원합니다.

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

참고: `replyToMode="off"`는 Slack에서 **모든** reply threading을 비활성화합니다. 명시적 `[[reply_to_*]]` 태그도 예외가 아닙니다. Telegram에서는 `"off"` 모드에서도 명시적 태그를 존중하는데, 이는 플랫폼의 threading 모델 차이를 반영합니다. Slack thread는 메시지를 채널 흐름에서 숨기지만 Telegram reply는 메인 대화 흐름에 그대로 보이기 때문입니다.

## 미디어, chunking, 전달

<AccordionGroup>
  <Accordion title="인바운드 첨부파일">
    Slack file attachment는 Slack이 호스팅하는 private URL에서 다운로드되며(token 인증 요청 흐름), fetch가 성공하고 크기 제한을 넘지 않으면 media store에 기록됩니다.

    런타임 인바운드 크기 상한은 `channels.slack.mediaMaxMb`로 override하지 않는 한 기본 `20MB`입니다.

  </Accordion>

  <Accordion title="아웃바운드 텍스트와 파일">
    - 텍스트 chunk는 `channels.slack.textChunkLimit`를 사용합니다(기본값 4000)
    - `channels.slack.chunkMode="newline"`은 문단 우선 분할을 활성화합니다
    - 파일 전송은 Slack upload API를 사용하며 thread reply(`thread_ts`)도 포함할 수 있습니다
    - 아웃바운드 미디어 상한은 설정돼 있으면 `channels.slack.mediaMaxMb`를 따르고, 그렇지 않으면 media pipeline의 MIME-kind 기본값을 사용합니다
  </Accordion>

  <Accordion title="전달 대상">
    권장되는 명시적 대상:

    - DM에는 `user:<id>`
    - 채널에는 `channel:<id>`

    Slack DM은 user target으로 전송할 때 Slack conversation API로 열립니다.

  </Accordion>
</AccordionGroup>

## Action과 게이트

Slack action은 `channels.slack.actions.*`로 제어합니다.

현재 Slack tooling에서 사용할 수 있는 action 그룹:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

## 이벤트와 운영 동작

- 메시지 edit/delete/thread broadcast는 system event로 매핑됩니다.
- reaction add/remove 이벤트도 system event로 매핑됩니다.
- member join/leave, channel 생성/이름 변경, pin add/remove 이벤트도 system event로 매핑됩니다.
- thread에서의 "is typing..." 표시용 assistant thread status update는 `assistant.threads.setStatus`를 사용하며 bot scope `assistant:write`가 필요합니다.
- `channel_id_changed`는 `configWrites`가 활성화돼 있으면 channel config key를 마이그레이션할 수 있습니다.
- 채널 topic/purpose 메타데이터는 신뢰되지 않은 context로 취급되며 라우팅 context에 주입될 수 있습니다.
- block action과 modal interaction은 풍부한 payload 필드와 함께 구조화된 `Slack interaction: ...` system event를 발생시킵니다.
  - block action: 선택값, label, picker 값, `workflow_*` 메타데이터
  - modal `view_submission`, `view_closed`: 라우팅된 채널 메타데이터와 form 입력 포함

## Ack 리액션

`ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인용 이모지를 보냅니다.

해석 순서:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- agent identity emoji fallback (`agents.list[].identity.emoji`, 없으면 "👀")

참고:

- Slack은 shortcode(예: `"eyes"`)를 기대합니다.
- Slack 계정 또는 전역에서 리액션을 끄려면 `""`를 사용하세요.

## Typing 리액션 fallback

`typingReaction`은 OpenClaw가 응답을 처리하는 동안 인바운드 Slack 메시지에 임시 리액션을 달고, 실행이 끝나면 제거합니다. 이는 Slack native assistant typing을 사용할 수 없을 때, 특히 DM에서 유용한 fallback입니다.

해석 순서:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

참고:

- Slack은 shortcode(예: `"hourglass_flowing_sand"`)를 기대합니다.
- 이 리액션은 best-effort이며, 응답이나 실패 처리 경로가 끝나면 자동 정리를 시도합니다.

## Manifest와 scope 체크리스트

<AccordionGroup>
  <Accordion title="Slack app manifest 예시">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "assistant:write",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="선택적 user-token scope (읽기 작업)">
    `channels.slack.userToken`을 설정했다면, 일반적인 읽기 scope는 다음과 같습니다.

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - Slack 검색 읽기에 의존한다면 `search:read`

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="채널에 응답이 없음">
    순서대로 확인하세요.

    - `groupPolicy`
    - 채널 allowlist (`channels.slack.channels`)
    - `requireMention`
    - 채널별 `users` allowlist

    유용한 명령:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM 메시지를 무시함">
    확인할 것:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (또는 레거시 `channels.slack.dm.policy`)
    - pairing 승인 / allowlist 항목

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode가 연결되지 않음">
    bot + app token, 그리고 Slack app 설정의 Socket Mode 활성화를 확인하세요.
  </Accordion>

  <Accordion title="HTTP mode가 이벤트를 받지 못함">
    다음을 확인하세요.

    - signing secret
    - webhook path
    - Slack Request URL (Events + Interactivity + Slash Commands)
    - HTTP 계정별 고유 `webhookPath`

  </Accordion>

  <Accordion title="Native/slash command가 실행되지 않음">
    의도한 방식이 다음 중 무엇인지 확인하세요.

    - native command mode (`channels.slack.commands.native: true`) + Slack에 일치하는 slash command 등록
    - 또는 단일 slash command mode (`channels.slack.slashCommand.enabled: true`)

    `commands.useAccessGroups`와 채널/사용자 allowlist도 함께 확인하세요.

  </Accordion>
</AccordionGroup>

## 텍스트 스트리밍

OpenClaw는 Agents and AI Apps API를 통한 Slack native text streaming을 지원합니다.

`channels.slack.streaming`은 라이브 프리뷰 동작을 제어합니다.

- `off`: 라이브 프리뷰 스트리밍 비활성화
- `partial` (기본값): 최신 부분 출력을 반영하도록 프리뷰 텍스트 교체
- `block`: chunk 단위 프리뷰 업데이트를 덧붙임
- `progress`: 생성 중 progress 상태 텍스트를 보여 준 뒤 최종 텍스트 전송

`channels.slack.nativeStreaming`은 `streaming`이 `partial`일 때 Slack의 native streaming API(`chat.startStream` / `chat.appendStream` / `chat.stopStream`) 사용 여부를 제어합니다(기본값: `true`).

Slack native streaming 비활성화(초안 프리뷰 동작은 유지):

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

레거시 키:

- `channels.slack.streamMode` (`replace | status_final | append`)는 `channels.slack.streaming`으로 자동 마이그레이션됩니다.
- boolean `channels.slack.streaming`은 `channels.slack.nativeStreaming`으로 자동 마이그레이션됩니다.

### 요구 사항

1. Slack app 설정에서 **Agents and AI Apps**를 활성화합니다.
2. 앱에 `assistant:write` scope가 있는지 확인합니다.
3. 해당 메시지에 reply thread가 있어야 합니다. thread 선택은 여전히 `replyToMode`를 따릅니다.

### 동작

- 첫 번째 텍스트 chunk가 스트림을 시작합니다(`chat.startStream`).
- 이후 텍스트 chunk는 같은 스트림에 이어붙입니다(`chat.appendStream`).
- 응답 종료 시 스트림을 마무리합니다(`chat.stopStream`).
- media와 non-text payload는 일반 전달로 fallback합니다.
- 스트리밍이 중간에 실패하면 남은 payload는 일반 전달로 fallback합니다.

## Configuration reference 포인터

주요 참조:

- [Configuration reference - Slack](/gateway/configuration-reference#slack)

  고신호 Slack 필드:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM access: `dm.enabled`, `dmPolicy`, `allowFrom` (레거시: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - compatibility toggle: `dangerouslyAllowNameMatching` (break-glass; 필요할 때만 켜고 평소엔 끄기)
  - channel access: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## 관련 문서

- [페어링](/channels/pairing)
- [채널 라우팅](/channels/channel-routing)
- [문제 해결](/channels/troubleshooting)
- [Configuration](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
