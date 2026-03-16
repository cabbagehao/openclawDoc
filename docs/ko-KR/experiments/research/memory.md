---
description: "Markdown 정본과 파생 인덱스를 결합한 오프라인 워크스페이스 메모리 아키텍처 리서치입니다"
summary: "리서치 메모: Clawd 워크스페이스용 오프라인 메모리 시스템(Markdown 원본 + 파생 인덱스)"
read_when:
  - 일일 Markdown 로그를 넘어서는 워크스페이스 메모리(`~/.openclaw/workspace`)를 설계할 때
  - 독립 CLI 와 OpenClaw 깊은 통합 중 어떤 방향을 택할지 결정할 때
  - 오프라인 회상 + 반성(retain/recall/reflect)을 추가할 때
title: "워크스페이스 메모리 리서치"
x-i18n:
  source_path: "experiments/research/memory.md"
---

# Workspace Memory v2 (오프라인): 리서치 메모

대상: Clawd 스타일 워크스페이스(`agents.defaults.workspace`, 기본값 `~/.openclaw/workspace`)로, "메모리"는 하루당 하나의 Markdown 파일(`memory/YYYY-MM-DD.md`)과 소수의 안정적인 파일(예: `memory.md`, `SOUL.md`)에 저장된다.

이 문서는 Markdown 을 사람이 검토 가능한 정본 소스로 유지하면서도, 파생 인덱스를 통해 **구조화된 회상**(검색, 엔터티 요약, 신뢰도 갱신)을 더하는 **오프라인 우선** 메모리 아키텍처를 제안한다.

## 왜 바꾸는가?

현재 구성(하루에 한 파일)은 다음 용도에 매우 적합하다.

- "append-only" 저널링
- 사람이 직접 편집
- git 기반 내구성 + 감사 가능성
- 마찰이 적은 기록 방식("그냥 적어 두기")

하지만 다음에는 약하다.

- 높은 재현율의 검색("X 에 대해 우리가 무엇을 결정했지?", "지난번에 Y 를 어떻게 시도했지?")
- 엔터티 중심 답변("Alice / The Castle / warelay 에 대해 말해 줘")을 위해 많은 파일을 다시 읽어야 하는 점
- 의견/선호의 안정성과 그 변화에 대한 근거
- 시간 제약("2025년 11월 동안 무엇이 사실이었나?") 및 충돌 해결

## 설계 목표

- **오프라인**: 네트워크 없이 동작하고, 노트북/Castle 에서 실행 가능하며, 클라우드 의존성이 없다.
- **설명 가능성**: 검색 결과는 출처(파일 + 위치)를 가질 수 있어야 하며, 추론과 분리되어야 한다.
- **낮은 의식 비용**: 일일 기록은 Markdown 으로 유지하고, 무거운 스키마 작업은 피한다.
- **점진적 확장**: v1 은 FTS 만으로도 유용해야 하며, semantic/vector 와 그래프는 선택적 업그레이드여야 한다.
- **에이전트 친화적**: "토큰 예산 안에서 회상" 이 쉽도록 작은 사실 묶음을 반환해야 한다.

## 북극성 모델(Hindsight × Letta)

섞어야 할 두 가지 요소:

1. **Letta/MemGPT 스타일 제어 루프**

- 항상 컨텍스트에 유지되는 작은 "코어"(persona + 핵심 사용자 사실)를 둔다.
- 나머지는 모두 컨텍스트 밖에 두고 도구를 통해 검색한다.
- 메모리 쓰기는 명시적 도구 호출(append/replace/insert)로 수행하고, 영속화한 뒤 다음 턴에 다시 주입한다.

2. **Hindsight 스타일 메모리 기반체**

- 관찰된 것, 믿고 있는 것, 요약된 것을 분리한다.
- retain/recall/reflect 를 지원한다.
- 근거와 함께 진화하는 신뢰도 기반 의견을 지원한다.
- 완전한 지식 그래프가 없더라도 엔터티 중심 검색 + 시간 쿼리를 지원한다.

## 제안 아키텍처(Markdown 원본 + 파생 인덱스)

### Canonical store (git 친화적)

`~/.openclaw/workspace` 를 사람이 읽을 수 있는 정본 메모리로 유지한다.

권장 워크스페이스 레이아웃:

