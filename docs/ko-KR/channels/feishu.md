---
summary: "Feishu bot 개요, 기능, 구성"
read_when:
  - Feishu/Lark bot를 연결하려고 할 때
  - Feishu 채널을 구성할 때
title: Feishu
---

# Feishu bot

Feishu(Lark)는 기업에서 메시징과 협업에 사용하는 팀 채팅 플랫폼입니다. 이 plugin은 플랫폼의 WebSocket event subscription을 사용해 OpenClaw를 Feishu/Lark bot에 연결하므로, 공개 webhook URL을 노출하지 않고도 메시지를 받을 수 있습니다.

---

## 번들 plugin

Feishu는 현재 OpenClaw 릴리스에 번들되어 제공되므로 별도의 plugin 설치가 필요하지 않습니다.

번들된 Feishu가 포함되지 않은 오래된 빌드 또는 custom install을 사용 중이라면 수동으로 설치하세요.

```bash
openclaw plugins install @openclaw/feishu
```

---

## 빠른 시작

Feishu 채널을 추가하는 방법은 두 가지가 있습니다.

### 방법 1: onboarding wizard (권장)

OpenClaw를 방금 설치했다면 wizard를 실행하세요.

```bash
openclaw onboard
```

Wizard는 다음 과정을 안내합니다.

1. Feishu app 생성 및 credential 수집
2. OpenClaw에 app credential 구성
3. Gateway 시작

✅ **구성이 끝나면** gateway 상태를 확인하세요.

- `openclaw gateway status`
- `openclaw logs --follow`

### 방법 2: CLI 설정

이미 초기 설치를 마쳤다면 CLI로 채널을 추가하세요.

```bash
openclaw channels add
```

**Feishu**를 선택한 다음 App ID와 App Secret을 입력하세요.

✅ **구성이 끝나면** gateway를 관리하세요.

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## 1단계: Feishu app 만들기

### 1. Feishu Open Platform 열기

[Feishu Open Platform](https://open.feishu.cn/app)에 접속해 로그인하세요.

Lark(글로벌) 테넌트는 [https://open.larksuite.com/app](https://open.larksuite.com/app)을 사용해야 하며, Feishu config에서 `domain: "lark"`를 설정해야 합니다.

### 2. App 만들기

1. **Create enterprise app** 클릭
2. App 이름과 설명 입력
3. App 아이콘 선택

![Create enterprise app](../../images/feishu-step2-create-app.png)

### 3. Credential 복사

**Credentials & Basic Info**에서 다음 값을 복사하세요.

- **App ID** (형식: `cli_xxx`)
- **App Secret**

❗ **중요:** App Secret은 비공개로 유지하세요.

![Get credentials](../../images/feishu-step3-credentials.png)

### 4. 권한 구성

**Permissions**에서 **Batch import**를 클릭하고 다음 내용을 붙여 넣으세요.

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](../../images/feishu-step4-permissions.png)

### 5. Bot capability 활성화

**App Capability** > **Bot**에서 다음을 수행하세요.

1. Bot capability 활성화
2. Bot 이름 설정

![Enable bot capability](../../images/feishu-step5-bot-capability.png)

### 6. Event subscription 구성

⚠️ **중요:** event subscription을 설정하기 전에 다음을 확인하세요.

1. 이미 Feishu에 대해 `openclaw channels add`를 실행했다
2. Gateway가 실행 중이다(`openclaw gateway status`)

**Event Subscription**에서:

1. **Use long connection to receive events**(WebSocket) 선택
2. `im.message.receive_v1` event 추가

⚠️ Gateway가 실행 중이 아니면 long-connection 설정이 저장되지 않을 수 있습니다.

![Configure event subscription](../../images/feishu-step6-event-subscription.png)

### 7. App 게시

1. **Version Management & Release**에서 버전 생성
2. 검토 제출 후 게시
3. 관리자 승인 대기(enterprise app은 보통 자동 승인됨)

---

## 2단계: OpenClaw 구성

### Wizard로 구성(권장)

```bash
openclaw channels add
```

**Feishu**를 선택하고 App ID와 App Secret을 붙여 넣으세요.

### Config 파일로 구성

`~/.openclaw/openclaw.json`을 편집하세요.

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "My AI assistant",
        },
      },
    },
  },
}
```

`connectionMode: "webhook"`를 사용한다면 `verificationToken`을 설정하세요. Feishu webhook 서버는 기본적으로 `127.0.0.1`에 bind되며, 다른 bind address가 의도적으로 필요할 때만 `webhookHost`를 설정하세요.

#### Verification Token (webhook mode)

Webhook mode를 사용할 때는 config에 `channels.feishu.verificationToken`을 설정하세요. 값을 확인하는 방법은 다음과 같습니다.

1. Feishu Open Platform에서 app 열기
2. **Development** → **Events & Callbacks**로 이동(开发配置 → 事件与回调)
3. **Encryption** 탭 열기(加密策略)
4. **Verification Token** 복사

![Verification Token location](../../images/feishu-verification-token.png)

### Environment variable로 구성

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark (global) domain

테넌트가 Lark(국제판)에 있으면 domain을 `lark`(또는 전체 domain 문자열)로 설정하세요. `channels.feishu.domain` 또는 계정별(`channels.feishu.accounts.<id>.domain`)로 설정할 수 있습니다.

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Quota 최적화 flag

선택적 flag 두 개로 Feishu API 사용량을 줄일 수 있습니다.

- `typingIndicator` (기본값 `true`): `false`이면 typing reaction 호출을 건너뜁니다.
- `resolveSenderNames` (기본값 `true`): `false`이면 sender profile lookup 호출을 건너뜁니다.

최상위 또는 계정별로 설정하세요.

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## 3단계: 시작 + 테스트

### 1. Gateway 시작

```bash
openclaw gateway
```

### 2. 테스트 메시지 보내기

Feishu에서 bot을 찾아 메시지를 보내세요.

### 3. Pairing 승인

기본적으로 bot은 pairing code로 응답합니다. 이를 승인하세요.

```bash
openclaw pairing approve feishu <CODE>
```

승인 후에는 일반적으로 대화할 수 있습니다.

---

## 개요

- **Feishu bot channel**: Gateway가 관리하는 Feishu bot
- **Deterministic routing**: 응답은 항상 Feishu로 돌아감
- **Session isolation**: DM은 main session을 공유하고, 그룹은 격리됨
- **WebSocket connection**: Feishu SDK를 통한 long connection, 공개 URL 불필요

---

## 접근 제어

### Direct message

- **기본값**: `dmPolicy: "pairing"`(알 수 없는 사용자는 pairing code를 받음)
- **Pairing 승인**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Allowlist mode**: 허용할 Open ID로 `channels.feishu.allowFrom` 설정

### Group chat

**1. Group policy** (`channels.feishu.groupPolicy`):

- `"open"` = 그룹의 모든 사용자 허용(기본값)
- `"allowlist"` = `groupAllowFrom`만 허용
- `"disabled"` = 그룹 메시지 비활성화

**2. Mention requirement** (`channels.feishu.groups.<chat_id>.requireMention`):

- `true` = @mention 필요(기본값)
- `false` = mention 없이 응답

---

## 그룹 구성 예시

### 모든 그룹 허용, @mention 필요(기본값)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // Default requireMention: true
    },
  },
}
```

