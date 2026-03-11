---
summary: "훅(Hooks): 에이전트 명령어 및 라이프사이클 이벤트에 반응하는 이벤트 기반 자동화 시스템"
read_when:
  - /new, /reset, /stop 명령어 또는 에이전트 라이프사이클 이벤트 발생 시 자동화 작업을 수행하고자 할 때
  - 새로운 훅을 개발, 설치하거나 관련 문제를 디버깅해야 할 때
title: "훅 (Hooks)"
x-i18n:
  source_path: "automation/hooks.md"
---

# 훅 (Hooks)

훅은 에이전트 명령어 및 각종 이벤트에 반응하여 특정 동작을 수행하는 확장 가능한 이벤트 기반 자동화 시스템임. 훅은 지정된 디렉터리에서 자동으로 탐색(Discovery)되며, OpenClaw의 스킬(Skills)과 유사한 방식으로 CLI를 통해 관리할 수 있음.

## 개념 이해

훅은 특정 상황(이벤트)이 발생했을 때 실행되는 작은 스크립트임. 크게 두 종류로 나뉨:

* **내부 훅 (Internal Hooks)** (본 페이지): `/new`, `/reset`, `/stop` 또는 라이프사이클 이벤트 발생 시 Gateway 내부에서 실행됨.
* **웹훅 (Webhooks)**: 외부 시스템이 OpenClaw의 작업을 트리거할 수 있게 하는 HTTP 엔드포인트임. [웹훅 가이드](/automation/webhook)를 참조하거나 `openclaw webhooks` 명령어를 통해 Gmail 헬퍼 등을 활용할 수 있음.

