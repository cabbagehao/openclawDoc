# ko-KR Translation Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework every `docs/ko-KR/**` document against its `origin_docs/**` English source and add a high-quality `description` field to each frontmatter block.

**Architecture:** Treat `origin_docs/` as the only source of truth for meaning, structure, and scope. Update `docs/ko-KR/` in small directory-based batches, preserving frontmatter keys, links, code fences, MDX components, and file paths while rewriting Korean copy into natural technical-documentation style. After each batch, run local Mintlify validation before moving on.

**Tech Stack:** Markdown/MDX docs, Mintlify `docs/docs.json`, local shell tooling, `node scripts/check-coverage.mjs`, local `mint dev`.

---

### Task 1: Establish the working set and persistent checklist

**Files:**
- Create: `plans/2026-03-15-ko-kr-translation-checklist.md`
- Modify: `plans/2026-03-15-ko-kr-translation-refresh-plan.md`
- Reference: `origin_docs/**`
- Reference: `docs/ko-KR/**`

**Step 1: Build the file inventory**

Run:

```bash
node - <<'NODE'
const fs=require('fs'); const path=require('path');
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory()) walk(p,out); else if(/\.mdx?$/.test(e.name)&&!p.includes('.i18n')) out.push(p)} return out}
const files=walk('docs/ko-KR').map(f=>path.relative('docs/ko-KR',f).replace(/\\/g,'/')).sort();
console.log(files.length);
NODE
```

Expected: `352`

**Step 2: Save the grouped checklist**

Record every `docs/ko-KR/**` file in `plans/2026-03-15-ko-kr-translation-checklist.md` with unchecked boxes grouped by top-level directory.

**Step 3: Define the completion rule**

For each file, completion means:
- Body copy reviewed against `origin_docs/<same-path>`
- Frontmatter includes a natural Korean `description`
- Korean phrasing reads like native technical documentation, not direct machine translation
- Literal identifier tokens remain unchanged from the English source, including `x-i18n.source_path`, route paths, CLI flags, env vars, config keys, placeholders, and `provider/model` strings

### Task 2: Execute translation refresh batch-by-batch

**Files:**
- Modify: `docs/ko-KR/**`
- Reference: `origin_docs/**`
- Modify: `plans/2026-03-15-ko-kr-translation-checklist.md`

**Step 1: Pick one directory batch**

Process one top-level directory or a small root-file batch at a time. Recommended order:
- Root files
- `start/`
- `providers/`
- `gateway/`
- `channels/`
- `cli/`
- Remaining directories

**Step 2: Rewrite each file one by one**

For every file in the batch:
- Open `origin_docs/<relative-path>`
- Open `docs/ko-KR/<relative-path>`
- Rewrite Korean copy to match the English source accurately
- Preserve code, commands, URLs, component syntax, and configuration keys
- Add or improve the `description` frontmatter field

**Step 3: Mark the file complete**

Flip the checkbox for each completed file in `plans/2026-03-15-ko-kr-translation-checklist.md`.

### Task 3: Validate every completed batch locally

**Files:**
- Validate: `docs/ko-KR/**`
- Validate: `docs/docs.json`

**Step 1: Check coverage**

Run:

```bash
node scripts/check-coverage.mjs --lang ko-KR --docs docs
```

Expected: `missingCount: 0`

**Step 2: Start local Mintlify**

Run:

```bash
pnpm docs:dev
```

Expected: local Mintlify dev server starts successfully with the updated batch.

**Step 3: Fix issues before continuing**

If Mintlify reports frontmatter, route, or MDX issues, fix them in the same batch before moving on.

### Task 4: Finish the full rewrite and final verification

**Files:**
- Modify: `docs/ko-KR/**`
- Modify: `plans/2026-03-15-ko-kr-translation-checklist.md`

**Step 1: Complete all remaining batches**

Do not stop at partial coverage. Every checkbox must be checked.

**Step 2: Run final verification**

Run:

```bash
node scripts/check-coverage.mjs --lang ko-KR --docs docs
pnpm docs:dev
```

Expected:
- Coverage reports zero missing files
- Mintlify dev server starts cleanly after the final batch

**Step 3: Prepare the final change summary**

Report:
- Total ko-KR files refreshed
- `description` coverage result
- Validation evidence
