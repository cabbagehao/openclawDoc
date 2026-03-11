---
summary: "Ansible, Tailscale VPN, firewall isolation을 이용한 자동화된 hardened OpenClaw 설치"
read_when:
  - 보안 강화를 포함한 자동 서버 배포가 필요할 때
  - VPN 접근과 firewall isolation이 있는 구성이 필요할 때
  - 원격 Debian/Ubuntu 서버에 배포할 때
title: "Ansible"
---

# Ansible Installation

운영 서버에 OpenClaw를 배포하는 권장 방법은 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** 입니다. 보안 우선 구조를 갖춘 자동 설치 도구입니다.

## Quick Start

원커맨드 설치:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **📦 전체 가이드: [github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**
>
> Ansible 배포의 source of truth는 openclaw-ansible 저장소입니다. 이 페이지는 빠른 개요입니다.

## What You Get

- 🔒 **Firewall-first security**: UFW + Docker 격리(외부에서 접근 가능한 것은 SSH + Tailscale뿐)
- 🔐 **Tailscale VPN**: 서비스를 공개 노출하지 않고 안전한 원격 접근 제공
- 🐳 **Docker**: 격리된 sandbox container, localhost-only bind
- 🛡️ **Defense in depth**: 4계층 보안 구조
- 🚀 **One-command setup**: 몇 분 안에 전체 배포 완료
- 🔧 **Systemd integration**: security hardening과 함께 부팅 시 자동 시작

## Requirements

- **OS**: Debian 11+ 또는 Ubuntu 20.04+
- **Access**: root 또는 sudo 권한
- **Network**: 패키지 설치를 위한 인터넷 연결
- **Ansible**: 2.14+ (quick-start script가 자동 설치)

## What Gets Installed

Ansible playbook은 다음을 설치하고 설정합니다.

1. **Tailscale** (안전한 원격 접근을 위한 mesh VPN)
2. **UFW firewall** (SSH + Tailscale 포트만 허용)
3. **Docker CE + Compose V2** (agent sandbox 용도)
4. **Node.js 22.x + pnpm** (런타임 의존성)
5. **OpenClaw** (container가 아니라 host 기반 설치)
6. **Systemd service** (보안 hardening과 함께 자동 시작)

참고: gateway는 **Docker 안이 아니라 호스트에서 직접** 실행됩니다. 대신 agent sandbox는 격리를 위해 Docker를 사용합니다. 자세한 내용은 [Sandboxing](/gateway/sandboxing)을 참고하세요.

## Post-Install Setup

설치가 끝나면 openclaw 사용자로 전환합니다.

```bash
sudo -i -u openclaw
```

post-install script가 다음 과정을 안내합니다.

1. **Onboarding wizard**: OpenClaw 설정
2. **Provider login**: WhatsApp/Telegram/Discord/Signal 연결
3. **Gateway testing**: 설치 검증
4. **Tailscale setup**: VPN mesh 연결

### Quick commands

```bash
# 서비스 상태 확인
sudo systemctl status openclaw

# 실시간 로그 보기
sudo journalctl -u openclaw -f

# gateway 재시작
sudo systemctl restart openclaw

# provider 로그인 (openclaw 사용자로 실행)
sudo -i -u openclaw
openclaw channels login
```

## Security Architecture

### 4-Layer Defense

1. **Firewall (UFW)**: 외부 공개는 SSH(22) + Tailscale(41641/udp)만
2. **VPN (Tailscale)**: gateway는 VPN mesh를 통해서만 접근 가능
3. **Docker Isolation**: DOCKER-USER iptables chain으로 외부 포트 노출 차단
4. **Systemd Hardening**: NoNewPrivileges, PrivateTmp, 비특권 사용자 실행

### Verification

외부 공격 표면 테스트:

```bash
nmap -p- YOUR_SERVER_IP
```

열려 있는 포트는 **22(SSH)만** 보여야 합니다. 나머지 서비스(gateway, Docker)는 모두 잠겨 있어야 합니다.

### Docker Availability

Docker는 gateway 자체를 돌리기 위한 것이 아니라 **agent sandbox**(격리된 tool 실행)를 위해 설치됩니다. gateway는 localhost에만 bind되며 Tailscale VPN을 통해 접근합니다.

sandbox 설정은 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)를 참고하세요.

## Manual Installation

자동화 대신 수동 제어를 원한다면:

```bash
# 1. 사전 요구 패키지 설치
sudo apt update && sudo apt install -y ansible git

# 2. 저장소 clone
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. Ansible collection 설치
ansible-galaxy collection install -r requirements.yml

# 4. playbook 실행
./run-playbook.sh

# 또는 직접 실행 (그 뒤 /tmp/openclaw-setup.sh를 수동 실행)
# ansible-playbook playbook.yml --ask-become-pass
```

## Updating OpenClaw

Ansible installer는 OpenClaw를 수동 업데이트 가능한 형태로 설정합니다. 일반적인 업데이트 절차는 [Updating](/install/updating)를 참고하세요.

Ansible playbook을 다시 실행하려면(예: 설정 변경):

```bash
cd openclaw-ansible
./run-playbook.sh
```

참고: 이 작업은 idempotent하며 여러 번 실행해도 안전합니다.

## Troubleshooting

### Firewall blocks my connection

접속이 막혔다면:

- 먼저 Tailscale VPN으로 접근 가능한지 확인하세요.
- SSH 접근(포트 22)은 항상 허용됩니다.
- gateway는 설계상 **Tailscale을 통해서만** 접근할 수 있습니다.

### Service won't start

```bash
# 로그 확인
sudo journalctl -u openclaw -n 100

# 권한 확인
sudo ls -la /opt/openclaw

# 수동 시작 테스트
sudo -i -u openclaw
cd ~/openclaw
pnpm start
```

### Docker sandbox issues

```bash
# Docker 실행 확인
sudo systemctl status docker

# sandbox image 확인
sudo docker images | grep openclaw-sandbox

# sandbox image가 없으면 빌드
cd /opt/openclaw/openclaw
sudo -u openclaw ./scripts/sandbox-setup.sh
```

### Provider login fails

반드시 `openclaw` 사용자로 실행하세요.

```bash
sudo -i -u openclaw
openclaw channels login
```

## Advanced Configuration

보안 아키텍처와 troubleshooting의 자세한 설명:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Related

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) - 전체 배포 가이드
- [Docker](/install/docker) - containerized gateway 설정
- [Sandboxing](/gateway/sandboxing) - agent sandbox 설정
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) - agent별 격리
