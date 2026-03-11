---
summary: "imsg를 통한 레거시 iMessage 지원(stdio 위 JSON-RPC). 새 설정에는 BlueBubbles를 사용하세요."
read_when:
  - iMessage 지원을 설정할 때
  - iMessage send/receive를 디버깅할 때
title: "iMessage"
---

# iMessage (legacy: imsg)

<Warning>
새 iMessage 배포에는 <a href="/channels/bluebubbles">BlueBubbles</a>를 사용하세요.

`imsg` integration은 레거시이며 향후 릴리스에서 제거될 수 있습니다.
</Warning>

상태: 레거시 외부 CLI integration. Gateway가 `imsg rpc`를 spawn하고 stdio 위 JSON-RPC로 통신합니다(별도 daemon/port 없음).

<CardGroup cols={3}>
  <Card title="BlueBubbles (권장)" icon="message-circle" href="/channels/bluebubbles">
    새 설정을 위한 권장 iMessage 경로입니다.
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    iMessage DM은 기본적으로 pairing mode를 사용합니다.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/gateway/configuration-reference#imessage">
    전체 iMessage 필드 레퍼런스입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="로컬 Mac (빠른 경로)">
    <Steps>
      <Step title="imsg 설치 및 확인">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw 구성">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway 시작">

```bash
openclaw gateway
```

      </Step>

      <Step title="첫 DM pairing 승인 (기본 dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Pairing request는 1시간 후 만료됩니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH를 통한 원격 Mac">
    OpenClaw는 stdio 호환 `cliPath`만 필요하므로, `cliPath`를 원격 Mac으로 SSH 접속해 `imsg`를 실행하는 wrapper script로 지정할 수 있습니다.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    첨부 파일을 활성화하는 경우 권장 구성:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`가 설정되지 않으면 OpenClaw는 SSH wrapper script를 파싱해 자동 감지를 시도합니다.
    `remoteHost`는 `host` 또는 `user@host` 형식이어야 합니다(공백이나 SSH 옵션 불가).
    OpenClaw는 SCP에 strict host-key checking을 사용하므로, relay host key가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
    첨부 파일 경로는 허용된 root(`attachmentRoots` / `remoteAttachmentRoots`)에 대해 검증됩니다.

  </Tab>
</Tabs>

## 요구 사항 및 권한 (macOS)

- `imsg`를 실행하는 Mac에서 Messages가 로그인되어 있어야 합니다.
- OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에는 Full Disk Access가 필요합니다(Messages DB 접근).
- Messages.app을 통해 메시지를 보내려면 Automation 권한이 필요합니다.

<Tip>
권한은 프로세스 컨텍스트별로 부여됩니다. gateway가 headless(LaunchAgent/SSH)로 실행된다면, 같은 컨텍스트에서 한 번 대화형 명령을 실행해 프롬프트를 띄우세요:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 접근 제어 및 라우팅

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy`는 direct message를 제어합니다:

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    Allowlist 필드: `channels.imessage.allowFrom`.

    Allowlist 항목은 handle 또는 chat target(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)이 될 수 있습니다.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy`는 group 처리를 제어합니다:

    - `allowlist` (구성되어 있을 때 기본값)
    - `open`
    - `disabled`

    Group sender allowlist: `channels.imessage.groupAllowFrom`.

    런타임 fallback: `groupAllowFrom`이 설정되지 않았으면, 가능한 경우 iMessage group sender 검사는 `allowFrom`으로 fallback합니다.
    런타임 참고: `channels.imessage`가 완전히 없으면 런타임은 `groupPolicy="allowlist"`로 fallback하고 warning을 기록합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 마찬가지).

    Group의 mention gating:

    - iMessage에는 네이티브 mention metadata가 없습니다
    - mention 감지는 regex pattern(`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)을 사용합니다
    - 구성된 pattern이 없으면 mention gating을 강제할 수 없습니다

    권한 있는 발신자의 control command는 group에서 mention gating을 우회할 수 있습니다.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM은 direct routing을 사용하고, group은 group routing을 사용합니다.
    - 기본 `session.dmScope=main`에서는 iMessage DM이 agent main session으로 합쳐집니다.
    - Group session은 격리됩니다(`agent:<agentId>:imessage:group:<chat_id>`).
    - Reply는 원래의 channel/target metadata를 사용해 다시 iMessage로 라우팅됩니다.

    Group 같은 thread 동작:

    일부 다중 참여자 iMessage thread는 `is_group=false`로 들어올 수 있습니다.
    해당 `chat_id`가 `channels.imessage.groups` 아래에 명시적으로 구성되어 있다면, OpenClaw는 이를 group 트래픽으로 처리합니다(group gating + group session isolation).

  </Tab>
