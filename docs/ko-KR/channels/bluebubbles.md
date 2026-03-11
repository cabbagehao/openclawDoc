---
summary: "BlueBubbles macOS server를 통한 iMessage(REST send/receive, typing, reaction, pairing, 고급 action)."
read_when:
  - BlueBubbles 채널을 설정할 때
  - webhook pairing 문제를 해결할 때
  - macOS에서 iMessage를 설정할 때
title: "BlueBubbles"
---

# BlueBubbles (macOS REST)

상태: HTTP로 BlueBubbles macOS server와 통신하는 번들 plugin입니다. legacy imsg 채널보다 API가 더 풍부하고 설정이 더 쉬워서 **iMessage 통합에 권장**됩니다.

## 개요

- macOS에서 BlueBubbles helper app([bluebubbles.app](https://bluebubbles.app))을 통해 실행됩니다.
- 권장/테스트 환경: macOS Sequoia(15). macOS Tahoe(26)도 동작하지만, 현재 Tahoe에서는 edit가 깨져 있고 group icon 업데이트는 성공으로 보고되더라도 sync되지 않을 수 있습니다.
- OpenClaw는 REST API(`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)를 통해 BlueBubbles와 통신합니다.
- 수신 메시지는 webhook으로 들어오고, outgoing reply, typing indicator, read receipt, tapback은 REST 호출로 처리됩니다.
- 첨부파일과 sticker는 inbound media로 수집되며, 가능한 경우 agent에도 노출됩니다.
- Pairing/allowlist는 다른 채널과 동일하게 동작합니다(`channels.bluebubbles.allowFrom` + pairing code, `/channels/pairing` 등).
- Reaction은 Slack/Telegram처럼 system event로 노출되어 agent가 응답 전에 이를 "mention"할 수 있습니다.
- 고급 기능: edit, unsend, reply threading, message effect, group 관리.

## 빠른 시작

1. Mac에 BlueBubbles server를 설치합니다([bluebubbles.app/install](https://bluebubbles.app/install)의 지침 참고).
2. BlueBubbles config에서 web API를 활성화하고 password를 설정합니다.
3. `openclaw onboard` 를 실행해 BlueBubbles를 선택하거나, 수동으로 설정합니다.

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

4. BlueBubbles webhook이 gateway를 가리키게 설정합니다(예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. gateway를 시작하면 webhook handler가 등록되고 pairing이 시작됩니다.

보안 참고:

- 항상 webhook password를 설정하세요.
- webhook 인증은 항상 필요합니다. OpenClaw는 loopback/proxy topology와 관계없이 `channels.bluebubbles.password` 와 일치하는 password/guid를 포함하지 않은 BlueBubbles webhook 요청을 거부합니다(예: `?password=<password>` 또는 `x-password`).
- password 인증은 전체 webhook body를 읽거나 parse하기 전에 검사됩니다.

## Messages.app 계속 활성 상태로 유지하기(VM / headless setup)

일부 macOS VM / always-on 구성에서는 Messages.app이 “idle” 상태가 될 수 있습니다(앱을 열거나 foreground로 가져오기 전까지 incoming event가 멈춤). 간단한 우회 방법은 AppleScript + LaunchAgent로 **5분마다 Messages를 poke** 하는 것입니다.

### 1) AppleScript 저장

다음 경로에 저장하세요.

- `~/Scripts/poke-messages.scpt`

예시 스크립트(비대화형, focus를 빼앗지 않음):

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

다음 경로에 저장하세요.

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

- 이 작업은 **300초마다** 그리고 **로그인 시** 실행됩니다.
- 첫 실행 시 macOS **Automation** 프롬프트(`osascript` → Messages)가 뜰 수 있습니다. LaunchAgent를 실행하는 동일한 사용자 세션에서 이를 승인하세요.

로드:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles는 대화형 setup wizard에서 사용할 수 있습니다.

```text
openclaw onboard
```

wizard가 묻는 항목:

- **Server URL** (필수): BlueBubbles server 주소(예: `http://192.168.1.100:1234`)
- **Password** (필수): BlueBubbles Server 설정의 API password
- **Webhook path** (선택 사항): 기본값 `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open, disabled
- **Allow list**: 전화번호, 이메일, 또는 chat target

CLI로도 BlueBubbles를 추가할 수 있습니다.

```text
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 접근 제어(DM + group)

DM:

- 기본값: `channels.bluebubbles.dmPolicy = "pairing"`.
- 알 수 없는 발신자는 pairing code를 받고, 승인될 때까지 메시지는 무시됩니다(code는 1시간 후 만료).
- 승인 방법:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing이 기본 token 교환 방식입니다. 자세한 내용: [Pairing](/channels/pairing)

Group:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (기본값: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` 은 `allowlist` 일 때 group에서 누가 trigger할 수 있는지 제어합니다.

### Mention gating (group)

BlueBubbles는 group chat에서 iMessage/WhatsApp과 동일한 mention gating을 지원합니다.

- mention 감지에는 `agents.list[].groupChat.mentionPatterns` (또는 `messages.groupChat.mentionPatterns`)를 사용합니다.
- group에 `requireMention` 이 활성화되어 있으면, agent는 mention되었을 때만 응답합니다.
- 권한 있는 발신자의 control command는 mention gating을 우회합니다.

group별 설정:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // all groups 기본값
        "iMessage;-;chat123": { requireMention: false }, // 특정 group override
      },
    },
  },
}
```

### Command gating

- control command(예: `/config`, `/model`)는 권한이 필요합니다.
- command 권한 판단에는 `allowFrom` 과 `groupAllowFrom` 을 사용합니다.
- 권한 있는 발신자는 group에서 mention 없이도 control command를 실행할 수 있습니다.

## Typing + read receipt

- **Typing indicator**: 응답 생성 전과 생성 중에 자동으로 전송됩니다.
- **Read receipt**: `channels.bluebubbles.sendReadReceipts` 로 제어됩니다(기본값: `true`).
- **Typing indicator**: OpenClaw는 typing start event를 보내고, BlueBubbles는 전송 또는 timeout 시 typing을 자동으로 해제합니다(수동 stop via DELETE는 신뢰할 수 없음).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // read receipt 비활성화
    },
  },
}
```

## 고급 action

BlueBubbles는 config에서 활성화하면 고급 메시지 action을 지원합니다.

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (default: true)
        edit: true, // 보낸 메시지 edit (macOS 13+, macOS 26 Tahoe에서는 깨짐)
        unsend: true, // 메시지 unsend (macOS 13+)
        reply: true, // message GUID 기준 reply threading
        sendWithEffect: true, // 메시지 effect (slam, loud 등)
        renameGroup: true, // group chat 이름 변경
        setGroupIcon: true, // group chat icon/photo 설정 (macOS 26 Tahoe에서 불안정)
        addParticipant: true, // group에 참여자 추가
        removeParticipant: true, // group에서 참여자 제거
        leaveGroup: true, // group chat 나가기
        sendAttachment: true, // attachment/media 전송
      },
    },
  },
}
```

사용 가능한 action:

- **react**: tapback reaction 추가/제거 (`messageId`, `emoji`, `remove`)
- **edit**: 보낸 메시지 edit (`messageId`, `text`)
- **unsend**: 메시지 unsend (`messageId`)
- **reply**: 특정 메시지에 reply (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage effect와 함께 전송 (`text`, `to`, `effectId`)
- **renameGroup**: group chat 이름 변경 (`chatGuid`, `displayName`)
- **setGroupIcon**: group chat의 icon/photo 설정 (`chatGuid`, `media`) — macOS 26 Tahoe에서 불안정(API는 성공을 반환해도 icon이 sync되지 않을 수 있음)
- **addParticipant**: group에 사람 추가 (`chatGuid`, `address`)
- **removeParticipant**: group에서 사람 제거 (`chatGuid`, `address`)
- **leaveGroup**: group chat 나가기 (`chatGuid`)
- **sendAttachment**: media/file 전송 (`to`, `buffer`, `filename`, `asVoice`)
  - Voice memo: **MP3** 또는 **CAF** 오디오와 함께 `asVoice: true` 를 설정하면 iMessage voice message로 전송됩니다. BlueBubbles는 voice memo 전송 시 MP3 → CAF 변환을 수행합니다.

### Message ID(짧은 ID vs 전체 ID)

OpenClaw는 token 절약을 위해 _짧은_ message ID(예: `1`, `2`)를 노출할 수 있습니다.

- `MessageSid` / `ReplyToId` 는 짧은 ID일 수 있습니다.
- `MessageSidFull` / `ReplyToIdFull` 에는 provider 전체 ID가 들어 있습니다.
- 짧은 ID는 in-memory입니다. restart 또는 cache eviction 시 만료될 수 있습니다.
- action은 짧은 `messageId` 와 전체 `messageId` 를 모두 받지만, 짧은 ID가 더 이상 존재하지 않으면 에러가 납니다.

내구성 있는 automation과 저장에는 전체 ID를 사용하세요.

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Context: inbound payload의 `MessageSidFull` / `ReplyToIdFull`

template 변수는 [Configuration](/gateway/configuration) 를 참고하세요.

## Block streaming

응답을 단일 메시지로 보낼지 block 단위로 stream할지 제어합니다.

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // block streaming 활성화 (기본값: off)
    },
  },
}
```

## 미디어 + 제한

- inbound attachment는 다운로드되어 media cache에 저장됩니다.
- inbound/outbound media에는 `channels.bluebubbles.mediaMaxMb` 로 media cap을 적용합니다(기본값: 8 MB).
- outbound text는 `channels.bluebubbles.textChunkLimit` (기본값: 4000 chars)로 chunking됩니다.

## Configuration reference

전체 설정: [Configuration](/gateway/configuration)

Provider 옵션:

- `channels.bluebubbles.enabled`: 채널 활성화/비활성화.
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API base URL.
- `channels.bluebubbles.password`: API password.
- `channels.bluebubbles.webhookPath`: webhook endpoint path (기본값: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: `pairing`).
- `channels.bluebubbles.allowFrom`: DM allowlist (handle, email, E.164 번호, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (기본값: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: group sender allowlist.
- `channels.bluebubbles.groups`: group별 config (`requireMention` 등).
- `channels.bluebubbles.sendReadReceipts`: read receipt 전송 (기본값: `true`).
- `channels.bluebubbles.blockStreaming`: block streaming 활성화 (기본값: `false`; streaming reply에 필요).
- `channels.bluebubbles.textChunkLimit`: outbound chunk 크기(chars 단위, 기본값: 4000).
- `channels.bluebubbles.chunkMode`: `length` (기본값)은 `textChunkLimit` 초과 시에만 분할; `newline` 은 길이 기준 분할 전에 빈 줄(문단 경계)에서 분할.
- `channels.bluebubbles.mediaMaxMb`: inbound/outbound media cap(MB 단위, 기본값: 8).
- `channels.bluebubbles.mediaLocalRoots`: outbound local media path에 허용되는 절대 로컬 디렉터리의 명시적 allowlist. 이 값이 설정되지 않으면 local path 전송은 기본적으로 거부됩니다. account별 override: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: context용 최대 group 메시지 수 (`0` 이면 비활성화).
- `channels.bluebubbles.dmHistoryLimit`: DM history 제한.
- `channels.bluebubbles.actions`: 개별 action 활성화/비활성화.
- `channels.bluebubbles.accounts`: multi-account 설정.

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns` (또는 `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Addressing / delivery target

안정적인 routing에는 `chat_guid` 를 우선 사용하세요.

- `chat_guid:iMessage;-;+15555550123` (group에 권장)
- `chat_id:123`
- `chat_identifier:...`
- Direct handle: `+15555550123`, `user@example.com`
  - direct handle에 기존 DM chat이 없으면, OpenClaw는 `POST /api/v1/chat/new` 로 새 chat을 생성합니다. 이 기능을 쓰려면 BlueBubbles Private API가 활성화되어 있어야 합니다.

## 보안

- webhook 요청은 query param 또는 header의 `guid`/`password` 와 `channels.bluebubbles.password` 를 비교해 인증합니다. `localhost` 에서 온 요청도 허용됩니다.
- API password와 webhook endpoint는 secret으로 유지하세요(자격 증명처럼 취급).
- Localhost trust 때문에, 같은 호스트의 reverse proxy가 의도치 않게 password를 우회할 수 있습니다. gateway를 proxy한다면 proxy에서 auth를 요구하고 `gateway.trustedProxies` 를 설정하세요. [Gateway security](/gateway/security#reverse-proxy-configuration) 참고.
- LAN 밖으로 BlueBubbles server를 노출한다면 HTTPS + firewall rule을 활성화하세요.

## 문제 해결

- typing/read event가 더 이상 동작하지 않으면, BlueBubbles webhook log를 확인하고 gateway path가 `channels.bluebubbles.webhookPath` 와 일치하는지 검증하세요.
- Pairing code는 1시간 후 만료됩니다. `openclaw pairing list bluebubbles` 와 `openclaw pairing approve bluebubbles <code>` 를 사용하세요.
- Reaction은 BlueBubbles private API(`POST /api/v1/message/react`)가 필요합니다. server 버전이 이를 제공하는지 확인하세요.
- Edit/unsend는 macOS 13+ 와 호환되는 BlueBubbles server 버전이 필요합니다. macOS 26(Tahoe)에서는 private API 변경으로 인해 현재 edit가 깨져 있습니다.
- Group icon 업데이트는 macOS 26(Tahoe)에서 불안정할 수 있습니다. API는 성공을 반환해도 새 icon이 sync되지 않을 수 있습니다.
- OpenClaw는 BlueBubbles server의 macOS 버전을 기준으로 알려진 broken action을 자동으로 숨깁니다. macOS 26(Tahoe)에서 edit가 계속 보이면 `channels.bluebubbles.actions.edit=false` 로 수동 비활성화하세요.
- 상태/health 정보: `openclaw status --all` 또는 `openclaw status --deep`.

일반 채널 워크플로 참고 문서는 [Channels](/channels) 와 [Plugins](/tools/plugin) 가이드를 보세요.