### 모든 그룹 허용, @mention 불필요

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_xxx: { requireMention: false },
      },
    },
  },
}
```

### 특정 그룹만 허용

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Feishu group IDs (chat_id) look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### 그룹에서 메시지를 보낼 수 있는 sender 제한(sender allowlist)

그룹 자체를 허용하는 것에 더해, 해당 그룹의 **모든 메시지**는 sender의 open_id로 제어됩니다. `groups.<chat_id>.allowFrom`에 나열된 사용자만 메시지가 처리되며, 다른 멤버의 메시지는 무시됩니다. 이는 `/reset`이나 `/new` 같은 제어 명령에만 적용되는 것이 아니라 전체 sender 수준 gating입니다.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu user IDs (open_id) look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## 그룹/사용자 ID 확인

### 그룹 ID (`chat_id`)

그룹 ID는 `oc_xxx` 형태입니다.

**방법 1 (권장)**

1. Gateway를 시작하고 그룹에서 bot을 @mention
2. `openclaw logs --follow`를 실행하고 `chat_id` 확인

**방법 2**

Feishu API debugger를 사용해 그룹 채팅 목록을 조회합니다.

### 사용자 ID (`open_id`)

사용자 ID는 `ou_xxx` 형태입니다.

**방법 1 (권장)**

1. Gateway를 시작하고 bot에 DM 보내기
2. `openclaw logs --follow`를 실행하고 `open_id` 확인

**방법 2**

사용자 Open ID는 pairing 요청에서 확인할 수 있습니다.

```bash
openclaw pairing list feishu
```

---

## 일반 명령

| Command   | 설명                 |
| --------- | -------------------- |
| `/status` | Bot 상태 표시        |
| `/reset`  | Session 초기화       |
| `/model`  | 모델 표시/전환       |

> 참고: Feishu는 아직 native command menu를 지원하지 않으므로, 명령은 text로 보내야 합니다.

## Gateway 관리 명령

| Command                    | 설명                          |
| -------------------------- | ----------------------------- |
| `openclaw gateway status`  | Gateway 상태 표시             |
| `openclaw gateway install` | Gateway service 설치/시작     |
| `openclaw gateway stop`    | Gateway service 중지          |
| `openclaw gateway restart` | Gateway service 재시작        |
| `openclaw logs --follow`   | Gateway log 실시간 보기       |

---

## 문제 해결

### Group chat에서 bot이 응답하지 않음

1. Bot이 그룹에 추가되어 있는지 확인
2. Bot을 @mention하고 있는지 확인(기본 동작)
3. `groupPolicy`가 `"disabled"`로 설정되지 않았는지 확인
4. Log 확인: `openclaw logs --follow`

### Bot이 메시지를 받지 못함

1. App이 게시되고 승인되었는지 확인
2. Event subscription에 `im.message.receive_v1`이 포함되어 있는지 확인
3. **Long connection**이 활성화되어 있는지 확인
4. App 권한이 완전한지 확인
5. Gateway가 실행 중인지 확인: `openclaw gateway status`
6. Log 확인: `openclaw logs --follow`

### App Secret 유출

1. Feishu Open Platform에서 App Secret 재설정
2. Config의 App Secret 업데이트
3. Gateway 재시작

### 메시지 전송 실패

1. App에 `im:message:send_as_bot` 권한이 있는지 확인
2. App이 게시되었는지 확인
3. 자세한 오류는 log 확인

---

## 고급 구성

### 여러 계정

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`는 발신 API에서 `accountId`를 명시적으로 지정하지 않았을 때 어떤 Feishu 계정을 사용할지 제어합니다.

