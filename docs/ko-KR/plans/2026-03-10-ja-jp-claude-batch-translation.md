# ja-JP Claude 배치 번역 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 모든 영어 문서 페이지에 대응하는 `docs/ja-JP/**` 번역 문서를 만들고, 안정적인 구조와 전문적인 기술 일본어를 유지하면서 일본어 문서 트리를 완성한다.

**Architecture:** 기존 docs-i18n 프롬프트 규칙을 재사용하되, 이 환경에서는 Go 기반 번역기를 실행할 수 없으므로 로컬에서 사용 가능한 `claude` CLI를 통해 실행한다. 영어 소스 트리에서 누락된 `docs/ja-JP/**` 페이지를 직접 생성한 뒤, 탐색 구조를 동기화하고 로케일이 아닌 영어 문서 트리를 기준으로 커버리지를 검증한다.

**Tech Stack:** Node.js 스크립트, Claude CLI, Markdown/MDX 문서, Mintlify `docs/docs.json`, 용어집 기반 용어 통일.

### Task 1: 번역 실행 경로 재구성

**Files:**

- Create: `scripts/docs-i18n-claude.mjs`
- Modify: `package.json`

**Step 1:** `scripts/docs-i18n/prompt.go` 에서 일본어 번역 프롬프트 규칙을 이식한다.

**Step 2:** 명시적 태그를 사용해 프런트매터와 본문 구조를 보존하여 모델이 문서 경계를 벗어나지 않도록 한다.

**Step 3:** 번역 결과를 `docs/ja-JP/<relpath>` 에 기록하고, 반복 실행 시 건너뛸 수 있도록 소스 해시를 남긴다.

**Step 4:** 대량 번역 전에 누락된 페이지 하나를 시범 테스트로 실행한다.

### Task 2: 누락된 ja-JP 페이지를 배치 단위로 번역

**Files:**

- Create: `docs/ja-JP/**`

**Step 1:** 영어 소스 트리에서 로케일 디렉터리를 제외해 누락 페이지 목록을 계산한다.

**Step 2:** 새 배치 번역기를 낮은 병렬도로 실행해 레이트 리밋 소모를 줄인다.

**Step 3:** 대표 페이지를 표본 점검해 Markdown, MDX, 링크, 용어가 보존됐는지 확인한다.

**Step 4:** 번역되지 않은 소스 페이지가 없어질 때까지 다시 실행한다.

### Task 3: 검증과 탐색 구조 수정

**Files:**

- Modify: `scripts/check-ja-coverage.mjs`
- Modify: `docs/docs.json`

**Step 1:** 커버리지 스크립트가 `zh-CN` 과 `ja-JP` 뿐 아니라 모든 로케일 디렉터리를 무시하도록 수정한다.

**Step 2:** 모든 번역 경로가 존재한 뒤 영어 탐색 구조를 일본어에 맞게 동기화한다.

**Step 3:** `ja-JP` 아래에서 install 하위 트리와 기타 핵심 섹션이 올바르게 해석되는지 검증한다.

### Task 4: 최종 검증

**Files:**

- Verify: `docs/ja-JP/**`
- Verify: `docs/docs.json`

**Step 1:** 수정된 일본어 커버리지 검사기를 실행한다.

**Step 2:** 현재 워크스페이스에서 가능하다면 문서 링크 검사를 실행한다.

**Step 3:** 서로 다른 섹션의 몇몇 페이지를 수동 점검해 번역 품질과 포맷 드리프트를 확인한다.
