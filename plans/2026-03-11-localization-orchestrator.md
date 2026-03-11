# Localization Orchestrator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a generic, resumable localization orchestrator that uses `codex cli` and `gemini cli` to translate and review one documentation file at a time until a language run fully completes.

**Architecture:** Add a Node.js orchestration layer under `tools/localization/` that treats each document as a durable job stored in per-language SQLite state. Each job runs through `translate -> validate -> review -> validate`, with all prompts, logs, and artifacts written to language-specific runtime folders so the system can resume safely after any CLI interruption. Reuse existing repo assets for glossary, translation memory, coverage checks, and navigation syncing instead of replacing the current docs i18n workflow.

**Tech Stack:** Node.js 22, SQLite, native child process execution, YAML config, existing repo scripts in `scripts/` and `docs/.i18n/`

### Task 1: Create the localization module skeleton

**Files:**
- Create: `tools/localization/bin/l10n.mjs`
- Create: `tools/localization/src/core/`
- Create: `tools/localization/src/providers/`
- Create: `tools/localization/src/phases/`
- Create: `tools/localization/src/validators/`
- Create: `tools/localization/src/prompts/`
- Create: `tools/localization/config/providers.json`
- Create: `tools/localization/config/languages/ja-JP.yaml`
- Create: `tools/localization/runtime/.gitkeep`

**Step 1: Write the failing smoke test**

Create `tools/localization/tests/cli-smoke.test.mjs` with a test that runs `node tools/localization/bin/l10n.mjs --help` and expects exit code `0`.

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/cli-smoke.test.mjs`
Expected: FAIL because the CLI entrypoint does not exist yet.

**Step 3: Write minimal implementation**

Create a minimal CLI entrypoint that prints usage, and add placeholder directories plus a default `ja-JP` config file that points at `docs`, `docs/ja-JP`, `docs/.i18n/glossary.ja-JP.json`, and `docs/.i18n/ja-JP.tm.jsonl`.

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/cli-smoke.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization docs/plans/2026-03-11-localization-orchestrator.md
git commit -m "feat: scaffold localization orchestrator"
```

### Task 2: Add configuration loading and language runtime bootstrapping

**Files:**
- Create: `tools/localization/src/core/config.mjs`
- Create: `tools/localization/src/core/runtime.mjs`
- Modify: `tools/localization/bin/l10n.mjs`
- Test: `tools/localization/tests/config.test.mjs`

**Step 1: Write the failing test**

Create a test that calls `l10n.mjs init --lang ja-JP` and asserts the following paths are created:

- `tools/localization/runtime/ja-JP/state.sqlite`
- `tools/localization/runtime/ja-JP/events.jsonl`
- `tools/localization/runtime/ja-JP/logs/`
- `tools/localization/runtime/ja-JP/artifacts/`
- `tools/localization/runtime/ja-JP/dead-letter/`

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/config.test.mjs`
Expected: FAIL because `init` does not exist.

**Step 3: Write minimal implementation**

Implement config parsing and runtime initialization so each language has isolated config and runtime paths. Fail fast on missing glossary or TM files, but allow missing target files because the orchestrator may be creating them for the first time.

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/config.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization
git commit -m "feat: add localization config and runtime bootstrap"
```

### Task 3: Implement SQLite job store and manifest scan

**Files:**
- Create: `tools/localization/src/core/db.mjs`
- Create: `tools/localization/src/core/manifest.mjs`
- Modify: `tools/localization/bin/l10n.mjs`
- Test: `tools/localization/tests/manifest.test.mjs`

**Step 1: Write the failing test**

Create a test that runs `l10n.mjs scan --lang ja-JP` and asserts jobs are inserted for English docs under `docs/` while skipping locale folders, `.i18n`, `images`, and `assets`, matching the filtering behavior in `scripts/check-coverage.mjs`.

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/manifest.test.mjs`
Expected: FAIL because scan and database storage are not implemented.

**Step 3: Write minimal implementation**

Implement tables:

- `jobs`
- `attempts`
- `artifacts`

Store one row per source file with `pending` status and deterministic `source_path -> target_path` mapping. Ensure `scan` is idempotent and does not duplicate existing jobs.

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/manifest.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization
git commit -m "feat: add localization manifest and job store"
```

