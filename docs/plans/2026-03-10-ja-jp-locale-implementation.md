# ja-JP Locale Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the `ja-JP` locale so it matches the English docs coverage and navigation structure with professional, natural Japanese.

**Architecture:** Use the existing English docs tree as the source of truth, generate `docs/ja-JP/**` for every English page, then mirror the English navigation in `docs/docs.json` under the Japanese locale. Keep links, code blocks, component tags, frontmatter structure, and product terms stable while translating prose and labels into idiomatic Japanese.

**Tech Stack:** Markdown/MDX docs, Mintlify `docs.json`, local Node/pnpm scripts, subagents for translation and review, targeted verification with docs link checks and coverage diffs.

### Task 1: Establish the translation baseline

**Files:**

- Create/modify: `docs/ja-JP/**`
- Modify: `docs/.i18n/glossary.ja-JP.json`
- Reference: `docs/docs.json`

**Step 1:** Inventory every English doc page that must exist in `docs/ja-JP/**`.

**Step 2:** Confirm the current `ja-JP` coverage gap and group source files by top-level section to allow parallel work without write conflicts.

**Step 3:** Expand the Japanese glossary with stable product and UI terms needed across multiple sections.

**Step 4:** Verify one translated page for structure preservation before scaling.

### Task 2: Translate all English pages into `docs/ja-JP/**`

**Files:**

- Create: `docs/ja-JP/**`
- Reference: `docs/**/*.md`, `docs/**/*.mdx`

**Step 1:** Split the English source tree into disjoint section ownerships.

**Step 2:** Dispatch translation workers for each owned section so each worker writes only its own `docs/ja-JP/<section>/**` subtree.

**Step 3:** Preserve frontmatter keys, internal links, code fences, Mintlify components, and filenames while translating natural-language content.

**Step 4:** Translate remaining root-level singleton pages (`index.md`, `pi.md`, `perplexity.md`, `vps.md`, and similar files) into `docs/ja-JP/`.

### Task 3: Mirror English navigation for Japanese

**Files:**

- Modify: `docs/docs.json`

**Step 1:** Copy the English locale navigation structure into the Japanese locale.

**Step 2:** Rewrite every page path to `ja-JP/...`.

**Step 3:** Translate tab and group labels into concise, natural Japanese while keeping page order identical to English.

**Step 4:** Ensure every referenced `ja-JP` page exists.

### Task 4: Validate coverage and language quality

**Files:**

- Verify: `docs/ja-JP/**`
- Verify: `docs/docs.json`

**Step 1:** Diff English page paths against `ja-JP` page paths and close any missing files.

**Step 2:** Run docs checks that can operate in the standalone workspace.

**Step 3:** Perform targeted language QA on representative pages from each major section and fix terminology drift or unnatural phrasing.

**Step 4:** Re-run coverage and links until clean.
