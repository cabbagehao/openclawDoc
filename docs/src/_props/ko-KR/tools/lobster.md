---
title: Lobster
summary: "재개 가능한 승인 게이트를 갖춘 OpenClaw용 타입드 워크플로 런타임."
description: 승인 게이트를 포함한 조합형 파이프라인을 위한 OpenClaw용 타입드 워크플로 런타임.
read_when:
  - 명시적 승인을 포함한 결정론적 멀티스텝 워크플로가 필요할 때
  - 앞선 단계를 다시 실행하지 않고 워크플로를 재개해야 할 때
---

# Lobster

Lobster는 OpenClaw가 명시적인 승인 체크포인트를 갖춘 여러 단계의 도구 시퀀스를 하나의 결정론적 작업으로 실행할 수 있게 해주는 워크플로 셸입니다.

## Hook

당신의 어시스턴트는 스스로를 관리하는 도구를 만들 수 있습니다. 워크플로를 요청하면, 30분 뒤에는 한 번의 호출로 실행되는 CLI와 파이프라인을 갖게 됩니다. Lobster는 빠져 있던 조각입니다. 결정론적 파이프라인, 명시적 승인, 재개 가능한 상태를 제공합니다.

## Why

오늘날 복잡한 워크플로는 많은 왕복 도구 호출을 필요로 합니다. 각 호출은 토큰 비용이 들고, LLM은 모든 단계를 오케스트레이션해야 합니다. Lobster는 그 오케스트레이션을 타입드 런타임으로 옮깁니다.

* **여러 번 대신 한 번의 호출**: OpenClaw는 Lobster 도구 호출 한 번을 실행하고 구조화된 결과를 받습니다.
* **승인 내장**: 부작용이 있는 작업(이메일 전송, 댓글 게시 등)은 명시적으로 승인될 때까지 워크플로를 중단합니다.
* **재개 가능**: 중단된 워크플로는 토큰을 반환하며, 모든 것을 다시 실행하지 않고 승인 후 재개할 수 있습니다.

## Why a DSL instead of plain programs?

Lobster는 의도적으로 작게 설계되어 있습니다. 목표는 "새로운 언어"가 아니라, 승인과 resume token을 일급 개념으로 가진 예측 가능하고 AI 친화적인 파이프라인 명세입니다.

* **승인/재개가 내장됨**: 일반 프로그램도 사람에게 물을 수는 있지만, 그 런타임을 직접 만들지 않고는 영속적인 토큰으로 *중단했다가 재개* 할 수 없습니다.
* **결정성 + 감사 가능성**: 파이프라인은 데이터이므로 로깅, diff, 재실행, 검토가 쉽습니다.
* **AI를 위한 제한된 표면**: 작은 문법과 JSON 파이핑은 "창의적인" 코드 경로를 줄이고 검증을 현실적으로 만듭니다.
* **안전 정책 내장**: 타임아웃, 출력 상한, 샌드박스 검사, allowlist는 각 스크립트가 아니라 런타임이 강제합니다.
* **여전히 프로그래밍 가능**: 각 단계는 어떤 CLI나 스크립트든 호출할 수 있습니다. JS/TS를 원하면 코드에서 `.lobster` 파일을 생성하면 됩니다.

## How it works

OpenClaw는 **tool mode**로 로컬 `lobster` CLI를 실행하고 stdout의 JSON envelope를 파싱합니다.
파이프라인이 승인을 위해 일시 중지되면, 나중에 계속할 수 있도록 도구가 `resumeToken`을 반환합니다.

## Pattern: small CLI + JSON pipes + approvals

