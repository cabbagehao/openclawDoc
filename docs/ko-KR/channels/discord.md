---
summary: "Discord 봇 지원 상태, 기능, 구성"
read_when:
  - Discord 채널 기능을 작업할 때
title: "Discord"
---

# Discord (Bot API)

상태: 공식 Discord gateway를 통해 DM과 guild 채널에서 사용할 준비가 되어 있습니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    Discord DM의 기본값은 페어링 모드입니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/tools/slash-commands">
    네이티브 명령 동작과 명령 카탈로그.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 흐름.
  </Card>
</CardGroup>

## 빠른 설정

새 애플리케이션과 봇을 만들고, 봇을 서버에 추가한 다음, OpenClaw와 페어링해야 합니다. 봇은 본인만 사용하는 비공개 서버에 추가하는 것을 권장합니다. 아직 서버가 없다면 먼저 [만드세요](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** 선택).

<Steps>
  <Step title="Discord 애플리케이션과 봇 만들기">
    [Discord Developer Portal](https://discord.com/developers/applications)로 이동해 **New Application**을 클릭하세요. 이름은 "OpenClaw" 같은 것으로 정하면 됩니다.

    사이드바에서 **Bot**을 클릭하세요. **Username**은 OpenClaw 에이전트를 부르는 이름으로 설정하세요.

  </Step>

  <Step title="권한이 필요한 intent 활성화">
    계속해서 **Bot** 페이지에서 아래로 스크롤해 **Privileged Gateway Intents**를 찾아 다음을 활성화하세요.

    - **Message Content Intent** (필수)
    - **Server Members Intent** (권장, role allowlist와 이름-대-ID 매칭에 필요)
    - **Presence Intent** (선택 사항, presence 업데이트가 필요할 때만)

  </Step>

  <Step title="봇 토큰 복사">
    다시 **Bot** 페이지 위쪽으로 올라가 **Reset Token**을 클릭하세요.

    <Note>
    이름과 달리, 이것은 첫 번째 토큰을 생성하는 것입니다. 실제로 "reset"되는 것은 없습니다.
    </Note>

    토큰을 복사해서 어딘가에 저장하세요. 이것이 **Bot Token**이며, 곧 필요합니다.

  </Step>

  <Step title="초대 URL을 생성하고 서버에 봇 추가">
    사이드바에서 **OAuth2**를 클릭하세요. 서버에 봇을 추가할 수 있도록 적절한 권한이 포함된 초대 URL을 생성합니다.

    아래로 스크롤해 **OAuth2 URL Generator**에서 다음을 활성화하세요.

    - `bot`
    - `applications.commands`

    아래에 **Bot Permissions** 섹션이 나타납니다. 다음을 활성화하세요.

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (선택 사항)

    아래쪽에 생성된 URL을 복사해 브라우저에 붙여 넣고, 서버를 선택한 뒤 **Continue**를 클릭해 연결하세요. 이제 Discord 서버에서 봇이 보여야 합니다.

  </Step>

  <Step title="Developer Mode를 켜고 ID 수집">
    Discord 앱으로 돌아가 내부 ID를 복사할 수 있도록 Developer Mode를 활성화해야 합니다.

    1. **User Settings**(아바타 옆 톱니바퀴 아이콘) → **Advanced** → **Developer Mode**를 켭니다
    2. 사이드바에서 **server icon**을 우클릭 → **Copy Server ID**
    3. 자신의 **avatar**를 우클릭 → **Copy User ID**

    **Server ID**와 **User ID**를 Bot Token과 함께 저장하세요. 다음 단계에서 OpenClaw에 이 세 가지를 모두 보내게 됩니다.

  </Step>

  <Step title="서버 멤버의 DM 허용">
    페어링이 작동하려면 Discord가 봇이 나에게 DM을 보낼 수 있도록 허용해야 합니다. **server icon**을 우클릭 → **Privacy Settings** → **Direct Messages**를 켜세요.

    이렇게 하면 서버 멤버(봇 포함)가 나에게 DM을 보낼 수 있습니다. OpenClaw와 Discord DM을 사용하려면 이 설정을 켜 두세요. guild 채널만 사용할 계획이라면 페어링 후에는 DM을 꺼도 됩니다.

  </Step>

  <Step title="0단계: 봇 토큰을 안전하게 설정하세요(채팅으로 보내지 마세요)">
    Discord 봇 토큰은 비밀 정보입니다(비밀번호와 비슷합니다). 에이전트에게 메시지를 보내기 전에 OpenClaw를 실행하는 머신에 설정하세요.

```bash
openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
openclaw config set channels.discord.enabled true --json
openclaw gateway
```

    OpenClaw가 이미 백그라운드 서비스로 실행 중이라면 대신 `openclaw gateway restart`를 사용하세요.

  </Step>

  <Step title="OpenClaw를 설정하고 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 대화하며 이렇게 요청하세요. Discord가 첫 번째 채널이라면 CLI / config 탭을 사용하세요.

        > "이미 Discord bot token을 config에 설정했습니다. User ID `<user_id>`와 Server ID `<server_id>`로 Discord 설정을 마무리해 주세요."
      </Tab>
      <Tab title="CLI / config">
        파일 기반 config를 선호한다면 다음을 설정하세요.

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

        기본 계정용 env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        `channels.discord.token`에는 SecretRef 값도 지원됩니다(env/file/exec provider). 자세한 내용은 [Secrets Management](/gateway/secrets)를 참고하세요.

      </Tab>
    </Tabs>

  </Step>

  <Step title="첫 DM 페어링 승인">
    gateway가 실행될 때까지 기다린 다음 Discord에서 봇에게 DM을 보내세요. 봇이 페어링 코드로 응답합니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널에서 에이전트에게 페어링 코드를 보내세요.

        > "이 Discord pairing code를 승인해 주세요: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    페어링 코드는 1시간 후 만료됩니다.

    이제 Discord에서 DM으로 에이전트와 대화할 수 있어야 합니다.

  </Step>
</Steps>

<Note>
토큰 해석은 계정을 인식합니다. config의 토큰 값이 env fallback보다 우선합니다. `DISCORD_BOT_TOKEN`은 기본 계정에만 사용됩니다.
</Note>

## 권장: guild 워크스페이스 설정

DM이 작동하기 시작하면 Discord 서버를 전체 워크스페이스로 설정할 수 있습니다. 그러면 각 채널이 자체 컨텍스트를 가진 별도 에이전트 세션을 갖게 됩니다. 본인과 봇만 있는 비공개 서버라면 이 방식을 권장합니다.

<Steps>
  <Step title="서버를 guild allowlist에 추가">
    이렇게 하면 에이전트가 DM뿐 아니라 서버의 모든 채널에서 응답할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 Discord Server ID `<server_id>`를 guild allowlist에 추가해 주세요"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@mention 없이 응답 허용">
    기본적으로 에이전트는 guild 채널에서 @mention이 있을 때만 응답합니다. 비공개 서버라면 아마 모든 메시지에 응답하도록 설정하고 싶을 것입니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "이 서버에서는 @mentioned되지 않아도 에이전트가 응답하도록 허용해 주세요"
      </Tab>
      <Tab title="Config">
        guild config에서 `requireMention: false`로 설정하세요.

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="guild 채널에서 memory 사용 계획 세우기">
    기본적으로 장기 메모리(`MEMORY.md`)는 DM 세션에서만 로드됩니다. guild 채널은 `MEMORY.md`를 자동으로 로드하지 않습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "Discord 채널에서 질문할 때 `MEMORY.md`의 장기 컨텍스트가 필요하면 memory_search나 memory_get을 사용해 주세요."
      </Tab>
      <Tab title="수동">
        모든 채널에서 공유되는 컨텍스트가 필요하다면 안정적인 지침은 `AGENTS.md`나 `USER.md`에 넣으세요(모든 세션에 주입됩니다). 장기 메모는 `MEMORY.md`에 두고, 필요할 때 memory 도구로 접근하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 Discord 서버에 채널 몇 개를 만들고 대화를 시작하세요. 에이전트는 채널 이름을 볼 수 있고, 각 채널은 자체적으로 격리된 세션을 갖습니다. 그래서 `#coding`, `#home`, `#research` 같은 식으로 워크플로에 맞게 구성할 수 있습니다.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 응답 라우팅은 결정적입니다. Discord에서 들어온 메시지에 대한 응답은 다시 Discord로 돌아갑니다.
- 기본값(`session.dmScope=main`)에서는 직접 채팅이 에이전트의 메인 세션(`agent:main:main`)을 공유합니다.
- Guild 채널은 격리된 세션 키(`agent:<agentId>:discord:channel:<channelId>`)를 사용합니다.
- Group DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
