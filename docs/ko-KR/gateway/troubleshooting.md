---
summary: "gateway, channels, automation, nodes, browser를 위한 심층 문제 해결 런북"
read_when:
  - troubleshooting 허브가 더 깊은 진단을 위해 이 페이지로 안내했을 때
  - 정확한 명령과 함께 안정적인 증상 기반 런북이 필요할 때
title: "문제 해결"
---

# Gateway 문제 해결

이 페이지는 심층 런북입니다.
빠른 triage 흐름이 먼저 필요하면 [/help/troubleshooting](/help/troubleshooting) 에서 시작하세요.

## 명령 순서

먼저 아래 명령을 이 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상적인 시그널:

- `openclaw gateway status` 에 `Runtime: running` 과 `RPC probe: ok` 가 표시됨
- `openclaw doctor` 가 차단성 config/service 이슈가 없다고 보고함
- `openclaw channels status --probe` 에 연결된/준비된 채널이 표시됨

<a id="anthropic-429-extra-usage-required-for-long-context"></a>
## Anthropic 429 extra usage required for long context

로그/오류에 다음이 포함될 때 사용하세요.
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

확인할 것:

- 선택된 Anthropic Opus/Sonnet 모델에 `params.context1m: true` 가 설정되어 있음
- 현재 Anthropic 자격 증명이 long-context 사용에 적합하지 않음
- 1M beta 경로가 필요한 긴 세션/모델 실행에서만 요청이 실패함

해결 방법:

1. 해당 모델의 `context1m` 을 비활성화해 일반 context window로 fallback
2. 과금 가능한 Anthropic API 키를 사용하거나 subscription 계정에서 Anthropic Extra Usage 활성화
3. Anthropic long-context 요청이 거부되어도 실행이 계속되도록 fallback model 구성

관련 문서:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

<a id="no-replies"></a>
## 응답이 없음

채널은 살아 있는데 아무 답이 없으면, 무엇이든 재연결하기 전에 먼저 routing과 policy를 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

확인할 것:

- DM 발신자에 대한 pairing이 pending 상태인지
- 그룹 mention gating(`requireMention`, `mentionPatterns`)
- 채널/그룹 allowlist 불일치

일반적인 시그니처:

- `drop guild message (mention required` → mention 전까지 그룹 메시지 무시
- `pairing request` → 발신자 승인이 필요함
- `blocked` / `allowlist` → 발신자/채널이 policy로 필터링됨

관련 문서:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

<a id="dashboard-control-ui-connectivity"></a>
## 대시보드 Control UI 연결 문제

dashboard/control UI가 연결되지 않으면 URL, auth mode, secure context 가정부터 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

확인할 것:

- 올바른 probe URL과 dashboard URL
- 클라이언트와 gateway 사이 auth mode/token 불일치
- device identity가 필요한 곳에서 HTTP를 쓰고 있지 않은지

일반적인 시그니처:

- `device identity required` → non-secure context 또는 device auth 누락
- `device nonce required` / `device nonce mismatch` → 클라이언트가 challenge 기반 device auth 흐름(`connect.challenge` + `device.nonce`)을 끝까지 수행하지 못함
- `device signature invalid` / `device signature expired` → 현재 핸드셰이크에 대해 잘못된 payload(또는 stale timestamp)에 서명함
- `unauthorized` / reconnect loop → token/password 불일치
- `gateway connect failed:` → host/port/url 대상이 잘못됨

Device auth v2 마이그레이션 점검:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/signature 오류가 보이면 연결 중인 클라이언트를 업데이트하고 다음을 확인하세요.

1. `connect.challenge` 를 기다린다
2. challenge에 바인딩된 payload에 서명한다
3. 같은 challenge nonce를 `connect.params.device.nonce` 로 보낸다

관련 문서:

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)

<a id="gateway-service-not-running"></a>
## Gateway 서비스가 실행되지 않음

서비스가 설치되어 있는데 프로세스가 유지되지 않을 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

확인할 것:

- 종료 힌트와 함께 `Runtime: stopped` 가 표시되는지
- 서비스 설정 불일치(`Config (cli)` vs `Config (service)`)
- 포트/리스너 충돌

일반적인 시그니처:

