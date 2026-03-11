---
summary: "Discord 봇 지원 상태, 주요 기능 및 세부 설정 가이드"
read_when:
  - Discord 채널 연동 및 기능을 구현할 때
title: "Discord"
x-i18n:
  source_path: "channels/discord.md"
---

# Discord (Bot API)

**상태**: 공식 Discord Gateway를 통해 개인 대화(DM) 및 서버(길드) 채널 연동 준비 완료.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    Discord DM은 기본적으로 페어링 모드로 작동함.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/tools/slash-commands">
    네이티브 명령어 동작 방식 및 카탈로그 안내.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 프로세스.
  </Card>
</CardGroup>

## 빠른 설정 가이드

새로운 Discord 애플리케이션과 봇을 생성하고, 이를 서버에 추가한 뒤 OpenClaw와 페어링해야 함. 본인만 사용하는 비공개 서버를 먼저 생성할 것을 권장함 ([서버 생성 방법](https://support.discord.com/hc/ko/articles/204849977) 참조).

<Steps>
  <Step title="Discord 애플리케이션 및 봇 생성">
    [Discord Developer Portal](https://discord.com/developers/applications)에 접속하여 **New Application**을 클릭함. 이름은 "OpenClaw" 등으로 지정함. 사이드바의 **Bot** 메뉴에서 에이전트의 이름을 설정함.
  </Step>

  <Step title="권한 인텐트(Intents) 활성화">
    **Bot** 페이지 하단의 **Privileged Gateway Intents** 섹션에서 다음 항목을 활성화함:
    - **Message Content Intent** (필수)
    - **Server Members Intent** (권장: 역할 기반 허용 목록 및 이름 해석에 필요)
    - **Presence Intent** (선택: 상태 업데이트 정보가 필요한 경우에만)
  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지 상단의 **Reset Token**을 클릭하여 토큰을 생성하고 복사함. (처음 생성 시에도 이 버튼을 사용함) 이 토큰은 외부로 유출되지 않도록 안전하게 보관해야 함.
  </Step>

  <Step title="초대 URL 생성 및 서버 추가">
    사이드바의 **OAuth2** 메뉴에서 **URL Generator**를 선택함.
    - **Scopes**: `bot`, `applications.commands` 선택.
    - **Bot Permissions**: 다음 권한들을 선택함.
      - View Channels, Send Messages, Read Message History, Embed Links, Attach Files, Add Reactions (선택).
    생성된 URL을 브라우저에 붙여넣고 본인의 서버를 선택하여 봇을 초대함.
  </Step>

  <Step title="개발자 모드 활성화 및 ID 수집">
    Discord 앱 설정 → **고급** → **개발자 모드**를 활성화함. 이후 다음 ID들을 복사함:
    1. 서버 아이콘 우클릭 → **서버 ID 복사**
    2. 본인 아바타 우클릭 → **사용자 ID 복사**
  </Step>

  <Step title="서버 멤버의 DM 허용 설정">
    페어링을 위해 봇이 사용자에게 DM을 보낼 수 있어야 함. **서버 설정** → **개인정보 보호 설정** → **서버 멤버가 보내는 개인 메시지 허용**을 활성화함. 페어링 완료 후에는 이 기능을 꺼도 무방함.
  </Step>

  <Step title="봇 토큰 설정 (보안 주의)">
    토큰은 민감한 정보이므로 채팅창이 아닌 CLI를 통해 직접 설정함:
    ```bash
    openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
    openclaw config set channels.discord.enabled true --json
    openclaw gateway restart
    ```
  </Step>

  <Step title="OpenClaw 설정 및 페어링">
    <Tabs>
      <Tab title="에이전트에게 요청">
        기존에 연결된 채널(예: Telegram)이 있다면 에이전트에게 직접 요청함:
        > "Discord 봇 토큰 설정을 마쳤어. 사용자 ID `<user_id>`와 서버 ID `<server_id>` 정보를 바탕으로 설정을 마무리해줘."
      </Tab>
      <Tab title="수동 설정">
        `openclaw.json` 파일에 직접 입력:
        ```json5
        {
          channels: {
            discord: { enabled: true, token: "YOUR_BOT_TOKEN" }
          }
        }
        ```
        환경 변수 폴백 지원: `DISCORD_BOT_TOKEN=...`
      </Tab>
    </Tabs>
  </Step>

  <Step title="첫 DM 페어링 승인">
    Gateway 실행 중 Discord에서 봇에게 메시지를 보내면 페어링 코드를 받게 됨.
    - **에이전트에게 요청**: "Discord 페어링 코드 `<CODE>`를 승인해줘."
    - **CLI 사용**:
      ```bash
      openclaw pairing list discord
      openclaw pairing approve discord <CODE>
      ```
    코드는 1시간 동안 유효함.
  </Step>
</Steps>

## 권장 사항: 서버 워크스페이스 구축

각 채널별로 독립된 세션과 컨텍스트를 가진 풀 워크스페이스 환경을 구축할 수 있음.

<Steps>
  <Step title="서버 허용 목록 추가">
    특정 서버(길드)의 모든 채널에서 에이전트가 활동할 수 있게 함:
    ```json5
    {
      channels: {
        discord: {
          groupPolicy: "allowlist",
          guilds: {
            "YOUR_SERVER_ID": { requireMention: true, users: ["YOUR_USER_ID"] }
          }
        }
      }
    }
    ```
  </Step>
  <Step title="멘션 없이 응답 허용">
    비공개 서버라면 모든 메시지에 응답하도록 설정 가능:
    ```json5
    {
      channels: {
        discord: {
          guilds: { "YOUR_SERVER_ID": { requireMention: false } }
        }
      }
    }
    ```
  </Step>
  <Step title="기억(Memory) 활용">
    기본적으로 `MEMORY.md`는 DM 세션에서만 자동 로드됨. 서버 채널에서는 에이전트가 필요할 때 `memory_search` 도구를 사용하도록 지시하거나, 공통 지침을 `AGENTS.md`에 포함시킴.
  </Step>
</Steps>

## 런타임 모델

- **연결 관리**: Gateway가 Discord 연결을 전담함.
- **라우팅**: 결정론적 라우팅 적용 (Discord 유입 → Discord 응답).
- **세션 구분**: DM은 메인 세션을 공유하며, 서버 채널은 채널별 고유 세션 키를 가짐.
- **슬래시 명령어**: 네이티브 슬래시 명령어는 별도의 격리된 세션에서 실행되어 메인 대화 흐름을 방해하지 않음.

## 포럼(Forum) 채널 지원

- **자동 스레드 생성**: 포럼 상위 채널(`channel:<forumId>`)에 메시지를 보내면 첫 줄을 제목으로 하는 스레드가 자동 생성됨.
- **직접 생성**: `openclaw message thread create` 명령어로 제목을 지정하여 생성 가능.

## 대화형 컴포넌트 (Interactive Components)

에이전트 응답에 버튼, 선택 메뉴, 모달 폼 등을 포함할 수 있음 (Components v2 지원).

- **지원 블록**: `text`, `actions` (버튼 최대 5개), `select`, `file`, `media-gallery` 등.
- **재사용성**: `reusable: true` 설정 시 만료 전까지 여러 번 클릭 가능.
- **권한 제어**: `allowedUsers` 필드를 통해 특정 사용자만 버튼을 누를 수 있도록 제한 가능.
- **모달(Modal)**: 최대 5개의 입력 필드를 가진 팝업 폼 구성 가능.

## 접근 제어 및 정책 (Access Control)

- **DM 정책**: `dmPolicy` 설정을 통해 `pairing` (기본값), `allowlist`, `open`, `disabled` 중 선택.
- **서버 정책**: `groupPolicy`를 통해 허용 목록(`allowlist`) 기반으로 운영함.
  - 서버 ID 기반 매칭을 권장하며, 역할(Role) 기반의 세밀한 접근 제어도 지원함.
  - `requireMention`: 멘션 시에만 응답할지 여부.
  - `ignoreOtherMentions`: 다른 사용자나 역할을 멘션한 메시지는 무시함.

## 네이티브 슬래시 명령어

- `commands.native: "auto"` 설정 시 Discord 앱 내에서 `/` 입력으로 OpenClaw 명령어를 직접 호출 가능.
- 인증 정책은 일반 메시지 허용 목록과 동일하게 적용됨.
- 명령어 실행 결과는 기본적으로 발신자에게만 보이는 **에페머럴(비공개)** 모드로 전송됨.

## 심화 기능 상세

<AccordionGroup>
  <Accordion title="답장 태그 및 네이티브 답장">
    `replyToMode` 설정을 통해 Discord의 네이티브 답장 기능을 제어함 (`off`, `first`, `all`). 에이전트 출력에 `[[reply_to:<id>]]` 태그를 사용하여 특정 메시지를 지정할 수 있음.
  </Accordion>
  <Accordion title="실시간 스트리밍 미리보기">
    `streaming` 옵션(`partial`, `block`)을 통해 에이전트가 답변을 작성하는 동안 메시지를 실시간으로 업데이트하여 보여줌. 블록 스트리밍이 켜져 있는 경우 중복 전송 방지를 위해 미리보기는 자동으로 건너뜀.
  </Accordion>
  <Accordion title="스레드 기반 세션 고정">
    `/focus <target>` 명령어를 사용하여 특정 스레드를 특정 에이전트나 하위 세션에 고정할 수 있음. 이는 하위 에이전트(`sessions_spawn`) 업무 처리에 매우 유용함.
  </Accordion>
  <Accordion title="명령어 실행 승인 (Discord UI)">
    DM 또는 채널에 버튼 형식의 승인 요청 메시지를 전송함. 승인 권한이 있는 사용자만 버튼을 조작할 수 있음. 상세 내용은 [실행 승인 가이드](/tools/exec-approvals) 참조.
  </Accordion>
</AccordionGroup>

## 음성 채널 (Voice Channels)

- **실시간 대화**: Discord 음성 채널에 참여하여 음성으로 대화 가능.
- **요구 사항**: 네이티브 명령어 활성화 및 `channels.discord.voice` 설정 필요.
- **음성 메시지**: `asVoice: true` 옵션과 함께 오디오 파일을 전송하면 파형이 포함된 음성 메시지 형식으로 발송됨.

## 문제 해결 (Troubleshooting)

- **메시지 미수신**: 개발자 포털에서 **Message Content Intent** 활성화 여부를 확인하고 Gateway를 재시작함.
- **멘션 무응답**: `requireMention` 설정과 `mentionPatterns` 정의가 올바른지 확인함.
- **응답 지연**: `eventQueue.listenerTimeout` 설정을 늘려 긴 작업 시간을 확보함.
- **음성 오류**: 복호화 실패(`DecryptionFailed`) 발생 시 `openclaw update`를 통해 최신 복구 로직을 적용함.

상세한 설정 스키마 및 옵션은 [Gateway 설정 레퍼런스](/gateway/configuration-reference#discord)를 참조함.
