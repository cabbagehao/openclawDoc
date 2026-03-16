---
title: Docker
description: Docker Compose로 OpenClaw Gateway를 컨테이너로 실행하고 선택적 에이전트 샌드박스를 구성하는 가이드
summary: OpenClaw를 위한 선택적 Docker 기반 설치와 온보딩 가이드
read_when:
  - 로컬 설치 대신 컨테이너형 Gateway를 운영하고 싶을 때
  - Docker 기반 설치 흐름을 검증하고 싶을 때
x-i18n:
  source_path: install/docker.md
---

# Docker (선택 사항)

Docker는 **선택 사항**입니다. 컨테이너형 Gateway가 필요하거나 Docker 기반 흐름을 검증하고 싶을 때만 사용하세요.

## Docker가 적합한가요?

- **예:** 격리된 일회성 Gateway 환경이 필요하거나, 호스트에 직접 설치하지 않고 OpenClaw를 실행하고 싶을 때
- **아니오:** 개인 개발 머신에서 가장 빠른 dev loop가 필요할 때. 이 경우 일반 설치 흐름이 더 적합합니다.
- **Sandboxing 참고:** agent sandboxing도 Docker를 사용하지만, Gateway 전체를 Docker에서 실행할 필요는 없습니다. 자세한 내용은 [Sandboxing](/gateway/sandboxing)을 참고하세요.

이 문서는 다음 두 가지 시나리오를 다룹니다.

- Containerized Gateway (OpenClaw 전체를 Docker에서 실행)
- Per-session Agent Sandbox (host Gateway + Docker로 격리된 agent tools)

Sandbox 관련 세부 내용: [Sandboxing](/gateway/sandboxing)

## 요구 사항

