---
summary: "Gateway 대시보드 및 WebSocket을 위한 통합 Tailscale Serve/Funnel 설정 가이드"
read_when:
  - Gateway 제어 UI를 localhost 외부로 안전하게 노출하고자 할 때
  - Tailnet 또는 공용 네트워크를 통한 대시보드 접근을 자동화하고 싶을 때
title: "Tailscale 연동"
x-i18n:
  source_path: "gateway/tailscale.md"
---

# Tailscale (Gateway 대시보드)

OpenClaw는 Gateway 대시보드 및 WebSocket 포트를 위해 Tailscale **Serve**(Tailnet 전용) 또는 **Funnel**(공용 인터넷) 기능을 자동으로 구성할 수 있음. 이를 통해 Gateway는 루프백(Loopback) 바인딩 상태를 유지하면서도 Tailscale이 제공하는 HTTPS 암호화, 도메인 라우팅 및 신원 확인 헤더(Serve 전용) 기능을 활용할 수 있음.

## 실행 모드 (Modes)

* **`serve`**: `tailscale serve`를 통해 Tailnet 내 기기들에만 노출함. Gateway 프로세스는 `127.0.0.1`에서 대기하며 안전하게 유지됨.
* **`funnel`**: `tailscale funnel`을 통해 공용 인터넷에 HTTPS로 노출함. 보안을 위해 OpenClaw는 반드시 공유 비밀번호 인증을 요구함.
* **`off`**: 기본값이며 Tailscale 자동화 기능을 사용하지 않음.

## 인증 정책 (Authentication)

연결 시의 핸드셰이크 방식을 `gateway.auth.mode` 설정을 통해 제어함:

* **`token`**: 공유 토큰 방식 (기본값, `OPENCLAW_GATEWAY_TOKEN` 환경 변수 참조 가능).
* **`password`**: 비밀번호 방식 (`OPENCLAW_GATEWAY_PASSWORD` 환경 변수 또는 설정 파일 참조).

**Tailscale 신원 인증 (Serve 전용):**
`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale: true`인 경우, 제어 UI 및 WebSocket 인증 시 별도의 토큰/비밀번호 없이 **Tailscale 신원 헤더**(`tailscale-user-login`)를 사용할 수 있음.

* **검증 절차**: OpenClaw는 해당 헤더를 수락하기 전, 로컬 Tailscale 데몬(`tailscale whois`)을 통해 `x-forwarded-for` 주소를 조회하여 헤더 정보와 일치하는지 엄격히 검증함.
* **작동 조건**: 요청이 루프백에서 유입되고 Tailscale이 주입한 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` 헤더가 모두 포함된 경우에만 활성화됨.
* **예외**: HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는 보안을 위해 여전히 명시적인 토큰/비밀번호 인증을 요구함.
* **신뢰 전제**: 이 방식은 Gateway 호스트 자체를 신뢰한다는 가정하에 작동함. 만약 호스트 내에서 신뢰할 수 없는 로컬 코드가 실행될 가능성이 있다면 이 기능을 끄고 명시적 인증을 사용하기 바람.

## 설정 예시

### Tailnet 전용 노출 (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

접속 주소: `https://<magicdns>/` (또는 설정한 `gateway.controlUi.basePath`)

### 직접 Tailnet IP 바인딩 (Serve 미사용)

Serve/Funnel 프록시 없이 Gateway가 Tailnet IP에서 직접 대기하도록 설정함.

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "사용자-토큰" },
  },
}
```

다른 Tailnet 기기에서의 접속:

* 제어 UI: `http://<tailscale-ip>:18789/`
* WebSocket: `ws://<tailscale-ip>:18789`
  *주의: 이 모드에서는 루프백(`http://127.0.0.1:18789`) 접속이 불가능함.*

### 공용 인터넷 노출 (Funnel + 비밀번호)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "강력한-비밀번호" },
  },
}
```

*팁: 설정 파일에 비밀번호를 직접 기록하기보다는 `OPENCLAW_GATEWAY_PASSWORD` 환경 변수 사용을 권장함.*

## CLI 명령어 예시

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 운영 참고 사항

* **사전 준비**: Tailscale CLI가 설치되어 있어야 하며 로그인된 상태여야 함.
* **보안 강제**: `mode: "funnel"` 설정 시, 무단 노출 방지를 위해 인증 모드가 `password`가 아닌 경우 서버 시작이 거부됨.
* **설정 초기화**: Gateway 종료 시 OpenClaw가 자동으로 `tailscale serve/funnel` 구성을 해제하도록 하려면 `gateway.tailscale.resetOnExit: true`를 설정함.
* **바인딩 우선순위**: `gateway.bind: "auto"`는 루프백을 우선함. Tailnet 전용 환경을 원한다면 명시적으로 `tailnet`으로 지정해야 함.
* **노드 접속**: Serve/Funnel은 제어 UI와 WebSocket을 모두 노출하므로, 원격 노드 기기 역시 동일한 엔드포인트를 통해 Gateway에 접속할 수 있음.

## 브라우저 원격 제어 (Gateway ↔ 로컬 브라우저)

Gateway는 원격 서버에 있고 브라우저는 사용자 로컬 기기에서 제어하고 싶은 경우, 로컬 기기에서 **노드 호스트**를 실행하고 두 기기를 동일한 Tailnet에 연결함. Gateway가 브라우저 명령을 해당 노드로 프록시하므로 별도의 포트 개방이나 Serve 설정이 필요하지 않음.

**보안 권고**: 브라우저 제어 인터페이스에는 Funnel을 사용하지 말 것. 노드 페어링은 시스템 운영자 권한에 준하는 신중한 승인이 필요함.

## Tailscale 요구 사항 및 제약

* **HTTPS**: Serve 기능을 사용하려면 Tailnet 설정에서 HTTPS가 활성화되어 있어야 함.
* **헤더 주입**: Serve는 신원 헤더를 주입하지만, Funnel은 주입하지 않음.
* **버전**: Funnel 사용을 위해 Tailscale v1.38.3 이상 버전과 MagicDNS 활성화가 필요함.
* **포트**: Funnel은 TLS를 통해 `443`, `8443`, `10000` 포트만 지원함.
* **macOS**: Funnel 기능을 사용하려면 공식 오픈소스 버전의 Tailscale 앱이 필요함.

## 관련 외부 문서

* Tailscale Serve 개요: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
* `tailscale serve` 명령어: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
* Tailscale Funnel 개요: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
* `tailscale funnel` 명령어: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
