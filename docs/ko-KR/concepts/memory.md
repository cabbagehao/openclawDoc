---
title: "Memory"
summary: "OpenClaw 메모리가 작동하는 방식(워크스페이스 파일 + 자동 메모리 플러시)"
read_when:
  - 메모리 파일 레이아웃과 워크플로를 알고 싶을 때
  - 자동 사전 컴팩션 메모리 플러시를 조정하고 싶을 때
---

# Memory

OpenClaw 메모리는 **에이전트 워크스페이스 안의 일반 Markdown**입니다. 파일이
단일 진실 공급원이며, 모델은 디스크에 기록된 내용만 "기억"합니다.

메모리 검색 도구는 활성 메모리 플러그인(기본값: `memory-core`)이 제공합니다.
메모리 플러그인을 비활성화하려면 `plugins.slots.memory = "none"`을 사용하세요.

## 메모리 파일 (Markdown)

기본 워크스페이스 레이아웃은 두 개의 메모리 계층을 사용합니다.

- `memory/YYYY-MM-DD.md`
  - 일일 로그(append-only).
  - 세션 시작 시 오늘 + 어제를 읽습니다.
- `MEMORY.md` (선택 사항)
  - 큐레이션된 장기 메모리.
  - **메인 비공개 세션에서만 로드합니다**(그룹 컨텍스트에서는 절대 로드하지 않음).

이 파일들은 워크스페이스(`agents.defaults.workspace`, 기본값
`~/.openclaw/workspace`) 아래에 있습니다. 전체 레이아웃은
[Agent workspace](/concepts/agent-workspace)를 참고하세요.

## 메모리 도구

OpenClaw는 이 Markdown 파일을 위해 에이전트가 사용할 수 있는 두 가지 도구를
노출합니다.

- `memory_search` — 인덱싱된 스니펫에 대한 시맨틱 리콜.
- `memory_get` — 특정 Markdown 파일/줄 범위를 대상으로 읽기.

이제 `memory_get`은 **파일이 존재하지 않을 때도 정상적으로 처리됩니다**
(예를 들어 첫 기록 전 오늘의 일일 로그). 내장 관리자와 QMD 백엔드는 모두
`ENOENT`를 던지는 대신 `{ text: "", path }`를 반환하므로, 에이전트는
"아직 기록된 것이 없음"을 처리하고 도구 호출을 try/catch로 감싸지 않고도
워크플로를 계속 진행할 수 있습니다.

## 메모리를 기록해야 하는 때

- 결정, 선호도, 오래 유지되는 사실은 `MEMORY.md`에 기록합니다.
- 일상적인 메모와 진행 중인 컨텍스트는 `memory/YYYY-MM-DD.md`에 기록합니다.
- 누군가 "이걸 기억해"라고 말하면 기록하세요(RAM에만 두지 마세요).
- 이 영역은 아직 발전 중입니다. 모델에게 메모리를 저장하라고 상기시키는 것이 도움이 되며, 모델은 무엇을 해야 하는지 압니다.
- 어떤 내용을 남기고 싶다면 **봇에게 메모리에 쓰라고 요청하세요**.

## 자동 메모리 플러시 (사전 컴팩션 ping)

세션이 **자동 컴팩션에 가까워지면**, OpenClaw는 컨텍스트가 컴팩트되기
**전에** 오래 유지할 메모리를 기록하라고 모델에 상기시키는 **무음의
에이전트 턴**을 트리거합니다. 기본 프롬프트는 모델이 *응답할 수 있음*을
명시하지만, 보통은 사용자가 이 턴을 보지 않도록 `NO_REPLY`가 올바른 응답입니다.

이는 `agents.defaults.compaction.memoryFlush`로 제어됩니다.

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

세부 사항:

- **소프트 임계값**: 세션 토큰 추정치가
  `contextWindow - reserveTokensFloor - softThresholdTokens`를 넘으면 플러시가 트리거됩니다.
- 기본적으로 **무음**: 프롬프트에 `NO_REPLY`가 포함되므로 아무 것도 전달되지 않습니다.
- **두 개의 프롬프트**: 사용자 프롬프트와 시스템 프롬프트가 함께 리마인더를 추가합니다.
- **컴팩션 사이클당 한 번만 플러시**(`sessions.json`에서 추적).
- **워크스페이스는 쓰기 가능해야 함**: 세션이 `workspaceAccess: "ro"` 또는 `"none"`으로 샌드박싱되어 실행되면 플러시는 건너뜁니다.

