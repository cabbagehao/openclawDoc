---
summary: "OpenProse: OpenClaw의 .prose 워크플로, 슬래시 명령어, 상태 저장 방식"
read_when:
  - .prose 워크플로를 실행하거나 작성하려고 할 때
  - OpenProse 플러그인을 활성화하려고 할 때
  - 상태 저장 방식을 이해해야 할 때
title: "OpenProse"
description: "OpenClaw에서 OpenProse를 설치하고 실행하는 방법, `/prose` 명령, 상태 저장 위치와 보안 고려사항을 설명합니다."
x-i18n:
  source_path: "prose.md"
---

# OpenProse

OpenProse는 AI 세션을 오케스트레이션하기 위한 휴대형, markdown-first 워크플로 형식입니다. OpenClaw에서는 OpenProse 스킬 팩과 `/prose` 슬래시 명령을 설치하는 플러그인으로 제공됩니다. 프로그램은 `.prose` 파일에 작성되며, 명시적인 제어 흐름으로 여러 서브에이전트를 실행할 수 있습니다.

공식 사이트: [https://www.prose.md](https://www.prose.md)

## 할 수 있는 일

- 명시적인 병렬성을 갖춘 멀티에이전트 조사 + 종합 작업
- 승인 안전성이 중요한 반복 가능한 워크플로(code review, incident triage, content pipelines)
- 지원되는 에이전트 런타임 전반에서 재사용 가능한 `.prose` 프로그램 실행

## 설치 + 활성화

번들 플러그인은 기본적으로 비활성화되어 있습니다. OpenProse를 활성화합니다:

```bash
openclaw plugins enable open-prose
```

플러그인을 활성화한 뒤 Gateway를 재시작합니다.

개발/로컬 체크아웃: `openclaw plugins install ./extensions/open-prose`

관련 문서: [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest), [Skills](/tools/skills).

## 슬래시 명령

OpenProse는 사용자가 호출할 수 있는 스킬 명령으로 `/prose`를 등록합니다. 이 명령은 OpenProse VM 지침으로 라우팅되며, 내부적으로 OpenClaw 도구를 사용합니다.

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

OpenProse는 워크스페이스의 `.prose/` 아래에 상태를 저장합니다:

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

사용자 단위의 영구 에이전트는 다음 위치에 저장됩니다:

```
~/.prose/agents/
```

## 상태 모드

OpenProse는 여러 상태 백엔드를 지원합니다:

- **filesystem** (기본값): `.prose/runs/...`
- **in-context**: 작은 프로그램용 일시적 모드
- **sqlite** (실험적): `sqlite3` 바이너리 필요
- **postgres** (실험적): `psql`과 연결 문자열 필요

참고:

- sqlite/postgres는 opt-in이며 실험적 기능입니다.
- postgres 자격 증명은 서브에이전트 로그로 흘러갈 수 있으므로, 전용 최소 권한 DB를 사용하세요.

## 원격 프로그램

`/prose run <handle/slug>`는 `https://p.prose.md/<handle>/<slug>`로 해석됩니다.
직접 URL은 있는 그대로 가져옵니다. 이 동작은 `web_fetch` 도구(또는 POST의 경우 `exec`)를 사용합니다.

## OpenClaw 런타임 매핑

OpenProse 프로그램은 OpenClaw 기본 요소에 다음과 같이 대응됩니다:

| OpenProse concept         | OpenClaw tool    |
| ------------------------- | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read/write           | `read` / `write` |
| Web fetch                 | `web_fetch`      |

도구 allowlist가 이 도구들을 막고 있으면 OpenProse 프로그램은 실패합니다. [Skills config](/tools/skills-config)를 참고하세요.

## 보안 + 승인

`.prose` 파일은 코드처럼 취급하세요. 실행 전에 검토하고, 부작용을 제어하려면 OpenClaw 도구 allowlist와 승인 게이트를 사용하세요.

결정적이고 승인 게이트가 있는 워크플로가 필요하다면 [Lobster](/tools/lobster)와 비교해 보세요.
