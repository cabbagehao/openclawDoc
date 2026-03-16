---
summary: "signal-cli 기반 Signal 연동 방식, 설정 경로, 번호 모델 요약"
description: "OpenClaw에서 Signal 채널을 설정하는 방법, `signal-cli` 연동 구조, 접근 제어, 문제 해결 절차를 간단히 정리합니다."
read_when:
  - Signal 지원을 설정할 때
  - Signal 송수신 문제를 디버깅할 때
title: "Signal"
x-i18n:
  source_path: "channels/signal.md"
---

# Signal (signal-cli)

Status: external CLI integration. Gateway는 `signal-cli`와 HTTP JSON-RPC + SSE로 통신합니다.

## Prerequisites

- 서버에 OpenClaw가 설치되어 있어야 합니다(아래 Linux 흐름은 Ubuntu 24에서 테스트됨).
- gateway가 실행되는 host에서 `signal-cli`를 사용할 수 있어야 합니다.
- SMS 등록 경로를 사용할 경우, verification SMS를 한 번 받을 수 있는 전화번호가 필요합니다.
- 등록 중 Signal captcha(`signalcaptchas.org`)를 처리할 수 있도록 브라우저 접근이 필요합니다.

## Quick setup (beginner)

1. bot에는 **별도의 Signal 번호**를 사용하는 것을 권장합니다.
2. `signal-cli`를 설치합니다(JVM build를 쓴다면 Java 필요).
3. 설정 경로 하나를 선택합니다.
   - **Path A (QR link):** `signal-cli link -n "OpenClaw"`를 실행하고 Signal로 스캔합니다.
   - **Path B (SMS register):** captcha + SMS verification으로 전용 번호를 등록합니다.
4. OpenClaw를 설정하고 gateway를 재시작합니다.
5. 첫 DM을 보낸 뒤 pairing을 승인합니다(`openclaw pairing approve signal <CODE>`).

Minimal config:

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

Field reference:

| Field       | Description                                       |
| ----------- | ------------------------------------------------- |
| `account`   | Bot phone number in E.164 format (`+15551234567`) |
| `cliPath`   | Path to `signal-cli` (`signal-cli` if on `PATH`)  |
| `dmPolicy`  | DM access policy (`pairing` recommended)          |
| `allowFrom` | Phone numbers or `uuid:<id>` values allowed to DM |

## What it is

- `signal-cli`를 통한 Signal 채널입니다(embedded libsignal 아님).
- routing은 deterministic합니다. 응답은 항상 Signal로 다시 돌아갑니다.
- DMs는 agent의 main session을 공유하고, groups는 격리됩니다(`agent:<agentId>:signal:group:<groupId>`).

## Config writes

기본적으로 Signal은 `/config set|unset`으로 트리거된 config update 쓰기를 허용합니다(`commands.config: true` 필요).

다음으로 비활성화할 수 있습니다.

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## The number model (important)

- gateway는 **Signal device**(`signal-cli` account)에 연결됩니다.
- bot을 **개인 Signal account**에서 실행하면, 자신의 메시지는 loop protection 때문에 무시됩니다.
- "내가 bot에 문자 보내고 bot이 답하게" 하려면 **별도의 bot 번호**를 사용하세요.

## Setup path A: link existing Signal account (QR)

1. `signal-cli`를 설치합니다(JVM 또는 native build).
2. bot account를 link합니다.
   - `signal-cli link -n "OpenClaw"`를 실행한 뒤 Signal에서 QR을 스캔합니다.
3. Signal을 설정하고 gateway를 시작합니다.

Example:

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

multi-account도 지원합니다. `channels.signal.accounts`에 account별 config와 optional `name`을 둡니다. 공통 패턴은 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)을 참고하세요.

## Setup path B: register dedicated bot number (SMS, Linux)

기존 Signal app account를 link하지 않고 전용 bot 번호를 쓰고 싶을 때 사용하는 방식입니다.

1. SMS를 받을 수 있는 번호를 준비합니다(유선전화는 voice verification도 가능).
   - account/session 충돌을 피하려면 전용 bot 번호를 사용하세요.
