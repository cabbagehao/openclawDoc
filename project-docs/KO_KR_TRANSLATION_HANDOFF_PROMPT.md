# ko-KR Translation Handoff Prompt

Use the prompt below to continue the ongoing Korean documentation refresh work:

```text
Continue the ongoing Korean documentation refresh in `/home/haocheng/Projects/openclawDoc`.

Goal:
Review every file under `docs/ko-KR/**` one by one against `origin_docs/**`, and for each Korean document do both:
1. Rewrite or fix the Korean translation so it is accurate, professional, and natural for Korean internet technical documentation.
2. Add or improve frontmatter `description`, similar to the Japanese docs style, but keep it concise and useful for SEO. Every `description` must be <= 160 characters.

Important constraints:
- Do not stop for confirmation between batches. Keep going autonomously until the whole Korean set is done, unless there is a real blocker.
- Use `origin_docs/` as the source of truth.
- Preserve English literals where appropriate: code blocks, CLI flags, env vars, config keys, paths, URLs, product names, `provider/model`, etc.
- Korean docs are allowed to contain Korean, but repository instruction and developer docs should remain English-only.
- Do not revert unrelated user changes.
- Use `apply_patch` for manual file edits.
- After each batch, update `plans/2026-03-15-ko-kr-translation-checklist.md`.
- After each batch, verify locally with Mint preview.

Validation requirements for each batch:
1. Run `git diff --check -- <touched files>`.
2. Confirm every touched file's `description` length is <= 160 chars.
3. Confirm fenced code blocks in touched Korean files contain no Hangul or translated residue.
4. Run local preview with `CI=1 pnpm docs:dev`.
5. Probe locally and confirm one port returns `200`, typically `http://127.0.0.1:3000`.
6. Existing Mint warnings about `security/README` and `ko-KR/security/README` are known pre-existing warnings and are not caused by this task.

Current progress:
- Checklist progress is `262 / 352` completed (`74.4%`), with `90` remaining.
- The checklist file is `plans/2026-03-15-ko-kr-translation-checklist.md`.

Recently completed and already checked:
- `docs/ko-KR/tools/pdf.md`
- `docs/ko-KR/tools/exec.md`
- `docs/ko-KR/tools/web.md`
- `docs/ko-KR/tools/index.md`
- `docs/ko-KR/tools/diffs.md`
- `docs/ko-KR/start/hubs.md`
- `docs/ko-KR/start/setup.md`
- `docs/ko-KR/install/node.md`
- `docs/ko-KR/nodes/audio.md`
- `docs/ko-KR/nodes/index.md`
- `docs/ko-KR/gateway/index.md`

These were verified:
- `description` values are <= 160 characters.
- Fenced code blocks were cleaned back to English literals where needed.
- Mint preview was reachable at `3000 -> 200`.

Next recommended targets:
- `docs/ko-KR/install/fly.md`
- `docs/ko-KR/install/gcp.md`

Notes on those next targets:
- `install/fly.md` and especially `install/gcp.md` appear to have more drift from `origin_docs/` than recent files.
- `gcp` was heavily compressed and likely needs substantial restoration from the English source.
- Keep the Korean technically accurate, not overly literal, and aligned with the actual source structure.

Response behavior:
- Use short progress updates while working.
- Do not use a final wrap-up until the full Korean refresh is actually complete.
```