```
~/.openclaw/workspace/
  memory.md                    # 작고 핵심적인 사실 + 선호 정보(core-ish)
  memory/
    YYYY-MM-DD.md              # 일일 로그(append; 서술형)
  bank/                        # "타입이 있는" 메모리 페이지(안정적, 검토 가능)
    world.md                   # 세계에 대한 객관적 사실
    experience.md              # 에이전트가 수행한 일(1인칭)
    opinions.md                # 주관적 선호/판단 + 신뢰도 + 근거 포인터
    entities/
      Peter.md
      The-Castle.md
      warelay.md
      ...
```

메모:

- **일일 로그는 계속 일일 로그로 둔다.** JSON 으로 바꿀 필요는 없다.
- `bank/` 파일은 **큐레이션된 결과물** 로, reflection 작업이 생성하며 여전히 수동 편집할 수 있다.
- `memory.md` 는 "작고 core-ish" 한 상태를 유지한다. 즉, Clawd 가 매 세션마다 봐야 하는 내용만 담는다.

### Derived store (기계 회상)

워크스페이스 아래에 파생 인덱스를 추가한다(git 추적 여부는 선택).

```
~/.openclaw/workspace/.memory/index.sqlite
```

기반 구성:

- 사실 + 엔터티 링크 + 의견 메타데이터를 담는 SQLite 스키마
- 어휘 기반 회상용 SQLite **FTS5**(빠르고, 작고, 오프라인)
- 선택적 의미 검색용 embeddings 테이블(여전히 오프라인)

이 인덱스는 항상 **Markdown 으로부터 재구축 가능** 해야 한다.

## Retain / Recall / Reflect (운영 루프)

### Retain: 일일 로그를 "사실" 로 정규화

여기서 중요한 Hindsight 의 통찰은 작은 조각이 아니라 **서사적이고 완결된 사실** 을 저장하라는 점이다.

`memory/YYYY-MM-DD.md` 에 대한 실용 규칙:

- 하루가 끝날 때(또는 중간에도) `## Retain` 섹션에 다음 조건을 만족하는 2~5개 불릿을 추가한다.
  - 서사적이며(여러 턴에 걸친 맥락을 유지)
  - 독립적이며(나중에 따로 봐도 의미가 통함)
  - 타입 + 엔터티 언급으로 태그됨

예시:

```
## Retain
- W @Peter: Currently in Marrakech (Nov 27–Dec 1, 2025) for Andy’s birthday.
- B @warelay: I fixed the Baileys WS crash by wrapping connection.update handlers in try/catch (see memory/2025-11-27.md).
- O(c=0.95) @Peter: Prefers concise replies (<1500 chars) on WhatsApp; long content goes into files.
```

최소 파싱 규칙:

- 타입 접두사: `W` (world), `B` (experience/biographical), `O` (opinion), `S` (observation/summary; 보통 자동 생성)
- 엔터티: `@Peter`, `@warelay` 등(slug 는 `bank/entities/*.md` 와 매핑)
- 의견 신뢰도: `O(c=0.0..1.0)` 선택 사항

작성자가 이런 형식을 의식하고 싶지 않다면, reflect 작업이 로그의 나머지 부분에서 이 불릿들을 추론해도 된다. 하지만 명시적인 `## Retain` 섹션이 가장 쉬운 품질 레버다.

### Recall: 파생 인덱스에 대한 쿼리

Recall 은 다음을 지원해야 한다.

- **lexical**: "정확한 용어 / 이름 / 명령 찾기"(FTS5)
- **entity**: "X 에 대해 알려줘"(엔터티 페이지 + 엔터티와 연결된 사실)
- **temporal**: "11월 27일 전후에 무슨 일이 있었지?" / "지난주 이후로"
- **opinion**: "Peter 는 무엇을 선호하지?"(신뢰도 + 근거 포함)

반환 형식은 에이전트 친화적이어야 하며 출처를 인용해야 한다.

- `kind` (`world|experience|opinion|observation`)
- `timestamp` (소스 날짜 또는 추출된 시간 범위)
- `entities` (`["Peter","warelay"]`)
- `content` (서사적 사실)
- `source` (`memory/2025-11-27.md#L12` 등)

### Reflect: 안정적인 페이지 생성 + 믿음 갱신

Reflection 은 일정에 따라 실행되는 작업(매일 또는 heartbeat `ultrathink`)으로, 다음을 수행한다.

