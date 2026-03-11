---
summary: "헤드리스 노드 호스트 실행 및 관리를 위한 `openclaw node` 명령어 레퍼런스"
read_when:
  - 헤드리스 노드 호스트를 구동하여 원격 기기의 자원을 공유하고자 할 때
  - `system.run` 기능을 위해 비 macOS 환경의 노드를 페어링할 때
title: "node"
x-i18n:
  source_path: "cli/node.md"
---

# `openclaw node`

Gateway WebSocket에 연결되어 해당 기기의 `system.run` (명령어 실행) 및 `system.which` (경로 확인) 기능을 노출하는 **헤드리스 노드 호스트(Headless Node Host)**를 실행함.

## 노드 호스트를 사용하는 이유

에이전트가 네트워크 내의 **다른 기기에서 명령을 실행**하도록 허용하고 싶으나, 해당 기기에 전체 macOS 컴패니언 앱을 설치할 수 없거나 설치를 원치 않는 경우에 사용함.

**주요 활용 사례:**
- 원격 Linux/Windows 서버(빌드 서버, 실험 장비, NAS 등)에서 명령 실행.
- Gateway 서버 자체의 실행 환경은 **샌드박스**로 보호하면서, 승인된 작업만 특정 호스트에 위임.
- 자동화 파이프라인이나 CI 노드를 위한 가벼운 명령 실행 타겟 제공.

실행 권한은 노드 호스트의 **명령어 실행 승인(Exec Approvals)** 정책 및 에이전트별 허용 목록(Allowlist)에 의해 엄격히 관리되므로 안전하게 운영 가능함.

## 브라우저 프록시 (Zero-config)

노드 호스트는 `browser.enabled` 설정이 비활성화되지 않은 경우, 자동으로 브라우저 프록시 기능을 광고함. 이를 통해 에이전트는 별도의 추가 설정 없이도 해당 노드의 브라우저를 자동화에 활용할 수 있음.

필요 시 노드에서 해당 기능을 비활성화할 수 있음:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 포그라운드 실행 (Run)

```bash
openclaw node run --host <gateway-host> --port 18789
```

**주요 옵션:**
- **`--host <host>`**: Gateway WebSocket 주소 (기본값: `127.0.0.1`).
- **`--port <port>`**: Gateway WebSocket 포트 (기본값: `18789`).
- **`--tls`**: 보안 연결(TLS) 사용 여부.
- **`--tls-fingerprint <sha256>`**: 신뢰할 수 있는 TLS 인증서 지문 지정.
- **`--node-id <id>`**: 노드 ID 수동 지정 (기존 페어링 토큰 초기화됨).
- **`--display-name <name>`**: Gateway UI에 표시될 노드 이름 설정.

## 노드 호스트용 인증 (Auth)

`openclaw node run` 및 `install` 명령어는 별도의 `--token` 플래그 없이 설정 파일이나 환경 변수로부터 Gateway 인증 정보를 자동으로 해석함:

1. **`OPENCLAW_GATEWAY_TOKEN`** / **`PASSWORD`** 환경 변수를 최우선으로 확인.
2. 로컬 설정 파일(`gateway.auth.token` / `password`)을 폴백으로 사용.
3. 로컬 모드에서 위 설정이 없을 경우 `gateway.remote.*` 설정을 참조함.
4. 레거시 환경 변수인 `CLAWDBOT_GATEWAY_*`는 무시됨.

## 백그라운드 서비스 (Service)

헤드리스 노드 호스트를 사용자 서비스로 설치하여 시스템 시작 시 자동 실행되도록 설정함.

```bash
openclaw node install --host <gateway-host> --port 18789
```

**서비스 관리 명령어:**
```bash
openclaw node status    # 설치 상태 및 가동 여부 확인
openclaw node stop      # 서비스 중지
openclaw node restart   # 서비스 재시작
openclaw node uninstall # 서비스 제거
```

- **`--runtime <node|bun>`**: 서비스 실행 환경 선택.
- **`--force`**: 이미 설치된 서비스가 있는 경우 덮어쓰기.
- 서비스 관련 명령어 실행 시 `--json` 옵션을 통해 기계 판독 가능한 결과를 얻을 수 있음.

## 페어링 (Pairing)

노드가 Gateway에 처음 접속하면 대기 중인 기기 페어링 요청(`role: node`)이 생성됨. 관리자는 다음 명령어를 통해 이를 승인해야 함:

```bash
# 대기 중인 요청 확인
openclaw devices list

# 요청 승인
openclaw devices approve <requestId>
```

노드 호스트는 할당받은 노드 ID, 토큰 및 접속 정보를 `~/.openclaw/node.json` 파일에 안전하게 보관함.

## 명령어 실행 승인 (Exec Approvals)

`system.run` 기능을 통한 명령어 실행은 로컬의 승인 정책에 의해 제어됨:

- 정책 파일 위치: `~/.openclaw/exec-approvals.json`
- 상세 내용: [Exec approvals 가이드](/tools/exec-approvals)
- 원격 편집: Gateway 서버에서 `openclaw approvals --node <ID|이름|IP>` 명령어를 사용하여 해당 노드의 정책을 직접 수정할 수 있음.
