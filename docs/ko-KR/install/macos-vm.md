---
summary: "격리나 iMessage가 필요할 때 샌드박스된 macOS VM(로컬 또는 호스팅)에서 OpenClaw를 실행합니다"
read_when:
  - OpenClaw를 주 사용 macOS 환경과 분리해서 실행하고 싶습니다
  - 샌드박스 안에서 iMessage 연동(BlueBubbles)을 사용하고 싶습니다
  - 복제 가능한 초기화 가능한 macOS 환경이 필요합니다
  - 로컬 macOS VM과 호스팅 macOS VM 옵션을 비교하고 싶습니다
title: "macOS VM"
---

# macOS VM에서 OpenClaw 실행하기 (샌드박싱)

## 권장 기본 구성(대부분의 사용자)

- 항상 켜져 있는 Gateway와 저렴한 비용이 필요하다면 **소형 Linux VPS**를 사용하세요. [VPS hosting](/vps) 문서를 참고하세요.
- 브라우저 자동화를 위해 완전한 제어권과 **주거용 IP**가 필요하다면 **전용 하드웨어**(Mac mini 또는 Linux 박스)를 사용하세요. 많은 사이트가 데이터 센터 IP를 차단하므로, 로컬 브라우징이 더 잘 동작하는 경우가 많습니다.
- **하이브리드:** Gateway는 저렴한 VPS에 두고, 브라우저/UI 자동화가 필요할 때 Mac을 **node**로 연결하세요. [Nodes](/nodes)와 [Gateway remote](/gateway/remote)를 참고하세요.

macOS 전용 기능(iMessage/BlueBubbles)이 필요하거나, 일상적으로 쓰는 Mac과 엄격히 분리된 환경이 필요할 때 macOS VM을 사용하세요.

## macOS VM 옵션

### Apple Silicon Mac의 로컬 VM (Lume)

[Lume](https://cua.ai/docs/lume)를 사용하면 기존 Apple Silicon Mac에서 샌드박스된 macOS VM 안에 OpenClaw를 실행할 수 있습니다.

이 구성을 사용하면 다음이 가능합니다:

- 격리된 완전한 macOS 환경 사용(호스트는 깔끔하게 유지)
- BlueBubbles를 통한 iMessage 지원(Linux/Windows에서는 불가능)
- VM 복제로 즉시 초기화
- 추가 하드웨어나 클라우드 비용 없음

### 호스팅 Mac 제공업체(클라우드)

클라우드에서 macOS가 필요하다면 호스팅 Mac 제공업체도 사용할 수 있습니다:

- [MacStadium](https://www.macstadium.com/) (호스팅 Mac)
- 다른 호스팅 Mac 업체도 사용 가능하며, 해당 업체의 VM + SSH 문서를 따르면 됩니다

macOS VM에 SSH로 접속할 수 있게 되면 아래 6단계부터 계속 진행하세요.

---

## 빠른 경로 (Lume, 숙련 사용자용)

1. Lume 설치
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant 완료, Remote Login (SSH) 활성화
4. `lume run openclaw --no-display`
5. SSH 접속 후 OpenClaw 설치 및 채널 구성
6. 완료

---

## 준비 사항 (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- 호스트에 macOS Sequoia 이상
- VM당 약 60 GB의 여유 디스크 공간
- 약 20분

---

## 1) Lume 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin` 이 PATH에 없다면:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

확인:

```bash
lume --version
```

문서: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM 생성

```bash
lume create openclaw --os macos --ipsw latest
```

이 명령은 macOS를 다운로드하고 VM을 생성합니다. VNC 창이 자동으로 열립니다.

참고: 연결 상태에 따라 다운로드에 시간이 걸릴 수 있습니다.

---

## 3) Setup Assistant 완료

VNC 창에서:

1. 언어와 지역 선택
2. Apple ID 건너뛰기(iMessage를 나중에 사용할 경우 로그인해도 됨)
3. 사용자 계정 생성(사용자 이름과 비밀번호를 기억해 두세요)
4. 모든 선택적 기능 건너뛰기

설정이 끝나면 SSH를 활성화하세요:

1. System Settings → General → Sharing 열기
2. "Remote Login" 활성화

---

## 4) VM의 IP 주소 확인

```bash
lume get openclaw
```

IP 주소(보통 `192.168.64.x`)를 확인하세요.

---

## 5) VM에 SSH 접속

```bash
ssh youruser@192.168.64.X
```

`youruser` 는 생성한 계정으로, IP는 VM의 IP 주소로 바꾸세요.

---

## 6) OpenClaw 설치

VM 내부에서:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

온보딩 프롬프트에 따라 모델 제공업체(Anthropic, OpenAI 등)를 설정하세요.

---

## 7) 채널 구성

설정 파일을 편집합니다:

```bash
nano ~/.openclaw/openclaw.json
```

채널을 추가합니다:

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

그다음 WhatsApp에 로그인합니다(QR 스캔):

```bash
openclaw channels login
```

---

## 8) 헤드리스로 VM 실행

VM을 중지한 뒤 디스플레이 없이 다시 시작합니다:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM은 백그라운드에서 실행됩니다. OpenClaw daemon이 gateway를 계속 실행합니다.

상태를 확인하려면:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 보너스: iMessage 연동

이것이 macOS에서 실행하는 가장 큰 장점입니다. [BlueBubbles](https://bluebubbles.app)를 사용해 OpenClaw에 iMessage를 추가할 수 있습니다.

VM 내부에서:

1. bluebubbles.app 에서 BlueBubbles 다운로드
2. Apple ID로 로그인
3. Web API를 활성화하고 비밀번호 설정
4. BlueBubbles webhook을 gateway로 연결(예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

OpenClaw 설정에 다음을 추가합니다:

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

gateway를 재시작하세요. 이제 에이전트가 iMessage를 송수신할 수 있습니다.

전체 설정 자세한 내용: [BlueBubbles channel](/channels/bluebubbles)

---

## 골든 이미지 저장

더 많은 사용자 지정을 하기 전에, 깨끗한 상태를 스냅샷으로 저장하세요:

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

## 24/7 실행

다음 방법으로 VM을 계속 실행 상태로 유지하세요:

- Mac을 전원에 연결한 상태로 유지
- System Settings → Energy Saver 에서 절전 비활성화
- 필요하면 `caffeinate` 사용

진짜 상시 실행이 필요하다면 전용 Mac mini 또는 소형 VPS를 고려하세요. [VPS hosting](/vps)을 참고하세요.

---

## 문제 해결

| 문제                        | 해결 방법                                                                     |
| --------------------------- | ----------------------------------------------------------------------------- |
| VM에 SSH 접속이 안 됨       | VM의 System Settings 에서 "Remote Login" 이 활성화되어 있는지 확인            |
| VM IP가 표시되지 않음       | VM이 완전히 부팅될 때까지 기다린 뒤 `lume get openclaw` 를 다시 실행          |
| Lume 명령을 찾을 수 없음    | `~/.local/bin` 을 PATH에 추가                                                 |
| WhatsApp QR이 스캔되지 않음 | `openclaw channels login` 실행 시 호스트가 아니라 VM에 로그인된 상태인지 확인 |

---

## 관련 문서

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (고급)
- [Docker Sandboxing](/install/docker) (대안적인 격리 방식)
