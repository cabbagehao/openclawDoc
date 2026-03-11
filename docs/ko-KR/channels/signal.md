---
summary: "signal-cli(JSON-RPC + SSE)를 통한 Signal 지원, 설정 경로, 번호 모델"
read_when:
  - Signal 지원을 설정할 때
  - Signal 송수신을 디버깅할 때
title: "Signal"
---

# Signal (signal-cli)

상태: 외부 CLI 연동입니다. Gateway는 HTTP JSON-RPC + SSE를 통해 `signal-cli`와 통신합니다.

## Prerequisites

- 서버에 OpenClaw가 설치되어 있어야 합니다 (아래 Linux 흐름은 Ubuntu 24에서 테스트됨).
- gateway가 실행되는 host에 `signal-cli`를 사용할 수 있어야 합니다.
- SMS 등록 경로를 쓸 경우, verification SMS를 한 번 받을 수 있는 전화번호가 필요합니다.
- 등록 중 Signal captcha(`signalcaptchas.org`)를 열 수 있는 브라우저 접근이 필요합니다.

## Quick setup (beginner)

1. bot에는 **별도의 Signal 번호**를 사용하세요 (권장).
2. `signal-cli`를 설치합니다 (`JVM` 빌드를 쓰는 경우 Java 필요).
3. 설정 경로를 하나 선택합니다:
   - **Path A (QR link):** `signal-cli link -n "OpenClaw"`를 실행하고 Signal로 스캔합니다.
   - **Path B (SMS register):** captcha + SMS verification으로 전용 번호를 등록합니다.
4. OpenClaw를 구성하고 gateway를 재시작합니다.
5. 첫 DM을 보내고 pairing을 승인합니다 (`openclaw pairing approve signal <CODE>`).

최소 config:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

필드 참고:

| Field       | Description                                       |
| ----------- | ------------------------------------------------- |
| `account`   | E.164 형식의 bot 전화번호 (`+15551234567`)        |
| `cliPath`   | `signal-cli` 경로 (`PATH`에 있으면 `signal-cli`)  |
| `dmPolicy`  | DM 접근 정책 (`pairing` 권장)                     |
| `allowFrom` | DM을 허용할 전화번호 또는 `uuid:<id>` 값          |

## What it is

- Signal 채널은 `signal-cli`를 통해 동작합니다 (내장 `libsignal` 아님).
- 결정적 라우팅: reply는 항상 Signal로 다시 돌아갑니다.
- DM은 agent의 main session을 공유하고, group은 분리됩니다 (`agent:<agentId>:signal:group:<groupId>`).

## Config writes

기본적으로 Signal은 `/config set|unset`으로 트리거된 config update 쓰기를 허용합니다 (`commands.config: true` 필요).

다음으로 비활성화할 수 있습니다:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## The number model (important)

- gateway는 **Signal device**(`signal-cli` account)에 연결됩니다.
- bot을 **개인 Signal account**에서 실행하면 자신의 메시지는 무시합니다(loop protection).
- “내가 bot에게 문자 보내고 bot이 답장한다”는 흐름을 원하면 **별도의 bot 번호**를 사용하세요.

## Setup path A: link existing Signal account (QR)

1. `signal-cli`를 설치합니다 (JVM 또는 native build).
2. bot account를 link합니다:
   - `signal-cli link -n "OpenClaw"`를 실행한 뒤 Signal에서 QR을 스캔합니다.
3. Signal을 구성하고 gateway를 시작합니다.

예시:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

멀티 account 지원: `channels.signal.accounts`에 account별 config와 선택적 `name`을 사용하세요. 공통 패턴은 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)을 참고하세요.

## Setup path B: register dedicated bot number (SMS, Linux)

기존 Signal app account를 link하는 대신 전용 bot 번호를 원할 때 사용합니다.

1. SMS를 받을 수 있는 번호를 준비합니다(유선 번호의 경우 음성 verification도 가능).
   - account/session 충돌을 피하려면 전용 bot 번호를 사용하세요.
2. gateway host에 `signal-cli`를 설치합니다:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

`JVM` 빌드(`signal-cli-${VERSION}.tar.gz`)를 쓴다면 먼저 JRE 25+를 설치하세요.
`signal-cli`는 계속 업데이트하세요. upstream에 따르면 Signal server API가 바뀌면 오래된 release는 깨질 수 있습니다.

