---
summary: "OpenClaw를 위한 선택적 Docker 기반 설치 및 온보딩 가이드"
read_when:
  - 로컬 직접 설치 대신 컨테이너화된 Gateway 운영을 선호할 때
  - Docker 설치 및 온보딩 워크플로를 검증하고자 할 때
title: "Docker 설치"
x-i18n:
  source_path: "install/docker.md"
---

# Docker 설치 (선택 사항)

Docker 사용은 **선택 사항**임. 컨테이너화된 Gateway 환경이 필요하거나 Docker 기반의 배포 흐름을 검증하려는 경우에만 본 가이드를 따르기 바람.

## Docker 사용 여부 결정 가이드

* **적합한 경우**: 격리된 일회성 Gateway 환경이 필요하거나, 호스트 시스템에 직접 소프트웨어를 설치하지 않고 OpenClaw를 실행하려는 경우.
* **부적합한 경우**: 본인의 개인 머신에서 실행 중이며 가장 빠른 개발 피드백 루프를 원하는 경우. 이 경우 일반 설치 가이드를 권장함.
* **샌드박싱 관련 참고**: 에이전트 샌드박싱 기능 역시 Docker를 사용하지만, 이를 위해 Gateway 전체를 Docker에서 실행할 필요는 없음 ([샌드박싱 가이드](/gateway/sandboxing) 참조).

본 가이드는 다음 두 가지 주제를 다룸:

* **컨테이너화된 Gateway**: OpenClaw 전체 시스템을 Docker 내에서 구동.
* **세션별 에이전트 샌드박스**: 호스트 Gateway와 Docker로 격리된 에이전트 도구 실행 환경 조합.

## 요구 사항

