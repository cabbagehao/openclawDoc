---
summary: "Google Chat app 지원 상태, 기능, 구성"
read_when:
  - Google Chat 채널 기능을 작업할 때
title: "Google Chat"
---

# Google Chat (Chat API)

상태: Google Chat API webhook(HTTP only)을 통한 DM + space에 대해 사용할 준비가 되어 있습니다.

## Quick setup (beginner)

1. Google Cloud project를 만들고 **Google Chat API**를 활성화합니다.
   - 이동: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 아직 활성화되지 않았다면 API를 활성화하세요.
2. **Service Account**를 만듭니다:
   - **Create Credentials** > **Service Account**를 누릅니다.
   - 원하는 이름을 지정합니다 (예: `openclaw-chat`).
   - 권한은 비워 둡니다 (**Continue** 클릭).
   - 접근 권한이 있는 principal도 비워 둡니다 (**Done** 클릭).
3. **JSON Key**를 만들고 다운로드합니다:
   - service account 목록에서 방금 만든 항목을 클릭합니다.
   - **Keys** 탭으로 이동합니다.
   - **Add Key** > **Create new key**를 클릭합니다.
   - **JSON**을 선택하고 **Create**를 누릅니다.
4. 다운로드한 JSON 파일을 gateway host에 저장합니다 (예: `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)에서 Google Chat app을 만듭니다:
   - **Application info**를 입력합니다:
     - **App name**: (예: `OpenClaw`)
     - **Avatar URL**: (예: `https://openclaw.ai/logo.png`)
     - **Description**: (예: `Personal AI Assistant`)
   - **Interactive features**를 활성화합니다.
   - **Functionality** 아래에서 **Join spaces and group conversations**를 체크합니다.
   - **Connection settings** 아래에서 **HTTP endpoint URL**을 선택합니다.
   - **Triggers** 아래에서 **Use a common HTTP endpoint URL for all triggers**를 선택하고, gateway의 공개 URL 뒤에 `/googlechat`를 붙여 설정합니다.
     - _Tip: gateway의 공개 URL을 확인하려면 `openclaw status`를 실행하세요._
   - **Visibility** 아래에서 **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**를 체크합니다.
   - 텍스트 상자에 자신의 이메일 주소를 입력합니다 (예: `user@example.com`).
   - 맨 아래에서 **Save**를 클릭합니다.
6. **app status를 활성화합니다**:
   - 저장 후 **페이지를 새로고침**합니다.
   - **App status** 섹션을 찾습니다 (보통 저장 후 상단이나 하단에 표시됨).
   - 상태를 **Live - available to users**로 변경합니다.
   - 다시 **Save**를 클릭합니다.
7. service account 경로 + webhook audience로 OpenClaw를 구성합니다:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 또는 config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. webhook audience type + value를 설정합니다 (Chat app config와 일치해야 함).
9. gateway를 시작합니다. 그러면 Google Chat이 webhook path로 POST를 보냅니다.

## Add to Google Chat

gateway가 실행 중이고 자신의 이메일이 visibility list에 추가되었다면:

1. [Google Chat](https://chat.google.com/)으로 이동합니다.
2. **Direct Messages** 옆의 **+**(plus) 아이콘을 클릭합니다.
3. 검색창(원래 사람을 추가하는 곳)에 Google Cloud Console에서 설정한 **App name**을 입력합니다.
   - **Note**: 이 bot은 private app이므로 "Marketplace" 탐색 목록에는 _표시되지 않습니다_. 이름으로 직접 검색해야 합니다.
4. 결과에서 bot을 선택합니다.
5. **Add** 또는 **Chat**을 클릭해 1:1 대화를 시작합니다.
6. "Hello"를 보내 assistant를 트리거하세요!

## Public URL (Webhook-only)

Google Chat webhook에는 공개 HTTPS endpoint가 필요합니다. 보안을 위해 **인터넷에는 `/googlechat` path만 노출**하세요. OpenClaw dashboard와 기타 민감한 endpoint는 private network에 유지하세요.

### Option A: Tailscale Funnel (Recommended)

private dashboard에는 Tailscale Serve를, 공개 webhook path에는 Funnel을 사용하세요. 이렇게 하면 `/`는 private으로 유지되고 `/googlechat`만 노출됩니다.

1. **gateway가 어떤 주소에 bind되어 있는지 확인합니다:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP 주소를 기록합니다 (예: `127.0.0.1`, `0.0.0.0`, 또는 `100.x.x.x` 같은 Tailscale IP).

2. **dashboard를 tailnet 전용으로 노출합니다 (port 8443):**

   ```bash
   # localhost에 bind된 경우 (127.0.0.1 또는 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP에만 bind된 경우 (예: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **webhook path만 공개로 노출합니다:**

   ```bash
   # localhost에 bind된 경우 (127.0.0.1 또는 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP에만 bind된 경우 (예: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel access를 위해 node를 승인합니다:**
   프롬프트가 나오면 출력에 표시된 authorization URL로 이동해 tailnet policy에서 이 node의 Funnel을 활성화하세요.

5. **구성을 검증합니다:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

공개 webhook URL은 다음 형태가 됩니다:
`https://<node-name>.<tailnet>.ts.net/googlechat`

private dashboard는 tailnet 전용으로 유지됩니다:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat app config에는 공개 URL(`:8443` 제외)을 사용하세요.

> 참고: 이 구성은 재부팅 후에도 유지됩니다. 나중에 제거하려면 `tailscale funnel reset`과 `tailscale serve reset`을 실행하세요.

### Option B: Reverse Proxy (Caddy)

Caddy 같은 reverse proxy를 쓴다면 특정 path만 proxy하세요:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

이 설정에서는 `your-domain.com/`으로 들어오는 모든 요청은 무시되거나 404를 반환하고, `your-domain.com/googlechat`만 OpenClaw로 안전하게 라우팅됩니다.

### Option C: Cloudflare Tunnel

tunnel ingress rule을 구성해 webhook path만 라우팅하세요:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## How it works

1. Google Chat은 gateway로 webhook POST를 보냅니다. 각 요청에는 `Authorization: Bearer <token>` header가 포함됩니다.
   - OpenClaw는 header가 존재할 때 전체 webhook body를 읽고 파싱하기 전에 bearer auth를 검증합니다.
   - body 안에 `authorizationEventObject.systemIdToken`이 들어 있는 Google Workspace Add-on 요청도 더 엄격한 pre-auth body budget으로 지원됩니다.
2. OpenClaw는 구성된 `audienceType` + `audience`에 대해 token을 검증합니다:
   - `audienceType: "app-url"` → audience는 HTTPS webhook URL입니다.
   - `audienceType: "project-number"` → audience는 Cloud project number입니다.
3. 메시지는 space 기준으로 라우팅됩니다:
   - DM은 session key `agent:<agentId>:googlechat:dm:<spaceId>`를 사용합니다.
   - Space는 session key `agent:<agentId>:googlechat:group:<spaceId>`를 사용합니다.
4. DM access는 기본적으로 pairing입니다. 알 수 없는 sender는 pairing code를 받으며, 다음으로 승인합니다:
   - `openclaw pairing approve googlechat <code>`
5. Group space는 기본적으로 @-mention이 필요합니다. mention detection에 app의 user name이 필요하면 `botUser`를 사용하세요.

## Targets

전달 및 allowlist에는 다음 식별자를 사용하세요:

- Direct messages: `users/<userId>` (권장).
- raw email `name@example.com`은 변경 가능하며, `channels.googlechat.dangerouslyAllowNameMatching: true`일 때 direct allowlist 매칭에만 사용됩니다.
- Deprecated: `users/<email>`은 email allowlist가 아니라 user id로 취급됩니다.
- Spaces: `spaces/<spaceId>`.

## Config highlights

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

참고:

- Service account credential은 `serviceAccount`(JSON string)로 inline 전달할 수도 있습니다.
- `serviceAccountRef`도 지원됩니다 (env/file SecretRef). `channels.googlechat.accounts.<id>.serviceAccountRef` 아래의 account별 ref도 포함됩니다.
- `webhookPath`를 설정하지 않으면 기본 webhook path는 `/googlechat`입니다.
- `dangerouslyAllowNameMatching`은 allowlist용 변경 가능한 email principal 매칭을 다시 활성화합니다 (break-glass 호환 모드).
- `actions.reactions`가 활성화되면 reaction은 `reactions` tool과 `channels action`을 통해 사용할 수 있습니다.
- `typingIndicator`는 `none`, `message`(기본값), `reaction`을 지원합니다 (`reaction`은 user OAuth 필요).
- 첨부 파일은 Chat API를 통해 다운로드되어 media pipeline에 저장됩니다 (`mediaMaxMb`로 크기 제한).

Secrets reference 세부 정보: [Secrets Management](/gateway/secrets).

## Troubleshooting

### 405 Method Not Allowed

Google Cloud Logs Explorer에 다음과 같은 오류가 표시된다면:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

이는 webhook handler가 등록되지 않았다는 뜻입니다. 흔한 원인은 다음과 같습니다:

1. **Channel not configured**: config에 `channels.googlechat` 섹션이 없습니다. 다음으로 확인하세요:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found"가 반환되면 구성을 추가하세요 ([Config highlights](#config-highlights) 참고).

2. **Plugin not enabled**: plugin status를 확인하세요:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled"로 표시되면 config에 `plugins.entries.googlechat.enabled: true`를 추가하세요.

3. **Gateway not restarted**: config를 추가한 뒤 gateway를 재시작하세요:

   ```bash
   openclaw gateway restart
   ```

channel이 실행 중인지 확인:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Other issues

- auth 오류나 audience config 누락은 `openclaw channels status --probe`로 확인하세요.
- 메시지가 도착하지 않으면 Chat app의 webhook URL과 event subscription을 확인하세요.
- mention gating 때문에 reply가 막히면 `botUser`를 app의 user resource name으로 설정하고 `requireMention`을 검증하세요.
- 테스트 메시지를 보내는 동안 `openclaw logs --follow`를 사용해 요청이 gateway에 도달하는지 확인하세요.

Related docs:

- [Gateway configuration](/gateway/configuration)
- [Security](/gateway/security)
- [Reactions](/tools/reactions)
