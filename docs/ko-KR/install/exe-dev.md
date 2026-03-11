---
summary: "원격 접속을 위한 exe.dev(VM + HTTPS 프록시) 환경에서의 OpenClaw Gateway 구축 가이드"
read_when:
  - Gateway 구동을 위한 저렴한 상시 가동 리눅스 호스트가 필요할 때
  - 별도의 VPS 운영 없이 원격으로 제어 UI에 접근하고자 할 때
title: "exe.dev 설치"
x-i18n:
  source_path: "install/exe-dev.md"
---

# exe.dev

목표: 사용자의 노트북에서 `https://<vm-이름>.exe.xyz` 주소로 접근 가능한 exe.dev VM 환경에 OpenClaw Gateway를 구축함.

본 가이드는 exe.dev의 기본 이미지인 **exeuntu**를 기준으로 설명함. 다른 배포판을 선택한 경우 패키지 관리자 명령어를 해당 환경에 맞게 수정하여 적용하기 바람.

## 초보자용 빠른 설정 (퀵 패스)

1. [https://exe.new/openclaw](https://exe.new/openclaw) 접속.
2. 필요한 인증 키 또는 토큰 정보를 입력함.
3. 생성된 VM 옆의 **"Agent"** 버튼을 클릭하고 잠시 대기함.
4. 모든 과정이 자동으로 완료됨.

## 사전 준비 사항

- exe.dev 계정 보유.
- [exe.dev](https://exe.dev) 가상 머신에 대한 `ssh exe.dev` 접근 권한 (선택 사항).

## Shelley 에이전트를 이용한 자동 설치

exe.dev의 AI 에이전트인 **Shelley**는 아래 프롬프트를 사용하여 OpenClaw를 즉시 설치할 수 있음:

```text
이 VM에 OpenClaw(https://docs.openclaw.ai/install)를 설치해줘. 온보딩 시 non-interactive 및 accept-risk 플래그를 사용하고, 제공된 인증 정보나 토큰을 적절히 추가해. 기본 18789 포트를 기본 사이트 설정의 루트 위치로 전달하도록 Nginx를 구성하고, 반드시 WebSocket 지원을 활성화해야 해. 기기 페어링은 "openclaw devices list"와 "openclaw devices approve <request id>" 명령으로 수행할 거야. 대시보드에서 OpenClaw의 상태가 OK로 표시되는지 확인해줘. exe.dev는 8000 포트에서 80/443 포트로의 포워딩과 HTTPS를 자동으로 처리해주므로, 최종 접속 주소는 포트 번호 없이 <vm-name>.exe.xyz 형식이 되어야 해.
```

## 수동 설치 절차

### 1) 가상 머신(VM) 생성

사용자 기기 터미널에서 다음 명령어를 실행함:

```bash
ssh exe.dev new
```

생성된 VM에 접속함:

```bash
ssh <vm-이름>.exe.xyz
```

*팁: OpenClaw는 상태 데이터를 `~/.openclaw/` 및 `~/.openclaw/workspace/` 경로에 저장하므로, 본 VM을 **상태 유지(Stateful)** 모드로 관리할 것을 권장함.*

### 2) 필수 패키지 설치 (VM 내부)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

### 3) OpenClaw 설치

OpenClaw 통합 설치 스크립트를 실행함:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 4) Nginx 역방향 프록시 설정 (8000 포트)

`/etc/nginx/sites-enabled/default` 파일을 다음과 같이 수정함:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket 지원 설정
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 표준 프록시 헤더 설정
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 장시간 연결 유지를 위한 타임아웃 설정
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### 5) 접속 및 권한 승인

`https://<vm-이름>.exe.xyz/` 주소로 접속함 (온보딩 과정에서 출력된 제어 UI 주소 확인). 인증 화면이 나타나면 VM 터미널에서 `gateway.auth.token` 값을 확인하여 입력함:
- 토큰 확인: `openclaw config get gateway.auth.token`
- 토큰 생성 필요 시: `openclaw doctor --generate-gateway-token`

접속 기기는 `openclaw devices list` 명령으로 확인한 뒤 `openclaw devices approve <requestId>` 명령으로 승인함.

## 원격 액세스 보안

원격 접속 보안은 [exe.dev](https://exe.dev) 자체 인증 시스템이 담당함. 기본적으로 8000 포트로 들어오는 모든 HTTP 트래픽은 등록된 이메일 인증을 거쳐 `https://<vm-이름>.exe.xyz`로 안전하게 전달됨.

## 버전 업데이트

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

상세 내용은 [업데이트 가이드](/install/updating)를 참조함.
