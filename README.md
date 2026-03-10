# OpenClaw Docs Workspace

This directory is a standalone workspace for running and maintaining the OpenClaw documentation site without the rest of the main repository.

## Setup

Runtime requirements:

- Node 22+
- `mint` installed and working
- `pnpm`
- Go, if you want to run the translation pipeline

Install the local Node tooling:

```bash
pnpm install
```

Start the docs preview:

```bash
pnpm docs:dev
```

## Commands

- `pnpm docs:dev`
  Runs the Mintlify local preview from `docs/`.

- `pnpm check:docs`
  Runs the docs format check, Markdown lint, and internal link audit together.

- `pnpm format:docs`
  Formats all docs Markdown files and this workspace `README.md` with `oxfmt`.

- `pnpm format:docs:check`
  Checks formatting only, without modifying files.

- `pnpm lint:docs`
  Runs `markdownlint-cli2` with the copied workspace config in `.markdownlint-cli2.jsonc`.

- `pnpm lint:docs:fix`
  Runs the same linter with `--fix` for auto-fixable issues.

- `pnpm docs:check-links`
  Audits internal links inside `docs/` and validates root-relative docs routes, redirects, and relative file references.

- `pnpm docs:list`
  Lists docs pages with their `summary` and `read_when` frontmatter, which is useful for discovering coverage and missing metadata.

- `pnpm docs:bin`
  Generates `bin/docs-list`, a small executable wrapper around `scripts/docs-list.js`.

- `pnpm docs:spellcheck`
  Runs `codespell` across `README.md` and `docs/`, using the copied custom dictionary and ignore list.

- `pnpm docs:spellcheck:fix`
  Runs the same spellcheck pass in write mode.

- `pnpm docs:sync-moonshot`
  Refreshes the Moonshot/Kimi model tables in the docs from the local copied model dataset.

- `pnpm docs:i18n -- -lang <locale> <files...>`
  Runs the Go-based docs translation pipeline. Example:

  ```bash
  pnpm docs:i18n -- -lang ja-JP docs/index.md docs/start/getting-started.md
  ```

## Copied Scripts

- `scripts/build-docs-list.mjs`
  Creates the `bin/docs-list` wrapper.

- `scripts/docs-format-targets.mjs`
  Emits the markdown file list used by the format commands. This replaces the main repo's `git ls-files` dependency so formatting still works in a standalone directory.

- `scripts/docs-link-audit.mjs`
  Scans markdown files, skips code fences and external links, resolves `docs/docs.json` redirects, and fails if an internal link target is missing.

- `scripts/docs-list.js`
  Walks the docs tree, reads frontmatter, and prints page summaries plus `read_when` hints.

- `scripts/docs-spellcheck.sh`
  Runs `codespell`, auto-installing it via Python when needed.

- `scripts/sync-moonshot-docs.ts`
  Updates model IDs, aliases, and model metadata blocks in the Moonshot docs.

- `scripts/moonshot-kimi-k2.ts`
  Local data source used by `scripts/sync-moonshot-docs.ts`.

- `scripts/docs-i18n/`
  Go translation pipeline that reads `docs/.i18n/glossary.<lang>.json` and `docs/.i18n/<lang>.tm.jsonl`, translates source docs, and writes output to `docs/<lang>/...`.

- `scripts/codespell-dictionary.txt`
  Custom accepted spellings.

- `scripts/codespell-ignore.txt`
  Strings to suppress during spellcheck.

- `.markdownlint-cli2.jsonc`
  Markdown lint config copied from the main repo.

## Notes

- This workspace is enough to run and maintain the docs site, but it is not a full replacement for the main repository.
- Some docs content still references the broader OpenClaw codebase as examples, but the docs preview itself does not need that code to run.
- `mint` maintains its own local preview client under `~/.mintlify`.
