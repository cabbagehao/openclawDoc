---
summary: "에이전트 런타임(내장 pi-mono), 워크스페이스 계약, 세션 부트스트랩"
read_when:
  - 에이전트 런타임, 워크스페이스 부트스트랩, 세션 동작을 변경할 때
title: "에이전트 런타임"
---

# 에이전트 런타임 🤖

OpenClaw는 **pi-mono**에서 파생된 단일 내장 에이전트 런타임을 사용합니다.

## 워크스페이스 (필수)

OpenClaw는 단일 에이전트 워크스페이스 디렉터리(`agents.defaults.workspace`)를 도구와 컨텍스트를 위한 **유일한** 작업 디렉터리(`cwd`)로 사용합니다.

권장 사항: `openclaw setup` 명령어를 사용하여 `~/.openclaw/openclaw.json` 파일이 없는 경우 생성하고 워크스페이스 파일을 초기화하세요.

전체 워크스페이스 구조와 백업 가이드는 [에이전트 워크스페이스](/concepts/agent-workspace)를 참조하세요.

`agents.defaults.sandbox` 기능이 활성화된 경우, 메인 세션이 아닌 개별 세션은 `agents.defaults.sandbox.workspaceRoot` 하위의 세션별 워크스페이스로 이를 재정의할 수 있습니다. 자세한 내용은 [게이트웨이 설정](/gateway/configuration)을 참고하세요.

## 부트스트랩 파일 (자동 주입)

OpenClaw는 `agents.defaults.workspace` 내부에서 다음과 같은 사용자가 편집 가능한 파일들을 참조합니다.

* `AGENTS.md`: 운영 지침 및 "메모리"
* `SOUL.md`: 페르소나, 규칙, 말투 정의
* `TOOLS.md`: 사용자가 관리하는 도구 사용법 메모 (예: `imsg`, `sag`, 관례 등)
* `BOOTSTRAP.md`: 최초 실행 시 1회 수행되는 절차 (완료 후 삭제됨)
* `IDENTITY.md`: 에이전트 이름, 분위기, 이모지 설정
* `USER.md`: 사용자 프로필 및 선호하는 호칭

새로운 세션의 첫 번째 턴에서 OpenClaw는 이 파일들의 내용을 에이전트 컨텍스트에 직접 주입합니다.

내용이 없는 빈 파일은 무시됩니다. 파일 크기가 너무 큰 경우, 프롬프트를 가볍게 유지하기 위해 특정 표시자와 함께 내용을 축약합니다 (전체 내용은 파일 자체를 통해 확인할 수 있습니다).

파일이 존재하지 않는 경우 OpenClaw는 "missing file" 표시를 한 줄 주입하며, `openclaw setup` 실행 시 안전한 기본 템플릿이 생성됩니다.

`BOOTSTRAP.md`는 **완전히 새로운 워크스페이스** (다른 부트스트랩 파일이 없는 상태)에서만 생성됩니다. 초기 절차를 마친 뒤 이 파일을 삭제하면, 이후 재시작 시 다시 생성되지 않습니다.

부트스트랩 파일 자동 생성을 완전히 비활성화하려면 (이미 준비된 워크스페이스를 사용하는 경우) 다음과 같이 설정하세요.

```json5
{ agent: { skipBootstrap: true } }
```

## 내장 도구

핵심 도구(읽기/실행/편집/쓰기 및 관련 시스템 도구)는 설정된 정책에 따라 항상 사용할 수 있습니다. `apply_patch` 도구는 선택 사항이며 `tools.exec.applyPatch` 설정으로 사용 여부를 제어합니다. `TOOLS.md` 파일은 실제 도구의 존재 여부를 결정하지 않으며, 에이전트가 도구를 **어떻게** 사용해야 하는지에 대한 가이드를 제공합니다.

## 스킬 (Skills)

OpenClaw는 다음 세 가지 위치에서 스킬을 로드합니다. 이름이 충돌하는 경우 워크스페이스 내의 스킬이 우선순위를 가집니다.

* 기본 내장 스킬 (프로그램 설치 시 함께 제공됨)
* 관리형/로컬 스킬: `~/.openclaw/skills`
* 워크스페이스 전용 스킬: `<workspace>/skills`

스킬은 설정 또는 환경 변수를 통해 활성화 여부를 제어할 수 있습니다. 자세한 내용은 [게이트웨이 설정](/gateway/configuration)의 `skills` 항목을 참조하세요.

