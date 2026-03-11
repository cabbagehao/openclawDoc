---
summary: "IDE 연동을 위한 OpenClaw ACP 브리지 실행 가이드"
read_when:
  - ACP 기반의 IDE 통합 환경을 구축할 때
  - ACP 세션의 Gateway 라우팅 문제를 디버깅할 때
title: "acp"
x-i18n:
  source_path: "cli/acp.md"
---

# `acp`

OpenClaw Gateway와 통신하는 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 브리지를 실행함.

이 명령어는 IDE를 위해 표준 입출력(stdio)을 통해 ACP 프로토콜로 대화하고, 수신된 프롬프트를 WebSocket을 통해 Gateway로 전달함. ACP 세션은 Gateway의 세션 키와 일대일로 매핑되어 유지됨.

`openclaw acp`는 Gateway 기반의 **브리지** 역할에 충실하며, 자체적인 편집기 런타임을 포함하지 않음. 세션 라우팅, 프롬프트 전달, 그리고 기본적인 스트리밍 업데이트 기능에 집중함.

## 호환성 매트릭스 (Compatibility Matrix)

| 구분 | 상태 | 비고 |
| :--- | :--- | :--- |
| `initialize`, `newSession`, `prompt`, `cancel` | **구현됨** | stdio 기반의 핵심 브리지 흐름. Gateway의 chat/send 및 중단(Abort) 기능과 연동됨. |
| `listSessions`, 슬래시 명령어 | **구현됨** | Gateway 세션 상태를 기반으로 목록 제공. `available_commands_update`를 통해 명령어 광고. |
| `loadSession` | **부분 지원** | ACP 세션을 특정 Gateway 세션 키에 다시 바인딩하고 텍스트 이력을 재생함. 도구/시스템 이력은 아직 복구되지 않음. |
| 프롬프트 콘텐츠 (텍스트, 리소스, 이미지) | **부분 지원** | 텍스트와 리소스는 채팅 입력으로 평탄화되며, 이미지는 Gateway 첨부 파일로 처리됨. |
| 세션 모드 (Session modes) | **부분 지원** | `session/set_mode`를 통해 사고 수준, 도구 상세도, 추론 가시성, 사용량 정보, 권한 상승 등 제어 가능. |
| 세션 정보 및 사용량 업데이트 | **부분 지원** | 캐시된 세션 스냅샷을 기반으로 알림 전송. 사용량 정보는 근사치이며 토큰 정보 갱신 시에만 전송됨. |
| 도구 스트리밍 | **부분 지원** | 도구 호출 시 I/O, 텍스트 내용, 파일 위치 정보를 포함함. 임베디드 터미널이나 정교한 Diff 출력은 미지원. |
| 세션별 MCP 서버 (`mcpServers`) | **미지원** | 세션 단위의 MCP 요청은 거부됨. MCP 설정은 Gateway 또는 에이전트 레벨에서 구성해야 함. |
| 클라이언트 파일 시스템 메서드 | **미지원** | 브리지가 클라이언트의 `fs/*` 메서드를 직접 호출하지 않음. |
| 클라이언트 터미널 메서드 | **미지원** | ACP 클라이언트 터미널 생성이나 도구 호출을 통한 터미널 ID 스트리밍을 지원하지 않음. |
| 세션 계획 및 사고 과정 스트리밍 | **미지원** | 현재 출력 텍스트와 도구 상태만 전송하며, ACP 전용 계획(Plan)이나 사고 업데이트는 내보내지 않음. |

## 알려진 제한 사항

- `loadSession` 실행 시 사용자 및 어시스턴트의 텍스트 이력은 복구되나, 과거의 도구 호출 기록이나 시스템 알림 등은 재구성되지 않음.
- 여러 ACP 클라이언트가 동일한 Gateway 세션 키를 공유할 경우, 이벤트 라우팅 및 중단 처리가 클라이언트별로 엄격히 분리되지 않을 수 있음. 깨끗한 편집기 환경을 원한다면 기본값인 격리된 `acp:<uuid>` 세션 사용을 권장함.
- Gateway의 중단 상태는 ACP 정지 사유(Stop reason)로 변환되지만, 네이티브 런타임에 비해 표현력이 제한적일 수 있음.
- 현재 지원되는 세션 제어 항목은 사고 수준, 도구 상세도, 추론 가시성, 사용량 정보 등으로 제한적임. 모델 선택이나 실행 호스트 제어 기능은 아직 노출되지 않음.

