---
title: GCP
description: GCP Compute Engine VM에서 Docker로 OpenClaw Gateway를 24시간 운영하고 영구 상태와 SSH 터널 접근을 구성하는 가이드
summary: GCP Compute Engine VM(Docker)에서 OpenClaw Gateway를 상시 운영하고 상태를 영구 보존하는 가이드
read_when:
  - GCP에서 OpenClaw를 24시간 운영하고 싶을 때
  - 직접 관리하는 VM에서 운영용 Gateway를 실행하고 싶을 때
  - 영속성, 바이너리, 재시작 동작을 직접 통제하고 싶을 때
x-i18n:
  source_path: install/gcp.md
---

# GCP Compute Engine에서 OpenClaw 실행하기

## 목표

Docker를 사용해 GCP Compute Engine VM에서 OpenClaw Gateway를 지속적으로 실행합니다. 상태는 영구 보존되고, 필요한 바이너리는 이미지에 포함되며, 재시작 동작도 안전하게 유지하는 구성을 목표로 합니다.

월 약 `$5-12` 수준으로 OpenClaw를 24시간 운영하고 싶다면 Google Cloud에서 충분히 실용적인 선택입니다. 비용은 머신 타입과 리전에 따라 달라지므로, 먼저 가장 작은 VM부터 시작하고 OOM이 발생하면 사양을 올리세요.

## 무엇을 하게 되나요?

- GCP 프로젝트를 만들고 billing을 활성화합니다.
- Compute Engine VM을 생성합니다.
- Docker를 설치합니다.
- Docker 안에서 OpenClaw Gateway를 실행합니다.
- 호스트의 `~/.openclaw`와 `~/.openclaw/workspace`를 영구 보존합니다.
- SSH 터널을 통해 노트북에서 Control UI에 접속합니다.

Gateway 접근 방식은 두 가지입니다.

- 노트북에서 SSH port forwarding 사용
- firewall과 token을 직접 관리하면서 포트를 외부에 노출

이 가이드는 GCP Compute Engine의 Debian을 기준으로 설명합니다. Ubuntu도 가능하지만 패키지 이름과 명령은 환경에 맞게 바꿔야 합니다. 일반적인 Docker 흐름은 [Docker](/install/docker) 문서를 참고하세요.

---

## 빠른 경로(숙련자용)

1. GCP 프로젝트를 만들고 Compute Engine API를 활성화합니다.
2. Compute Engine VM을 생성합니다(`e2-small`, Debian 12, 20GB).
3. VM에 SSH로 접속합니다.
4. Docker를 설치합니다.
5. OpenClaw 저장소를 클론합니다.
6. 호스트 영구 디렉터리를 만듭니다.
7. `.env`와 `docker-compose.yml`을 구성합니다.
8. 필요한 바이너리를 이미지에 bake하고 빌드 및 실행합니다.

---

## 준비 사항

- GCP 계정(`e2-micro`는 free tier 대상일 수 있음)
- `gcloud` CLI 설치 또는 Cloud Console 사용
- 노트북에서 SSH 접속 가능
- SSH와 복사/붙여넣기에 대한 기본 이해
- 20~30분 정도의 작업 시간
- Docker와 Docker Compose
- 모델 인증 정보
- 선택적 provider 자격 증명
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

## 1) `gcloud` CLI 설치(또는 Console 사용)

**옵션 A: `gcloud` CLI**(자동화에 권장)

[https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)에서 설치합니다.

초기화와 인증:

```bash
gcloud init
gcloud auth login
```

**옵션 B: Cloud Console**

