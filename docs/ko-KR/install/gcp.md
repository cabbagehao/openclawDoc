---
summary: "GCP Compute Engine VM(Docker) 환경에서 상시 가동되는 OpenClaw Gateway 구축 및 운영 가이드"
read_when:
  - GCP 클라우드 환경에서 에이전트를 24시간 상시 가동하고자 할 때
  - 자신만의 VM에서 운영급(Production-grade) Gateway를 운영하고 싶을 때
  - 데이터 영속성, 바이너리 관리 및 재시작 동작을 직접 제어하고자 할 때
title: "GCP 설치"
x-i18n:
  source_path: "install/gcp.md"
---

# GCP Compute Engine 설치 가이드 (Docker 기반)

## 목표

GCP Compute Engine VM에서 Docker를 사용하여 OpenClaw Gateway를 실행함. 영구적인 상태 저장소 구축, 필수 바이너리 내장 및 안전한 자동 재시작 환경 구성을 목표로 함.

월 약 **$5~$12** 수준의 비용으로 24시간 상시 가동되는 에이전트를 구축할 수 있음. 가격은 머신 유형 및 리전에 따라 상이하므로, 초기에는 소형 VM으로 시작한 후 필요에 따라 사양을 상향 조정할 것을 권장함.

## 구축 절차 요약

- GCP 프로젝트 생성 및 결제 계정 연결.
- Compute Engine VM(인스턴스) 생성.
- Docker 설치 (격리된 에이전트 실행 환경).
- Docker를 통한 OpenClaw Gateway 실행.
- 호스트의 `~/.openclaw` 및 `workspace` 경로 영속화 (컨테이너 재빌드 시 데이터 보존).
- SSH 터널링을 통한 안전한 제어 UI 접속.

본 가이드는 GCP의 **Debian 12** 환경을 기준으로 설명함. Ubuntu 등 다른 배포판 사용 시 패키지 관리자 명령어를 해당 환경에 맞게 수정하여 적용하기 바람.

---

## 숙련자용 요약 경로

1. GCP 프로젝트 생성 및 Compute Engine API 활성화.
2. VM 생성 (`e2-small`, Debian 12, 20GB 부팅 디스크).
3. VM 접속 (SSH).
4. Docker 및 Docker Compose 설치.
5. OpenClaw 저장소 클론.
6. 호스트 영구 저장 디렉터리 생성.
7. `.env` 및 `docker-compose.yml` 설정 구성.
8. 필수 바이너리 포함 이미지 빌드 및 컨테이너 실행.

---

## 사전 준비 사항

- GCP 계정 (무료 티어 사용 시 `e2-micro` 가능).
- gcloud CLI 설치 또는 GCP 콘솔 접근 권한.
- 로컬 기기에서의 SSH 접속 환경.
- Docker 및 Docker Compose 지식.
- 모델 공급자 API 키 및 채널 자격 증명.

---

## 1) gcloud CLI 설치 및 인증

