---
title: macOS VMs
description: Lume 또는 호스팅 macOS VM에서 OpenClaw를 격리 실행하고 BlueBubbles로 iMessage를 연동하는 가이드
summary: 격리 환경이나 iMessage가 필요할 때 샌드박스 macOS VM에서 OpenClaw를 실행하는 가이드
read_when:
  - 메인 macOS 환경과 분리된 OpenClaw 실행 환경이 필요할 때
  - sandbox 안에서 iMessage 연동(BlueBubbles)을 쓰고 싶을 때
  - 복제하고 초기화할 수 있는 macOS 환경이 필요할 때
  - 로컬과 호스팅 macOS VM 선택지를 비교하고 싶을 때
x-i18n:
  source_path: install/macos-vm.md
---

# macOS VM에서 OpenClaw 실행하기

## 권장 기본 구성(대부분의 사용자)

- **작은 Linux VPS**: 저렴하게 항상 켜 두는 Gateway가 필요하다면 [VPS hosting](/vps)을 참고하세요.
- **전용 하드웨어**(Mac mini 또는 Linux box): 브라우저 자동화에 **residential IP**와 완전한 제어가 필요하다면 적합합니다. 많은 사이트가 데이터센터 IP를 차단하므로 로컬 브라우징이 더 잘 동작할 때가 많습니다.
- **Hybrid**: Gateway는 저렴한 VPS에 두고, 브라우저/UI 자동화가 필요할 때만 Mac을 **node**로 연결하세요. [Nodes](/nodes)와 [Gateway remote](/gateway/remote)를 참고하세요.

macOS VM은 macOS 전용 기능(iMessage/BlueBubbles)이 꼭 필요하거나, 일상적으로 쓰는 Mac과 완전히 분리된 실행 환경이 필요할 때 선택하면 됩니다.

## macOS VM 옵션

### Apple Silicon Mac 위의 로컬 VM(Lume)

[Lume](https://cua.ai/docs/lume)을 사용하면 현재 쓰는 Apple Silicon Mac 안에 sandboxed macOS VM을 만들 수 있습니다.

장점:

- 격리된 전체 macOS 환경 제공
- BlueBubbles를 통한 iMessage 지원(Linux/Windows에서는 불가)
- VM clone으로 즉시 초기화 가능
- 추가 하드웨어나 클라우드 비용이 없음

### Hosted Mac provider(클라우드)

클라우드의 macOS가 필요하다면 hosted Mac provider도 사용할 수 있습니다.

- [MacStadium](https://www.macstadium.com/)
- 그 밖의 hosted Mac vendor

macOS VM에 SSH로 접속할 수 있다면 아래 6단계부터 진행하면 됩니다.

---

## 빠른 경로(Lume, 숙련자용)

1. Lume 설치
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant 완료 후 Remote Login(SSH) 활성화
4. `lume run openclaw --no-display`
5. SSH 접속 후 OpenClaw 설치 및 channel 구성
6. 완료

---

## 준비 사항(Lume)

- Apple Silicon Mac(M1/M2/M3/M4)
- 호스트 macOS Sequoia 이상
- VM당 약 60GB의 여유 디스크 공간
- 약 20분

---

## 1) Lume 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin`이 PATH에 없다면:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

확인:

```bash
lume --version
```

문서: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM 만들기

```bash
lume create openclaw --os macos --ipsw latest
```

이 명령은 macOS를 내려받고 VM을 만듭니다. VNC 창이 자동으로 열립니다.

참고: 네트워크 상태에 따라 다운로드가 오래 걸릴 수 있습니다.

---

## 3) Setup Assistant 완료

VNC 창에서:

1. 언어와 지역을 선택합니다.
2. Apple ID는 건너뛰거나, 나중에 iMessage를 쓸 경우 로그인합니다.
3. 사용자 계정을 만들고 username/password를 기억합니다.
4. 선택 기능은 모두 건너뛰어도 됩니다.

설정이 끝나면 SSH를 활성화합니다.

1. System Settings → General → Sharing을 엽니다.
2. "Remote Login"을 켭니다.

---

## 4) VM의 IP 주소 확인

```bash
lume get openclaw
```

보통 `192.168.64.x` 형태의 IP가 표시됩니다.

---

## 5) VM에 SSH 접속

```bash
ssh youruser@192.168.64.X
```

`youruser`는 생성한 계정으로, IP는 실제 VM 주소로 바꾸세요.

---

## 6) OpenClaw 설치

VM 안에서:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

온보딩 프롬프트에 따라 model provider(Anthropic, OpenAI 등)를 설정하세요.

---

## 7) channel 구성

config 파일을 편집합니다.

```bash
nano ~/.openclaw/openclaw.json
```

channel을 추가합니다.

```json
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+15551234567"]
    },
    "telegram": {
      "botToken": "YOUR_BOT_TOKEN"
    }
  }
}
```

그다음 WhatsApp에 로그인합니다(QR 스캔).

```bash
openclaw channels login
```

---

## 8) VM을 headless로 실행

VM을 멈춘 뒤 화면 없이 다시 실행합니다.

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM은 백그라운드에서 실행되고 OpenClaw daemon이 Gateway를 유지합니다.

상태 확인:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 보너스: iMessage 연동

macOS에서만 가능한 핵심 기능입니다. [BlueBubbles](https://bluebubbles.app)를 사용하면 OpenClaw에 iMessage를 연결할 수 있습니다.

VM 안에서:

1. bluebubbles.app에서 BlueBubbles를 내려받습니다.
2. Apple ID로 로그인합니다.
3. Web API를 켜고 비밀번호를 설정합니다.
4. BlueBubbles webhook을 gateway로 보냅니다. 예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`

OpenClaw config에 추가:

```json
{
  "channels": {
    "bluebubbles": {
      "serverUrl": "http://localhost:1234",
      "password": "your-api-password",
      "webhookPath": "/bluebubbles-webhook"
    }
  }
}
```

Gateway를 재시작하면 agent가 iMessage를 보내고 받을 수 있습니다.

자세한 설정: [BlueBubbles channel](/channels/bluebubbles)

---

## 골든 이미지 저장

추가 커스터마이즈 전에 깨끗한 상태를 snapshot해 두세요.

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

언제든 초기화:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 운영

VM을 계속 켜 두려면:

- Mac을 전원에 연결
- System Settings → Energy Saver에서 sleep 비활성화
- 필요하면 `caffeinate` 사용

진짜 always-on 운영이 필요하면 전용 Mac mini 또는 작은 VPS를 고려하세요. [VPS hosting](/vps)를 참고하세요.

---

## 문제 해결

| Problem | Solution |
| --- | --- |
| Can't SSH into VM | VM의 System Settings에서 "Remote Login"이 켜져 있는지 확인 |
| VM IP not showing | VM이 완전히 부팅될 때까지 기다린 뒤 `lume get openclaw` 재실행 |
| Lume command not found | `~/.local/bin`을 PATH에 추가 |
| WhatsApp QR not scanning | `openclaw channels login`을 호스트가 아니라 VM 안에서 실행했는지 확인 |

---

## 관련 문서

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (advanced)
