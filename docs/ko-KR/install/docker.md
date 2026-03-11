---
summary: "OpenClaw를 위한 선택적 Docker 기반 설치 및 온보딩"
read_when:
  - 로컬 설치 대신 컨테이너화된 게이트웨이를 원합니다
  - Docker 흐름을 검증하고 있습니다
title: "Docker"
---

# Docker (선택 사항)

Docker는 **선택 사항**입니다. 컨테이너화된 게이트웨이를 원하거나 Docker 흐름을 검증하려는 경우에만 사용하세요.

## Docker가 나에게 맞을까요?

- **예**: 격리되고 일회성으로 써도 되는 게이트웨이 환경이 필요하거나, 로컬 설치 없이 호스트에서 OpenClaw를 실행하려고 합니다.
- **아니요**: 자신의 머신에서 실행 중이고 가장 빠른 개발 루프만 원합니다. 대신 일반 설치 흐름을 사용하세요.
- **샌드박싱 참고**: agent 샌드박싱도 Docker를 사용하지만, 전체 게이트웨이를 Docker에서 실행해야 하는 것은 **아닙니다**. [Sandboxing](/gateway/sandboxing)을 참고하세요.

이 가이드는 다음을 다룹니다:

- 컨테이너화된 Gateway (Docker에서 전체 OpenClaw 실행)
- 세션별 Agent Sandbox (호스트 게이트웨이 + Docker로 격리된 agent 도구)

샌드박싱 세부 사항: [Sandboxing](/gateway/sandboxing)

## Requirements

