---
summary: "Oracle Cloud Always Free ARM에서 OpenClaw 실행"
read_when:
  - Oracle Cloud에서 OpenClaw를 설정할 때
  - OpenClaw용 저비용 VPS 호스팅을 찾을 때
  - 소형 서버에서 OpenClaw를 24/7로 운영하고 싶을 때
title: "Oracle Cloud"
---

# Oracle Cloud(OCI)에서 OpenClaw 실행

## 목표

Oracle Cloud의 **Always Free** ARM 티어에서 지속 실행되는 OpenClaw Gateway를 운영합니다.

Oracle의 무료 티어는 OpenClaw에 잘 맞을 수 있습니다. 특히 이미 OCI 계정이 있다면 더 그렇습니다. 다만 다음과 같은 트레이드오프가 있습니다.

- ARM 아키텍처 사용(대부분은 동작하지만 일부 바이너리는 x86 전용일 수 있음)
- 용량과 가입 절차가 까다로울 수 있음

## 비용 비교 (2026)

| 제공자       | 플랜            | 사양                  | 월 가격 | 비고                    |
| ------------ | --------------- | --------------------- | ------- | ----------------------- |
| Oracle Cloud | Always Free ARM | 최대 4 OCPU, 24GB RAM | $0      | ARM, 용량 제한 있음     |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM       | 약 $4   | 가장 저렴한 유료 옵션   |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM       | $6      | UI가 쉬우며 문서가 좋음 |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM       | $6      | 리전이 많음             |
| Linode       | Nanode          | 1 vCPU, 1GB RAM       | $5      | 현재 Akamai 소속        |

---

## 준비 사항

