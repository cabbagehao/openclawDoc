---
summary: "저렴한 Hetzner VPS(Docker) 환경에서 상시 가동되는 OpenClaw Gateway 구축 및 운영 가이드"
read_when:
  - 개인 노트북이 아닌 클라우드 VPS 환경에서 에이전트를 24시간 상시 가동하고자 할 때
  - 자신만의 VPS에서 운영급(Production-grade) Gateway를 직접 제어하며 운영하고 싶을 때
  - 데이터 영속성, 바이너리 내장 및 재시작 정책을 완벽하게 관리하고자 할 때
  - Hetzner 또는 유사한 서비스에서 Docker를 사용하여 OpenClaw를 실행할 때
title: "Hetzner 설치"
x-i18n:
  source_path: "install/hetzner.md"
---

# Hetzner에서 OpenClaw 실행하기 (Docker 기반 운영 가이드)

## 목표

Hetzner VPS에서 Docker를 사용하여 OpenClaw Gateway를 실행함. 영구적인 상태 저장소 구축, 필수 바이너리 이미지 내장 및 안전한 자동 재시작 환경 구성을 목표로 함.

월 약 **\$5** 수준의 저렴한 비용으로 24시간 상시 가동되는 신뢰할 수 있는 에이전트를 구축할 수 있음. 초기에는 소형 Debian/Ubuntu VPS로 시작한 후, 메모리 부족(OOM) 발생 시 사양을 상향 조정할 것을 권장함.

**보안 모델 주의 사항:**

* 팀 또는 회사 구성원 간의 신뢰 경계가 동일하고 업무용으로만 사용하는 경우 공유 에이전트 운영이 가능함.
* 엄격한 격리가 필요한 경우 전용 VPS, 전용 계정 및 독립된 런타임을 사용해야 함. 해당 호스트에는 개인용 Apple/Google 계정이나 브라우저 프로필을 연결하지 말 것.
* 사용자 간의 적대적 환경이 우려된다면 Gateway 인스턴스, 호스트 및 OS 사용자를 완전히 분리해야 함.

상세 내용은 [시스템 보안 가이드](/gateway/security) 및 [VPS 호스팅 가이드](/vps)를 참조함.

## 구축 절차 요약

* 소형 리눅스 서버(Hetzner VPS) 임대.
* Docker 설치 (격리된 애플리케이션 실행 환경).
* Docker를 통한 OpenClaw Gateway 실행.
* 호스트의 `~/.openclaw` 및 `workspace` 경로 영속화 (컨테이너 교체 시 데이터 보존).
* SSH 터널링을 통한 안전한 제어 UI 접속.

본 가이드는 Hetzner의 **Ubuntu** 또는 **Debian** 환경을 기준으로 설명함. 다른 리눅스 배포판 사용 시 패키지 관리자 명령어를 해당 환경에 맞게 수정하여 적용하기 바람. 일반적인 Docker 워크플로는 [Docker 설치 가이드](/install/docker)를 참조함.

***

## 숙련자용 요약 경로

1. Hetzner VPS 프로비저닝 (생성).
2. Docker 및 Docker Compose 설치.
3. OpenClaw 저장소 클론.
4. 호스트 영구 저장 디렉터리 생성 및 권한 설정.
5. `.env` 및 `docker-compose.yml` 구성.
6. 필수 바이너리를 포함한 커스텀 이미지 빌드.
7. `docker compose up -d` 실행.
8. 데이터 보존 여부 및 Gateway 접속 확인.

***

## 사전 준비 사항

* Root 접근 권한이 있는 Hetzner VPS.
* 로컬 기기에서의 SSH 접속 환경.
* Docker 및 Docker Compose 지식.
* 모델 공급자 API 키 및 채널 자격 증명.

***

## 1) VPS 접속 및 초기화

Hetzner에서 인스턴스를 생성한 후 Root 계정으로 접속함:

```bash
ssh root@<서버_IP_주소>
```

