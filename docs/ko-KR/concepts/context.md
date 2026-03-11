---
summary: "컨텍스트: 모델이 무엇을 보는지, 어떻게 구성되는지, 어떻게 점검하는지"
read_when:
  - OpenClaw에서 "컨텍스트"가 무엇을 의미하는지 이해하고 싶을 때
  - 모델이 무언가를 "알고" 있는 이유(또는 잊은 이유)를 디버깅할 때
  - 컨텍스트 오버헤드를 줄이고 싶을 때(`/context`, `/status`, `/compact`)
title: "컨텍스트"
---

# 컨텍스트

"컨텍스트"는 **한 번의 런을 위해 OpenClaw가 모델에 보내는 모든 것**입니다. 이는 모델의 **컨텍스트 윈도우**(토큰 한도)로 제한됩니다.

초보자를 위한 사고 모델:

- **시스템 프롬프트**(OpenClaw가 구성): 규칙, 도구, 스킬 목록, 시간/런타임, 주입된 워크스페이스 파일.
- **대화 기록**: 이 세션의 사용자 메시지 + 어시스턴트 메시지.
- **도구 호출/결과 + 첨부물**: 명령 출력, 파일 읽기, 이미지/오디오 등.

컨텍스트는 "메모리"와 _같지 않습니다_. 메모리는 디스크에 저장했다가 나중에 다시 불러올 수 있지만, 컨텍스트는 모델의 현재 윈도우 안에 들어 있는 내용입니다.

## 빠른 시작(컨텍스트 점검)

- `/status` → "내 윈도우가 얼마나 찼는가?"를 빠르게 보는 화면 + 세션 설정.
- `/context list` → 무엇이 주입되는지 + 대략적인 크기(파일별 + 총합).
- `/context detail` → 더 깊은 분해: 파일별, 도구 스키마별 크기, 스킬 엔트리별 크기, 시스템 프롬프트 크기.
- `/usage tokens` → 일반 응답 끝에 응답별 사용량 푸터 추가.
- `/compact` → 오래된 기록을 요약해 compact 엔트리로 바꾸고 윈도우 공간 확보.

참고: [슬래시 명령](/tools/slash-commands), [토큰 사용량과 비용](/reference/token-use), [압축](/concepts/compaction).

## 예시 출력

값은 모델, 프로바이더, 도구 정책, 워크스페이스 내용에 따라 달라집니다.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## 컨텍스트 윈도우에 포함되는 것

모델이 받는 모든 것이 포함됩니다. 예를 들면:

- 시스템 프롬프트(모든 섹션).
- 대화 기록.
- 도구 호출 + 도구 결과.
- 첨부물/전사본(이미지/오디오/파일).
- 압축 요약과 가지치기 산출물.
- 프로바이더 "래퍼" 또는 숨겨진 헤더(보이지 않아도 포함됨).

## OpenClaw가 시스템 프롬프트를 구성하는 방법

시스템 프롬프트는 **OpenClaw가 소유**하며 매 런마다 다시 구성됩니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 짧은 설명.
- 스킬 목록(메타데이터만, 아래 참고).
- 워크스페이스 위치.
- 시간(UTC + 설정된 경우 변환된 사용자 시간).
- 런타임 메타데이터(호스트/OS/모델/추론).
- **Project Context** 아래에 주입된 워크스페이스 부트스트랩 파일.

전체 분해: [시스템 프롬프트](/concepts/system-prompt).

## 주입되는 워크스페이스 파일(Project Context)

기본적으로 OpenClaw는 고정된 워크스페이스 파일 집합을 주입합니다(존재하는 경우).

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(첫 실행만)

큰 파일은 `agents.defaults.bootstrapMaxChars`(기본 `20000`자) 기준으로 파일별 잘라냄이 적용됩니다. OpenClaw는 또한 `agents.defaults.bootstrapTotalMaxChars`(기본 `150000`자)로 파일 전체에 대한 총 부트스트랩 주입 상한도 적용합니다. `/context`는 **원본 크기와 주입된 크기** 및 잘라냄 여부를 보여줍니다.

