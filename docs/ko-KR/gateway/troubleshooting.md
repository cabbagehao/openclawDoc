---
title: Troubleshooting
description: Gateway, 채널, 자동화, 노드, 브라우저 문제를 증상별 명령과 로그 시그니처로 진단하는 심층 가이드입니다.
summary: Gateway, 채널, 자동화, 노드, 브라우저용 심층 문제 해결 런북
read_when:
  - troubleshooting 허브가 더 깊은 진단을 위해 이 문서로 안내했을 때
  - 증상별 런북과 정확한 명령이 필요할 때
x-i18n:
  source_path: gateway/troubleshooting.md
---

# Gateway 문제 해결

이 문서는 심층 런북입니다.
먼저 빠른 triage 흐름이 필요하다면 [/help/troubleshooting](/help/troubleshooting)부터 시작하세요.

## 명령 사다리

다음 명령을 이 순서대로 먼저 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 신호:

- `openclaw gateway status`에 `Runtime: running`, `RPC probe: ok`가 표시됨
- `openclaw doctor`가 blocking config/service issue가 없다고 보고함
- `openclaw channels status --probe`가 채널을 connected/ready로 표시함

## Anthropic 429: 긴 컨텍스트에 추가 사용량 필요

로그나 오류에 다음이 포함될 때 사용합니다.
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

확인할 것:

- 선택된 Anthropic Opus/Sonnet 모델에 `params.context1m: true`가 설정되어 있는지
- 현재 Anthropic credential이 long-context 사용 대상인지
- 1M beta path가 필요한 긴 세션/모델 실행에서만 실패하는지

해결 방법:

1. 해당 모델의 `context1m`을 꺼서 일반 context window로 fallback합니다.
2. 과금 가능한 Anthropic API key를 사용하거나 subscription account에서 Anthropic Extra Usage를 활성화합니다.
3. Anthropic long-context 요청이 거부돼도 계속 실행되도록 fallback model을 구성합니다.

관련 문서:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 응답이 없음

채널은 올라와 있지만 답변이 없다면, 무엇이든 다시 연결하기 전에 routing과 policy부터 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

확인할 것:

- DM sender의 pairing이 pending인지
- 그룹 mention gating(`requireMention`, `mentionPatterns`)이 걸려 있는지
- 채널/그룹 allowlist가 맞는지

자주 보이는 시그니처:

- `drop guild message (mention required` -> mention 전에는 그룹 메시지를 무시함
- `pairing request` -> sender 승인 필요
- `blocked` / `allowlist` -> sender/channel이 정책에 의해 필터링됨

관련 문서:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Dashboard / Control UI 연결 문제

dashboard 또는 Control UI가 연결되지 않으면 URL, auth mode, secure context 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

확인할 것:

- probe URL과 dashboard URL이 맞는지
- client와 gateway의 auth mode/token이 일치하는지
- device identity가 필요한데 HTTP를 쓰고 있지는 않은지

자주 보이는 시그니처:

- `device identity required` -> secure context가 아니거나 device auth가 없음
- `device nonce required` / `device nonce mismatch` -> client가 challenge 기반 device auth flow(`connect.challenge` + `device.nonce`)를 완료하지 못함
- `device signature invalid` / `device signature expired` -> 현재 handshake에 대해 잘못된 payload를 서명했거나 timestamp가 오래됨
- `AUTH_TOKEN_MISMATCH`와 `canRetryWithDeviceToken=true` -> cached device token으로 신뢰된 재시도 1회를 할 수 있음
- 그 재시도 뒤에도 `unauthorized`가 반복됨 -> shared token/device token drift 가능성. token config를 새로 맞추고 device token을 재승인/rotate해야 할 수 있음
- `gateway connect failed:` -> host/port/url 대상이 틀림

### Auth detail code 빠른 매핑

실패한 `connect` 응답의 `error.details.code`를 보고 다음 조치를 고르세요.

