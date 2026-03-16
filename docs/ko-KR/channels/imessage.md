---
summary: "레거시 imsg 기반 iMessage 지원 상태, 설정, 운영 모델 요약"
description: "OpenClaw에서 레거시 imsg 기반 iMessage 채널을 설정하는 방법, macOS 권한 요구 사항, 원격 Mac 연결, 첨부 파일 처리 구성을 안내합니다."
read_when:
  - iMessage 지원을 설정할 때
  - iMessage 송수신 문제를 디버깅할 때
title: "iMessage"
x-i18n:
  source_path: "channels/imessage.md"
---

# iMessage (레거시: imsg)

<Warning>
새로운 iMessage 배포에는 <a href="/channels/bluebubbles">BlueBubbles</a>를 사용하세요.

`imsg` 통합은 레거시이며 향후 릴리스에서 제거될 수 있습니다.
</Warning>

상태: 레거시 외부 CLI 통합입니다. Gateway가 `imsg rpc`를 실행하고 stdio 위에서 JSON-RPC로 통신합니다. 별도 daemon이나 port는 필요하지 않습니다.

<CardGroup cols={3}>
  <Card title="BlueBubbles (권장)" icon="message-circle" href="/channels/bluebubbles">
    새 환경에서 권장되는 iMessage 경로입니다.
  </Card>
  <Card title="페어링" icon="link" href="/channels/pairing">
    iMessage DM은 기본적으로 pairing 모드를 사용합니다.
  </Card>
  <Card title="설정 레퍼런스" icon="settings" href="/gateway/configuration-reference#imessage">
    iMessage 전체 필드 레퍼런스입니다.
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

      <Step title="OpenClaw 설정">

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

      <Step title="gateway 시작">

```bash
openclaw gateway
```

      </Step>

      <Step title="첫 DM pairing 승인 (기본 dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Pairing 요청은 1시간 후 만료됩니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH를 통한 원격 Mac">
    OpenClaw는 stdio와 호환되는 `cliPath`만 필요하므로, SSH로 원격 Mac에 접속해 `imsg`를 실행하는 wrapper script를 `cliPath`로 지정할 수 있습니다.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    첨부 파일을 사용할 때 권장되는 설정:

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

    `remoteHost`를 지정하지 않으면 OpenClaw가 SSH wrapper script를 파싱해 자동 감지를 시도합니다.
    `remoteHost`는 `host` 또는 `user@host` 형식이어야 하며 공백이나 SSH option은 허용되지 않습니다.
    OpenClaw는 SCP에 strict host-key checking을 사용하므로, relay host key가 `~/.ssh/known_hosts`에 이미 등록되어 있어야 합니다.
    첨부 파일 경로는 허용된 root(`attachmentRoots` / `remoteAttachmentRoots`) 안에 있어야 합니다.

  </Tab>
</Tabs>

## 요구 사항과 권한 (macOS)

- `imsg`를 실행하는 Mac에서 Messages에 로그인되어 있어야 합니다.
- OpenClaw/`imsg`가 실행되는 프로세스 컨텍스트에는 Full Disk Access가 필요합니다. (Messages DB 접근)
- Messages.app을 통해 메시지를 보내려면 Automation 권한이 필요합니다.

<Tip>
권한은 프로세스 컨텍스트 단위로 부여됩니다. gateway가 headless(LaunchAgent/SSH)로 실행된다면, 같은 컨텍스트에서 아래 명령을 한 번 대화형으로 실행해 권한 프롬프트를 띄우세요.

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 접근 제어와 라우팅

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy`는 direct message 접근을 제어합니다.

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`allowFrom`에 `"*"`가 있어야 함)
    - `disabled`

    Allowlist 필드: `channels.imessage.allowFrom`

    Allowlist 엔트리는 handle 또는 chat target(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)이 될 수 있습니다.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy`는 그룹 처리 방식을 제어합니다.

    - `allowlist` (설정 시 기본값)
    - `open`
    - `disabled`

    그룹 발신자 allowlist: `channels.imessage.groupAllowFrom`

    런타임 폴백: `groupAllowFrom`이 비어 있으면, iMessage 그룹 발신자 검사는 가능한 경우 `allowFrom`을 폴백으로 사용합니다.
    런타임 참고: `channels.imessage` 블록이 완전히 없으면, `channels.defaults.groupPolicy`가 설정되어 있어도 런타임은 `groupPolicy="allowlist"`로 폴백하고 경고 로그를 남깁니다.

    그룹의 mention gating:

    - iMessage는 native mention metadata를 제공하지 않음
    - mention 감지는 regex 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)으로 처리
    - 패턴이 없으면 mention gating을 강제할 수 없음

    권한이 있는 발신자의 control command는 그룹에서 mention gating을 우회할 수 있습니다.

  </Tab>

  <Tab title="세션과 deterministic replies">
    - DM은 direct routing, 그룹은 group routing을 사용합니다.
    - 기본 `session.dmScope=main`에서는 iMessage DM이 agent main session으로 합쳐집니다.
    - 그룹 세션은 분리됩니다. (`agent:<agentId>:imessage:group:<chat_id>`)
    - 답장은 원본 channel/target metadata를 사용해 다시 iMessage로 라우팅됩니다.

    그룹에 가까운 thread 동작:

    일부 다자간 iMessage thread는 `is_group=false`로 들어올 수 있습니다.
    그 `chat_id`가 `channels.imessage.groups` 아래에 명시적으로 설정되어 있으면, OpenClaw는 이를 group traffic으로 취급합니다. (group gating + group session isolation)

  </Tab>
