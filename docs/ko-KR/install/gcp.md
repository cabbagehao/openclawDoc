---
summary: "GCP Compute Engine VM(Docker)에서 durable state와 함께 OpenClaw Gateway를 24/7 실행"
read_when:
  - GCP에서 OpenClaw를 24/7 실행하려고 할 때
  - 자신의 VM에서 production-grade always-on Gateway를 운영하려고 할 때
  - Persistence, binary, restart 동작을 완전히 제어하려고 할 때
title: "GCP"
---

# OpenClaw on GCP Compute Engine (Docker, Production VPS Guide)

## 목표

Docker를 사용해 GCP Compute Engine VM에서 persistent OpenClaw Gateway를 실행하고, durable state, baked-in binary, 안전한 restart 동작을 갖추는 것입니다.

"월 약 $5-12로 OpenClaw를 24/7 운영"하고 싶다면, 이 구성은 Google Cloud에서 신뢰할 수 있는 방식입니다.
가격은 machine type과 region에 따라 달라집니다. 워크로드에 맞는 가장 작은 VM부터 시작하고, OOM이 발생하면 scale up하세요.

## 무엇을 하나요? (쉽게 설명하면)

- GCP project 생성 및 billing 활성화
- Compute Engine VM 생성
- Docker 설치(격리된 app runtime)
- Docker에서 OpenClaw Gateway 시작
- Host에 `~/.openclaw` + `~/.openclaw/workspace`를 영속화(restart/rebuild 후에도 유지)
- SSH tunnel을 통해 노트북에서 Control UI 접근

Gateway는 다음 방식으로 접근할 수 있습니다.

- 노트북에서 SSH port forwarding
- Firewall과 token을 직접 관리하는 경우 direct port exposure

이 가이드는 GCP Compute Engine의 Debian을 사용합니다.
Ubuntu도 동작하며, 패키지만 해당 환경에 맞게 바꾸면 됩니다.
일반적인 Docker 흐름은 [Docker](/install/docker)를 참고하세요.

---

## 빠른 경로 (숙련된 운영자용)

1. GCP project 생성 + Compute Engine API 활성화
2. Compute Engine VM 생성 (`e2-small`, Debian 12, 20GB)
3. VM에 SSH 접속
4. Docker 설치
5. OpenClaw repository clone
6. Persistent host directory 생성
7. `.env`와 `docker-compose.yml` 구성
8. 필요한 binary를 bake하고 build 및 실행

---

## 준비물

- GCP account (`e2-micro`는 free tier 대상)
- gcloud CLI 설치(또는 Cloud Console 사용)
- 노트북에서의 SSH 접근
- SSH + copy/paste에 대한 기본적인 익숙함
- 약 20-30분
- Docker와 Docker Compose
- Model auth credential
- 선택적 provider credential
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

## 1) gcloud CLI 설치 (또는 Console 사용)

**옵션 A: gcloud CLI** (자동화에 권장)

[https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)에서 설치하세요.

초기화 및 인증:

```bash
gcloud init
gcloud auth login
```

**옵션 B: Cloud Console**

