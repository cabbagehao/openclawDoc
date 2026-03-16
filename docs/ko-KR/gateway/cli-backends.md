---
title: CLI Backends
description: API provider 장애 시 Claude Code CLI, Codex CLI 같은 로컬 AI CLI를 OpenClaw 모델 폴백으로 구성하는 가이드
summary: 로컬 AI CLI를 사용하는 텍스트 전용 폴백 runtime
read_when:
  - API provider가 실패할 때 신뢰할 수 있는 fallback이 필요할 때
  - Claude Code CLI 같은 로컬 AI CLI를 재사용하고 싶을 때
  - 세션과 이미지는 유지하되 text-only, tool-free 경로가 필요할 때
x-i18n:
  source_path: gateway/cli-backends.md
---

# CLI backends (fallback runtime)

OpenClaw는 API provider가 다운되었거나 rate limit에 걸렸거나 일시적으로 오동작할 때 **로컬 AI CLI**를 **text-only fallback**으로 실행할 수 있습니다. 이 경로는 의도적으로 보수적으로 설계되어 있습니다.

- **Tools are disabled** (tool call 없음)
- **Text in -> text out** (안정적)
- **Sessions are supported** (후속 턴의 맥락 유지)
- **Images can be passed through** if the CLI accepts image paths

이 기능은 기본 실행 경로라기보다 **safety net**을 위한 것입니다. 외부 API에 의존하지 않고도 "항상 동작하는" 텍스트 응답 경로가 필요할 때 사용하세요.

## 빠른 시작

Claude Code CLI는 별도 config 없이 바로 사용할 수 있습니다. OpenClaw에 기본값이 내장되어 있기 때문입니다.

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI도 즉시 동작합니다.

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gateway가 launchd/systemd 아래에서 실행되고 PATH가 제한적이라면 command path만 추가하세요.

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

이것으로 충분합니다. CLI 자체가 이미 인증돼 있다면 별도의 key나 추가 auth config는 필요하지 않습니다.

## fallback으로 사용하기

CLI backend를 fallback 목록에 넣으면 primary model이 실패했을 때만 실행되도록 할 수 있습니다.

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

- `agents.defaults.models` allowlist를 사용한다면 `claude-cli/...`도 포함해야 합니다.
- primary provider가 auth, rate limit, timeout 등으로 실패하면 OpenClaw가 다음으로 CLI backend를 시도합니다.

## 설정 개요

모든 CLI backend 설정은 다음 아래에 있습니다.

```text
agents.defaults.cliBackends
```

각 항목은 **provider id**(예: `claude-cli`, `my-cli`)를 key로 사용합니다.
이 provider id가 모델 ref의 왼쪽 부분이 됩니다.

```text
<provider>/<model>
```

### 설정 예시

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

## 동작 방식

1. provider prefix(`claude-cli/...`)를 기준으로 backend를 선택합니다.
2. 동일한 OpenClaw prompt와 workspace context를 사용해 system prompt를 구성합니다.
3. CLI가 지원하면 session id를 넣어 실행해 대화 이력을 이어갑니다.
4. JSON 또는 plain text 출력을 파싱해 최종 text를 반환합니다.
5. backend별 session id를 저장해 후속 요청에 재사용합니다.

## Sessions

- CLI가 session을 지원한다면 `sessionArg`(예: `--session-id`) 또는 session ID를 여러 flag에 넣어야 할 때 `sessionArgs`(placeholder `{sessionId}` 포함)를 설정합니다.
- CLI가 **resume subcommand**를 쓰고 다른 flag 조합이 필요하다면 `resumeArgs`(재개 시 `args` 대체)와 필요 시 `resumeOutput`(재개 시 non-JSON 출력용)을 설정합니다.
- `sessionMode`:
  - `always`: 항상 session id를 보냅니다. 저장된 값이 없으면 새 UUID를 만듭니다.
  - `existing`: 이전에 저장된 session id가 있을 때만 보냅니다.
  - `none`: session id를 전송하지 않습니다.

## Images (pass-through)

CLI가 image path를 받을 수 있다면 `imageArg`를 설정하세요.

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 image를 temp file로 기록합니다. `imageArg`가 설정돼 있으면 그 path를 CLI arg로 전달합니다. `imageArg`가 없으면 file path를 prompt 끝에 붙입니다(path injection). 이는 plain path만으로 local file을 자동 로드하는 CLI(예: Claude Code CLI)에서 충분합니다.

## Inputs / outputs

- `output: "json"`(기본값)은 JSON을 파싱해 text와 session id를 추출합니다.
- `output: "jsonl"`은 JSONL stream(Codex CLI `--json`)을 파싱해 마지막 agent message와 가능하면 `thread_id`를 추출합니다.
- `output: "text"`는 stdout 전체를 최종 응답으로 취급합니다.

입력 모드:

- `input: "arg"`(기본값)는 prompt를 마지막 CLI arg로 전달합니다.
- `input: "stdin"`은 prompt를 stdin으로 보냅니다.
- prompt가 매우 길고 `maxPromptArgChars`가 설정돼 있으면 stdin을 사용합니다.

## 기본값(내장)

OpenClaw는 `claude-cli`용 기본값을 내장하고 있습니다.

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw는 `codex-cli`용 기본값도 내장하고 있습니다.

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

정말 필요할 때만 override하세요. 가장 흔한 예는 절대 `command` path를 지정하는 경우입니다.

## 제한 사항

- **OpenClaw tools는 없음**. CLI backend는 tool call을 받지 않습니다. 다만 일부 CLI는 자체 agent tooling을 실행할 수 있습니다.
- **Streaming은 없음**. CLI 출력은 모두 수집한 뒤 반환됩니다.
- **Structured output** 품질은 해당 CLI의 JSON 형식에 달려 있습니다.
- **Codex CLI session**은 text output으로 resume되며, 이는 초기 `--json` 실행보다 구조화 수준이 낮습니다. 그래도 OpenClaw session은 정상적으로 유지됩니다.

## 문제 해결

- **CLI not found**: `command`를 절대 경로로 지정하세요.
- **Wrong model name**: `modelAliases`로 `provider/model`을 CLI model name에 매핑하세요.
- **No session continuity**: `sessionArg`가 설정돼 있고 `sessionMode`가 `none`이 아닌지 확인하세요. Codex CLI는 현재 JSON output으로 resume할 수 없습니다.
- **Images ignored**: `imageArg`를 설정하고, CLI가 file path 입력을 실제로 지원하는지 확인하세요.
