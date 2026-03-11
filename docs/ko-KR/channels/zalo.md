---
summary: "Zalo bot 지원 상태, 기능, 설정"
read_when:
  - Zalo 기능이나 webhook을 다룰 때
title: "Zalo"
---

# Zalo (Bot API)

상태: experimental. DM은 지원되며, group 처리는 명시적인 group policy 제어와 함께 사용할 수 있습니다.

## Plugin required

Zalo는 plugin 형태로 제공되며 core install에는 포함되지 않습니다.

- CLI 설치: `openclaw plugins install @openclaw/zalo`
- 또는 onboarding에서 **Zalo**를 선택하고 설치 프롬프트 확인
- 자세한 내용: [Plugins](/tools/plugin)

## Quick setup (beginner)

1. Zalo plugin을 설치합니다.
   - 소스 체크아웃에서: `openclaw plugins install ./extensions/zalo`
   - npm에서(배포된 경우): `openclaw plugins install @openclaw/zalo`
   - 또는 onboarding에서 **Zalo**를 선택하고 설치 프롬프트 확인
2. token을 설정합니다.
   - Env: `ZALO_BOT_TOKEN=...`
   - 또는 config: `channels.zalo.botToken: "..."`
3. gateway를 재시작합니다(또는 onboarding을 마칩니다).
4. DM 접근은 기본적으로 pairing입니다. 첫 연락 시 pairing code를 승인하세요.

최소 설정:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

## What it is

Zalo는 베트남 중심 메시징 앱이며, Bot API를 통해 Gateway가 1:1 대화용 bot으로 동작할 수 있습니다.
support 또는 notification 용도에서 Zalo로 안정적으로 되돌려 보내고 싶을 때 적합합니다.

- Gateway가 소유한 Zalo Bot API 채널
- 결정론적 라우팅: 응답은 항상 Zalo로 되돌아가며, 모델이 채널을 선택하지 않습니다.
- DM은 agent의 main session을 공유합니다.
- Group은 policy 제어(`groupPolicy` + `groupAllowFrom`)와 함께 지원되며, 기본값은 fail-closed allowlist 동작입니다.

## Setup (fast path)

### 1) Create a bot token (Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com)에 접속해 로그인합니다.
2. 새 bot을 만들고 설정합니다.
3. bot token을 복사합니다(형식: `12345689:abc-xyz`).

### 2) Configure the token (env or config)

예시:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

Env 옵션: `ZALO_BOT_TOKEN=...` (기본 account에서만 동작)

multi-account 지원: `channels.zalo.accounts`에 account별 token과 선택적 `name`을 설정합니다.

3. gateway를 재시작합니다. token이 해석되면(env 또는 config) Zalo가 시작됩니다.
4. DM 접근 기본값은 pairing이며, bot이 처음 연락을 받으면 code를 승인해야 합니다.

## How it works (behavior)

- inbound message는 media placeholder를 포함한 공유 channel envelope로 정규화됩니다.
- 응답은 항상 같은 Zalo chat으로 되돌아갑니다.
- 기본값은 long-polling이며, `channels.zalo.webhookUrl`로 webhook 모드도 사용할 수 있습니다.

## Limits

- outbound text는 2000자(Zalo API 제한)로 chunking됩니다.
- media download/upload는 `channels.zalo.mediaMaxMb`(기본값 5)로 제한됩니다.
- 2000자 한도 때문에 streaming은 기본적으로 차단됩니다.

## Access control (DMs)

### DM access

- 기본값: `channels.zalo.dmPolicy = "pairing"`. 알 수 없는 발신자는 pairing code를 받고, 승인되기 전까지 메시지는 무시됩니다(code는 1시간 후 만료).
- 승인 명령:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- pairing이 기본 token 교환 방식입니다. 자세한 내용은 [Pairing](/channels/pairing)을 참고하세요.
- `channels.zalo.allowFrom`은 숫자 user ID만 받습니다(username lookup 불가).

## Access control (Groups)

- `channels.zalo.groupPolicy`는 group inbound 처리를 제어합니다: `open | allowlist | disabled`
- 기본 동작은 fail-closed이며 `allowlist`입니다.
- `channels.zalo.groupAllowFrom`은 group 안에서 어떤 sender ID가 bot을 트리거할 수 있는지 제한합니다.
- `groupAllowFrom`이 비어 있으면, Zalo는 sender 검사에 `allowFrom`을 fallback으로 사용합니다.
- `groupPolicy: "disabled"`는 모든 group message를 차단합니다.
- `groupPolicy: "open"`은 모든 group member를 허용하지만 mention-gated입니다.
- 런타임 참고: `channels.zalo`가 아예 없더라도 안전을 위해 `groupPolicy="allowlist"`가 fallback 됩니다.