2. gateway host에 `signal-cli`를 설치합니다.

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM build(`signal-cli-${VERSION}.tar.gz`)를 쓴다면 먼저 JRE 25+를 설치하세요.
Signal server API가 바뀌면 오래된 release가 깨질 수 있으므로 `signal-cli`를 계속 업데이트해야 합니다.

3. 번호를 등록하고 검증합니다.

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha가 필요하다면:

1. `https://signalcaptchas.org/registration/generate.html`을 엽니다.
2. captcha를 완료한 뒤, "Open Signal"의 `signalcaptcha://...` link target을 복사합니다.
3. 가능하면 브라우저 세션과 같은 external IP에서 실행합니다.
4. captcha token은 빨리 만료되므로, 바로 다시 registration을 실행합니다.

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw를 설정하고 gateway를 재시작한 뒤 채널을 확인합니다.

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. DM sender를 pairing합니다.
   - bot 번호로 아무 메시지나 보냅니다.
   - 서버에서 code를 승인합니다: `openclaw pairing approve signal <PAIRING_CODE>`.
   - 휴대폰에서 "Unknown contact"를 피하려면 bot 번호를 연락처로 저장합니다.

중요: `signal-cli`로 전화번호 account를 등록하면, 그 번호의 기존 Signal app session이 인증 해제될 수 있습니다. 기존 휴대폰 app 구성을 유지해야 한다면 전용 bot 번호를 쓰거나 QR link mode를 선택하세요.

Upstream references:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Linking flow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## External daemon mode (httpUrl)

`signal-cli`를 직접 관리하고 싶다면(slow JVM cold starts, container init, shared CPUs 등), daemon을 따로 실행하고 OpenClaw가 그쪽을 보게 할 수 있습니다.

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

이렇게 하면 OpenClaw 내부의 auto-spawn과 startup wait를 건너뜁니다. auto-spawn을 쓰되 시작이 느리다면 `channels.signal.startupTimeoutMs`를 설정하세요.

## Access control (DMs + groups)

DMs:

- 기본값: `channels.signal.dmPolicy = "pairing"`.
- 알 수 없는 sender는 pairing code를 받고, 승인될 때까지 메시지는 무시됩니다(code는 1시간 후 만료).
- 승인 명령:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- pairing은 Signal DMs의 기본 token exchange 방식입니다. 자세한 내용: [Pairing](/channels/pairing)
- `sourceUuid`만 있는 sender는 `channels.signal.allowFrom`에 `uuid:<id>` 형태로 저장됩니다.

Groups:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`은 `allowlist`일 때 누가 그룹에서 트리거할 수 있는지 제어합니다.
- runtime 참고: `channels.signal` 블록 전체가 없으면, `channels.defaults.groupPolicy`가 있어도 group check는 `groupPolicy="allowlist"`로 fallback합니다.

## How it works (behavior)

- `signal-cli`는 daemon으로 실행되고, gateway는 SSE로 이벤트를 읽습니다.
- inbound message는 공통 channel envelope로 정규화됩니다.
- 응답은 항상 같은 번호 또는 같은 그룹으로 돌아갑니다.

## Media + limits

- outbound text는 `channels.signal.textChunkLimit`(기본값 4000) 기준으로 chunking됩니다.
- optional newline chunking: `channels.signal.chunkMode="newline"`으로 설정하면 길이 기준 chunking 전에 빈 줄 단위(문단 경계)로 나눕니다.
- attachment를 지원합니다(`signal-cli`에서 base64로 가져옴).
- 기본 media cap: `channels.signal.mediaMaxMb`(기본값 8).
- media 다운로드를 건너뛰려면 `channels.signal.ignoreAttachments`를 사용합니다.
- group history context는 `channels.signal.historyLimit`(또는 `channels.signal.accounts.*.historyLimit`)을 사용하고, 없으면 `messages.groupChat.historyLimit`으로 fallback합니다. 비활성화하려면 `0`으로 설정합니다(기본값 50).

## Typing + read receipts

- **Typing indicators**: OpenClaw는 `signal-cli sendTyping`으로 typing signal을 보내고, 응답 생성 중에는 이를 갱신합니다.
- **Read receipts**: `channels.signal.sendReadReceipts`가 true이면 허용된 DM에 대해 read receipt를 전달합니다.
- Signal-cli는 group의 read receipt는 제공하지 않습니다.

## Reactions (message tool)

- `channel=signal`로 `message action=react`를 사용합니다.
- 대상은 sender의 E.164 또는 UUID입니다(pairing output의 `uuid:<id>` 사용, bare UUID도 가능).
- `messageId`는 reaction 대상 메시지의 Signal timestamp입니다.
- group reaction에는 `targetAuthor` 또는 `targetAuthorUuid`가 필요합니다.

Examples:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Config:

- `channels.signal.actions.reactions`: reaction action enable/disable(기본값 true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`는 agent reaction을 비활성화합니다(`message tool react`는 오류 반환).
  - `minimal`/`extensive`는 agent reaction을 활성화하고 guidance level을 설정합니다.
