---
summary: "OpenClaw에서 OpenProse의 .prose 워크플로, 슬래시 명령, 상태 저장"
read_when:
  - .prose 워크플로를 실행하거나 작성하고 싶을 때
  - OpenProse 플러그인을 활성화하고 싶을 때
  - 상태 저장 방식을 이해해야 할 때
title: "OpenProse"
x-i18n:
  source_path: "prose.md"
---

# OpenProse

OpenProse는 AI 세션 오케스트레이션을 위한 휴대 가능한 markdown-first 워크플로 형식입니다. OpenClaw에서는 OpenProse skill pack과 `/prose` 슬래시 명령을 설치하는 플러그인으로 제공됩니다. 프로그램은 `.prose` 파일에 저장되며, 명시적인 제어 흐름으로 여러 하위 에이전트를 생성할 수 있습니다.

공식 사이트: [https://www.prose.md](https://www.prose.md)

## 할 수 있는 일

- 명시적인 병렬성을 갖춘 멀티 에이전트 리서치 + 통합
- 반복 가능하고 승인에 안전한 워크플로(code review, incident triage, content pipeline)
- 지원되는 에이전트 런타임 전반에서 실행할 수 있는 재사용 가능한 `.prose` 프로그램

## 설치 + 활성화

번들 플러그인은 기본적으로 비활성화되어 있습니다. OpenProse를 활성화하세요.

```bash
openclaw plugins enable open-prose
```

플러그인을 활성화한 뒤 Gateway를 재시작하세요.

개발/로컬 체크아웃: `openclaw plugins install ./extensions/open-prose`

관련 문서: [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest), [Skills](/tools/skills).

## 슬래시 명령

OpenProse는 사용자가 호출할 수 있는 skill 명령으로 `/prose`를 등록합니다. 이 명령은 OpenProse VM 지침으로 라우팅되며, 내부적으로 OpenClaw 도구를 사용합니다.

자주 쓰는 명령:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 예시: 간단한 `.prose` 파일

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## 파일 위치

OpenProse는 워크스페이스의 `.prose/` 아래에 상태를 유지합니다.

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

사용자 수준의 영구 에이전트는 다음 위치에 저장됩니다.

```
~/.prose/agents/
```

## 상태 모드

OpenProse는 여러 상태 백엔드를 지원합니다.

- **filesystem** (기본값): `.prose/runs/...`
- **in-context**: 작은 프로그램용 일시적 모드
- **sqlite** (실험적): `sqlite3` 바이너리 필요
- **postgres** (실험적): `psql`과 연결 문자열 필요

참고:

- sqlite/postgres는 opt-in이며 실험적입니다.
- postgres 자격 증명은 하위 에이전트 로그로 흘러들어가므로, 전용 최소 권한 DB를 사용하세요.

## 원격 프로그램

`/prose run <handle/slug>`는 `https://p.prose.md/<handle>/<slug>`로 해석됩니다.
직접 URL은 그대로 가져옵니다. 이때 `web_fetch` 도구(또는 POST의 경우 `exec`)를 사용합니다.

## OpenClaw 런타임 매핑

OpenProse 프로그램은 다음 OpenClaw 원시 기능에 매핑됩니다.

| OpenProse 개념        | OpenClaw 도구    |
| --------------------- | ---------------- |
| 세션 생성 / Task 도구 | `sessions_spawn` |
| 파일 읽기/쓰기        | `read` / `write` |
| 웹 가져오기           | `web_fetch`      |

도구 allowlist가 이 도구들을 차단하면 OpenProse 프로그램은 실패합니다. [Skills config](/tools/skills-config)를 참고하세요.

## 보안 + 승인

`.prose` 파일은 코드처럼 취급하세요. 실행 전에 검토하고, OpenClaw의 도구 allowlist와 승인 게이트를 사용해 부작용을 제어하세요.

결정적이고 승인 게이트가 있는 워크플로가 필요하다면 [Lobster](/tools/lobster)와 비교해 보세요.
