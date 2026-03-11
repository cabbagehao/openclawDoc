---
summary: "OpenClaw 시스템 프롬프트의 구성 요소 및 생성 프로세스 안내"
read_when:
  - 시스템 프롬프트 텍스트, 도구 목록, 시간/하트비트 섹션을 수정할 때
  - 워크스페이스 부트스트랩 또는 스킬 주입 동작을 변경하고자 할 때
title: "시스템 프롬프트"
x-i18n:
  source_path: "concepts/system-prompt.md"
---

# 시스템 프롬프트 (System Prompt)

OpenClaw는 매 에이전트 실행 시마다 맞춤형 시스템 프롬프트를 생성함. 이 프롬프트는 **OpenClaw가 직접 관리**하며, Pi SDK의 기본 프롬프트를 사용하지 않고 에이전트 실행 직전에 동적으로 주입됨.

## 프롬프트 구조 (Structure)

프롬프트는 효율적인 토큰 관리를 위해 다음과 같은 고정된 섹션으로 구성됨:

- **도구 (Tooling)**: 현재 사용 가능한 도구 목록 및 요약 설명.
- **보안 (Safety)**: 권한 남용 방지 및 관리자 감독 우회 금지에 대한 가이드라인.
- **스킬 (Skills)**: 필요 시 상세 스킬 지침을 동적으로 로드하는 방법.
- **자가 업데이트**: `config.apply` 및 `update.run` 명령어 실행 안내.
- **워크스페이스**: 현재 작업 디렉터리 경로 (`agents.defaults.workspace`).
- **문서 (Documentation)**: 로컬 문서 경로 및 참조 시점 안내.
- **워크스페이스 파일 (Injected)**: 주입된 부트스트랩 파일 목록.
- **샌드박스 (Sandbox)**: 샌드박스 활성화 여부, 경로 및 권한 상승 가능 여부.
- **현재 시각 및 날짜**: 사용자의 현지 시간대 정보.
- **답장 태그 (Reply Tags)**: 지원되는 공급자용 답장 태그 문법.
- **하트비트 (Heartbeats)**: 주기적 실행 지침 및 응답 규칙.
- **런타임 정보**: 호스트, OS, 노드 버전, 모델 ID, 사고 수준(Thinking Level) 등.
- **추론 가시성 (Reasoning)**: 현재 사고 과정 노출 설정 상태.

<Note>
시스템 프롬프트 내의 보안 가이드라인은 모델의 행동을 유도하기 위한 권고 사항임. 실제 정책 강제는 도구 정책, 승인 시스템, 샌드박싱, 채널 허용 목록 등 시스템 레벨의 설정을 통해 이루어져야 함.
</Note>

## 프롬프트 모드 (Prompt Modes)

상황에 따라 시스템 프롬프트의 크기를 조절할 수 있음:

- **`full` (기본값)**: 위의 모든 섹션을 포함함.
- **`minimal`**: 하위 에이전트(Sub-agents)용 모드. 스킬, 기억 소환, 자가 업데이트, 사용자 신원 정보 등을 제외하여 토큰 사용량을 최소화함. 도구, 보안, 워크스페이스, 샌드박스, 시각 및 런타임 정보는 유지됨.
- **`none`**: 기본적인 정체성 정보만 포함함.

`minimal` 모드 사용 시, 추가 주입되는 프롬프트 라벨은 **Subagent Context**로 표시됨.

## 워크스페이스 부트스트랩 주입 (Bootstrap Injection)

워크스페이스 내의 주요 지침 파일들은 **Project Context** 섹션 아래에 자동으로 포함되어, 에이전트가 별도의 읽기 동작 없이도 기본 맥락을 즉시 파악할 수 있게 함:

- `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` (최초 실행 시), `MEMORY.md`.

**주의 사항:**
- 주입된 파일들은 매 실행마다 토큰을 소비함. 특히 `MEMORY.md`가 비대해질 경우 컨텍스트 비용이 급증할 수 있으므로 항상 간결하게 유지할 것을 권장함.
- `memory/*.md` 일일 로그 파일은 **자동으로 주입되지 않음**. 에이전트가 필요할 때 `memory_search` 또는 `memory_get` 도구를 통해 직접 읽어와야 함.

**용량 제한 설정:**
- 파일별 최대 크기: `agents.defaults.bootstrapMaxChars` (기본값: 20,000자).
- 전체 주입 파일 합계: `agents.defaults.bootstrapTotalMaxChars` (기본값: 150,000자).
- 파일이 잘릴 경우 경고 메시지 표시 여부를 `bootstrapPromptTruncationWarning` 설정으로 제어 가능.

하위 에이전트 세션의 경우 컨텍스트 다이어트를 위해 `AGENTS.md`와 `TOOLS.md`만 주입됨.

## 시간 및 날짜 처리

사용자 시간대가 확인된 경우 프롬프트에 포함됨. 프롬프트 캐시 효율을 극대화하기 위해 초 단위의 실시간 시각 대신 **시간대(Timezone)** 정보만 고정하여 주입함.

에이전트가 현재 정확한 시각을 알아야 하는 경우 `session_status` 도구를 호출하도록 유도함. 상세 내용은 [날짜 및 시간 처리 가이드](/date-time) 참조.

## 스킬(Skills) 정보 제공

사용 가능한 스킬이 있을 경우, 각 스킬의 이름, 설명 및 **파일 경로**가 포함된 간결한 목록을 주입함. 에이전트는 이 목록을 보고 필요할 때만 `read` 도구를 사용하여 실제 `SKILL.md` 지침을 로드함.

```xml
<available_skills>
  <skill>
    <name>스킬이름</name>
    <description>설명</description>
    <location>파일경로</location>
  </skill>
</available_skills>
```

이 방식을 통해 기본 프롬프트 용량은 작게 유지하면서도 필요할 때만 정밀한 스킬 사용이 가능함.

## 문서 및 참조 정보

시스템 프롬프트에는 로컬 OpenClaw 문서 디렉터리 정보와 함께 공개 미러, 소스 저장소, Discord 커뮤니티, [ClawHub](https://clawhub.com) 링크가 포함됨. 에이전트는 OpenClaw의 동작 방식이나 명령어를 파악할 때 외부 지식보다 로컬 문서를 우선적으로 참조하도록 지시받음.