## Long-polling vs webhook

- 기본값: long-polling(공개 URL 불필요)
- Webhook 모드: `channels.zalo.webhookUrl`과 `channels.zalo.webhookSecret` 설정
  - webhook secret은 8-256자여야 합니다.
  - webhook URL은 HTTPS여야 합니다.
  - Zalo는 검증용 `X-Bot-Api-Secret-Token` 헤더와 함께 이벤트를 보냅니다.
  - Gateway HTTP는 `channels.zalo.webhookPath`에서 webhook 요청을 처리합니다(기본값은 webhook URL 경로).
  - 요청은 `Content-Type: application/json` 또는 `+json` media type이어야 합니다.
  - 중복 이벤트(`event_name + message_id`)는 짧은 replay window 동안 무시됩니다.
  - burst traffic은 path/source별로 rate-limit되며 HTTP 429를 반환할 수 있습니다.

**참고:** Zalo API 문서에 따라 getUpdates(polling)와 webhook은 동시에 사용할 수 없습니다.

## Supported message types

- **Text messages**: 2000자 chunking과 함께 완전 지원
- **Image messages**: 수신 이미지를 다운로드하고 처리하며 `sendPhoto`로 전송 가능
- **Stickers**: 로그는 남기지만 완전 처리되지는 않음(agent 응답 없음)
- **Unsupported types**: 로그에 기록됨(예: protected user의 메시지)

## Capabilities

| Feature         | Status                                                   |
| --------------- | -------------------------------------------------------- |
| Direct messages | ✅ Supported                                             |
| Groups          | ⚠️ Supported with policy controls (allowlist by default) |
| Media (images)  | ✅ Supported                                             |
| Reactions       | ❌ Not supported                                         |
| Threads         | ❌ Not supported                                         |
| Polls           | ❌ Not supported                                         |
| Native commands | ❌ Not supported                                         |
| Streaming       | ⚠️ Blocked (2000 char limit)                             |

## Delivery targets (CLI/cron)

- target에는 chat id를 사용합니다.
- 예시: `openclaw message send --channel zalo --target 123456789 --message "hi"`

## Troubleshooting

**Bot doesn't respond:**

- token이 유효한지 확인: `openclaw channels status --probe`
- 발신자가 승인되었는지 확인(pairing 또는 allowFrom)
- gateway log 확인: `openclaw logs --follow`

**Webhook not receiving events:**

- webhook URL이 HTTPS인지 확인
- secret token이 8-256자인지 확인
- gateway HTTP endpoint가 설정된 경로에서 접근 가능한지 확인
- getUpdates polling이 동작 중이 아닌지 확인(둘은 상호 배타적)

## Configuration reference (Zalo)

전체 설정: [Configuration](/gateway/configuration)

provider 옵션:

- `channels.zalo.enabled`: 채널 시작 활성화/비활성화
- `channels.zalo.botToken`: Zalo Bot Platform의 bot token
- `channels.zalo.tokenFile`: 파일 경로에서 token 읽기
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: pairing)
- `channels.zalo.allowFrom`: DM allowlist(user ID). `open`에는 `"*"`가 필요합니다. wizard는 숫자 ID를 요구합니다.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (기본값: allowlist)
- `channels.zalo.groupAllowFrom`: group sender allowlist(user ID). 비어 있으면 `allowFrom`을 fallback으로 사용
- `channels.zalo.mediaMaxMb`: 수신/송신 media 최대 크기(MB, 기본값 5)
- `channels.zalo.webhookUrl`: webhook 모드 활성화(HTTPS 필요)
- `channels.zalo.webhookSecret`: webhook secret(8-256자)
- `channels.zalo.webhookPath`: gateway HTTP server의 webhook 경로
- `channels.zalo.proxy`: API 요청용 proxy URL

multi-account 옵션:

- `channels.zalo.accounts.<id>.botToken`: account별 token
- `channels.zalo.accounts.<id>.tokenFile`: account별 token file
- `channels.zalo.accounts.<id>.name`: display name
- `channels.zalo.accounts.<id>.enabled`: account 활성화/비활성화
- `channels.zalo.accounts.<id>.dmPolicy`: account별 DM 정책
- `channels.zalo.accounts.<id>.allowFrom`: account별 allowlist
- `channels.zalo.accounts.<id>.groupPolicy`: account별 group 정책
- `channels.zalo.accounts.<id>.groupAllowFrom`: account별 group sender allowlist
- `channels.zalo.accounts.<id>.webhookUrl`: account별 webhook URL
- `channels.zalo.accounts.<id>.webhookSecret`: account별 webhook secret
- `channels.zalo.accounts.<id>.webhookPath`: account별 webhook 경로
- `channels.zalo.accounts.<id>.proxy`: account별 proxy URL