모든 작업은 [https://console.cloud.google.com](https://console.cloud.google.com) 웹 UI에서도 할 수 있습니다.

---

## 2) GCP 프로젝트 만들기

**CLI:**

```bash
gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
gcloud config set project my-openclaw-project
```

Compute Engine을 쓰려면 [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)에서 billing을 연결해야 합니다.

이후 Compute Engine API를 활성화합니다.

```bash
gcloud services enable compute.googleapis.com
```

**Console:**

1. IAM & Admin > Create Project로 이동합니다.
2. 프로젝트 이름을 정하고 생성합니다.
3. 해당 프로젝트에 billing을 연결합니다.
4. APIs & Services > Enable APIs에서 "Compute Engine API"를 검색해 활성화합니다.

---

## 3) VM 만들기

**머신 타입**

| Type | Specs | Cost | Notes |
| --- | --- | --- | --- |
| e2-medium | 2 vCPU, 4GB RAM | ~$25/mo | 로컬 Docker 빌드에 가장 안정적 |
| e2-small | 2 vCPU, 2GB RAM | ~$12/mo | Docker build 최소 권장 사양 |
| e2-micro | 2 vCPU (shared), 1GB RAM | Free tier eligible | Docker build 중 OOM(exit 137)이 자주 발생 |

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

1. Compute Engine > VM instances > Create instance로 이동합니다.
2. 이름은 `openclaw-gateway`로 지정합니다.
3. Region은 `us-central1`, Zone은 `us-central1-a`를 선택합니다.
4. Machine type은 `e2-small`을 선택합니다.
5. Boot disk는 Debian 12, 20GB로 설정합니다.
6. 생성합니다.

---

## 4) VM에 SSH 접속

**CLI:**

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

**Console:**

Compute Engine 대시보드에서 VM 옆의 **SSH** 버튼을 클릭합니다.

참고로 VM 생성 직후에는 SSH key 전파에 1~2분 정도 걸릴 수 있습니다. 연결이 거부되면 잠시 기다렸다가 다시 시도하세요.

---

## 5) Docker 설치(VM 내부)

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

group 변경을 적용하려면 로그아웃 후 다시 로그인합니다.

```bash
exit
```

그다음 다시 SSH 접속:

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

확인:

```bash
docker --version
docker compose version
```

---

## 6) OpenClaw 저장소 클론

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

이 가이드는 바이너리를 확실히 유지하기 위해 custom image를 직접 빌드하는 흐름을 전제로 합니다.

---

## 7) 영구 호스트 디렉터리 만들기

Docker 컨테이너는 일시적입니다. 오래 유지해야 하는 상태는 모두 호스트에 있어야 합니다.

```bash
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
```

---

## 8) 환경 변수 구성

저장소 루트에 `.env`를 만듭니다.

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

강한 시크릿은 다음처럼 생성합니다.

```bash
openssl rand -hex 32
```

**이 파일은 commit하지 마세요.**

---

## 9) Docker Compose 구성

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

## 10) 필요한 바이너리를 이미지에 bake하기(중요)

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

## 11) 빌드 및 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 중 `Killed` 또는 `exit code 137`이 나면 VM 메모리가 부족한 것입니다. 최소 `e2-small`, 가능하면 첫 빌드는 `e2-medium`이 더 안정적입니다.

`OPENCLAW_GATEWAY_BIND=lan`으로 LAN 바인딩하는 경우, 다음 단계로 가기 전에 trusted browser origin을 설정해야 합니다.

```bash
docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
```

gateway port를 바꿨다면 `18789`를 그 포트로 바꾸세요.

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

## 12) Gateway 확인

```bash
docker compose logs -f openclaw-gateway
```

성공 예시:

```text
[gateway] listening on ws://0.0.0.0:18789
```

---

## 13) 노트북에서 접근

Gateway 포트를 전달하는 SSH 터널을 만듭니다.

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

브라우저에서 다음 주소를 엽니다.

`http://127.0.0.1:18789/`

새 tokenized dashboard link를 가져옵니다.

```bash
docker compose run --rm openclaw-cli dashboard --no-open
```

그 URL의 token을 붙여 넣으세요.

Control UI에 `unauthorized` 또는 `disconnected (1008): pairing required`가 보이면 브라우저 디바이스를 승인합니다.

```bash
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

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

**SSH connection refused**

VM 생성 직후에는 SSH key 전파에 1~2분 걸릴 수 있습니다. 잠시 기다렸다가 다시 시도하세요.

**OS Login issues**

OS Login profile을 확인합니다.

```bash
gcloud compute os-login describe-profile
```

계정에 필요한 IAM 권한(Compute OS Login 또는 Compute OS Admin Login)이 있는지도 확인하세요.

**Out of memory (OOM)**

Docker build가 `Killed`와 `exit code 137`로 실패하면 VM이 OOM-kill된 것입니다. `e2-small` 이상으로 올리거나, 첫 빌드 안정성을 원하면 `e2-medium`을 권장합니다.

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

## Service account(보안 모범 사례)

개인 용도라면 기본 사용자 계정으로도 충분합니다.

자동화나 CI/CD 파이프라인에서 운영한다면 최소 권한만 가진 전용 service account를 만드세요.

1. service account 생성:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin 역할(또는 더 좁은 custom role) 부여:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

자동화에는 Owner 역할을 사용하지 마세요. 최소 권한 원칙을 따르는 편이 안전합니다.

IAM 역할은 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)를 참고하세요.

---

## 다음 단계

- 메시징 채널 설정: [Channels](/channels)
- 로컬 디바이스를 node로 페어링: [Nodes](/nodes)
- Gateway 구성: [Gateway configuration](/gateway/configuration)