전체 컴팩션 수명주기는
[Session management + compaction](/reference/session-management-compaction)을
참고하세요.

## 벡터 메모리 검색

OpenClaw는 `MEMORY.md`와 `memory/*.md` 위에 작은 벡터 인덱스를 구축할 수
있으므로, 표현이 달라도 시맨틱 쿼리로 관련 메모를 찾을 수 있습니다.

기본값:

- 기본적으로 활성화됩니다.
- 메모리 파일 변경을 감시합니다(debounced).
- 메모리 검색은 최상위 `memorySearch`가 아니라 `agents.defaults.memorySearch` 아래에서 구성합니다.
- 기본적으로 원격 임베딩을 사용합니다. `memorySearch.provider`가 설정되지 않으면 OpenClaw는 다음 순서로 자동 선택합니다.
  1. `memorySearch.local.modelPath`가 구성되어 있고 파일이 존재하면 `local`
  2. OpenAI 키를 확인할 수 있으면 `openai`
  3. Gemini 키를 확인할 수 있으면 `gemini`
  4. Voyage 키를 확인할 수 있으면 `voyage`
  5. Mistral 키를 확인할 수 있으면 `mistral`
  6. 그 외에는 구성될 때까지 메모리 검색이 비활성 상태로 유지됩니다.
- 로컬 모드는 node-llama-cpp를 사용하며 `pnpm approve-builds`가 필요할 수 있습니다.
- SQLite 내부 벡터 검색을 가속하기 위해 sqlite-vec(가능한 경우)를 사용합니다.
- `memorySearch.provider = "ollama"`도 로컬/셀프호스팅 Ollama 임베딩(`/api/embeddings`)에 대해 지원되지만, 자동 선택되지는 않습니다.

원격 임베딩에는 **반드시** 임베딩 제공자용 API 키가 필요합니다. OpenClaw는
인증 프로필, `models.providers.*.apiKey`, 또는 환경 변수에서 키를 해석합니다.
Codex OAuth는 채팅/완성만 다루며 메모리 검색용 임베딩 요구 사항을 **충족하지
않습니다**. Gemini에는 `GEMINI_API_KEY` 또는
`models.providers.google.apiKey`를 사용하세요. Voyage에는
`VOYAGE_API_KEY` 또는 `models.providers.voyage.apiKey`를 사용하세요.
Mistral에는 `MISTRAL_API_KEY` 또는 `models.providers.mistral.apiKey`를
사용하세요. Ollama는 일반적으로 실제 API 키가 필요하지 않으며, 로컬 정책상
필요할 때는 `OLLAMA_API_KEY=ollama-local` 같은 플레이스홀더로 충분합니다.
사용자 지정 OpenAI 호환 엔드포인트를 사용할 때는
`memorySearch.remote.apiKey`(및 선택 사항인 `memorySearch.remote.headers`)를
설정하세요.

### QMD 백엔드 (실험적)