또한, 훅은 플러그인 내부에 포함되어 제공될 수도 있음. [플러그인 훅 가이드](/tools/plugin#plugin-hooks) 참조.

**주요 활용 사례:**

* 세션 초기화 시 현재까지의 대화 맥락을 기억(Memory)에 스냅샷으로 저장.
* 규정 준수나 디버깅을 위해 모든 명령어 실행 이력(Audit trail)을 기록.
* 세션 시작 또는 종료 시 후속 자동화 작업 트리거.
* 특정 이벤트 발생 시 워크스페이스에 파일을 생성하거나 외부 API 호출.

TypeScript 함수를 작성할 수 있다면 누구나 자신만의 훅을 만들 수 있음. 훅은 시스템에 의해 자동으로 발견되며 CLI를 통해 활성화/비활성화 가능함.

## 시작하기

### 내장 훅 (Bundled Hooks)

OpenClaw는 즉시 사용 가능한 네 가지 내장 훅을 제공함:

* **💾 `session-memory`**: `/new` 명령어 실행 시 에이전트 워크스페이스(기본: `~/.openclaw/workspace/memory/`)에 현재 세션 맥락을 저장함.
* **📎 `bootstrap-extra-files`**: 에이전트 부트스트랩 단계(`agent:bootstrap`)에서 설정된 패턴에 맞는 추가 워크스페이스 파일들을 동적으로 주입함.
* **📝 `command-logger`**: 발생하는 모든 명령어 이벤트를 `~/.openclaw/logs/commands.log` 파일에 기록함.
* **🚀 `boot-md`**: Gateway 시작 시 워크스페이스의 `BOOT.md` 파일을 실행함 (내부 훅 활성화 필요).

**기본 명령어:**

```bash
# 사용 가능한 훅 목록 조회
openclaw hooks list

# 특정 훅 활성화
openclaw hooks enable session-memory

# 훅 준비 상태 점검
openclaw hooks check

# 훅 상세 정보 확인
openclaw hooks info session-memory
```

### 온보딩 (Onboarding)

초기 설정(`openclaw onboard`) 과정에서 권장 훅을 선택하여 활성화할 수 있는 단계가 포함되어 있음.

## 훅 탐색 (Discovery)

시스템은 다음 세 경로에서 순차적으로 훅을 탐색함 (위쪽 경로가 높은 우선순위를 가짐):

1. **워크스페이스 훅**: `<workspace>/hooks/` (에이전트별 전용 훅)
2. **관리형 훅**: `~/.openclaw/hooks/` (사용자 설치 훅, 여러 에이전트가 공유)
3. **내장 훅**: `<openclaw>/dist/hooks/bundled/` (OpenClaw 설치 시 포함됨)

관리형 훅 디렉터리는 **단일 훅** 폴더이거나 여러 훅을 포함한 **훅 팩(Hook Pack)** 패키지일 수 있음.

**훅 디렉터리 구조:**

```
my-hook/
├── HOOK.md          # 메타데이터 및 문서
└── handler.ts       # 실제 핸들러 구현 코드
```

## 훅 팩 (Hook Packs - npm/Archives)

훅 팩은 `package.json`의 `openclaw.hooks` 필드를 통해 하나 이상의 훅을 내보내는 표준 npm 패키지임.

```bash
openclaw hooks install <경로-또는-이름>
```

**설치 규칙:**

* **npm 설치**: 레지스트리에 등록된 패키지 명과 버전/태그만 허용됨 (Git/URL/파일 직접 지정 불가).
* **버전 정책**: `@latest` 지정 시 안정(Stable) 버전을 우선함. 프리릴리스 버전은 명시적인 태그(`@beta` 등)가 필요함.
* **보안**: 의존성 설치 시 `--ignore-scripts` 옵션이 적용됨. 가급적 순수 JS/TS 환경에서 작동하는 패키지 사용을 권장함.

## 훅 구조 상세

### `HOOK.md` 형식

YAML 프런트매터(Frontmatter)와 마크다운 문서로 구성됨:

```markdown
---
name: my-hook
description: "훅 기능에 대한 간략한 설명"
homepage: https://example.com/my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook
상세 설명 및 가이드...
```

### 메타데이터 필드 (`metadata.openclaw`)

* **`emoji`**: CLI 표시용 아이콘.
* **`events`**: 수신 대기할 이벤트 배열 (예: `["command:new", "command:reset"]`).
* **`export`**: 모듈에서 사용할 익스포트 이름 (기본값: `"default"`).
* **`requires`**: 실행에 필요한 요구 사항 (바이너리, 환경 변수, 설정값, OS 등).

### 핸들러 구현 (`handler.ts`)

`HookHandler` 함수를 익스포트해야 함:

```typescript
const myHandler = async (event) => {
  // 'new' 명령어 이벤트인 경우에만 처리
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // 사용자에게 피드백 메시지 추가 (선택 사항)
  event.messages.push("✨ 커스텀 훅이 실행되었습니다!");
};

export default myHandler;
```

## 주요 이벤트 유형

### 명령어 이벤트 (Command Events)

* **`command:new`**: `/new` 실행 시.
* **`command:reset`**: `/reset` 실행 시.
* **`command:stop`**: `/stop` 실행 시.

### 세션 이벤트 (Session Events)

* **`session:compact:before`**: 대화 이력 압축(Compaction) 직전.
* **`session:compact:after`**: 압축 완료 후 요약 데이터와 함께 발생.

### 메시지 이벤트 (Message Events)

* **`message:received`**: 메시지 수신 직후 (미디어 처리 전).
* **`message:transcribed`**: 오디오 전사 및 링크 분석 완료 후.
* **`message:preprocessed`**: 모든 정보 보강이 완료되어 에이전트(LLM)에게 전달되기 직전.
* **`message:sent`**: 발신 메시지가 성공적으로 전송되었을 때.

## 커스텀 훅 생성 가이드

1. **위치 선정**: 특정 에이전트 전용이면 워크스페이스 하위에, 공용이면 `~/.openclaw/hooks/` 하위에 폴더를 생성함.
2. **`HOOK.md` 작성**: 이름, 설명, 트리거 이벤트를 정의함.
3. **`handler.ts` 작성**: 수행할 비즈니스 로직을 구현함.
4. **활성화 및 테스트**:
   * `openclaw hooks list` 명령어로 탐색 여부 확인.
   * `openclaw hooks enable <이름>` 명령어로 활성화.
   * **Gateway 서버 재시작** (필수).
   * 채팅 채널에서 해당 이벤트를 발생시켜 동작 확인.

## 설정 관리

**권장 설정 형식:**

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "my-hook": { 
          "enabled": true,
          "env": { "CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

## 모범 사례 (Best Practices)

* **성능 최적화**: 훅은 명령어 처리 흐름 내에서 실행되므로 가급적 가볍게 유지해야 함. 무거운 작업은 백그라운드(`void`)로 실행함.
* **오류 처리**: 훅 내부의 예외가 전체 시스템이나 다른 훅의 실행을 방해하지 않도록 반드시 `try-catch` 블록으로 감싸야 함.
* **이벤트 필터링**: 핸들러 진입 시 관련 없는 이벤트는 조기 반환(`return early`) 처리함.
* **정밀한 이벤트 지정**: 메타데이터에 `command`와 같은 광범위한 키 대신 `command:new`와 같이 구체적인 키를 사용하는 것이 오버헤드를 줄이는 데 효과적임.

## 문제 해결 (Troubleshooting)

* **탐색 실패**: 폴더 구조와 `HOOK.md` 파일의 YAML 형식이 올바른지 확인함.
* **실행 안 됨**: 훅이 활성화 상태(`✓` 표시)인지 확인하고, 반드시 Gateway를 재시작함.
* **조건 미충족**: `openclaw hooks info <이름>` 명령어를 통해 누락된 바이너리나 환경 변수가 있는지 점검함.
* **코드 오류**: `clawlog.sh` (macOS) 또는 `~/.openclaw/gateway.log`를 통해 실행 중 발생하는 에러 로그를 확인함.