*참고: 본 가이드는 VPS를 상태 유지(Stateful) 모드로 관리함을 전제로 함. 일회성 인프라로 취급하지 말 것.*

***

## 2) Docker 설치 (VPS 내부)

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

***

## 3) OpenClaw 저장소 클론

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

***

## 4) 영구 저장 디렉터리 생성 및 권한 설정

컨테이너가 삭제되어도 데이터가 유지되도록 호스트 시스템에 디렉터리를 생성하고, 컨테이너 사용자(UID 1000)가 접근할 수 있도록 권한을 조정함:

```bash
mkdir -p /root/.openclaw/workspace
chown -R 1000:1000 /root/.openclaw
```

***

## 5) 환경 변수 설정 (.env)

저장소 루트에 `.env` 파일을 생성하고 보안 정보를 입력함:

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.openclaw
OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

GOG_KEYRING_PASSWORD=사용자_비밀번호
XDG_CONFIG_HOME=/home/node/.openclaw
```

***

## 6) Docker Compose 구성

`docker-compose.yml` 파일을 작성하여 서비스 정의를 구성함. 보안을 위해 Gateway 포트는 \*\*루프백(`127.0.0.1`)\*\*에만 바인딩하고 SSH 터널링으로 접속할 것을 권장함.

***

## 7) 필수 바이너리 내장 (중요)

에이전트가 사용할 외부 도구(예: `gog`, `wacli` 등)는 반드시 **이미지 빌드 시점에 포함**되어야 함. 런타임에 설치한 파일은 컨테이너 재시작 시 삭제됨. 상세 내용은 [GCP 가이드의 바이너리 섹션](/install/gcp#10-bake-required-binaries-into-the-image-critical)을 참조하여 Dockerfile을 수정하기 바람.

***

## 8) 빌드 및 컨테이너 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```

***

## 9) Gateway 접속 및 검증

Gateway 실행 상태 확인:

```bash
docker compose logs -f openclaw-gateway
```

로컬 기기에서 SSH 터널 생성:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@<서버_IP_주소>
```

이후 로컬 브라우저에서 `http://127.0.0.1:18789/` 주소로 접속함. 인증 토큰은 서버의 `.env` 파일에 생성된 `OPENCLAW_GATEWAY_TOKEN` 값을 사용함.

***

## 데이터 영속성 기준 (SSOT)

| 구성 요소       | 저장 위치                             | 보존 메커니즘       | 비고                |
| :---------- | :-------------------------------- | :------------ | :---------------- |
| **에이전트 설정** | `/home/node/.openclaw/`           | 호스트 볼륨 마운트    | `openclaw.json` 등 |
| **워크스페이스**  | `/home/node/.openclaw/workspace/` | 호스트 볼륨 마운트    | 코드 및 에이전트 결과물     |
| **통신 세션**   | `/home/node/.openclaw/`           | 호스트 볼륨 마운트    | WhatsApp 로그인 정보 등 |
| **시스템 도구**  | `/usr/local/bin/`                 | Docker 이미지 내장 | 빌드 시 포함 필수        |

***

## Infrastructure as Code (Terraform)

코드 기반의 인프라 관리를 선호하는 팀을 위해 커뮤니티에서 유지 관리하는 Terraform 구성을 활용할 수 있음:

* 모듈식 Terraform 설정 및 원격 상태 관리.
* Cloud-init을 통한 자동 프로비저닝.
* 배포, 백업 및 복구 스크립트 제공.
* 방화벽(UFW) 및 SSH 전용 접근 보안 강화.

**관련 저장소:**

* 인프라 구성: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
* Docker 설정: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

이 방식은 수동 설치의 번거로움을 줄이고 재현 가능한 배포 환경을 제공함.

> **참고**: 위 저장소들은 커뮤니티에 의해 유지 관리되므로, 이슈 발생 시 해당 프로젝트 저장소를 통해 문의하기 바람.