3. 번호를 등록하고 검증합니다:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha가 필요하다면:

1. `https://signalcaptchas.org/registration/generate.html`을 엽니다.
2. captcha를 완료하고 "Open Signal"의 `signalcaptcha://...` 링크 대상을 복사합니다.
3. 가능하면 브라우저 세션과 같은 외부 IP에서 실행하세요.
4. 바로 다시 등록을 실행합니다(captcha token은 빨리 만료됨):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw를 구성하고 gateway를 재시작한 뒤, channel을 검증합니다:

```bash
# gateway를 사용자 systemd service로 실행하는 경우:
systemctl --user restart openclaw-gateway

# 그런 다음 확인:
openclaw doctor
openclaw channels status --probe
```

5. DM sender를 pair합니다:
   - bot 번호로 아무 메시지나 보냅니다.
   - 서버에서 code를 승인합니다: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Unknown contact"를 피하려면 휴대폰에서 bot 번호를 연락처로 저장하세요.

중요: `signal-cli`로 전화번호 account를 등록하면 해당 번호의 기본 Signal app session이 인증 해제될 수 있습니다. 기존 휴대폰 app 구성을 유지해야 한다면 전용 bot 번호를 쓰거나 QR link mode를 선호하세요.

upstream 참고 자료:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Linking flow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## External daemon mode (httpUrl)

`signal-cli`를 직접 관리하고 싶다면(slow JVM cold start, container init, 또는 shared CPU), daemon을 별도로 실행하고 OpenClaw가 그쪽을 보게 하세요:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

이렇게 하면 OpenClaw 내부의 auto-spawn과 startup wait를 건너뜁니다. auto-spawn 시 시작이 느리다면 `channels.signal.startupTimeoutMs`를 설정하세요.

## Access control (DMs + groups)

DM:

- 기본값: `channels.signal.dmPolicy = "pairing"`.
- 알 수 없는 sender는 pairing code를 받고, 승인 전까지 메시지는 무시됩니다(code는 1시간 후 만료).
- 승인 방법:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing은 Signal DM의 기본 token 교환 방식입니다. 자세한 내용: [Pairing](/channels/pairing)
- UUID-only sender(`sourceUuid`에서 옴)는 `channels.signal.allowFrom`에 `uuid:<id>`로 저장됩니다.

Group:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`은 `allowlist`가 설정되었을 때 group에서 누가 trigger할 수 있는지 제어합니다.
- 런타임 참고: `channels.signal`이 완전히 없으면, group 검사에서 런타임은 `groupPolicy="allowlist"`로 fallback합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 동일).

## How it works (behavior)

- `signal-cli`는 daemon으로 실행되고, gateway는 SSE를 통해 event를 읽습니다.
- 인바운드 메시지는 공통 channel envelope로 정규화됩니다.
- reply는 항상 같은 번호 또는 group으로 라우팅됩니다.

## Media + limits

- 아웃바운드 텍스트는 `channels.signal.textChunkLimit`(기본값 4000)에 맞춰 chunk됩니다.
- 선택적 newline chunking: 길이 기준 chunking 전에 빈 줄(문단 경계)에서 나누려면 `channels.signal.chunkMode="newline"`을 설정하세요.
- 첨부 파일 지원됨 (`signal-cli`에서 가져온 base64 사용).
- 기본 media 상한: `channels.signal.mediaMaxMb` (기본값 8).
- media 다운로드를 건너뛰려면 `channels.signal.ignoreAttachments`를 사용하세요.
- Group history context는 `channels.signal.historyLimit`(또는 `channels.signal.accounts.*.historyLimit`)를 사용하고, `messages.groupChat.historyLimit`으로 fallback합니다. 비활성화하려면 `0`으로 설정하세요 (기본값 50).

## Typing + read receipts

- **Typing indicators**: OpenClaw는 `signal-cli sendTyping`으로 typing signal을 보내고, reply가 실행되는 동안 이를 갱신합니다.
- **Read receipts**: `channels.signal.sendReadReceipts`가 true이면 OpenClaw는 허용된 DM에 대한 read receipt를 전달합니다.
- Signal-cli는 group의 read receipt는 노출하지 않습니다.

## Reactions (message tool)

- `channel=signal`과 함께 `message action=react`를 사용하세요.
- 대상: sender E.164 또는 UUID (`uuid:<id>`를 pairing output에서 사용; bare UUID도 가능).
- `messageId`는 reaction 대상 메시지의 Signal timestamp입니다.
- Group reaction에는 `targetAuthor` 또는 `targetAuthorUuid`가 필요합니다.

예시:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Config:

- `channels.signal.actions.reactions`: reaction action 활성화/비활성화 (기본값 true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`는 agent reaction을 비활성화합니다 (`message tool`의 `react`는 오류 발생).
  - `minimal`/`extensive`는 agent reaction을 활성화하고 guidance level을 설정합니다.
