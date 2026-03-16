---
title: Fly.io
description: Fly.io에 OpenClaw Gateway를 배포하고 영구 스토리지, 시크릿, HTTPS, 초기 설정까지 구성하는 가이드
summary: 영구 스토리지와 자동 HTTPS를 포함해 OpenClaw를 Fly.io에 배포하는 단계별 가이드
read_when:
  - Fly.io에 OpenClaw를 배포할 때
  - Fly 볼륨, 시크릿, 첫 실행 구성을 설정할 때
x-i18n:
  source_path: install/fly.md
---

# Fly.io 배포

**목표:** 영구 스토리지, 자동 HTTPS, Discord/기타 채널 접근을 갖춘 [Fly.io](https://fly.io) 머신에서 OpenClaw Gateway를 실행합니다.

## 준비 사항

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) 설치
- Fly.io 계정(무료 티어 가능)
- 모델 인증 정보: 사용할 모델 제공자의 API 키
- 채널 자격 증명: Discord bot token, Telegram token 등

## 빠른 경로

1. 저장소를 클론한 뒤 `fly.toml`을 수정합니다.
2. 앱과 볼륨을 만들고 시크릿을 설정합니다.
3. `fly deploy`로 배포합니다.
4. SSH로 접속해 config를 만들거나 Control UI를 사용합니다.

## 1) Fly 앱 만들기

```bash
# Clone the repo
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Create a new Fly app (pick your own name)
fly apps create my-openclaw

# Create a persistent volume (1GB is usually enough)
fly volumes create openclaw_data --size 1 --region iad
```

**팁:** 가까운 리전을 선택하세요. 자주 쓰는 예시는 `lhr`(런던), `iad`(버지니아), `sjc`(산호세)입니다.

## 2) `fly.toml` 구성

앱 이름과 운영 환경에 맞게 `fly.toml`을 수정합니다.