## pi-mono 통합

OpenClaw는 pi-mono 코드베이스의 일부(모델 및 도구 인터페이스)를 재사용하지만, **세션 관리, 도구 연결 및 연동은 OpenClaw가 직접 제어합니다.**

* pi-coding 에이전트 런타임은 사용되지 않습니다.
* `~/.pi/agent` 또는 `<workspace>/.pi` 설정 파일은 참조하지 않습니다.

## 세션 (Sessions)

세션 기록은 다음 위치에 JSONL 형식으로 저장됩니다.

* `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

세션 ID는 고정된 값을 가지며 OpenClaw가 자동으로 할당합니다. 기존 Pi 또는 Tau의 세션 폴더는 읽어오지 않습니다.

## 스트리밍 중 제어 (Steering)

큐(Queue) 모드가 `steer`로 설정된 경우, 새로 들어오는 메시지는 현재 실행 중인 프로세스에 즉시 주입됩니다. **각 도구 호출이 끝날 때마다** 대기 중인 메시지가 있는지 확인하며, 메시지가 있는 경우 현재 어시스턴트 메시지의 남은 도구 호출을 건너뜁니다 (이때 도구 실행 결과에는 `"Skipped due to queued user message."`라는 메시지가 기록됩니다). 이후 다음 어시스턴트 응답이 시작되기 전에 대기 중이던 사용자 메시지를 주입합니다.

큐 모드가 `followup` 또는 `collect`인 경우, 현재 턴이 완전히 끝날 때까지 메시지 주입을 보류하며, 턴 종료 후 큐에 쌓인 데이터로 새로운 에이전트 턴을 시작합니다. 모드별 상세 동작 및 디바운스(Debounce) 설정은 [큐(Queue)](/concepts/queue) 문서를 참조하세요.

블록 스트리밍(Block streaming)은 어시스턴트가 생성한 블록 단위의 응답을 완료 즉시 전송하는 방식입니다. 이 기능은 기본적으로 비활성화되어 있습니다 (`agents.defaults.blockStreamingDefault: "off"`). 전송 경계는 `agents.defaults.blockStreamingBreak` 설정을 통해 `text_end` 또는 `message_end` (기본값: `text_end`) 중 선택할 수 있습니다.

청킹(Chunking) 제어는 `agents.defaults.blockStreamingChunk` 설정을 사용합니다 (기본값: 800\~1200자. 문단 구분선을 우선하며, 그 다음 줄바꿈, 문장 마침표 순으로 분할 기준을 적용합니다). `agents.defaults.blockStreamingCoalesce` 설정을 통해 짧은 청크들을 병합하여 불필요한 메시지 전송 횟수를 줄일 수 있습니다. 텔레그램을 제외한 채널에서 블록 단위 응답을 사용하려면 각 채널 설정에 `*.blockStreaming: true`를 명시적으로 설정해야 합니다.

상세한 도구 실행 요약은 도구 실행 시작 시점에 즉시 전송됩니다. 제어 UI(Control UI)에서는 에이전트 이벤트를 통해 도구 출력을 실시간으로 스트리밍할 수 있습니다. 자세한 내용은 [스트리밍 및 청킹](/concepts/streaming) 문서를 참조하세요.

## 모델 참조 (Model refs)

설정 파일의 모델 참조(예: `agents.defaults.model`, `agents.defaults.models`)는 첫 번째 나타나는 `/` 기호를 기준으로 파싱됩니다.

* 모델을 설정할 때는 `제공업체/모델명` 형식을 사용하세요.
* 모델 ID 자체에 `/`가 포함된 경우(예: OpenRouter 스타일), 반드시 제공업체 접두사를 포함해야 합니다 (예: `openrouter/moonshotai/kimi-k2`).
* 제공업체명을 생략하는 경우 OpenClaw는 이를 별칭(Alias)으로 간주하거나 **기본 제공업체**의 모델로 처리합니다 (이 방식은 모델 ID에 `/`가 없는 경우에만 유효합니다).

## 최소 설정 사항

최소한 다음 항목들은 설정되어 있어야 합니다.

* `agents.defaults.workspace`
* `channels.whatsapp.allowFrom` (강력 권장)

***

*다음 읽어볼 거리: [그룹 채팅](/channels/group-messages)* 🦞