</Tabs>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 bot macOS 사용자 (분리된 iMessage identity)">
    bot 트래픽을 개인 Messages 프로필과 분리하려면, 전용 Apple ID와 macOS 사용자를 두는 것이 좋습니다.

    일반적인 흐름:

    1. 전용 macOS 사용자를 생성하고 로그인
    2. 해당 사용자에서 bot Apple ID로 Messages 로그인
    3. 해당 사용자 컨텍스트에 `imsg` 설치
    4. OpenClaw가 그 사용자 컨텍스트에서 `imsg`를 실행할 수 있도록 SSH wrapper 생성
    5. `channels.imessage.accounts.<id>.cliPath`와 `.dbPath`를 그 사용자 프로필로 지정

    첫 실행에서는 해당 bot 사용자 세션에서 GUI 권한 승인(Automation + Full Disk Access)이 필요할 수 있습니다.

  </Accordion>

  <Accordion title="Tailscale을 통한 원격 Mac (예시)">
    흔한 구성:

    - gateway는 Linux/VM에서 실행
    - iMessage + `imsg`는 tailnet 안의 Mac에서 실행
    - `cliPath` wrapper가 SSH로 `imsg`를 실행
    - `remoteHost`가 SCP 첨부 파일 가져오기를 활성화

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
    먼저 `ssh bot@mac-mini.tailnet-1234.ts.net`처럼 접속해 host key를 신뢰시켜 `known_hosts`를 채워 두는 것이 좋습니다.

  </Accordion>

  <Accordion title="멀티 계정 패턴">
    iMessage는 `channels.imessage.accounts` 아래의 per-account 설정을 지원합니다.

    각 계정은 `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, history 설정, attachment root allowlist 같은 필드를 개별적으로 override할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 미디어, 청킹, 전달 대상

<AccordionGroup>
  <Accordion title="첨부 파일과 미디어">
    - inbound attachment 수집은 선택 사항: `channels.imessage.includeAttachments`
    - `remoteHost`가 설정되면 원격 첨부 파일 경로를 SCP로 가져올 수 있음
    - 첨부 파일 경로는 허용된 root와 일치해야 함:
      - `channels.imessage.attachmentRoots` (로컬)
      - `channels.imessage.remoteAttachmentRoots` (원격 SCP 모드)
      - 기본 root 패턴: `/Users/*/Library/Messages/Attachments`
    - SCP는 strict host-key checking(`StrictHostKeyChecking=yes`)을 사용
    - outbound media 크기는 `channels.imessage.mediaMaxMb`를 사용 (기본 16 MB)
  </Accordion>

  <Accordion title="Outbound chunking">
    - text chunk limit: `channels.imessage.textChunkLimit` (기본 4000)
    - chunk mode: `channels.imessage.chunkMode`
      - `length` (기본값)
      - `newline` (문단 우선 분할)
  </Accordion>

  <Accordion title="주소 지정 형식">
    권장되는 명시적 target:

    - `chat_id:123` (안정적인 라우팅에 권장)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle target도 지원됩니다.

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 설정 쓰기

iMessage는 기본적으로 채널에서 시작된 config write를 허용합니다. (`commands.config: true`일 때 `/config set|unset`)

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
  <Accordion title="imsg를 찾을 수 없거나 RPC를 지원하지 않음">
    바이너리와 RPC 지원 여부를 확인하세요.

```bash
imsg rpc --help
openclaw channels status --probe
```

    probe가 RPC unsupported를 보고하면 `imsg`를 업데이트하세요.

  </Accordion>

  <Accordion title="DM이 무시됨">
    다음 항목을 확인하세요.

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - pairing 승인 상태 (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="그룹 메시지가 무시됨">
    다음 항목을 확인하세요.

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist 동작
    - mention pattern 설정 (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="원격 첨부 파일 가져오기가 실패함">
    다음 항목을 확인하세요.

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gateway host에서의 SSH/SCP key auth
    - gateway host의 `~/.ssh/known_hosts`에 host key가 있는지
    - Messages가 실행 중인 Mac에서 원격 경로를 읽을 수 있는지

  </Accordion>

  <Accordion title="macOS 권한 프롬프트를 놓침">
    같은 사용자/세션 컨텍스트의 대화형 GUI terminal에서 다시 실행하고 프롬프트를 승인하세요.

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에 Full Disk Access와 Automation이 모두 부여되었는지 확인하세요.

  </Accordion>
</AccordionGroup>

## 설정 레퍼런스 포인터

- [Configuration reference - iMessage](/gateway/configuration-reference#imessage)
- [Gateway configuration](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
