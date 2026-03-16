---
summary: "SSH를 통해 원격 OpenClaw gateway를 제어하는 macOS 앱 흐름"
description: "macOS 앱이 SSH 터널이나 direct ws/wss 연결로 원격 OpenClaw gateway를 제어하는 설정과 요구 사항을 설명합니다."
read_when:
  - "원격 mac 제어를 설정하거나 디버깅할 때"
title: "원격 제어"
x-i18n:
  source_path: "platforms/mac/remote.md"
---

# 원격 OpenClaw (macOS ⇄ 원격 호스트)

이 흐름을 사용하면 macOS app이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw gateway를 완전히 원격 제어할 수 있습니다. 이것이 앱의 **Remote over SSH**(remote run) 기능입니다. health checks, Voice Wake forwarding, Web Chat까지 모두 _Settings → General_의 동일한 remote SSH config를 재사용합니다.

## 모드

- **로컬(이 Mac)**: 모든 것이 이 노트북에서 실행됩니다. SSH는 사용하지 않습니다.
- **Remote over SSH (기본값)**: OpenClaw commands는 원격 호스트에서 실행됩니다. mac app은 `-o BatchMode`, 선택한 identity/key, 그리고 local port-forward를 포함한 SSH 연결을 엽니다.
- **Remote direct (ws/wss)**: SSH tunnel이 없습니다. mac app이 gateway URL에 직접 연결합니다. 예를 들어 Tailscale Serve나 공개 HTTPS reverse proxy를 사용할 수 있습니다.

## 원격 전송 방식

원격 모드는 두 가지 전송 방식을 지원합니다.

- **SSH tunnel**(기본값): `ssh -N -L ...`로 gateway port를 localhost에 포워딩합니다. tunnel이 loopback이므로 gateway는 node IP를 `127.0.0.1`로 보게 됩니다.
- **Direct (ws/wss)**: gateway URL에 직접 연결합니다. gateway는 실제 client IP를 봅니다.

## 원격 호스트의 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다 (`pnpm install && pnpm build && pnpm link --global`).
2. non-interactive shells에서도 `openclaw`가 PATH에 있도록 보장합니다. 필요하면 `/usr/local/bin` 또는 `/opt/homebrew/bin`에 symlink하세요.
3. key auth로 SSH를 열어 둡니다. LAN 밖에서도 안정적으로 도달할 수 있도록 **Tailscale** IP 사용을 권장합니다.

## macOS 앱 설정

1. _Settings → General_ 을 엽니다.
2. **OpenClaw runs** 아래에서 **Remote over SSH**를 선택하고 다음을 설정합니다.
   - **Transport**: **SSH tunnel** 또는 **Direct (ws/wss)**
   - **SSH target**: `user@host` (선택적으로 `:port` 포함)
     - gateway가 같은 LAN에 있고 Bonjour를 광고한다면 discovered list에서 선택해 이 필드를 자동으로 채울 수 있습니다.
   - **Gateway URL** (Direct 전용): `wss://gateway.example.ts.net` (`ws://...`는 local/LAN용)
   - **Identity file** (advanced): key file 경로
   - **Project root** (advanced): commands에 사용하는 remote checkout path
   - **CLI path** (advanced): 실행 가능한 `openclaw` entrypoint/binary의 선택적 path (advertised되면 자동으로 채워짐)
3. **Test remote**를 누릅니다. 성공하면 원격 `openclaw status --json`이 올바르게 실행된다는 뜻입니다. 실패는 대개 PATH/CLI 문제를 의미하며, exit 127은 원격에서 CLI를 찾지 못했다는 뜻입니다.
4. 이제 상태 확인과 Web Chat도 이 SSH 터널을 통해 자동으로 실행됩니다.

## Web Chat

- **SSH tunnel**: Web Chat은 포워딩된 WebSocket control port(기본값 18789)를 통해 gateway에 연결합니다.
- **Direct (ws/wss)**: Web Chat은 구성된 gateway URL에 바로 연결합니다.
- 별도의 WebChat HTTP server는 더 이상 없습니다.

## 권한

- 원격 호스트에는 로컬과 동일한 TCC approvals(Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications)이 필요합니다. 해당 머신에서 onboarding을 실행해 한 번 승인해 두세요.
- nodes는 `node.list` / `node.describe`를 통해 자신의 permission state를 광고하므로, agents가 사용 가능한 항목을 알 수 있습니다.

## 보안 참고 사항

- 원격 호스트에서는 loopback bind를 선호하고 SSH 또는 Tailscale로 연결하세요.
- SSH tunneling은 strict host-key checking을 사용합니다. 먼저 host key를 신뢰해 `~/.ssh/known_hosts`에 존재하도록 하세요.
- Gateway를 non-loopback interface에 bind한다면 token/password auth를 요구하세요.
- [Security](/gateway/security) 및 [Tailscale](/gateway/tailscale)도 참고하세요.

## WhatsApp login flow (원격)

- **원격 호스트에서** `openclaw channels login --verbose`를 실행합니다. 휴대폰의 WhatsApp으로 QR 코드를 스캔하세요.
- auth가 만료되면 그 호스트에서 login 명령을 다시 실행하세요. health check가 링크 문제를 표시합니다.

## 문제 해결

- **exit 127 / not found**: non-login shell의 PATH에 `openclaw`가 없습니다. `/etc/paths`, shell rc, 또는 `/usr/local/bin`/`/opt/homebrew/bin` symlink에 추가하세요.
- **Health probe failed**: SSH reachability, PATH, 그리고 Baileys가 로그인되어 있는지 (`openclaw status --json`) 확인하세요.
- **Web Chat stuck**: gateway가 원격 호스트에서 실행 중인지, 포워딩된 port가 gateway WS port와 일치하는지 확인하세요. UI는 healthy WS connection이 필요합니다.
- **Node IP shows 127.0.0.1**: SSH tunnel에서는 정상입니다. gateway가 실제 client IP를 보게 하려면 **Transport**를 **Direct (ws/wss)**로 바꾸세요.
- **Voice Wake**: remote mode에서는 trigger phrases가 자동으로 전달되며 별도의 forwarder는 필요하지 않습니다.

## 알림 소리

알림별로 scripts에서 `openclaw`와 `node.invoke`를 사용해 소리를 선택할 수 있습니다. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

이제 앱에는 전역 "default sound" 토글이 없습니다. callers가 요청마다 소리를 선택하거나 선택하지 않습니다.
