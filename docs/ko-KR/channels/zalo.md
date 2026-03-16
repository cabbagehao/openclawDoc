---
summary: "Zalo bot 지원 상태, 기능, 구성 방법"
read_when:
  - Zalo 기능이나 webhook을 작업할 때
title: "Zalo"
description: "Zalo plugin 설치, bot token 설정, DM·group access policy, long-polling과 webhook 모드, 지원 기능과 configuration 옵션을 설명합니다."
x-i18n:
  source_path: "channels/zalo.md"
---

# Zalo (Bot API)

상태: experimental. DM을 지원하며, 그룹 처리는 명시적인 group policy control과
함께 사용할 수 있습니다.

## Plugin 필요

Zalo는 plugin으로 제공되며 core install에 번들되어 있지 않습니다.

- CLI 설치: `openclaw plugins install @openclaw/zalo`
- 또는 onboarding 중 **Zalo**를 선택하고 설치 프롬프트를 승인
- 자세한 내용: [Plugins](/tools/plugin)

## 빠른 설정(beginner)

1. Zalo plugin을 설치합니다.
   - source checkout: `openclaw plugins install ./extensions/zalo`
   - npm(게시된 경우): `openclaw plugins install @openclaw/zalo`
   - 또는 onboarding에서 **Zalo** 선택 후 설치 프롬프트 승인
2. token 설정:
   - Env: `ZALO_BOT_TOKEN=...`
   - 또는 config: `channels.zalo.botToken: "..."`
3. gateway 재시작(또는 onboarding 완료)
4. DM access는 기본적으로 pairing입니다. 첫 contact에서 pairing code를
   승인하세요.

최소 구성:

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

## 이것이 의미하는 것

Zalo는 베트남 중심 메시징 앱이며, Bot API를 통해 Gateway가 1:1 대화용 bot을
실행할 수 있습니다. support나 notification처럼 Zalo로 결정론적으로 돌아가야
하는 흐름에 적합합니다.

- Gateway가 소유하는 Zalo Bot API 채널
- 결정론적 라우팅: reply는 Zalo로 돌아가며 모델이 채널을 고르지 않음
- DM은 agent의 main session을 공유
- Groups는 policy control(`groupPolicy` + `groupAllowFrom`)과 함께 지원되며,
  기본값은 fail-closed allowlist 동작

## 설정(fast path)

### 1) bot token 생성(Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com)에 가서 로그인
2. 새 bot을 만들고 설정
3. bot token 복사(형식: `12345689:abc-xyz`)

### 2) token 설정(env 또는 config)

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

env 옵션: `ZALO_BOT_TOKEN=...` (default account 전용)

multi-account는 `channels.zalo.accounts`에 계정별 token과 선택적 `name`을
설정합니다.

3. gateway 재시작. Zalo는 token이 해결되면(env 또는 config) 시작됩니다.
4. DM access 기본값은 pairing입니다. bot에 처음 연락하면 code를 승인하세요.

## 동작 방식

- inbound message는 media placeholder를 포함한 공통 channel envelope로 정규화됨
- reply는 항상 같은 Zalo chat으로 돌아감
- 기본은 long-polling, `channels.zalo.webhookUrl`로 webhook 모드 사용 가능

## Limits

- outbound text는 2000자(Zalo API 제한) 단위로 chunking
- media download/upload는 `channels.zalo.mediaMaxMb`(기본 5)로 제한
- 2000자 제한 때문에 streaming은 기본적으로 차단

## 접근 제어(DMs)

### DM access

- 기본값: `channels.zalo.dmPolicy = "pairing"`. 알 수 없는 sender는 pairing
  code를 받고, 승인 전까지 메시지는 무시됩니다(code는 1시간 후 만료).
- 승인:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- pairing은 기본 token exchange 방식입니다. 자세한 내용:
  [Pairing](/channels/pairing)
- `channels.zalo.allowFrom`은 numeric user ID만 받습니다
  (username lookup 없음).

## 접근 제어(Groups)

- `channels.zalo.groupPolicy`는 group inbound 처리 방식을 제어:
  `open | allowlist | disabled`
- 기본 동작은 fail-closed: `allowlist`
- `channels.zalo.groupAllowFrom`은 group에서 bot을 트리거할 수 있는 sender ID를 제한
- `groupAllowFrom`이 없으면 sender 검사는 `allowFrom`으로 fallback
- `groupPolicy: "disabled"`는 모든 group message 차단
- `groupPolicy: "open"`은 모든 group member를 허용(mention-gated)
- runtime 참고: `channels.zalo`가 아예 없더라도 안전을 위해
  `groupPolicy="allowlist"`로 fallback

