---
title: "Memory"
summary: "How OpenClaw memory works (workspace files + automatic memory flush)"
description: "workspace Markdown file, automatic memory flush, vector search, QMD backend까지 포함한 OpenClaw memory 동작을 설명합니다."
read_when:
  - memory file layout과 workflow를 알고 싶을 때
  - automatic pre-compaction memory flush를 조정하려고 할 때
x-i18n:
  source_path: "concepts/memory.md"
---

# Memory

OpenClaw memory는 **agent workspace 안의 일반 Markdown**입니다. file 자체가 source of
truth이며, model은 disk에 기록된 내용만 "기억"할 수 있습니다.

memory search tool은 활성 memory plugin이 제공합니다
(기본값: `memory-core`). memory plugin을 끄려면
`plugins.slots.memory = "none"`을 사용하세요.

## Memory files (Markdown)

기본 workspace layout은 두 개의 memory layer를 사용합니다.

- `memory/YYYY-MM-DD.md`
  - daily log
    (append-only)
  - session 시작 시 오늘 + 어제 file을 읽습니다
- `MEMORY.md`
  (optional)
  - 정제된 long-term memory
  - **main private session에서만 load**
    (group context에서는 절대 load하지 않음)

이 file들은 workspace
(`agents.defaults.workspace`, 기본값 `~/.openclaw/workspace`) 아래에 있습니다.
전체 layout은 [Agent workspace](/concepts/agent-workspace)를 참고하세요.

## Memory tools

OpenClaw는 이 Markdown file에 대해 agent-facing tool 두 개를 제공합니다.

- `memory_search`
  — indexed snippet에 대한 semantic recall
- `memory_get`
  — 특정 Markdown file/line range를 정확히 읽기

`memory_get`은 file이 없어도 **graceful degradation**을 지원합니다.
예를 들어 오늘 daily log가 아직 없더라도 error를 던지지 않고
`{ text: "", path }`를 반환합니다. builtin manager와 QMD backend 모두 `ENOENT` 대신
빈 결과를 반환하므로, agent는 "아직 기록된 것이 없음"을 자연스럽게 처리할 수 있습니다.

## When to write memory

- decision, preference, durable fact는 `MEMORY.md`에 기록
- 일상 노트와 진행 중 context는 `memory/YYYY-MM-DD.md`에 기록
- 누군가 "remember this"라고 말하면 file에 적어 두세요
  (RAM에만 두지 말 것)
- 이 영역은 아직 진화 중입니다. model에게 memory를 저장하라고 상기시키는 편이 도움이
  됩니다. 그러면 model은 보통 무엇을 해야 할지 압니다
- 뭔가를 오래 남기고 싶다면 **bot에게 memory에 쓰라고 직접 요청**하세요

## Automatic memory flush (pre-compaction ping)

session이 **auto-compaction에 가까워지면**, OpenClaw는 context가 compact되기 **전**에
durable memory를 쓰라고 model에게 상기시키는 **silent, agentic turn**을 실행합니다.
기본 prompt는 model이 _답할 수 있다_고 말하지만, 보통은 `NO_REPLY`가 정답이므로 user는
이 turn을 보지 않습니다.

이 기능은 `agents.defaults.compaction.memoryFlush`로 제어합니다.

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

Details:

- **Soft threshold:**
  session token estimate가
  `contextWindow - reserveTokensFloor - softThresholdTokens`를 넘으면 trigger
- **Silent by default:**
  prompt에 `NO_REPLY`가 포함되어 deliver되지 않음
- **Two prompts:**
  user prompt + system prompt가 함께 reminder를 추가
- **One flush per compaction cycle**
  (`sessions.json`에 추적)
- **Workspace must be writable:**
  session이 sandbox 안에서 `workspaceAccess: "ro"` 또는 `"none"`이면 flush를 skip

전체 compaction lifecycle은
[Session management + compaction](/reference/session-management-compaction)을
보세요.

## Vector memory search

OpenClaw는 `MEMORY.md`와 `memory/*.md`에 대해 작은 vector index를 만들 수 있어,
표현이 달라도 의미상 관련된 note를 찾을 수 있습니다.

Defaults:

- 기본적으로 enabled
- memory file 변화를 watch하고 debounce함
- memory search 설정은 top-level `memorySearch`가 아니라
  `agents.defaults.memorySearch` 아래에 둡니다
