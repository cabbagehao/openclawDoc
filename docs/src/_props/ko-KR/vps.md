---
summary: "OpenClaw용 VPS 호스팅 가이드: Oracle, Fly, Hetzner, GCP, exe.dev 등 클라우드 배포 안내"
read_when:
  - 클라우드 환경(VPS)에서 Gateway를 실행하고자 할 때
  - 지원되는 VPS 공급자 및 호스팅 가이드 목록이 필요할 때
title: "VPS 호스팅"
x-i18n:
  source_path: "vps.md"
---

# VPS 호스팅

이 허브는 OpenClaw가 지원하는 주요 VPS 및 호스팅 서비스 가이드를 제공하며, 클라우드 배포 환경의 동작 방식을 상위 수준에서 설명함.

## 공급자 선택 가이드

* **Railway** (원클릭 및 브라우저 기반 설정): [Railway 가이드](/install/railway)
* **Northflank** (원클릭 및 브라우저 기반 설정): [Northflank 가이드](/install/northflank)
* **Oracle Cloud (Always Free)**: [Oracle 가이드](/platforms/oracle) — 월 \$0 (평생 무료 계정, ARM 아키텍처. 가입 및 자원 할당이 다소 까다로울 수 있음)
* **Fly.io**: [Fly.io 가이드](/install/fly)
* **Hetzner (Docker 기반)**: [Hetzner 가이드](/install/hetzner)
* **GCP (Compute Engine)**: [GCP 가이드](/install/gcp)
* **exe.dev** (VM 및 HTTPS 프록시): [exe.dev 가이드](/install/exe-dev)
* **AWS (EC2/Lightsail)**: 프리티어 범위 내에서 원활하게 작동함.

## 클라우드 배포 환경의 동작 방식

* **Gateway 서버 실행**: Gateway가 VPS 상에서 실행되며, 모든 상태 정보와 워크스페이스 데이터를 관리함.
* **접속 방법**: 로컬 기기(PC, 스마트폰)에서 **Control UI** 웹 페이지를 열거나 **Tailscale/SSH**를 통해 안전하게 접속함.
* **데이터 관리**: VPS를 \*\*데이터 단일 원천(SSOT)\*\*으로 취급하고, 정기적으로 상태 정보와 워크스페이스를 **백업**해야 함.
* **보안 권장 사항**: Gateway를 루프백(Loopback)에만 바인딩하고 SSH 터널이나 Tailscale Serve를 통해 접근하는 것이 가장 안전함. 만약 외부(`lan`, `tailnet`)에 노출해야 한다면 `gateway.auth.token` 또는 `gateway.auth.password` 설정을 반드시 적용해야 함.

상세 정보: [원격 접속 가이드](/gateway/remote), [플랫폼 허브](/platforms)

## 기업용 공유 에이전트 구성

동일한 신뢰 경계(예: 사내 팀) 내의 사용자들이 업무용으로 에이전트를 공유하는 경우 다음과 같은 원칙을 준수함:

* **격리된 실행 환경**: 전용 VPS/VM 또는 컨테이너를 사용하고, 전용 OS 사용자 계정을 할당함.
* **개인 계정 연동 금지**: 해당 실행 환경에서 개인용 Apple/Google 계정이나 개인 브라우저 프로필, 패스워드 매니저 등에 로그인하지 않음.
* **사용자 간 격리**: 보안 요구 수준에 따라 Gateway 인스턴스나 호스트, OS 사용자를 분리하여 운영함.

상세 보안 모델: [보안 개요](/gateway/security)

## VPS와 노드(Nodes) 연동

Gateway 서버는 클라우드에 두고, 실제 하드웨어 제어가 필요한 **노드**는 로컬 기기(Mac, iOS, Android 등)에 설치하여 페어링할 수 있음. 이를 통해 서버는 클라우드에 있으면서도 로컬 기기의 화면, 카메라, 캔버스 및 시스템 실행(`system.run`) 기능을 활용할 수 있음.

상세 정보: [노드 개요](/nodes), [노드 CLI 레퍼런스](/cli/nodes)

## 저사양 VM 및 ARM 호스트 성능 최적화

사양이 낮은 VM 또는 ARM 기반 호스트에서 CLI 응답 속도가 느릴 경우 Node.js의 모듈 컴파일 캐시를 활성화함:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

* **`NODE_COMPILE_CACHE`**: 반복적인 명령어 실행 시 로딩 속도를 대폭 향상시킴.
* **`OPENCLAW_NO_RESPAWN=1`**: 자가 재실행(Self-respawn) 시 발생하는 불필요한 시작 오버헤드를 제거함.
* 첫 실행 시 캐시가 생성되며, 이후부터 실행 속도가 빨라짐.
* Raspberry Pi 환경의 경우 [Raspberry Pi 가이드](/platforms/raspberry-pi)를 별도로 참조함.

### systemd 서비스 최적화 (선택 사항)

`systemd`를 사용하는 경우 서비스 설정 파일에 다음 내용을 추가하여 안정성과 성능을 높일 수 있음:

* **안정적인 실행 경로 확보**:
  * `Environment=OPENCLAW_NO_RESPAWN=1`
  * `Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
* **명시적인 재시작 정책**:
  * `Restart=always`
  * `RestartSec=2`
  * `TimeoutStartSec=90`
* **스토리지 권장**: 무작위 I/O 성능이 우수한 SSD 기반 디스크를 사용하여 콜드 스타트 지연을 최소화함.

설정 예시 (`sudo systemctl edit openclaw`):

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```
