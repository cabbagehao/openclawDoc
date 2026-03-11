---
title: Fly.io
description: Fly.io에 OpenClaw 배포
summary: "영구 스토리지와 HTTPS를 포함한 OpenClaw용 단계별 Fly.io 배포"
read_when:
  - Fly.io에 OpenClaw를 배포할 때
  - Fly volume, secret, 첫 실행 config를 설정할 때
---

# Fly.io Deployment

**목표:** 영구 스토리지, 자동 HTTPS, Discord/채널 접근이 포함된 [Fly.io](https://fly.io) machine에서 OpenClaw Gateway를 실행합니다.

## 필요한 것

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) 설치
- Fly.io 계정 (free tier 사용 가능)
- 모델 인증: 선택한 model provider의 API key
- 채널 자격 증명: Discord bot token, Telegram token 등

## 초보자용 빠른 경로

1. repo clone → `fly.toml` 사용자화
2. app + volume 생성 → secret 설정
3. `fly deploy` 로 배포
4. SSH로 접속해 config 생성 또는 Control UI 사용

## 1) Fly app 만들기

```bash
# Clone the repo
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Create a new Fly app (pick your own name)
fly apps create my-openclaw

# Create a persistent volume (1GB is usually enough)
fly volumes create openclaw_data --size 1 --region iad
```

**팁:** 자신과 가까운 region을 선택하세요. 흔한 옵션: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

## 2) fly.toml 설정

앱 이름과 요구사항에 맞게 `fly.toml` 을 수정하세요.

