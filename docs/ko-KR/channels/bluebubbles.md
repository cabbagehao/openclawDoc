---
summary: "BlueBubbles macOS 서버를 통한 iMessage 연동 가이드로, REST 기반 송수신, 타이핑, 리액션, 페어링, 고급 액션을 다룹니다."
description: "BlueBubbles 채널 설정부터 웹훅, 페어링, 고급 액션, 문제 해결까지 macOS 기반 iMessage 연동 방법을 안내합니다."
read_when:
  - BlueBubbles 채널을 설정할 때
  - 웹훅 페어링 문제를 해결할 때
  - macOS에서 iMessage 연동을 구성할 때
title: "BlueBubbles"
x-i18n:
  source_path: "channels/bluebubbles.md"
---

# BlueBubbles (macOS REST)

상태: BlueBubbles macOS 서버와 HTTP로 통신하는 내장 플러그인입니다. 레거시 `imsg` 채널보다 API가 더 풍부하고 설정이 쉬워서 **iMessage 연동에는 권장되는 방식**입니다.

## 개요

- macOS에서 BlueBubbles helper app([bluebubbles.app](https://bluebubbles.app))을 통해 실행됩니다.
- 권장 및 테스트 환경은 macOS Sequoia (15)입니다. macOS Tahoe (26)에서도 동작하지만 현재 Tahoe에서는 edit 기능이 깨져 있고, group icon 업데이트는 성공으로 표시되더라도 동기화되지 않을 수 있습니다.
- OpenClaw는 REST API(`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)를 통해 BlueBubbles와 통신합니다.
- 수신 메시지는 webhook으로 들어오며, 발신 응답, typing indicator, read receipt, tapback은 REST 호출로 처리합니다.
- 첨부 파일과 sticker는 수신 미디어로 가져오며, 가능한 경우 에이전트에도 전달됩니다.
- pairing 및 allowlist는 다른 채널과 동일한 방식으로 동작하며(`/channels/pairing` 등), `channels.bluebubbles.allowFrom`과 pairing code를 함께 사용합니다.
- reaction은 Slack이나 Telegram과 마찬가지로 system event로 노출되므로, 에이전트가 응답 전에 이를 언급할 수 있습니다.
- 고급 기능으로 edit, unsend, reply threading, message effect, group management를 지원합니다.

## 빠른 시작

1. Mac에 BlueBubbles server를 설치합니다([bluebubbles.app/install](https://bluebubbles.app/install)의 안내를 따르세요).
2. BlueBubbles 설정에서 web API를 활성화하고 password를 설정합니다.
3. `openclaw onboard`를 실행해 BlueBubbles를 선택하거나, 아래처럼 수동으로 설정합니다.

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubbles webhook이 gateway를 가리키도록 설정합니다(예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. gateway를 시작하면 webhook handler가 등록되고 pairing이 시작됩니다.

보안 참고:

- webhook password는 항상 설정하세요.
- webhook 인증은 항상 필요합니다. OpenClaw는 loopback/proxy 구성과 관계없이 `channels.bluebubbles.password`와 일치하는 password/guid를 포함하지 않은 BlueBubbles webhook 요청을 거부합니다(예: `?password=<password>` 또는 `x-password`).
- password 인증은 webhook body 전체를 읽거나 파싱하기 전에 먼저 검사합니다.

## Messages.app 활성 상태 유지 (VM / headless setups)

일부 macOS VM 또는 상시 실행 환경에서는 Messages.app이 “idle” 상태가 되어, 앱을 열거나 foreground로 가져오기 전까지 수신 이벤트가 멈추는 경우가 있습니다. 간단한 우회 방법은 **5분마다 Messages를 깨우는 것**이며, AppleScript와 LaunchAgent로 구현할 수 있습니다.

### 1) AppleScript 저장

다음 경로에 저장합니다.

- `~/Scripts/poke-messages.scpt`

예시 스크립트(비대화형이며 focus를 빼앗지 않음):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) LaunchAgent 설치

다음 경로에 저장합니다.

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

참고:

- 이 LaunchAgent는 **300초마다** 그리고 **로그인 시점에** 실행됩니다.
- 첫 실행 시 macOS **Automation** 권한 요청(`osascript` → Messages)이 나타날 수 있습니다. LaunchAgent를 실행하는 동일한 사용자 세션에서 이를 허용하세요.

로드:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles는 interactive setup wizard에서 사용할 수 있습니다.

```
openclaw onboard
```

wizard가 다음 항목을 묻습니다.

- **Server URL** (required): BlueBubbles server 주소(예: `http://192.168.1.100:1234`)
- **Password** (required): BlueBubbles Server 설정의 API password
- **Webhook path** (optional): 기본값은 `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open, 또는 disabled
- **Allow list**: 전화번호, 이메일, 또는 chat target

CLI로도 BlueBubbles를 추가할 수 있습니다.

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 접근 제어 (DM + group)

DM:

- 기본값은 `channels.bluebubbles.dmPolicy = "pairing"`입니다.
- 알 수 없는 발신자에게는 pairing code가 전송되며, 승인되기 전까지 메시지는 무시됩니다(code는 1시간 후 만료).
- 다음 명령으로 승인합니다.
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- pairing이 기본 token exchange 방식입니다. 자세한 내용은 [Pairing](/channels/pairing)을 참고하세요.

Group:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`(기본값: `allowlist`)입니다.
- `channels.bluebubbles.groupAllowFrom`은 `allowlist`가 설정되었을 때 group에서 누가 trigger할 수 있는지 제어합니다.

### Mention gating (group)

BlueBubbles는 iMessage/WhatsApp과 비슷하게 group chat에서 mention gating을 지원합니다.

- mention 감지는 `agents.list[].groupChat.mentionPatterns`(또는 `messages.groupChat.mentionPatterns`)를 사용합니다.
- group에 `requireMention`이 활성화되어 있으면, 에이전트는 mention된 경우에만 응답합니다.
- 권한이 있는 발신자의 control command는 mention gating을 우회합니다.

Group별 설정 예시:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Command gating

- control command(예: `/config`, `/model`)은 권한이 있어야 실행할 수 있습니다.
- command 권한 판정에는 `allowFrom`과 `groupAllowFrom`을 사용합니다.
- 권한이 있는 발신자는 group에서 mention 없이도 control command를 실행할 수 있습니다.

## Typing + read receipts

- **Typing indicators**: 응답 생성 전과 생성 중에 자동으로 전송됩니다.
- **Read receipts**: `channels.bluebubbles.sendReadReceipts`로 제어하며 기본값은 `true`입니다.
- **Typing indicators**: OpenClaw는 typing start event를 전송하고, BlueBubbles는 전송 완료나 timeout 시 typing 상태를 자동으로 해제합니다(DELETE를 사용한 수동 중지는 신뢰할 수 없습니다).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## 고급 액션

BlueBubbles는 config에서 활성화되면 다음과 같은 고급 message action을 지원합니다.

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

사용 가능한 action:

- **react**: tapback reaction 추가/제거 (`messageId`, `emoji`, `remove`)
- **edit**: 전송한 메시지 수정 (`messageId`, `text`)
- **unsend**: 메시지 전송 취소 (`messageId`)
- **reply**: 특정 메시지에 답글 전송 (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage effect와 함께 전송 (`text`, `to`, `effectId`)
- **renameGroup**: group chat 이름 변경 (`chatGuid`, `displayName`)
- **setGroupIcon**: group chat icon/photo 설정 (`chatGuid`, `media`) - macOS 26 Tahoe에서는 불안정할 수 있으며 API가 성공을 반환해도 icon이 동기화되지 않을 수 있습니다.
- **addParticipant**: group에 참가자 추가 (`chatGuid`, `address`)
- **removeParticipant**: group에서 참가자 제거 (`chatGuid`, `address`)
- **leaveGroup**: group chat 나가기 (`chatGuid`)
- **sendAttachment**: 미디어/파일 전송 (`to`, `buffer`, `filename`, `asVoice`)
  - Voice memo를 보내려면 **MP3** 또는 **CAF** 오디오와 함께 `asVoice: true`를 설정합니다. BlueBubbles는 voice memo 전송 시 MP3를 CAF로 변환합니다.

### Message ID (short vs full)

OpenClaw는 token을 절약하기 위해 _짧은_ message ID(예: `1`, `2`)를 노출할 수 있습니다.

- `MessageSid` / `ReplyToId`는 short ID일 수 있습니다.
- `MessageSidFull` / `ReplyToIdFull`에는 provider의 full ID가 들어 있습니다.
- short ID는 메모리에만 존재하므로 restart나 cache eviction 이후에는 사라질 수 있습니다.
- action은 short 또는 full `messageId` 모두 받을 수 있지만, short ID가 더 이상 존재하지 않으면 오류가 발생합니다.

내구성 있는 automation 및 저장에는 full ID를 사용하세요.

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Context: inbound payload의 `MessageSidFull` / `ReplyToIdFull`

template variable에 대한 자세한 내용은 [Configuration](/gateway/configuration)을 참고하세요.

## Block streaming

응답을 한 개의 메시지로 보낼지, 여러 block으로 나누어 streaming할지 제어할 수 있습니다.

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Media + limits

- 수신 attachment는 다운로드되어 media cache에 저장됩니다.
- 수신 및 발신 media 크기 제한은 `channels.bluebubbles.mediaMaxMb`로 제어하며 기본값은 8 MB입니다.
- 발신 text는 `channels.bluebubbles.textChunkLimit`에 따라 분할되며 기본값은 4000자입니다.

## Configuration reference

전체 설정은 [Configuration](/gateway/configuration)을 참고하세요.

Provider 옵션:

- `channels.bluebubbles.enabled`: 채널 활성화/비활성화
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API base URL
- `channels.bluebubbles.password`: API password
- `channels.bluebubbles.webhookPath`: webhook endpoint path(기본값: `/bluebubbles-webhook`)
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: `pairing`)
- `channels.bluebubbles.allowFrom`: DM allowlist(handles, emails, E.164 numbers, `chat_id:*`, `chat_guid:*`)
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`(기본값: `allowlist`)
- `channels.bluebubbles.groupAllowFrom`: group sender allowlist
- `channels.bluebubbles.groups`: group별 config(`requireMention` 등)
- `channels.bluebubbles.sendReadReceipts`: read receipt 전송(기본값: `true`)
- `channels.bluebubbles.blockStreaming`: block streaming 활성화(기본값: `false`, streaming reply에 필요)
- `channels.bluebubbles.textChunkLimit`: 발신 chunk 크기(문자 수, 기본값: 4000)
- `channels.bluebubbles.chunkMode`: `length`(기본값)는 `textChunkLimit`를 초과할 때만 분할하고, `newline`은 빈 줄(문단 경계) 기준으로 먼저 나눈 뒤 길이 기준 분할을 적용합니다.
- `channels.bluebubbles.mediaMaxMb`: 수신/발신 media 제한(MB, 기본값: 8)
- `channels.bluebubbles.mediaLocalRoots`: 발신 local media path에 허용되는 절대 디렉터리의 명시적 allowlist입니다. 이 값이 설정되지 않으면 local path 전송은 기본적으로 거부됩니다. 계정별 override: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
- `channels.bluebubbles.historyLimit`: group context에 포함할 최대 메시지 수(0이면 비활성화)
- `channels.bluebubbles.dmHistoryLimit`: DM history limit
- `channels.bluebubbles.actions`: 개별 action 활성화/비활성화
- `channels.bluebubbles.accounts`: multi-account configuration

관련 글로벌 옵션:

- `agents.list[].groupChat.mentionPatterns`(또는 `messages.groupChat.mentionPatterns`)
- `messages.responsePrefix`

## Addressing / delivery targets

안정적인 라우팅을 위해서는 `chat_guid` 사용을 권장합니다.

- `chat_guid:iMessage;-;+15555550123` (group에서는 권장)
- `chat_id:123`
- `chat_identifier:...`
- 직접 handle 지정: `+15555550123`, `user@example.com`
  - 직접 handle에 기존 DM chat이 없으면 OpenClaw가 `POST /api/v1/chat/new`를 통해 새 chat을 생성합니다. 이 기능을 사용하려면 BlueBubbles Private API가 활성화되어 있어야 합니다.

## Security

- webhook 요청은 query param 또는 header의 `guid`/`password`를 `channels.bluebubbles.password`와 비교해 인증합니다. `localhost`에서 온 요청도 허용됩니다.
- API password와 webhook endpoint는 자격 증명처럼 취급하고 비밀로 유지하세요.
- localhost 신뢰 때문에, 동일 호스트의 reverse proxy가 의도치 않게 password를 우회할 수 있습니다. gateway를 proxy 뒤에 둘 경우 proxy 자체에 인증을 적용하고 `gateway.trustedProxies`를 설정하세요. 자세한 내용은 [Gateway security](/gateway/security#reverse-proxy-configuration)를 참고하세요.
- BlueBubbles server를 LAN 외부에 노출한다면 HTTPS와 firewall rule을 함께 사용하세요.

## Troubleshooting

- typing/read event가 동작하지 않으면 BlueBubbles webhook log를 확인하고, gateway 경로가 `channels.bluebubbles.webhookPath`와 일치하는지 점검하세요.
- pairing code는 1시간 후 만료됩니다. `openclaw pairing list bluebubbles`와 `openclaw pairing approve bluebubbles <code>`를 사용하세요.
- reaction에는 BlueBubbles private API(`POST /api/v1/message/react`)가 필요하므로, server 버전이 해당 endpoint를 제공하는지 확인하세요.
- edit/unsend는 macOS 13+와 호환되는 BlueBubbles server 버전이 필요합니다. macOS 26(Tahoe)에서는 private API 변경으로 인해 현재 edit가 동작하지 않습니다.
- group icon 업데이트는 macOS 26(Tahoe)에서 불안정할 수 있습니다. API는 성공을 반환해도 새 icon이 동기화되지 않을 수 있습니다.
- OpenClaw는 BlueBubbles server의 macOS 버전에 따라 알려진 문제의 action을 자동으로 숨깁니다. macOS 26(Tahoe)에서 edit가 계속 보이면 `channels.bluebubbles.actions.edit=false`로 수동 비활성화하세요.
- 상태 및 health 정보는 `openclaw status --all` 또는 `openclaw status --deep`에서 확인할 수 있습니다.

일반적인 channel workflow는 [Channels](/channels)와 [Plugins](/tools/plugin) 가이드를 참고하세요.
