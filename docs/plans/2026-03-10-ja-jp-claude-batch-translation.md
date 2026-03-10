# ja-JP Claude Batch Translation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Japanese documentation tree so every English docs page has a corresponding `docs/ja-JP/**` translation with stable structure and professional technical Japanese.

**Architecture:** Reuse the existing docs-i18n prompt rules, but execute them through the locally available `claude` CLI because the Go-based translator cannot run in this environment. Generate missing `docs/ja-JP/**` pages directly from the English source tree, then sync navigation and verify coverage against the non-locale English docs tree.

**Tech Stack:** Node.js scripts, Claude CLI, Markdown/MDX docs, Mintlify `docs/docs.json`, glossary-driven terminology.

### Task 1: Rebuild the translation execution path

**Files:**

- Create: `scripts/docs-i18n-claude.mjs`
- Modify: `package.json`

**Step 1:** Port the Japanese translation prompt rules from `scripts/docs-i18n/prompt.go`.

**Step 2:** Preserve frontmatter/body structure via explicit tags so the model cannot drift outside the document boundaries.

**Step 3:** Write translated output to `docs/ja-JP/<relpath>` and stamp a source hash for repeatable skips.

**Step 4:** Run one missing page as a proof test before any bulk translation.

### Task 2: Translate the missing ja-JP pages in batches

**Files:**

- Create: `docs/ja-JP/**`

**Step 1:** Compute missing pages by excluding locale directories from the English source tree.

**Step 2:** Run the new batch translator over the missing set with low parallelism to avoid rate-limit churn.

**Step 3:** Spot-check representative pages for preserved Markdown, MDX, links, and terminology.

**Step 4:** Re-run until no source pages remain untranslated.

### Task 3: Fix verification and navigation

**Files:**

- Modify: `scripts/check-ja-coverage.mjs`
- Modify: `docs/docs.json`

**Step 1:** Make the coverage script ignore all locale directories, not just `zh-CN` and `ja-JP`.

**Step 2:** Sync Japanese navigation from English once all translated paths exist.

**Step 3:** Verify the install subtree and other key sections resolve under `ja-JP`.

### Task 4: Final verification

**Files:**

- Verify: `docs/ja-JP/**`
- Verify: `docs/docs.json`

**Step 1:** Run the corrected ja coverage checker.

**Step 2:** Run docs link checks if feasible in the current workspace.

**Step 3:** Manually inspect a few pages from different sections for translation quality and formatting drift.
