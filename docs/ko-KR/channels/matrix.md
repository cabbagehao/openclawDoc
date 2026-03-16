---
summary: "Matrix 지원 상태, 기능, 구성 방법"
read_when:
  - Matrix 채널 기능을 작업할 때
title: "Matrix"
description: "Matrix plugin 설치, 계정 로그인, E2EE, multi-account, DM·room 접근 제어와 troubleshooting 절차를 설명합니다."
x-i18n:
  source_path: "channels/matrix.md"
---

# Matrix (plugin)

Matrix는 개방형 분산 메시징 프로토콜입니다. OpenClaw는 어떤 homeserver에서든
Matrix **user**로 연결되므로, bot용 Matrix account가 필요합니다. 로그인 후에는
bot에게 DM을 보내거나 room(Matrix의 "group")에 초대할 수 있습니다. Beeper도
유효한 client 옵션이지만 E2EE가 켜져 있어야 합니다.

상태: plugin(`@vector-im/matrix-bot-sdk`)으로 지원됩니다. direct messages,
rooms, threads, media, reactions, polls(send + poll-start as text), location,
E2EE(crypto support 포함)를 지원합니다.

## Plugin 필요

Matrix는 plugin으로 제공되며 core install에 번들되어 있지 않습니다.

CLI 설치(npm registry):

```bash
openclaw plugins install @openclaw/matrix
```

로컬 checkout:

```bash
openclaw plugins install ./extensions/matrix
```

configure/onboarding 중 Matrix를 선택했고 git checkout이 감지되면,
OpenClaw는 로컬 install path를 자동으로 제안합니다.

자세한 내용: [Plugins](/tools/plugin)

## 설정

1. Matrix plugin을 설치합니다.
   - npm: `openclaw plugins install @openclaw/matrix`
   - 로컬 checkout: `openclaw plugins install ./extensions/matrix`
2. homeserver에 Matrix account를 만듭니다.
   - 호스팅 옵션: [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/)
   - 또는 직접 운영합니다.
3. bot account용 access token을 얻습니다.
   - home server에서 Matrix login API를 `curl`로 호출:

   ```bash
   curl --request POST \
     --url https://matrix.example.org/_matrix/client/v3/login \
     --header 'Content-Type: application/json' \
     --data '{
     "type": "m.login.password",
     "identifier": {
       "type": "m.id.user",
       "user": "your-user-name"
     },
     "password": "your-password"
   }'
   ```

   - `matrix.example.org`는 자신의 homeserver URL로 바꾸세요.
   - 또는 `channels.matrix.userId` + `channels.matrix.password`를 설정하세요.
     OpenClaw는 같은 login endpoint를 호출하고 access token을
     `~/.openclaw/credentials/matrix/credentials.json`에 저장한 뒤 다음 시작에
     재사용합니다.

4. credential을 설정합니다.
   - Env: `MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN`
     (또는 `MATRIX_USER_ID` + `MATRIX_PASSWORD`)
   - 또는 config: `channels.matrix.*`
   - 둘 다 설정되면 config가 우선합니다.
   - access token 사용 시 user ID는 `/whoami`로 자동 조회됩니다.
   - `channels.matrix.userId`를 직접 넣는다면 전체 Matrix ID여야 합니다
     (예: `@bot:example.org`).
5. gateway를 재시작합니다(또는 onboarding을 마칩니다).
6. Matrix client(Element, Beeper 등)에서 bot과 DM을 시작하거나 room에
   초대합니다. Beeper는 E2EE가 필요하므로
   `channels.matrix.encryption: true`를 설정하고 device를 검증하세요.

최소 구성(access token, user ID 자동 조회):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" },
    },
  },
}
```

E2EE 구성(end-to-end encryption 활성화):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

## Encryption (E2EE)

종단간 암호화는 Rust crypto SDK를 통해 **지원**됩니다.

`channels.matrix.encryption: true`로 활성화합니다.

- crypto module이 로드되면 encrypted room이 자동으로 복호화됩니다.
- encrypted room에 보낼 outbound media도 암호화됩니다.
- 첫 연결 시 OpenClaw는 다른 session들에 device verification 요청을 보냅니다.
- key sharing을 활성화하려면 다른 Matrix client(Element 등)에서 device를
  검증하세요.
- crypto module을 로드할 수 없으면 E2EE는 비활성화되고 encrypted room은
  복호화되지 않습니다. OpenClaw는 warning을 기록합니다.
- crypto module 누락 오류(예: `@matrix-org/matrix-sdk-crypto-nodejs-*`)가
  보이면 `@matrix-org/matrix-sdk-crypto-nodejs`의 build script를 허용하고
  `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs`를 실행하거나,
  `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js`로
  바이너리를 가져오세요.

Crypto state는 account + access token별로
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`
아래(SQLite DB)에 저장됩니다. sync state는 그 옆의 `bot-storage.json`에
있습니다. access token(device)이 바뀌면 새 store가 생성되며 encrypted room용
bot 검증도 다시 해야 합니다.