- Docker Desktop (또는 Docker Engine) + Docker Compose v2
- 이미지 빌드를 위한 최소 2GB RAM (`pnpm install`이 1GB 호스트에서 exit 137과 함께 OOM 종료될 수 있음)
- 이미지와 로그를 저장할 충분한 디스크 공간
- VPS/공개 호스트에서 실행하는 경우 [Security hardening for network exposure](/gateway/security#04-network-exposure-bind--port--firewall), 특히 Docker `DOCKER-USER` 방화벽 정책을 검토하세요.

## Containerized Gateway (Docker Compose)

### 빠른 시작 (권장)

<Note>
여기의 Docker 기본값은 host alias가 아니라 bind mode(`lan`/`loopback`)를 가정합니다. `gateway.bind`에는 `0.0.0.0` 또는 `localhost` 같은 host alias가 아니라 bind mode 값(예: `lan`, `loopback`)을 사용하세요.
</Note>

리포지토리 루트에서:

```bash
./docker-setup.sh
```

이 스크립트는 다음을 수행합니다:

- 게이트웨이 이미지를 로컬에서 빌드합니다 (`OPENCLAW_IMAGE`가 설정된 경우 원격 이미지를 pull)
- 온보딩 마법사를 실행합니다
- 선택적 provider 설정 힌트를 출력합니다
- Docker Compose로 게이트웨이를 시작합니다
- 게이트웨이 토큰을 생성하고 `.env`에 기록합니다

선택적 환경 변수:

- `OPENCLAW_IMAGE` — 로컬 빌드 대신 원격 이미지를 사용합니다 (예: `ghcr.io/openclaw/openclaw:latest`)
- `OPENCLAW_DOCKER_APT_PACKAGES` — 빌드 중 추가 apt 패키지를 설치합니다
- `OPENCLAW_EXTENSIONS` — 빌드 시 extension 의존성을 미리 설치합니다 (공백으로 구분된 extension 이름, 예: `diagnostics-otel matrix`)
- `OPENCLAW_EXTRA_MOUNTS` — 추가 host bind mount를 더합니다
- `OPENCLAW_HOME_VOLUME` — named volume에 `/home/node`를 영속화합니다
- `OPENCLAW_SANDBOX` — Docker gateway sandbox bootstrap을 옵트인합니다. 명시적인 truthy 값 `1`, `true`, `yes`, `on`만 활성화합니다
- `OPENCLAW_INSTALL_DOCKER_CLI` — 로컬 이미지 빌드를 위한 build arg passthrough입니다 (`1`이면 이미지 안에 Docker CLI를 설치). `docker-setup.sh`는 로컬 빌드에서 `OPENCLAW_SANDBOX=1`이면 이를 자동으로 설정합니다.
- `OPENCLAW_DOCKER_SOCKET` — Docker socket 경로를 재정의합니다 (기본값: `DOCKER_HOST=unix://...` 경로, 없으면 `/var/run/docker.sock`)
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — 비상용 설정: CLI/온보딩 클라이언트 경로에서 신뢰된 private-network `ws://` 대상 허용 (기본은 loopback만 허용)
- `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` — WebGL/3D 호환성이 필요할 때 컨테이너 브라우저 hardening 플래그 `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`를 비활성화합니다.
- `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` — 브라우저 흐름에서 extension이 필요할 때 extension을 활성 상태로 유지합니다 (기본적으로 sandbox 브라우저에서는 extension을 비활성화)
- `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` — Chromium renderer process 제한을 설정합니다. `0`으로 설정하면 플래그를 생략하고 Chromium 기본 동작을 사용합니다.

완료되면:

- 브라우저에서 `http://127.0.0.1:18789/`를 엽니다.
- 토큰을 Control UI에 붙여넣습니다 (Settings → token).
- URL이 다시 필요하다면 `docker compose run --rm openclaw-cli dashboard --no-open`을 실행하세요.

### Docker gateway용 agent sandbox 활성화 (옵트인)

`docker-setup.sh`는 Docker 배포용 `agents.defaults.sandbox.*`도 bootstrap할 수 있습니다.

다음으로 활성화하세요:

```bash
export OPENCLAW_SANDBOX=1
./docker-setup.sh
```

사용자 지정 socket 경로(예: rootless Docker):

```bash
export OPENCLAW_SANDBOX=1
export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
./docker-setup.sh
```

참고:

- 스크립트는 sandbox prerequisites가 통과한 후에만 `docker.sock`를 마운트합니다.
- sandbox 설정을 완료할 수 없으면, 재실행 시 오래되었거나 깨진 sandbox 설정이 남지 않도록 스크립트가 `agents.defaults.sandbox.mode`를 `off`로 되돌립니다.
- `Dockerfile.sandbox`가 없으면 스크립트는 경고를 출력하고 계속 진행합니다. 필요하면 `scripts/sandbox-setup.sh`로 `openclaw-sandbox:bookworm-slim`을 빌드하세요.
- 로컬이 아닌 `OPENCLAW_IMAGE` 값을 사용할 때는, 해당 이미지가 sandbox 실행을 위한 Docker CLI 지원을 이미 포함하고 있어야 합니다.

### Automation/CI (비대화형, TTY 잡음 없음)

스크립트와 CI에서는 `-T`로 Compose pseudo-TTY 할당을 비활성화하세요:

```bash
docker compose run -T --rm openclaw-cli gateway probe
docker compose run -T --rm openclaw-cli devices list --json
```

자동화 환경에서 Claude 세션 변수를 내보내지 않는 경우, 이제 `docker-compose.yml`에서 이를 비워 둬도 기본적으로 빈 값으로 해석되어 반복적인 "variable is not set" 경고를 피할 수 있습니다.

### 공유 네트워크 보안 참고 (CLI + gateway)

`openclaw-cli`는 `network_mode: "service:openclaw-gateway"`를 사용하므로, CLI 명령이 Docker 안에서 `127.0.0.1`을 통해 게이트웨이에 안정적으로 도달할 수 있습니다.

이 구성을 공유 신뢰 경계로 취급하세요. loopback 바인딩은 이 두 컨테이너 사이의 격리를 의미하지 않습니다. 더 강한 분리가 필요하다면, 번들된 `openclaw-cli` 서비스 대신 별도의 컨테이너/호스트 네트워크 경로에서 명령을 실행하세요.

CLI 프로세스가 손상되었을 때의 영향을 줄이기 위해, compose 설정은 `openclaw-cli`에서 `NET_RAW`/`NET_ADMIN`을 제거하고 `no-new-privileges`를 활성화합니다.

호스트에 config/workspace를 기록합니다:

- `~/.openclaw/`
- `~/.openclaw/workspace`

VPS에서 실행하나요? [Hetzner (Docker VPS)](/install/hetzner)를 참고하세요.

### 원격 이미지 사용 (로컬 빌드 건너뛰기)

공식 사전 빌드 이미지는 다음에 게시됩니다:

- [GitHub Container Registry package](https://github.com/openclaw/openclaw/pkgs/container/openclaw)

이미지 이름은 `ghcr.io/openclaw/openclaw`을 사용하세요 (비슷한 이름의 Docker Hub 이미지는 사용하지 마세요).

일반적인 태그:

- `main` — `main`의 최신 빌드
- `<version>` — 릴리스 태그 빌드 (예: `2026.2.26`)
- `latest` — 최신 안정 릴리스 태그

### Base image metadata

현재 메인 Docker 이미지는 다음을 사용합니다:

- `node:22-bookworm`

이제 Docker 이미지는 OCI base-image annotation도 게시합니다 (sha256은 예시이며, 해당 태그에 대해 고정된 multi-arch manifest list를 가리킵니다):

- `org.opencontainers.image.base.name=docker.io/library/node:22-bookworm`
- `org.opencontainers.image.base.digest=sha256:b501c082306a4f528bc4038cbf2fbb58095d583d0419a259b2114b5ac53d12e9`
- `org.opencontainers.image.source=https://github.com/openclaw/openclaw`
- `org.opencontainers.image.url=https://openclaw.ai`
- `org.opencontainers.image.documentation=https://docs.openclaw.ai/install/docker`
- `org.opencontainers.image.licenses=MIT`
- `org.opencontainers.image.title=OpenClaw`
- `org.opencontainers.image.description=OpenClaw gateway and CLI runtime container image`
- `org.opencontainers.image.revision=<git-sha>`
- `org.opencontainers.image.version=<tag-or-main>`
- `org.opencontainers.image.created=<rfc3339 timestamp>`

참고: [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)

릴리스 맥락: 이 저장소의 태그 히스토리는 이미 `v2026.2.22` 및 그 이전 2026 태그(예: `v2026.2.21`, `v2026.2.9`)에서 Bookworm을 사용합니다.

기본적으로 setup script는 소스에서 이미지를 빌드합니다. 대신 사전 빌드 이미지를 pull하려면, 스크립트를 실행하기 전에 `OPENCLAW_IMAGE`를 설정하세요:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./docker-setup.sh
```

스크립트는 `OPENCLAW_IMAGE`가 기본값 `openclaw:local`이 아님을 감지하고 `docker build` 대신 `docker pull`을 실행합니다. 그 외의 모든 것(온보딩, 게이트웨이 시작, 토큰 생성)은 동일하게 동작합니다.

`docker-setup.sh`는 여전히 로컬 `docker-compose.yml`과 helper 파일을 사용하므로 리포지토리 루트에서 실행해야 합니다. `OPENCLAW_IMAGE`는 로컬 이미지 빌드 시간을 건너뛰게 할 뿐이며, compose/setup 워크플로를 대체하지는 않습니다.

### Shell Helpers (선택 사항)

일상적인 Docker 관리를 더 쉽게 하려면 `ClawDock`를 설치하세요:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
```

**셸 설정에 추가 (zsh):**

```bash
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

그다음 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등을 사용하세요. 전체 명령은 `clawdock-help`를 실행해 확인할 수 있습니다.

자세한 내용은 [`ClawDock` Helper README](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md)를 참고하세요.

### 수동 흐름 (compose)

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

참고: `docker compose ...`는 리포지토리 루트에서 실행하세요. `OPENCLAW_EXTRA_MOUNTS` 또는 `OPENCLAW_HOME_VOLUME`를 활성화했다면, setup script가 `docker-compose.extra.yml`을 씁니다. 다른 위치에서 Compose를 실행할 때는 이를 포함하세요:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### Control UI token + pairing (Docker)

“unauthorized” 또는 “disconnected (1008): pairing required”가 보이면, 새 dashboard 링크를 가져오고 브라우저 device를 승인하세요:

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

자세한 내용: [Dashboard](/web/dashboard), [Devices](/cli/devices).

### 추가 마운트 (선택 사항)

추가 호스트 디렉터리를 컨테이너에 마운트하려면, `docker-setup.sh`를 실행하기 전에 `OPENCLAW_EXTRA_MOUNTS`를 설정하세요. 이 변수는 Docker bind mount의 콤마 구분 목록을 받으며, `docker-compose.extra.yml`을 생성하여 `openclaw-gateway`와 `openclaw-cli` 모두에 적용합니다.

예시:

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

참고:

- macOS/Windows에서는 경로가 Docker Desktop과 공유되어 있어야 합니다.
- 각 항목은 공백, 탭, 개행 없이 `source:target[:options]` 형식이어야 합니다.
- `OPENCLAW_EXTRA_MOUNTS`를 수정했다면, `docker-setup.sh`를 다시 실행해 extra compose 파일을 다시 생성하세요.
- `docker-compose.extra.yml`은 생성 파일입니다. 직접 수정하지 마세요.

### 전체 컨테이너 홈 영속화 (선택 사항)

컨테이너를 다시 만들어도 `/home/node`를 유지하고 싶다면, `OPENCLAW_HOME_VOLUME`을 통해 named volume을 설정하세요. 그러면 표준 config/workspace bind mount는 유지한 채 Docker volume을 생성해 `/home/node`에 마운트합니다. 여기에는 bind path가 아니라 named volume을 사용해야 합니다. bind mount가 필요하면 `OPENCLAW_EXTRA_MOUNTS`를 사용하세요.

예시:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

추가 마운트와 함께 사용할 수도 있습니다:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

참고:

- Named volume은 `^[A-Za-z0-9][A-Za-z0-9_.-]*$`를 만족해야 합니다.
- `OPENCLAW_HOME_VOLUME`을 변경했다면, `docker-setup.sh`를 다시 실행해 extra compose 파일을 다시 생성하세요.
- Named volume은 `docker volume rm <name>`으로 제거하기 전까지 유지됩니다.

### 추가 apt 패키지 설치 (선택 사항)

이미지 안에 시스템 패키지(예: 빌드 도구, 미디어 라이브러리)가 필요하다면, `docker-setup.sh`를 실행하기 전에 `OPENCLAW_DOCKER_APT_PACKAGES`를 설정하세요. 이 패키지들은 이미지 빌드 중 설치되므로, 컨테이너를 삭제해도 유지됩니다.

예시:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

참고:

- 이 변수는 공백으로 구분된 apt 패키지 이름 목록을 받습니다.
- `OPENCLAW_DOCKER_APT_PACKAGES`를 변경했다면, `docker-setup.sh`를 다시 실행해 이미지를 다시 빌드하세요.

### extension 의존성 사전 설치 (선택 사항)

자체 `package.json`을 가진 extension(예: `diagnostics-otel`, `matrix`, `msteams`)은 처음 로드될 때 npm 의존성을 설치합니다. 대신 그 의존성을 이미지에 bake하려면, `docker-setup.sh`를 실행하기 전에 `OPENCLAW_EXTENSIONS`를 설정하세요:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel matrix"
./docker-setup.sh
```

또는 직접 빌드할 때:

```bash
docker build --build-arg OPENCLAW_EXTENSIONS="diagnostics-otel matrix" .
```

참고:

- 이 변수는 extension 디렉터리 이름(`extensions/` 아래)의 공백 구분 목록을 받습니다.
- `package.json`이 있는 extension만 영향받습니다. 없는 경량 plugin은 무시됩니다.
- `OPENCLAW_EXTENSIONS`를 변경했다면, `docker-setup.sh`를 다시 실행해 이미지를 다시 빌드하세요.

### 파워 유저 / 전체 기능 컨테이너 (옵트인)

기본 Docker 이미지는 **보안 우선**이며 비-root `node` 사용자로 실행됩니다. 공격 표면을 작게 유지하는 대신 다음이 불가능합니다:

- 런타임 중 시스템 패키지 설치
- 기본 Homebrew 제공
- Chromium/Playwright 브라우저 번들 제공

더 많은 기능을 갖춘 컨테이너를 원한다면, 다음 옵트인 설정을 사용하세요:

1. **`/home/node`를 영속화**하여 브라우저 다운로드와 도구 캐시가 유지되게 합니다:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. **시스템 의존성을 이미지에 bake**합니다 (반복 가능 + 영속적):

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **`npx` 없이 Playwright 브라우저 설치** (npm override 충돌 방지):

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Playwright가 시스템 의존성까지 설치해야 한다면, 런타임에 `--with-deps`를 쓰는 대신 `OPENCLAW_DOCKER_APT_PACKAGES`로 이미지를 다시 빌드하세요.

4. **Playwright 브라우저 다운로드 영속화**:

- `docker-compose.yml`에서 `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`를 설정하세요.
- `OPENCLAW_HOME_VOLUME`으로 `/home/node`가 유지되도록 하거나, `OPENCLAW_EXTRA_MOUNTS`로 `/home/node/.cache/ms-playwright`를 마운트하세요.

### 권한 + EACCES

이미지는 `node` (uid 1000)로 실행됩니다. `/home/node/.openclaw`에서 권한 오류가 보이면, 호스트 bind mount가 uid 1000 소유인지 확인하세요.

예시 (Linux 호스트):

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

편의를 위해 root로 실행하기로 했다면, 그에 따른 보안 트레이드오프를 감수하는 것입니다.

### 더 빠른 리빌드 (권장)

리빌드를 빠르게 하려면, Dockerfile에서 의존성 레이어가 캐시되도록 순서를 배치하세요. 이렇게 하면 lockfile이 바뀌지 않는 한 `pnpm install`을 다시 실행하지 않습니다:

```dockerfile
FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cache dependencies unless package metadata changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

### 채널 설정 (선택 사항)

CLI 컨테이너를 사용해 채널을 구성한 다음, 필요하면 게이트웨이를 재시작하세요.

WhatsApp (QR):

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram (bot token):

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord (bot token):

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

문서: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

### OpenAI Codex OAuth (헤드리스 Docker)

마법사에서 OpenAI Codex OAuth를 선택하면 브라우저 URL을 열고 `http://127.0.0.1:1455/auth/callback`에서 callback을 받으려고 시도합니다. Docker나 헤드리스 환경에서는 이 callback에서 브라우저 오류가 표시될 수 있습니다. 최종적으로 도착한 전체 redirect URL을 복사해 마법사에 다시 붙여 넣으면 인증이 완료됩니다.

### 상태 확인

컨테이너 probe endpoint (인증 불필요):

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

별칭: `/health` 및 `/ready`.

`/healthz`는 "게이트웨이 프로세스가 살아 있다"를 확인하는 얕은 liveness probe입니다.
`/readyz`는 시작 유예 기간 동안 ready 상태를 유지하고, 필수 managed channel이 유예 후에도 여전히 끊겨 있거나 이후에 끊길 때만 `503`이 됩니다.

Docker 이미지에는 백그라운드에서 `/healthz`를 ping하는 내장 `HEALTHCHECK`가 포함되어 있습니다. 쉽게 말하면 Docker가 OpenClaw가 여전히 응답하는지 계속 확인합니다. 검사가 계속 실패하면 Docker는 컨테이너를 `unhealthy`로 표시하고, 오케스트레이션 시스템(Docker Compose restart policy, Swarm, Kubernetes 등)이 이를 자동으로 재시작하거나 교체할 수 있습니다.

인증이 필요한 심층 health snapshot (gateway + channels):

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E 스모크 테스트 (Docker)

```bash
scripts/e2e/onboard-docker.sh
```

### QR import 스모크 테스트 (Docker)

```bash
pnpm test:docker:qr
```

### LAN vs loopback (Docker Compose)

`docker-setup.sh`는 Docker port publishing으로 호스트에서 `http://127.0.0.1:18789`에 접근할 수 있도록 기본값으로 `OPENCLAW_GATEWAY_BIND=lan`을 사용합니다.

- `lan` (기본값): 호스트 브라우저와 호스트 CLI가 게시된 게이트웨이 포트에 도달할 수 있습니다.
- `loopback`: 컨테이너 네트워크 namespace 내부 프로세스만 게이트웨이에 직접 도달할 수 있으며, 호스트에 게시된 포트 접근은 실패할 수 있습니다.

setup script는 또한 온보딩 후 `gateway.mode=local`을 고정하여 Docker CLI 명령이 기본적으로 local loopback 대상을 사용하게 합니다.

레거시 config 참고: `gateway.bind`에는 host alias(`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)가 아니라 bind mode 값(`lan` / `loopback` / `custom` / `tailnet` / `auto`)을 사용하세요.

Docker CLI 명령에서 `Gateway target: ws://172.x.x.x:18789` 또는 반복적인 `pairing required` 오류가 보이면 다음을 실행하세요:

```bash
docker compose run --rm openclaw-cli config set gateway.mode local
docker compose run --rm openclaw-cli config set gateway.bind lan
docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
```

### 참고 사항

- 컨테이너 사용 시 Gateway bind의 기본값은 `lan`입니다 (`OPENCLAW_GATEWAY_BIND`).
- Dockerfile CMD는 `--allow-unconfigured`를 사용합니다. 마운트된 config의 `gateway.mode`가 `local`이 아니어도 시작됩니다. 이 가드를 강제하려면 CMD를 재정의하세요.
- 세션의 source of truth는 게이트웨이 컨테이너입니다 (`~/.openclaw/agents/<agentId>/sessions/`).

### Storage model

- **영구 호스트 데이터:** Docker Compose는 `OPENCLAW_CONFIG_DIR`을 `/home/node/.openclaw`에, `OPENCLAW_WORKSPACE_DIR`을 `/home/node/.openclaw/workspace`에 bind mount하므로, 이 경로들은 컨테이너를 교체해도 유지됩니다.
- **임시 sandbox tmpfs:** `agents.defaults.sandbox`가 활성화되면, sandbox 컨테이너는 `/tmp`, `/var/tmp`, `/run`에 `tmpfs`를 사용합니다. 이 마운트는 상위 Compose 스택과 별개이며 sandbox 컨테이너가 사라지면 함께 사라집니다.
- **디스크 증가 hotspot:** `media/`, `agents/<agentId>/sessions/sessions.json`, transcript JSONL 파일, `cron/runs/*.jsonl`, 그리고 `/tmp/openclaw/`(또는 설정한 `logging.file`) 아래의 롤링 파일 로그를 주시하세요. macOS 앱을 Docker 밖에서 함께 실행한다면 서비스 로그는 다시 별도입니다: `~/.openclaw/logs/gateway.log`, `~/.openclaw/logs/gateway.err.log`, `/tmp/openclaw/openclaw-gateway.log`.

## Agent Sandbox (host gateway + Docker tools)

자세한 내용: [Sandboxing](/gateway/sandboxing)

### 동작 방식

`agents.defaults.sandbox`가 활성화되면 **main이 아닌 세션**은 Docker 컨테이너 안에서 도구를 실행합니다. 게이트웨이는 호스트에 남아 있지만, 도구 실행은 격리됩니다:

- scope: 기본값은 `"agent"` (agent당 하나의 컨테이너 + workspace)
- scope: 세션별 격리를 원하면 `"session"`
- scope별 workspace 폴더를 `/workspace`에 마운트
- 선택적 agent workspace 접근 (`agents.defaults.sandbox.workspaceAccess`)
- allow/deny 도구 정책 (deny가 우선)
- inbound media는 도구가 읽을 수 있도록 활성 sandbox workspace(`media/inbound/*`)로 복사됩니다 (`workspaceAccess: "rw"`이면 agent workspace에 들어감)

경고: `scope: "shared"`는 세션 간 격리를 비활성화합니다. 모든 세션이 하나의 컨테이너와 하나의 workspace를 공유합니다.

### agent별 sandbox profile (multi-agent)

multi-agent routing을 사용한다면 각 agent는 sandbox와 도구 설정을 재정의할 수 있습니다: `agents.list[].sandbox`, `agents.list[].tools`(그리고 `agents.list[].tools.sandbox.tools`). 이를 통해 하나의 gateway에서 접근 수준이 다른 agent를 함께 실행할 수 있습니다:

- Full access (personal agent)
- Read-only tools + read-only workspace (family/work agent)
- No filesystem/shell tools (public agent)

[Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)에서 예시, precedence, 문제 해결을 확인하세요.

### 기본 동작

- Image: `openclaw-sandbox:bookworm-slim`
- agent당 하나의 컨테이너
- Agent workspace access: 기본값 `workspaceAccess: "none"`은 `~/.openclaw/sandboxes`를 사용
  - `"ro"`는 sandbox workspace를 `/workspace`에 유지하고 agent workspace를 `/agent`에 읽기 전용으로 마운트합니다 (`write`/`edit`/`apply_patch` 비활성화)
  - `"rw"`는 agent workspace를 `/workspace`에 읽기/쓰기로 마운트합니다
- Auto-prune: idle > 24h 또는 age > 7d
- Network: 기본값은 `none` (egress가 필요하면 명시적으로 opt-in)
  - `host`는 차단됩니다.
  - `container:<id>`는 기본적으로 차단됩니다 (namespace-join 위험).
- Default allow: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- Default deny: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### 샌드박싱 활성화

`setupCommand`에서 패키지를 설치할 계획이라면 다음을 참고하세요:

- 기본 `docker.network`는 `"none"`입니다 (egress 없음).
- `docker.network: "host"`는 차단됩니다.
- `docker.network: "container:<id>"`는 기본적으로 차단됩니다.
- 비상용 override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
- `readOnlyRoot: true`는 패키지 설치를 막습니다.
- `apt-get`을 사용하려면 `user`가 root여야 합니다 (`user`를 생략하거나 `user: "0:0"`로 설정).
  OpenClaw는 `setupCommand`(또는 docker config)가 변경되면 컨테이너를 자동으로 다시 생성하지만, 컨테이너가 **최근 사용됨**(약 5분 이내) 상태라면 예외입니다. 뜨거운 컨테이너의 경우 정확한 `openclaw sandbox recreate ...` 명령과 함께 경고를 기록합니다.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent is default)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
        },
        prune: {
          idleHours: 24, // 0 disables idle pruning
          maxAgeDays: 7, // 0 disables max-age pruning
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

Hardening knob은 `agents.defaults.sandbox.docker` 아래에 있습니다:
`network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`,
`seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`,
`dangerouslyAllowContainerNamespaceJoin` (비상용 전용).

Multi-agent: `agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope`가 `"shared"`일 때를 제외하고, agent별로 `agents.list[].sandbox.{docker,browser,prune}.*`를 통해 `agents.defaults.sandbox.{docker,browser,prune}.*`를 재정의할 수 있습니다.

### 기본 sandbox 이미지 빌드

```bash
scripts/sandbox-setup.sh
```

이 명령은 `Dockerfile.sandbox`를 사용해 `openclaw-sandbox:bookworm-slim`을 빌드합니다.

### Sandbox 공용 이미지 (선택 사항)

일반적인 빌드 도구(Node, Go, Rust 등)가 포함된 sandbox 이미지를 원한다면, 공용 이미지를 빌드하세요:

```bash
scripts/sandbox-common-setup.sh
```

이 명령은 `openclaw-sandbox-common:bookworm-slim`을 빌드합니다. 사용하려면:

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### Sandbox browser 이미지

sandbox 내부에서 browser 도구를 실행하려면 browser 이미지를 빌드하세요:

```bash
scripts/sandbox-browser-setup.sh
```

이 명령은 `Dockerfile.sandbox-browser`를 사용해 `openclaw-sandbox-browser:bookworm-slim`을 빌드합니다. 컨테이너는 CDP가 활성화된 Chromium과 선택적 noVNC observer(headful, Xvfb 사용)를 실행합니다.

참고:

- Headful(Xvfb)은 headless보다 봇 차단을 줄여 줍니다.
- `agents.defaults.sandbox.browser.headless=true`를 설정하면 여전히 headless를 사용할 수 있습니다.
- 전체 데스크톱 환경(GNOME)은 필요하지 않습니다. Xvfb가 디스플레이를 제공합니다.
- Browser 컨테이너는 전역 `bridge` 대신 전용 Docker 네트워크(`openclaw-sandbox-browser`)를 기본으로 사용합니다.
- 선택적 `agents.defaults.sandbox.browser.cdpSourceRange`로 컨테이너 경계의 CDP ingress를 CIDR(예: `172.21.0.1/32`)로 제한할 수 있습니다.
- noVNC observer 접근은 기본적으로 비밀번호로 보호됩니다. OpenClaw는 URL query가 아니라 URL fragment에 비밀번호를 담는 단기 observer token URL을 제공하고, 로컬 bootstrap 페이지를 제공합니다.
- Browser 컨테이너 시작 기본값은 공유/컨테이너 워크로드에 맞게 보수적으로 설정되어 있으며, 다음을 포함합니다:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-software-rasterizer`
  - `--disable-gpu`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--metrics-recording-only`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--disable-extensions`
  - `agents.defaults.sandbox.browser.noSandbox`가 설정되면 `--no-sandbox`와 `--disable-setuid-sandbox`도 추가됩니다.
  - 위의 세 가지 graphics hardening 플래그는 선택 사항입니다. 워크로드에 WebGL/3D가 필요하다면 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`을 설정해 `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu` 없이 실행하세요.
  - Extension 동작은 `--disable-extensions`로 제어되며, extension 의존 페이지 또는 extension이 많은 워크플로에서는 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 이를 비활성화해(extension 활성화) 사용할 수 있습니다.
  - `--renderer-process-limit=2`는 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT`로도 조정할 수 있습니다. browser 동시성 튜닝 시 `0`으로 설정하면 Chromium이 기본 process 제한을 선택합니다.

이 기본값들은 번들 이미지에서 기본 적용됩니다. 다른 Chromium 플래그가 필요하다면, 사용자 지정 browser 이미지를 사용하고 자체 entrypoint를 제공하세요.

사용 예시:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: { enabled: true },
      },
    },
  },
}
```

사용자 지정 browser 이미지:

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } },
    },
  },
}
```

활성화되면 agent는 다음을 받습니다:

- sandbox browser control URL (`browser` 도구용)
- noVNC URL (활성화되어 있고 headless=false인 경우)

기억하세요: 도구 allowlist를 사용한다면 `browser`를 추가하고(그리고 deny에서 제거하고) 그렇지 않으면 도구는 계속 차단된 상태입니다.
Prune 규칙(`agents.defaults.sandbox.prune`)은 browser 컨테이너에도 적용됩니다.

### 사용자 지정 sandbox 이미지

직접 이미지를 빌드하고 config가 이를 가리키게 하세요:

```bash
docker build -t my-openclaw-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-openclaw-sbx" } },
    },
  },
}
```

### 도구 정책 (allow/deny)

- `deny`는 `allow`보다 우선합니다.
- `allow`가 비어 있으면: 모든 도구(deny 제외)를 사용할 수 있습니다.
- `allow`가 비어 있지 않으면: `allow`에 있는 도구만 사용할 수 있습니다(deny 제외).

### Pruning 전략

두 가지 설정이 있습니다:

- `prune.idleHours`: X시간 동안 사용되지 않은 컨테이너 제거 (0 = 비활성화)
- `prune.maxAgeDays`: X일보다 오래된 컨테이너 제거 (0 = 비활성화)

예시:

- 바쁜 세션은 유지하되 수명은 제한:
  `idleHours: 24`, `maxAgeDays: 7`
- 전혀 정리하지 않음:
  `idleHours: 0`, `maxAgeDays: 0`

### 보안 참고

- 강한 격리는 **도구**(exec/read/write/edit/apply_patch)에만 적용됩니다.
- browser/camera/canvas 같은 host 전용 도구는 기본적으로 차단됩니다.
- sandbox에서 `browser`를 허용하면 **격리가 깨집니다** (browser는 host에서 실행됨).

## Troubleshooting

- Image missing: [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)로 빌드하거나 `agents.defaults.sandbox.docker.image`를 설정하세요.
- Container not running: 필요 시 세션별로 자동 생성됩니다.
- Permission errors in sandbox: `docker.user`를 마운트된 workspace 소유권과 일치하는 UID:GID로 설정하세요(또는 workspace 폴더를 `chown` 하세요).
- Custom tools not found: OpenClaw는 `sh -lc`(login shell)로 명령을 실행하므로 `/etc/profile`을 불러오며 PATH를 재설정할 수 있습니다. `docker.env.PATH`를 설정해 사용자 지정 도구 경로(예: `/custom/bin:/usr/local/share/npm-global/bin`)를 앞에 추가하거나, Dockerfile에서 `/etc/profile.d/` 아래에 스크립트를 추가하세요.
