---
summary: "누가 DM을 보낼 수 있는지, 어떤 노드가 참가할 수 있는지 승인하는 pairing 개요"
read_when:
  - DM 접근 제어를 설정할 때
  - 새 iOS/Android 노드를 pairing할 때
  - OpenClaw의 보안 모델을 검토할 때
title: "페어링"
x-i18n:
  source_path: "channels/pairing.md"
---

# 페어링

“페어링(pairing)”은 OpenClaw의 명시적인 **소유자 승인** 단계입니다.
다음 두 곳에 사용됩니다.

1. **DM pairing** (누가 봇과 대화할 수 있는지)
2. **노드 pairing** (어떤 디바이스/노드가 gateway 네트워크에 참가할 수 있는지)

보안 맥락: [Security](/gateway/security)

## 1) DM pairing (인바운드 채팅 접근)

채널의 DM 정책이 `pairing`으로 설정되면, 모르는 발신자에게는 짧은 코드가 전달되고 승인이 끝날 때까지 메시지는 **처리되지 않습니다**.

기본 DM 정책은 다음 문서에 정리돼 있습니다. [Security](/gateway/security)

페어링 코드:

- 8자, 대문자, 헷갈리는 문자 없음 (`0O1I`).
- **1시간 후 만료됩니다**. 봇은 새 요청이 만들어질 때만 pairing 메시지를 보냅니다(발신자당 대략 1시간에 한 번).
- 대기 중인 DM pairing 요청은 기본적으로 **채널당 3개**로 제한되며, 하나가 만료되거나 승인되기 전까지 추가 요청은 무시됩니다.

### 발신자 승인

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

지원 채널: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`, `feishu`.

### 상태 저장 위치

`~/.openclaw/credentials/` 아래에 저장됩니다.

- 대기 요청: `<channel>-pairing.json`
- 승인된 allowlist 저장소:
  - 기본 계정: `<channel>-allowFrom.json`
  - 비기본 계정: `<channel>-<accountId>-allowFrom.json`

계정 범위 동작:

- 비기본 계정은 자기 범위의 allowlist 파일만 읽고 씁니다.
- 기본 계정은 채널 범위의 비스코프 allowlist 파일을 사용합니다.

이 파일들은 민감 정보로 취급하세요(어시스턴트 접근을 제어합니다).

## 2) 노드 디바이스 pairing (iOS/Android/macOS/headless 노드)

노드는 `role: node`를 가진 **디바이스**로 Gateway에 연결됩니다. Gateway는
반드시 승인해야 하는 device pairing 요청을 생성합니다.

### Telegram으로 pairing하기(iOS 권장)

`device-pair` 플러그인을 사용하면 첫 device pairing 전체를 Telegram에서 처리할 수 있습니다.

1. Telegram에서 봇에게 `/pair`를 보냅니다.
2. 봇이 두 개의 메시지로 응답합니다. 안내 메시지 하나와 별도의 **setup code** 메시지 하나입니다(Telegram에서 복사/붙여넣기 쉬움).
3. 휴대폰에서 OpenClaw iOS 앱 → Settings → Gateway를 엽니다.
4. setup code를 붙여 넣고 연결합니다.
5. Telegram으로 돌아가 `/pair approve`를 보냅니다.

setup code는 다음을 담은 base64 인코딩 JSON payload입니다.

- `url`: Gateway WebSocket URL (`ws://...` 또는 `wss://...`)
- `token`: 수명이 짧은 pairing token

유효한 동안에는 setup code를 비밀번호처럼 다루세요.

### 노드 디바이스 승인

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### 노드 pairing 상태 저장

`~/.openclaw/devices/` 아래에 저장됩니다.

- `pending.json` (수명 짧음, 대기 요청은 만료됨)
- `paired.json` (pairing된 디바이스 + 토큰)

### 참고

- 레거시 `node.pair.*` API(CLI: `openclaw nodes pending/approve`)는
  gateway가 소유하는 별도 pairing 저장소입니다. WS 노드는 여전히 device pairing이 필요합니다.

## 관련 문서

- 보안 모델 + prompt injection: [Security](/gateway/security)
- 안전한 업데이트(doctor 실행): [Updating](/install/updating)
- 채널 구성:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
