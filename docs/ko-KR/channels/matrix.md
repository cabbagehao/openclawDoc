---
summary: "Matrix 지원 상태, 기능, 설정"
read_when:
  - Matrix 채널 기능을 작업할 때
title: "Matrix"
---

# Matrix (plugin)

Matrix는 개방형 분산 메시징 프로토콜입니다. OpenClaw는 어떤 homeserver에서든 Matrix **user**로 연결되므로, 봇용 Matrix 계정이 필요합니다. 로그인되면 봇과 직접 DM을 하거나 room(Matrix의 "groups")에 초대할 수 있습니다. Beeper도 유효한 클라이언트 옵션이지만, E2EE가 활성화되어 있어야 합니다.

상태: plugin(@vector-im/matrix-bot-sdk)을 통해 지원됩니다. Direct message, room, thread, media, reaction, poll(send + poll-start as text), location, E2EE(crypto 지원 포함)를 지원합니다.

## Plugin 필요

Matrix는 plugin으로 제공되며 core 설치에 번들되지 않습니다.

npm registry를 통한 CLI 설치:

```bash
openclaw plugins install @openclaw/matrix
```

로컬 checkout(git repo에서 실행 중인 경우):

```bash
openclaw plugins install ./extensions/matrix
```

configure/onboarding 중 Matrix를 선택했고 git checkout이 감지되면, OpenClaw는 자동으로 로컬 설치 경로를 제안합니다.

자세한 내용: [Plugins](/tools/plugin)

## 설정

1. Matrix plugin을 설치합니다.
   - npm에서: `openclaw plugins install @openclaw/matrix`
   - 로컬 checkout에서: `openclaw plugins install ./extensions/matrix`
2. homeserver에 Matrix 계정을 만듭니다.
   - 호스팅 옵션은 [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/)에서 확인
   - 또는 직접 호스팅
3. 봇 계정용 access token을 가져옵니다.
   - homeserver에서 Matrix login API를 `curl`로 사용합니다.

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

   - `matrix.example.org`를 homeserver URL로 바꾸세요.
   - 또는 `channels.matrix.userId` + `channels.matrix.password`를 설정하세요. OpenClaw는 같은 login endpoint를 호출하고 access token을 `~/.openclaw/credentials/matrix/credentials.json`에 저장한 뒤 다음 시작 시 재사용합니다.

4. 자격 증명을 설정합니다.
   - Env: `MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` (또는 `MATRIX_USER_ID` + `MATRIX_PASSWORD`)
   - 또는 config: `channels.matrix.*`
   - 둘 다 설정되어 있으면 config가 우선합니다.
   - access token을 사용하는 경우 user ID는 `/whoami`를 통해 자동으로 가져옵니다.
   - `channels.matrix.userId`를 설정하는 경우 전체 Matrix ID여야 합니다(예: `@bot:example.org`).
