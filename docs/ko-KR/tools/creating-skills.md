---
title: "스킬 만들기"
summary: "SKILL.md로 커스텀 워크스페이스 스킬을 빌드하고 테스트합니다"
read_when:
  - 워크스페이스에서 새로운 커스텀 스킬을 만들고 있습니다
  - SKILL.md 기반 스킬을 위한 빠른 시작 워크플로가 필요합니다
---

# 커스텀 스킬 만들기 🛠

OpenClaw는 쉽게 확장할 수 있도록 설계되었습니다. "스킬"은 어시스턴트에 새로운 기능을 추가하는 기본 방식입니다.

## 스킬이란 무엇인가요?

스킬은 `SKILL.md` 파일(LLM에 대한 지침과 도구 정의를 제공함)을 포함하고, 선택적으로 일부 스크립트나 리소스를 포함하는 디렉터리입니다.

## 단계별 안내: 첫 번째 스킬 만들기

### 1. 디렉터리 만들기

스킬은 워크스페이스에 있으며, 보통 `~/.openclaw/workspace/skills/` 아래에 있습니다. 스킬을 위한 새 폴더를 만드세요:

```bash
mkdir -p ~/.openclaw/workspace/skills/hello-world
```

### 2. `SKILL.md` 정의하기

해당 디렉터리에 `SKILL.md` 파일을 만드세요. 이 파일은 메타데이터에 YAML 프런트매터를 사용하고, 지침에는 Markdown을 사용합니다.

```markdown
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill

When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

### 3. 도구 추가하기 (선택 사항)

프런트매터에 커스텀 도구를 정의하거나, 에이전트가 기존 시스템 도구(`bash` 또는 `browser` 등)를 사용하도록 지시할 수 있습니다.

### 4. OpenClaw 새로 고침

에이전트에게 "refresh skills"를 요청하거나 게이트웨이를 재시작하세요. OpenClaw가 새 디렉터리를 발견하고 `SKILL.md`를 인덱싱합니다.

## 모범 사례

- **간결하게 작성하세요**: 모델에게 AI처럼 행동하는 법이 아니라 _무엇을_ 해야 하는지 지시하세요.
- **안전을 우선하세요**: 스킬이 `bash`를 사용한다면, 신뢰할 수 없는 사용자 입력으로부터 임의 명령 주입이 가능하지 않도록 프롬프트를 점검하세요.
- **로컬에서 테스트하세요**: 테스트하려면 `openclaw agent --message "use my new skill"`를 사용하세요.

## 공유 스킬

[ClawHub](https://clawhub.com)에서 스킬을 찾아보거나 기여할 수도 있습니다.
