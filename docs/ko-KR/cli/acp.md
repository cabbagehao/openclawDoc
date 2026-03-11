---
summary: "IDE 통합을 위해 ACP 브리지를 실행합니다"
read_when:
  - ACP 기반 IDE 통합 설정 중
  - Gateway로의 ACP 세션 라우팅 디버깅 중
title: "acp"
---

# acp

OpenClaw Gateway와 통신하는 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 브리지를 실행합니다.

이 명령은 IDE를 위해 stdio를 통해 ACP를 사용하고, WebSocket을 통해 프롬프트를 Gateway로 전달합니다.
ACP 세션은 Gateway 세션 키에 매핑된 상태로 유지됩니다.

`openclaw acp`는 Gateway 기반 ACP 브리지이며, 완전한 ACP 네이티브 에디터
런타임은 아닙니다. 세션 라우팅, 프롬프트 전달, 기본적인 스트리밍
업데이트에 중점을 둡니다.

## Compatibility Matrix

| ACP area                                                              | Status      | Notes                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implemented | stdio를 통한 핵심 브리지 흐름으로, Gateway chat/send + abort 위에서 동작합니다.                                                                                                                                               |
| `listSessions`, slash commands                                        | Implemented | 세션 목록은 Gateway 세션 상태를 기준으로 동작하며, 명령은 `available_commands_update`를 통해 광고됩니다.                                                                                                                      |
| `loadSession`                                                         | Partial     | ACP 세션을 Gateway 세션 키에 다시 바인딩하고 저장된 사용자/assistant 텍스트 히스토리를 재생합니다. tool/system 히스토리는 아직 재구성되지 않습니다.                                                                           |
| Prompt content (`text`, embedded `resource`, images)                  | Partial     | 텍스트/리소스는 chat 입력으로 평탄화되고, 이미지는 Gateway attachment가 됩니다.                                                                                                                                               |
| Session modes                                                         | Partial     | `session/set_mode`가 지원되며, 브리지는 thought level, tool verbosity, reasoning, usage detail, elevated actions에 대한 초기 Gateway 기반 세션 제어를 노출합니다. 더 넓은 ACP 네이티브 mode/config 표면은 아직 범위 밖입니다. |
| Session info and usage updates                                        | Partial     | 브리지는 캐시된 Gateway 세션 스냅샷을 바탕으로 `session_info_update`와 best-effort `usage_update` 알림을 내보냅니다. usage는 근사치이며, Gateway가 토큰 합계를 fresh로 표시할 때만 전송됩니다.                                |
| Tool streaming                                                        | Partial     | `tool_call` / `tool_call_update` 이벤트에는 Gateway tool args/results가 노출하는 raw I/O, 텍스트 콘텐츠, best-effort 파일 위치가 포함됩니다. 임베디드 터미널과 더 풍부한 diff-native 출력은 아직 노출되지 않습니다.           |
| Per-session MCP servers (`mcpServers`)                                | Unsupported | 브리지 모드는 세션별 MCP 서버 요청을 거부합니다. 대신 OpenClaw gateway 또는 agent에 MCP를 구성하세요.                                                                                                                         |
| Client filesystem methods (`fs/read_text_file`, `fs/write_text_file`) | Unsupported | 브리지는 ACP 클라이언트의 파일 시스템 메서드를 호출하지 않습니다.                                                                                                                                                             |
| Client terminal methods (`terminal/*`)                                | Unsupported | 브리지는 ACP 클라이언트 터미널을 만들지 않으며, tool call을 통해 터미널 id를 스트리밍하지도 않습니다.                                                                                                                         |
| Session plans / thought streaming                                     | Unsupported | 브리지는 현재 출력 텍스트와 tool 상태만 내보내며, ACP plan 또는 thought 업데이트는 내보내지 않습니다.                                                                                                                         |

## Known Limitations

- `loadSession`은 저장된 사용자 및 assistant 텍스트 히스토리를 재생하지만,
  과거 tool call, system notice, 또는 더 풍부한 ACP 네이티브 이벤트
  타입은 재구성하지 않습니다.