## Long-polling vs webhook

- 기본값: long-polling (public URL 불필요)
- webhook 모드: `channels.zalo.webhookUrl`과
  `channels.zalo.webhookSecret` 설정
  - webhook secret은 8-256자여야 함
  - webhook URL은 HTTPS여야 함
  - Zalo는 `X-Bot-Api-Secret-Token` header로 이벤트를 보냄
  - Gateway HTTP는 `channels.zalo.webhookPath`에서 webhook request 처리
    (기본값: webhook URL path)
  - request는 `Content-Type: application/json`(또는 `+json`)이어야 함
  - 중복 event(`event_name + message_id`)는 짧은 replay window 안에서 무시
  - burst traffic은 path/source별로 rate limit되며 HTTP 429를 반환할 수 있음

**참고:** Zalo API 문서 기준으로 getUpdates(polling)와 webhook은 동시에 사용할 수
없습니다.

## 지원 메시지 타입

- **Text messages:** 2000자 chunking과 함께 완전 지원
- **Image messages:** inbound image를 다운로드/처리하고 `sendPhoto`로 발신 가능
- **Stickers:** 로그는 남기지만 agent response는 트리거하지 않음
- **Unsupported types:** 로그만 남김(예: protected user message)

## Capabilities

| Feature         | Status                                                   |
| --------------- | -------------------------------------------------------- |
| Direct messages | Supported                                                |
| Groups          | Supported with policy controls (allowlist by default)    |
| Media (images)  | Supported                                                |
| Reactions       | Not supported                                            |
| Threads         | Not supported                                            |
| Polls           | Not supported                                            |
| Native commands | Not supported                                            |
| Streaming       | Blocked (2000 char limit)                                |

## Delivery targets (CLI/cron)

- target에는 chat id 사용
- 예시:
  `openclaw message send --channel zalo --target 123456789 --message "hi"`

## 문제 해결

**bot이 응답하지 않을 때:**

- token이 유효한지 확인: `openclaw channels status --probe`
- sender가 승인되었는지 확인(pairing 또는 allowFrom)
- gateway logs 확인: `openclaw logs --follow`

**webhook이 event를 받지 못할 때:**

- webhook URL이 HTTPS인지 확인
- secret token이 8-256자인지 확인
- gateway HTTP endpoint가 설정된 path에서 도달 가능한지 확인
- getUpdates polling이 동시에 실행 중이 아닌지 확인(서로 배타적)

## Configuration reference (Zalo)

전체 구성: [Configuration](/gateway/configuration)

Provider option:

- `channels.zalo.enabled`: 채널 시작 활성화/비활성화
- `channels.zalo.botToken`: Zalo Bot Platform의 bot token
- `channels.zalo.tokenFile`: regular file에서 token 읽기. symlink는 거부
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled`
  (기본 pairing)
- `channels.zalo.allowFrom`: DM allowlist(user IDs). `open`에는 `"*"` 필요.
  wizard는 numeric ID를 묻습니다.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled`
  (기본 allowlist)
- `channels.zalo.groupAllowFrom`: group sender allowlist(user IDs).
  비어 있으면 `allowFrom`으로 fallback
- `channels.zalo.mediaMaxMb`: inbound/outbound media cap(MB, 기본 5)
- `channels.zalo.webhookUrl`: webhook 모드 활성화(HTTPS 필요)
- `channels.zalo.webhookSecret`: webhook secret(8-256자)
- `channels.zalo.webhookPath`: gateway HTTP server의 webhook path
- `channels.zalo.proxy`: API request용 proxy URL

Multi-account option:

- `channels.zalo.accounts.<id>.botToken`: account별 token
- `channels.zalo.accounts.<id>.tokenFile`: account별 regular token file
  (symlink 거부)
- `channels.zalo.accounts.<id>.name`: 표시 이름
- `channels.zalo.accounts.<id>.enabled`: account 활성화/비활성화
- `channels.zalo.accounts.<id>.dmPolicy`: account별 DM policy
- `channels.zalo.accounts.<id>.allowFrom`: account별 allowlist
- `channels.zalo.accounts.<id>.groupPolicy`: account별 group policy
- `channels.zalo.accounts.<id>.groupAllowFrom`: account별 group sender allowlist
- `channels.zalo.accounts.<id>.webhookUrl`: account별 webhook URL
- `channels.zalo.accounts.<id>.webhookSecret`: account별 webhook secret
- `channels.zalo.accounts.<id>.webhookPath`: account별 webhook path
- `channels.zalo.accounts.<id>.proxy`: account별 proxy URL