| Detail code | 의미 | 권장 조치 |
| --- | --- | --- |
| `AUTH_TOKEN_MISSING` | client가 필수 shared token을 보내지 않음 | client에 token을 넣고 다시 시도합니다. dashboard 경로라면 `openclaw config get gateway.auth.token`으로 확인한 뒤 Control UI 설정에 붙여 넣으세요. |
| `AUTH_TOKEN_MISMATCH` | shared token이 gateway auth token과 다름 | `canRetryWithDeviceToken=true`면 신뢰된 재시도 1회를 허용하세요. 그래도 실패하면 [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | cached per-device token이 오래됐거나 폐기됨 | [devices CLI](/cli/devices)로 device token을 rotate/re-approve한 뒤 다시 연결하세요. |
| `PAIRING_REQUIRED` | device identity는 알려져 있지만 이 role에는 아직 승인되지 않음 | `openclaw devices list` 후 `openclaw devices approve <requestId>`로 승인하세요. |

Device auth v2 migration 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/signature 오류가 보이면, 연결 client를 업데이트하고 다음을 확인하세요.

1. `connect.challenge`를 기다리는지
2. challenge에 바인딩된 payload에 서명하는지
3. 같은 challenge nonce를 `connect.params.device.nonce`로 보내는지

관련 문서:

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 서비스가 실행되지 않음

서비스는 설치됐지만 프로세스가 유지되지 않을 때 사용합니다.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

확인할 것:

- `Runtime: stopped`와 함께 exit hint가 나오는지
- service config mismatch가 있는지 (`Config (cli)` vs `Config (service)`)
- port/listener 충돌이 있는지

자주 보이는 시그니처:

- `Gateway start blocked: set gateway.mode=local` -> local gateway mode가 활성화되지 않음. config에서 `gateway.mode="local"`로 바꾸거나 `openclaw configure`를 실행하세요. Podman의 전용 `openclaw` 사용자로 실행 중이면 config는 `~openclaw/.openclaw/openclaw.json`에 있습니다.
- `refusing to bind gateway ... without auth` -> non-loopback bind인데 token/password가 없음
- `another gateway instance is already listening` / `EADDRINUSE` -> port 충돌

관련 문서:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## 채널은 연결됐지만 메시지가 흐르지 않음

채널 상태는 connected인데 메시지 흐름이 멈췄다면, policy와 permission, 채널별 delivery rule에 집중하세요.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

확인할 것:

- DM policy(`pairing`, `allowlist`, `open`, `disabled`)
- 그룹 allowlist와 mention requirement
- 채널 API permission/scope 누락

자주 보이는 시그니처:

- `mention required` -> 그룹 mention policy 때문에 무시됨
- `pairing` / pending approval trace -> sender가 아직 승인되지 않음
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` -> channel auth/permission 이슈

관련 문서:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Cron / heartbeat 전달 문제

cron이나 heartbeat가 실행되지 않았거나 전달되지 않았다면, 먼저 scheduler 상태를 보고 그다음 delivery target을 확인하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

확인할 것:

- cron이 활성화되어 있고 next wake가 존재하는지
- job run history 상태가 `ok`, `skipped`, `error` 중 무엇인지
- heartbeat skip reason이 `quiet-hours`, `requests-in-flight`, `alerts-disabled` 중 어떤 것인지

자주 보이는 시그니처:

- `cron: scheduler disabled; jobs will not run automatically` -> cron 비활성화
- `cron: timer tick failed` -> scheduler tick 실패. 파일/로그/런타임 오류를 확인
- `heartbeat skipped`와 `reason=quiet-hours` -> active hours 바깥
- `heartbeat: unknown accountId` -> heartbeat delivery target의 account id가 잘못됨
- `heartbeat skipped`와 `reason=dm-blocked` -> heartbeat 대상이 DM 스타일 목적지로 해석됐지만 `agents.defaults.heartbeat.directPolicy` 또는 agent override가 `block`

관련 문서:

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## 페어링된 node에서 도구가 실패함

node는 paired 상태인데 도구가 실패한다면 foreground, permission, approval 상태를 분리해서 보세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

확인할 것:

- node가 online이며 기대한 capability를 갖고 있는지
- camera/mic/location/screen에 대한 OS permission이 부여됐는지
- exec approval과 allowlist 상태

자주 보이는 시그니처:

- `NODE_BACKGROUND_UNAVAILABLE` -> node app이 foreground에 있어야 함
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` -> OS permission 부족
- `SYSTEM_RUN_DENIED: approval required` -> exec approval 대기 중
- `SYSTEM_RUN_DENIED: allowlist miss` -> allowlist에 없는 명령

관련 문서:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## 브라우저 도구 실패

gateway 자체는 정상이지만 browser tool action만 실패할 때 사용합니다.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

확인할 것:

- 유효한 browser executable path
- CDP profile reachability
- `profile="chrome"`일 때 extension relay tab attachment

자주 보이는 시그니처:

- `Failed to start Chrome CDP on port` -> browser process가 시작하지 못함
- `browser.executablePath not found` -> 설정된 경로가 잘못됨
- `Chrome extension relay is running, but no tab is connected` -> extension relay가 탭에 붙지 못함
- `Browser attachOnly is enabled ... not reachable` -> attach-only profile에 연결 가능한 target이 없음

관련 문서:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/chrome-extension](/tools/chrome-extension)
- [/tools/browser](/tools/browser)

## 업그레이드 후 갑자기 문제가 생겼을 때

업그레이드 직후 깨지는 문제는 대부분 config drift이거나, 이전에는 느슨했던 기본값이 이제 엄격하게 강제되는 경우입니다.

### 1) Auth와 URL override 동작이 바뀜

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

확인할 것:

- `gateway.mode=remote`라면 CLI call이 local 서비스가 아니라 remote를 보고 있을 수 있음
- 명시적인 `--url` 호출은 저장된 credential로 fallback하지 않음

자주 보이는 시그니처:

- `gateway connect failed:` -> URL 대상이 틀림
- `unauthorized` -> endpoint에는 닿았지만 auth가 틀림

### 2) Bind와 auth 가드레일이 더 엄격해짐

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

확인할 것:

- non-loopback bind(`lan`, `tailnet`, `custom`)에는 auth가 필요함
- 예전 키인 `gateway.token`은 `gateway.auth.token`을 대체하지 않음

자주 보이는 시그니처:

- `refusing to bind gateway ... without auth` -> bind와 auth 조합이 맞지 않음
- `RPC probe: failed`인데 runtime은 running -> gateway는 살아 있지만 현재 auth/url로는 접근 불가

### 3) Pairing과 device identity 상태가 바뀜

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

확인할 것:

- dashboard/node에 대해 pending device approval이 있는지
- policy나 identity 변경 뒤 DM pairing approval이 다시 필요한지

자주 보이는 시그니처:

- `device identity required` -> device auth가 충족되지 않음
- `pairing required` -> sender/device 승인이 필요함

서비스 config와 runtime이 여전히 어긋나 있으면, 같은 profile/state directory를 기준으로 service metadata를 다시 설치하세요.

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 문서:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
