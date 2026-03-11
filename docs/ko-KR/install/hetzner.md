---
summary: "저렴한 Hetzner VPS(Docker)에서 내구성 있는 state와 image에 포함된 binary로 OpenClaw Gateway를 24/7 실행"
read_when:
  - 노트북이 아닌 cloud VPS에서 OpenClaw를 24/7 실행하고 싶을 때
  - 자신의 VPS에서 production-grade, always-on Gateway를 원할 때
  - persistence, binary, restart 동작을 완전히 제어하고 싶을 때
  - Hetzner 또는 유사한 provider에서 Docker로 OpenClaw를 실행 중일 때
title: "Hetzner"
---

# Hetzner에서 OpenClaw 실행하기 (Docker, Production VPS 가이드)

## 목표

Docker를 사용해 Hetzner VPS에서 persistent OpenClaw Gateway를 실행하고, durable state, image에 포함된 binary, 안전한 restart 동작을 확보합니다.

“약 $5로 OpenClaw를 24/7” 원한다면, 이것이 가장 단순하고 신뢰할 수 있는 구성입니다.
Hetzner 가격은 변동될 수 있으니 가장 작은 Debian/Ubuntu VPS를 고르고 OOM이 발생하면 상향하세요.

보안 모델 상기:

- 모두가 같은 신뢰 경계 안에 있고 runtime이 업무 전용이라면 회사 공유 에이전트는 괜찮습니다.
- 엄격히 분리하세요: 전용 VPS/runtime + 전용 계정. 해당 호스트에는 개인 Apple/Google/browser/password-manager profile을 두지 마세요.
- 사용자가 서로 적대적일 수 있다면 gateway/host/OS user 단위로 분리하세요.

[Security](/gateway/security) 및 [VPS hosting](/vps)을 참고하세요.

## 무엇을 하는가 (쉬운 설명)

- 작은 Linux 서버(Hetzner VPS)를 임대
- Docker 설치 (격리된 앱 runtime)
- Docker에서 OpenClaw Gateway 시작
- 호스트에 `~/.openclaw` + `~/.openclaw/workspace`를 persist (restart/rebuild 후에도 유지)
- SSH tunnel로 노트북에서 Control UI 접속

Gateway는 다음 방식으로 접근할 수 있습니다:

- 노트북에서 SSH port forwarding
- firewall과 token을 직접 관리하는 경우 직접 포트 노출

이 가이드는 Hetzner의 Ubuntu 또는 Debian을 가정합니다.  
다른 Linux VPS를 쓴다면 패키지는 그에 맞게 바꾸세요.
일반적인 Docker 흐름은 [Docker](/install/docker)를 참고하세요.

---

## 빠른 경로 (숙련된 운영자용)

1. Hetzner VPS 프로비저닝
2. Docker 설치
3. OpenClaw 저장소 clone
4. persistent host 디렉터리 생성
5. `.env`와 `docker-compose.yml` 구성
6. 필요한 binary를 image에 bake
7. `docker compose up -d`
8. persistence와 Gateway 접근 확인

---

## 필요한 것

- root 접근 권한이 있는 Hetzner VPS
- 노트북에서의 SSH 접근
- SSH + copy/paste에 대한 기본적인 익숙함
- 약 20분
- Docker 및 Docker Compose
- model auth 자격 증명
- 선택적 provider 자격 증명
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

## 1) VPS 프로비저닝

Hetzner에서 Ubuntu 또는 Debian VPS를 생성합니다.

root로 접속:

```bash
ssh root@YOUR_VPS_IP
```

이 가이드는 VPS가 stateful하다고 가정합니다.
이를 disposable infrastructure로 취급하지 마세요.

---

## 2) Docker 설치 (VPS에서)

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

확인:

```bash
docker --version
docker compose version
```

---

## 3) OpenClaw 저장소 clone

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

이 가이드는 binary persistence를 확실히 보장하기 위해 custom image를 빌드한다고 가정합니다.

---

## 4) persistent host 디렉터리 생성

Docker 컨테이너는 ephemeral합니다.
수명이 긴 모든 state는 호스트에 있어야 합니다.

```bash
mkdir -p /root/.openclaw/workspace

# Set ownership to the container user (uid 1000):
chown -R 1000:1000 /root/.openclaw
```

---

## 5) 환경 변수 구성

저장소 루트에 `.env`를 만듭니다.

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.openclaw
OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

