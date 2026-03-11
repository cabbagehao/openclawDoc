# ja-JP 로케일 확장 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `ja-JP` 로케일을 확장해 영어 문서와 동일한 커버리지와 탐색 구조를 갖추고, 자연스럽고 전문적인 일본어를 제공한다.

**Architecture:** 기존 영어 문서 트리를 단일 진실 공급원으로 사용하고, 모든 영어 페이지에 대해 `docs/ja-JP/**` 를 생성한 다음, 일본어 로케일 아래에서 `docs/docs.json` 의 영어 탐색 구조를 그대로 반영한다. 링크, 코드 블록, 컴포넌트 태그, 프런트매터 구조, 제품 용어는 안정적으로 유지하면서 문장과 라벨만 자연스러운 일본어로 번역한다.

**Tech Stack:** Markdown/MDX 문서, Mintlify `docs.json`, 로컬 Node/pnpm 스크립트, 번역 및 검토용 서브에이전트, 문서 링크 검사와 커버리지 차이 기반의 선택적 검증.

### Task 1: 번역 기준선 수립

**Files:**

- Create/modify: `docs/ja-JP/**`
- Modify: `docs/.i18n/glossary.ja-JP.json`
- Reference: `docs/docs.json`

**Step 1:** `docs/ja-JP/**` 에 반드시 존재해야 하는 모든 영어 문서 페이지를 목록화한다.

**Step 2:** 현재 `ja-JP` 커버리지 차이를 확인하고, 상위 섹션 단위로 소스 파일을 묶어 병렬 작업 시 쓰기 충돌이 없도록 한다.

**Step 3:** 여러 섹션에서 재사용되는 제품 및 UI 용어를 중심으로 일본어 용어집을 확장한다.

**Step 4:** 번역을 확장하기 전에 구조 보존 여부를 번역된 페이지 하나로 검증한다.

### Task 2: 모든 영어 페이지를 `docs/ja-JP/**` 로 번역

**Files:**

- Create: `docs/ja-JP/**`
- Reference: `docs/**/*.md`, `docs/**/*.mdx`

**Step 1:** 영어 소스 트리를 서로 겹치지 않는 섹션 소유권으로 분리한다.

**Step 2:** 각 워커가 자신의 `docs/ja-JP/<section>/**` 하위 트리만 쓰도록 섹션별 번역 워커를 배치한다.

**Step 3:** 자연어 콘텐츠를 번역하면서 프런트매터 키, 내부 링크, 코드 펜스, Mintlify 컴포넌트, 파일명은 보존한다.

**Step 4:** 나머지 루트 단일 페이지(`index.md`, `pi.md`, `perplexity.md`, `vps.md` 등)를 `docs/ja-JP/` 아래로 번역한다.

### Task 3: 일본어용 탐색 구조를 영어와 맞춤

**Files:**

- Modify: `docs/docs.json`

**Step 1:** 영어 로케일 탐색 구조를 일본어 로케일로 복사한다.

**Step 2:** 모든 페이지 경로를 `ja-JP/...` 형태로 다시 쓴다.

**Step 3:** 페이지 순서는 영어와 동일하게 유지하면서 탭과 그룹 라벨을 간결하고 자연스러운 일본어로 번역한다.

**Step 4:** 참조되는 모든 `ja-JP` 페이지가 실제로 존재하는지 확인한다.

### Task 4: 커버리지와 언어 품질 검증

**Files:**

- Verify: `docs/ja-JP/**`
- Verify: `docs/docs.json`

**Step 1:** 영어 페이지 경로와 `ja-JP` 페이지 경로를 비교해 누락 파일을 모두 메운다.

**Step 2:** 독립 워크스페이스에서 실행 가능한 문서 검사를 수행한다.

**Step 3:** 주요 섹션마다 대표 페이지를 골라 용어 흔들림이나 어색한 표현을 점검하고 수정한다.

**Step 4:** 커버리지와 링크 검사를 깨끗해질 때까지 다시 실행한다.
