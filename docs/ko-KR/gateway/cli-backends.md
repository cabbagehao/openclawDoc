---
summary: "CLI backend: 로컬 AI CLI를 이용한 text-only fallback"
read_when:
  - API provider가 실패할 때 믿을 만한 fallback이 필요할 때
  - Claude Code CLI 같은 로컬 AI CLI를 재사용하고 싶을 때
  - session과 image는 지원하면서 tool은 없는 text-only 경로가 필요할 때
title: "CLI Backends"
---

# CLI backends (fallback runtime)

OpenClaw는 API provider가 장애 상태이거나, rate limit에 걸렸거나, 일시적으로 이상 동작할 때 **로컬 AI CLI**를 **text-only fallback**으로 실행할 수 있습니다. 이 경로는 의도적으로 보수적입니다.

- **Tool은 비활성화**됩니다(tool call 없음).
- **Text in -> text out** 구조입니다(신뢰성 우선).
- **Session을 지원**하므로 후속 턴도 일관성을 유지합니다.
- CLI가 image path를 받을 수 있으면 **이미지를 그대로 전달**할 수 있습니다.

이 기능은 기본 경로가 아니라 **안전망**으로 설계되었습니다. 외부 API에 의존하지 않고 “어쨌든 동작하는” 텍스트 응답이 필요할 때 사용하세요.

## Beginner-friendly quick start

Claude Code CLI는 **설정 없이도** 사용할 수 있습니다(OpenClaw에 built-in default 포함).

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI도 기본 상태로 동작합니다.

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

gateway가 launchd/systemd 아래에서 실행되고 PATH가 제한적이라면, command 경로만 추가하세요.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

이것으로 충분합니다. CLI 자체 인증 외에 추가 key나 auth config는 필요 없습니다.

## Using it as a fallback

CLI backend를 fallback 목록에 추가하면 primary model이 실패할 때만 사용됩니다.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/opus-4.6", "claude-cli/opus-4.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/opus-4.6": {},
        "claude-cli/opus-4.5": {},
      },
    },
  },
}
```

참고:

- `agents.defaults.models`(allowlist)를 쓰는 경우 `claude-cli/...`도 포함해야 합니다.
- primary provider가 auth, rate limit, timeout 등으로 실패하면 OpenClaw가 다음으로 CLI backend를 시도합니다.

## Configuration overview

모든 CLI backend는 다음 아래에 있습니다.

```
agents.defaults.cliBackends
```

각 항목은 **provider id**(예: `claude-cli`, `my-cli`)를 key로 사용합니다.
이 provider id는 model ref의 왼쪽 절반이 됩니다.

```
<provider>/<model>
```

### Example configuration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-opus-4-5": "opus",
            "claude-sonnet-4-5": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## How it works

1. provider prefix(`claude-cli/...`)로 backend 선택
2. OpenClaw prompt + workspace context를 사용해 system prompt 구성
3. session id를 지원하면 함께 넘겨 history 일관성 유지
4. 출력(JSON 또는 plain text)을 파싱해 최종 텍스트 반환
5. backend별 session id를 저장해 후속 턴에서 같은 CLI session 재사용

## Sessions

- CLI가 session을 지원하면 `sessionArg`(예: `--session-id`) 또는 `sessionArgs`(`{sessionId}` placeholder 포함)를 설정합니다. 여러 flag에 session id를 넣어야 할 때 유용합니다.
- CLI가 **resume subcommand**와 다른 flag 조합을 사용한다면 `resumeArgs`를 설정하세요. `resumeOutput`으로 resume 시 non-JSON 출력을 따로 지정할 수도 있습니다.
- `sessionMode`:
  - `always`: 항상 session id 전달(저장된 값이 없으면 새 UUID 생성)
  - `existing`: 이전에 저장된 session id가 있을 때만 전달
  - `none`: session id를 절대 전달하지 않음

## Images (pass-through)

CLI가 image path를 받을 수 있다면 `imageArg`를 설정하세요.

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 이미지를 temp file로 기록합니다. `imageArg`가 설정되어 있으면 해당 경로를 CLI arg로 넘깁니다. `imageArg`가 없으면 OpenClaw는 파일 경로를 prompt에 덧붙입니다(path injection). 경로만 받아도 로컬 파일을 자동으로 읽는 CLI(Claude Code CLI 동작)가 이를 처리할 수 있습니다.

## Inputs / outputs

- `output: "json"`(기본값)은 JSON을 파싱해 text + session id를 추출합니다.
- `output: "jsonl"`은 JSONL stream(Codex CLI `--json`)을 파싱하여 마지막 agent message와 가능한 경우 `thread_id`를 추출합니다.
- `output: "text"`는 stdout 전체를 최종 응답으로 취급합니다.

입력 모드:

- `input: "arg"`(기본값): prompt를 마지막 CLI arg로 전달
- `input: "stdin"`: prompt를 stdin으로 전송
- prompt가 매우 길고 `maxPromptArgChars`가 설정되어 있으면 stdin을 사용

## Defaults (built-in)

OpenClaw는 `claude-cli` 기본값을 내장합니다.

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw는 `codex-cli` 기본값도 내장합니다.

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

필요한 경우에만 override 하세요. 흔한 경우는 절대 `command` 경로를 넣는 것입니다.

## Limitations

- **OpenClaw tool을 사용할 수 없습니다.** CLI backend에는 tool call이 전달되지 않습니다. 다만 일부 CLI는 자체 agent tooling을 실행할 수 있습니다.
- **Streaming이 없습니다.** CLI 출력을 수집한 뒤 한 번에 반환합니다.
- **구조화된 출력**은 CLI의 JSON 형식에 의존합니다.
- **Codex CLI session**은 resume 시 text output으로 동작합니다(JSONL 아님). 따라서 초기 `--json` 실행보다 구조가 약합니다. 그래도 OpenClaw session 자체는 정상 동작합니다.

## Troubleshooting

- **CLI not found**: `command`에 전체 경로를 지정하세요.
- **Wrong model name**: `modelAliases`로 `provider/model` -> CLI model 이름을 매핑하세요.
- **No session continuity**: `sessionArg`가 설정되어 있고 `sessionMode`가 `none`이 아닌지 확인하세요(Codex CLI는 현재 JSON 출력으로 resume할 수 없습니다).
- **Images ignored**: `imageArg`를 설정하고, 해당 CLI가 file path를 지원하는지 확인하세요.
