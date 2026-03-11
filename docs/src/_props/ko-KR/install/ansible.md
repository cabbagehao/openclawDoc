---
summary: "Ansible, Tailscale VPN 및 방화벽 격리를 활용한 OpenClaw 자동화 설치 및 보안 강화 가이드"
read_when:
  - 보안이 강화된 서버 배포 자동화가 필요할 때
  - VPN 전용 접근 및 방화벽 격리 환경을 구축하고자 할 때
  - 원격 Debian/Ubuntu 서버에 에이전트를 배포할 때
title: "Ansible 설치"
x-i18n:
  source_path: "install/ansible.md"
---

# Ansible 설치 가이드

운영 환경 서버에 OpenClaw를 배포하는 가장 권장되는 방식은 \*\*[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)\*\*을 사용하는 것임. 이는 보안 우선 아키텍처를 기반으로 설계된 자동화 설치 도구임.

## 빠른 시작 (Quick Start)

단일 명령어로 설치를 시작할 수 있음:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **📦 전체 가이드: [github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**
>
> Ansible 배포와 관련된 최신 정보와 상세 지침은 위 저장소를 참조하기 바람. 본 페이지는 주요 개요만을 다룸.

## 주요 특징

* 🔒 **방화벽 우선 보안**: UFW 및 Docker 격리 설정을 통해 SSH와 Tailscale 외의 모든 외부 접근을 차단함.
* 🔐 **Tailscale VPN**: 서비스를 공용 인터넷에 노출하지 않고 안전한 원격 접속 환경을 제공함.
* 🐳 **Docker 기반 격리**: 에이전트 도구 실행을 위한 격리된 샌드박스 컨테이너를 구성하며, 호스트 바인딩은 루프백(Localhost)으로 제한함.
* 🛡️ **심층 방어 (Defense in Depth)**: 4계층 보안 아키텍처를 적용함.
* 🚀 **원클릭 설정**: 복잡한 서버 구성을 단 몇 분 만에 완료함.
* 🔧 **Systemd 통합**: 보안이 강화된 설정으로 부팅 시 자동 시작되도록 구성함.

## 요구 사항

* **OS**: Debian 11 이상 또는 Ubuntu 20.04 이상 버전.
* **권한**: Root 또는 sudo 권한 필요.
* **네트워크**: 패키지 설치를 위한 인터넷 연결 필요.
* **Ansible**: 2.14 이상 버전 (빠른 시작 스크립트 실행 시 자동으로 설치됨).

## 설치 항목

Ansible 플레이북(Playbook)은 다음 요소들을 설치하고 구성함:

1. **Tailscale**: 보안 원격 접속을 위한 메시(Mesh) VPN 구축.
2. **UFW 방화벽**: SSH 및 Tailscale 포트만 허용하도록 차단 설정.
3. **Docker CE 및 Compose V2**: 에이전트 샌드박스 구동 환경 구축.
4. **Node.js 22.x 및 pnpm**: 런타임 의존성 설치.
5. **OpenClaw**: 호스트 기반으로 설치 (Gateway 프로세스는 컨테이너 외부에서 실행).
6. **Systemd 서비스**: 보안 강화 설정이 포함된 자동 시작 서비스 등록.

*참고: Gateway 서버는 **호스트 시스템에서 직접** 실행되지만, 개별 에이전트의 도구 실행은 격리를 위해 Docker 샌드박스를 사용함. 상세 내용은 [샌드박싱 가이드](/gateway/sandboxing)를 참조함.*

## 설치 후 후속 설정

설치가 완료되면 `openclaw` 사용자로 전환하여 설정을 마무리함:

```bash
sudo -i -u openclaw
```

후속 설정 스크립트가 다음 과정을 안내함:

1. **온보딩 마법사**: OpenClaw 기본 설정 구성.
2. **공급자 로그인**: WhatsApp, Telegram, Discord, Signal 등 채널 연동.
3. **Gateway 테스트**: 설치 상태 및 작동 여부 검증.
4. **Tailscale 설정**: 사용자의 VPN 메시 네트워크에 기기 연결.

### 주요 관리 명령어

```bash
# 서비스 상태 확인
sudo systemctl status openclaw

# 실시간 로그 확인
sudo journalctl -u openclaw -f

# Gateway 재시작
sudo systemctl restart openclaw

# 채널 로그인 (반드시 openclaw 사용자로 실행)
sudo -i -u openclaw
openclaw channels login
```

## 보안 아키텍처

### 4계층 방어 전략

1. **방화벽 (UFW)**: 공용 인터넷에는 SSH(22)와 Tailscale(41641/udp) 포트만 노출함.
2. **VPN (Tailscale)**: Gateway 서비스는 오직 VPN 메시 망을 통해서만 접근 가능함.
3. **Docker 격리**: `DOCKER-USER` iptables 체인을 구성하여 컨테이너 포트의 외부 노출을 원천 차단함.
4. **Systemd 보안 강화**: `NoNewPrivileges`, `PrivateTmp` 적용 및 비특권 사용자 계정으로 서비스 실행.

### 보안 검증

서버의 외부 공격 표면을 다음과 같이 테스트할 수 있음:

```bash
nmap -p- <서버_IP_주소>
```

정상적인 경우 **22번 포트(SSH)만** 열려 있어야 하며, Gateway나 Docker 관련 서비스는 외부에서 보이지 않아야 함.

### Docker 활용 범위

Docker는 Gateway 프로세스 구동용이 아닌 **에이전트 샌드박스**(격리된 도구 실행 환경)를 위해 설치됨. Gateway는 로컬 호스트에만 바인딩되며 Tailscale VPN을 통해 안전하게 통신함.

샌드박스 세부 설정은 [멀티 에이전트 샌드박스 및 도구 가이드](/tools/multi-agent-sandbox-tools)를 참조함.

## 수동 설치 방법 (직접 제어 시)

자동화 스크립트 대신 직접 과정을 제어하고자 하는 경우:

```bash
# 1. 사전 필수 패키지 설치
sudo apt update && sudo apt install -y ansible git

# 2. 저장소 클론
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. Ansible 컬렉션 설치
ansible-galaxy collection install -r requirements.yml

# 4. 플레이북 실행
./run-playbook.sh

# 또는 직접 실행 (실행 후 /tmp/openclaw-setup.sh를 수동으로 실행해야 함)
# ansible-playbook playbook.yml --ask-become-pass
```

## 업데이트 안내

Ansible 설치 프로그램은 수동 업데이트가 가능한 구조로 OpenClaw를 구성함. 일반적인 업데이트 절차는 [버전 업데이트 가이드](/install/updating)를 참조함.

설정 변경 등을 위해 Ansible 플레이북을 다시 실행하려면:

```bash
cd openclaw-ansible
./run-playbook.sh
```

본 작업은 멱등성(Idempotent)을 보장하므로 여러 번 실행해도 안전함.

## 문제 해결 (Troubleshooting)

### 방화벽으로 인해 접속이 차단된 경우

* 먼저 Tailscale VPN을 통해 접근을 시도함.
* SSH 접속(22번 포트)은 항상 허용되도록 설정되어 있음.
* Gateway는 설계상 오직 **Tailscale을 통해서만** 접근 가능함.

### 서비스가 시작되지 않는 경우

* **로그 확인**: `sudo journalctl -u openclaw -n 100`
* **권한 확인**: `sudo ls -la /opt/openclaw`
* **수동 시작 테스트**:
  ```bash
  sudo -i -u openclaw
  cd ~/openclaw
  pnpm start
  ```

### Docker 샌드박스 관련 이슈

* **Docker 상태 확인**: `sudo systemctl status docker`
* **샌드박스 이미지 확인**: `sudo docker images | grep openclaw-sandbox`
* **이미지 부재 시 빌드**:
  ```bash
  cd /opt/openclaw/openclaw
  sudo -u openclaw ./scripts/sandbox-setup.sh
  ```

### 채널 로그인 실패

반드시 `openclaw` 시스템 사용자 계정에서 명령어를 실행해야 함:

```bash
sudo -i -u openclaw
openclaw channels login
```

## 심화 설정 정보

상세 보안 아키텍처 및 문제 해결 노하우는 아래 문서들을 참조함:

* [보안 아키텍처 상세](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
* [기술적 세부 사항](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
* [문제 해결 상세 가이드](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 관련 문서 목록

* [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): 전체 배포 가이드 저장소
* [Docker 설치](/install/docker): 컨테이너 기반 Gateway 설정
* [샌드박싱](/gateway/sandboxing): 에이전트 샌드박스 구성 방법
* [멀티 에이전트 샌드박스 및 도구](/tools/multi-agent-sandbox-tools): 에이전트별 격리 정책
