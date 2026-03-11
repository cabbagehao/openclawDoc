---
summary: "Bonjour/mDNS discovery + debugging (Gateway beacon, client, 일반적인 실패 모드)"
read_when:
  - macOS/iOS에서 Bonjour discovery 문제를 디버깅할 때
  - mDNS service type, TXT record, discovery UX를 변경할 때
title: "Bonjour Discovery"
---

# Bonjour / mDNS discovery

OpenClaw는 활성 Gateway(WebSocket endpoint)를 찾기 위해 Bonjour(mDNS / DNS-SD)를 **LAN 전용 편의 기능**으로 사용합니다. 이는 best-effort 기능이며, SSH나 Tailnet 기반 연결을 대체하지 않습니다.

## Wide-area Bonjour (Unicast DNS-SD) over Tailscale

node와 gateway가 서로 다른 네트워크에 있으면 multicast mDNS는 그 경계를 넘지 못합니다. 이때 Tailscale 위에서 **unicast DNS-SD**("Wide-Area Bonjour")로 전환하면 같은 discovery UX를 유지할 수 있습니다.

상위 단계:

1. gateway host에서 DNS server를 실행합니다(Tailnet에서 접근 가능해야 함).
2. 전용 zone(예: `openclaw.internal.`) 아래에 `_openclaw-gw._tcp`용 DNS-SD record를 게시합니다.
3. 클라이언트(iOS 포함)가 해당 DNS server를 통해 도메인을 해석하도록 Tailscale **split DNS**를 구성합니다.

OpenClaw는 어떤 discovery domain이든 지원합니다. `openclaw.internal.`은 예시일 뿐입니다. iOS/Android node는 `local.`과 설정된 wide-area domain을 모두 browse합니다.

### Gateway config (recommended)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (권장)
  discovery: { wideArea: { enabled: true } }, // wide-area DNS-SD 게시 활성화
}
```

### One-time DNS server setup (gateway host)

```bash
openclaw dns setup --apply
```

이 명령은 CoreDNS를 설치하고 다음처럼 설정합니다.

- gateway의 Tailscale interface에서만 port 53 리슨
- 선택한 domain(예: `openclaw.internal.`)을 `~/.openclaw/dns/<domain>.db`에서 서비스

tailnet 연결된 머신에서 검증:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS settings

Tailscale admin console에서:

- gateway의 tailnet IP를 가리키는 nameserver를 추가(UDP/TCP 53)
- 선택한 discovery domain이 해당 nameserver를 쓰도록 split DNS 추가

클라이언트가 tailnet DNS를 수용하면 iOS node는 multicast 없이도 discovery domain에서 `_openclaw-gw._tcp`를 browse할 수 있습니다.

### Gateway listener security (recommended)

Gateway WS 포트(기본값 `18789`)는 기본적으로 loopback에 bind됩니다. LAN/tailnet 접근을 허용하려면 명시적으로 bind하고 auth를 유지하세요.

tailnet-only 구성:

- `~/.openclaw/openclaw.json`에 `gateway.bind: "tailnet"` 설정
- Gateway 또는 macOS menubar app 재시작

## What advertises

`_openclaw-gw._tcp`를 광고하는 것은 Gateway뿐입니다.

## Service types

- `_openclaw-gw._tcp` — gateway transport beacon(macOS/iOS/Android node에서 사용)

## TXT keys (non-secret hints)

Gateway는 UI 흐름을 편하게 하기 위한 작은 비밀이 아닌 힌트를 TXT에 광고합니다.

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS 활성화 시에만)
- `gatewayTlsSha256=<sha256>` (TLS 활성화 + fingerprint 사용 가능 시에만)
- `canvasPort=<port>` (canvas host 활성화 시에만, 현재는 `gatewayPort`와 동일)
- `sshPort=<port>` (override 없으면 기본값 22)
- `transport=gateway`
- `cliPath=<path>` (선택, 실행 가능한 `openclaw` entrypoint의 절대 경로)
- `tailnetDns=<magicdns>` (선택, Tailnet 사용 가능할 때의 힌트)

보안 참고:

- Bonjour/mDNS TXT record는 **인증되지 않습니다**. client는 TXT를 authoritative routing 정보로 취급하면 안 됩니다.
- client는 해석된 service endpoint(SRV + A/AAAA)를 기준으로 route해야 합니다. `lanHost`, `tailnetDns`, `gatewayPort`, `gatewayTlsSha256`는 힌트일 뿐입니다.
- TLS pinning은 광고된 `gatewayTlsSha256`가 기존에 저장된 pin을 덮어쓰게 해서는 안 됩니다.
- iOS/Android node는 discovery 기반 직접 연결을 **TLS-only**로 취급하고, 처음 보는 fingerprint를 신뢰하기 전에 명시적인 사용자 확인을 받아야 합니다.

## Debugging on macOS

유용한 내장 도구:

- instance browse:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- instance resolve( `<instance>` 교체):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

browse는 되는데 resolve가 실패하면, 보통 LAN policy나 mDNS resolver 문제입니다.

## Debugging in Gateway logs

Gateway는 rolling log file을 기록하며, 시작 시 `gateway log file: ...`로 출력합니다. 특히 다음 `bonjour:` 로그를 확인하세요.

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugging on iOS node

iOS node는 `NWBrowser`로 `_openclaw-gw._tcp`를 discover합니다.

로그 수집 방법:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 문제 재현 → **Copy**

로그에는 browser state transition과 result-set change가 포함됩니다.

## Common failure modes

- **Bonjour doesn’t cross networks**: Tailnet 또는 SSH를 사용하세요.
- **Multicast blocked**: 일부 Wi-Fi 네트워크는 mDNS를 비활성화합니다.
- **Sleep / interface churn**: macOS가 일시적으로 mDNS 결과를 잃을 수 있습니다. 다시 시도하세요.
- **Browse works but resolve fails**: machine name은 단순하게 유지하세요(emoji나 특수문자 피하기). 그 뒤 Gateway를 재시작하세요. service instance name은 host name에서 파생되므로, 지나치게 복잡한 이름은 resolver를 혼란스럽게 할 수 있습니다.

## Escaped instance names (`\032`)

Bonjour/DNS-SD는 service instance name의 byte를 `\DDD` 형식의 10진 escape로 표현하는 경우가 많습니다(예: 공백은 `\032`).

- protocol 수준에서는 정상 동작입니다.
- UI는 이를 decode해서 표시해야 합니다(iOS는 `BonjourEscapes.decode` 사용).

## Disabling / configuration

- `OPENCLAW_DISABLE_BONJOUR=1`은 advertising을 비활성화합니다(legacy: `OPENCLAW_DISABLE_BONJOUR`)
- `~/.openclaw/openclaw.json`의 `gateway.bind`가 Gateway bind mode를 제어합니다.
- `OPENCLAW_SSH_PORT`는 TXT에 광고할 SSH port를 override합니다(legacy: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS`는 TXT에 MagicDNS 힌트를 게시합니다(legacy: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH`는 광고되는 CLI path를 override합니다(legacy: `OPENCLAW_CLI_PATH`)

## Related docs

- Discovery policy and transport selection: [Discovery](/gateway/discovery)
- Node pairing + approvals: [Gateway pairing](/gateway/pairing)
