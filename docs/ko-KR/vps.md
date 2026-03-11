---
summary: "OpenClaw용 VPS 호스팅 허브(Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - 클라우드에서 Gateway를 운영하고 싶을 때
  - VPS/호스팅 가이드의 빠른 개요가 필요할 때
title: "VPS 호스팅"
x-i18n:
  source_path: "vps.md"
---

# VPS 호스팅

이 허브는 지원되는 VPS/호스팅 가이드로 연결되며, 클라우드 배포가 상위 수준에서 어떻게 동작하는지 설명합니다.

## 제공업체 선택하기

- **Railway**(원클릭 + 브라우저 설정): [Railway](/install/railway)
- **Northflank**(원클릭 + 브라우저 설정): [Northflank](/install/northflank)
- **Oracle Cloud (Always Free)**: [Oracle](/platforms/oracle) — 월 $0(Always Free, ARM, 다만 용량 확보나 가입이 까다로울 수 있음)
- **Fly.io**: [Fly.io](/install/fly)
- **Hetzner (Docker)**: [Hetzner](/install/hetzner)
- **GCP (Compute Engine)**: [GCP](/install/gcp)
- **exe.dev**(VM + HTTPS 프록시): [exe.dev](/install/exe-dev)
- **AWS (EC2/Lightsail/free tier)**: 이것도 잘 동작합니다. 영상 가이드:
  [https://x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)

## 클라우드 구성이 동작하는 방식

- **Gateway는 VPS에서 실행**되며 상태와 워크스페이스를 소유합니다.
- 사용자는 노트북이나 휴대폰에서 **Control UI** 또는 **Tailscale/SSH**를 통해 접속합니다.
- VPS를 기준 진실의 원천으로 취급하고 상태 및 워크스페이스를 **백업**하세요.
- 안전한 기본값은 Gateway를 루프백에만 바인딩하고 SSH 터널이나 Tailscale Serve로 접근하는 것입니다.
  `lan` 또는 `tailnet`에 바인딩한다면 `gateway.auth.token` 또는 `gateway.auth.password`를 반드시 요구하세요.

원격 접속: [Gateway remote](/gateway/remote)  
플랫폼 허브: [Platforms](/platforms)

## VPS에서 회사용 공유 에이전트 운영하기

사용자들이 하나의 신뢰 경계 안에 있고(예: 한 회사 팀), 에이전트가 업무 전용이라면 이 구성이 유효합니다.

- 전용 런타임(VPS/VM/컨테이너 + 전용 OS 사용자/계정)에 배치하세요.
- 해당 런타임을 개인 Apple/Google 계정이나 개인 브라우저/비밀번호 관리자 프로필에 로그인시키지 마세요.
- 사용자 간 적대 가능성이 있다면 Gateway/호스트/OS 사용자를 분리하세요.

보안 모델 상세: [Security](/gateway/security)

## VPS와 함께 노드 사용하기

Gateway는 클라우드에 두고, 로컬 기기(Mac/iOS/Android/헤드리스)에서 **노드**를 페어링할 수 있습니다.
노드는 Gateway가 클라우드에 있어도 로컬 화면/카메라/Canvas와 `system.run` 기능을 제공합니다.

문서: [Nodes](/nodes), [Nodes CLI](/cli/nodes)

## 저사양 VM과 ARM 호스트의 시작 성능 튜닝

저전력 VM(또는 ARM 호스트)에서 CLI 명령이 느리게 느껴진다면 Node의 module compile cache를 켜세요.

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`는 반복 실행 시 시작 속도를 개선합니다.
- `OPENCLAW_NO_RESPAWN=1`은 자가 respawn 경로에서 생기는 추가 시작 오버헤드를 줄입니다.
- 첫 실행은 캐시를 예열하고, 이후 실행은 더 빨라집니다.
- Raspberry Pi 관련 세부 내용은 [Raspberry Pi](/platforms/raspberry-pi)를 참고하세요.

### systemd 튜닝 체크리스트(선택 사항)

`systemd`를 쓰는 VM 호스트라면 다음을 고려하세요.

- 안정적인 시작 경로를 위한 서비스 환경 변수 추가:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 재시작 동작을 명시적으로 유지:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 상태/캐시 경로의 랜덤 I/O 콜드 스타트 비용을 줄이기 위해 SSD 기반 디스크를 권장합니다.

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

`Restart=` 정책이 자동 복구에 어떻게 도움이 되는지는 다음을 참고하세요.
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).
