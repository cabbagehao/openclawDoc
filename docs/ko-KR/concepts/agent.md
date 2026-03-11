---
summary: "에이전트 런타임(내장 pi-mono), 워크스페이스 계약, 세션 부트스트랩"
read_when:
  - 에이전트 런타임, 워크스페이스 부트스트랩, 세션 동작을 변경할 때
title: "에이전트 런타임"
---

# 에이전트 런타임 🤖

OpenClaw는 **pi-mono**에서 파생된 단일 내장 에이전트 런타임을 실행합니다.

## 워크스페이스(필수)

OpenClaw는 단일 에이전트 워크스페이스 디렉터리(`agents.defaults.workspace`)를 도구와 컨텍스트의 **유일한** 작업 디렉터리(`cwd`)로 사용합니다.

권장 사항: `openclaw setup`을 사용해 `~/.openclaw/openclaw.json`이 없으면 생성하고 워크스페이스 파일을 초기화하세요.

전체 워크스페이스 레이아웃과 백업 가이드: [에이전트 워크스페이스](/concepts/agent-workspace)

`agents.defaults.sandbox`가 활성화되어 있으면, 메인이 아닌 세션은
`agents.defaults.sandbox.workspaceRoot` 아래의 세션별 워크스페이스로 이를 재정의할 수 있습니다
(자세한 내용은 [게이트웨이 설정](/gateway/configuration) 참고).

## 부트스트랩 파일(주입됨)

`agents.defaults.workspace` 내부에서 OpenClaw는 다음과 같은 사용자 편집 가능 파일을 기대합니다.

- `AGENTS.md` — 운영 지침 + "메모리"
- `SOUL.md` — 페르소나, 경계, 말투
- `TOOLS.md` — 사용자가 유지하는 도구 메모(예: `imsg`, `sag`, 관례)
- `BOOTSTRAP.md` — 최초 1회 실행용 의식(완료 후 삭제)
- `IDENTITY.md` — 에이전트 이름/분위기/이모지
- `USER.md` — 사용자 프로필 + 선호 호칭

새 세션의 첫 턴에서 OpenClaw는 이 파일들의 내용을 에이전트 컨텍스트에 직접 주입합니다.

빈 파일은 건너뜁니다. 큰 파일은 프롬프트를 가볍게 유지하기 위해 표시자와 함께 잘라내고 축약합니다(전체 내용은 파일 자체를 읽으면 됩니다).

파일이 없으면 OpenClaw는 "missing file" 표시 한 줄만 주입합니다(`openclaw setup`은 안전한 기본 템플릿도 생성합니다).

`BOOTSTRAP.md`는 **완전히 새로운 워크스페이스**(다른 부트스트랩 파일이 없음)에서만 생성됩니다. 의식을 마친 뒤 삭제했다면 이후 재시작에서 다시 생성되지 않아야 합니다.

부트스트랩 파일 생성을 완전히 끄려면(사전 시드된 워크스페이스용) 다음과 같이 설정하세요.

```json5
{ agent: { skipBootstrap: true } }
```

## 내장 도구

핵심 도구(read/exec/edit/write 및 관련 시스템 도구)는 도구 정책에 따라 항상 사용할 수 있습니다. `apply_patch`는 선택 사항이며 `tools.exec.applyPatch`로 제어됩니다. `TOOLS.md`는 어떤 도구가 존재하는지를 제어하지 않으며, 도구를 _어떻게_ 사용하길 원하는지에 대한 가이드입니다.

## 스킬

OpenClaw는 세 위치에서 스킬을 로드합니다(이름 충돌 시 워크스페이스가 우선합니다).

- 번들 포함(설치와 함께 제공)
- 관리/로컬: `~/.openclaw/skills`
- 워크스페이스: `<workspace>/skills`

스킬은 설정/환경 변수로 게이팅할 수 있습니다([게이트웨이 설정](/gateway/configuration)의 `skills` 참고).

## pi-mono 통합

OpenClaw는 pi-mono 코드베이스의 일부(모델/도구)를 재사용하지만, **세션 관리, 검색, 도구 연결은 OpenClaw가 소유**합니다.

- pi-coding 에이전트 런타임은 없습니다.
- `~/.pi/agent` 또는 `<workspace>/.pi` 설정은 참조하지 않습니다.

## 세션

세션 전사본은 다음 위치에 JSONL로 저장됩니다.

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

세션 ID는 안정적이며 OpenClaw가 선택합니다.
레거시 Pi/Tau 세션 폴더는 **읽지 않습니다**.

## 스트리밍 중 조향

큐 모드가 `steer`이면, 들어오는 메시지는 현재 실행 중인 런에 주입됩니다.
큐는 **각 도구 호출 후** 확인되며, 대기 중인 메시지가 있으면 현재 어시스턴트 메시지의 남은 도구 호출은 건너뜁니다(오류 도구 결과에 `"Skipped due to queued user message."` 표시). 그다음 다음 어시스턴트 응답 전에 대기 중인 사용자 메시지를 주입합니다.

큐 모드가 `followup` 또는 `collect`이면, 들어오는 메시지는 현재 턴이 끝날 때까지 보류되며 그 후 큐에 쌓인 페이로드로 새 에이전트 턴이 시작됩니다. 모드와 디바운스/상한 동작은 [큐](/concepts/queue)를 참고하세요.

블록 스트리밍은 완료된 어시스턴트 블록을 끝나는 즉시 전송합니다. 기본값은 **꺼짐**입니다(`agents.defaults.blockStreamingDefault: "off"`).
경계는 `agents.defaults.blockStreamingBreak`로 조정합니다(`text_end` 또는 `message_end`, 기본값은 `text_end`).
소프트 블록 청킹은 `agents.defaults.blockStreamingChunk`로 제어합니다(기본값
800-1200자, 문단 경계를 선호하고 그다음 줄바꿈, 마지막으로 문장 경계를 사용).
스트리밍 청크를 `agents.defaults.blockStreamingCoalesce`로 병합하면
한 줄짜리 메시지 남발을 줄일 수 있습니다(전송 전 유휴 시간 기반 병합). Telegram이 아닌 채널에서는 블록 응답을 켜려면 명시적으로 `*.blockStreaming: true`가 필요합니다.
자세한 도구 요약은 도구 시작 시 출력됩니다(디바운스 없음). Control UI는 가능할 때 에이전트 이벤트를 통해 도구 출력을 스트리밍합니다.
자세한 내용: [스트리밍 + 청킹](/concepts/streaming).

## 모델 ref

설정의 모델 ref(예: `agents.defaults.model`, `agents.defaults.models`)는 **첫 번째** `/`를 기준으로 분리해 파싱합니다.

- 모델 설정 시 `provider/model`을 사용하세요.
- 모델 ID 자체에 `/`가 포함되어 있다면(OpenRouter 스타일), provider 접두사를 포함해야 합니다(예: `openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 입력을 별칭 또는 **기본 provider**의 모델로 취급합니다(모델 ID에 `/`가 없을 때만 동작).

## 설정(최소)

최소한 다음을 설정하세요.

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`(강력 권장)

---

_다음: [그룹 채팅](/channels/group-messages)_ 🦞
