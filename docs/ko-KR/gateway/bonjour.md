---
title: Bonjour Discovery
description: "LAN과 Tailnet 환경에서 OpenClaw Gateway를 Bonjour, mDNS, Wide-Area DNS-SD로 탐색하고 문제를 진단하는 가이드"
summary: "Bonjour/mDNS 탐색 및 디버깅: Gateway beacon, clients, common failure modes"
read_when:
  - macOS/iOS에서 Bonjour 탐색 문제를 디버깅할 때
  - mDNS service type, TXT record, discovery UX를 바꿀 때
x-i18n:
  source_path: gateway/bonjour.md
---

# Bonjour / mDNS discovery

OpenClaw는 활성 Gateway(WebSocket endpoint)를 찾기 위한 **LAN 전용 편의 기능**으로 Bonjour(mDNS / DNS-SD)를 사용합니다. 이 기능은 best-effort이며 SSH나 Tailnet 기반 연결을 대체하지 않습니다.

## Tailscale 위에서 Wide-area Bonjour(Unicast DNS-SD) 사용하기

node와 gateway가 서로 다른 네트워크에 있으면 multicast mDNS는 그 경계를 넘지 못합니다. 이 경우 Tailscale 위에서 **unicast DNS-SD**("Wide-Area Bonjour")로 전환하면 같은 discovery UX를 유지할 수 있습니다.

상위 단계는 다음과 같습니다.

1. gateway host(Tailnet으로 접근 가능)에 DNS 서버를 실행합니다.
2. 전용 zone(예: `openclaw.internal.`) 아래에 `_openclaw-gw._tcp`용 DNS-SD record를 게시합니다.
3. 선택한 domain이 해당 DNS 서버로 해석되도록 Tailscale **split DNS**를 구성합니다.

OpenClaw는 어떤 discovery domain이든 지원합니다. `openclaw.internal.`은 예시일 뿐입니다. iOS/Android node는 `local.`과 설정한 wide-area domain을 모두 탐색합니다.

### Gateway config(권장)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### DNS 서버 1회 설정(gateway host)

```bash
openclaw dns setup --apply
```

이 명령은 CoreDNS를 설치하고 다음과 같이 구성합니다.

- gateway의 Tailscale interface에서만 port 53으로 listen
- 선택한 domain(예: `openclaw.internal.`)을 `~/.openclaw/dns/<domain>.db`에서 제공

tailnet에 연결된 머신에서 다음처럼 검증할 수 있습니다.

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS settings

Tailscale admin console에서:

- gateway의 tailnet IP를 가리키는 nameserver를 추가합니다(UDP/TCP 53).
- discovery domain이 그 nameserver를 사용하도록 split DNS를 추가합니다.

클라이언트가 tailnet DNS를 수용하면 iOS node는 multicast 없이도 discovery domain 안에서 `_openclaw-gw._tcp`를 탐색할 수 있습니다.

### Gateway listener 보안(권장)

Gateway WS port(기본 `18789`)는 기본적으로 loopback에 바인딩됩니다. LAN/tailnet 접근이 필요하다면 명시적으로 bind하고 auth를 유지하세요.

tailnet-only 구성에서는:

- `~/.openclaw/openclaw.json`에 `gateway.bind: "tailnet"`을 설정합니다.
- Gateway 또는 macOS menubar app을 재시작합니다.

## 무엇이 advertise하나

`_openclaw-gw._tcp`를 advertise하는 주체는 Gateway뿐입니다.

## Service types

- `_openclaw-gw._tcp` - gateway transport beacon(macOS/iOS/Android node에서 사용)

## TXT keys(비밀이 아닌 힌트)

Gateway는 UI 흐름을 편하게 만들기 위해 작은 비밀 아님 힌트들을 advertise합니다.

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS가 활성화된 경우만)
- `gatewayTlsSha256=<sha256>` (TLS가 활성화되고 fingerprint를 알 수 있을 때만)
- `canvasPort=<port>` (canvas host가 활성화된 경우만, 현재는 `gatewayPort`와 같음)
- `sshPort=<port>` (기본값은 22)
- `transport=gateway`
- `cliPath=<path>` (선택 사항, 실행 가능한 `openclaw` entrypoint의 절대 경로)
- `tailnetDns=<magicdns>` (선택 사항, Tailnet이 가능할 때의 힌트)

보안 참고:

- Bonjour/mDNS TXT record는 **인증되지 않습니다**. 클라이언트는 TXT를 authoritative routing 정보로 취급하면 안 됩니다.
- 클라이언트는 해석된 service endpoint(SRV + A/AAAA)를 기준으로 라우팅해야 합니다. `lanHost`, `tailnetDns`, `gatewayPort`, `gatewayTlsSha256`는 힌트로만 취급하세요.
- TLS pinning은 advertise된 `gatewayTlsSha256`가 기존에 저장된 pin을 덮어쓰게 해서는 안 됩니다.
- iOS/Android node는 discovery 기반 direct connect를 항상 **TLS 전용**으로 취급해야 하며, 처음 보는 fingerprint는 반드시 명시적 사용자 확인을 거쳐야 합니다.

## macOS에서 디버깅

유용한 내장 도구:

- instance 탐색:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 특정 instance 해석(`<instance>` 대체):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

탐색은 되는데 해석이 안 된다면 보통 LAN 정책 또는 mDNS resolver 문제입니다.

## Gateway 로그에서 디버깅

Gateway는 rolling log file을 기록하며, 시작 시 `gateway log file: ...`를 출력합니다. 특히 다음과 같은 `bonjour:` 라인을 보세요.

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS node에서 디버깅

iOS node는 `NWBrowser`로 `_openclaw-gw._tcp`를 탐색합니다.

로그를 수집하려면:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 문제 재현 → **Copy**

로그에는 browser state transition과 result-set change가 포함됩니다.

## 흔한 실패 모드

- **Bonjour doesn’t cross networks**: Tailnet 또는 SSH를 사용하세요.
- **Multicast blocked**: 일부 Wi-Fi 네트워크는 mDNS를 차단합니다.
- **Sleep / interface churn**: macOS는 일시적으로 mDNS result를 잃을 수 있으니 다시 시도하세요.
- **Browse works but resolve fails**: 머신 이름을 단순하게 유지하세요. 이모지나 문장부호는 피하고 Gateway를 재시작하세요. service instance name은 host name에서 파생되므로 지나치게 복잡한 이름은 일부 resolver를 혼란스럽게 만듭니다.

## Escaped instance names (`\032`)

Bonjour/DNS-SD는 service instance name의 바이트를 `\DDD` 10진 escape로 표현하는 경우가 많습니다. 예를 들어 공백은 `\032`가 됩니다.

- 이는 protocol 수준에서 정상입니다.
- UI는 표시용으로 decode해야 합니다(iOS는 `BonjourEscapes.decode` 사용).

## 비활성화 / 설정

- `OPENCLAW_DISABLE_BONJOUR=1` - advertising 비활성화(legacy: `OPENCLAW_DISABLE_BONJOUR`)
- `gateway.bind` in `~/.openclaw/openclaw.json` - Gateway bind mode 제어
- `OPENCLAW_SSH_PORT` - TXT에 advertise하는 SSH port override(legacy: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` - TXT에 MagicDNS hint 게시(legacy: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` - advertise되는 CLI path override(legacy: `OPENCLAW_CLI_PATH`)

## 관련 문서

- discovery policy 및 transport 선택: [Discovery](/gateway/discovery)
- node pairing과 approvals: [Gateway pairing](/gateway/pairing)
