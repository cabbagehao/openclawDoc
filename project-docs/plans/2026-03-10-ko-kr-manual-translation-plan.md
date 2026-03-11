# ko-KR Manual Translation Plan

> **For Codex:** Translate directly from the English source docs in this workspace. Do not use the Go translation pipeline or `claude` CLI for content generation.

**Goal:** Expand `docs/ko-KR/**` so Korean coverage matches the English documentation tree with natural, consistent Korean.

**Architecture:** Use the English docs tree as the source of truth. Translate pages directly in batches, preserving frontmatter keys, links, code fences, Mintlify components, file paths, and product names while rewriting prose into idiomatic Korean. Track terminology centrally in `docs/.i18n/glossary.ko-KR.json` and validate coverage after each batch.

**Tech Stack:** Markdown/MDX docs, Mintlify `docs.json`, local Node scripts, manual translation in Codex, targeted coverage and link checks.

### Task 1: Establish Korean translation conventions

**Files:**

- Modify: `docs/.i18n/glossary.ko-KR.json`
- Reference: `docs/ADDING_NEW_LANGUAGE.md`
- Reference: `docs/docs.json`

**Step 1:** Define stable Korean terminology for core product nouns and UI labels.

**Step 2:** Preserve English product names, CLI commands, env vars, code, URLs, and config keys.

**Step 3:** Use the English docs tree as the only translation source; ignore Japanese locale content.

### Task 2: Translate docs in section-sized batches

**Files:**

- Create: `docs/ko-KR/**`
- Reference: `docs/**/*.md`
- Reference: `docs/**/*.mdx`

**Step 1:** Start with high-traffic entry pages and short root docs.

**Step 2:** Translate one disjoint section at a time (`start`, `web`, `channels`, `cli`, `concepts`, and so on).

**Step 3:** Keep frontmatter structure, component tags, images, and link targets unchanged while translating visible text.

**Step 4:** Review phrasing inline so Korean reads like documentation, not literal machine output.

### Task 3: Sync navigation after sufficient page coverage

**Files:**

- Modify: `docs/docs.json`
- Reference: `docs/.i18n/navigation.ko-KR.json`

**Step 1:** Translate sidebar labels as coverage expands.

**Step 2:** Sync the Korean navigation only after the referenced page set exists.

**Step 3:** Keep tab, group, and page order aligned with English.

### Task 4: Validate after every batch

**Files:**

- Verify: `docs/ko-KR/**`
- Verify: `docs/docs.json`

**Step 1:** Run `node scripts/check-coverage.mjs --lang ko-KR --docs docs` after each batch.

**Step 2:** Run formatting and link checks on touched files where practical.

**Step 3:** Fix terminology drift, untranslated prose, and broken internal links before moving to the next batch.