강력한 secret 생성:

```bash
openssl rand -hex 32
```

**이 파일은 commit하지 마세요.**

---

## 6) Docker Compose 구성

`docker-compose.yml`을 만들거나 업데이트합니다.

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE}
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HOME=/home/node
      - NODE_ENV=production
      - TERM=xterm-256color
      - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
      - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
      - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
      - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    ports:
      # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
      # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${OPENCLAW_GATEWAY_BIND}",
        "--port",
        "${OPENCLAW_GATEWAY_PORT}",
        "--allow-unconfigured",
      ]
```

`--allow-unconfigured`는 bootstrap 편의용일 뿐이며, 올바른 gateway 구성을 대체하지는 않습니다. 그래도 auth(`gateway.auth.token` 또는 password)를 설정하고 배포에 맞는 안전한 bind 설정을 사용하세요.

---

## 7) 필요한 binary를 image에 bake (중요)

실행 중인 컨테이너 안에 binary를 설치하는 것은 함정입니다.
런타임에 설치한 것은 restart 시 모두 사라집니다.

skill에 필요한 외부 binary는 모두 image build 시점에 설치해야 합니다.

아래 예시는 흔한 binary 세 가지만 보여줍니다:

- Gmail 접근용 `gog`
- Google Places용 `goplaces`
- WhatsApp용 `wacli`

이것들은 예시일 뿐이며, 전체 목록이 아닙니다.
같은 패턴으로 필요한 만큼 binary를 설치할 수 있습니다.

나중에 추가 binary가 필요한 새 skill을 추가하면 다음을 해야 합니다:

1. Dockerfile 업데이트
2. 이미지 재빌드
3. 컨테이너 재시작

**예시 Dockerfile**

```dockerfile
FROM node:22-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

---

## 8) 빌드 및 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```

binary 확인:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

예상 출력:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 9) Gateway 확인

```bash
docker compose logs -f openclaw-gateway
```

성공:

```
[gateway] listening on ws://0.0.0.0:18789
```

노트북에서:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

열기:

`http://127.0.0.1:18789/`

gateway token을 붙여 넣으세요.

---

## 무엇이 어디에 persist되는가 (source of truth)

OpenClaw는 Docker에서 실행되지만, Docker가 source of truth는 아닙니다.
수명이 긴 모든 state는 restart, rebuild, reboot 후에도 살아남아야 합니다.

| Component | Location | Persistence mechanism | Notes |
| ------------------- | --------------------------------- | ---------------------- | -------------------------------- |
| Gateway config | `/home/node/.openclaw/` | Host volume mount | `openclaw.json`, token 포함 |
| Model auth profiles | `/home/node/.openclaw/` | Host volume mount | OAuth token, API key |
| Skill config | `/home/node/.openclaw/skills/` | Host volume mount | Skill 수준 state |
| Agent workspace | `/home/node/.openclaw/workspace/` | Host volume mount | 코드 및 agent artifact |
| WhatsApp session | `/home/node/.openclaw/` | Host volume mount | QR 로그인 유지 |
| Gmail keyring | `/home/node/.openclaw/` | Host volume + password | `GOG_KEYRING_PASSWORD` 필요 |
| External binaries | `/usr/local/bin/` | Docker image | build 시 bake되어야 함 |
| Node runtime | Container filesystem | Docker image | 이미지 빌드마다 다시 생성 |
| OS packages | Container filesystem | Docker image | 런타임에 설치하지 말 것 |
| Docker container | Ephemeral | Restartable | 삭제해도 안전 |

---

## Infrastructure as Code (Terraform)

infrastructure-as-code 워크플로우를 선호하는 팀을 위해, 커뮤니티에서 유지 관리하는 Terraform 구성이 다음을 제공합니다:

- remote state management를 포함한 모듈식 Terraform 구성
- cloud-init을 통한 자동 프로비저닝
- 배포 스크립트(bootstrap, deploy, backup/restore)
- 보안 강화(firewall, UFW, SSH-only access)
- gateway 접근용 SSH tunnel 구성

**저장소:**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

이 접근 방식은 위 Docker 설정을 재현 가능한 배포, 버전 관리되는 infrastructure, 자동화된 disaster recovery로 보완합니다.

> **참고:** 커뮤니티 유지 관리 항목입니다. 이슈나 기여는 위 저장소 링크를 참고하세요.