**방법 A: gcloud CLI (권장)**
[Google Cloud SDK 설치 가이드](https://cloud.google.com/sdk/docs/install)를 따름.

초기화 및 로그인:
```bash
gcloud init
gcloud auth login
```

**방법 B: GCP 콘솔 (웹 UI)**
[GCP 콘솔](https://console.cloud.google.com)에서 모든 작업을 시각적으로 진행할 수 있음.

---

## 2) GCP 프로젝트 설정

**CLI 기준:**
```bash
gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
gcloud config set project my-openclaw-project
```
[결제 페이지](https://console.cloud.google.com/billing)에서 프로젝트에 결제 수단을 연결하고, Compute Engine API를 활성화함:
```bash
gcloud services enable compute.googleapis.com
```

---

## 3) VM 인스턴스 생성

**머신 유형 권장 사항:**

| 유형 | 사양 | 예상 비용 | 비고 |
| :--- | :--- | :--- | :--- |
| **e2-medium** | 2 vCPU, 4GB RAM | 약 $25/월 | 로컬 빌드 시 가장 안정적임 |
| **e2-small** | 2 vCPU, 2GB RAM | 약 $12/월 | **최소 권장 사양** |
| **e2-micro** | 2 vCPU, 1GB RAM | 무료 티어 대상 | 빌드 중 메모리 부족(OOM) 위험 높음 |

**생성 명령어:**
```bash
gcloud compute instances create openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

---

## 4) VM 접속 (SSH)

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```
*참고: 인스턴스 생성 직후에는 SSH 키 전파를 위해 약 1~2분 정도 대기가 필요할 수 있음.*

---

## 5) Docker 설치 (VM 내부)

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```
설정 적용을 위해 로그아웃 후 다시 접속함 (`exit` 후 재접속).

---

## 6) OpenClaw 저장소 클론

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

---

## 7) 영구 저장 디렉터리 생성

컨테이너가 삭제되어도 데이터가 유지되도록 호스트 시스템에 디렉터리를 생성함:
```bash
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
```

---

## 8) 환경 변수 설정 (.env)

저장소 루트에 `.env` 파일을 생성하고 보안 정보를 입력함:
```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

GOG_KEYRING_PASSWORD=사용자_비밀번호
XDG_CONFIG_HOME=/home/node/.openclaw
```

---

## 9) Docker Compose 구성

`docker-compose.yml` 파일을 작성하여 서비스 정의를 구성함. 보안을 위해 Gateway 포트는 **루프백(`127.0.0.1`)**에만 바인딩하고 SSH 터널링으로 접속할 것을 권장함.

---

## 10) 필수 바이너리 내장 (중요)

에이전트가 사용할 외부 도구(바이너리)는 반드시 **이미지 빌드 시점에 포함**되어야 함. 런타임에 설치한 파일은 컨테이너 재시작 시 삭제됨.

**Dockerfile 예시:**
```dockerfile
FROM node:22-bookworm
# 필수 시스템 패키지 설치
RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 외부 바이너리 추가 (예: gog, wacli 등)
RUN curl -L <다운로드_URL> | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/<도구명>

WORKDIR /app
# ... 의존성 설치 및 빌드 단계 생략 ...
CMD ["node", "dist/index.js"]
```

---

## 11) 빌드 및 컨테이너 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```
*빌드 중 `exit code 137` 발생 시 메모리 부족이 원인이므로 VM 사양을 상향 조정해야 함.*

---

## 12) 제어 UI 접속 (로컬 기기에서 실행)

로컬 포트(`18789`)를 VM의 루프백 포트로 포워딩함:
```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```
이후 로컬 브라우저에서 `http://127.0.0.1:18789/` 주소로 접속함. 인증 토큰은 VM의 `.env` 파일에 생성된 `OPENCLAW_GATEWAY_TOKEN` 값을 사용함.

---

## 데이터 영속성 기준 (SSOT)

| 구성 요소 | 저장 위치 | 보존 메커니즘 | 비고 |
| :--- | :--- | :--- | :--- |
| **에이전트 설정** | `/home/node/.openclaw/` | 호스트 볼륨 마운트 | `openclaw.json` 등 |
| **인증 프로필** | `/home/node/.openclaw/` | 호스트 볼륨 마운트 | OAuth 토큰 등 |
| **워크스페이스** | `/home/node/.openclaw/workspace/` | 호스트 볼륨 마운트 | 코드 및 결과물 |
| **통신 세션** | `/home/node/.openclaw/` | 호스트 볼륨 마운트 | QR 로그인 정보 포함 |
| **시스템 도구** | `/usr/local/bin/` | Docker 이미지 내장 | 빌드 시 고정됨 |

---

## 업데이트 절차

```bash
cd ~/openclaw
git pull
docker compose build
docker compose up -d
```

---

## 서비스 계정 보안 (권장 사항)

개인용이 아닌 팀 또는 자동화 파이프라인에서 운영하는 경우, 최소 권한 원칙에 따라 전용 **서비스 계정(Service Account)**을 생성하여 운영할 것을 강력히 권장함. 상세 내용은 [GCP IAM 역할 가이드](https://cloud.google.com/iam/docs/understanding-roles)를 참조함.