- 여러 ACP 클라이언트가 같은 Gateway 세션 키를 공유하면, 이벤트 및 cancel
  라우팅은 클라이언트별로 엄격히 격리되기보다 best-effort 방식으로 처리됩니다. 에디터 로컬
  turn이 깔끔해야 한다면 기본 격리형 `acp:<uuid>` 세션을 사용하세요.
- Gateway stop 상태는 ACP stop reason으로 변환되지만, 이 매핑은
  완전한 ACP 네이티브 런타임보다 표현력이 떨어집니다.
- 초기 세션 제어는 현재 Gateway knob 중 일부만 노출합니다:
  thought level, tool verbosity, reasoning, usage detail, elevated
  actions. model 선택과 exec-host 제어는 아직 ACP
  config 옵션으로 노출되지 않습니다.
- `session_info_update`와 `usage_update`는 Gateway 세션
  스냅샷에서 파생되며, 라이브 ACP 네이티브 런타임 accounting이 아닙니다. usage는 근사치이고,
  비용 데이터는 포함하지 않으며, Gateway가 총 토큰
  데이터를 fresh로 표시할 때만 전송됩니다.
- tool follow-along 데이터는 best-effort입니다. 브리지는 알려진 tool args/results에
  나타나는 파일 경로를 표시할 수 있지만, ACP 터미널이나
  구조화된 파일 diff는 아직 내보내지 않습니다.

## Usage

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP client (debug)

IDE 없이 브리지를 정상 동작 점검하려면 내장 ACP 클라이언트를 사용하세요.
ACP 브리지를 실행한 뒤, 프롬프트를 대화형으로 입력할 수 있습니다.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

권한 모델(client debug mode):

- 자동 승인은 allowlist 기반이며, 신뢰된 핵심 tool ID에만 적용됩니다.
- `read` 자동 승인은 현재 작업 디렉터리(`--cwd`가 설정된 경우)에 한정됩니다.
- 알 수 없는/비핵심 tool 이름, 범위 밖 읽기, 위험한 tool은 항상 명시적 프롬프트 승인이 필요합니다.
- 서버가 제공한 `toolCall.kind`는 신뢰되지 않는 메타데이터로 취급됩니다(권한 부여 근거가 아님).

## How to use this

IDE(또는 다른 클라이언트)가 Agent Client Protocol을 사용하고, 이를 통해
OpenClaw Gateway 세션을 구동하려는 경우 ACP를 사용합니다.

1. Gateway가 실행 중인지 확인합니다(로컬 또는 원격).
2. Gateway 대상(config 또는 flags)을 구성합니다.
3. IDE가 stdio를 통해 `openclaw acp`를 실행하도록 지정합니다.

예시 config(영구 저장):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

예시 직접 실행(config 쓰지 않음):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selecting agents

ACP는 agent를 직접 선택하지 않습니다. Gateway 세션 키를 기준으로 라우팅합니다.

특정 agent를 대상으로 하려면 agent 범위의 세션 키를 사용하세요:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

각 ACP 세션은 하나의 Gateway 세션 키에 매핑됩니다. 하나의 agent는 여러
세션을 가질 수 있으며, 키나 label을 override하지 않으면 ACP는 기본적으로
격리된 `acp:<uuid>` 세션을 사용합니다.

브리지 모드에서는 세션별 `mcpServers`를 지원하지 않습니다. ACP 클라이언트가
`newSession` 또는 `loadSession` 중 이를 보내면, 브리지는 이를 조용히 무시하지 않고
명확한 오류를 반환합니다.

## Use from `acpx` (Codex, Claude, other ACP clients)

Codex나 Claude Code 같은 코딩 agent가 ACP를 통해 OpenClaw bot과
통신하게 하려면, 내장 `openclaw` target이 있는 `acpx`를 사용하세요.

일반적인 흐름:

1. Gateway를 실행하고 ACP 브리지가 해당 Gateway에 도달할 수 있는지 확인합니다.
2. `acpx openclaw`가 `openclaw acp`를 가리키도록 설정합니다.
3. 코딩 agent가 사용할 OpenClaw 세션 키를 지정합니다.