- Oracle Cloud 계정([가입](https://www.oracle.com/cloud/free/))
  문제가 있으면 [커뮤니티 가입 가이드](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)를 참고
- Tailscale 계정([tailscale.com](https://tailscale.com)에서 무료 사용 가능)
- 약 30분

## 1) OCI 인스턴스 생성

1. [Oracle Cloud Console](https://cloud.oracle.com/)에 로그인합니다.
2. **Compute → Instances → Create Instance**로 이동합니다.
3. 다음과 같이 설정합니다.
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2(또는 최대 4)
   - **Memory:** 12 GB(또는 최대 24 GB)
   - **Boot volume:** 50 GB(무료 한도 내 최대 200 GB)
   - **SSH key:** 공개 키 추가
4. **Create**를 클릭합니다.
5. 공인 IP 주소를 기록합니다.

**팁:** "Out of capacity" 오류로 생성에 실패하면 다른 availability domain을 시도하거나 나중에 다시 시도하세요. 무료 티어 용량은 제한적입니다.

## 2) 접속 및 업데이트

```bash
# 공인 IP로 접속
ssh ubuntu@YOUR_PUBLIC_IP

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**참고:** 일부 의존성을 ARM에서 컴파일하려면 `build-essential`이 필요합니다.

## 3) 사용자 및 호스트명 설정

```bash
# 호스트명 설정
sudo hostnamectl set-hostname openclaw

# ubuntu 사용자 비밀번호 설정
sudo passwd ubuntu

# lingering 활성화(로그아웃 후에도 사용자 서비스 유지)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale 설치

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

이렇게 하면 Tailscale SSH가 활성화되므로 tailnet 안의 어느 기기에서든 `ssh openclaw`로 접속할 수 있습니다. 공인 IP는 더 이상 필요하지 않습니다.

확인:

```bash
tailscale status
```

**이제부터는 Tailscale로 접속:** `ssh ubuntu@openclaw` 또는 Tailscale IP를 사용하세요.

## 5) OpenClaw 설치

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

"How do you want to hatch your bot?" 프롬프트가 나오면 **"Do this later"** 를 선택합니다.

> 참고: ARM 네이티브 빌드 문제를 만나면 Homebrew를 쓰기 전에 먼저 `sudo apt install -y build-essential` 같은 시스템 패키지를 확인하세요.

## 6) Gateway 구성(loopback + 토큰 인증) 및 Tailscale Serve 활성화

기본값으로 토큰 인증을 사용하세요. 동작이 예측 가능하고 Control UI에서 "insecure auth" 플래그를 켤 필요가 없습니다.

```bash
# Gateway는 VM 내부에서만 노출
openclaw config set gateway.bind loopback

# Gateway + Control UI에 인증 요구
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Tailscale Serve로 노출(HTTPS + tailnet 접근)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway
```

## 7) 확인

```bash
# 버전 확인
openclaw --version

# 데몬 상태 확인
systemctl --user status openclaw-gateway

# Tailscale Serve 확인
tailscale serve status

# 로컬 응답 테스트
curl http://localhost:18789
```

## 8) VCN 보안 잠금

모든 것이 정상 동작하면 VCN을 잠가서 Tailscale 외의 트래픽을 차단합니다. OCI의 Virtual Cloud Network는 네트워크 경계에서 동작하는 방화벽 역할을 하므로, 트래픽은 인스턴스에 닿기 전에 차단됩니다.

1. OCI Console에서 **Networking → Virtual Cloud Networks** 로 이동합니다.
2. 사용 중인 VCN을 클릭한 뒤 **Security Lists** → 기본 Security List를 엽니다.
3. 다음을 제외한 모든 ingress 규칙을 **삭제** 합니다.
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. 기본 egress 규칙(모든 아웃바운드 허용)은 유지합니다.

이렇게 하면 포트 22의 SSH, HTTP, HTTPS, 그 외 모든 트래픽이 네트워크 경계에서 차단됩니다. 이후에는 Tailscale로만 접속할 수 있습니다.

---

## Control UI 접근

Tailscale 네트워크에 연결된 어느 기기에서든 다음 주소로 접근합니다.

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` 은 tailnet 이름으로 바꾸세요. `tailscale status`에서 확인할 수 있습니다.

SSH 터널은 필요하지 않습니다. Tailscale이 다음을 제공합니다.

- HTTPS 암호화(인증서 자동 발급)
- Tailscale 아이덴티티 기반 인증
- tailnet 안의 모든 기기에서 접근 가능(노트북, 휴대폰 등)

---

## 보안: VCN + Tailscale(권장 기본선)

VCN을 잠가서 UDP 41641만 열고 Gateway를 loopback에 바인딩하면 강한 심층 방어를 확보할 수 있습니다. 공용 트래픽은 네트워크 경계에서 차단되고, 관리 접근은 tailnet을 통해서만 이루어집니다.

이 구성이라면 인터넷 전체를 대상으로 한 SSH 무차별 대입을 막기 위해 별도의 호스트 기반 방화벽 규칙이 꼭 필요하지 않은 경우가 많습니다. 그래도 OS 업데이트는 유지하고, `openclaw security audit`를 실행하고, 공용 인터페이스에 실수로 바인딩되지 않았는지 확인해야 합니다.

### 이미 보호되는 항목

| 전통적 단계      | 필요 여부   | 이유                                                                       |
| ---------------- | ----------- | -------------------------------------------------------------------------- |
| UFW 방화벽       | 아니오      | VCN이 트래픽이 인스턴스에 닿기 전에 차단                                   |
| fail2ban         | 아니오      | VCN에서 포트 22를 막으면 브루트포스 자체가 없음                            |
| sshd 강화        | 아니오      | Tailscale SSH는 sshd를 사용하지 않음                                       |
| root 로그인 차단 | 아니오      | Tailscale은 시스템 사용자가 아니라 Tailscale 아이덴티티를 사용             |
| SSH 키 전용 인증 | 아니오      | 인증은 tailnet을 통해 이루어짐                                             |
| IPv6 강화        | 보통 불필요 | VCN/서브넷 설정에 따라 달라짐. 실제로 무엇이 할당되고 노출되는지 확인 필요 |

### 여전히 권장되는 항목

- **자격 증명 권한:** `chmod 700 ~/.openclaw`
- **보안 감사:** `openclaw security audit`
- **시스템 업데이트:** `sudo apt update && sudo apt upgrade`를 정기적으로 실행
- **Tailscale 모니터링:** [Tailscale 관리자 콘솔](https://login.tailscale.com/admin)에서 기기 검토

### 보안 상태 확인

```bash
# 공용 포트가 열려 있지 않은지 확인
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSH 활성 상태 확인
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 선택 사항: sshd 완전 비활성화
sudo systemctl disable --now ssh
```

---

## 대안: SSH 터널

Tailscale Serve가 동작하지 않으면 SSH 터널을 사용하세요.

```bash
# 로컬 머신에서(Tailscale 경유)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

그런 다음 `http://localhost:18789`를 엽니다.

---

## 문제 해결

### 인스턴스 생성 실패("Out of capacity")

무료 ARM 인스턴스는 수요가 많습니다. 다음을 시도하세요.

- 다른 availability domain
- 비혼잡 시간대(이른 아침)에 재시도
- shape 선택 시 "Always Free" 필터 사용

### Tailscale이 연결되지 않음

```bash
# 상태 확인
sudo tailscale status

# 재인증
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway가 시작되지 않음

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway -n 50
```

### Control UI에 접근할 수 없음

```bash
# Tailscale Serve 동작 확인
tailscale serve status

# gateway 리스닝 확인
curl http://localhost:18789

# 필요 시 재시작
systemctl --user restart openclaw-gateway
```

### ARM 바이너리 문제

일부 도구는 ARM 빌드를 제공하지 않을 수 있습니다. 다음을 확인하세요.

```bash
uname -m  # aarch64 가 나와야 함
```

대부분의 npm 패키지는 잘 동작합니다. 바이너리는 `linux-arm64` 또는 `aarch64` 릴리스를 찾으세요.

---

## 영속성

모든 상태는 다음 위치에 저장됩니다.

- `~/.openclaw/` — 설정, 자격 증명, 세션 데이터
- `~/.openclaw/workspace/` — 워크스페이스(SOUL.md, 메모리, 아티팩트)

정기적으로 백업하세요.

```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## 함께 보기

- [Gateway 원격 접근](/gateway/remote) — 다른 원격 접근 패턴
- [Tailscale 통합](/gateway/tailscale) — 전체 Tailscale 문서
- [Gateway 구성](/gateway/configuration) — 모든 구성 옵션
- [DigitalOcean 가이드](/platforms/digitalocean) — 유료이지만 가입이 더 쉬운 대안
- [Hetzner 가이드](/install/hetzner) — Docker 기반 대안