### Task 4: Add provider adapters for Codex CLI and Gemini CLI

**Files:**
- Create: `tools/localization/src/providers/base.mjs`
- Create: `tools/localization/src/providers/codex.mjs`
- Create: `tools/localization/src/providers/gemini.mjs`
- Create: `tools/localization/src/core/process.mjs`
- Test: `tools/localization/tests/providers.test.mjs`

**Step 1: Write the failing test**

Create tests that build command objects for:

- `codex` translate
- `codex` review
- `gemini` translate
- `gemini` review

The tests should assert timeout, argv, working directory, output capture path, and environment wiring.

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/providers.test.mjs`
Expected: FAIL because no provider adapters exist.

**Step 3: Write minimal implementation**

Create a common provider interface that returns:

- command and args
- timeout
- output parsing strategy
- whether JSON output mode is enabled

Do not embed prompt text in provider modules. Providers should receive prompt files and data prepared by phase runners.

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/providers.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization
git commit -m "feat: add codex and gemini provider adapters"
```

### Task 5: Build prompt context assembly

**Files:**
- Create: `tools/localization/src/core/context.mjs`
- Create: `tools/localization/src/prompts/translate.md`
- Create: `tools/localization/src/prompts/review.md`
- Create: `tools/localization/src/prompts/fix.md`
- Test: `tools/localization/tests/context.test.mjs`

**Step 1: Write the failing test**

Create tests that verify context assembly includes:

- source document body
- target language info
- glossary entries
- TM snippets
- same-directory translated file summaries when available
- formatting constraints

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/context.test.mjs`
Expected: FAIL because prompt context generation does not exist.

**Step 3: Write minimal implementation**

Implement context assembly with bounded input size. Include full source text, but trim glossary and TM to the most relevant hits. Keep prompts phase-specific:

- `translate`: produce full translated document only
- `review`: compare source and draft, then output corrected full document only
- `fix`: consume validation failures and output corrected full document only

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/context.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization
git commit -m "feat: add localization prompt context assembly"
```

### Task 6: Implement structure validation

**Files:**
- Create: `tools/localization/src/validators/markdown.mjs`
- Create: `tools/localization/src/validators/structure.mjs`
- Test: `tools/localization/tests/validators.test.mjs`

**Step 1: Write the failing test**

Create tests that feed intentionally broken drafts and assert the validator catches:

- code fence count mismatch
- heading count mismatch
- frontmatter corruption
- markdown link target corruption
- missing fenced code language markers when originally present

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/validators.test.mjs`
Expected: FAIL because no validators exist.

**Step 3: Write minimal implementation**

Implement non-language structural checks only. Do not try to judge translation quality here. The validator should return machine-readable findings that can be fed to the `fix` phase.

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/validators.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization
git commit -m "feat: add localization structure validators"
```

### Task 7: Implement phase runners and worker loop

**Files:**
- Create: `tools/localization/src/phases/translate.mjs`
- Create: `tools/localization/src/phases/review.mjs`
- Create: `tools/localization/src/phases/fix.mjs`
- Create: `tools/localization/src/core/worker.mjs`
- Modify: `tools/localization/bin/l10n.mjs`
- Test: `tools/localization/tests/worker.test.mjs`

**Step 1: Write the failing test**

Create a worker integration test with a fake provider that:

- returns a draft for translate
- passes validation or fails with known findings
- returns a corrected draft for review or fix

Assert the final job state becomes `completed` and artifacts are written to the runtime folder.

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/worker.test.mjs`
Expected: FAIL because the worker loop does not exist.

**Step 3: Write minimal implementation**

Implement the job state machine:

`pending -> translating -> validating -> review_pending -> reviewing -> validating -> completed`

Error states:

`retry_wait`, `dead_letter`

On process crash or timeout, record the attempt, increment retries, and return the job to the queue or dead letter.

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/worker.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization
git commit -m "feat: add localization worker loop"
```

