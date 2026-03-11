---
summary: "OpenClaw의 기억 관리 방식: 워크스페이스 파일 활용 및 자동 메모리 플러시 안내"
read_when:
  - 기억 관련 파일의 구조 및 관리 워크플로우가 궁금할 때
  - 압축 전 자동 메모리 저장(Memory Flush) 설정을 조정하고 싶을 때
title: "기억 시스템"
x-i18n:
  source_path: "concepts/memory.md"
---

# 기억 시스템 (Memory)

OpenClaw의 기억은 **에이전트 워크스페이스 내의 일반 마크다운(Markdown) 파일**임. 이 파일들이 데이터의 **단일 소스(SSOT)** 역할을 하며, 에이전트는 오직 디스크에 기록된 내용만을 기반으로 과거를 '기억'함.

기억 검색 기능은 활성화된 메모리 플러그인(기본값: `memory-core`)을 통해 제공되며, 필요 시 `plugins.slots.memory = "none"` 설정을 통해 비활성화할 수 있음.

## 기억 관련 파일 구조

기본 워크스페이스 레이아웃은 다음과 같은 두 계층의 기억 구조를 가짐:

* **`memory/YYYY-MM-DD.md`**: 일일 단위 로그 파일 (추가 전용). 세션 시작 시 오늘과 어제의 기록을 읽어 맥락을 파악함.
* **`MEMORY.md` (선택 사항)**: 정제된 장기 기억 파일. 보안 및 프라이버시를 위해 **비공개 메인 세션에서만 로드**됨 (공유 채널이나 그룹 대화에서는 제외).

해당 파일들은 워크스페이스 경로(기본값: `~/.openclaw/workspace`) 하위에 저장됨. 상세 구조는 [에이전트 워크스페이스](/concepts/agent-workspace) 참조.

## 기억 활용 도구 (Tools)

에이전트는 다음 도구들을 사용하여 마크다운 기반의 기억 데이터를 활용함:

* **`memory_search`**: 인덱싱된 데이터에 대해 의미 기반(Semantic) 검색 수행.
* **`memory_get`**: 특정 파일이나 특정 줄 범위를 직접 읽음.

`memory_get` 도구는 대상 파일이 존재하지 않더라도(예: 오늘 처음 기록하기 전) 에러를 발생시키지 않고 빈 결과값(`{ text: "", path }`)을 반환하도록 설계되어 있어, 에이전트가 예외 처리 없이도 유연하게 대응 가능함.

## 기억 기록 시점 가이드

* 중요한 결정 사항, 사용자 선호도, 영구적인 사실은 `MEMORY.md`에 기록함.
* 일상적인 참고 사항이나 현재 진행 중인 컨텍스트는 `memory/YYYY-MM-DD.md`에 남김.
* 사용자가 "이걸 기억해줘"라고 요청할 경우, 에이전트는 이를 즉시 파일에 기록해야 함 (RAM에만 보존하면 안 됨).
* 에이전트가 정보를 어디에 기록해야 할지 모를 때는 사용자가 명시적으로 지침을 주는 것이 좋음.

## 자동 메모리 플러시 (Auto Flush)

세션 데이터가 자동 압축(Compaction) 시점에 도달하면, OpenClaw는 컨텍스트를 비우기 **전에** 에이전트에게 중요한 정보를 기억 장치에 저장하도록 유도하는 \*\*무음의 자율 턴(Silent turn)\*\*을 수행함.

