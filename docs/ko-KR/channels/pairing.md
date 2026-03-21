---
summary: "페어링 개요: 누가 DM을 보낼 수 있는지와 어떤 노드가 참여할 수 있는지 승인"
read_when:
  - DM 접근 제어를 설정할 때
  - 새 iOS/Android node를 페어링할 때
  - OpenClaw 보안 구성을 검토할 때
title: "Pairing"
description: "DM 발신자 승인과 node device 승인을 포함한 OpenClaw의 pairing 절차, 저장 위치, 승인 명령을 설명합니다."
x-i18n:
  source_path: "channels/pairing.md"
---

# 페어링

"페어링"은 OpenClaw의 명시적인 **owner approval** 단계입니다.
이 과정은 두 곳에서 사용됩니다.

1. **DM pairing** (누가 bot과 대화할 수 있는지)
2. **Node pairing** (어떤 device/node가 gateway network에 참여할 수 있는지)

보안 맥락: [Security](/gateway/security)

## 1) DM pairing (inbound chat access)

채널의 DM policy가 `pairing`으로 설정되어 있으면, 알 수 없는 sender는 짧은
code를 받으며 승인 전까지 그 메시지는 **처리되지 않습니다**.

기본 DM policy는 여기 문서화되어 있습니다: [Security](/gateway/security)

Pairing code:

- 8자, 대문자, 혼동되는 문자 없음 (`0O1I`).
- **1시간 후 만료**됩니다. bot은 새 요청이 생성될 때만 pairing message를
  보냅니다(대략 sender당 시간당 1회).
- 대기 중인 DM pairing request는 기본적으로 **채널당 3개**로 제한됩니다.
  하나가 만료되거나 승인되기 전까지 추가 요청은 무시됩니다.

### 발신자 승인

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

지원 채널: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`, `feishu`.

### 상태 저장 위치

`~/.openclaw/credentials/` 아래에 저장됩니다.

- Pending requests: `<channel>-pairing.json`
- Approved allowlist store:
  - Default account: `<channel>-allowFrom.json`
  - Non-default account: `<channel>-<accountId>-allowFrom.json`

Account 범위 동작:

- non-default account는 자신의 scoped allowlist file만 읽고 씁니다.
- default account는 채널 범위의 unscoped allowlist file을 사용합니다.

이 파일들은 assistant 접근을 제어하므로 민감 정보로 취급하세요.

## 2) Node device pairing (iOS/Android/macOS/headless nodes)

Node는 `role: node`를 가진 **device**로 Gateway에 연결됩니다. Gateway는
승인이 필요한 device pairing request를 생성합니다.

### Telegram으로 pair하기(iOS 권장)

`device-pair` plugin을 사용하면 Telegram만으로 처음 device pairing을 진행할 수
있습니다.

1. Telegram에서 bot에게 `/pair`를 보냅니다.
2. bot은 안내 메시지 하나와 별도의 **setup code** 메시지 하나를 답장합니다
   (Telegram에서 복사/붙여넣기 쉽도록 분리됨).
3. 휴대폰에서 OpenClaw iOS app → Settings → Gateway를 엽니다.
4. setup code를 붙여넣고 연결합니다.
5. 다시 Telegram으로 돌아가 `/pair approve`

setup code는 다음을 포함한 base64 인코딩 JSON payload입니다.

- `url`: Gateway WebSocket URL (`ws://...` 또는 `wss://...`)
- `token`: 짧게 유지되는 pairing token

유효한 동안 setup code는 비밀번호처럼 취급하세요.

### Node device 승인

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### Node pairing 상태 저장

`~/.openclaw/devices/` 아래에 저장됩니다.

- `pending.json` (short-lived; pending request는 만료됨)
- `paired.json` (paired device + token)

### 참고

- 레거시 `node.pair.*` API(CLI: `openclaw nodes pending/approve`)는 별도의
  gateway-owned pairing store입니다. WS node도 여전히 device pairing이 필요합니다.

## 관련 문서

- 보안 모델 + prompt injection: [Security](/gateway/security)
- 안전한 업데이트(run doctor): [Updating](/install/updating)
- 채널 설정:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