- 기본적으로 remote embedding을 사용합니다.
  `memorySearch.provider`가 설정되지 않으면 OpenClaw는 다음 순서로 자동 선택합니다
  1. `memorySearch.local.modelPath`가 있고 file이 존재하면 `local`
  2. OpenAI key를 찾을 수 있으면 `openai`
  3. Gemini key를 찾을 수 있으면 `gemini`
  4. Voyage key를 찾을 수 있으면 `voyage`
  5. Mistral key를 찾을 수 있으면 `mistral`
  6. 그 외에는 설정될 때까지 memory search 비활성화
- local mode는 `node-llama-cpp`를 사용하며 `pnpm approve-builds`가 필요할 수 있음
- 가능하면 SQLite 안에서 vector search를 가속하기 위해 sqlite-vec를 사용
- `memorySearch.provider = "ollama"`도 지원하며 local/self-hosted Ollama embeddings
  (`/api/embeddings`)에 사용 가능하지만, 자동 선택되지는 않음

remote embedding은 embedding provider의 API key가 **필수**입니다.
OpenClaw는 auth profile, `models.providers.*.apiKey`, environment variable에서 key를
해석합니다. Codex OAuth는 chat/completions만 처리하므로 memory search embedding에는
사용할 수 없습니다. Gemini는 `GEMINI_API_KEY` 또는
`models.providers.google.apiKey`를 사용하세요. Voyage는 `VOYAGE_API_KEY` 또는
`models.providers.voyage.apiKey`, Mistral은 `MISTRAL_API_KEY` 또는
`models.providers.mistral.apiKey`를 사용합니다. Ollama는 보통 실제 API key가 필요하지
않으며, local policy가 필요할 때는 `OLLAMA_API_KEY=ollama-local` 같은 placeholder면
충분합니다. custom OpenAI-compatible endpoint를 쓸 때는
`memorySearch.remote.apiKey`
(필요하면 `memorySearch.remote.headers`)를 설정하세요.

### QMD backend (experimental)