**보안 참고:** 기본 config는 public URL을 노출합니다. public IP가 없는 hardened 배포가 필요하면 [Private Deployment](#private-deployment-hardened) 를 보거나 `fly.private.toml` 을 사용하세요.

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

**핵심 설정:**

| Setting                        | Why                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `--bind lan`                   | Fly의 proxy가 gateway에 도달할 수 있도록 `0.0.0.0` 에 bind                         |
| `--allow-unconfigured`         | config 파일 없이 시작하고 나중에 생성할 수 있게 함                                 |
| `internal_port = 3000`         | Fly health check를 위해 `--port 3000` (또는 `OPENCLAW_GATEWAY_PORT`)과 일치해야 함 |
| `memory = "2048mb"`            | 512MB는 너무 작음, 2GB 권장                                                        |
| `OPENCLAW_STATE_DIR = "/data"` | volume에 state를 영구 저장                                                         |

## 3) secret 설정

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

**참고:**

- non-loopback bind(`--bind lan`)에는 보안을 위해 `OPENCLAW_GATEWAY_TOKEN` 이 필요합니다.
- 이 token은 비밀번호처럼 취급하세요.
- 모든 API key와 token은 **config 파일보다 env var를 우선**하세요. 이렇게 하면 secret이 `openclaw.json` 에 들어가 우발적으로 노출되거나 로그에 남는 것을 막을 수 있습니다.

## 4) 배포

```bash
fly deploy
```

첫 배포는 Docker image를 빌드하므로 시간이 걸립니다(~2-3분). 이후 배포는 더 빠릅니다.

배포 후 확인:

```bash
fly status
fly logs
```

다음과 비슷한 출력이 보여야 합니다:

```text
[gateway] listening on ws://0.0.0.0:3000 (PID xxx)
[discord] logged in to discord as xxx
```

## 5) config 파일 만들기

올바른 config를 만들기 위해 machine에 SSH 접속합니다.

```bash
fly ssh console
```

config 디렉터리와 파일 생성:

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

**참고:** `OPENCLAW_STATE_DIR=/data` 를 사용하면 config 경로는 `/data/openclaw.json` 입니다.

**참고:** Discord token은 다음 둘 중 하나에서 올 수 있습니다.

- 환경 변수: `DISCORD_BOT_TOKEN` (secret에는 권장)
- config 파일: `channels.discord.token`

env var를 사용하는 경우 config에 token을 추가할 필요가 없습니다. gateway가 `DISCORD_BOT_TOKEN` 을 자동으로 읽습니다.

적용을 위해 재시작:

```bash
exit
fly machine restart <machine-id>
```

## 6) Gateway 접근

### Control UI

브라우저에서 열기:

```bash
fly open
```

또는 `https://my-openclaw.fly.dev/` 로 접속하세요.

인증을 위해 gateway token(`OPENCLAW_GATEWAY_TOKEN` 에서 설정한 값)을 붙여 넣으세요.

### 로그

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

gateway가 `0.0.0.0` 이 아니라 `127.0.0.1` 에 bind되고 있습니다.

**해결:** `fly.toml` 의 process command에 `--bind lan` 을 추가하세요.

### Health check 실패 / connection refused

Fly가 설정된 포트에서 gateway에 도달할 수 없습니다.

**해결:** `internal_port` 가 gateway 포트와 일치하는지 확인하세요 (`--port 3000` 또는 `OPENCLAW_GATEWAY_PORT=3000` 설정).

### OOM / 메모리 문제

컨테이너가 계속 재시작되거나 kill됩니다. 징후: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, 또는 조용한 재시작.

**해결:** `fly.toml` 에서 memory를 늘리세요.

```toml
[[vm]]
  memory = "2048mb"
```

또는 기존 machine 업데이트:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**참고:** 512MB는 너무 작습니다. 1GB도 동작할 수는 있지만 부하가 있거나 verbose logging 시 OOM이 날 수 있습니다. **2GB를 권장**합니다.

### Gateway Lock 문제

Gateway가 "already running" 오류와 함께 시작을 거부합니다.

이는 컨테이너가 재시작되었지만 PID lock 파일이 volume에 남아 있을 때 발생합니다.

**해결:** lock 파일을 삭제하세요.

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

lock 파일은 `/data/gateway.*.lock` 에 있습니다(하위 디렉터리가 아님).

### Config가 읽히지 않음

`--allow-unconfigured` 를 사용하면 gateway가 최소 config를 만듭니다. `/data/openclaw.json` 의 사용자 config는 재시작 시 읽혀야 합니다.

config 존재 여부 확인:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH로 config 쓰기

`fly ssh console -C` 명령은 shell redirection을 지원하지 않습니다. config 파일을 쓰려면:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**참고:** 파일이 이미 존재하면 `fly sftp` 가 실패할 수 있습니다. 먼저 삭제하세요.

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State가 영구 저장되지 않음

재시작 후 자격 증명이나 session을 잃는다면, state dir이 컨테이너 파일시스템에 쓰이고 있는 것입니다.

**해결:** `fly.toml` 에 `OPENCLAW_STATE_DIR=/data` 가 설정되어 있는지 확인하고 redeploy하세요.

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

### Machine command 업데이트

전체 redeploy 없이 startup command를 바꿔야 한다면:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**참고:** `fly deploy` 후에는 machine command가 `fly.toml` 에 적힌 값으로 다시 돌아갈 수 있습니다. 수동 변경을 했다면 deploy 후 다시 적용하세요.

## Private Deployment (Hardened)

기본적으로 Fly는 public IP를 할당하므로 gateway가 `https://your-app.fly.dev` 에서 접근 가능해집니다. 편리하지만 인터넷 스캐너(Shodan, Censys 등)에 배포가 발견될 수 있다는 뜻이기도 합니다.

**public exposure가 전혀 없는** hardened 배포가 필요하다면 private template를 사용하세요.

### 언제 private deployment를 써야 하나요

- **outbound** call/message만 사용하고 inbound webhook은 필요 없을 때
- webhook callback에는 **ngrok 또는 Tailscale** tunnel을 사용할 때
- 브라우저 대신 **SSH, proxy, WireGuard** 로 gateway에 접근할 때
- 배포를 **인터넷 스캐너에 숨기고** 싶을 때

### 설정

표준 config 대신 `fly.private.toml` 을 사용하세요.

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

기존 배포를 전환하는 방법:

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

이후 `fly ips list` 에는 `private` 타입 IP만 보여야 합니다.

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### private deployment 접근 방법

public URL이 없으므로 다음 중 하나를 사용하세요.

**Option 1: 로컬 proxy (가장 단순)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Option 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3: SSH only**

```bash
fly ssh console -a my-openclaw
```

### private deployment에서 webhook 사용

public exposure 없이 webhook callback(Twilio, Telnyx 등)이 필요하다면:

1. **ngrok tunnel** - 컨테이너 내부 또는 sidecar로 ngrok 실행
2. **Tailscale Funnel** - 특정 path만 Tailscale로 노출
3. **Outbound-only** - 일부 provider(Twilio)는 webhook 없이도 outbound call이 잘 동작

ngrok을 사용하는 voice-call config 예시:

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

ngrok tunnel은 컨테이너 내부에서 실행되며, Fly app 자체를 노출하지 않고 public webhook URL을 제공합니다. forwarded host header가 허용되도록 `webhookSecurity.allowedHosts` 를 public tunnel hostname으로 설정하세요.

### 보안 이점

| Aspect            | Public       | Private    |
| ----------------- | ------------ | ---------- |
| Internet scanners | Discoverable | Hidden     |
| Direct attacks    | Possible     | Blocked    |
| Control UI access | Browser      | Proxy/VPN  |
| Webhook delivery  | Direct       | Via tunnel |

## 참고

- Fly.io는 **x86 architecture** 를 사용합니다(ARM 아님)
- Dockerfile은 두 architecture 모두와 호환됩니다
- WhatsApp/Telegram onboarding에는 `fly ssh console` 을 사용하세요
- 영구 데이터는 `/data` volume에 저장됩니다
- Signal은 Java + signal-cli가 필요하므로 custom image를 사용하고 memory는 2GB 이상으로 유지하세요

## 비용

권장 config (`shared-cpu-2x`, 2GB RAM) 기준:

- 사용량에 따라 약 월 $10-15
- free tier에도 일부 기본 할당 포함

자세한 내용은 [Fly.io pricing](https://fly.io/docs/about/pricing/) 을 참고하세요.
