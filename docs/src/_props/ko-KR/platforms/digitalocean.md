---
summary: "DigitalOcean에서 OpenClaw 실행하기 (간단한 유료 VPS 옵션)"
read_when:
  - DigitalOcean에서 OpenClaw를 설정할 때
  - OpenClaw용 저렴한 VPS 호스팅을 찾을 때
title: "DigitalOcean"
---

# OpenClaw on DigitalOcean

## Goal

DigitalOcean에서 **월 6달러**(reserved pricing이면 월 4달러 수준)로 지속 실행되는 OpenClaw Gateway를 운영합니다.

월 0달러 옵션이 필요하고 ARM + provider별 설정을 감수할 수 있다면 [Oracle Cloud guide](/platforms/oracle)를 보세요.

## Cost Comparison (2026)

| Provider     | Plan            | Specs                  | Price/mo      | Notes                    |
| ------------ | --------------- | ---------------------- | ------------- | ------------------------ |
| Oracle Cloud | Always Free ARM | up to 4 OCPU, 24GB RAM | \$0           | ARM, 제한된 수용량 / 가입 quirks |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (\~\$4) | 가장 저렴한 유료 옵션             |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | \$6           | 쉬운 UI, 좋은 문서             |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | \$6           | 위치 선택이 많음                |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | \$5           | 현재 Akamai 소속             |

**Provider 선택 가이드:**

* DigitalOcean: 가장 단순한 UX + 예측 가능한 설정(이 가이드)
* Hetzner: 좋은 가격 대비 성능([Hetzner guide](/install/hetzner))
* Oracle Cloud: 월 0달러 가능하지만 더 까다롭고 ARM 전용([Oracle guide](/platforms/oracle))

***

## Prerequisites

* DigitalOcean 계정([signup with \$200 free credit](https://m.do.co/c/signup))
* SSH key pair(또는 password auth 사용 의향)
* 약 20분

## 1) Create a Droplet

<Warning>
  깨끗한 base image(Ubuntu 24.04 LTS)를 사용하세요. startup script나 firewall 기본값을 검토하지 않았다면 third-party Marketplace 1-click image는 피하는 편이 좋습니다.
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/)에 로그인
2. **Create → Droplets** 클릭
3. 다음을 선택:
   * **Region:** 자신 또는 사용자와 가까운 지역
   * **Image:** Ubuntu 24.04 LTS
   * **Size:** Basic → Regular → **\$6/mo** (1 vCPU, 1GB RAM, 25GB SSD)
   * **Authentication:** SSH key(권장) 또는 password
4. **Create Droplet** 클릭
5. IP 주소를 기록

## 2) Connect via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Install OpenClaw

```bash
# 시스템 업데이트
apt update && apt upgrade -y

# Node.js 22 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# OpenClaw 설치
curl -fsSL https://openclaw.ai/install.sh | bash

# 확인
openclaw --version
```

## 4) Run Onboarding

```bash
openclaw onboard --install-daemon
```

wizard가 다음을 안내합니다.

* Model auth(API key 또는 OAuth)
* Channel 설정(Telegram, WhatsApp, Discord 등)
* Gateway token(자동 생성)
* Daemon 설치(systemd)

## 5) Verify the Gateway

```bash
# 상태 확인
openclaw status

# 서비스 확인
systemctl --user status openclaw-gateway.service

# 로그 보기
journalctl --user -u openclaw-gateway.service -f
```

## 6) Access the Dashboard

gateway는 기본적으로 loopback에 bind됩니다. Control UI에 접근하려면:

**Option A: SSH Tunnel (recommended)**

```bash
# 로컬 머신에서
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# 그런 다음 열기: http://localhost:18789
```

**Option B: Tailscale Serve (HTTPS, loopback-only)**

```bash
# droplet에서
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Gateway가 Tailscale Serve를 사용하도록 설정
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

열기: `https://<magicdns>/`

참고:

* Serve는 Gateway를 loopback-only로 유지한 채, Tailscale identity header를 통해 Control UI/WebSocket 트래픽을 인증합니다(tokenless auth는 신뢰된 gateway host를 전제로 함. HTTP API는 여전히 token/password 필요)
* token/password를 강제하려면 `gateway.auth.allowTailscale: false`를 설정하거나 `gateway.auth.mode: "password"`를 사용하세요.

**Option C: Tailnet bind (no Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

열기: `http://<tailscale-ip>:18789` (token 필요)

## 7) Connect Your Channels

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# QR code 스캔
```

다른 provider는 [Channels](/channels)를 참고하세요.

***

## Optimizations for 1GB RAM

\$6 droplet은 RAM이 1GB뿐입니다. 안정적으로 돌리려면:

### Add swap (recommended)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Use a lighter model

OOM이 난다면 다음을 고려하세요.

* 로컬 모델 대신 API 기반 모델(Claude, GPT) 사용
* `agents.defaults.model.primary`를 더 작은 모델로 설정

### Monitor memory

```bash
free -h
htop
```

***

## Persistence

모든 state는 다음 위치에 저장됩니다.

* `~/.openclaw/` — config, credential, session data
* `~/.openclaw/workspace/` — workspace(SOUL.md, memory 등)

이 경로들은 재부팅 후에도 유지됩니다. 주기적으로 백업하세요.

```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

***

## Oracle Cloud Free Alternative

Oracle Cloud는 **Always Free** ARM instance를 제공합니다. 여기의 어떤 유료 옵션보다도 더 강력하면서 월 0달러입니다.

| What you get      | Specs         |
| ----------------- | ------------- |
| **4 OCPUs**       | ARM Ampere A1 |
| **24GB RAM**      | 충분하고도 남음      |
| **200GB storage** | Block volume  |
| **Forever free**  | 신용카드 청구 없음    |

**주의점:**

* 가입이 까다로울 수 있음(실패하면 다시 시도)
* ARM 아키텍처 — 대부분은 동작하지만 일부 binary는 ARM build가 필요

전체 설정 가이드는 [Oracle Cloud](/platforms/oracle)를, 가입 팁과 enrollment troubleshooting은 이 [community guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)를 참고하세요.

***

## Troubleshooting

### Gateway won't start

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl -u openclaw --no-pager -n 50
```

### Port already in use

```bash
lsof -i :18789
kill <PID>
```

### Out of memory

```bash
# 메모리 확인
free -h

# swap 더 추가
# 또는 $12/mo droplet(2GB RAM)로 업그레이드
```

***

## See Also

* [Hetzner guide](/install/hetzner) — 더 싸고 더 강력함
* [Docker install](/install/docker) — containerized setup
* [Tailscale](/gateway/tailscale) — 안전한 원격 접근
* [Configuration](/gateway/configuration) — 전체 config 참조
