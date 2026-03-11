---
summary: "로컬 AI CLI를 활용한 텍스트 전용 폴백(Fallback) 런타임 설정 및 관리 가이드"
read_when:
  - API 공급자 장애 발생 시 안정적인 대체 수단(Fallback)이 필요할 때
  - Claude Code CLI 등 이미 설치된 로컬 AI 도구를 OpenClaw에서 재사용하고자 할 때
  - 도구 호출 없이 텍스트 응답 및 이미지 전달만 지원하는 가벼운 경로가 필요할 때
title: "CLI 백엔드"
x-i18n:
  source_path: "gateway/cli-backends.md"
---

# CLI 백엔드 (폴백 런타임)

OpenClaw는 외부 API 공급자의 서비스 장애, 속도 제한(Rate limit) 또는 일시적인 오류 발생 시 **로컬 AI CLI**를 **텍스트 전용 폴백(Fallback)**으로 실행할 수 있음. 이 경로는 안정성을 위해 다음과 같이 제한적으로 작동함:

- **도구 호출 비활성화**: 에이전트의 도구 호출(Tool calls) 기능을 지원하지 않음.
- **텍스트 기반**: 텍스트 입력과 출력에 집중하여 높은 신뢰성 확보.
- **세션 유지**: 세션 ID를 전달하여 연속된 대화의 일관성 유지 가능.
- **이미지 전달**: 대상 CLI가 파일 경로 입력을 지원할 경우 이미지 데이터 전달 가능.

본 기능은 주 실행 경로가 아닌 **최후의 안전망(Safety net)**으로 설계됨. 외부 API 의존성 없이 항상 동작하는 텍스트 응답 환경이 필요한 경우에 활용함.

## 빠른 시작 가이드 (초보자용)

Claude Code CLI는 별도의 설정 없이 즉시 사용 가능함 (OpenClaw 내장 기본값 활용):

```bash
openclaw agent --message "안녕" --model claude-cli/opus-4.6
```

Codex CLI 역시 기본 상태로 동작함:

```bash
openclaw agent --message "안녕" --model codex-cli/gpt-5.4
```

만약 Gateway가 launchd나 systemd 환경에서 실행되어 `PATH` 정보가 제한적이라면, 다음과 같이 실행 명령어의 절대 경로만 추가함:

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

추가적인 API 키나 인증 설정 없이 CLI 자체의 인증 상태를 그대로 활용함.

## 장애 조치(Failover)용 폴백 설정

기본 모델 호출 실패 시에만 CLI 백엔드를 사용하도록 폴백 리스트에 추가함:

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

**참고 사항:**
- `agents.defaults.models` 허용 목록을 사용 중이라면 `claude-cli/...` 항목을 반드시 포함해야 함.
- 기본 공급자의 인증 실패, 속도 제한, 타임아웃 발생 시 OpenClaw는 자동으로 다음 순번인 CLI 백엔드 호출을 시도함.

## 설정 개요

모든 CLI 백엔드 설정은 다음 경로 하위에서 관리됨:
`agents.defaults.cliBackends`

각 항목은 **공급자 ID**(예: `claude-cli`, `my-cli`)를 키로 사용하며, 이는 모델 참조 시 접두사로 활용됨:
`<provider>/<model>`

### 상세 설정 예시

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

## 동작 원리

1. **백엔드 선택**: 모델 ID의 공급자 접두사(`claude-cli/...`)를 기반으로 설정을 결정함.
2. **시스템 프롬프트 생성**: OpenClaw 공통 프롬프트와 워크스페이스 컨텍스트를 조합하여 구축함.
3. **CLI 실행**: 세션 ID를 지원하는 경우 이를 인자로 전달하여 대화 이력의 연속성을 확보함.
4. **결과 파싱**: CLI 출력물(JSON 또는 일반 텍스트)을 분석하여 최종 텍스트 답변을 추출함.
5. **상태 영속화**: 백엔드별로 반환된 세션 ID를 저장하여 다음 턴에서 재사용함.

## 세션 관리 (Sessions)

- CLI가 세션을 지원할 경우 `sessionArg` (예: `--session-id`) 또는 `{sessionId}` 자리표시자가 포함된 `sessionArgs`를 설정함.
- **재개 명령(Resume)**: 재개 시 다른 명령어 구문이 필요한 경우 `resumeArgs`와 `resumeOutput` 설정을 통해 대응함.
- **`sessionMode` 옵션**:
  - `always`: 항상 세션 ID 전송 (없으면 새 UUID 생성).
  - `existing`: 기존에 저장된 ID가 있을 때만 전송.
  - `none`: 세션 ID를 사용하지 않음.

## 이미지 전달 (Pass-through)

대상 CLI가 이미지 파일 경로를 인식할 수 있다면 `imageArg`를 설정함:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 Base64 이미지 데이터를 임시 파일로 저장한 후 해당 경로를 CLI 인자로 넘겨줌. 만약 `imageArg`가 설정되지 않은 경우, 파일 경로 정보를 프롬프트 텍스트에 직접 주입(Path injection)함. 이는 로컬 파일 자동 로드 기능을 갖춘 CLI(예: Claude Code CLI)에 유효함.

## 입출력 규격

- **출력 형식 (`output`)**:
  - `json` (기본값): 응답 본문 및 세션 ID 정보를 JSON에서 추출.
  - `jsonl`: 라인별 JSON 스트림을 분석하여 최종 메시지 및 `thread_id` 추출.
  - `text`: 표준 출력(stdout) 전체를 답변으로 간주.
- **입력 방식 (`input`)**:
  - `arg` (기본값): 프롬프트를 마지막 CLI 인자로 전달.
  - `stdin`: 표준 입력(stdin)으로 프롬프트 전송.
  - `maxPromptArgChars` 제한 초과 시 자동으로 `stdin` 방식 전환.

## 기본 내장 설정 (Defaults)

**`claude-cli`**:
- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`, `sessionArg: "--session-id"`

**`codex-cli`**:
- `command: "codex"`
- `args: ["exec", "--json", "--color", "never", "--sandbox", "read-only", "--skip-git-repo-check"]`
- `output: "jsonl"`, `resumeOutput: "text"`

특수한 환경(예: 절대 경로 필요)이 아니라면 설정을 생략하거나 최소한으로 유지할 것을 권장함.

## 기능 제약

- **도구 호출 불가**: OpenClaw 고유의 도구(File, Exec 등)를 백엔드에서 호출할 수 없음. 단, CLI 자체가 내장한 자체 에이전트 도구는 작동할 수 있음.
- **스트리밍 미지원**: 출력이 완료된 후 한 번에 수집하여 반환함.
- **구조적 한계**: 결과값의 품질이 해당 CLI의 JSON 응답 규격에 의존함.

## 문제 해결 (Troubleshooting)

- **명령어 찾지 못함**: `command` 필드에 실행 파일의 전체 경로(Full path)를 입력함.
- **모델명 불일치**: `modelAliases`를 사용하여 OpenClaw 모델 ID를 CLI 전용 모델 이름으로 매핑함.
- **맥락 유실**: `sessionArg`가 올바른지 확인하고 `sessionMode`가 `none`으로 설정되어 있지 않은지 점검함.
- **이미지 무시**: `imageArg` 설정을 확인하고 해당 CLI가 실제 파일 경로를 통한 이미지 로드를 지원하는지 검증함.
