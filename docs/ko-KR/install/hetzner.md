---
title: Hetzner
description: Hetzner VPS에서 Docker로 OpenClaw Gateway를 24시간 운영하고 영구 상태와 SSH 터널 접근을 구성하는 가이드
summary: 저렴한 Hetzner VPS(Docker)에서 OpenClaw Gateway를 상시 운영하고 상태를 영구 보존하는 가이드
read_when:
  - 노트북이 아닌 클라우드 VPS에서 OpenClaw를 24시간 운영하고 싶을 때
  - 직접 관리하는 VPS에서 운영용 Gateway를 실행하고 싶을 때
  - 영속성, 바이너리, 재시작 동작을 직접 제어하고 싶을 때
  - Hetzner나 유사한 제공자에서 Docker로 OpenClaw를 실행할 때
x-i18n:
  source_path: install/hetzner.md
---

# Hetzner에서 OpenClaw 실행하기

## 목표

Docker를 사용해 Hetzner VPS에서 OpenClaw Gateway를 지속적으로 실행합니다. 상태는 영구 보존되고, 필요한 바이너리는 이미지에 포함되며, 재시작 동작도 안전하게 유지하는 구성을 목표로 합니다.

월 약 `$5` 수준으로 OpenClaw를 24시간 운영하고 싶다면 가장 단순하고 신뢰할 수 있는 선택지 중 하나입니다. Hetzner 요금은 변동될 수 있으므로 가장 작은 Debian/Ubuntu VPS로 시작하고 OOM이 발생하면 사양을 올리세요.

보안 모델도 함께 기억하세요.

- 같은 신뢰 경계 안에서 업무용으로만 사용한다면 회사 공용 agent도 괜찮습니다.
- 엄격한 분리가 필요하면 전용 VPS/런타임과 전용 계정을 사용하세요. 해당 호스트에는 개인 Apple/Google/브라우저/비밀번호 관리자 프로필을 두지 않는 편이 안전합니다.
- 사용자가 서로 적대적일 수 있다면 gateway, host, OS user를 나눠야 합니다.

자세한 내용은 [Security](/gateway/security)와 [VPS hosting](/vps)을 참고하세요.

## 무엇을 하게 되나요?

- 작은 Linux 서버(Hetzner VPS)를 준비합니다.
- Docker를 설치합니다.
- Docker 안에서 OpenClaw Gateway를 실행합니다.
- 호스트의 `~/.openclaw`와 `~/.openclaw/workspace`를 영구 보존합니다.
- SSH 터널을 통해 노트북에서 Control UI에 접속합니다.

Gateway 접근 방식은 두 가지입니다.

- 노트북에서 SSH port forwarding 사용
- firewall과 token을 직접 관리하면서 포트를 외부에 노출

이 가이드는 Hetzner의 Ubuntu 또는 Debian을 기준으로 설명합니다. 다른 Linux VPS에서는 패키지 이름과 명령을 환경에 맞게 바꾸세요. 일반적인 Docker 흐름은 [Docker](/install/docker) 문서를 참고하세요.

---

## 빠른 경로(숙련자용)

1. Hetzner VPS를 준비합니다.
2. Docker를 설치합니다.
3. OpenClaw 저장소를 clone합니다.
4. 영구 host 디렉터리를 만듭니다.
5. `.env`와 `docker-compose.yml`을 구성합니다.
6. 필요한 바이너리를 이미지에 bake합니다.
7. `docker compose up -d`를 실행합니다.
8. 영속성과 Gateway 접근을 확인합니다.

---

## 준비 사항

- root 접근이 가능한 Hetzner VPS
- 노트북에서 SSH 접속 가능
- SSH와 복사/붙여넣기에 대한 기본 이해
- 약 20분
- Docker와 Docker Compose
- 모델 인증 정보
- 선택적 provider 자격 증명
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

## 1) VPS 준비

Hetzner에서 Ubuntu 또는 Debian VPS를 만듭니다.

root로 접속:

```bash
ssh root@YOUR_VPS_IP
```

이 가이드는 VPS를 stateful하게 운영하는 것을 전제로 합니다. 일회용 인프라처럼 취급하지 마세요.

---

## 2) Docker 설치(VPS 내부)

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

## 3) OpenClaw 저장소 클론

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