잘라냄이 발생하면, 런타임은 Project Context 아래에 프롬프트 내 경고 블록을 주입할 수 있습니다. 이는 `agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`; 기본 `once`)으로 설정합니다.

## 스킬: 무엇이 주입되고 무엇이 필요할 때 로드되는가

시스템 프롬프트에는 간결한 **스킬 목록**(이름 + 설명 + 위치)이 포함됩니다. 이 목록 자체도 실제 오버헤드가 있습니다.

스킬 지침은 기본적으로 포함되지 않습니다. 모델은 필요할 때만 스킬의 `SKILL.md`를 `read`할 것으로 기대됩니다.

## 도구: 비용은 두 가지

도구는 두 가지 방식으로 컨텍스트에 영향을 줍니다.

1. 시스템 프롬프트 안의 **도구 목록 텍스트**(사용자가 "Tooling"으로 보는 것).
2. **도구 스키마**(JSON). 모델이 도구를 호출할 수 있도록 함께 전송됩니다. 일반 텍스트로 보이지 않아도 컨텍스트에 포함됩니다.

`/context detail`은 가장 큰 도구 스키마를 분해해 무엇이 지배적인지 보여줍니다.

## 명령, 지시어, "인라인 단축키"

슬래시 명령은 Gateway가 처리합니다. 동작은 몇 가지로 나뉩니다.

- **독립형 명령**: 메시지가 `/...`만으로 이루어져 있으면 명령으로 실행됩니다.
- **지시어**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue`는 모델이 메시지를 보기 전에 제거됩니다.
  - 지시어만 있는 메시지는 세션 설정을 지속시킵니다.
  - 일반 메시지 안의 인라인 지시어는 메시지별 힌트로 동작합니다.
- **인라인 단축키**(허용된 발신자만): 일반 메시지 안의 특정 `/...` 토큰은 즉시 실행될 수 있으며(예: "hey /status"), 남은 텍스트를 모델이 보기 전에 제거됩니다.

자세한 내용: [슬래시 명령](/tools/slash-commands).

## 세션, 압축, 가지치기(무엇이 유지되는가)

메시지 사이에 무엇이 유지되는지는 메커니즘에 따라 달라집니다.

- **일반 기록**은 정책에 따라 compact/prune될 때까지 세션 전사본에 유지됩니다.
- **압축**은 요약을 전사본에 유지하고 최근 메시지는 그대로 둡니다.
- **가지치기**는 한 번의 런을 위한 _메모리 내_ 프롬프트에서 오래된 도구 결과를 제거하지만, 전사본 자체를 다시 쓰지는 않습니다.

문서: [세션](/concepts/session), [압축](/concepts/compaction), [세션 가지치기](/concepts/session-pruning).

기본적으로 OpenClaw는 조립과 압축에 내장 `legacy` 컨텍스트 엔진을 사용합니다.
`kind: "context-engine"`를 제공하는 플러그인을 설치하고
`plugins.slots.contextEngine`으로 선택하면, OpenClaw는 컨텍스트 조립,
`/compact`, 그리고 관련 서브에이전트 컨텍스트 수명주기 훅을 그 엔진에 위임합니다.

## `/context`가 실제로 보고하는 것

`/context`는 가능하면 최신 **런에서 구성된** 시스템 프롬프트 리포트를 우선합니다.

- `System prompt (run)` = 마지막 내장(도구 사용 가능) 런에서 캡처되어 세션 저장소에 유지된 값
- `System prompt (estimate)` = 런 리포트가 없을 때(또는 리포트를 생성하지 않는 CLI 백엔드로 실행할 때) 즉석에서 계산한 값

어느 쪽이든 크기와 주요 기여 요소를 보고할 뿐, 전체 시스템 프롬프트나 도구 스키마를 덤프하지는 않습니다.
