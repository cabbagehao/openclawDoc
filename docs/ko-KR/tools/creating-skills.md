---
title: "Creating Skills"
summary: "SKILL.md로 custom workspace skill을 만들고 테스트하는 방법을 설명합니다."
description: "OpenClaw workspace에서 새 skill 디렉터리를 만들고 `SKILL.md`를 작성해 custom skill을 등록하고 테스트하는 빠른 흐름을 안내합니다."
read_when:
  - workspace에서 새로운 custom skill을 만들고 있을 때
  - SKILL.md 기반 skill의 빠른 시작 workflow가 필요할 때
x-i18n:
  source_path: "tools/creating-skills.md"
---

# 커스텀 스킬 만들기 🛠

OpenClaw는 쉽게 확장할 수 있도록 설계되었습니다. "skill"은 assistant에 새로운 기능을 추가하는 기본 방식입니다.

## 스킬이란 무엇인가요?

skill은 `SKILL.md` 파일(LLM에 대한 지침과 tool 정의를 제공함)을 포함하고, 선택적으로 script나 resource를 포함하는 디렉터리입니다.

## 단계별 안내: 첫 번째 스킬 만들기

### 1. 디렉터리 만들기

skill은 workspace에 있으며, 보통 `~/.openclaw/workspace/skills/` 아래에 있습니다. 새 폴더를 만드세요.

```bash
mkdir -p ~/.openclaw/workspace/skills/hello-world
```

### 2. `SKILL.md` 정의하기

해당 디렉터리에 `SKILL.md` 파일을 만드세요. 이 파일은 metadata에 YAML frontmatter를 쓰고, instruction에는 Markdown을 사용합니다.

```markdown
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill

When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

### 3. 도구 추가하기 (선택 사항)

frontmatter에 custom tool을 정의하거나, agent가 기존 system tool(`bash`, `browser` 등)을 사용하도록 지시할 수 있습니다.

### 4. OpenClaw 새로 고침

agent에게 `"refresh skills"`를 요청하거나 gateway를 재시작하세요. OpenClaw가 새 디렉터리를 발견하고 `SKILL.md`를 index합니다.

## 모범 사례

- **간결하게 작성하세요**: 모델에게 AI처럼 행동하는 법이 아니라 _무엇을_ 해야 하는지 지시하세요.
- **안전을 우선하세요**: skill이 `bash`를 사용한다면, 신뢰할 수 없는 사용자 입력으로 임의 명령 주입이 가능하지 않도록 prompt를 점검하세요.
- **로컬에서 테스트하세요**: `openclaw agent --message "use my new skill"`로 테스트하세요.

## 공유 스킬

[ClawHub](https://clawhub.com)에서 skill을 찾아보거나 기여할 수도 있습니다.