- Docker Desktop(또는 Docker Engine) + Docker Compose v2
- 이미지 빌드용 최소 2GB RAM(1GB host에서는 `pnpm install` 중 exit 137로 OOM-kill될 수 있음)
- 이미지와 로그를 저장할 충분한 디스크 공간
- VPS 또는 public host에서 운영한다면 [Security hardening for network exposure](/gateway/security#04-network-exposure-bind--port--firewall), 특히 Docker `DOCKER-USER` firewall policy를 먼저 검토하세요

## Containerized Gateway (Docker Compose)

### 빠른 시작 (권장)

<Note>
이 문서의 Docker 기본값은 host alias가 아니라 bind mode(`lan`/`loopback`)를 전제로 합니다. `gateway.bind`에는 `0.0.0.0`이나 `localhost` 대신 `lan`, `loopback` 같은 bind mode 값을 사용하세요.
</Note>

저장소 루트에서 실행:

```bash
./docker-setup.sh
```

이 스크립트는 다음을 수행합니다.

- Gateway 이미지를 로컬에서 빌드함(`OPENCLAW_IMAGE`가 설정되어 있으면 remote image를 pull)
- onboarding wizard 실행
- 선택적 provider 설정 힌트 출력
- Docker Compose로 Gateway 시작
- gateway token 생성 후 `.env`에 기록

선택적 환경 변수:

- `OPENCLAW_IMAGE` - 로컬 빌드 대신 remote image 사용(예: `ghcr.io/openclaw/openclaw:latest`)
- `OPENCLAW_DOCKER_APT_PACKAGES` - 빌드 중 추가 apt package 설치
- `OPENCLAW_EXTENSIONS` - extension 의존성을 빌드 시 선설치(공백 구분, 예: `diagnostics-otel matrix`)
- `OPENCLAW_EXTRA_MOUNTS` - 추가 host bind mount 설정
- `OPENCLAW_HOME_VOLUME` - named volume으로 `/home/node` 영구화
- `OPENCLAW_SANDBOX` - Docker gateway sandbox bootstrap opt-in. `1`, `true`, `yes`, `on`일 때만 활성화
- `OPENCLAW_INSTALL_DOCKER_CLI` - 로컬 이미지 빌드 시 build arg 전달(`1`이면 이미지에 Docker CLI 설치). `docker-setup.sh`는 로컬 빌드에서 `OPENCLAW_SANDBOX=1`이면 이를 자동 설정
- `OPENCLAW_DOCKER_SOCKET` - Docker socket 경로 override(기본값: `DOCKER_HOST=unix://...` 경로, 없으면 `/var/run/docker.sock`)
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` - 비상용 옵션. CLI/onboarding client가 신뢰된 private network의 `ws://` target을 허용
- `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` - WebGL/3D가 필요할 때 컨테이너 브라우저 hardening flags `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu` 비활성화
- `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` - browser flow에 extension이 필요할 때 extension 비활성화를 끔
- `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` - Chromium renderer process 제한 설정. `0`이면 기본 Chromium 동작 사용

실행이 끝나면:

- 브라우저에서 `http://127.0.0.1:18789/` 열기
- Control UI에 token 입력(Settings → token)
- URL이 다시 필요하면 `docker compose run --rm openclaw-cli dashboard --no-open` 실행

### Docker Gateway용 agent sandbox 활성화 (opt-in)

`docker-setup.sh`는 Docker 배포용 `agents.defaults.sandbox.*`도 bootstrap할 수 있습니다.

활성화:

```bash
export OPENCLAW_SANDBOX=1
./docker-setup.sh
```

custom socket path 사용 예(rootless Docker 등):

```bash
export OPENCLAW_SANDBOX=1
export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
./docker-setup.sh
```

참고:

- sandbox 전제 조건이 충족된 뒤에만 스크립트가 `docker.sock`를 mount합니다.
- sandbox 구성을 완료할 수 없으면 재실행 시 깨진 설정이 남지 않도록 `agents.defaults.sandbox.mode`를 `off`로 되돌립니다.
- `Dockerfile.sandbox`가 없으면 경고만 출력하고 계속 진행합니다. 필요하면 `scripts/sandbox-setup.sh`로 `openclaw-sandbox:bookworm-slim`을 빌드하세요.
- local이 아닌 `OPENCLAW_IMAGE`를 쓴다면, 해당 이미지에 이미 sandbox 실행용 Docker CLI 지원이 포함되어 있어야 합니다.

### Automation/CI (non-interactive, no TTY noise)

스크립트나 CI에서는 `-T`로 Compose pseudo-TTY를 비활성화하세요.

```bash
docker compose run -T --rm openclaw-cli gateway probe
docker compose run -T --rm openclaw-cli devices list --json
```

자동화 환경에 Claude session env var가 없으면, `docker-compose.yml`에서 비어 있는 값으로 처리되어 반복적인 "variable is not set" 경고를 피할 수 있습니다.

### Shared-network 보안 참고 (CLI + gateway)

`openclaw-cli`는 `network_mode: "service:openclaw-gateway"`를 사용하므로 Docker 내부의 `127.0.0.1`로 gateway에 안정적으로 접근할 수 있습니다.

이 둘은 같은 신뢰 경계로 취급해야 합니다. loopback binding이 두 컨테이너 사이의 완전한 격리를 의미하지는 않습니다. 더 강한 분리가 필요하면 번들된 `openclaw-cli` 대신 별도 컨테이너나 host 네트워크 경로에서 명령을 실행하세요.

CLI 프로세스가 침해됐을 때의 영향을 줄이기 위해 compose 설정은 `openclaw-cli`에서 `NET_RAW`/`NET_ADMIN`을 제거하고 `no-new-privileges`를 활성화합니다.

config와 workspace는 host에 기록됩니다.

- `~/.openclaw/`
- `~/.openclaw/workspace`

VPS에서 운영하나요? [Hetzner (Docker VPS)](/install/hetzner)를 참고하세요.

### Remote image 사용 (로컬 빌드 생략)

공식 pre-built image는 다음에 게시됩니다.

- [GitHub Container Registry package](https://github.com/openclaw/openclaw/pkgs/container/openclaw)

이미지 이름은 `ghcr.io/openclaw/openclaw`를 사용하세요. 비슷한 Docker Hub 이미지가 아닙니다.

자주 쓰는 tag:

- `main` - `main` 브랜치 최신 빌드
- `<version>` - release tag 빌드(예: `2026.2.26`)
- `latest` - 최신 stable release tag

### Base image metadata

현재 main Docker image는 다음을 사용합니다.

- `node:22-bookworm`

이 Docker image는 OCI base-image annotation도 게시합니다. 아래 sha256은 예시이며, 해당 tag에 고정된 multi-arch manifest list를 가리킵니다.

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

release 기준으로 이 저장소의 tag history는 이미 `v2026.2.22`와 그 이전 2026 tag들(예: `v2026.2.21`, `v2026.2.9`)에서 Bookworm을 사용하고 있습니다.

기본적으로 setup 스크립트는 source로부터 이미지를 빌드합니다. 대신 pre-built image를 pull하려면 스크립트 실행 전 `OPENCLAW_IMAGE`를 설정하세요.

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./docker-setup.sh
```

이 경우 스크립트는 `OPENCLAW_IMAGE`가 기본값 `openclaw:local`이 아님을 감지해 `docker build` 대신 `docker pull`을 실행합니다. onboarding, gateway 시작, token 생성 등 나머지 흐름은 동일합니다.

그래도 `docker-setup.sh`는 저장소 루트에서 실행해야 합니다. 로컬 `docker-compose.yml`과 helper 파일을 사용하기 때문입니다. `OPENCLAW_IMAGE`는 로컬 이미지 빌드 시간을 줄여 줄 뿐이며, compose/setup workflow 자체를 대체하지는 않습니다.

### Shell Helpers (선택 사항)

일상적인 Docker 관리를 더 쉽게 하려면 `ClawDock`를 설치하세요.

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
```

**shell config(zsh)에 추가:**

```bash
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이후 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등을 사용할 수 있습니다. 전체 명령은 `clawdock-help`를 실행하세요.

자세한 내용은 [`ClawDock` Helper README](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md)를 참고하세요.

### 수동 흐름 (compose)

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

참고: `docker compose ...`는 저장소 루트에서 실행하세요. `OPENCLAW_EXTRA_MOUNTS`나 `OPENCLAW_HOME_VOLUME`을 사용했다면 setup 스크립트가 `docker-compose.extra.yml`을 생성하므로, 다른 위치에서 Compose를 실행할 때는 이를 함께 포함해야 합니다.

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### Control UI token + pairing (Docker)

`unauthorized` 또는 `disconnected (1008): pairing required`가 보이면, 새 dashboard link를 가져오고 브라우저 device를 승인하세요.

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

추가 설명: [Dashboard](/web/dashboard), [Devices](/cli/devices)

### Extra mounts (선택 사항)

추가 host 디렉터리를 컨테이너에 mount하고 싶다면 `docker-setup.sh` 실행 전에 `OPENCLAW_EXTRA_MOUNTS`를 설정하세요. Docker bind mount를 쉼표로 구분한 목록을 받아 `openclaw-gateway`와 `openclaw-cli` 모두에 적용하며, `docker-compose.extra.yml`을 생성합니다.

예시:

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

참고:

- macOS/Windows에서는 해당 경로가 Docker Desktop에 공유되어 있어야 합니다.
- 각 항목은 공백, 탭, 줄바꿈 없이 `source:target[:options]` 형식이어야 합니다.
- `OPENCLAW_EXTRA_MOUNTS`를 바꾸면 `docker-setup.sh`를 다시 실행해 extra compose 파일을 재생성하세요.
- `docker-compose.extra.yml`은 자동 생성 파일이므로 직접 수정하지 마세요.

### 컨테이너의 전체 home 영구화 (선택 사항)

컨테이너를 다시 만들어도 `/home/node` 전체를 유지하고 싶다면 `OPENCLAW_HOME_VOLUME`에 named volume을 지정하세요. 표준 config/workspace bind mount를 유지하면서 `/home/node`에 Docker volume을 mount합니다. 여기에는 bind path가 아닌 named volume을 사용해야 하며, bind mount는 `OPENCLAW_EXTRA_MOUNTS`로 처리합니다.

예시:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

extra mounts와 함께 사용할 수도 있습니다.

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

참고:

- named volume 이름은 `^[A-Za-z0-9][A-Za-z0-9_.-]*$`를 만족해야 합니다.
- `OPENCLAW_HOME_VOLUME`을 변경하면 `docker-setup.sh`를 다시 실행해 extra compose 파일을 재생성하세요.
- named volume은 `docker volume rm <name>`로 제거하기 전까지 유지됩니다.

### 추가 apt package 설치 (선택 사항)

이미지 안에 system package(예: build tool, media library)가 필요하면 `docker-setup.sh` 실행 전에 `OPENCLAW_DOCKER_APT_PACKAGES`를 설정하세요. 이 방식은 이미지 빌드 중에 설치되므로 컨테이너를 삭제해도 유지됩니다.

예시:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

참고:

- 공백으로 구분된 apt package 이름 목록을 받습니다.
- `OPENCLAW_DOCKER_APT_PACKAGES`를 바꾸면 `docker-setup.sh`를 다시 실행해 이미지를 재빌드하세요.

### Extension 의존성 선설치 (선택 사항)

자체 `package.json`이 있는 extension(`diagnostics-otel`, `matrix`, `msteams` 등)은 첫 로드 시 npm 의존성을 설치합니다. 이를 이미지에 미리 bake하려면 `docker-setup.sh` 실행 전에 `OPENCLAW_EXTENSIONS`를 설정하세요.

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel matrix"
./docker-setup.sh
```

직접 빌드할 때도 설정할 수 있습니다.

```bash
docker build --build-arg OPENCLAW_EXTENSIONS="diagnostics-otel matrix" .
```

참고:

- `extensions/` 아래 디렉터리 이름을 공백으로 구분해 지정합니다.
- `package.json`이 있는 extension만 대상이며, 가벼운 plugin은 무시됩니다.
- `OPENCLAW_EXTENSIONS`를 바꾸면 `docker-setup.sh`를 다시 실행해 이미지를 재빌드하세요.

### Power-user / full-featured container (opt-in)

기본 Docker 이미지는 **security-first** 설계이며 non-root `node` 사용자로 실행됩니다. 공격 표면을 줄이는 대신 다음 제한이 있습니다.

- 런타임에 system package 설치 불가
- 기본 Homebrew 미포함
- Chromium/Playwright browser 미번들

더 많은 기능이 필요하다면 아래 opt-in 옵션을 사용하세요.

1. **`/home/node` 영구화**로 browser download와 tool cache 유지

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. **system dependency를 이미지에 bake**(재현 가능 + 영구 유지)

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **`npx` 없이 Playwright browser 설치**(npm override 충돌 회피)

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Playwright에 system dependency가 필요하면 런타임 `--with-deps` 대신 `OPENCLAW_DOCKER_APT_PACKAGES`로 이미지를 재빌드하세요.

4. **Playwright browser download 영구화**

- `docker-compose.yml`에 `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` 설정
- 그리고 `OPENCLAW_HOME_VOLUME`으로 `/home/node`를 유지하거나, `OPENCLAW_EXTRA_MOUNTS`로 `/home/node/.cache/ms-playwright`를 mount

### 권한 + EACCES

이미지는 `node`(uid 1000)로 실행됩니다. `/home/node/.openclaw`에서 권한 오류가 나면 host bind mount가 uid 1000 소유인지 확인하세요.

예시(Linux host):

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

편의를 위해 root로 실행할 수도 있지만, 그만큼 보안상 tradeoff를 감수하게 됩니다.

### 더 빠른 rebuild(권장)

의존성 layer가 캐시되도록 Dockerfile 순서를 정리하면 rebuild 속도가 빨라집니다. lockfile이 바뀌지 않는 한 `pnpm install`을 다시 실행하지 않게 됩니다.

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

### Channel setup (선택 사항)

CLI 컨테이너로 channel을 구성한 뒤 필요하면 gateway를 재시작하세요.

WhatsApp(QR):

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram(bot token):

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord(bot token):

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

문서: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

### OpenAI Codex OAuth (headless Docker)

wizard에서 OpenAI Codex OAuth를 선택하면 브라우저 URL을 열고 `http://127.0.0.1:1455/auth/callback` callback을 잡으려 합니다. Docker나 headless 환경에서는 이 callback에서 브라우저 에러가 보일 수 있습니다. 이 경우 최종적으로 이동한 전체 redirect URL을 복사해 wizard에 다시 붙여 넣으면 인증이 완료됩니다.

### Health checks

컨테이너 probe endpoint(인증 불필요):

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

alias로 `/health`와 `/ready`도 사용할 수 있습니다.

`/healthz`는 "gateway process가 살아 있는가"를 보는 얕은 liveness probe입니다. `/readyz`는 startup grace 동안 ready 상태를 유지하다가, grace 후에 필수 managed channel이 아직 연결되지 않았거나 이후에 끊어졌을 때만 `503`을 반환합니다.

Docker image에는 백그라운드에서 `/healthz`를 확인하는 built-in `HEALTHCHECK`가 포함돼 있습니다. 쉽게 말해 Docker가 OpenClaw의 응답 여부를 계속 확인하고, 검사가 반복해서 실패하면 컨테이너를 `unhealthy`로 표시하며 Docker Compose restart policy, Swarm, Kubernetes 같은 오케스트레이션 시스템이 자동으로 재시작하거나 교체할 수 있습니다.

인증이 필요한 deep health snapshot(gateway + channels):

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E smoke test (Docker)

```bash
scripts/e2e/onboard-docker.sh
```

### QR import smoke test (Docker)

```bash
pnpm test:docker:qr
```

### LAN vs loopback (Docker Compose)

`docker-setup.sh`는 Docker port publishing으로 host에서 `http://127.0.0.1:18789`에 접근할 수 있도록 기본값으로 `OPENCLAW_GATEWAY_BIND=lan`을 사용합니다.

- `lan`(기본값): host 브라우저와 host CLI가 publish된 gateway port에 접근 가능
- `loopback`: 컨테이너 network namespace 내부 프로세스만 gateway에 직접 접근 가능하며, host에 publish된 port 접근은 실패할 수 있음

setup 스크립트는 onboarding 후 `gateway.mode=local`도 고정하여 Docker CLI 명령이 기본적으로 local loopback target을 사용하게 합니다.

legacy config 참고: `gateway.bind`에는 host alias(`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)가 아니라 bind mode(`lan` / `loopback` / `custom` / `tailnet` / `auto`)를 사용하세요.

`Gateway target: ws://172.x.x.x:18789`가 보이거나 Docker CLI 명령에서 `pairing required` 오류가 반복되면 다음을 실행하세요.

```bash
docker compose run --rm openclaw-cli config set gateway.mode local
docker compose run --rm openclaw-cli config set gateway.bind lan
docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
```

### 참고

- 컨테이너 환경에서는 gateway bind 기본값이 `lan`입니다(`OPENCLAW_GATEWAY_BIND`).
- Dockerfile의 CMD는 `--allow-unconfigured`를 사용합니다. mount된 config에서 `gateway.mode`가 `local`이 아니어도 시작됩니다. 이 guard를 강제하려면 CMD를 override하세요.
- session의 source of truth는 gateway 컨테이너의 `~/.openclaw/agents/<agentId>/sessions/`입니다.

### Storage model

- **Persistent host data:** Docker Compose는 `OPENCLAW_CONFIG_DIR`을 `/home/node/.openclaw`에, `OPENCLAW_WORKSPACE_DIR`을 `/home/node/.openclaw/workspace`에 bind mount하므로 컨테이너를 교체해도 데이터가 남습니다.
- **Ephemeral sandbox tmpfs:** `agents.defaults.sandbox`가 활성화되면 sandbox 컨테이너는 `/tmp`, `/var/tmp`, `/run`에 `tmpfs`를 사용합니다. 이 mount는 상위 Compose stack과는 별개이며 sandbox 컨테이너가 사라지면 함께 없어집니다.
- **Disk growth hotspots:** `media/`, `agents/<agentId>/sessions/sessions.json`, transcript JSONL 파일, `cron/runs/*.jsonl`, 그리고 `/tmp/openclaw/` 아래 또는 설정한 `logging.file` 경로의 rolling file log를 주시하세요. macOS 앱을 Docker 밖에서도 함께 실행한다면 별도 service log도 생깁니다: `~/.openclaw/logs/gateway.log`, `~/.openclaw/logs/gateway.err.log`, `/tmp/openclaw/openclaw-gateway.log`.

## Agent Sandbox (host gateway + Docker tools)

자세한 설명: [Sandboxing](/gateway/sandboxing)

### 무엇을 하나요?

`agents.defaults.sandbox`를 활성화하면 **main이 아닌 session**은 tool을 Docker 컨테이너 안에서 실행합니다. gateway는 host에 남아 있고 tool 실행만 격리됩니다.

- scope 기본값은 `"agent"`(agent마다 컨테이너와 workspace 1개)
- `"session"`으로 두면 session별 격리
- scope별 workspace가 `/workspace`에 mount됨
- 선택적 agent workspace 접근(`agents.defaults.sandbox.workspaceAccess`)
- allow/deny tool policy(deny 우선)
- inbound media는 활성 sandbox workspace의 `media/inbound/*`로 복사되어 tool이 읽을 수 있음(`workspaceAccess: "rw"`이면 agent workspace에 들어감)

경고: `scope: "shared"`는 session 간 격리를 비활성화합니다. 모든 session이 하나의 컨테이너와 하나의 workspace를 공유합니다.

### Agent별 sandbox profile (multi-agent)

multi-agent routing을 사용하면 각 agent가 sandbox와 tool 설정을 override할 수 있습니다: `agents.list[].sandbox`와 `agents.list[].tools`(그리고 `agents.list[].tools.sandbox.tools`). 이를 통해 하나의 gateway에서 접근 수준이 다른 agent를 섞어 운영할 수 있습니다.

- Full access(personal agent)
- Read-only tools + read-only workspace(family/work agent)
- 파일시스템/셸 도구 없음(public agent)

예시, precedence, troubleshooting은 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)를 참고하세요.

### 기본 동작

- Image: `openclaw-sandbox:bookworm-slim`
- Agent마다 컨테이너 1개
- Agent workspace 접근: `workspaceAccess: "none"`이 기본값이며 `~/.openclaw/sandboxes` 사용
  - `"ro"`는 sandbox workspace를 `/workspace`에 두고 agent workspace를 `/agent`에 read-only로 mount(`write`/`edit`/`apply_patch` 비활성화)
  - `"rw"`는 agent workspace를 `/workspace`에 read/write로 mount
- Auto-prune: idle 24시간 초과 또는 age 7일 초과
- Network: 기본값 `none`(egress가 필요하면 명시적으로 opt-in)
  - `host`는 차단
  - `container:<id>`는 기본적으로 차단(namespace join 위험)
- 기본 allow: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- 기본 deny: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### Sandbox 활성화

`setupCommand`에서 package를 설치할 계획이라면 다음을 주의하세요.

- 기본 `docker.network`는 `"none"`이므로 egress가 없습니다.
- `docker.network: "host"`는 차단됩니다.
- `docker.network: "container:<id>"`도 기본적으로 차단됩니다.
- 비상용 override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`
- `readOnlyRoot: true`면 package 설치가 막힙니다.
- `apt-get`을 쓰려면 `user`가 root여야 합니다(`user`를 생략하거나 `user: "0:0"`으로 설정).
  OpenClaw는 `setupCommand`나 docker config가 바뀌면 컨테이너를 자동으로 재생성하지만, 컨테이너가 **최근에 사용된 경우**(약 5분 이내)에는 바로 갈아엎지 않고 정확한 `openclaw sandbox recreate ...` 명령을 warning으로 남깁니다.

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

hardening knob은 `agents.defaults.sandbox.docker` 아래에 있습니다:
`network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`, `seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`, `dangerouslyAllowContainerNamespaceJoin`(비상용 only)

multi-agent 환경에서는 `agents.defaults.sandbox.scope` 또는 `agents.list[].sandbox.scope`가 `"shared"`가 아닌 경우에 한해, `agents.list[].sandbox.{docker,browser,prune}.*`로 agent별 override가 가능합니다.

### 기본 sandbox image 빌드

```bash
scripts/sandbox-setup.sh
```

이 명령은 `Dockerfile.sandbox`를 사용해 `openclaw-sandbox:bookworm-slim`을 빌드합니다.

### Sandbox common image(선택 사항)

Node, Go, Rust 같은 일반적인 build tool이 포함된 sandbox image가 필요하면 common image를 빌드하세요.

```bash
scripts/sandbox-common-setup.sh
```

그러면 `openclaw-sandbox-common:bookworm-slim`이 빌드됩니다. 사용하려면:

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### Sandbox browser image

sandbox 안에서 browser tool을 실행하려면 browser image를 빌드하세요.

```bash
scripts/sandbox-browser-setup.sh
```

이 명령은 `Dockerfile.sandbox-browser`를 사용해 `openclaw-sandbox-browser:bookworm-slim`을 빌드합니다. 컨테이너는 CDP가 활성화된 Chromium과 선택적 noVNC observer(headful, Xvfb 기반)를 실행합니다.

참고:

- headful(Xvfb)은 headless보다 bot 차단을 줄이는 데 유리합니다.
- `agents.defaults.sandbox.browser.headless=true`로 headless도 사용할 수 있습니다.
- 전체 desktop 환경(GNOME)은 필요 없고, Xvfb가 display 역할을 합니다.
- browser container는 global `bridge` 대신 전용 Docker network(`openclaw-sandbox-browser`)를 기본 사용합니다.
- 선택적 `agents.defaults.sandbox.browser.cdpSourceRange`로 container edge의 CDP ingress를 CIDR 단위로 제한할 수 있습니다(예: `172.21.0.1/32`).
- noVNC observer는 기본적으로 비밀번호 보호되며, OpenClaw는 짧은 수명의 observer token URL을 제공해 로컬 bootstrap page를 띄우고 비밀번호는 query가 아니라 URL fragment에 담습니다.
- browser container startup 기본값은 공유/컨테이너 환경을 고려한 보수적 설정입니다.
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
  - `agents.defaults.sandbox.browser.noSandbox`가 설정되면 `--no-sandbox`와 `--disable-setuid-sandbox`도 추가
  - 위 세 가지 graphics hardening flag는 선택 사항입니다. WebGL/3D가 필요하면 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu` 없이 실행 가능
  - extension 동작은 `--disable-extensions`로 제어되며, extension이 필요한 페이지나 workflow에서는 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 extensions를 다시 켤 수 있음
  - `--renderer-process-limit=2`는 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT`로도 조정 가능하며, `0`이면 Chromium 기본 process limit을 사용

이 기본값은 번들 image에 기본 적용됩니다. 다른 Chromium flag가 필요하면 custom browser image를 만들어 자체 entrypoint를 제공하세요.

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

custom browser image:

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } },
    },
  },
}
```

활성화되면 agent는 다음을 받습니다.

- `browser` tool용 sandbox browser control URL
- noVNC URL(headless=false이면서 활성화된 경우)

중요: allowlist를 사용하는 경우 `browser`를 allow에 추가하고 deny에서 제거하지 않으면 tool은 계속 차단됩니다. prune rule(`agents.defaults.sandbox.prune`)은 browser container에도 적용됩니다.

### Custom sandbox image

자체 image를 만들고 config에서 가리킬 수도 있습니다.

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

### Tool policy(allow/deny)

- `deny`가 `allow`보다 우선합니다.
- `allow`가 비어 있으면 deny를 제외한 모든 tool을 사용할 수 있습니다.
- `allow`가 비어 있지 않으면 allow에 있는 tool만 사용 가능하며 deny는 여전히 우선 적용됩니다.

### Pruning 전략

설정 knob은 두 가지입니다.

- `prune.idleHours`: X시간 동안 쓰이지 않은 컨테이너 제거(0이면 비활성화)
- `prune.maxAgeDays`: X일보다 오래된 컨테이너 제거(0이면 비활성화)

예시:

- 바쁜 session은 유지하되 수명 제한: `idleHours: 24`, `maxAgeDays: 7`
- pruning 비활성화: `idleHours: 0`, `maxAgeDays: 0`

### 보안 참고

- 강한 격리 벽은 **tool**(`exec`/`read`/`write`/`edit`/`apply_patch`)에만 적용됩니다.
- host 전용 tool인 browser/camera/canvas는 기본적으로 차단됩니다.
- sandbox에서 `browser`를 허용하면 **격리가 깨집니다**. browser는 host에서 실행되기 때문입니다.

## 문제 해결

- image가 없으면 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)로 빌드하거나 `agents.defaults.sandbox.docker.image`를 설정하세요.
- 컨테이너가 아직 없더라도 정상일 수 있습니다. session이 실제로 필요해질 때 자동 생성됩니다.
- sandbox 내 권한 오류가 나면 `docker.user`를 mount된 workspace 소유권과 맞는 UID:GID로 설정하거나 workspace 폴더를 `chown`하세요.
- custom tool이 보이지 않으면 OpenClaw가 `sh -lc`(login shell)로 명령을 실행한다는 점을 확인하세요. `/etc/profile`이 PATH를 덮어쓸 수 있으니 `docker.env.PATH`로 custom tool path(예: `/custom/bin:/usr/local/share/npm-global/bin`)를 앞에 추가하거나, Dockerfile에서 `/etc/profile.d/` 아래 스크립트로 PATH를 설정하세요.
