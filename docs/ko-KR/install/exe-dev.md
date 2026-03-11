---
summary: "원격 액세스를 위해 exe.dev (VM + HTTPS proxy) 에서 OpenClaw Gateway 실행"
read_when:
  - Gateway 용으로 저렴한 상시 구동 Linux host 가 필요할 때
  - 직접 VPS 를 운영하지 않고 원격으로 Control UI 에 접근하고 싶을 때
title: "exe.dev"
---

# exe.dev

목표: 노트북에서 `https://<vm-name>.exe.xyz` 로 접근 가능한 exe.dev VM 위에서 OpenClaw Gateway 실행.

이 페이지는 exe.dev 기본 **exeuntu** 이미지를 가정합니다. 다른 배포판을 골랐다면 패키지는 그에 맞게 바꾸세요.

## 초보자용 빠른 경로

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 필요한 auth key/token 입력
3. VM 옆의 "Agent" 를 클릭하고 잠시 기다리기
4. ???
5. 완료

## 필요한 것

- exe.dev 계정
- [exe.dev](https://exe.dev) 가상 머신에 대한 `ssh exe.dev` 접근 (선택 사항)

## Shelley 를 이용한 자동 설치

Shelley 는 [exe.dev](https://exe.dev) 의 agent 로, 아래 프롬프트를 사용해 OpenClaw 를 즉시 설치할 수 있습니다:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 수동 설치

## 1) VM 생성

장치에서 다음 실행:

```bash
ssh exe.dev new
```

그다음 연결:

```bash
ssh <vm-name>.exe.xyz
```

팁: 이 VM 은 **stateful** 하게 유지하세요. OpenClaw 는 상태를 `~/.openclaw/` 와 `~/.openclaw/workspace/` 아래에 저장합니다.

## 2) 사전 요구 패키지 설치 (VM 에서)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw 설치

OpenClaw 설치 스크립트 실행:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx 를 설정해 OpenClaw 를 8000 포트로 프록시

`/etc/nginx/sites-enabled/default` 를 다음 내용으로 편집:

```
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

## 5) OpenClaw 접속 및 권한 부여

`https://<vm-name>.exe.xyz/` 에 접속합니다(onboarding 의 Control UI 출력 참고). 인증을 요구하면 VM 의 `gateway.auth.token` 토큰을 붙여 넣으세요(`openclaw config get gateway.auth.token` 으로 확인하거나 `openclaw doctor --generate-gateway-token` 으로 생성 가능). device 는 `openclaw devices list` 와 `openclaw devices approve <requestId>` 로 승인합니다. 확실하지 않으면 브라우저에서 Shelley 를 사용해도 됩니다.

## Remote Access

원격 액세스는 [exe.dev](https://exe.dev) 의 인증이 처리합니다. 기본적으로 8000 포트의 HTTP 트래픽은 이메일 인증과 함께 `https://<vm-name>.exe.xyz` 로 포워딩됩니다.

## Updating

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

가이드: [Updating](/install/updating)
