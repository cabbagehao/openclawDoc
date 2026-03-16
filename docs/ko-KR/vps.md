---
summary: "OpenClaw용 VPS 호스팅 허브(Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - Gateway를 클라우드에서 실행하려고 할 때
  - VPS/호스팅 가이드를 빠르게 훑어보고 싶을 때
title: "VPS Hosting"
description: "OpenClaw를 VPS나 클라우드 호스팅 환경에 배포할 때 참고할 공급자별 가이드와 공통 운영 원칙을 정리합니다."
x-i18n:
  source_path: "vps.md"
---

# VPS hosting

이 허브는 지원되는 VPS/호스팅 가이드로 연결되며, 클라우드 배포가 높은 수준에서 어떻게 동작하는지 설명합니다.

## 공급자 선택

- **Railway** (원클릭 + 브라우저 설정): [Railway](/install/railway)
- **Northflank** (원클릭 + 브라우저 설정): [Northflank](/install/northflank)
- **Oracle Cloud (Always Free)**: [Oracle](/platforms/oracle) — 월 $0 (Always Free, ARM; 수용량과 가입 과정이 다소 까다로울 수 있음)
- **Fly.io**: [Fly.io](/install/fly)
- **Hetzner (Docker)**: [Hetzner](/install/hetzner)
- **GCP (Compute Engine)**: [GCP](/install/gcp)
- **exe.dev** (VM + HTTPS proxy): [exe.dev](/install/exe-dev)
- **AWS (EC2/Lightsail/free tier)**: 이것도 잘 동작합니다. 영상 가이드:
  [https://x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)

## 클라우드 구성 방식

- **Gateway는 VPS에서 실행**되며 상태와 workspace를 소유합니다.
- 노트북이나 휴대폰에서는 **Control UI** 또는 **Tailscale/SSH**로 접속합니다.
- VPS를 단일 진실 공급원으로 취급하고 상태와 workspace를 **백업**하세요.
- 안전한 기본값은 Gateway를 loopback에만 바인딩하고 SSH tunnel 또는 Tailscale Serve로 접근하는 것입니다.
  `lan`/`tailnet`에 바인딩한다면 `gateway.auth.token` 또는 `gateway.auth.password`를 요구하세요.

원격 접근: [Gateway remote](/gateway/remote)
플랫폼 허브: [Platforms](/platforms)

## VPS 위의 공유 회사 에이전트

사용자가 하나의 신뢰 경계 안에 있고(예: 한 회사 팀), 에이전트가 업무 전용이라면 유효한 구성입니다.

- 전용 런타임(VPS/VM/container + 전용 OS 사용자/계정)에 유지하세요.
- 그 런타임에서 개인 Apple/Google 계정이나 개인 브라우저/비밀번호 관리자 프로필에 로그인하지 마세요.
- 사용자가 서로 적대적일 수 있다면 gateway/host/OS user 단위로 분리하세요.

보안 모델 세부 사항: [Security](/gateway/security)

## VPS에서 nodes 사용하기

Gateway는 클라우드에 두고, 로컬 기기(Mac/iOS/Android/headless)에서 **nodes**를 페어링할 수 있습니다. Nodes는 Gateway를 클라우드에 둔 상태에서도 로컬 화면/카메라/canvas와 `system.run` 기능을 제공합니다.

문서: [Nodes](/nodes), [Nodes CLI](/cli/nodes)

## 소형 VM과 ARM 호스트의 시작 성능 튜닝

저전력 VM(또는 ARM 호스트)에서 CLI 명령이 느리게 느껴진다면 Node의 module compile cache를 활성화하세요:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`는 반복 실행되는 명령의 시작 시간을 개선합니다.
- `OPENCLAW_NO_RESPAWN=1`은 self-respawn 경로로 인한 추가 시작 오버헤드를 피합니다.
- 첫 실행은 캐시를 예열하고, 이후 실행은 더 빨라집니다.
- Raspberry Pi 관련 사항은 [Raspberry Pi](/platforms/raspberry-pi)를 참고하세요.

### systemd 튜닝 체크리스트 (선택 사항)

`systemd`를 사용하는 VM 호스트라면 다음을 고려하세요:

- 안정적인 시작 경로를 위한 서비스 env 추가:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 재시작 동작을 명시적으로 유지:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- state/cache 경로의 random-I/O cold-start 비용을 줄이려면 SSD 기반 디스크를 권장합니다.

예시:

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

`Restart=` 정책이 자동 복구에 어떻게 도움이 되는지:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).