</Tabs>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 bot macOS 사용자(분리된 iMessage identity)">
    bot 트래픽을 개인 Messages profile과 분리하려면 전용 Apple ID와 macOS 사용자를 사용하세요.

    일반적인 흐름:

    1. 전용 macOS 사용자를 만들고 로그인합니다.
    2. 해당 사용자에서 bot Apple ID로 Messages에 로그인합니다.
    3. 해당 사용자에 `imsg`를 설치합니다.
    4. OpenClaw가 해당 사용자 컨텍스트에서 `imsg`를 실행할 수 있도록 SSH wrapper를 만듭니다.
    5. `channels.imessage.accounts.<id>.cliPath`와 `.dbPath`를 해당 사용자 profile로 지정합니다.

    첫 실행에는 해당 bot 사용자 세션에서 GUI 승인(Automation + Full Disk Access)이 필요할 수 있습니다.

  </Accordion>

  <Accordion title="Tailscale을 통한 원격 Mac (예시)">
    일반적인 토폴로지:

    - gateway는 Linux/VM에서 실행
    - iMessage + `imsg`는 tailnet의 Mac에서 실행
    - `cliPath` wrapper는 SSH를 사용해 `imsg` 실행
    - `remoteHost`는 SCP 첨부 파일 가져오기를 활성화

    예시:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    SSH와 SCP가 모두 비대화형으로 동작하도록 SSH key를 사용하세요.
    먼저 host key를 신뢰하도록 설정하세요(예: `ssh bot@mac-mini.tailnet-1234.ts.net`) 그러면 `known_hosts`가 채워집니다.

  </Accordion>

  <Accordion title="멀티 계정 패턴">
    iMessage는 `channels.imessage.accounts` 아래에서 계정별 구성을 지원합니다.

    각 계정은 `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, history 설정, attachment root allowlist 같은 필드를 override할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 미디어, chunking, delivery target

<AccordionGroup>
  <Accordion title="첨부 파일과 미디어">
    - 인바운드 첨부 파일 수집은 선택 사항입니다: `channels.imessage.includeAttachments`
    - `remoteHost`가 설정되면 원격 첨부 파일 경로를 SCP로 가져올 수 있습니다
    - 첨부 파일 경로는 허용된 root와 일치해야 합니다:
      - `channels.imessage.attachmentRoots` (로컬)
      - `channels.imessage.remoteAttachmentRoots` (원격 SCP 모드)
      - 기본 root pattern: `/Users/*/Library/Messages/Attachments`
    - SCP는 strict host-key checking(`StrictHostKeyChecking=yes`)을 사용합니다
    - 아웃바운드 미디어 크기는 `channels.imessage.mediaMaxMb`를 사용합니다(기본값 16 MB)
  </Accordion>

  <Accordion title="아웃바운드 chunking">
    - 텍스트 chunk 제한: `channels.imessage.textChunkLimit` (기본값 4000)
    - chunk mode: `channels.imessage.chunkMode`
      - `length` (기본값)
      - `newline` (문단 우선 분할)
  </Accordion>

  <Accordion title="주소 지정 형식">
    권장되는 명시적 target:

    - `chat_id:123` (안정적인 라우팅에 권장)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle target도 지원됩니다:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Config write

iMessage는 기본적으로 channel initiated config write를 허용합니다(`commands.config: true`일 때 `/config set|unset`용).

비활성화:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## 문제 해결

<AccordionGroup>
  <Accordion title="imsg를 찾을 수 없거나 RPC가 지원되지 않음">
    바이너리와 RPC 지원을 확인하세요:

```bash
imsg rpc --help
openclaw channels status --probe
```

    probe가 RPC 미지원이라고 보고하면 `imsg`를 업데이트하세요.

  </Accordion>

  <Accordion title="DM이 무시됨">
    확인할 것:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - pairing 승인 (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group 메시지가 무시됨">
    확인할 것:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist 동작
    - mention pattern 구성 (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="원격 첨부 파일 실패">
    확인할 것:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gateway host에서의 SSH/SCP key auth
    - gateway host의 `~/.ssh/known_hosts`에 host key가 존재하는지
    - Messages를 실행하는 Mac에서 원격 경로를 읽을 수 있는지

  </Accordion>

  <Accordion title="macOS 권한 프롬프트를 놓침">
    같은 사용자/세션 컨텍스트의 대화형 GUI 터미널에서 다시 실행하고 프롬프트를 승인하세요:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에 Full Disk Access + Automation이 부여되었는지 확인하세요.

  </Accordion>
</AccordionGroup>

## Configuration reference 포인터

- [Configuration reference - iMessage](/gateway/configuration-reference#imessage)
- [Gateway configuration](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