모든 단계는 [https://console.cloud.google.com](https://console.cloud.google.com) 웹 UI에서도 수행할 수 있습니다.

---

## 2) GCP project 만들기

**CLI:**

```bash
gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
gcloud config set project my-openclaw-project
```

[https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)에서 billing을 활성화하세요(Compute Engine에 필요).

Compute Engine API 활성화:

```bash
gcloud services enable compute.googleapis.com
```

**Console:**

1. IAM & Admin > Create Project로 이동
2. 이름을 정하고 생성
3. Project에 billing 활성화
4. APIs & Services > Enable APIs로 이동 > "Compute Engine API" 검색 > Enable

---

## 3) VM 만들기

**Machine type:**

| Type      | 사양                     | 비용               | 참고                                         |
| --------- | ------------------------ | ------------------ | -------------------------------------------- |
| e2-medium | 2 vCPU, 4GB RAM          | 약 $25/월          | 로컬 Docker build에 가장 안정적             |
| e2-small  | 2 vCPU, 2GB RAM          | 약 $12/월          | Docker build를 위한 최소 권장 사양          |
| e2-micro  | 2 vCPU (shared), 1GB RAM | free tier 대상     | Docker build 중 OOM(exit 137) 실패가 잦음   |

**CLI:**

```bash
gcloud compute instances create openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

**Console:**

1. Compute Engine > VM instances > Create instance로 이동
2. 이름: `openclaw-gateway`
3. Region: `us-central1`, Zone: `us-central1-a`
4. Machine type: `e2-small`
5. Boot disk: Debian 12, 20GB
6. 생성

---

## 4) VM에 SSH 접속

**CLI:**

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

**Console:**

Compute Engine dashboard에서 VM 옆의 "SSH" 버튼을 클릭하세요.

참고: SSH key 전파에는 VM 생성 후 1-2분 정도 걸릴 수 있습니다. 연결이 거부되면 잠시 기다렸다가 다시 시도하세요.

---

## 5) Docker 설치 (VM에서)

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Group 변경을 적용하려면 로그아웃 후 다시 로그인하세요.

```bash
exit
```

그런 다음 다시 SSH 접속:

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

확인:

```bash
docker --version
docker compose version
```

---

## 6) OpenClaw repository clone

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

이 가이드는 binary persistence를 보장하기 위해 custom image를 build한다고 가정합니다.

---

## 7) Persistent host directory 생성

Docker container는 ephemeral합니다.
모든 장기 상태는 host에 있어야 합니다.

```bash
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
```

---

## 8) Environment variable 구성

Repository root에 `.env`를 생성하세요.

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

강력한 secret 생성:

```bash
openssl rand -hex 32
```

**이 파일은 commit하지 마세요.**

---

## 9) Docker Compose 구성

`docker-compose.yml`을 생성하거나 업데이트하세요.

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
      # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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
      ]
```

---

## 10) 필요한 binary를 image에 bake하기 (중요)

실행 중인 container 내부에 binary를 설치하는 것은 함정입니다.
런타임에 설치한 것은 restart 시 모두 사라집니다.

Skill에 필요한 모든 외부 binary는 image build 시점에 설치해야 합니다.

아래 예시는 세 가지 흔한 binary만 보여 줍니다.

- Gmail 접근용 `gog`
- Google Places용 `goplaces`
- WhatsApp용 `wacli`

이것들은 예시일 뿐이며, 완전한 목록이 아닙니다.
같은 패턴으로 필요한 만큼 binary를 설치할 수 있습니다.

나중에 추가 binary에 의존하는 새 skill을 넣는다면 다음을 해야 합니다.

1. Dockerfile 업데이트
2. Image 재빌드
3. Container 재시작

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

## 11) Build 및 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 중 `Killed` / `exit code 137`로 build가 실패하면 VM 메모리가 부족한 것입니다. 최소 `e2-small`, 첫 build를 더 안정적으로 하려면 `e2-medium`을 사용하세요.

LAN에 bind하는 경우(`OPENCLAW_GATEWAY_BIND=lan`) 계속 진행하기 전에 신뢰할 browser origin을 구성하세요.

```bash
docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
```

Gateway port를 바꿨다면 `18789`를 구성한 port로 바꾸세요.

Binary 확인:

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

## 12) Gateway 확인

```bash
docker compose logs -f openclaw-gateway
```

성공 시:

```
[gateway] listening on ws://0.0.0.0:18789
```

---

## 13) 노트북에서 접근

Gateway port를 전달하는 SSH tunnel을 만드세요.

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

Browser에서 열기:

`http://127.0.0.1:18789/`

새 tokenized dashboard link 가져오기:

```bash
docker compose run --rm openclaw-cli dashboard --no-open
```

해당 URL의 token을 붙여 넣으세요.

Control UI에 `unauthorized` 또는 `disconnected (1008): pairing required`가 표시되면 browser device를 승인하세요.

```bash
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

---

## 무엇이 어디에 영속되는가 (source of truth)

OpenClaw는 Docker에서 실행되지만, Docker가 source of truth는 아닙니다.
모든 장기 상태는 restart, rebuild, reboot 후에도 살아남아야 합니다.

| Component           | 위치                              | Persistence mechanism | 참고                             |
| ------------------- | --------------------------------- | --------------------- | -------------------------------- |
| Gateway config      | `/home/node/.openclaw/`           | Host volume mount     | `openclaw.json`, token 포함      |
| Model auth profile  | `/home/node/.openclaw/`           | Host volume mount     | OAuth token, API key             |
| Skill config        | `/home/node/.openclaw/skills/`    | Host volume mount     | Skill 수준 상태                  |
| Agent workspace     | `/home/node/.openclaw/workspace/` | Host volume mount     | Code와 agent artifact            |
| WhatsApp session    | `/home/node/.openclaw/`           | Host volume mount     | QR login 유지                    |
| Gmail keyring       | `/home/node/.openclaw/`           | Host volume + password | `GOG_KEYRING_PASSWORD` 필요     |
| External binary     | `/usr/local/bin/`                 | Docker image          | Build 시점에 bake되어야 함       |
| Node runtime        | Container filesystem              | Docker image          | Image build 때마다 재빌드됨      |
| OS package          | Container filesystem              | Docker image          | Runtime에 설치하지 마세요        |
| Docker container    | Ephemeral                         | Restartable           | 안전하게 삭제 가능               |

---

## 업데이트

VM에서 OpenClaw를 업데이트하려면:

```bash
cd ~/openclaw
git pull
docker compose build
docker compose up -d
```

---

## 문제 해결

**SSH 연결 거부**

SSH key 전파에는 VM 생성 후 1-2분 정도 걸릴 수 있습니다. 잠시 기다렸다가 다시 시도하세요.

**OS Login 문제**

OS Login profile 확인:

```bash
gcloud compute os-login describe-profile
```

계정에 필요한 IAM 권한(Compute OS Login 또는 Compute OS Admin Login)이 있는지 확인하세요.

**메모리 부족 (OOM)**

Docker build가 `Killed`와 `exit code 137`로 실패하면 VM이 OOM-kill된 것입니다. `e2-small`(최소) 또는 `e2-medium`(로컬 build 안정성 권장)으로 업그레이드하세요.

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service account (보안 모범 사례)

개인 용도라면 기본 사용자 account로 충분합니다.

자동화 또는 CI/CD pipeline에서는 최소 권한만 가진 전용 service account를 만드세요.

1. Service account 생성:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin role(또는 더 좁은 custom role) 부여:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

자동화에 Owner role을 사용하지 마세요. 최소 권한 원칙을 따르세요.

IAM role 세부사항은 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)를 참고하세요.

---

## 다음 단계

- 메시징 채널 설정: [Channels](/channels)
- Local device를 node로 pairing: [Nodes](/nodes)
- Gateway 구성: [Gateway configuration](/gateway/configuration)