* Docker Desktop (또는 Docker Engine) 및 Docker Compose v2 버전.
* 이미지 빌드를 위한 최소 **2GB 이상의 RAM** (1GB 이하 환경에서는 `pnpm install` 중 OOM 오류(Exit 137)가 발생할 수 있음).
* 이미지 및 로그 저장을 위한 충분한 디스크 공간.
* VPS 또는 공개 호스트 운영 시, [네트워크 노출 보안 강화 지침](/gateway/security#04-network-exposure-bind--port--firewall) 및 Docker `DOCKER-USER` 방화벽 정책을 반드시 검토해야 함.

## 컨테이너화된 Gateway (Docker Compose)

### 빠른 시작 (권장)

<Note>
  Docker 환경의 기본값은 호스트 별칭(Alias)이 아닌 **바인딩 모드**(`lan`/`loopback`)를 전제로 함. `gateway.bind` 설정 시 `0.0.0.0`이나 `localhost` 대신 `lan` 또는 `loopback`과 같은 모드 값을 사용하기 바람.
</Note>

저장소 루트 디렉터리에서 실행:

```bash
./docker-setup.sh
```

본 스크립트는 다음 작업을 수행함:

* Gateway 이미지를 로컬에서 빌드함 (`OPENCLAW_IMAGE` 설정 시 원격 이미지 사용).
* 온보딩 마법사를 실행함.
* 공급자 설정 관련 힌트를 출력함.
* Docker Compose를 통해 Gateway 서비스를 시작함.
* Gateway 인증 토큰을 생성하여 `.env` 파일에 기록함.

**주요 환경 변수 옵션:**

* `OPENCLAW_IMAGE`: 원격 이미지 사용 (예: `ghcr.io/openclaw/openclaw:latest`).
* `OPENCLAW_DOCKER_APT_PACKAGES`: 빌드 시 추가 설치할 apt 패키지 목록.
* `OPENCLAW_EXTENSIONS`: 빌드 시 미리 설치할 확장 프로그램 의존성 (공백 구분).
* `OPENCLAW_EXTRA_MOUNTS`: 추가적인 호스트 바인드 마운트 설정.
* `OPENCLAW_HOME_VOLUME`: `/home/node` 경로를 명명된 볼륨(Named volume)으로 영속화.
* `OPENCLAW_SANDBOX`: Docker Gateway 샌드박스 부트스트랩 활성화 (`1`, `true`, `on` 등).
* `OPENCLAW_DOCKER_SOCKET`: Docker 소켓 경로 오버라이드.
* `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 신뢰된 사설망 내 비암호화 `ws://` 접속 허용.

설치 완료 후:

* 브라우저에서 `http://127.0.0.1:18789/` 접속.
* 생성된 토큰을 제어 UI(Settings → token)에 입력함.
* 접속 주소 확인 필요 시: `docker compose run --rm openclaw-cli dashboard --no-open`.

### Docker Gateway용 에이전트 샌드박스 활성화

`docker-setup.sh` 실행 시 에이전트 전용 샌드박스 환경(`agents.defaults.sandbox.*`)을 함께 구축할 수 있음.

```bash
export OPENCLAW_SANDBOX=1
./docker-setup.sh
```

루트리스(Rootless) Docker 환경 등 커스텀 소켓 경로가 필요한 경우:

```bash
export OPENCLAW_SANDBOX=1
export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
./docker-setup.sh
```

### 자동화 및 CI 환경 (Non-interactive)

스크립트나 CI 파이프라인에서는 `-T` 플래그를 사용하여 의사 TTY 할당을 비활성화함:

```bash
docker compose run -T --rm openclaw-cli gateway probe
docker compose run -T --rm openclaw-cli devices list --json
```

### 네트워크 보안 주의 사항 (CLI 및 Gateway)

`openclaw-cli`는 `network_mode: "service:openclaw-gateway"` 설정을 사용함. 이는 CLI 명령이 Docker 내부의 `127.0.0.1`을 통해 Gateway에 안정적으로 도달하게 하기 위함임.

이 구성을 **공유 신뢰 경계**로 취급해야 함. 루프백 바인딩이 두 컨테이너 사이의 완전한 격리를 의미하지 않으므로, 더 강력한 분리가 필요하다면 번들된 서비스 대신 별도의 네트워크 경로에서 명령을 실행하기 바람.

### 원격 이미지 활용 (로컬 빌드 건너뛰기)

공식 사전 빌드 이미지는 다음 경로에서 제공됨:

* [GitHub Container Registry (GHCR)](https://github.com/openclaw/openclaw/pkgs/container/openclaw)

이미지 이름은 `ghcr.io/openclaw/openclaw`를 사용함.

**주요 태그:**

* `main`: 메인 브랜치 최신 빌드.
* `<version>`: 특정 릴리스 빌드 (예: `2026.2.26`).
* `latest`: 최신 안정판 릴리스.

원격 이미지 사용 예시:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./docker-setup.sh
```

### ClawDock 셸 헬퍼 (선택 사항)

일상적인 Docker 관리를 위해 `ClawDock` 유틸리티를 설치할 수 있음:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

설치 후 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등의 명령어를 사용할 수 있음.

### 제어 UI 인증 및 페어링 (Docker)

인증 오류나 "pairing required" 메시지 발생 시, 새로운 대시보드 링크를 생성하고 기기를 승인함:

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

## 에이전트 샌드박스 (Host Gateway + Docker Tools)

상세 내용: [샌드박싱 개요](/gateway/sandboxing)

### 기능 요약

`agents.defaults.sandbox` 활성화 시, **메인 세션이 아닌 대화**는 도구를 Docker 컨테이너 내부에서 실행함. Gateway는 호스트에 상주하지만 도구 실행은 격리됨:

* **범위(Scope)**: `"agent"` (에이전트당 하나) 또는 `"session"` (세션별 격리).
* **워크스페이스**: 격리된 공간을 `/workspace` 경로에 마운트함.
* **접근 제어**: 에이전트 워크스페이스에 대한 읽기/쓰기 권한 제어 (`workspaceAccess`).
* **미디어 처리**: 인바운드 미디어 파일이 활성 샌드박스 워크스페이스로 자동 복제됨.

### 샌드박스 설정 예시

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "agent",
        workspaceAccess: "none",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          network: "none", // 기본적으로 네트워크 차단
          user: "1000:1000",
          setupCommand: "apt-get update && apt-get install -y git curl jq",
        },
      },
    },
  },
}
```

### 샌드박스 이미지 빌드

* **기본 이미지**: `scripts/sandbox-setup.sh` (최소 사양)
* **공용 이미지**: `scripts/sandbox-common-setup.sh` (주요 개발 도구 포함)
* **브라우저 이미지**: `scripts/sandbox-browser-setup.sh` (Chromium 및 noVNC 포함)

## 문제 해결 (Troubleshooting)

* **이미지 누락**: `scripts/sandbox-setup.sh` 명령으로 이미지를 직접 빌드하거나 `docker.image` 설정을 확인함.
* **권한 오류 (`EACCES`)**: 샌드박스 내 `docker.user` 설정이 호스트 마운트 폴더의 소유권(UID:GID)과 일치하는지 확인함. 리눅스 호스트의 경우 보통 `1000:1000`임.
* **도구 실행 불가**: 샌드박스 환경은 로그인 셸(`sh -lc`)을 사용하므로 `/etc/profile` 등에 의해 PATH가 초기화될 수 있음. 필요한 경우 `docker.env.PATH` 설정을 통해 경로를 명시적으로 추가함.
* **상태 확인 엔드포인트**: 인증 없이 `/healthz` 및 `/readyz` 경로를 통해 컨테이너의 생존 여부를 확인할 수 있음.
