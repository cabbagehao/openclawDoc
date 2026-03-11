---
description: "Fly.io 플랫폼에 OpenClaw 배포하기"
summary: "영구 스토리지 및 자동 HTTPS 설정을 포함한 OpenClaw의 Fly.io 배포 단계별 가이드"
read_when:
  - OpenClaw를 Fly.io 클라우드 환경에 배포하고자 할 때
  - Fly 볼륨, 시크릿 및 초기 설정(Config) 구성을 수행할 때
title: "Fly.io 설치"
x-i18n:
  source_path: "install/fly.md"
---

# Fly.io 배포 가이드

**목표:** 영구 데이터 저장소, 자동 HTTPS 적용 및 Discord 등 통신 채널 접근 기능을 갖춘 [Fly.io](https://fly.io) 머신에서 OpenClaw Gateway를 실행함.

## 사전 준비 사항

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) 설치 완료.
- Fly.io 계정 보유 (무료 티어 사용 가능).
- 모델 인증 정보: 선택한 모델 공급자의 API 키.
- 채널 자격 증명: Discord 봇 토큰, Telegram 토큰 등.

## 초보자용 빠른 설정 절차

1. 저장소 클론 및 `fly.toml` 수정.
2. Fly 앱 및 볼륨 생성 후 시크릿(Secrets) 설정.
3. `fly deploy` 명령어로 배포 수행.
4. SSH로 접속하여 설정을 생성하거나 제어 UI 활용.

## 1) Fly 앱 및 볼륨 생성

```bash
# 저장소 클론
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 새로운 Fly 앱 생성 (고유한 이름 지정)
fly apps create my-openclaw

# 영구 볼륨 생성 (일반적으로 1GB면 충분함)
fly volumes create openclaw_data --size 1 --region iad
```

*팁: 본인과 지리적으로 가까운 리전(Region)을 선택함. 예: `iad` (버지니아), `sjc` (산호세), `nrt` (도쿄).*

## 2) fly.toml 구성

`fly.toml` 파일을 앱 이름과 환경에 맞춰 수정함.

**보안 주의**: 기본 설정은 공용 URL을 노출함. 공용 IP 노출이 없는 강화된 배포가 필요한 경우 [프라이빗 배포 섹션](#프라이빗-배포-보안-강화)을 참조하거나 `fly.private.toml`을 사용하기 바람.

```toml
app = "my-openclaw"  # 생성한 앱 이름
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  OPENCLAW_PREFER_PNPM = "1"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

[mounts]
  source = "openclaw_data"
  destination = "/data"
```

**주요 설정 항목 설명:**

| 설정 키 | 사유 및 목적 |
| :--- | :--- |
| `--bind lan` | Fly 프록시가 Gateway에 접근할 수 있도록 `0.0.0.0`에 바인딩함. |
| `--allow-unconfigured` | 초기 설정 파일 없이 시작하며, 사후 구성을 허용함. |
| `internal_port = 3000` | Fly 헬스 체크 포트로, `--port` 설정값과 일치해야 함. |
| `memory = "2048mb"` | 원활한 구동을 위해 최소 2GB 이상을 권장함. |
| `OPENCLAW_STATE_DIR = "/data"` | 상태 데이터를 영구 볼륨(/data)에 저장함. |

## 3) 시크릿(Secrets) 설정

```bash
# 필수: Gateway 인증 토큰 (보안을 위해 필수)
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# 모델 공급자 API 키
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# 선택 사항: 기타 공급자 및 채널 토큰
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

*주의: 모든 API 키와 토큰은 `openclaw.json` 설정 파일에 직접 기록하기보다 **환경 변수(Fly Secrets)**로 관리할 것을 강력히 권장함.*

## 4) 배포 실행

```bash
fly deploy
```

최초 배포 시에는 Docker 이미지를 빌드하므로 약 2~3분이 소요됨.

배포 완료 후 상태 확인:
```bash
fly status
fly logs
```

로그에 `[gateway] listening on ws://0.0.0.0:3000` 문구가 보이면 정상임.

## 5) 에이전트 설정 파일 생성

SSH로 배포된 머신에 접속하여 구체적인 설정을 구성함:

```bash
fly ssh console
```

설정 디렉터리 및 파일 생성:

```bash
mkdir -p /data
cat > /data/openclaw.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-3-5-sonnet-latest",
        "fallbacks": ["openai/gpt-4o"]
      },
      "maxConcurrent": 4
    },
    "list": [{ "id": "main", "default": true }]
  },
  "bindings": [{ "agentId": "main", "match": { "channel": "discord" } }],
  "channels": {
    "discord": {
      "enabled": true,
      "guilds": {
        "YOUR_GUILD_ID": {
          "channels": { "general": { "allow": true } }
        }
      }
    }
  },
  "gateway": { "mode": "local", "bind": "auto" }
}
EOF
```

적용을 위해 머신을 재시작함:
```bash
exit
fly machine restart <machine-id>
```

## 6) 시스템 접속 및 관리

### 제어 UI (Control UI)
브라우저에서 `fly open` 명령을 실행하거나 `https://<앱이름>.fly.dev/` 주소로 접속함. `OPENCLAW_GATEWAY_TOKEN`으로 설정한 토큰을 입력하여 인증함.

### 로그 확인
```bash
fly logs              # 실시간 추적
fly logs --no-tail    # 최근 로그 요약
```

## 문제 해결 (Troubleshooting)

- **접속 불가 (expected address)**: `fly.toml`의 실행 명령에 `--bind lan`이 포함되어 있는지 확인함.
- **헬스 체크 실패**: `internal_port`와 에이전트의 실제 `--port` 번호가 일치하는지 확인함.
- **메모리 부족 (OOM)**: 컨테이너가 이유 없이 재시작된다면 `fly machine update --vm-memory 2048` 명령으로 메모리를 증설함.
- **인스턴스 잠금 (Gateway Lock)**: 재시작 시 "이미 실행 중" 오류가 발생하면 `rm /data/gateway.*.lock` 명령으로 락 파일을 수동 제거함.
- **상태 유실**: `OPENCLAW_STATE_DIR`이 `/data` 볼륨 경로로 정확히 지정되어 있는지 확인함.

## 프라이빗 배포 (보안 강화)

공용 인터넷 노출을 차단하고 싶은 경우 `fly.private.toml` 템플릿을 사용함.

### 프라이빗 배포 접근 방법
1. **로컬 프록시**: `fly proxy 3000:3000` 실행 후 로컬 브라우저에서 접속.
2. **WireGuard VPN**: Fly WireGuard 네트워크를 생성하여 내부 IPv6 주소로 직접 접속.
3. **SSH 전용**: `fly ssh console`을 통해서만 관리.

## 운영 비용 안내

권장 사양(`shared-cpu-2x`, 2GB RAM) 기준 사용량에 따라 월 약 **$10~$15** 수준의 비용이 발생할 수 있음. 상세 내용은 Fly.io 가격 정책 페이지를 참조함.