**Device verification:**
E2EE가 활성화되면 bot은 시작 시 다른 session으로 verification request를
보냅니다. Element(또는 다른 client)를 열어 verification request를 승인하면
trust가 설정되고, 이후 encrypted room 메시지를 복호화할 수 있습니다.

## Multi-account

multi-account는 `channels.matrix.accounts`로 구성합니다. 계정별 credential과
선택적 `name`을 둘 수 있습니다. 공통 패턴은
[`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)
를 참고하세요.

각 account는 어떤 homeserver에서든 별도의 Matrix user로 실행됩니다. 계정별
config는 최상위 `channels.matrix` 설정을 상속하며, 필요한 옵션(DM policy,
groups, encryption 등)을 override할 수 있습니다.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          name: "Main assistant",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_***",
          encryption: true,
        },
        alerts: {
          name: "Alerts bot",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_***",
          dm: { policy: "allowlist", allowFrom: ["@admin:example.org"] },
        },
      },
    },
  },
}
```

참고:

- concurrent module import의 race condition을 피하려고 account startup은
  serialize됩니다.
- env var(`MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` 등)는 **default**
  account에만 적용됩니다.
- 기본 채널 설정(DM policy, group policy, mention gating 등)은 account별
  override가 없다면 모든 account에 적용됩니다.
- `bindings[].match.accountId`로 각 account를 서로 다른 agent에 라우팅할 수
  있습니다.
- crypto state는 account + access token별로 따로 저장됩니다.

## Routing model

- reply는 항상 Matrix로 돌아갑니다.
- DM은 agent의 main session을 공유하고, room은 group session에 매핑됩니다.

## 접근 제어(DMs)

- 기본값: `channels.matrix.dm.policy = "pairing"`. 알 수 없는 sender는
  pairing code를 받습니다.
- 승인:
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- 공개 DM: `channels.matrix.dm.policy="open"` +
  `channels.matrix.dm.allowFrom=["*"]`
- `channels.matrix.dm.allowFrom`은 전체 Matrix user ID만 받습니다
  (예: `@user:server`). wizard는 directory search가 단 하나의 정확한 match를
  찾으면 display name을 user ID로 해석합니다.
- display name이나 bare localpart(예: `"Alice"`, `"alice"`)는 사용하지
  마세요. 모호해서 allowlist matching에서 무시됩니다. 전체 `@user:server`
  형식을 쓰세요.

## Rooms (groups)

- 기본값: `channels.matrix.groupPolicy = "allowlist"` (mention-gated).
  설정이 비어 있으면 기본값을 바꾸기 위해 `channels.defaults.groupPolicy`를
  사용할 수 있습니다.
- runtime 참고: `channels.matrix`가 완전히 없으면 room check는
  `channels.defaults.groupPolicy`가 설정되어 있어도 `groupPolicy="allowlist"`로
  fallback합니다.
- room allowlist는 `channels.matrix.groups`로 설정합니다(room ID 또는 alias;
  directory search가 하나의 정확한 match를 찾을 때만 이름을 ID로 해석).

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
      groupAllowFrom: ["@owner:example.org"],
    },
  },
}
```

- `requireMention: false`면 그 room에서 auto-reply가 활성화됩니다.
- `groups."*"`는 room 전반의 mention gating 기본값을 설정할 수 있습니다.
- `groupAllowFrom`은 room에서 bot을 트리거할 수 있는 sender를 제한합니다
  (전체 Matrix user ID).
- room별 `users` allowlist는 특정 room 안의 sender를 추가로 제한할 수 있습니다
  (전체 Matrix user ID 사용).
- configure wizard는 room allowlist(room ID, alias, name)를 묻고, 정확하고
  유일하게 일치하는 경우에만 name을 해석합니다.
- 시작 시 OpenClaw는 allowlist의 room/user name을 ID로 해석하고 mapping을
  로그에 남깁니다. 해석되지 않은 항목은 allowlist matching에서 무시됩니다.
- 초대는 기본적으로 auto-join됩니다. `channels.matrix.autoJoin`과
  `channels.matrix.autoJoinAllowlist`로 제어합니다.
- **어떤 room도 허용하지 않으려면**
  `channels.matrix.groupPolicy: "disabled"`를 사용하세요
  (또는 빈 allowlist 유지).
- 레거시 key: `channels.matrix.rooms` (`groups`와 동일한 형태)

## Threads

- reply threading을 지원합니다.
- `channels.matrix.threadReplies`는 reply가 thread에 남을지 제어합니다.
  - `off`, `inbound`(기본), `always`
- `channels.matrix.replyToMode`는 thread reply가 아닐 때 reply-to metadata를
  제어합니다.
  - `off`(기본), `first`, `all`

## Capabilities

| Feature         | Status                                                                                |
| --------------- | ------------------------------------------------------------------------------------- |
| Direct messages | Supported                                                                             |
| Rooms           | Supported                                                                             |
| Threads         | Supported                                                                             |
| Media           | Supported                                                                             |
| E2EE            | Supported (crypto module required)                                                    |
| Reactions       | Supported (send/read via tools)                                                       |
| Polls           | Send supported; inbound poll starts are converted to text (responses/ends ignored)    |
| Location        | Supported (geo URI; altitude ignored)                                                 |
| Native commands | Supported                                                                             |

## 문제 해결

먼저 이 순서를 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그다음 필요하면 DM pairing 상태를 확인합니다.

```bash
openclaw pairing list matrix
```

흔한 문제:

- 로그인은 됐지만 room message를 무시함: `groupPolicy` 또는 room allowlist에
  막혀 있음
- DM을 무시함: `channels.matrix.dm.policy="pairing"` 상태에서 sender 승인 대기
- encrypted room이 실패함: crypto support 또는 encryption setting 불일치

장애 진단 흐름: [/channels/troubleshooting](/channels/troubleshooting)

## Configuration reference (Matrix)

전체 구성: [Configuration](/gateway/configuration)

Provider option:

- `channels.matrix.enabled`: 채널 시작 활성화/비활성화
- `channels.matrix.homeserver`: homeserver URL
- `channels.matrix.userId`: Matrix user ID(access token이 있으면 선택)
- `channels.matrix.accessToken`: access token
- `channels.matrix.password`: login password(token 저장됨)
- `channels.matrix.deviceName`: device display name
- `channels.matrix.encryption`: E2EE 활성화(기본값 false)
- `channels.matrix.initialSyncLimit`: initial sync limit
- `channels.matrix.threadReplies`: `off | inbound | always` (기본값 inbound)
- `channels.matrix.textChunkLimit`: outbound text chunk size(chars)
- `channels.matrix.chunkMode`: `length`(기본) 또는 `newline`
- `channels.matrix.dm.policy`: `pairing | allowlist | open | disabled` (기본 pairing)
- `channels.matrix.dm.allowFrom`: DM allowlist(전체 Matrix user IDs).
  `open`에는 `"*"` 필요. wizard는 가능할 때 name을 ID로 해석합니다.
- `channels.matrix.groupPolicy`: `allowlist | open | disabled` (기본 allowlist)
- `channels.matrix.groupAllowFrom`: group message용 allowlisted sender(전체 Matrix IDs)
- `channels.matrix.allowlistOnly`: DM + room에 allowlist 규칙 강제
- `channels.matrix.groups`: group allowlist + room별 설정 map
- `channels.matrix.rooms`: 레거시 group allowlist/config
- `channels.matrix.replyToMode`: thread/tag용 reply-to mode
- `channels.matrix.mediaMaxMb`: inbound/outbound media cap(MB)
- `channels.matrix.autoJoin`: invite handling
  (`always | allowlist | off`, 기본 always)
- `channels.matrix.autoJoinAllowlist`: auto-join 허용 room ID/alias
- `channels.matrix.accounts`: account ID별 multi-account 구성
  (각 account는 top-level setting 상속)
- `channels.matrix.actions`: action별 tool gating
  (reactions/messages/pins/memberInfo/channelInfo)