- `Gateway start blocked: set gateway.mode=local` → 로컬 gateway 모드가 활성화되지 않음. 해결: config에서 `gateway.mode="local"` 설정(또는 `openclaw configure` 실행). 전용 `openclaw` 사용자로 Podman에서 실행 중이라면 config는 `~openclaw/.openclaw/openclaw.json` 에 있습니다.
- `refusing to bind gateway ... without auth` → token/password 없이 non-loopback bind
- `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌

관련 문서:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

<a id="channel-connected-messages-not-flowing"></a>
## 채널은 연결됐지만 메시지가 흐르지 않음

채널 상태는 connected인데 메시지 흐름이 멈췄다면 policy, permissions, 채널별 delivery 규칙에 집중하세요.

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
- 누락된 channel API permission/scope

일반적인 시그니처:

- `mention required` → 그룹 mention policy로 메시지 무시
- `pairing` / pending approval trace → 발신자가 아직 승인되지 않음
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 채널 인증/권한 문제

관련 문서:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

<a id="cron-and-heartbeat-delivery"></a>
## Cron과 heartbeat 전송

cron 또는 heartbeat가 실행되지 않았거나 전송되지 않았다면, 먼저 scheduler 상태를 보고 그다음 delivery target을 확인하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

확인할 것:

- Cron이 활성화되어 있고 next wake가 존재하는지
- 작업 실행 이력 상태(`ok`, `skipped`, `error`)
- Heartbeat skip reason(`quiet-hours`, `requests-in-flight`, `alerts-disabled`)

일반적인 시그니처:

- `cron: scheduler disabled; jobs will not run automatically` → cron 비활성화
- `cron: timer tick failed` → scheduler tick 실패, 파일/로그/런타임 오류 확인 필요
- `heartbeat skipped` with `reason=quiet-hours` → 활성 시간대 밖
- `heartbeat: unknown accountId` → heartbeat delivery target에 잘못된 account id
- `heartbeat skipped` with `reason=dm-blocked` → heartbeat target이 DM 형태 destination으로 해석되었지만 `agents.defaults.heartbeat.directPolicy`(또는 per-agent override)가 `block`

관련 문서:

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

<a id="node-paired-tool-fails"></a>
## 노드는 페어링됐지만 도구가 실패함

노드가 페어링되어 있는데 tools가 실패하면 foreground, permission, approval 상태를 분리해서 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

확인할 것:

- 예상 capability를 가진 node가 online 상태인지
- camera/mic/location/screen에 대한 OS 권한이 부여되었는지
- Exec approval과 allowlist 상태

일반적인 시그니처:

- `NODE_BACKGROUND_UNAVAILABLE` → node app이 foreground에 있어야 함
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한 누락
- `SYSTEM_RUN_DENIED: approval required` → exec approval pending
- `SYSTEM_RUN_DENIED: allowlist miss` → allowlist에 없어 명령이 차단됨

관련 문서:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

<a id="browser-tool-fails"></a>
## Browser tool이 실패함

gateway 자체는 정상인데 browser tool 동작이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

확인할 것:

- 유효한 browser executable path
- CDP profile 도달 가능 여부
- `profile="chrome"` 일 때 extension relay tab attachment

일반적인 시그니처:

- `Failed to start Chrome CDP on port` → browser 프로세스 시작 실패
- `browser.executablePath not found` → configured path가 잘못됨
- `Chrome extension relay is running, but no tab is connected` → extension relay가 attach되지 않음
- `Browser attachOnly is enabled ... not reachable` → attach-only profile에 도달 가능한 target이 없음

관련 문서:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/chrome-extension](/tools/chrome-extension)
- [/tools/browser](/tools/browser)

## 업그레이드 후 갑자기 깨졌다면

업그레이드 후 문제 대부분은 config drift이거나, 더 엄격해진 기본값이 이제 적용되기 때문입니다.

### 1) 인증과 URL override 동작이 바뀜

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

확인할 것:

- `gateway.mode=remote` 이면, 로컬 서비스는 정상이어도 CLI 호출이 remote를 향하고 있을 수 있음
- 명시적인 `--url` 호출은 저장된 자격 증명으로 fallback하지 않음

일반적인 시그니처:

- `gateway connect failed:` → URL 대상이 잘못됨
- `unauthorized` → endpoint는 reachable하지만 인증이 틀림

### 2) Bind와 auth 가드레일이 더 엄격해짐

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

확인할 것:

- non-loopback bind(`lan`, `tailnet`, `custom`)는 인증 설정이 필요함
- 옛 키인 `gateway.token` 은 `gateway.auth.token` 을 대체하지 않음

일반적인 시그니처:

- `refusing to bind gateway ... without auth` → bind+auth 불일치
- `RPC probe: failed` while runtime is running → gateway는 살아 있지만 현재 auth/url로 접근 불가

### 3) Pairing과 device identity 상태가 바뀜

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

확인할 것:

- dashboard/node용 device approval이 pending인지
- policy 또는 identity 변경 후 DM pairing approval이 pending인지

일반적인 시그니처:

- `device identity required` → device auth가 충족되지 않음
- `pairing required` → 발신자/디바이스 승인이 필요함

점검 후에도 서비스 config와 runtime이 계속 불일치하면, 같은 profile/state directory에서 서비스 metadata를 다시 설치하세요.

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 문서:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
