---
summary: "Raspberry Pi에서 OpenClaw 실행(저예산 셀프 호스팅 구성)"
read_when:
  - Raspberry Pi에 OpenClaw를 설정할 때
  - ARM 장치에서 OpenClaw를 실행할 때
  - 저렴한 상시 구동 개인 AI를 구축할 때
title: "Raspberry Pi"
---

# Raspberry Pi에서 OpenClaw 실행

## 목표

Raspberry Pi에서 지속적이고 항상 켜져 있는 OpenClaw Gateway를 **약 $35-80**의 1회 비용(월 사용료 없음)으로 실행합니다.

다음 용도에 적합합니다.

- 24/7 개인 AI 어시스턴트
- 홈 오토메이션 허브
- 저전력 상시 가동 Telegram/WhatsApp 봇

## 하드웨어 요구 사항

| Pi Model        | RAM     | Works?   | Notes                              |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Best  | 가장 빠름, 권장                    |
| **Pi 4**        | 4GB     | ✅ Good  | 대부분 사용자에게 가장 좋은 균형점 |
| **Pi 4**        | 2GB     | ✅ OK    | 동작함, swap 추가 권장             |
| **Pi 4**        | 1GB     | ⚠️ Tight | swap과 최소 설정으로 가능          |
| **Pi 3B+**      | 1GB     | ⚠️ Slow  | 동작하지만 느림                    |
| **Pi Zero 2 W** | 512MB   | ❌       | 권장하지 않음                      |

**최소 사양:** 1GB RAM, 1 core, 500MB 디스크  
**권장:** 2GB+ RAM, 64-bit OS, 16GB+ SD 카드(또는 USB SSD)

## 준비물

- Raspberry Pi 4 또는 5 (2GB+ 권장)
- MicroSD 카드(16GB+) 또는 USB SSD(더 나은 성능)
- 전원 공급 장치(공식 Pi PSU 권장)
- 네트워크 연결(Ethernet 또는 WiFi)
- 약 30분

## 1) OS 플래시

헤드리스 서버에는 데스크톱이 필요 없으므로 **Raspberry Pi OS Lite (64-bit)** 를 사용하세요.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) 다운로드
2. OS 선택: **Raspberry Pi OS Lite (64-bit)**
3. 톱니바퀴 아이콘(⚙️)을 클릭해 사전 설정
   - hostname 설정: `gateway-host`
   - SSH 활성화
   - username/password 설정
   - WiFi 설정(Ethernet을 사용하지 않는 경우)
4. SD 카드 / USB 드라이브에 플래시
5. Pi에 삽입하고 부팅

## 2) SSH로 접속

```bash
ssh user@gateway-host
# 또는 IP 주소 사용
ssh user@192.168.x.x
```

## 3) 시스템 설정

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y git curl build-essential

# 시간대 설정 (cron/reminder에 중요)
sudo timedatectl set-timezone America/Chicago  # 자신의 시간대로 변경
```

## 4) Node.js 22 설치 (ARM64)

```bash
# NodeSource를 통해 Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 확인
node --version  # v22.x.x가 보여야 함
npm --version
```

## 5) Swap 추가 (2GB 이하에서 중요)

swap은 out-of-memory 크래시를 방지합니다.

```bash
# 2GB swap 파일 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 적용
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 저 RAM 환경에 맞게 최적화 (swappiness 감소)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw 설치

### 옵션 A: 표준 설치 (권장)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 옵션 B: Hackable 설치 (튜닝/실험용)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

hackable 설치는 로그와 코드에 직접 접근할 수 있게 해 주므로 ARM 특화 문제를 디버깅할 때 유용합니다.

## 7) Onboarding 실행

```bash
openclaw onboard --install-daemon
```

wizard를 따라가세요.

1. **Gateway mode:** Local
2. **Auth:** API key 권장(OAuth는 헤드리스 Pi에서 까다로울 수 있음)
3. **Channels:** Telegram이 시작하기 가장 쉬움
4. **Daemon:** Yes (systemd)

## 8) 설치 확인

```bash
# 상태 확인
openclaw status

# 서비스 확인
sudo systemctl status openclaw

# 로그 보기
journalctl -u openclaw -f
```

## 9) Dashboard 접속

Pi는 헤드리스이므로 SSH 터널을 사용하세요.

```bash
# 노트북/데스크톱에서
ssh -L 18789:localhost:18789 user@gateway-host

# 그런 다음 브라우저에서 열기
open http://localhost:18789
```

또는 항상 켜진 접근을 위해 Tailscale을 사용하세요.

```bash
# Pi에서
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 설정 업데이트
openclaw config set gateway.bind tailnet
sudo systemctl restart openclaw
```

---

## 성능 최적화

### USB SSD 사용 (큰 개선)

SD 카드는 느리고 마모됩니다. USB SSD는 성능을 크게 개선합니다.

```bash
# USB로 부팅 중인지 확인
lsblk
```

설정 방법은 [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)를 참고하세요.

### CLI 시작 속도 향상 (module compile cache)

저전력 Pi 호스트에서는 Node의 module compile cache를 활성화해 반복적인 CLI 실행 속도를 높이세요.

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

참고:

- `NODE_COMPILE_CACHE`는 이후 실행(`status`, `health`, `--help`)을 빠르게 합니다.
- `/var/tmp`는 `/tmp`보다 재부팅 후에도 더 잘 유지됩니다.
- `OPENCLAW_NO_RESPAWN=1`은 CLI self-respawn으로 인한 추가 startup 비용을 피합니다.
- 첫 실행이 캐시를 데우고, 이후 실행에서 효과가 가장 큽니다.