5. gateway를 재시작합니다(또는 onboarding을 완료합니다).
6. Matrix 클라이언트(Element, Beeper 등, [https://matrix.org/ecosystem/clients/](https://matrix.org/ecosystem/clients/) 참고)에서 봇과 DM을 시작하거나 room에 초대합니다. Beeper는 E2EE가 필요하므로 `channels.matrix.encryption: true`를 설정하고 device를 검증하세요.

최소 설정(access token, user ID 자동 조회):

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

E2EE 설정(end-to-end encryption 활성화):

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

## 암호화 (E2EE)

종단간 암호화는 Rust crypto SDK를 통해 **지원됩니다**.

`channels.matrix.encryption: true`로 활성화하세요.

- crypto module이 로드되면, 암호화된 room은 자동으로 복호화됩니다.
- 암호화된 room으로 전송할 때 outbound media도 암호화됩니다.
- 첫 연결 시 OpenClaw는 다른 세션에 device verification을 요청합니다.
- 키 공유를 활성화하려면 다른 Matrix 클라이언트(Element 등)에서 device를 검증하세요.
- crypto module을 로드할 수 없으면 E2EE는 비활성화되고 암호화된 room은 복호화되지 않습니다. OpenClaw는 경고를 기록합니다.
- crypto module 누락 오류(예: `@matrix-org/matrix-sdk-crypto-nodejs-*`)가 보이면 `@matrix-org/matrix-sdk-crypto-nodejs`에 대한 build script를 허용하고 `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs`를 실행하거나 `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js`로 binary를 가져오세요.

Crypto 상태는 계정 + access token별로 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`(SQLite 데이터베이스)에 저장됩니다. Sync 상태는 같은 위치의 `bot-storage.json`에 저장됩니다. access token(device)이 바뀌면 새 저장소가 생성되고, 봇은 암호화된 room에 대해 다시 검증되어야 합니다.

**Device verification:**
E2EE가 활성화되면, 봇은 시작 시 다른 세션에 verification을 요청합니다. Element(또는 다른 클라이언트)를 열고 verification 요청을 승인해 신뢰를 수립하세요. 검증이 완료되면 봇은 암호화된 room의 메시지를 복호화할 수 있습니다.

## Multi-account

멀티 계정 지원: `channels.matrix.accounts`를 사용하고 계정별 자격 증명 및 선택적 `name`을 설정하세요. 공통 패턴은 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)를 참고하세요.

각 계정은 어떤 homeserver에서든 별도의 Matrix user로 실행됩니다. 계정별 config는 최상위 `channels.matrix` 설정을 상속하며, 모든 옵션(DM policy, groups, encryption 등)을 override할 수 있습니다.

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

- 동시 module import로 인한 경쟁 상태를 피하기 위해 계정 startup은 직렬화됩니다.
- Env 변수(`MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` 등)는 **기본** 계정에만 적용됩니다.
- 기본 채널 설정(DM policy, group policy, mention gating 등)은 계정별로 override되지 않는 한 모든 계정에 적용됩니다.
- 계정마다 다른 agent로 라우팅하려면 `bindings[].match.accountId`를 사용하세요.
- Crypto 상태는 계정 + access token별로 저장됩니다(계정마다 별도 key store).

## 라우팅 모델

- 응답은 항상 Matrix로 돌아갑니다.
- DM은 agent의 main session을 공유하고, room은 group session에 매핑됩니다.

## 접근 제어 (DM)

- 기본값: `channels.matrix.dm.policy = "pairing"`. 알 수 없는 발신자는 pairing code를 받습니다.
- 승인 방법:
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- 공개 DM: `channels.matrix.dm.policy="open"` 및 `channels.matrix.dm.allowFrom=["*"]`.
- `channels.matrix.dm.allowFrom`은 전체 Matrix user ID를 받습니다(예: `@user:server`). wizard는 directory search에서 단 하나의 정확한 일치가 있을 때 display name을 user ID로 해석합니다.
- display name이나 로컬파트만 있는 값(예: `"Alice"` 또는 `"alice"`)은 사용하지 마세요. 모호하기 때문에 allowlist 매칭에서 무시됩니다. 전체 `@user:server` ID를 사용하세요.

## Rooms (groups)

- 기본값: `channels.matrix.groupPolicy = "allowlist"` (mention-gated). 설정이 비어 있을 때 기본값을 override하려면 `channels.defaults.groupPolicy`를 사용하세요.
- 런타임 참고: `channels.matrix`가 완전히 없는 경우, 런타임은 room 검사에서 `groupPolicy="allowlist"`로 fallback합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 마찬가지).
- `channels.matrix.groups`로 room을 allowlist에 추가하세요(room ID 또는 alias. directory search에서 정확히 하나의 일치가 있을 때 이름이 ID로 해석됨).

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

- `requireMention: false`는 해당 room에서 auto-reply를 활성화합니다.
- `groups."*"`는 room 전반의 mention gating 기본값을 설정할 수 있습니다.
- `groupAllowFrom`은 room에서 누가 봇을 트리거할 수 있는지 제한합니다(전체 Matrix user ID).
- room별 `users` allowlist는 특정 room 내부에서 발신자를 추가로 제한할 수 있습니다(전체 Matrix user ID 사용).
- configure wizard는 room allowlist(room ID, alias, 또는 이름)를 묻고, 이름은 정확하고 고유하게 일치할 때만 해석합니다.
- 시작 시 OpenClaw는 allowlist의 room/user 이름을 ID로 해석하고 그 매핑을 로그로 남깁니다. 해석되지 않은 항목은 allowlist 매칭에서 무시됩니다.
- 초대는 기본적으로 자동 참여됩니다. `channels.matrix.autoJoin`과 `channels.matrix.autoJoinAllowlist`로 제어하세요.
- **아무 room도 허용하지 않으려면** `channels.matrix.groupPolicy: "disabled"`를 설정하세요(또는 빈 allowlist 유지).
- 레거시 키: `channels.matrix.rooms` (`groups`와 동일한 형태).

## Threads

- reply threading이 지원됩니다.
- `channels.matrix.threadReplies`는 응답을 thread에 유지할지 제어합니다.
  - `off`, `inbound` (기본값), `always`
- `channels.matrix.replyToMode`는 thread로 답하지 않을 때 reply-to metadata를 제어합니다.
  - `off` (기본값), `first`, `all`

## 기능

| Feature         | Status                                                                                |
| --------------- | ------------------------------------------------------------------------------------- |
| Direct messages | ✅ 지원됨                                                                             |
| Rooms           | ✅ 지원됨                                                                             |
| Threads         | ✅ 지원됨                                                                             |
| Media           | ✅ 지원됨                                                                             |
| E2EE            | ✅ 지원됨 (crypto module 필요)                                                        |
| Reactions       | ✅ 지원됨 (tool을 통한 send/read)                                                     |
| Polls           | ✅ send 지원; inbound poll start는 text로 변환됨 (response/end는 무시)                |
| Location        | ✅ 지원됨 (geo URI; altitude는 무시)                                                  |
| Native commands | ✅ 지원됨                                                                             |

## Troubleshooting

먼저 다음 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

필요하면 그다음 DM pairing 상태를 확인하세요.

```bash
openclaw pairing list matrix
```

일반적인 실패:

- 로그인은 되었지만 room 메시지가 무시됨: `groupPolicy` 또는 room allowlist에 의해 room이 차단됨.
- DM이 무시됨: `channels.matrix.dm.policy="pairing"`일 때 발신자가 승인 대기 중.
- 암호화된 room 실패: crypto 지원 또는 encryption 설정 불일치.

트리아지 흐름: [/channels/troubleshooting](/channels/troubleshooting)

## 설정 레퍼런스 (Matrix)

전체 설정: [Configuration](/gateway/configuration)

Provider 옵션:

- `channels.matrix.enabled`: 채널 startup 활성화/비활성화.
- `channels.matrix.homeserver`: homeserver URL.
- `channels.matrix.userId`: Matrix user ID(access token 사용 시 선택 사항).
- `channels.matrix.accessToken`: access token.
- `channels.matrix.password`: 로그인용 password(token 저장됨).
- `channels.matrix.deviceName`: device display name.
- `channels.matrix.encryption`: E2EE 활성화(기본값: false).
- `channels.matrix.initialSyncLimit`: 초기 sync 제한.
- `channels.matrix.threadReplies`: `off | inbound | always` (기본값: inbound).
- `channels.matrix.textChunkLimit`: outbound text chunk 크기(chars).
- `channels.matrix.chunkMode`: `length` (기본값) 또는 `newline`. 길이 기준 chunking 전에 빈 줄(문단 경계)에서 나눕니다.
- `channels.matrix.dm.policy`: `pairing | allowlist | open | disabled` (기본값: pairing).
- `channels.matrix.dm.allowFrom`: DM allowlist(전체 Matrix user ID). `open`에는 `"*"`가 필요합니다. wizard는 가능하면 이름을 ID로 해석합니다.
- `channels.matrix.groupPolicy`: `allowlist | open | disabled` (기본값: allowlist).
- `channels.matrix.groupAllowFrom`: group message용 allowlisted sender(전체 Matrix user ID).
- `channels.matrix.allowlistOnly`: DM + room에 allowlist 규칙 강제 적용.
- `channels.matrix.groups`: group allowlist + room별 설정 맵.
- `channels.matrix.rooms`: 레거시 group allowlist/config.
- `channels.matrix.replyToMode`: thread/tag용 reply-to 모드.
- `channels.matrix.mediaMaxMb`: inbound/outbound media 상한(MB).
- `channels.matrix.autoJoin`: invite 처리(`always | allowlist | off`, 기본값: always).
- `channels.matrix.autoJoinAllowlist`: auto-join을 허용할 room ID/alias.
- `channels.matrix.accounts`: account ID를 키로 하는 multi-account 설정(각 계정은 최상위 설정을 상속).
- `channels.matrix.actions`: action별 tool gating(reactions/messages/pins/memberInfo/channelInfo).
