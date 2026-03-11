---
summary: "격리된 환경이나 iMessage 연동이 필요할 때 활용 가능한 샌드박스 macOS VM(로컬 또는 호스팅) 구축 가이드"
read_when:
  - OpenClaw를 메인 macOS 작업 환경과 완전히 분리하여 운영하고자 할 때
  - 샌드박스 내에서 iMessage 연동(BlueBubbles)을 사용하고 싶을 때
  - 복제 및 초기화가 간편한 macOS 환경이 필요할 때
  - 로컬 VM과 클라우드 호스팅 macOS 옵션을 비교하고 싶을 때
title: "macOS VM 설치"
x-i18n:
  source_path: "install/macos-vm.md"
---

# macOS VM 설치 및 운영 (샌드박싱)

## 권장 기본 구성 (사용자별 가이드)

- **소형 리눅스 VPS**: 상시 가동되는 Gateway를 저렴하게 운영하고 싶은 경우. [VPS 호스팅 가이드](/vps) 참조.
- **전용 하드웨어 (Mac mini 등)**: 브라우저 자동화 시 데이터 센터 IP 차단을 피하기 위해 **주거용 IP**와 완전한 제어권이 필요한 경우.
- **하이브리드 모드**: Gateway는 저렴한 VPS에 두고, 브라우저/UI 자동화가 필요할 때만 자신의 Mac을 **노드(Node)**로 연결함 ([노드 관리](/nodes) 및 [원격 액세스](/gateway/remote) 참조).

본 가이드는 iMessage(BlueBubbles)와 같은 macOS 전용 기능이 반드시 필요하거나, 일상 업무용 Mac과 에이전트 실행 환경을 엄격히 분리하고 싶은 경우에 활용함.

## macOS VM 옵션

### 로컬 VM (Lume 활용)
[Lume](https://cua.ai/docs/lume)을 사용하여 현재 사용 중인 Apple Silicon Mac 내부에 샌드박스 macOS VM을 구축함.

**장점:**
- 격리된 완전한 macOS 환경 제공 (호스트 시스템 청결 유지).
- BlueBubbles를 통한 iMessage 지원 (리눅스/윈도우에서는 불가능).
- VM 복제를 통한 즉각적인 초기화 가능.
- 추가 하드웨어 구매 비용이나 클라우드 비용 발생 없음.

### 클라우드 호스팅 Mac
클라우드 환경에서 macOS를 운영하고 싶다면 다음 공급자를 고려할 수 있음:
- [MacStadium](https://www.macstadium.com/)
- 기타 macOS VM 지원 업체

VM에 SSH 접속이 가능해진 시점부터 아래의 6단계 절차를 수행함.

---

## 숙련자용 요약 경로 (Lume 기준)

1. Lume 설치.
2. `lume create openclaw --os macos --ipsw latest` 실행.
3. 설정 마법사 완료 및 원격 로그인(SSH) 활성화.
4. `lume run openclaw --no-display` (헤드리스 모드) 실행.
5. SSH 접속 후 OpenClaw 설치 및 채널 구성.
6. 완료.

---

## 사전 준비 사항 (Lume)

- Apple Silicon Mac (M1/M2/M3/M4 모델).
- 호스트 OS: macOS Sequoia 이상.
- VM당 약 60GB 이상의 여유 디스크 공간.
- 구축 소요 시간: 약 20분.

---

## 1) Lume 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

설치 후 `lume` 명령어를 찾을 수 없다면 PATH를 추가함:
```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

---

## 2) macOS VM 생성

```bash
lume create openclaw --os macos --ipsw latest
```
이 명령은 macOS 이미지를 다운로드하고 VM을 생성함. 완료 후 VNC 창이 자동으로 열림.

---

## 3) macOS 초기 설정 및 SSH 활성화

VNC 화면에서 일반적인 macOS 설정을 진행함:
1. 언어 및 리전 선택.
2. Apple ID 로그인은 나중에(iMessage 사용 시) 진행하거나 건너뜀.
3. 사용자 계정을 생성함 (비밀번호 필수).
4. **시스템 설정** → **일반** → **공유**에서 **"원격 로그인 (Remote Login)"**을 활성화함.

---

## 4) VM IP 주소 확인

호스트 터미널에서 다음을 실행함:
```bash
lume get openclaw
```
`192.168.64.x` 형태의 IP 주소를 확인함.

---

## 5) VM 접속 (SSH)

```bash
ssh <사용자이름>@192.168.64.X
```

---

## 6) OpenClaw 설치 (VM 내부)

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```
온보딩 과정에서 모델 공급자 인증 정보를 설정함.

---

## 7) 채널 설정 및 로그인

`~/.openclaw/openclaw.json` 파일을 수정하여 WhatsApp, Telegram 등의 채널 정보를 입력함.

WhatsApp 로그인을 위해 QR 코드를 스캔함:
```bash
openclaw channels login
```

---

## 8) 헤드리스 모드 전환

VM 창을 닫고 백그라운드에서 실행되도록 변경함:
```bash
lume stop openclaw
lume run openclaw --no-display
```

에이전트 상태 확인:
```bash
ssh <사용자이름>@192.168.64.X "openclaw status"
```

---

## 보너스: iMessage 연동

macOS 운영의 가장 큰 핵심 기능임. [BlueBubbles](https://bluebubbles.app) 앱을 사용하여 에이전트와 iMessage를 연결할 수 있음.

**VM 내부 작업:**
1. BlueBubbles 앱 설치 및 Apple ID 로그인.
2. Web API 활성화 및 전용 비밀번호 설정.
3. BlueBubbles 웹훅 주소를 에이전트 Gateway로 설정 (예: `https://<gateway-host>/bluebubbles-webhook?password=<비밀번호>`).

OpenClaw 설정에 `bluebubbles` 채널 섹션을 추가함. 상세 내용은 [BlueBubbles 채널 가이드](/channels/bluebubbles) 참조.

---

## 골든 이미지 (스냅샷) 저장

모든 초기 설정이 완료된 상태를 복제해두면 언제든 깨끗한 상태로 되돌릴 수 있음:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

**초기화 방법:**
```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 상시 가동 팁

- Mac을 항상 전원에 연결해 둠.
- **시스템 설정** → **에너지 절약**에서 잠자기 모드를 비활성화함.
- 필요 시 `caffeinate` 명령어를 활용함.

본격적인 상시 가동이 목표라면 전용 Mac mini 구축이나 VPS 운영을 권장함.

---

## 문제 해결 (Troubleshooting)

| 증상 | 조치 방법 |
| :--- | :--- |
| SSH 접속 실패 | VM 내부 설정에서 "원격 로그인" 활성화 여부 확인. |
| IP 주소 미표시 | VM 부팅이 완전히 끝날 때까지 대기 후 다시 조회. |
| Lume 명령 미인식 | `~/.local/bin` 경로가 PATH 환경 변수에 포함되어 있는지 확인. |
| WhatsApp QR 스캔 불가 | 호스트가 아닌 VM 터미널 내에서 로그인 명령을 실행했는지 확인. |

---

## 관련 문서 목록

- [VPS 호스팅 가이드](/vps)
- [노드 기기 관리](/nodes)
- [원격 Gateway 접속](/gateway/remote)
- [BlueBubbles 채널 설정](/channels/bluebubbles)
- [Docker 샌드박싱](/install/docker) (대안적인 격리 방식)