- 최근 사실로부터 `bank/entities/*.md` 를 갱신한다(엔터티 요약).
- 강화/모순에 따라 `bank/opinions.md` 의 신뢰도를 갱신한다.
- 선택적으로 `memory.md` 편집을 제안한다("core-ish" 한 지속 사실).

의견 진화(단순하고 설명 가능해야 함):

- 각 의견은 다음을 가진다.
  - 진술
  - 신뢰도 `c ∈ [0,1]`
  - `last_updated`
  - 근거 링크(지지/반박 사실 ID)
- 새 사실이 도착하면:
  - 엔터티 겹침 + 유사도를 기준으로 후보 의견을 찾는다(처음엔 FTS, 이후 embeddings)
  - 작은 폭으로 신뢰도를 갱신한다. 큰 폭 변화는 강한 모순과 반복 근거가 필요하다.

## CLI 통합: 독립형 vs 깊은 통합

권장안: **OpenClaw 에 깊게 통합** 하되, 분리 가능한 코어 라이브러리는 유지한다.

### 왜 OpenClaw 에 통합하는가?

- OpenClaw 는 이미 다음을 알고 있다.
  - 워크스페이스 경로(`agents.defaults.workspace`)
  - 세션 모델 + heartbeat
  - 로깅 + 문제 해결 패턴
- 에이전트 자체가 다음 도구를 호출하길 원한다.
  - `openclaw memory recall "…" --k 25 --since 30d`
  - `openclaw memory reflect --since 7d`

### 왜 여전히 라이브러리로 분리하는가?

- gateway/runtime 없이도 메모리 로직을 테스트 가능하게 유지하기 위해
- 다른 컨텍스트(로컬 스크립트, 미래의 데스크톱 앱 등)에서 재사용하기 위해

형태:
메모리 도구는 작은 CLI + 라이브러리 계층이 되는 것이 의도된 모습이지만, 이 문서는 탐색 단계에 머문다.

## "S-Collide" / SuCo: 언제 써야 하나 (리서치)

만약 "S-Collide" 가 **SuCo (Subspace Collision)** 를 뜻한다면, 이는 구조화된 하위공간 충돌을 이용해 강한 재현율/지연시간 절충을 노리는 ANN 검색 방식이다(논문: arXiv 2411.14754, 2024).

`~/.openclaw/workspace` 에 대한 실용적 판단:

- **처음부터 SuCo 로 시작하지 말 것**
- 먼저 SQLite FTS + (선택적) 단순 임베딩으로 시작하면 대부분의 UX 개선을 바로 얻을 수 있다.
- 다음 조건이 충족될 때에만 SuCo/HNSW/ScaNN 류 해법을 고려한다.
  - 코퍼스가 커졌을 때(수만~수십만 청크)
  - brute-force 임베딩 검색이 너무 느려졌을 때
  - 의미 기반 검색 품질이 어휘 검색의 병목이 되었을 때

오프라인 친화적 대안(복잡도 증가 순):

- SQLite FTS5 + 메타데이터 필터(ML 불필요)
- 임베딩 + brute force(청크 수가 적다면 생각보다 오래 버틴다)
- HNSW 인덱스(흔하고 견고함. 라이브러리 바인딩 필요)
- SuCo(리서치 등급. 내장 가능한 견고한 구현이 있다면 매력적)

열린 질문:

- 당신의 장비(노트북 + 데스크톱)에서 "개인 비서 메모리" 용으로 가장 좋은 오프라인 임베딩 모델은 무엇인가?
  - 이미 Ollama 가 있다면 로컬 모델로 임베딩하고, 아니라면 도구 체인에 작은 임베딩 모델을 포함시킨다.

## 가장 작은 유용한 파일럿

최소하지만 여전히 유용한 버전을 원한다면:

- `bank/` 엔터티 페이지와 일일 로그의 `## Retain` 섹션을 추가한다.
- 인용(path + line numbers)이 포함된 SQLite FTS 기반 recall 을 사용한다.
- 검색 품질이나 규모가 실제로 요구할 때만 임베딩을 추가한다.

## 참고 자료

- Letta / MemGPT concepts: "core memory blocks" + "archival memory" + tool-driven self-editing memory.
- Hindsight Technical Report: "retain / recall / reflect", four-network memory, narrative fact extraction, opinion confidence evolution.
- SuCo: arXiv 2411.14754 (2024): "Subspace Collision" approximate nearest neighbor retrieval.