`memory.backend = "qmd"`로 설정하면 builtin SQLite indexer 대신
[QMD](https://github.com/tobi/qmd)를 사용할 수 있습니다.
QMD는 BM25 + vector + reranking을 결합한 local-first search sidecar입니다.
Markdown은 여전히 source of truth이고, OpenClaw는 retrieval을 위해 QMD를 shell-out해
호출합니다.

**Prereqs**

- 기본 비활성화. config에서 `memory.backend = "qmd"`로 opt in
- QMD CLI를 별도로 설치하고
  (`bun install -g https://github.com/tobi/qmd` 또는 release download)
  gateway의 `PATH`에 `qmd` binary가 있어야 함
- QMD는 extension을 허용하는 SQLite build가 필요
  (macOS에서는 `brew install sqlite`)
- QMD는 Bun + `node-llama-cpp`로 완전히 local에서 동작하고, 처음 사용할 때
  HuggingFace에서 GGUF model을 자동 다운로드
  (별도 Ollama daemon 불필요)
- gateway는 `~/.openclaw/agents/<agentId>/qmd/` 아래의 self-contained XDG home에서
  QMD를 실행하며 `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`를 설정
- OS support:
  macOS와 Linux는 Bun + SQLite만 설치되면 바로 동작.
  Windows는 WSL2가 가장 잘 지원됨

**How the sidecar runs**

- gateway는 `~/.openclaw/agents/<agentId>/qmd/` 아래에 self-contained QMD home을
  씁니다
  (config + cache + sqlite DB)
- collection은 `memory.qmd.paths`
  (그리고 기본 workspace memory file)에서 `qmd collection add`로 생성되고,
  이후 boot와 주기적 interval
  (`memory.qmd.update.interval`, 기본 5m)마다
  `qmd update` + `qmd embed`를 실행합니다
- gateway는 startup에서 QMD manager를 초기화하므로 첫 `memory_search` 전에 periodic
  update timer도 arm됩니다
- boot refresh는 기본적으로 background에서 실행되어 chat startup을 막지 않습니다.
  이전처럼 blocking behavior를 원하면 `memory.qmd.update.waitForBootSync = true`
- search는 `memory.qmd.searchMode`
  (기본 `qmd search --json`; `vsearch`, `query`도 지원)로 실행됩니다.
  선택한 mode가 현재 QMD build의 flag를 거부하면 OpenClaw는 `qmd query`로 retry합니다.
  QMD가 실패하거나 binary가 없으면 builtin SQLite manager로 자동 fallback하여
  memory tool이 계속 동작합니다
- OpenClaw는 현재 QMD embed batch-size tuning을 노출하지 않습니다.
  batch 동작은 QMD가 스스로 제어합니다
- **첫 search는 느릴 수 있음:**
  첫 `qmd query` 시 reranker/query expansion용 GGUF model을 다운로드할 수 있습니다
  - OpenClaw는 QMD 실행 시 `XDG_CONFIG_HOME`/`XDG_CACHE_HOME`를 자동 설정합니다
  - model을 미리 받아 두고 같은 index를 warm up하려면, agent의 XDG dir를 export한 뒤
    one-off query를 실행하면 됩니다

    OpenClaw의 QMD state는 **state dir**
    (기본 `~/.openclaw`) 아래에 있습니다.
    같은 XDG var를 export하면 `qmd`가 정확히 같은 index를 사용합니다

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

**Config surface (`memory.qmd.*`)**

- `command`
  (기본 `qmd`):
  executable path override
- `searchMode`
  (기본 `search`):
  `memory_search`를 어떤 QMD command로 구동할지 선택
  (`search`, `vsearch`, `query`)
- `includeDefaultMemory`
  (기본 `true`):
  `MEMORY.md` + `memory/**/*.md` 자동 index
- `paths[]`:
  추가 directory/file 지정
  (`path`, optional `pattern`, optional stable `name`)
- `sessions`:
  session JSONL indexing opt in
  (`enabled`, `retentionDays`, `exportDir`)
- `update`:
  refresh cadence와 maintenance execution 제어
  (`interval`, `debounceMs`, `onBoot`, `waitForBootSync`, `embedInterval`,
  `commandTimeoutMs`, `updateTimeoutMs`, `embedTimeoutMs`)
- `limits`:
  recall payload clamp
  (`maxResults`, `maxSnippetChars`, `maxInjectedChars`, `timeoutMs`)
- `scope`:
  [`session.sendPolicy`](/gateway/configuration#session)와 같은 schema.
  기본값은 DM-only
  (`deny` all, `allow` direct chats)
  - `match.keyPrefix`는 **normalized** session key
    (lowercase, 앞의 `agent:<id>:` 제거)와 매칭
  - `match.rawKeyPrefix`는 `agent:<id>:`를 포함한 **raw** session key와 매칭
  - Legacy:
    `match.keyPrefix: "agent:..."`는 여전히 raw-key prefix로 취급되지만,
    명확성을 위해 `rawKeyPrefix`를 권장
- `scope`가 search를 deny하면 OpenClaw는 derived `channel`/`chatType`를 담은 warning을
  남겨 empty result를 디버깅하기 쉽게 합니다
- workspace 밖의 snippet은 `memory_search` 결과에
  `qmd/<collection>/<relative-path>`로 나타납니다.
  `memory_get`도 이 prefix를 이해하고 configured QMD collection root에서 읽습니다
- `memory.qmd.sessions.enabled = true`일 때 OpenClaw는 sanitized session transcript를
  dedicated QMD collection
  (`~/.openclaw/agents/<id>/qmd/sessions/`)에 export하여 recent conversation도
  recall할 수 있게 합니다
- `memory_search` snippet은 `memory.citations`가 `auto`/`on`이면
  `Source: <path#line>` footer를 포함합니다.
  path metadata를 internal로만 유지하려면 `memory.citations = "off"`를 사용하세요

**Example**

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

**Citations & fallback**

- `memory.citations`는 backend와 무관하게 적용됩니다
  (`auto` / `on` / `off`)
- `qmd`가 실행되면 diagnostics가 어떤 engine이 결과를 제공했는지 알 수 있도록
  `status().backend = "qmd"`를 기록합니다.
  QMD subprocess가 죽거나 JSON parse가 실패하면 search manager는 warning을 남기고,
  QMD가 복구될 때까지 builtin provider로 fallback합니다

### Additional memory paths

기본 workspace layout 밖의 Markdown도 index하려면 explicit path를 추가하세요.

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

Notes:

- path는 absolute 또는 workspace-relative 모두 가능
- directory는 `.md` file을 재귀적으로 scan
- 기본적으로 Markdown만 index
- `memorySearch.multimodal.enabled = true`이면 `extraPaths` 아래의 지원 image/audio도
  index합니다. 기본 memory root
  (`MEMORY.md`, `memory.md`, `memory/**/*.md`)는 여전히 Markdown-only
- symlink
  (file, directory 모두)는 무시

### Multimodal memory files (Gemini image + audio)

Gemini embedding 2를 사용할 때 `memorySearch.extraPaths` 아래의 image/audio file도
index할 수 있습니다.

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      extraPaths: ["assets/reference", "voice-notes"],
      multimodal: {
        enabled: true,
        modalities: ["image", "audio"], // or ["all"]
        maxFileBytes: 10000000
      },
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

Notes:

- multimodal memory는 현재 `gemini-embedding-2-preview`만 지원
- multimodal indexing은 `memorySearch.extraPaths`에서 발견된 file에만 적용
- 이 단계에서 지원하는 modality는 image와 audio
- multimodal memory를 켠 동안 `memorySearch.fallback`은 `"none"`이어야 함
- matching image/audio bytes는 indexing 중 configured Gemini embedding endpoint로
  업로드됨
- 지원 image extension:
  `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
- 지원 audio extension:
  `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`
- search query는 여전히 text이지만, Gemini가 text query와 indexed image/audio
  embedding을 비교할 수 있음
- `memory_get`은 여전히 Markdown만 읽음.
  binary file은 searchable하지만 raw file content는 반환하지 않음

### Gemini embeddings (native)

Gemini embeddings API를 직접 쓰려면 provider를 `gemini`로 설정하세요.

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

Notes:

- `remote.baseUrl`은 optional
  (기본값은 Gemini API base URL)
- `remote.headers`로 추가 header를 넣을 수 있음
- default model:
  `gemini-embedding-001`
- `gemini-embedding-2-preview`도 지원하며,
  8192 token limit과 configurable dimension
  (768 / 1536 / 3072, 기본 3072)을 가짐

#### Gemini Embedding 2 (preview)

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      outputDimensionality: 3072,  // optional: 768, 1536, or 3072 (default)
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

> **⚠️ Re-index required:** `gemini-embedding-001`
> (768 dimensions)에서 `gemini-embedding-2-preview`
> (3072 dimensions)로 바꾸면 vector size가 바뀝니다.
> `outputDimensionality`를 768, 1536, 3072 사이에서 바꿔도 마찬가지입니다.
> OpenClaw는 model 또는 dimension 변화가 감지되면 자동으로 reindex합니다.

custom OpenAI-compatible endpoint
(OpenRouter, vLLM, proxy)를 사용하려면 OpenAI provider와 `remote` config를 쓰면
됩니다.

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

API key를 두고 싶지 않다면 `memorySearch.provider = "local"`을 쓰거나,
`memorySearch.fallback = "none"`으로 설정하세요.

Fallback:

- `memorySearch.fallback`은 `openai`, `gemini`, `voyage`, `mistral`, `ollama`,
  `local`, `none` 중 하나 가능
- fallback provider는 primary embedding provider가 실패했을 때만 사용

Batch indexing
(OpenAI + Gemini + Voyage):

- 기본 비활성화.
  큰 corpus indexing에 쓰려면
  `agents.defaults.memorySearch.remote.batch.enabled = true`
- 기본 동작은 batch completion까지 기다립니다.
  필요하면 `remote.batch.wait`, `remote.batch.pollIntervalMs`,
  `remote.batch.timeoutMinutes`를 조정하세요
- `remote.batch.concurrency`로 병렬 batch job 수를 제어합니다
  (기본 2)
- batch mode는 `memorySearch.provider = "openai"` 또는 `"gemini"`일 때 적용되며,
  해당 API key를 사용합니다
- Gemini batch job은 async embeddings batch endpoint를 사용하며,
  Gemini Batch API가 사용 가능해야 합니다

왜 OpenAI batch가 빠르고 저렴한가:

- 큰 backfill에서는 많은 embedding request를 하나의 batch job으로 보내 비동기 처리할
  수 있기 때문에, OpenAI가 보통 가장 빠른 선택지입니다
- OpenAI는 Batch API workload에 할인된 pricing을 제공하므로, large indexing이
  sync request보다 더 저렴한 경우가 많습니다
- 참고:
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

Config example:

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

Tools:

- `memory_search`
  — file + line range를 포함한 snippet 반환
- `memory_get`
  — path 기준으로 memory file content 읽기

Local mode:

- `agents.defaults.memorySearch.provider = "local"` 설정
- `agents.defaults.memorySearch.local.modelPath`
  (GGUF 또는 `hf:` URI) 제공
- remote fallback을 피하려면
  `agents.defaults.memorySearch.fallback = "none"` 설정 가능

### How the memory tools work

- `memory_search`는 `MEMORY.md` + `memory/**/*.md`를 Markdown chunk
  (~400 token 목표, 80-token overlap)로 semantic search합니다.
  반환값에는 snippet text
  (~700 chars cap), file path, line range, score, provider/model, 그리고
  local → remote embedding fallback 여부가 포함됩니다.
  full file payload는 반환하지 않습니다
- `memory_get`은 workspace-relative memory Markdown file을 읽으며, optional하게 시작
  line과 line 수를 받을 수 있습니다.
  `MEMORY.md` / `memory/` 밖의 path는 reject됩니다
- 두 tool 모두 agent에 대해 `memorySearch.enabled`가 true로 resolve될 때만 활성화

### What gets indexed (and when)

- File type:
  Markdown only
  (`MEMORY.md`, `memory/**/*.md`)
- Index storage:
  agent별 SQLite
  `~/.openclaw/memory/<agentId>.sqlite`
  (`agents.defaults.memorySearch.store.path`로 설정 가능,
  `{agentId}` token 지원)
- Freshness:
  `MEMORY.md` + `memory/` watcher가 index를 dirty로 표시
  (debounce 1.5s).
  sync는 session start, search 시점, 또는 interval에 예약되어 비동기로 실행됩니다.
  session transcript는 delta threshold를 기준으로 background sync를 trigger합니다
- Reindex trigger:
  index는 embedding **provider/model + endpoint fingerprint + chunking param**을
  저장합니다.
  이 값이 바뀌면 OpenClaw는 전체 store를 reset하고 reindex합니다

### Hybrid search (BM25 + vector)

활성화되면 OpenClaw는 다음을 결합합니다.

- **Vector similarity**
  (의미가 비슷하면 wording이 달라도 찾음)
- **BM25 keyword relevance**
  (ID, env var, code symbol 같은 exact token에 강함)

플랫폼에서 full-text search를 사용할 수 없으면 vector-only search로 fallback합니다.

#### Why hybrid?

vector search는 "의미는 같은데 표현이 다른" 경우에 강합니다.

- "Mac Studio gateway host" vs "the machine running the gateway"
- "debounce file updates" vs "avoid indexing on every write"

하지만 exact, high-signal token에는 약할 수 있습니다.

- ID
  (`a828e60`, `b3b9895a…`)
- code symbol
  (`memorySearch.query.hybrid`)
- error string
  (`sqlite-vec unavailable`)

BM25는 반대입니다. exact token에는 강하지만 paraphrase에는 약합니다.
hybrid search는 **두 retrieval signal을 함께 써서** 자연어 query와
"needle in a haystack" query 모두에 대응하려는 실용적 절충안입니다.

#### How we merge results (the current design)

구현 개요:

1. 양쪽에서 candidate pool을 가져옵니다
   - **Vector:** cosine similarity 상위 `maxResults * candidateMultiplier`
   - **BM25:** FTS5 BM25 rank 상위 `maxResults * candidateMultiplier`
2. BM25 rank를 0..1 비슷한 score로 변환
   - `textScore = 1 / (1 + max(0, bm25Rank))`
3. chunk id 기준으로 union한 뒤 weighted score 계산
   - `finalScore = vectorWeight * vectorScore + textWeight * textScore`

Notes:

- `vectorWeight` + `textWeight`는 config resolve 시 1.0으로 normalize되므로
  percentage처럼 동작합니다
- embedding이 unavailable하거나 zero-vector가 반환되어도 BM25는 계속 동작하므로
  keyword match를 반환할 수 있습니다
- FTS5를 만들 수 없으면 hard failure 없이 vector-only search를 유지합니다

이 방식은 IR 이론적으로 완벽하진 않지만 단순하고 빠르며, 실제 note에서 recall/precision을
대체로 개선합니다. 더 발전시키려면 다음 단계로는 RRF나 점수 normalization 등을
고려할 수 있습니다.

#### Post-processing pipeline

vector와 keyword score를 merge한 뒤, 두 단계의 optional post-processing이 결과 list를
정제합니다.

```text
Vector + Keyword → Weighted Merge → Temporal Decay → Sort → MMR → Top-K Results
```

두 단계 모두 기본 비활성화이며, 독립적으로 켤 수 있습니다.

#### MMR re-ranking (diversity)

hybrid search 결과에는 비슷하거나 겹치는 chunk가 여러 개 있을 수 있습니다.
예를 들어 "home network setup"을 검색하면 router 설정을 거의 똑같이 말하는 daily note가
여러 개 나올 수 있습니다.

**MMR
(Maximal Marginal Relevance)**은 relevance와 diversity를 동시에 고려해 re-rank하여,
상위 결과가 같은 이야기를 반복하지 않고 query의 여러 측면을 다루게 합니다.

동작:

1. 결과는 원래 relevance
   (vector + BM25 weighted score)로 점수화
2. MMR은 반복적으로
   `λ × relevance − (1−λ) × max_similarity_to_selected`
   를 최대화하는 결과를 고름
3. 결과 간 similarity는 tokenized text의 Jaccard similarity를 사용

`lambda`의 의미:

- `lambda = 1.0`
  → pure relevance
- `lambda = 0.0`
  → 최대 diversity
- 기본값:
  `0.7`

**Example — query: "home network setup"**

다음 memory file이 있다고 가정:

```text
memory/2026-02-10.md  → "Configured Omada router, set VLAN 10 for IoT devices"
memory/2026-02-08.md  → "Configured Omada router, moved IoT to VLAN 10"
memory/2026-02-05.md  → "Set up AdGuard DNS on 192.168.10.2"
memory/network.md     → "Router: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"
```

MMR 없이 top 3:

```text
1. memory/2026-02-10.md  (score: 0.92)  ← router + VLAN
2. memory/2026-02-08.md  (score: 0.89)  ← router + VLAN (near-duplicate!)
3. memory/network.md     (score: 0.85)  ← reference doc
```

MMR
(`λ=0.7`) 적용 후 top 3:

```text
1. memory/2026-02-10.md  (score: 0.92)  ← router + VLAN
2. memory/network.md     (score: 0.85)  ← reference doc (diverse!)
3. memory/2026-02-05.md  (score: 0.78)  ← AdGuard DNS (diverse!)
```

비슷한 2월 8일 note가 빠지고, agent는 서로 다른 정보 세 조각을 받게 됩니다.

**언제 켜야 하나:** `memory_search`가 redundant하거나 near-duplicate snippet을 자주
반환한다면, 특히 daily note가 날짜별로 비슷한 정보를 반복하는 환경에서 유용합니다.

#### Temporal decay (recency boost)

daily note가 수백 개 쌓이면, wording이 잘 맞는 6개월 전 note가 어제의 update보다
더 위에 나올 수 있습니다.

**Temporal decay**는 결과의 age에 따라 exponential multiplier를 적용하여, 최근 memory가
자연스럽게 더 위에 오게 합니다.

```text
decayedScore = score × e^(-λ × ageInDays)
```

여기서 `λ = ln(2) / halfLifeDays`.

기본 half-life 30일일 때:

- 오늘 note:
  **100%**
- 7일 전:
  **~84%**
- 30일 전:
  **50%**
- 90일 전:
  **12.5%**
- 180일 전:
  **~1.6%**

**evergreen file은 decay하지 않습니다**

- `MEMORY.md`
- `memory/` 아래의 non-dated file
  (예: `memory/projects.md`, `memory/network.md`)

이 file은 durable reference여야 하므로 원래 score를 유지합니다.

**dated daily file**
(`memory/YYYY-MM-DD.md`)은 filename에서 날짜를 추출합니다.
다른 source
(예: session transcript)는 file modification time
(`mtime`)을 사용합니다.

**Example — query: "what's Rod's work schedule?"**

오늘이 2월 10일이라고 가정:

```text
memory/2025-09-15.md  → "Rod works Mon-Fri, standup at 10am, pairing at 2pm"  (148 days old)
memory/2026-02-10.md  → "Rod has standup at 14:15, 1:1 with Zeb at 14:45"    (today)
memory/2026-02-03.md  → "Rod started new team, standup moved to 14:15"        (7 days old)
```

decay 없이:

```text
1. memory/2025-09-15.md  (score: 0.91)  ← best semantic match, but stale!
2. memory/2026-02-10.md  (score: 0.82)
3. memory/2026-02-03.md  (score: 0.80)
```

decay
(`halfLife=30`) 적용 후:

```text
1. memory/2026-02-10.md  (score: 0.82 × 1.00 = 0.82)  ← today, no decay
2. memory/2026-02-03.md  (score: 0.80 × 0.85 = 0.68)  ← 7 days, mild decay
3. memory/2025-09-15.md  (score: 0.91 × 0.03 = 0.03)  ← 148 days, nearly gone
```

9월 note는 raw semantic match는 좋았지만, stale하기 때문에 아래로 내려갑니다.

**언제 켜야 하나:** 수개월치 daily note가 있고, 오래된 stale 정보가 최근 context보다
위에 뜬다면 유용합니다. daily-note-heavy workflow에는 30일 half-life가 잘 맞고,
오래된 note를 자주 참고한다면 90일처럼 더 길게 잡을 수 있습니다.

#### Configuration

두 기능 모두 `memorySearch.query.hybrid` 아래에서 설정합니다.

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

각 feature는 독립적으로 켤 수 있습니다.

- **MMR only**
  — 비슷한 note가 많지만 age는 중요하지 않을 때
- **Temporal decay only**
  — recency가 중요하지만 결과가 이미 충분히 다양할 때
- **Both**
  — daily note가 많고 오래 운영된 agent에 권장

### Embedding cache

OpenClaw는 **chunk embedding**을 SQLite에 cache할 수 있어, reindex나 잦은 update
(특히 session transcript)에서 변하지 않은 text를 다시 embed하지 않게 할 수 있습니다.

Config:

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

### Session memory search (experimental)

선택적으로 **session transcript**도 index하여 `memory_search`로 surface할 수 있습니다.
이 기능은 experimental flag 뒤에 있습니다.

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

Notes:

- session indexing은 **opt-in**
  (기본 off)
- session update는 debounce되고 delta threshold를 넘으면 **비동기 indexing**됩니다
  (best-effort)
- `memory_search`는 indexing을 기다리지 않으므로 결과가 background sync가 끝날 때까지
  약간 stale할 수 있습니다
- 결과는 여전히 snippet만 포함하며, `memory_get`은 memory file로 제한됩니다
- session indexing은 agent별로 격리됩니다
  (해당 agent의 session log만 index)
- session log는 disk의
  `~/.openclaw/agents/<agentId>/sessions/*.jsonl`에 있습니다.
  filesystem access가 있는 process/user는 읽을 수 있으므로, disk access를 trust boundary로
  간주해야 합니다. 더 강한 격리가 필요하면 agent를 OS user 또는 host 단위로 분리하세요

Delta threshold
(기본값):

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

### SQLite vector acceleration (sqlite-vec)

sqlite-vec extension을 사용할 수 있으면, OpenClaw는 embedding을 SQLite virtual table
(`vec0`)에 저장하고 database 안에서 vector distance query를 수행합니다.
이렇게 하면 embedding 전체를 JS 메모리로 올리지 않고도 search를 빠르게 유지할 수
있습니다.

Configuration
(optional):

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

Notes:

- `enabled` 기본값은 true.
  끄면 stored embedding에 대한 in-process cosine similarity로 fallback
- sqlite-vec extension이 없거나 load에 실패해도 OpenClaw는 error를 log하고 JS fallback으로
  계속 동작합니다
- `extensionPath`는 bundled sqlite-vec path를 override합니다
  (custom build나 non-standard install 위치에 유용)

### Local embedding auto-download

- 기본 local embedding model:
  `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf`
  (~0.6 GB)
- `memorySearch.provider = "local"`일 때 `node-llama-cpp`가 `modelPath`를 resolve하며,
  GGUF가 없으면 cache
  (또는 `local.modelCacheDir`)로 **자동 다운로드**한 뒤 load합니다.
  download는 retry 시 resume 가능
- native build requirement:
  `pnpm approve-builds`에서 `node-llama-cpp`를 승인한 뒤
  `pnpm rebuild node-llama-cpp`
- fallback:
  local setup이 실패하고 `memorySearch.fallback = "openai"`면, remote embedding
  (`openai/text-embedding-3-small`, override 가능)으로 자동 전환하고 reason을 기록합니다

### Custom OpenAI-compatible endpoint example

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

Notes:

- `remote.*`는 `models.providers.openai.*`보다 우선
- `remote.headers`는 OpenAI header와 merge되며, key conflict 시 remote 쪽이 우선
- `remote.headers`를 생략하면 OpenAI 기본 header를 사용합니다