JSON을 말하는 작은 명령들을 만들고, 그것들을 하나의 Lobster 호출로 연결하세요. (아래 명령 이름은 예시이며, 당신의 명령으로 바꿔도 됩니다.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

파이프라인이 승인을 요청하면 토큰으로 재개합니다.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI가 워크플로를 트리거하고, Lobster가 단계를 실행합니다. 승인 게이트는 부작용을 명시적이고 감사 가능하게 유지합니다.

예시: 입력 항목을 도구 호출로 매핑하기

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON-only LLM steps (llm-task)

워크플로에 **구조화된 LLM 단계**가 필요하다면, 선택적 `llm-task` 플러그인 도구를 활성화하고 Lobster에서 호출하세요. 이렇게 하면 워크플로는 결정론적으로 유지하면서도 모델을 이용한 분류/요약/초안 작성이 가능합니다.

도구 활성화:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

파이프라인에서 사용:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

자세한 내용과 설정 옵션은 [LLM Task](/tools/llm-task)를 참고하세요.

## Workflow files (.lobster)

Lobster는 `name`, `args`, `steps`, `env`, `condition`, `approval` 필드를 가진 YAML/JSON 워크플로 파일을 실행할 수 있습니다. OpenClaw 도구 호출에서는 `pipeline`에 파일 경로를 설정하세요.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

참고:

* `stdin: $step.stdout`와 `stdin: $step.json`은 이전 단계의 출력을 전달합니다.
* `condition`(또는 `when`)은 `$step.approved`에 따라 단계를 게이트할 수 있습니다.

## Install Lobster

OpenClaw Gateway를 실행하는 **같은 호스트**에 Lobster CLI를 설치하고([Lobster repo](https://github.com/openclaw/lobster) 참고), `lobster`가 `PATH`에 있도록 하세요.

## Enable the tool

Lobster는 **선택적** 플러그인 도구입니다(기본적으로 활성화되지 않음).

권장 방식(가산적이며 안전함):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

또는 에이전트별로:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

제한적인 allowlist 모드로 실행하려는 의도가 아니라면 `tools.allow: ["lobster"]` 사용은 피하세요.

참고: allowlist는 선택적 플러그인에 대해서만 opt-in입니다. allowlist가 `lobster` 같은
플러그인 도구만 나열하면 OpenClaw는 코어 도구를 계속 활성화합니다. 코어 도구도 제한하려면
허용할 코어 도구 또는 그룹도 allowlist에 함께 포함하세요.

## Example: Email triage

Lobster 없이:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobster 사용 시:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

반환되는 JSON envelope(일부 생략):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

사용자가 승인하면 → 재개:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

하나의 워크플로. 결정론적. 안전함.

## Tool parameters

### `run`

tool mode에서 파이프라인을 실행합니다.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

args가 있는 워크플로 파일 실행:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

승인 후 중단된 워크플로를 계속 실행합니다.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Optional inputs

* `cwd`: 파이프라인의 상대 작업 디렉터리(현재 프로세스 작업 디렉터리 내부에 있어야 함).
* `timeoutMs`: 이 시간을 초과하면 서브프로세스를 종료합니다(기본값: 20000).
* `maxStdoutBytes`: stdout이 이 크기를 초과하면 서브프로세스를 종료합니다(기본값: 512000).
* `argsJson`: `lobster run --args-json`에 전달되는 JSON 문자열(워크플로 파일 전용).

## Output envelope

Lobster는 다음 세 가지 상태 중 하나를 갖는 JSON envelope를 반환합니다.

* `ok` → 성공적으로 완료됨
* `needs_approval` → 일시 중지됨; 재개하려면 `requiresApproval.resumeToken`이 필요함
* `cancelled` → 명시적으로 거부되었거나 취소됨

도구는 이 envelope를 `content`(보기 좋은 JSON)와 `details`(raw object) 둘 다에 노출합니다.

## Approvals

`requiresApproval`가 있으면 프롬프트를 검토하고 결정하세요.

* `approve: true` → 재개하고 부작용을 계속 진행
* `approve: false` → 취소하고 워크플로를 종료

`approve --preview-from-stdin --limit N`을 사용하면 커스텀 jq/heredoc glue 없이 승인 요청에 JSON 미리보기를 붙일 수 있습니다. 이제 resume token은 더 작아졌습니다. Lobster가 워크플로 resume 상태를 자체 state dir 아래에 저장하고, 작은 토큰 키만 돌려줍니다.

## OpenProse

OpenProse는 Lobster와 잘 맞습니다. `/prose`를 사용해 멀티 에이전트 준비 과정을 오케스트레이션한 뒤, 결정론적 승인을 위해 Lobster 파이프라인을 실행하세요. Prose 프로그램에 Lobster가 필요하다면 `tools.subagents.tools`를 통해 서브에이전트에 `lobster` 도구를 허용하세요. 자세한 내용은 [OpenProse](/prose)를 참고하세요.

## Safety

* **로컬 서브프로세스만 사용** — 플러그인 자체는 네트워크 호출을 하지 않습니다.
* **비밀 정보 없음** — Lobster는 OAuth를 관리하지 않으며, 대신 이를 처리하는 OpenClaw 도구를 호출합니다.
* **샌드박스 인식** — 도구 컨텍스트가 샌드박스이면 비활성화됩니다.
* **강화됨** — `PATH`에서 고정된 실행 파일 이름(`lobster`)을 사용하며, 타임아웃과 출력 상한을 강제합니다.

## Troubleshooting

* **`lobster subprocess timed out`** → `timeoutMs`를 늘리거나 긴 파이프라인을 분할하세요.
* **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes`를 올리거나 출력 크기를 줄이세요.
* **`lobster returned invalid JSON`** → 파이프라인이 tool mode로 실행되며 JSON만 출력하는지 확인하세요.
* **`lobster failed (code …)`** → 같은 파이프라인을 터미널에서 실행해 stderr를 확인하세요.

## Learn more

* [Plugins](/tools/plugin)
* [Plugin tool authoring](/plugins/agent-tools)

## Case study: community workflows

한 공개 예시는 세 개의 Markdown vault(개인, 파트너, 공유)를 관리하는 "second brain" CLI + Lobster 파이프라인입니다. 이 CLI는 통계, inbox 목록, stale scan에 대해 JSON을 출력하고, Lobster는 그 명령들을 `weekly-review`, `inbox-triage`, `memory-consolidation`, `shared-task-sync` 같은 워크플로로 연결하며 각 워크플로에는 승인 게이트가 있습니다. AI는 가능할 때 판단(분류)을 담당하고, 그렇지 않을 때는 결정론적 규칙으로 폴백합니다.

* Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
* Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)
