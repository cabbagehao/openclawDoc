# Repository Instructions for Claude

These repository-specific constraints apply when Claude edits documentation or project metadata.

## Language

- Keep repository instruction files and developer-facing guidance in English only.
- Do not add Chinese text to repository metadata, AI instruction files, or contributor guidance.

## Documentation Constraints

- Do not rename `docs/index.mdx`. Mintlify depends on that filename and extension for the homepage route and rendering.
- Treat `docs/` as public, publishable documentation only. Store internal plans, translation playbooks, and local tooling notes in root-level folders such as `plans/`, `project-docs/`, or other non-published locations.
- Use `origin_docs/` as the source of truth for translation work. When updating translations or adding new locales, compare against the mirrored English source in `origin_docs/`.