### Task 8: Add report and doctor commands

**Files:**
- Create: `tools/localization/src/core/report.mjs`
- Create: `tools/localization/src/core/doctor.mjs`
- Modify: `tools/localization/bin/l10n.mjs`
- Test: `tools/localization/tests/report.test.mjs`

**Step 1: Write the failing test**

Create tests for:

- `report --lang ja-JP` showing counts by status
- `doctor --lang ja-JP` checking CLI availability, config files, and runtime directories

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/report.test.mjs`
Expected: FAIL because report and doctor commands do not exist.

**Step 3: Write minimal implementation**

Implement text and JSON output for progress reporting, plus a basic health check for:

- `codex` executable
- `gemini` executable
- glossary file
- TM file
- docs source root
- target language root

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/report.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/localization
git commit -m "feat: add localization reporting and doctor commands"
```

### Task 9: Integrate repo-level verification hooks

**Files:**
- Modify: `package.json`
- Create: `tools/localization/src/validators/repo-checks.mjs`
- Test: `tools/localization/tests/repo-checks.test.mjs`

**Step 1: Write the failing test**

Create a test that verifies the orchestrator can invoke repo checks after successful output for `ja-JP`, including coverage and optional navigation sync hooks.

**Step 2: Run test to verify it fails**

Run: `node --test tools/localization/tests/repo-checks.test.mjs`
Expected: FAIL because repo checks are not wired.

**Step 3: Write minimal implementation**

Add lightweight integration points for:

- `node scripts/check-coverage.mjs --lang <lang> --docs docs`
- optional language-specific post-run hooks such as `node scripts/sync-navigation.mjs ...`

Do not run full repo linting after every file. Keep checks targeted and cheap.

**Step 4: Run test to verify it passes**

Run: `node --test tools/localization/tests/repo-checks.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json tools/localization
git commit -m "feat: wire localization repo verification hooks"
```

### Task 10: Add operator documentation

**Files:**
- Create: `tools/localization/README.md`
- Modify: `README.md`
- Test: manual verification only

**Step 1: Write the documentation**

Document:

- supported commands
- required CLIs and authentication assumptions
- per-language config layout
- runtime folder contents
- recovery flow after interruption
- dead-letter review flow

**Step 2: Verify commands in a dry run**

Run:

```bash
node tools/localization/bin/l10n.mjs doctor --lang ja-JP
node tools/localization/bin/l10n.mjs init --lang ja-JP
node tools/localization/bin/l10n.mjs scan --lang ja-JP
node tools/localization/bin/l10n.mjs report --lang ja-JP
```

Expected: each command exits `0` and prints operator-readable output.

**Step 3: Commit**

```bash
git add README.md tools/localization
git commit -m "docs: add localization orchestrator usage guide"
```

## Verification Checklist

Run these before claiming the MVP is ready:

```bash
node --test tools/localization/tests/*.test.mjs
node tools/localization/bin/l10n.mjs doctor --lang ja-JP
node tools/localization/bin/l10n.mjs init --lang ja-JP
node tools/localization/bin/l10n.mjs scan --lang ja-JP
node tools/localization/bin/l10n.mjs report --lang ja-JP
```

Expected outcomes:

- test suite passes
- `doctor` confirms required dependencies
- `init` creates isolated runtime state
- `scan` inserts English source docs as jobs without duplicates
- `report` shows deterministic counts and no malformed statuses

## Notes

- Keep runtime data under `tools/localization/runtime/<lang>/` so Japanese, Korean, and future languages remain isolated.
- Prefer one-file jobs. Do not batch multiple docs into a single model invocation for MVP.
- Quality is enforced by prompt context, glossary/TM reuse, review phase, and structural validators, not by extra-long single-shot prompts.
- Treat `codex` and `gemini` as disposable subprocesses. The orchestrator, not the model session, is the durable system.
