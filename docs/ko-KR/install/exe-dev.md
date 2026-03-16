---
title: exe.dev
description: exe.dev VM에 OpenClaw Gateway를 설치하고 HTTPS 프록시로 원격 Control UI에 접속하는 가이드
summary: 원격 접근용 exe.dev(VM + HTTPS proxy) 환경에서 OpenClaw Gateway를 실행하는 가이드
read_when:
  - Gateway를 항상 켜 둘 저렴한 Linux 호스트가 필요할 때
  - 직접 VPS를 운영하지 않고 원격 Control UI에 접속하고 싶을 때
x-i18n:
  source_path: install/exe-dev.md
---

# exe.dev

목표: 노트북에서 `https://<vm-name>.exe.xyz`로 접속할 수 있는 exe.dev VM에서 OpenClaw Gateway를 실행합니다.

이 문서는 exe.dev의 기본 **exeuntu** 이미지를 기준으로 작성되었습니다. 다른 배포판을 선택했다면 패키지 이름과 명령을 그 환경에 맞게 바꿔 적용하세요.

## 빠른 경로

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 필요한 auth key 또는 token을 입력합니다.
3. VM 옆의 "Agent"를 클릭하고 잠시 기다립니다.
4. ???
5. Profit

## 준비 사항

- exe.dev 계정
- [exe.dev](https://exe.dev) 가상 머신에 대한 `ssh exe.dev` 접근 권한(선택)

## Shelley를 이용한 자동 설치

exe.dev의 agent인 Shelley는 아래 프롬프트로 OpenClaw를 바로 설치할 수 있습니다. 사용되는 프롬프트는 다음과 같습니다.

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 수동 설치

## 1) VM 만들기

사용 중인 기기에서:

```bash
ssh exe.dev new
```

그다음 연결합니다.

```bash
ssh <vm-name>.exe.xyz
```

팁: 이 VM은 **stateful**하게 유지하세요. OpenClaw는 상태를 `~/.openclaw/`와 `~/.openclaw/workspace/`에 저장합니다.

## 2) 필수 패키지 설치(VM 내부)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw 설치

OpenClaw 설치 스크립트를 실행합니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx로 OpenClaw를 8000 포트에 프록시하기

`/etc/nginx/sites-enabled/default`를 다음 내용으로 수정합니다.

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

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 5) OpenClaw에 접속하고 권한 부여

`https://<vm-name>.exe.xyz/`로 접속합니다(온보딩 중 출력된 Control UI 주소를 참고). 인증을 요구하면 VM에서 `gateway.auth.token` 값을 붙여 넣으세요. 토큰은 `openclaw config get gateway.auth.token`으로 확인할 수 있고, 필요하면 `openclaw doctor --generate-gateway-token`으로 생성할 수 있습니다. 기기 승인은 `openclaw devices list`와 `openclaw devices approve <requestId>`로 처리합니다. 막히면 브라우저에서 Shelley를 써도 됩니다.

## 원격 접근

원격 접근 인증은 [exe.dev](https://exe.dev)가 처리합니다. 기본적으로 8000 포트로 들어온 HTTP 트래픽은 이메일 인증을 거쳐 `https://<vm-name>.exe.xyz`로 전달됩니다.

## 업데이트

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

가이드: [Updating](/install/updating)
