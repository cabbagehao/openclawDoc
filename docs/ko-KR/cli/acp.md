---
summary: "Run the ACP bridge for IDE integrations"
description: "OpenClaw Gateway와 연결되는 ACP bridge를 실행하는 방법, session mapping, `acpx`·Zed 연동, 보안 옵션과 flag 사용법을 정리합니다."
read_when:
  - ACP 기반 IDE integration을 설정할 때
  - ACP session routing을 Gateway로 디버깅할 때
title: "acp"
x-i18n:
  source_path: "cli/acp.md"
---

# acp

OpenClaw Gateway와 통신하는 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) bridge를 실행합니다.

이 명령은 IDE를 위해 stdio 위에서 ACP를 말하고, prompt는 WebSocket을 통해 Gateway로 전달합니다. ACP session은 Gateway session key와 매핑된 상태로 유지됩니다.

`openclaw acp`는 full ACP-native editor runtime이 아니라, Gateway-backed ACP bridge입니다. 핵심은 session routing, prompt delivery, 기본적인 streaming update에 있습니다.

## Compatibility Matrix

| ACP area                                                              | Status      | Notes                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implemented | stdio 위의 core bridge flow와 Gateway chat/send + abort를 구현함.                                                                                                                                                                                |
| `listSessions`, slash commands                                        | Implemented | session list는 Gateway session state를 기준으로 동작하며, command는 `available_commands_update`로 광고됨.                                                                                                                                      |
| `loadSession`                                                         | Partial     | ACP session을 Gateway session key에 다시 바인딩하고 저장된 user/assistant text history를 재생함. tool/system history는 아직 복원하지 않음.                                                                                                   |
| Prompt content (`text`, embedded `resource`, images)                  | Partial     | text/resource는 chat input으로 평탄화되고, image는 Gateway attachment로 변환됨.                                                                                                                                                                 |
| Session modes                                                         | Partial     | `session/set_mode`는 지원되며, bridge는 thought level, tool verbosity, reasoning, usage detail, elevated actions용 Gateway-backed session control을 노출함. 더 넓은 ACP-native mode/config surface는 아직 범위 밖.                          |
| Session info and usage updates                                        | Partial     | bridge는 cached Gateway session snapshot에서 `session_info_update`와 best-effort `usage_update` notification을 보냄. usage는 근사치이며, Gateway token total이 fresh로 표시될 때만 전송됨.                                                   |
| Tool streaming                                                        | Partial     | `tool_call` / `tool_call_update` event는 raw I/O, text content, 그리고 Gateway tool arg/result에 file location이 드러날 경우 best-effort file location을 포함함. embedded terminal이나 richer diff-native output은 아직 노출되지 않음.        |
| Per-session MCP servers (`mcpServers`)                                | Unsupported | bridge mode는 per-session MCP server request를 거부함. MCP는 OpenClaw gateway 또는 agent 쪽에 구성해야 함.                                                                                                                                      |
| Client filesystem methods (`fs/read_text_file`, `fs/write_text_file`) | Unsupported | bridge는 ACP client filesystem method를 호출하지 않음.                                                                                                                                                                                           |
| Client terminal methods (`terminal/*`)                                | Unsupported | bridge는 ACP client terminal을 만들지 않으며, tool call을 통해 terminal id도 스트리밍하지 않음.                                                                                                                                                 |
| Session plans / thought streaming                                     | Unsupported | bridge는 현재 output text와 tool status만 내보내며, ACP plan/thought update는 내보내지 않음.                                                                                                                                                    |

## Known Limitations

- `loadSession`은 저장된 user/assistant text history만 재생합니다. 과거 tool call, system notice, richer ACP-native event는 복원하지 않습니다.
- 여러 ACP client가 같은 Gateway session key를 공유하면 event 및 cancel routing은 strict isolation이 아니라 best-effort입니다. editor-local turn이 깔끔해야 하면 기본값인 isolated `acp:<uuid>` session을 사용하세요.
- Gateway stop state는 ACP stop reason으로 번역되지만, fully ACP-native runtime만큼 표현력 있지는 않습니다.
- 현재 session control은 Gateway knob 일부만 노출합니다. thought level, tool verbosity, reasoning, usage detail, elevated actions만 제공하며 model selection과 exec-host control은 아직 ACP config option으로 노출되지 않습니다.
- `session_info_update`와 `usage_update`는 live ACP-native runtime accounting이 아니라 Gateway session snapshot에서 파생됩니다. usage는 근사치이며 cost data가 없고, Gateway가 total token data를 fresh로 표시할 때만 전송됩니다.
- tool follow-along data는 best-effort입니다. 알려진 tool arg/result 안의 file path는 surface할 수 있지만, ACP terminal이나 structured file diff는 아직 내보내지 않습니다.

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

IDE 없이 bridge를 sanity-check하려면 built-in ACP client를 사용하세요.
이 명령은 ACP bridge를 spawn하고 prompt를 interactive하게 입력할 수 있게 해줍니다.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Permission model (client debug mode):

- auto-approval은 allowlist 기반이며 trusted core tool ID에만 적용됩니다.
- `read` auto-approval은 현재 working directory 범위로 제한됩니다. (`--cwd`를 쓴 경우)
- unknown/non-core tool, 범위를 벗어난 read, dangerous tool은 항상 명시적 승인 prompt가 필요합니다.
- server가 제공하는 `toolCall.kind`는 untrusted metadata로 취급되며, authorization source로 쓰지 않습니다.

