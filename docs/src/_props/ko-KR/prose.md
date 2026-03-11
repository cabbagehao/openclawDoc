---
summary: "OpenProse: OpenClaw에서의 .prose 워크플로우 실행, 슬래시 명령어 및 상태 관리 안내"
read_when:
  - .prose 워크플로우를 실행하거나 작성하고자 할 때
  - OpenProse 플러그인 활성화 방법이 궁금할 때
  - 시스템 상태 저장 및 데이터 관리 방식을 이해해야 할 때
title: "OpenProse"
x-i18n:
  source_path: "prose.md"
---

# OpenProse

OpenProse는 AI 세션 오케스트레이션을 위해 설계된 마크다운 기반의 휴대용 워크플로우 형식임. OpenClaw에서는 OpenProse 스킬 팩과 `/prose` 슬래시 명령어를 제공하는 플러그인 형태로 포함되어 있음. 프로그램은 `.prose` 확장자 파일로 작성되며, 명시적인 제어 흐름을 통해 여러 하위 에이전트를 생성하고 관리할 수 있음.

공식 웹사이트: [https://www.prose.md](https://www.prose.md)

## 주요 기능

* **멀티 에이전트 협업**: 명시적인 병렬 처리를 통한 리서치 및 정보 통합 수행.
* **안전한 워크플로우**: 코드 리뷰, 장애 조치(Triage), 콘텐츠 파이프라인 등 승인 절차가 포함된 반복 가능한 작업 수행.
* **높은 재사용성**: 다양한 에이전트 런타임에서 실행 가능한 독립적인 `.prose` 프로그램 작성.

## 설치 및 활성화 방법

기본적으로 포함된 플러그인은 비활성 상태임. 다음 명령어로 OpenProse를 활성화함:

```bash
openclaw plugins enable open-prose
```

플러그인 활성화 후에는 반드시 Gateway를 재시작해야 함.

개발용 또는 로컬 환경 설치: `openclaw plugins install ./extensions/open-prose`

관련 문서: [플러그인 관리](/tools/plugin), [플러그인 매니페스트](/plugins/manifest), [스킬 시스템](/tools/skills)

## 슬래시 명령어

OpenProse는 사용자가 직접 호출할 수 있는 `/prose` 스킬 명령어를 등록함. 이 명령어는 OpenProse 가상 머신(VM) 지침으로 라우팅되며 내부적으로 OpenClaw 도구들을 활용함.

주요 명령어 목록:

```text
/prose help                             # 도움말 확인
/prose run <파일명.prose>                # 로컬 파일 실행
/prose run <핸들/슬러그>                 # 원격 저장소 프로그램 실행
/prose run <URL>                        # 특정 URL의 .prose 실행
/prose compile <파일명.prose>            # 프로그램 컴파일 확인
/prose examples                         # 예제 목록 보기
/prose update                           # OpenProse 업데이트
```

## 예시: 간단한 `.prose` 파일 구조

```prose
# 두 개의 에이전트를 병렬로 실행하는 리서치 워크플로우

input topic: "어떤 주제를 조사할까요?"

agent researcher:
  model: sonnet
  prompt: "철저하게 조사하고 출처를 명시하세요."

agent writer:
  model: opus
  prompt: "간결하고 명확한 요약본을 작성하세요."

parallel:
  findings = session: researcher
    prompt: "{topic}에 대해 조사하세요."
  draft = session: writer
    prompt: "{topic}의 내용을 요약하세요."

session "조사 결과와 초안을 합쳐서 최종 답변을 만드세요."
context: { findings, draft }
```

## 파일 및 데이터 저장 위치

OpenProse는 워크스페이스 내의 `.prose/` 디렉터리에 상태 정보를 유지함:

```text
.prose/
├── .env                # 환경 변수 설정
├── runs/               # 실행 이력 관리
│   └── {날짜}-{시간}-{난수}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/             # 에이전트 설정
```

사용자 수준의 영구 에이전트 데이터 위치: `~/.prose/agents/`

## 상태 저장 모드(State Modes)

OpenProse는 다양한 상태 백엔드를 지원함:

* **filesystem** (기본값): `.prose/runs/...` 경로에 파일로 저장.
* **in-context**: 작은 규모의 프로그램을 위한 일시적 메모리 저장 모드.
* **sqlite** (실험적): `sqlite3` 바이너리 설치 필요.
* **postgres** (실험적): `psql` 및 연결 문자열 필요.

**주의 사항:**

* SQLite 및 PostgreSQL 연동은 현재 실험적 기능임.
* PostgreSQL 사용 시 자격 증명이 하위 에이전트 로그에 노출될 수 있으므로, 최소 권한만 부여된 전용 DB 계정 사용을 권장함.

## 원격 프로그램 실행

`/prose run <핸들/슬러그>` 명령어 실행 시 `https://p.prose.md/<핸들>/<슬러그>` 경로에서 프로그램을 해석함. 직접 URL을 입력할 경우 해당 경로의 파일을 그대로 가져오며, 이때 `web_fetch` 도구(또는 POST 요청 시 `exec`)를 사용함.

## OpenClaw 런타임 매핑

OpenProse 프로그램의 개념은 OpenClaw의 하위 도구들과 다음과 같이 매핑됨:

| OpenProse 개념          | 대응하는 OpenClaw 도구 |
| --------------------- | ---------------- |
| 세션 생성 (Spawn session) | `sessions_spawn` |
| 파일 읽기/쓰기              | `read` / `write` |
| 웹 데이터 가져오기            | `web_fetch`      |

사용 중인 도구 허용 목록(Allowlist)에서 위 도구들이 차단되어 있을 경우 OpenProse 프로그램이 정상적으로 작동하지 않을 수 있음. [스킬 설정 가이드](/tools/skills-config)를 참조함.

## 보안 및 승인 정책

`.prose` 파일은 실행 가능한 코드와 동일하게 취급해야 함. 실행 전 반드시 내용을 검토하고, OpenClaw의 도구 허용 목록 및 승인 게이트(Approval Gate)를 설정하여 예상치 못한 부작용을 방지할 것을 권장함.

결정론적이고 승인 절차가 엄격한 워크플로우가 필요한 경우 [Lobster](/tools/lobster)와 비교하여 선택함.