이 가이드는 바이너리를 확실히 유지하기 위해 custom image를 직접 빌드하는 흐름을 전제로 합니다.

---

## 4) 영구 host 디렉터리 만들기

Docker 컨테이너는 일시적입니다. 오래 유지해야 하는 상태는 모두 host에 있어야 합니다.

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

강한 시크릿은 다음처럼 생성합니다.

```bash
openssl rand -hex 32
```

**이 파일은 commit하지 마세요.**

---

## 6) Docker Compose 구성

`docker-compose.yml`을 만들거나 갱신합니다.

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

`--allow-unconfigured`는 bootstrap 편의를 위한 옵션일 뿐이며, 올바른 gateway config를 대신하지는 않습니다. 배포 환경에 맞게 auth(`gateway.auth.token` 또는 password)를 설정하고 안전한 bind 설정을 사용하세요.

---

## 7) 필요한 바이너리를 이미지에 bake하기(중요)

실행 중인 컨테이너 안에 바이너리를 설치하는 방식은 함정입니다. 런타임에 설치한 내용은 재시작하면 사라집니다.

skill이 필요로 하는 외부 바이너리는 모두 이미지 빌드 시점에 설치해야 합니다.

아래 예시는 대표적인 세 가지 바이너리만 보여줍니다.

- Gmail 접근용 `gog`
- Google Places용 `goplaces`
- WhatsApp용 `wacli`

예시일 뿐이며 전체 목록은 아닙니다. 같은 패턴으로 필요한 바이너리를 얼마든지 추가할 수 있습니다.

나중에 새 skill이 추가 바이너리를 요구하면 반드시 다음 순서를 따르세요.

1. Dockerfile을 수정합니다.
2. 이미지를 다시 빌드합니다.
3. 컨테이너를 재시작합니다.

**Dockerfile 예시**

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

바이너리 확인:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

예상 출력:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 9) Gateway 확인

```bash
docker compose logs -f openclaw-gateway
```

성공 예시:

```text
[gateway] listening on ws://0.0.0.0:18789
```

노트북에서:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

브라우저에서 엽니다.

`http://127.0.0.1:18789/`

gateway token을 붙여 넣으세요.

---

## 무엇이 어디에 보존되나(source of truth)

OpenClaw는 Docker 안에서 실행되지만, Docker 자체가 source of truth는 아닙니다. 모든 장기 상태는 재시작, 재빌드, 재부팅 후에도 남아야 합니다.

| Component | Location | Persistence mechanism | Notes |
| --- | --- | --- | --- |
| Gateway config | `/home/node/.openclaw/` | Host volume mount | `openclaw.json`, token 포함 |
| Model auth profiles | `/home/node/.openclaw/` | Host volume mount | OAuth token, API key |
| Skill configs | `/home/node/.openclaw/skills/` | Host volume mount | Skill 수준 상태 |
| Agent workspace | `/home/node/.openclaw/workspace/` | Host volume mount | 코드와 agent 산출물 |
| WhatsApp session | `/home/node/.openclaw/` | Host volume mount | QR 로그인 유지 |
| Gmail keyring | `/home/node/.openclaw/` | Host volume + password | `GOG_KEYRING_PASSWORD` 필요 |
| External binaries | `/usr/local/bin/` | Docker image | 빌드 시점에 bake 필요 |
| Node runtime | Container filesystem | Docker image | 이미지 재빌드 때마다 교체 |
| OS packages | Container filesystem | Docker image | 런타임 설치 금지 |
| Docker container | Ephemeral | Restartable | 삭제해도 무방 |

---

## Infrastructure as Code(Terraform)

인프라를 코드로 관리하고 싶다면 커뮤니티 유지 Terraform 구성이 다음을 제공합니다.

- remote state 관리가 가능한 모듈형 Terraform 설정
- cloud-init을 통한 자동 프로비저닝
- 배포, bootstrap, backup/restore 스크립트
- 보안 강화(firewall, UFW, SSH-only access)
- gateway 접근용 SSH tunnel 구성

**저장소**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

이 접근은 위 Docker 구성을 보완해 재현 가능한 배포, 버전 관리되는 인프라, 자동화된 장애 복구 흐름을 제공합니다.

> **참고:** 커뮤니티 유지 저장소입니다. 이슈나 기여는 위 저장소 링크를 참고하세요.