## How to use this

IDE 또는 다른 client가 Agent Client Protocol을 말하고, 그 client가 OpenClaw Gateway session을 구동하길 원할 때 ACP를 사용합니다.

1. Gateway가 실행 중인지 확인합니다. (local 또는 remote)
2. Gateway target을 config 또는 flag로 지정합니다.
3. IDE가 stdio 위에서 `openclaw acp`를 실행하도록 연결합니다.

Example config (persisted):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Example direct run (no config write):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selecting agents

ACP는 agent를 직접 선택하지 않습니다. routing 단위는 Gateway session key입니다.

특정 agent를 타기팅하려면 agent-scoped session key를 사용하세요.

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

각 ACP session은 하나의 Gateway session key에 매핑됩니다. 하나의 agent는 여러 session을 가질 수 있으며, ACP는 기본적으로 key나 label을 override하지 않는 한 isolated `acp:<uuid>` session을 사용합니다.

per-session `mcpServers`는 bridge mode에서 지원되지 않습니다. ACP client가 `newSession` 또는 `loadSession`에서 이를 보내면, bridge는 조용히 무시하지 않고 명확한 error를 반환합니다.

## Use from `acpx` (Codex, Claude, other ACP clients)

Codex나 Claude Code처럼 coding agent가 ACP를 통해 OpenClaw bot과 대화하도록 하려면, `acpx`의 built-in `openclaw` target을 사용하세요.

Typical flow:

1. Gateway를 실행하고 ACP bridge가 여기에 도달할 수 있는지 확인합니다.
2. `acpx openclaw`가 `openclaw acp`를 가리키도록 합니다.
3. coding agent가 사용할 OpenClaw session key를 지정합니다.

Examples:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw`이 항상 특정 Gateway와 session key를 사용하게 하려면 `~/.acpx/config.json`의 `openclaw` agent command를 override하세요.

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

repo-local OpenClaw checkout에서는 ACP stream이 깨끗하게 유지되도록 dev runner가 아니라 direct CLI entrypoint를 사용하세요.

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

이 방식이 Codex, Claude Code, 기타 ACP-aware client가 terminal scraping 없이 OpenClaw agent에서 contextual information을 가져오게 하는 가장 쉬운 방법입니다.

## Zed editor setup

`~/.config/zed/settings.json`에 custom ACP agent를 추가합니다. (또는 Zed Settings UI 사용)

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

특정 Gateway나 agent를 타기팅하려면:

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

Zed에서는 Agent panel을 열고 “OpenClaw ACP”를 선택해 thread를 시작하면 됩니다.

## Session mapping

기본적으로 ACP session은 `acp:` prefix가 붙은 isolated Gateway session key를 받습니다.
이미 아는 session을 재사용하려면 session key 또는 label을 넘기세요.

- `--session <key>`: 특정 Gateway session key 사용
- `--session-label <label>`: 기존 session을 label로 resolve
- `--reset-session`: 첫 prompt 전에 해당 key의 새 session id를 발급

ACP client가 metadata를 지원하면 session별 override도 가능합니다.

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

session key에 대한 자세한 내용은 [/concepts/session](/concepts/session)을 참고하세요.

## Options

- `--url <url>`: Gateway WebSocket URL (`gateway.remote.url`이 설정되어 있으면 기본값으로 사용)
- `--token <token>`: Gateway auth token
- `--token-file <path>`: file에서 Gateway auth token 읽기
- `--password <password>`: Gateway auth password
- `--password-file <path>`: file에서 Gateway auth password 읽기
- `--session <key>`: 기본 session key
- `--session-label <label>`: resolve할 기본 session label
- `--require-existing`: session key/label이 없으면 실패
- `--reset-session`: 첫 사용 전에 session key 초기화
- `--no-prefix-cwd`: prompt 앞에 working directory를 붙이지 않음
- `--verbose, -v`: verbose log를 stderr로 출력

Security note:

- 일부 시스템에서는 `--token`과 `--password`가 local process listing에 노출될 수 있습니다.
- `--token-file`/`--password-file` 또는 env var (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) 사용을 권장합니다.
- Gateway auth resolution은 다른 Gateway client와 같은 공통 규약을 따릅니다.
  - local mode: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` fallback. 단, `gateway.auth.*`가 unset일 때만 fallback. configured-but-unresolved local SecretRef는 fail closed
  - remote mode: `gateway.remote.*`를 사용하고, remote precedence rule에 따라 env/config fallback
  - `--url`은 override-safe이며 implicit config/env credential을 재사용하지 않습니다. `--token`/`--password` 또는 file variant를 명시적으로 넘기세요.
- ACP runtime backend child process에는 `OPENCLAW_SHELL=acp`가 주입됩니다. context-specific shell/profile rule에 활용할 수 있습니다.
- `openclaw acp client`는 spawned bridge process에 `OPENCLAW_SHELL=acp-client`를 설정합니다.

### `acp client` options

- `--cwd <dir>`: ACP session의 working directory
- `--server <command>`: ACP server command (default: `openclaw`)
- `--server-args <args...>`: ACP server에 전달할 extra argument
- `--server-verbose`: ACP server에서 verbose logging 활성화
- `--verbose, -v`: verbose client logging