기본 제공 SQLite 인덱서를 [QMD](https://github.com/tobi/qmd)로 바꾸려면
`memory.backend = "qmd"`를 설정하세요. QMD는 BM25 + 벡터 + 리랭킹을 결합한
로컬 우선 검색 사이드카입니다. Markdown은 계속 단일 진실 공급원으로 유지되며,
OpenClaw는 검색을 위해 QMD를 셸 호출합니다. 핵심 사항:

**사전 요구 사항**

- 기본적으로 비활성화됩니다. 설정별로 opt-in 합니다(`memory.backend = "qmd"`).
- QMD CLI는 별도로 설치해야 합니다(`bun install -g https://github.com/tobi/qmd` 또는 릴리스를 다운로드) 그리고 `qmd` 바이너리가 gateway의 `PATH`에 있어야 합니다.
- QMD는 확장을 허용하는 SQLite 빌드가 필요합니다(macOS에서는 `brew install sqlite`).
- QMD는 Bun + `node-llama-cpp`를 통해 완전히 로컬에서 실행되며, 처음 사용할 때 HuggingFace에서 GGUF 모델을 자동 다운로드합니다(별도 Ollama 데몬 불필요).
- gateway는 `XDG_CONFIG_HOME`과 `XDG_CACHE_HOME`을 설정하여 `~/.openclaw/agents/<agentId>/qmd/` 아래의 독립적인 XDG 홈에서 QMD를 실행합니다.
- OS 지원: Bun + SQLite가 설치되면 macOS와 Linux는 바로 동작합니다. Windows는 WSL2를 통해 가장 잘 지원됩니다.

**사이드카가 실행되는 방식**

- gateway는 `~/.openclaw/agents/<agentId>/qmd/` 아래에 독립적인 QMD 홈(config + cache + sqlite DB)을 작성합니다.
- 컬렉션은 `memory.qmd.paths`(및 기본 워크스페이스 메모리 파일)에서 `qmd collection add`로 생성되고, 이후 `qmd update` + `qmd embed`가 부팅 시와 구성 가능한 간격(`memory.qmd.update.interval`, 기본값 5 m)으로 실행됩니다.
- gateway는 이제 시작 시 QMD 관리자를 초기화하므로 첫 `memory_search` 호출 전에도 주기적 업데이트 타이머가 설정됩니다.
- 이제 부트 새로고침은 기본적으로 백그라운드에서 실행되므로 채팅 시작을 막지 않습니다. 이전의 블로킹 동작을 유지하려면 `memory.qmd.update.waitForBootSync = true`를 설정하세요.
- 검색은 `memory.qmd.searchMode`를 통해 실행됩니다(기본값 `qmd search --json`; `vsearch`와 `query`도 지원). 선택한 모드가 사용 중인 QMD 빌드에서 플래그를 거부하면 OpenClaw는 `qmd query`로 재시도합니다. QMD가 실패하거나 바이너리가 없으면 OpenClaw는 메모리 도구가 계속 동작하도록 자동으로 내장 SQLite 관리자로 폴백합니다.
- 현재 OpenClaw는 QMD 임베드 배치 크기 조정을 노출하지 않습니다. 배치 동작은 QMD 자체가 제어합니다.
- **첫 검색은 느릴 수 있습니다**: QMD는 첫 `qmd query` 실행 시 로컬 GGUF 모델(리랭커/쿼리 확장)을 다운로드할 수 있습니다.
  - OpenClaw는 QMD를 실행할 때 `XDG_CONFIG_HOME`/`XDG_CACHE_HOME`을 자동으로 설정합니다.
  - 모델을 수동으로 미리 다운로드하고(OpenClaw가 사용하는 동일한 인덱스를 미리 워밍업하려면) 에이전트의 XDG 디렉터리로 일회성 쿼리를 실행하세요.

    OpenClaw의 QMD 상태는 **state dir** 아래에 있습니다(기본값 `~/.openclaw`).
    OpenClaw가 사용하는 동일한 XDG 변수를 export하면 `qmd`를 정확히 같은
    인덱스로 가리킬 수 있습니다.

    ```bash
    # Pick the same state dir OpenClaw uses
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # (Optional) force an index refresh + embeddings
    qmd update
    qmd embed

    # Warm up / trigger first-time model downloads
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

**구성 표면 (`memory.qmd.*`)**

- `command` (기본값 `qmd`): 실행 파일 경로를 재정의합니다.
- `searchMode` (기본값 `search`): `memory_search`를 지원하는 QMD 명령을 선택합니다(`search`, `vsearch`, `query`).
- `includeDefaultMemory` (기본값 `true`): `MEMORY.md` + `memory/**/*.md`를 자동 인덱싱합니다.
- `paths[]`: 추가 디렉터리/파일을 더합니다(`path`, 선택 사항인 `pattern`, 선택 사항인 안정적인 `name`).
- `sessions`: 세션 JSONL 인덱싱을 opt-in 합니다(`enabled`, `retentionDays`, `exportDir`).
- `update`: 새로고침 주기와 유지보수 실행을 제어합니다.
  (`interval`, `debounceMs`, `onBoot`, `waitForBootSync`, `embedInterval`,
  `commandTimeoutMs`, `updateTimeoutMs`, `embedTimeoutMs`).
- `limits`: 리콜 페이로드를 제한합니다(`maxResults`, `maxSnippetChars`,
  `maxInjectedChars`, `timeoutMs`).
- `scope`: [`session.sendPolicy`](/gateway/configuration#session)와 동일한
  스키마입니다. 기본값은 DM 전용입니다(`deny` all, `allow` direct chats).
  그룹/채널에서 QMD hit를 노출하려면 이 설정을 완화하세요.
  - `match.keyPrefix`는 **정규화된** 세션 키와 일치합니다(소문자화되며, 선행
    `agent:<id>:`가 제거됨). 예: `discord:channel:`.
  - `match.rawKeyPrefix`는 `agent:<id>:`를 포함한 **원시** 세션 키와
    일치합니다(소문자화됨). 예: `agent:main:discord:`.
  - 레거시: `match.keyPrefix: "agent:..."`도 여전히 raw-key prefix로
    처리되지만, 명확성을 위해 `rawKeyPrefix`를 권장합니다.
- `scope`가 검색을 거부하면 OpenClaw는 파생된 `channel`/`chatType`과 함께 경고를 로깅하므로 빈 결과를 더 쉽게 디버깅할 수 있습니다.
- 워크스페이스 외부에서 가져온 스니펫은 `memory_search` 결과에서
  `qmd/<collection>/<relative-path>`로 표시되며, `memory_get`은 해당 prefix를
  이해하고 구성된 QMD 컬렉션 루트에서 읽습니다.
- `memory.qmd.sessions.enabled = true`일 때 OpenClaw는 정제된 세션 대화록(User/Assistant turn)을 `~/.openclaw/agents/<id>/qmd/sessions/` 아래의 전용 QMD 컬렉션으로 내보내므로, `memory_search`는 내장 SQLite 인덱스를 건드리지 않고도 최근 대화를 회상할 수 있습니다.
- `memory_search` 스니펫은 이제 `memory.citations`가 `auto`/`on`일 때
  `Source: <path#line>` 푸터를 포함합니다. 경로 메타데이터를 내부 전용으로
  유지하려면 `memory.citations = "off"`로 설정하세요(에이전트는 여전히
  `memory_get`용 경로를 받지만, 스니펫 텍스트에는 푸터가 빠지고 시스템
  프롬프트는 이를 인용하지 말라고 에이전트에 경고합니다).

**예시**

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [
        { action: "allow", match: { chatType: "direct" } },
        // Normalized session-key prefix (strips `agent:<id>:`).
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // Raw session-key prefix (includes `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

**인용 및 폴백**

- `memory.citations`는 백엔드와 무관하게 적용됩니다(`auto`/`on`/`off`).
- `qmd`가 실행 중일 때는 `status().backend = "qmd"`로 태그하므로, 진단 시 어떤 엔진이 결과를 제공했는지 볼 수 있습니다. QMD 하위 프로세스가 종료되거나 JSON 출력을 파싱할 수 없으면 검색 관리자는 경고를 로깅하고, QMD가 복구될 때까지 내장 제공자(기존 Markdown 임베딩)를 반환합니다.

### 추가 메모리 경로

기본 워크스페이스 레이아웃 외부의 Markdown 파일을 인덱싱하려면 명시적 경로를
추가하세요.

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

참고:

- 경로는 절대 경로 또는 워크스페이스 상대 경로일 수 있습니다.
- 디렉터리는 `.md` 파일을 재귀적으로 스캔합니다.
- Markdown 파일만 인덱싱됩니다.
- 심볼릭 링크(파일 또는 디렉터리)는 무시됩니다.

### Gemini 임베딩 (네이티브)

Gemini 임베딩 API를 직접 사용하려면 provider를 `gemini`로 설정하세요.

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

참고:

- `remote.baseUrl`은 선택 사항입니다(기본값은 Gemini API base URL).
- `remote.headers`를 사용하면 필요 시 추가 헤더를 넣을 수 있습니다.
- 기본 모델: `gemini-embedding-001`.

**사용자 지정 OpenAI 호환 엔드포인트**(OpenRouter, vLLM, 또는 proxy)를
사용하려면 OpenAI provider와 함께 `remote` 구성을 사용할 수 있습니다.

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

API 키를 설정하고 싶지 않다면 `memorySearch.provider = "local"`을 사용하거나
`memorySearch.fallback = "none"`을 설정하세요.

폴백:

- `memorySearch.fallback`은 `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local`, 또는 `none`일 수 있습니다.
- 폴백 provider는 기본 임베딩 provider가 실패할 때만 사용됩니다.

배치 인덱싱(OpenAI + Gemini + Voyage):

- 기본적으로 비활성화됩니다. 대규모 코퍼스 인덱싱을 위해 활성화하려면 `agents.defaults.memorySearch.remote.batch.enabled = true`를 설정하세요(OpenAI, Gemini, Voyage).
- 기본 동작은 배치 완료를 기다립니다. 필요하면 `remote.batch.wait`, `remote.batch.pollIntervalMs`, `remote.batch.timeoutMinutes`를 조정하세요.
- `remote.batch.concurrency`를 설정해 병렬로 제출할 배치 작업 수를 제어합니다(기본값: 2).
- 배치 모드는 `memorySearch.provider = "openai"` 또는 `"gemini"`일 때 적용되며 해당 API 키를 사용합니다.
- Gemini 배치 작업은 async embeddings batch endpoint를 사용하며 Gemini Batch API를 사용할 수 있어야 합니다.

OpenAI 배치가 빠르고 저렴한 이유:

- 대규모 백필의 경우, OpenAI는 많은 임베딩 요청을 하나의 배치 작업으로 제출하고 비동기적으로 처리하도록 맡길 수 있으므로 일반적으로 우리가 지원하는 가장 빠른 옵션입니다.
- OpenAI는 Batch API 워크로드에 할인된 가격을 제공하므로, 대규모 인덱싱 실행은 동일한 요청을 동기적으로 보내는 것보다 보통 더 저렴합니다.
- 자세한 내용은 OpenAI Batch API 문서와 가격표를 참고하세요.
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

구성 예시:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

도구:

- `memory_search` — 파일 + 줄 범위가 포함된 스니펫을 반환합니다.
- `memory_get` — 경로로 메모리 파일 내용을 읽습니다.

로컬 모드:

- `agents.defaults.memorySearch.provider = "local"`을 설정합니다.
- `agents.defaults.memorySearch.local.modelPath`(GGUF 또는 `hf:` URI)를 제공합니다.
- 선택 사항: 원격 폴백을 피하려면 `agents.defaults.memorySearch.fallback = "none"`을 설정합니다.

### 메모리 도구가 작동하는 방식

- `memory_search`는 `MEMORY.md` + `memory/**/*.md`에서 Markdown 청크(~400 토큰 목표, 80-token overlap)를 시맨틱 검색합니다. 전체 파일 페이로드는 반환하지 않고, 스니펫 텍스트(~700 chars 상한), 파일 경로, 줄 범위, 점수, provider/model, 그리고 local → remote 임베딩 폴백 여부를 반환합니다.
- `memory_get`은 특정 메모리 Markdown 파일(워크스페이스 상대 경로)을 읽으며, 선택적으로 시작 줄과 N줄 길이를 받을 수 있습니다. `MEMORY.md` / `memory/` 외부 경로는 거부됩니다.
- 두 도구는 모두 에이전트에 대해 `memorySearch.enabled`가 true로 해석될 때만 활성화됩니다.

### 무엇이 인덱싱되는가(그리고 언제)

- 파일 형식: Markdown만 (`MEMORY.md`, `memory/**/*.md`).
- 인덱스 저장소: `~/.openclaw/memory/<agentId>.sqlite`의 에이전트별 SQLite(`agents.defaults.memorySearch.store.path`로 구성 가능, `{agentId}` 토큰 지원).
- 최신성: `MEMORY.md` + `memory/`에 대한 watcher가 인덱스를 dirty로 표시합니다(debounce 1.5s). 동기화는 세션 시작 시, 검색 시, 또는 간격에 따라 예약되며 비동기로 실행됩니다. 세션 대화록은 delta threshold를 사용해 백그라운드 동기화를 트리거합니다.
- 재인덱싱 트리거: 인덱스는 임베딩 **provider/model + endpoint fingerprint + chunking params**를 저장합니다. 이 중 하나라도 바뀌면 OpenClaw는 전체 저장소를 자동으로 재설정하고 재인덱싱합니다.

### 하이브리드 검색 (BM25 + 벡터)

활성화되면 OpenClaw는 다음을 결합합니다.

- **벡터 유사도**(시맨틱 일치, 표현이 달라도 됨)
- **BM25 키워드 관련성**(ID, env var, code symbol 같은 정확한 토큰)

플랫폼에서 full-text search를 사용할 수 없으면 OpenClaw는 벡터 전용 검색으로
폴백합니다.

#### 왜 하이브리드인가?

벡터 검색은 "의미는 같은데 표현만 다른" 경우에 매우 강합니다.

- "Mac Studio gateway host" vs "the machine running the gateway"
- "debounce file updates" vs "avoid indexing on every write"

하지만 정확하고 신호가 강한 토큰에는 약할 수 있습니다.

- IDs (`a828e60`, `b3b9895a…`)
- code symbols (`memorySearch.query.hybrid`)
- error strings ("sqlite-vec unavailable")

BM25(full-text)는 그 반대입니다. 정확한 토큰에는 강하고, 바꿔 말한 표현에는
약합니다. 하이브리드 검색은 실용적인 중간 지점입니다. **두 검색 신호를 모두
사용**해 "자연어" 쿼리와 "건초더미 속 바늘" 쿼리 모두에서 좋은 결과를 얻습니다.

#### 결과를 병합하는 방법 (현재 설계)

구현 개요:

1. 양쪽에서 후보 풀을 가져옵니다.

- **벡터**: 코사인 유사도 기준 상위 `maxResults * candidateMultiplier`
- **BM25**: FTS5 BM25 rank 기준 상위 `maxResults * candidateMultiplier`(낮을수록 좋음)

2. BM25 rank를 0..1 정도의 점수로 변환합니다.

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. chunk id로 후보를 합집합한 뒤 가중 점수를 계산합니다.

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

참고:

- `vectorWeight` + `textWeight`는 설정 해석 시 1.0으로 정규화되므로, 가중치는 백분율처럼 동작합니다.
- 임베딩을 사용할 수 없거나 provider가 zero-vector를 반환해도 BM25는 계속 실행되어 키워드 일치를 반환합니다.
- FTS5를 만들 수 없으면 벡터 전용 검색을 유지합니다(하드 실패 없음).

이 방식은 "정보 검색 이론상 완벽"하진 않지만, 단순하고 빠르며 실제 메모에서
재현율/정밀도를 개선하는 경향이 있습니다. 나중에 더 정교하게 만들고 싶다면,
일반적인 다음 단계는 Reciprocal Rank Fusion (RRF) 또는 점수 정규화(min/max
또는 z-score) 후 혼합하는 것입니다.

#### 후처리 파이프라인

벡터 및 키워드 점수를 병합한 뒤에는 두 개의 선택적 후처리 단계가 결과 목록을
에이전트에 전달되기 전에 다듬습니다.

```
Vector + Keyword → Weighted Merge → Temporal Decay → Sort → MMR → Top-K Results
```

두 단계는 모두 **기본적으로 꺼져 있으며** 각각 독립적으로 활성화할 수 있습니다.

#### MMR 재정렬 (다양성)

하이브리드 검색이 결과를 반환하면 여러 청크가 유사하거나 겹치는 내용을 포함할 수 있습니다.
예를 들어 "home network setup"을 검색하면 서로 다른 일일 메모에서 거의 동일한
라우터 설정을 언급하는 스니펫 다섯 개가 반환될 수 있습니다.

**MMR (Maximal Marginal Relevance)**는 관련성과 다양성의 균형을 맞추도록 결과를 재정렬해,
상위 결과가 같은 정보를 반복하는 대신 쿼리의 서로 다른 측면을 다루도록 합니다.

작동 방식:

1. 결과는 원래 관련성 점수(벡터 + BM25 가중 점수)로 점수가 매겨집니다.
2. MMR은 `λ × relevance − (1−λ) × max_similarity_to_selected`를 최대화하는 결과를 반복적으로 선택합니다.
3. 결과 간 유사도는 토큰화된 콘텐츠의 Jaccard 텍스트 유사도로 측정합니다.

`lambda` 파라미터는 트레이드오프를 제어합니다.

- `lambda = 1.0` → 순수 관련성(다양성 패널티 없음)
- `lambda = 0.0` → 최대 다양성(관련성 무시)
- 기본값: `0.7`(균형적이며 약간 관련성에 치우침)

**예시 — 쿼리: "home network setup"**

다음 메모리 파일이 있다고 가정합니다.

```
memory/2026-02-10.md  → "Configured Omada router, set VLAN 10 for IoT devices"
memory/2026-02-08.md  → "Configured Omada router, moved IoT to VLAN 10"
memory/2026-02-05.md  → "Set up AdGuard DNS on 192.168.10.2"
memory/network.md     → "Router: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"
```

MMR 없이 — 상위 3개 결과:

```
1. memory/2026-02-10.md  (score: 0.92)  ← router + VLAN
2. memory/2026-02-08.md  (score: 0.89)  ← router + VLAN (near-duplicate!)
3. memory/network.md     (score: 0.85)  ← reference doc
```

MMR 적용(λ=0.7) — 상위 3개 결과:

```
1. memory/2026-02-10.md  (score: 0.92)  ← router + VLAN
2. memory/network.md     (score: 0.85)  ← reference doc (diverse!)
3. memory/2026-02-05.md  (score: 0.78)  ← AdGuard DNS (diverse!)
```

2월 8일의 거의 중복된 메모는 빠지고, 에이전트는 서로 다른 세 가지 정보를 얻게 됩니다.

**활성화할 때:** 특히 일일 메모가 날짜를 넘어 비슷한 정보를 자주 반복하는 경우,
`memory_search`가 중복되거나 거의 중복된 스니펫을 반환한다면 활성화하세요.

#### 시간 감쇠 (최신성 부스트)

일일 메모를 사용하는 에이전트는 시간이 지나며 수백 개의 날짜 기반 파일을 쌓게 됩니다.
감쇠가 없으면, 6개월 전의 문장이 잘 쓰인 메모가 같은 주제에 대한 어제의 업데이트보다
더 높은 순위를 차지할 수 있습니다.

**시간 감쇠**는 각 결과의 나이에 따라 점수에 지수 승수를 적용하므로, 최신 메모리가
자연스럽게 더 높은 순위를 차지하고 오래된 메모리는 점차 약해집니다.

```
decayedScore = score × e^(-λ × ageInDays)
```

여기서 `λ = ln(2) / halfLifeDays`입니다.

기본 반감기 30일 기준:

- 오늘의 메모: 원래 점수의 **100%**
- 7일 전: **~84%**
- 30일 전: **50%**
- 90일 전: **12.5%**
- 180일 전: **~1.6%**

**에버그린 파일은 감쇠되지 않습니다.**

- `MEMORY.md` (루트 메모리 파일)
- `memory/`의 날짜 없는 파일(예: `memory/projects.md`, `memory/network.md`)
- 이 파일들은 항상 정상 순위로 유지되어야 하는 오래 지속되는 참조 정보를 담고 있습니다.

**날짜가 포함된 일일 파일**(`memory/YYYY-MM-DD.md`)은 파일명에서 추출한 날짜를 사용합니다.
다른 소스(예: 세션 대화록)는 파일 수정 시간(`mtime`)으로 폴백합니다.

**예시 — 쿼리: "what's Rod's work schedule?"**

다음 메모리 파일이 있다고 가정합니다(오늘은 2월 10일).

```
memory/2025-09-15.md  → "Rod works Mon-Fri, standup at 10am, pairing at 2pm"  (148 days old)
memory/2026-02-10.md  → "Rod has standup at 14:15, 1:1 with Zeb at 14:45"    (today)
memory/2026-02-03.md  → "Rod started new team, standup moved to 14:15"        (7 days old)
```

감쇠 없이:

```
1. memory/2025-09-15.md  (score: 0.91)  ← best semantic match, but stale!
2. memory/2026-02-10.md  (score: 0.82)
3. memory/2026-02-03.md  (score: 0.80)
```

감쇠 적용(halfLife=30):

```
1. memory/2026-02-10.md  (score: 0.82 × 1.00 = 0.82)  ← today, no decay
2. memory/2026-02-03.md  (score: 0.80 × 0.85 = 0.68)  ← 7 days, mild decay
3. memory/2025-09-15.md  (score: 0.91 × 0.03 = 0.03)  ← 148 days, nearly gone
```

원시 시맨틱 일치는 가장 좋았더라도, 오래된 9월 메모는 맨 아래로 떨어집니다.

**활성화할 때:** 에이전트가 수개월치 일일 메모를 보유하고 있고, 오래되고 낡은 정보가
최근 컨텍스트보다 높은 순위를 차지한다면 활성화하세요. 반감기 30일은 일일 메모 비중이
큰 워크플로에 잘 맞습니다. 오래된 메모를 자주 참조한다면 더 크게(예: 90일) 늘리세요.

#### 구성

두 기능 모두 `memorySearch.query.hybrid` 아래에서 구성합니다.

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          // Diversity: reduce redundant results
          mmr: {
            enabled: true,    // default: false
            lambda: 0.7       // 0 = max diversity, 1 = max relevance
          },
          // Recency: boost newer memories
          temporalDecay: {
            enabled: true,    // default: false
            halfLifeDays: 30  // score halves every 30 days
          }
        }
      }
    }
  }
}
```

각 기능은 독립적으로 활성화할 수 있습니다.

- **MMR만** — 비슷한 메모는 많지만 날짜는 중요하지 않을 때 유용합니다.
- **시간 감쇠만** — 최신성이 중요하지만 결과가 이미 충분히 다양할 때 유용합니다.
- **둘 다** — 규모가 크고 오래 운영된 일일 메모 히스토리를 가진 에이전트에 권장됩니다.

### 임베딩 캐시

OpenClaw는 SQLite에 **청크 임베딩**을 캐시할 수 있으므로, 재인덱싱과 빈번한
업데이트(특히 세션 대화록)가 변경되지 않은 텍스트를 다시 임베딩하지 않아도 됩니다.

구성:

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### 세션 메모리 검색 (실험적)

선택적으로 **세션 대화록**을 인덱싱하고 `memory_search`를 통해 노출할 수 있습니다.
이 기능은 실험적 플래그 뒤에 숨겨져 있습니다.

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

참고:

- 세션 인덱싱은 **opt-in**입니다(기본적으로 꺼짐).
- 세션 업데이트는 debounce되며 delta threshold를 넘으면 **비동기적으로 인덱싱**됩니다(best-effort).
- `memory_search`는 인덱싱을 기다리며 블로킹되지 않습니다. 백그라운드 동기화가 끝날 때까지 결과가 약간 오래되었을 수 있습니다.
- 결과는 여전히 스니펫만 포함합니다. `memory_get`은 계속 메모리 파일로 제한됩니다.
- 세션 인덱싱은 에이전트별로 격리됩니다(해당 에이전트의 세션 로그만 인덱싱됨).
- 세션 로그는 디스크에 있습니다(`~/.openclaw/agents/<agentId>/sessions/*.jsonl`). 파일시스템 접근 권한이 있는 모든 프로세스/사용자는 이를 읽을 수 있으므로, 디스크 접근을 신뢰 경계로 취급하세요. 더 엄격한 격리가 필요하다면 에이전트를 별도의 OS 사용자 또는 호스트에서 실행하세요.

델타 임계값(기본값 표시):

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // JSONL lines
        }
      }
    }
  }
}
```

### SQLite 벡터 가속 (sqlite-vec)

sqlite-vec 확장을 사용할 수 있으면 OpenClaw는 임베딩을 SQLite 가상 테이블
(`vec0`)에 저장하고 데이터베이스 안에서 벡터 거리 쿼리를 수행합니다. 이렇게 하면
모든 임베딩을 JS로 불러오지 않고도 검색을 빠르게 유지할 수 있습니다.

구성(선택 사항):

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

참고:

- `enabled`의 기본값은 true이며, 비활성화되면 검색은 저장된 임베딩에 대한 in-process 코사인 유사도로 폴백합니다.
- sqlite-vec 확장이 없거나 로드에 실패하면 OpenClaw는 오류를 로깅하고 JS 폴백(벡터 테이블 없음)으로 계속 진행합니다.
- `extensionPath`는 번들된 sqlite-vec 경로를 재정의합니다(커스텀 빌드 또는 비표준 설치 경로에 유용).

### 로컬 임베딩 자동 다운로드

- 기본 로컬 임베딩 모델: `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB).
- `memorySearch.provider = "local"`일 때 `node-llama-cpp`는 `modelPath`를 해석하며, GGUF가 없으면 캐시(또는 설정된 경우 `local.modelCacheDir`)로 **자동 다운로드**한 뒤 로드합니다. 다운로드는 재시도 시 이어받습니다.
- 네이티브 빌드 요구 사항: `pnpm approve-builds`를 실행하고 `node-llama-cpp`를 선택한 다음 `pnpm rebuild node-llama-cpp`를 실행하세요.
- 폴백: 로컬 설정이 실패하고 `memorySearch.fallback = "openai"`이면 원격 임베딩으로 자동 전환되며(재정의가 없으면 `openai/text-embedding-3-small`) 그 이유도 기록됩니다.

### 사용자 지정 OpenAI 호환 엔드포인트 예시

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

참고:

- `remote.*`는 `models.providers.openai.*`보다 우선합니다.
- `remote.headers`는 OpenAI 헤더와 병합되며, 키 충돌 시 remote가 우선합니다. OpenAI 기본값을 사용하려면 `remote.headers`를 생략하세요.
