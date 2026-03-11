---
summary: "Gateway 서버 실행, 상태 조회 및 네트워크 탐색을 위한 `openclaw gateway` 명령어 레퍼런스"
read_when:
  - CLI를 통해 Gateway 서버를 직접 실행하거나 관리하고자 할 때
  - 인증 방식, 바인딩 모드 및 네트워크 연결 문제를 디버깅할 때
  - Bonjour를 통해 네트워크 내의 Gateway를 찾고자 할 때
title: "gateway"
x-i18n:
  source_path: "cli/gateway.md"
---

# Gateway CLI

Gateway는 OpenClaw의 핵심 WebSocket 서버임 (채널, 노드, 세션 및 훅 관리 담당). 이 페이지의 하위 명령어들은 모두 `openclaw gateway ...` 형식으로 사용됨.

**관련 문서:**

* Bonjour 설정 가이드: [/gateway/bonjour](/gateway/bonjour)
* Gateway 탐색 가이드: [/gateway/discovery](/gateway/discovery)
* 설정 상세 레퍼런스: [/gateway/configuration](/gateway/configuration)

## Gateway 서버 실행

로컬 Gateway 프로세스를 실행함:

```bash
openclaw gateway
```

포그라운드 실행 별칭:

```bash
openclaw gateway run
```

### 참고 사항

* **기본 동작**: `~/.openclaw/openclaw.json` 설정 파일에 `gateway.mode=local`이 지정되지 않으면 보안을 위해 서버 시작이 거부됨. 개발 또는 테스트 목적의 즉시 실행 시에는 `--allow-unconfigured` 플래그를 사용함.
* **보안 제한**: 루프백(Loopback) 이외의 인터페이스로 바인딩할 때 인증 설정이 없으면 실행이 차단됨.
* **프로세스 제어**: `SIGUSR1` 신호를 보내면 서버를 내부적으로 재시작할 수 있음 (설정에서 `commands.restart: true`인 경우). `SIGINT`/`SIGTERM`은 프로세스를 종료하나, TUI 등의 특수 터미널 상태를 자동으로 복구하지는 않음.

### 주요 옵션

* **`--port <port>`**: WebSocket 포트 지정 (기본값: `18789`).
* **`--bind <mode>`**: 리스너 바인딩 모드 (`loopback`, `lan`, `tailnet`, `auto`, `custom`).
* **`--auth <mode>`**: 인증 모드 강제 지정 (`token` 또는 `password`).
* **`--token <token>`**: 토큰 값 오버라이드 (프로세스 환경 변수 `OPENCLAW_GATEWAY_TOKEN`도 함께 설정됨).
* **`--password-file <path>`**: 파일로부터 서버 비밀번호를 읽어옴. (인라인 비밀번호 사용 시 프로세스 목록에 노출될 위험이 있으므로 권장함)
* **`--tailscale <mode>`**: Tailscale을 통해 Gateway 노출 여부 지정 (`off`, `serve`, `funnel`).
* **`--dev`**: 개발용 설정 및 워크스페이스가 없을 경우 자동 생성 (부트스트랩 단계 생략).
* **`--force`**: 시작 전 해당 포트를 사용 중인 기존 프로세스를 강제 종료함.
* **`--ws-log <style>`**: WebSocket 로그 스타일 설정 (`auto`, `full`, `compact`).
* **`--raw-stream`**: 모델의 원시 스트림 이벤트를 별도 JSONL 파일로 기록함.

## 실행 중인 Gateway 상태 조회

모든 조회 명령어는 WebSocket RPC를 통해 통신함.

**출력 모드:**

* **기본**: 가독성 중심 (터미널 환경에 따라 색상 적용).
* **`--json`**: 기계 판독 가능한 JSON 형식 (스타일링 및 진행 표시기 제외).
* **`--no-color`**: ANSI 색상 코드를 제외한 텍스트 레이아웃 출력.

**공통 옵션:**

* **`--url <url>`**: 대상 Gateway WebSocket 주소.
* **`--token <token>`** / **`--password <password>`**: 인증 정보.
* **`--timeout <ms>`**: 요청 타임아웃 시간.

<Note>
  `--url` 옵션을 지정할 경우, CLI는 기존 설정 파일의 자격 증명을 자동으로 참조하지 않음. 반드시 인증 관련 플래그를 함께 명시해야 함.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

시스템 서비스(launchd, systemd 등) 상태와 RPC 프로브 결과를 함께 표시함.

```bash
openclaw gateway status
openclaw gateway status --json
```

* **`--no-probe`**: RPC 통신 점검을 생략하고 서비스 설치 상태만 확인.
* **`--deep`**: 시스템 레벨의 서비스까지 확장하여 스캔.

### `gateway probe` (종합 진단)

설정된 원격 서버와 로컬 루프백 주소를 모두 점검하는 종합 디버깅 명령어임.

```bash
openclaw gateway probe
```

#### SSH 기반 원격 진단 (Mac 앱 호환)

로컬 포트 포워딩을 통해 루프백에만 바인딩된 원격 서버에 접속하는 기능을 지원함.

```bash
openclaw gateway probe --ssh user@gateway-host
```

### `gateway call <method>`

저수준 RPC 호출 도우미.

```bash
# 상태 정보 직접 호출
openclaw gateway call status

# 특정 파라미터와 함께 로그 스트리밍 호출
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## Gateway 서비스 관리

운영체제별 백그라운드 서비스를 관리함:

```bash
openclaw gateway install    # 서비스 등록
openclaw gateway start      # 서비스 시작
openclaw gateway stop       # 서비스 중단
openclaw gateway restart    # 서비스 재시작
openclaw gateway uninstall  # 서비스 제거
```

* **`install` 주요 옵션**: `--port`, `--runtime <node|bun>`, `--token`, `--force`.
* **시크릿 관리**: 시크릿 참조(SecretRef)를 사용하는 경우, 설치 시 참조 유효성만 확인하며 평문 비밀번호를 서비스 설정 파일에 직접 기록하지 않음.
* **인증 충돌**: 토큰과 비밀번호가 모두 설정되어 있으나 모드가 지정되지 않은 경우, 명확한 모드 설정 전까지 설치가 중단됨.

## Gateway 탐색 (Bonjour)

`gateway discover` 명령어를 통해 네트워크상의 Gateway 비컨(`_openclaw-gw._tcp`)을 스캔함.

* **Multicast DNS-SD**: `local.` 도메인 탐색.
* **Wide-Area Bonjour**: 커스텀 도메인(예: `openclaw.internal.`) 기반 탐색. 상세 설정은 [Bonjour 가이드](/gateway/bonjour) 참조.

비컨 광고 설정이 활성화된 Gateway만 검색 결과에 나타남.

### 사용 예시

```bash
# 네트워크상의 Gateway 검색
openclaw gateway discover

# JSON 출력을 통한 URL 정보 추출
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