**보안 참고:** 기본 설정은 public URL을 노출합니다. public IP 없이 더 단단하게 운영하려면 [비공개 배포](#비공개-배포-강화형)를 참고하거나 `fly.private.toml`을 사용하세요.

```toml
app = "my-openclaw"  # Your app name
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

**핵심 설정**

| Setting | 이유 |
| --- | --- |
| `--bind lan` | Fly 프록시가 Gateway에 접근할 수 있도록 `0.0.0.0`에 바인딩합니다. |
| `--allow-unconfigured` | config 파일 없이 먼저 기동하고, 이후 config를 생성할 수 있게 합니다. |
| `internal_port = 3000` | Fly 헬스 체크가 보는 포트로, `--port 3000` 또는 `OPENCLAW_GATEWAY_PORT`와 일치해야 합니다. |
| `memory = "2048mb"` | 512MB는 너무 작고, 2GB를 권장합니다. |
| `OPENCLAW_STATE_DIR = "/data"` | 상태 데이터를 볼륨에 영구 저장합니다. |

## 3) 시크릿 설정

```bash
# Required: Gateway token (for non-loopback binding)
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# Model provider API keys
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Optional: Other providers
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_API_KEY=...

# Channel tokens
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

**참고**

- non-loopback 바인딩(`--bind lan`)에는 보안을 위해 `OPENCLAW_GATEWAY_TOKEN`이 필요합니다.
- 이 토큰들은 비밀번호처럼 다루세요.
- API 키와 토큰은 가능한 한 `openclaw.json`이 아니라 환경 변수로 관리하세요. 이렇게 하면 시크릿이 config 파일에 남거나 로그에 노출될 위험을 줄일 수 있습니다.

## 4) 배포

```bash
fly deploy
```

첫 배포는 Docker 이미지를 빌드하므로 약 2~3분 걸립니다. 이후 배포는 더 빨라집니다.

배포 후에는 상태를 확인합니다.

```bash
fly status
fly logs
```

다음과 비슷한 로그가 보여야 합니다.

```text
[gateway] listening on ws://0.0.0.0:3000 (PID xxx)
[discord] logged in to discord as xxx
```

## 5) config 파일 만들기

정식 config를 만들기 위해 머신에 SSH로 접속합니다.

```bash
fly ssh console
```

config 디렉터리와 파일을 만듭니다.

```bash
mkdir -p /data
cat > /data/openclaw.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": ["anthropic/claude-sonnet-4-5", "openai/gpt-4o"]
      },
      "maxConcurrent": 4
    },
    "list": [
      {
        "id": "main",
        "default": true
      }
    ]
  },
  "auth": {
    "profiles": {
      "anthropic:default": { "mode": "token", "provider": "anthropic" },
      "openai:default": { "mode": "token", "provider": "openai" }
    }
  },
  "bindings": [
    {
      "agentId": "main",
      "match": { "channel": "discord" }
    }
  ],
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "allowlist",
      "guilds": {
        "YOUR_GUILD_ID": {
          "channels": { "general": { "allow": true } },
          "requireMention": false
        }
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "auto"
  },
  "meta": {
    "lastTouchedVersion": "2026.1.29"
  }
}
EOF
```

**참고:** `OPENCLAW_STATE_DIR=/data`를 사용하면 config 경로는 `/data/openclaw.json`입니다.

**참고:** Discord token은 다음 두 방식 중 하나로 제공할 수 있습니다.

- 환경 변수: `DISCORD_BOT_TOKEN`(시크릿에는 이 방식을 권장)
- config 파일: `channels.discord.token`

환경 변수를 쓰면 config에 token을 넣을 필요가 없습니다. Gateway가 `DISCORD_BOT_TOKEN`을 자동으로 읽습니다.

적용하려면 재시작합니다.

```bash
exit
fly machine restart <machine-id>
```

## 6) Gateway 접근

### Control UI

브라우저에서 다음을 엽니다.

```bash
fly open
```

또는 `https://my-openclaw.fly.dev/`로 직접 접속합니다.

인증에는 `OPENCLAW_GATEWAY_TOKEN`에 넣은 gateway token을 사용합니다.

### Logs

```bash
fly logs              # Live logs
fly logs --no-tail    # Recent logs
```

### SSH Console

```bash
fly ssh console
```

## 문제 해결

### "App is not listening on expected address"

Gateway가 `0.0.0.0`이 아니라 `127.0.0.1`에 바인딩된 상태입니다.

**해결:** `fly.toml`의 process command에 `--bind lan`을 추가하세요.

### Health checks failing / connection refused

Fly가 설정된 포트에서 Gateway에 접근하지 못하고 있습니다.

**해결:** `internal_port`가 gateway 포트와 정확히 일치하는지 확인하세요. 예를 들어 `--port 3000` 또는 `OPENCLAW_GATEWAY_PORT=3000`이어야 합니다.

### OOM / Memory Issues

컨테이너가 계속 재시작되거나 강제 종료됩니다. `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, 또는 조용한 재시작이 보일 수 있습니다.

**해결:** `fly.toml`에서 메모리를 늘리세요.

```toml
[[vm]]
  memory = "2048mb"
```

또는 기존 머신을 갱신합니다.

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**참고:** 512MB는 너무 작습니다. 1GB도 동작할 수는 있지만 부하가 있거나 로그가 많으면 OOM이 날 수 있습니다. **2GB를 권장합니다.**

### Gateway Lock Issues

Gateway가 "already running" 오류와 함께 시작을 거부합니다.

컨테이너는 재시작됐지만 PID lock 파일이 볼륨에 남아 있을 때 발생합니다.

**해결:** lock 파일을 삭제하세요.

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

lock 파일은 `/data/gateway.*.lock`에 있습니다. 하위 디렉터리가 아닙니다.

### Config Not Being Read

`--allow-unconfigured`를 사용하면 Gateway가 최소 config를 만들 수 있습니다. 그 뒤 `/data/openclaw.json`에 둔 사용자 config는 재시작 시 읽혀야 합니다.

config가 실제로 있는지 확인하세요.

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Writing Config via SSH

`fly ssh console -C`는 shell redirection을 지원하지 않습니다. config 파일을 쓰려면 다음 방법을 사용하세요.

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**참고:** 파일이 이미 있으면 `fly sftp`가 실패할 수 있습니다. 먼저 삭제하세요.

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State Not Persisting

재시작 뒤 자격 증명이나 세션이 사라진다면 상태 디렉터리가 컨테이너 파일시스템에 기록되고 있을 가능성이 큽니다.

**해결:** `fly.toml`에 `OPENCLAW_STATE_DIR=/data`가 설정돼 있는지 확인하고 다시 배포하세요.

## 업데이트

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### 머신 command 업데이트

전체 재배포 없이 시작 command만 바꾸고 싶다면:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**참고:** `fly deploy`를 다시 실행하면 머신 command는 `fly.toml` 값으로 되돌아갈 수 있습니다. 수동 변경을 했다면 배포 후 다시 적용하세요.

## 비공개 배포(강화형)

기본적으로 Fly는 public IP를 할당하므로 Gateway가 `https://your-app.fly.dev`로 노출됩니다. 편리하지만 인터넷 스캐너(Shodan, Censys 등)에 발견될 수 있습니다.

public 노출 없이 더 안전하게 운영하려면 private 템플릿을 사용하세요.

### 비공개 배포를 쓰는 경우

- **outbound** 호출과 메시지만 사용할 때
- webhook callback은 **ngrok** 또는 **Tailscale** 터널로 처리할 때
- 브라우저 대신 **SSH, proxy, WireGuard**로 Gateway에 접근할 때
- 배포 대상을 **인터넷 스캐너에 숨기고 싶을 때**

### 설정

기본 config 대신 `fly.private.toml`을 사용합니다.

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

기존 배포를 private로 전환할 수도 있습니다.

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

이후 `fly ips list`에는 `private` 타입 IP만 보여야 합니다.

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 비공개 배포 접근 방법

public URL이 없으므로 다음 중 하나를 사용합니다.

**옵션 1: 로컬 프록시(가장 단순함)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**옵션 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**옵션 3: SSH only**

```bash
fly ssh console -a my-openclaw
```

### 비공개 배포에서 webhook 사용

public 노출 없이 Twilio, Telnyx 같은 webhook callback이 필요하다면:

1. `ngrok tunnel`: 컨테이너 내부 또는 sidecar로 ngrok 실행
2. `Tailscale Funnel`: 특정 경로만 외부에 노출
3. `Outbound-only`: 일부 제공자(Twilio)는 webhook 없이 outbound 호출만으로도 충분

ngrok을 쓰는 voice-call config 예시는 다음과 같습니다.

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio",
          "tunnel": { "provider": "ngrok" },
          "webhookSecurity": {
            "allowedHosts": ["example.ngrok.app"]
          }
        }
      }
    }
  }
}
```

ngrok 터널은 Fly 앱 자체를 노출하지 않고도 public webhook URL을 제공합니다. 전달된 host header를 허용하려면 `webhookSecurity.allowedHosts`에 public tunnel hostname을 넣으세요.

### 보안 이점

| Aspect | Public | Private |
| --- | --- | --- |
| Internet scanners | Discoverable | Hidden |
| Direct attacks | Possible | Blocked |
| Control UI access | Browser | Proxy/VPN |
| Webhook delivery | Direct | Via tunnel |

## 참고

- Fly.io는 **x86 아키텍처**를 사용합니다. ARM이 아닙니다.
- Dockerfile은 두 아키텍처를 모두 지원합니다.
- WhatsApp/Telegram 온보딩은 `fly ssh console`에서 진행하세요.
- 영구 데이터는 `/data` 볼륨에 저장됩니다.
- Signal은 Java와 `signal-cli`가 필요하므로 커스텀 이미지를 쓰고 메모리는 2GB 이상으로 유지하세요.

## 비용

권장 구성(`shared-cpu-2x`, 2GB RAM) 기준:

- 사용량에 따라 월 약 `$10-15`
- 무료 티어 일부 포함

자세한 내용은 [Fly.io pricing](https://fly.io/docs/about/pricing/)을 참고하세요.