- account별 override: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Delivery targets (CLI/cron)

- DM: `signal:+15551234567` (또는 일반 E.164).
- UUID DM: `uuid:<id>` (또는 bare UUID).
- Group: `signal:group:<groupId>`.
- Username: `username:<name>` (Signal account가 지원하는 경우).

## Troubleshooting

먼저 다음 순서로 실행하세요:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

필요하면 DM pairing 상태도 확인하세요:

```bash
openclaw pairing list signal
```

흔한 실패 원인:

- Daemon은 reachable하지만 reply가 없음: account/daemon 설정(`httpUrl`, `account`)과 receive mode를 확인하세요.
- DM이 무시됨: sender가 pairing 승인 대기 상태입니다.
- Group 메시지가 무시됨: group sender/mention gating이 전달을 막고 있습니다.
- 편집 후 config validation 오류: `openclaw doctor --fix`를 실행하세요.
- diagnostics에 Signal이 없음: `channels.signal.enabled: true`인지 확인하세요.

추가 확인:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

트리아지 흐름: [/channels/troubleshooting](/channels/troubleshooting).

## Security notes

- `signal-cli`는 account key를 로컬에 저장합니다(보통 `~/.local/share/signal-cli/data/`).
- 서버 migration 또는 rebuild 전에 Signal account 상태를 백업하세요.
- 더 넓은 DM access를 의도한 것이 아니라면 `channels.signal.dmPolicy: "pairing"`을 유지하세요.
- SMS verification은 등록 또는 복구 흐름에만 필요하지만, 번호/account에 대한 제어를 잃으면 재등록이 복잡해질 수 있습니다.

## Configuration reference (Signal)

전체 구성: [Configuration](/gateway/configuration)

Provider 옵션:

- `channels.signal.enabled`: channel startup 활성화/비활성화.
- `channels.signal.account`: bot account용 E.164.
- `channels.signal.cliPath`: `signal-cli` 경로.
- `channels.signal.httpUrl`: 전체 daemon URL (`host/port`보다 우선).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bind (기본값 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon auto-spawn (`httpUrl`이 없을 때 기본값 true).
- `channels.signal.startupTimeoutMs`: startup wait timeout(ms) (상한 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: attachment 다운로드 건너뛰기.
- `channels.signal.ignoreStories`: daemon의 story 무시.
- `channels.signal.sendReadReceipts`: read receipt 전달.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: pairing).
- `channels.signal.allowFrom`: DM allowlist (E.164 또는 `uuid:<id>`). `open`에는 `"*"`가 필요합니다. Signal에는 username이 없으므로 전화번호/UUID id를 사용하세요.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (기본값: allowlist).
- `channels.signal.groupAllowFrom`: group sender allowlist.
- `channels.signal.historyLimit`: context에 포함할 최대 group 메시지 수 (`0`이면 비활성화).
- `channels.signal.dmHistoryLimit`: user turn 기준 DM history 제한. 사용자별 override: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: 아웃바운드 chunk 크기(문자 수).
- `channels.signal.chunkMode`: `length`(기본값) 또는 `newline`. 길이 기준 chunking 전에 빈 줄(문단 경계)에서 나눕니다.
- `channels.signal.mediaMaxMb`: 인바운드/아웃바운드 media 상한(MB).

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns` (Signal은 native mention을 지원하지 않음).
- `messages.groupChat.mentionPatterns` (전역 fallback).
- `messages.responsePrefix`.