### 메시지 제한

- `textChunkLimit`: 발신 text chunk 크기(기본값: 2000 chars)
- `mediaMaxMb`: media 업로드/다운로드 제한(기본값: 30MB)

### Streaming

Feishu는 interactive card를 통한 streaming reply를 지원합니다. 활성화되면 bot은 text를 생성하는 동안 card를 업데이트합니다.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default true)
      blockStreaming: true, // enable block-level streaming (default true)
    },
  },
}
```

전체 응답이 완성된 뒤에 보내려면 `streaming: false`로 설정하세요.

### Multi-agent routing

`bindings`를 사용해 Feishu DM 또는 그룹을 서로 다른 agent로 라우팅할 수 있습니다.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

라우팅 필드:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` 또는 `"group"`
- `match.peer.id`: 사용자 Open ID(`ou_xxx`) 또는 그룹 ID(`oc_xxx`)

조회 팁은 [그룹/사용자 ID 확인](#그룹사용자-id-확인)을 참고하세요.

---

## 구성 참조

전체 구성: [Gateway configuration](/gateway/configuration)

핵심 옵션:

| Setting                                           | 설명                               | Default          |
| ------------------------------------------------- | ---------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | 채널 활성화/비활성화              | `true`           |
| `channels.feishu.domain`                          | API domain (`feishu` 또는 `lark`) | `feishu`         |
| `channels.feishu.connectionMode`                  | Event transport mode               | `websocket`      |
| `channels.feishu.defaultAccount`                  | 발신 라우팅용 기본 account ID     | `default`        |
| `channels.feishu.verificationToken`               | Webhook mode에 필요               | -                |
| `channels.feishu.webhookPath`                     | Webhook route path                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook bind host                  | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook bind port                  | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                             | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                         | -                |
| `channels.feishu.accounts.<id>.domain`            | 계정별 API domain override         | `feishu`         |
| `channels.feishu.dmPolicy`                        | DM 정책                            | `pairing`        |
| `channels.feishu.allowFrom`                       | DM allowlist (`open_id` 목록)      | -                |
| `channels.feishu.groupPolicy`                     | 그룹 정책                          | `open`           |
| `channels.feishu.groupAllowFrom`                  | 그룹 allowlist                     | -                |
| `channels.feishu.groups.<chat_id>.requireMention` | @mention 필요 여부                 | `true`           |
| `channels.feishu.groups.<chat_id>.enabled`        | 그룹 활성화                        | `true`           |
| `channels.feishu.textChunkLimit`                  | 메시지 chunk 크기                  | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Media 크기 제한                    | `30`             |
| `channels.feishu.streaming`                       | Streaming card 출력 활성화         | `true`           |
| `channels.feishu.blockStreaming`                  | Block streaming 활성화             | `true`           |

---

## dmPolicy 참조

| Value         | 동작                                                            |
| ------------- | --------------------------------------------------------------- |
| `"pairing"`   | **기본값.** 알 수 없는 사용자는 pairing code를 받고, 승인되어야 함 |
| `"allowlist"` | `allowFrom`에 있는 사용자만 대화 가능                           |
| `"open"`      | 모든 사용자 허용(`allowFrom`에 `"*"` 필요)                      |
| `"disabled"`  | DM 비활성화                                                     |

---

## 지원되는 메시지 유형

### 수신

- ✅ Text
- ✅ Rich text (post)
- ✅ Images
- ✅ Files
- ✅ Audio
- ✅ Video
- ✅ Stickers

### 전송

- ✅ Text
- ✅ Images
- ✅ Files
- ✅ Audio
- ⚠️ Rich text (부분 지원)