## 사용법

```bash
# 기본 실행
openclaw acp

# 원격 Gateway 연결
openclaw acp --url wss://gateway-host:18789 --token <token>

# 파일로부터 토큰 읽기 (권장)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 기존 특정 세션 키에 연결
openclaw acp --session agent:main:main

# 라벨을 사용해 기존 세션 연결
openclaw acp --session-label "업무용 보관함"

# 첫 프롬프트 전 세션 키 초기화
openclaw acp --session agent:main:main --reset-session
```

## ACP 클라이언트 (디버깅용)

IDE 없이 브리지의 동작을 수동으로 점검하고 싶을 때 사용함. 대화형 셸을 통해 직접 프롬프트를 입력할 수 있음.

```bash
openclaw acp client

# 원격 서버를 대상으로 브리지 실행 및 테스트
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

**권한 모델 (디버그 모드):**
- 신뢰할 수 있는 핵심 도구(Core tools)에 대해서만 자동 승인이 적용됨.
- `read` 도구의 자동 승인 범위는 현재 작업 디렉터리(`--cwd`) 내로 한정됨.
- 위험한 도구나 범위를 벗어난 읽기 작업은 항상 사용자에게 명시적인 승인 프롬프트를 표시함.

## 설정 가이드

IDE(또는 ACP를 지원하는 다른 클라이언트)에서 OpenClaw 에이전트를 제어하고자 할 때 사용함.

1. Gateway가 정상 실행 중인지 확인함 (로컬 또는 원격).
2. 접속 정보를 구성함 (설정 파일 또는 플래그).
3. IDE 설정에서 `openclaw acp` 명령어를 표준 입출력 브리지로 지정함.

**설정 저장 예시:**
```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

## 에이전트 선택 방법

ACP는 에이전트를 직접 선택하는 대신 **Gateway 세션 키**를 기반으로 라우팅함. 특정 에이전트를 대상으로 하려면 해당 에이전트 범위의 세션 키를 지정함:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
```

## 타 클라이언트 연동 (acpx)

Claude Code나 Codex와 같은 코딩 에이전트가 OpenClaw와 통신하게 하려면 `acpx` 도구의 `openclaw` 타겟을 활용함.

**연동 흐름:**
1. Gateway 실행 및 브리지 접속 가능 여부 확인.
2. `acpx openclaw`가 `openclaw acp`를 바라보도록 설정.
3. 대상 OpenClaw 세션 키 지정.

**사용 예시:**
```bash
# 일회성 상태 요약 요청
acpx openclaw exec "현재 세션 상태 요약해줘."

# 명명된 세션을 통한 지속적인 대화
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo "이 프로젝트 맥락에서 질문할게."
```

## Zed 에디터 설정

`~/.config/zed/settings.json` 파일에 커스텀 에이전트로 등록함:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"]
    }
  }
}
```

## 세션 매핑 (Mapping)

- 기본적으로 `acp:` 접두사가 붙은 독립된 세션 키가 할당됨.
- **`--session <key>`**: 명시적인 세션 키 지정.
- **`--session-label <label>`**: 라벨을 통한 기존 세션 조회.
- **`--reset-session`**: 동일 키를 유지하되 대화 이력을 새로 시작하여 새 세션 ID를 발급받음.

상세 내용은 [세션 관리 가이드](/concepts/session) 참조.

## 주요 옵션 레퍼런스

- `--url <url>`: Gateway WebSocket 주소.
- `--token <token>` / `--token-file <path>`: Gateway 인증 토큰 정보.
- `--password <password>` / `--password-file <path>`: Gateway 인증 비밀번호 정보.
- `--session <key>`: 기본으로 사용할 세션 키.
- `--require-existing`: 세션이 존재하지 않을 경우 실행 실패 처리.
- `--reset-session`: 시작 전 세션 초기화 수행.
- `--verbose, -v`: 상세 로그 출력.

<Warning>
**보안 주의**: `--token` 및 `--password` 플래그는 시스템의 프로세스 목록에서 평문으로 노출될 수 있음. 가급적 파일(`-file`) 옵션이나 환경 변수(`OPENCLAW_GATEWAY_TOKEN` 등) 사용을 권장함.
</Warning>