예시:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw`가 항상 특정 Gateway와 세션 키를 대상으로 하게 하려면
`~/.acpx/config.json`에서 `openclaw` agent command를 override하세요:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

repo 로컬 OpenClaw 체크아웃을 쓴다면, ACP 스트림이 깨끗하게 유지되도록
dev runner 대신 직접 CLI entrypoint를 사용하세요. 예:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

이 방식은 Codex, Claude Code, 또는 다른 ACP 인지 클라이언트가 터미널을 스크래핑하지 않고도
OpenClaw agent에서 문맥 정보를 가져오게 하는 가장 쉬운 방법입니다.

## Zed editor setup

`~/.config/zed/settings.json`에 사용자 지정 ACP agent를 추가하세요
(또는 Zed의 Settings UI 사용):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

특정 Gateway 또는 agent를 대상으로 하려면:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed에서는 Agent 패널을 열고 “OpenClaw ACP”를 선택해 스레드를 시작하세요.

## Session mapping

기본적으로 ACP 세션은 `acp:` prefix가 붙은 격리된 Gateway 세션 키를 받습니다.
알려진 세션을 재사용하려면 세션 키 또는 label을 전달하세요:

- `--session <key>`: 특정 Gateway 세션 키를 사용합니다.
- `--session-label <label>`: 기존 세션을 label로 resolve합니다.
- `--reset-session`: 첫 사용 전에 해당 키에 대해 새 세션 id를 발급합니다(같은 키, 새 transcript).

ACP 클라이언트가 metadata를 지원한다면, 세션별로 override할 수 있습니다:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

세션 키에 대한 자세한 내용은 [/concepts/session](/concepts/session)에서 확인하세요.

## Options

- `--url <url>`: Gateway WebSocket URL(구성되어 있으면 기본값은 `gateway.remote.url`).
- `--token <token>`: Gateway 인증 토큰.
- `--token-file <path>`: 파일에서 Gateway 인증 토큰을 읽습니다.
- `--password <password>`: Gateway 인증 비밀번호.
- `--password-file <path>`: 파일에서 Gateway 인증 비밀번호를 읽습니다.
- `--session <key>`: 기본 세션 키.
- `--session-label <label>`: resolve할 기본 세션 label.
- `--require-existing`: 세션 키/label이 존재하지 않으면 실패합니다.
- `--reset-session`: 처음 사용하기 전에 세션 키를 재설정합니다.
- `--no-prefix-cwd`: 프롬프트 앞에 작업 디렉터리를 prefix로 붙이지 않습니다.
- `--verbose, -v`: stderr로 상세 로그를 출력합니다.

보안 참고:

- 일부 시스템에서는 `--token`과 `--password`가 로컬 프로세스 목록에 노출될 수 있습니다.
- `--token-file`/`--password-file` 또는 환경 변수(`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) 사용을 권장합니다.
- Gateway 인증 해석은 다른 Gateway 클라이언트와 공유하는 계약을 따릅니다:
  - local mode: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` fallback, 단 `gateway.auth.*`가 unset인 경우
  - remote mode: 원격 우선순위 규칙에 따라 env/config fallback이 있는 `gateway.remote.*`
  - `--url`은 override-safe이며 암시적 config/env 자격 증명을 재사용하지 않습니다. 명시적인 `--token`/`--password`(또는 파일 변형)를 전달하세요.
- ACP 런타임 백엔드 자식 프로세스는 `OPENCLAW_SHELL=acp`를 받으며, 문맥별 shell/profile 규칙에 활용할 수 있습니다.
- `openclaw acp client`는 생성한 브리지 프로세스에 `OPENCLAW_SHELL=acp-client`를 설정합니다.

### `acp client` options

- `--cwd <dir>`: ACP 세션의 작업 디렉터리.
- `--server <command>`: ACP 서버 명령(기본값: `openclaw`).
- `--server-args <args...>`: ACP 서버에 전달할 추가 인자.
- `--server-verbose`: ACP 서버에서 상세 로그를 활성화합니다.
- `--verbose, -v`: 상세 클라이언트 로그.
