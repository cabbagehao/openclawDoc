---
summary: "SSH를 통해 원격 OpenClaw gateway를 제어하는 macOS 앱 흐름"
read_when:
  - 원격 mac 제어를 설정하거나 디버깅할 때
title: "원격 제어"
---

# 원격 OpenClaw (macOS ⇄ 원격 호스트)

이 흐름을 사용하면 macOS 앱이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw gateway의 완전한 원격 제어기로 동작할 수 있습니다. 이것이 앱의 **Remote over SSH**(원격 실행) 기능입니다. 모든 기능은 상태 확인, Voice Wake 전달, Web Chat까지 모두 *Settings → General* 의 동일한 원격 SSH 구성을 재사용합니다.

## 모드

* **로컬(이 Mac)**: 모든 것이 이 노트북에서 실행됩니다. SSH는 사용하지 않습니다.
* **SSH를 통한 원격(기본값)**: OpenClaw 명령은 원격 호스트에서 실행됩니다. mac 앱은 `-o BatchMode`, 선택한 identity/key, 그리고 로컬 포트 포워딩을 포함한 SSH 연결을 엽니다.
* **원격 직접 연결(ws/wss)**: SSH 터널이 없습니다. mac 앱이 gateway URL에 직접 연결합니다(예: Tailscale Serve 또는 공개 HTTPS 리버스 프록시를 통해).

## 원격 전송 방식

원격 모드는 두 가지 전송 방식을 지원합니다.

* **SSH 터널**(기본값): `ssh -N -L ...` 을 사용해 gateway 포트를 localhost로 포워딩합니다. 터널이 루프백이기 때문에 gateway는 node의 IP를 `127.0.0.1` 로 보게 됩니다.
* **직접 연결(ws/wss)**: gateway URL에 바로 연결합니다. gateway는 실제 클라이언트 IP를 보게 됩니다.

## 원격 호스트의 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다(`pnpm install && pnpm build && pnpm link --global`).
2. 비대화형 셸에서도 `openclaw` 가 PATH에 있도록 보장합니다(필요하면 `/usr/local/bin` 또는 `/opt/homebrew/bin` 에 심볼릭 링크).
3. 키 인증으로 SSH를 열어 둡니다. LAN 밖에서도 안정적으로 도달할 수 있도록 **Tailscale** IP 사용을 권장합니다.

## macOS 앱 설정

1. *Settings → General* 을 엽니다.
2. **OpenClaw runs** 아래에서 **Remote over SSH** 를 선택하고 다음을 설정합니다.
   * **Transport**: **SSH tunnel** 또는 **Direct (ws/wss)**.
   * **SSH target**: `user@host` (선택적으로 `:port` 포함).
     * gateway가 같은 LAN에 있고 Bonjour를 광고하고 있다면, 발견된 목록에서 선택해 이 필드를 자동으로 채울 수 있습니다.
   * **Gateway URL** (Direct 전용): `wss://gateway.example.ts.net` (`ws://...` 는 로컬/LAN용).
   * **Identity file** (고급): 키 파일 경로.
   * **Project root** (고급): 명령 실행에 사용하는 원격 체크아웃 경로.
   * **CLI path** (고급): 실행 가능한 `openclaw` 엔트리포인트/바이너리의 선택적 경로(광고되면 자동으로 채워짐).
3. **Test remote** 를 누릅니다. 성공하면 원격 `openclaw status --json` 이 올바르게 실행된다는 뜻입니다. 실패는 대개 PATH/CLI 문제를 의미하며, 종료 코드 127은 원격에서 CLI를 찾지 못했다는 뜻입니다.
4. 이제 상태 확인과 Web Chat도 이 SSH 터널을 통해 자동으로 실행됩니다.

## Web Chat

* **SSH 터널**: Web Chat은 포워딩된 WebSocket 제어 포트(기본값 18789)를 통해 gateway에 연결합니다.
* **직접 연결(ws/wss)**: Web Chat은 구성된 gateway URL에 바로 연결합니다.
* 이제 별도의 WebChat HTTP 서버는 없습니다.

## 권한

* 원격 호스트에는 로컬과 동일한 TCC 승인(Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications)이 필요합니다. 해당 머신에서 온보딩을 실행해 한 번 승인해 두세요.
* node는 `node.list` / `node.describe` 를 통해 자신의 권한 상태를 광고하므로, 에이전트가 사용 가능한 항목을 알 수 있습니다.

## 보안 참고 사항

* 원격 호스트에서는 루프백 바인딩을 선호하고 SSH 또는 Tailscale로 연결하세요.
* SSH 터널링은 엄격한 호스트 키 확인을 사용합니다. 먼저 호스트 키를 신뢰해 `~/.ssh/known_hosts` 에 존재하도록 하세요.
* Gateway를 루프백이 아닌 인터페이스에 바인딩한다면 토큰/비밀번호 인증을 요구하세요.
* [Security](/gateway/security) 및 [Tailscale](/gateway/tailscale)도 참고하세요.

## WhatsApp 로그인 흐름(원격)

* **원격 호스트에서** `openclaw channels login --verbose` 를 실행합니다. 휴대폰의 WhatsApp으로 QR 코드를 스캔하세요.
* 인증이 만료되면 그 호스트에서 로그인 명령을 다시 실행하세요. 상태 확인에서 링크 문제를 표시합니다.

## 문제 해결

* **exit 127 / not found**: 비로그인 셸의 PATH에 `openclaw` 가 없습니다. `/etc/paths`, 셸 rc, 또는 `/usr/local/bin`/`/opt/homebrew/bin` 심볼릭 링크에 추가하세요.
* **Health probe failed**: SSH 연결 가능 여부, PATH, 그리고 Baileys가 로그인되어 있는지(`openclaw status --json`) 확인하세요.
* **Web Chat stuck**: gateway가 원격 호스트에서 실행 중인지, 포워딩된 포트가 gateway WS 포트와 일치하는지 확인하세요. UI는 정상적인 WS 연결이 필요합니다.
* **Node IP shows 127.0.0.1**: SSH 터널에서는 정상입니다. gateway가 실제 클라이언트 IP를 보게 하려면 **Transport** 를 **Direct (ws/wss)** 로 바꾸세요.
* **Voice Wake**: 원격 모드에서는 트리거 문구가 자동으로 전달되며 별도의 전달기는 필요하지 않습니다.

## 알림 소리

알림별로 스크립트에서 `openclaw` 와 `node.invoke` 를 사용해 소리를 선택할 수 있습니다. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

이제 앱에는 전역 "default sound" 토글이 없습니다. 호출 측이 요청마다 소리를 선택하거나(또는 선택하지 않거나) 합니다.