이 기능은 `agents.defaults.compaction.memoryFlush` 설정을 통해 제어됨:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "대화 압축이 임박했습니다. 중요한 정보를 영구 기억에 저장하세요.",
          prompt: "기억해야 할 내용이 있다면 memory/YYYY-MM-DD.md에 기록하세요. 저장할 내용이 없으면 NO_REPLY로 답하세요.",
        },
      },
    },
  },
}
```

**동작 상세:**

* **임계값**: `컨텍스트 창 - 예약 토큰 - 소프트 임계값` 수치 도달 시 트리거됨.
* **무음 동작**: 기본적으로 `NO_REPLY` 지침이 포함되어 사용자 화면에는 대화가 표시되지 않음.
* **압축 주기당 1회**: 불필요한 반복 실행을 방지함.
* **쓰기 권한 필수**: 샌드박스 설정 등으로 워크스페이스가 읽기 전용인 경우 이 단계는 건너뜀.

상세 압축 프로세스는 [세션 관리 및 압축 상세](/reference/session-management-compaction) 참조.

## 벡터 검색 (Vector Search)

OpenClaw는 기억 파일들을 대상으로 벡터 인덱스를 구축하여, 질문의 표현이 조금씩 다르더라도 의미상 유사한 기록을 찾아낼 수 있음.

**기본 설정:**

* 기본 활성화 상태이며, 파일 변경 시 자동으로 인덱스를 갱신함.
* `agents.defaults.memorySearch` 섹션에서 세부 설정 가능.
* **임베딩 공급자 자동 선택**: 설정이 없을 경우 로컬 모델(`local`), OpenAI, Gemini 순으로 가용한 API 키를 찾아 사용함.
* 로컬 모드는 `node-llama-cpp`를 사용하며, SQLite의 `sqlite-vec` 확장을 통해 검색 속도를 가속함.

**인증 안내**: 원격 임베딩 사용 시 해당 공급자의 API 키가 필요함. Gemini의 경우 `GEMINI_API_KEY`를 사용하며, OpenAI 호환 엔드포인트를 사용하는 경우 `memorySearch.remote.apiKey`를 직접 지정할 수 있음.

### QMD 백엔드 (실험적 기능)

더 정교한 검색이 필요한 경우 [QMD](https://github.com/tobi/qmd)를 백엔드로 사용할 수 있음(`memory.backend = "qmd"`). QMD는 키워드(BM25)와 벡터 검색, 리랭킹(Reranking)을 결합한 고성능 로컬 검색 엔진임.

* **장점**: 별도의 Ollama 데몬 없이도 로컬에서 고품질 검색 수행 가능.
* **요구 사항**: QMD CLI 별도 설치 및 확장을 지원하는 SQLite 빌드 필요.
* **동작**: 백그라운드에서 주기적으로 인덱스를 동기화하며, QMD 호출 실패 시 자동으로 내장 인덱서로 전환(Fallback)됨.

상세 설정은 `memory.qmd.*` 필드를 참조함.

## 하이브리드 검색 (Hybrid Search)

벡터 검색(의미 중심)과 BM25(키워드 중심)를 결합하여 검색 품질을 극대화함.

* **벡터 검색**: "맥 스튜디오 호스트"와 "Gateway 실행 기기"와 같이 표현은 다르지만 의미가 같은 정보 탐색에 강함.
* **BM25 검색**: 특정 ID, 환경 변수 이름, 코드 심볼 등 정확한 일치가 필요한 정보 탐색에 강함.

### 검색 결과 후처리 (Post-processing)

1. **MMR (다양성 필터)**: 결과 목록에서 내용이 중복되거나 너무 유사한 조각들을 제거하여 다양한 관점의 정보를 제공함.
2. **시간 감쇠 (Temporal Decay)**: 최신 기록에 가산점을 부여하여, 너무 오래된 정보보다 어제의 정보가 먼저 표시되도록 순위를 조정함. 단, `MEMORY.md`와 같이 날짜가 없는 고정 지침 파일은 감쇠 대상에서 제외됨.

설정 예시:

```json5
memorySearch: {
  query: {
    hybrid: {
      enabled: true,
      mmr: { enabled: true, lambda: 0.7 },
      temporalDecay: { enabled: true, halfLifeDays: 30 }
    }
  }
}
```

## 기억 인덱싱 및 갱신

* **대상**: 워크스페이스 내의 모든 마크다운 파일.
* **저장소**: 에이전트별 전용 SQLite DB 파일 (`~/.openclaw/memory/<agentId>.sqlite`).
* **갱신 주기**: 파일 변경 감지 시 약 1.5초 후 자동 동기화되며, 세션 시작 시에도 체크함.
* **재인덱싱**: 임베딩 모델이나 청킹(Chunking) 파라미터가 변경되면 전체 인덱스를 자동으로 초기화하고 다시 구축함.

## 세션 이력 검색 (실험적)

사용자의 선택에 따라 과거 대화 이력(Session Transcripts) 자체를 인덱싱하여 검색 대상으로 포함할 수 있음:

```json5
memorySearch: {
  experimental: { sessionMemory: true },
  sources: ["memory", "sessions"]
}
```

이 기능은 백그라운드에서 비동기적으로 작동하며, 현재 세션 이력은 해당 에이전트 단위로 격리되어 안전하게 관리됨.