### systemd startup tuning (선택 사항)

이 Pi가 대부분 OpenClaw만 실행한다면, service drop-in을 추가해 restart jitter를 줄이고 startup env를 안정적으로 유지하세요.

```bash
sudo systemctl edit openclaw
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

그런 다음 적용하세요.

```bash
sudo systemctl daemon-reload
sudo systemctl restart openclaw
```

가능하면 OpenClaw 상태/캐시는 SSD 기반 스토리지에 유지해 cold start 시 SD 카드의 random-I/O 병목을 피하세요.

`Restart=` 정책이 자동 복구에 도움이 되는 방식:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)

### 메모리 사용량 줄이기

```bash
# GPU 메모리 할당 비활성화 (헤드리스)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 필요하지 않으면 Bluetooth 비활성화
sudo systemctl disable bluetooth
```

### 리소스 모니터링

```bash
# 메모리 확인
free -h

# CPU 온도 확인
vcgencmd measure_temp

# 실시간 모니터링
htop
```

---

## ARM 관련 참고 사항

### 바이너리 호환성

대부분의 OpenClaw 기능은 ARM64에서 동작하지만, 일부 외부 바이너리는 ARM 빌드가 필요할 수 있습니다.

| Tool               | ARM64 Status | Notes                               |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | 매우 잘 동작                        |
| WhatsApp (Baileys) | ✅           | 순수 JS, 문제 없음                  |
| Telegram           | ✅           | 순수 JS, 문제 없음                  |
| gog (Gmail CLI)    | ⚠️           | ARM 릴리스 여부 확인 필요           |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

skill이 실패하면, 그 바이너리에 ARM 빌드가 있는지 확인하세요. 많은 Go/Rust 도구는 있지만, 일부는 없습니다.

### 32-bit vs 64-bit

**항상 64-bit OS를 사용하세요.** Node.js와 많은 최신 도구가 이를 요구합니다. 다음으로 확인하세요.

```bash
uname -m
# 다음이 보여야 함: aarch64 (64-bit), armv7l (32-bit) 아님
```

---

## 권장 모델 설정

Pi는 Gateway 역할만 하고 모델은 클라우드에서 실행되므로 API 기반 모델을 사용하세요.

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o-mini"]
      }
    }
  }
}
```

**Pi에서 로컬 LLM을 실행하려고 하지 마세요**. 작은 모델도 너무 느립니다. 무거운 작업은 Claude/GPT에 맡기세요.

---

## 부팅 시 자동 시작

onboarding wizard가 이를 설정하지만, 확인하려면 다음을 실행하세요.

```bash
# 서비스가 활성화되어 있는지 확인
sudo systemctl is-enabled openclaw

# 활성화되지 않았다면 활성화
sudo systemctl enable openclaw

# 부팅 시 시작
sudo systemctl start openclaw
```

---

## Troubleshooting

### 메모리 부족 (OOM)

```bash
# 메모리 확인
free -h

# swap 더 추가 (5단계 참고)
# 또는 Pi에서 실행 중인 서비스 수 줄이기
```

### 느린 성능

- SD 카드 대신 USB SSD 사용
- 사용하지 않는 서비스 비활성화: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU throttling 확인: `vcgencmd get_throttled` (`0x0`이 반환되어야 함)

### 서비스가 시작되지 않음

```bash
# 로그 확인
journalctl -u openclaw --no-pager -n 100

# 일반적인 해결 방법: rebuild
cd ~/openclaw  # hackable install을 사용하는 경우
npm run build
sudo systemctl restart openclaw
```

### ARM 바이너리 문제

skill이 "exec format error"로 실패하면:

1. 해당 바이너리에 ARM64 빌드가 있는지 확인
2. 소스에서 빌드 시도
3. 또는 ARM 지원 Docker 컨테이너 사용

### WiFi 끊김

WiFi를 사용하는 헤드리스 Pi의 경우:

```bash
# WiFi 전원 관리 비활성화
sudo iwconfig wlan0 power off

# 영구 적용
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 비용 비교

| Setup          | One-Time Cost | Monthly Cost | Notes                   |
| -------------- | ------------- | ------------ | ----------------------- |
| **Pi 4 (2GB)** | ~$45          | $0           | + 전력 (~$5/년)         |
| **Pi 4 (4GB)** | ~$55          | $0           | 권장                    |
| **Pi 5 (4GB)** | ~$60          | $0           | 최고 성능               |
| **Pi 5 (8GB)** | ~$80          | $0           | 과하지만 미래 대비 가능 |
| DigitalOcean   | $0            | $6/mo        | $72/년                  |
| Hetzner        | $0            | €3.79/mo     | 약 $50/년               |

**손익분기점:** Pi는 클라우드 VPS 대비 약 6-12개월이면 본전을 뽑습니다.

---

## 함께 보기

- [Linux guide](/platforms/linux) — 일반 Linux 설정
- [DigitalOcean guide](/platforms/digitalocean) — 클라우드 대안
- [Hetzner guide](/install/hetzner) — Docker 설정
- [Tailscale](/gateway/tailscale) — 원격 접근
- [Nodes](/nodes) — 노트북/휴대폰을 Pi gateway와 페어링