- account별 override: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Delivery targets (CLI/cron)

- DMs: `signal:+15551234567`(또는 plain E.164).
- UUID DMs: `uuid:<id>`(또는 bare UUID).
- Groups: `signal:group:<groupId>`.
- Usernames: `username:<name>`(계정이 지원하는 경우).

## Troubleshooting

먼저 이 순서대로 확인하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그다음 필요하면 DM pairing 상태를 확인합니다.

```bash
openclaw pairing list signal
```

자주 발생하는 문제:

- daemon에는 연결되지만 reply가 없음: `httpUrl`, `account`, receive mode 등 account/daemon 설정을 확인하세요.
- DMs가 무시됨: sender가 pairing 승인 대기 상태입니다.
- group message가 무시됨: group sender 제한 또는 mention gating 때문에 전달이 막힙니다.
- 편집 후 config validation error가 남음: `openclaw doctor --fix`를 실행하세요.
- diagnostics에 Signal이 보이지 않음: `channels.signal.enabled: true`인지 확인하세요.

추가 점검:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

분류 흐름은 [/channels/troubleshooting](/channels/troubleshooting)을 참고하세요.

## Security notes

- `signal-cli`는 account key를 로컬에 저장합니다(보통 `~/.local/share/signal-cli/data/`).
- 서버를 옮기거나 재구성하기 전에 Signal account state를 백업하세요.
- DM access를 넓게 열 의도가 없다면 `channels.signal.dmPolicy: "pairing"`을 유지하세요.
- SMS verification은 등록이나 복구 시에만 필요하지만, 번호나 account 제어권을 잃으면 재등록이 복잡해질 수 있습니다.

## Configuration reference (Signal)

전체 설정 문서: [Configuration](/gateway/configuration)

Provider options:

- `channels.signal.enabled`: 채널 시작 enable/disable.
- `channels.signal.account`: bot account의 E.164.
- `channels.signal.cliPath`: `signal-cli` 경로.
- `channels.signal.httpUrl`: 전체 daemon URL(host/port보다 우선).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bind(default `127.0.0.1:8080`).
- `channels.signal.autoStart`: daemon auto-spawn(`httpUrl`이 없으면 기본값 true).
- `channels.signal.startupTimeoutMs`: 시작 대기 timeout(ms, 최대 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: attachment 다운로드 건너뛰기.
- `channels.signal.ignoreStories`: daemon의 stories 무시.
- `channels.signal.sendReadReceipts`: read receipt 전달.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing).
- `channels.signal.allowFrom`: DM allowlist(E.164 또는 `uuid:<id>`). `open`에는 `"*"`가 필요합니다. Signal에는 username이 없으므로 phone/UUID id를 사용합니다.
- `channels.signal.groupPolicy`: `open | allowlist | disabled`(기본값: allowlist).
- `channels.signal.groupAllowFrom`: group sender allowlist.
- `channels.signal.historyLimit`: context에 포함할 최대 group message 수(`0`이면 비활성화).
- `channels.signal.dmHistoryLimit`: user turn 기준 DM history limit. user별 override: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: outbound chunk 크기(chars).
- `channels.signal.chunkMode`: `length`(기본값) 또는 `newline`. 길이 기준 chunking 전에 빈 줄 단위(문단 경계)로 나눕니다.
- `channels.signal.mediaMaxMb`: inbound/outbound media cap(MB).

Related global options:

- `agents.list[].groupChat.mentionPatterns`(Signal은 native mention을 지원하지 않음).
- `messages.groupChat.mentionPatterns`(global fallback).
- `messages.responsePrefix`.
