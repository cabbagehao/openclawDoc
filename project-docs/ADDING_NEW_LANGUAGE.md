# Adding a New Language

This file is a short AI-facing checklist. It describes what must be done when a
new documentation locale is added. Use the linked reference doc for the
implementation details.

## Required outcomes

- Register the locale in [`scripts/docs-i18n/prompt.go`](../scripts/docs-i18n/prompt.go).
- Add locale assets under [`docs/.i18n/`](../docs/.i18n/), including a glossary
  and navigation map.
- Add the locale-specific package scripts needed for translation, navigation
  sync, and coverage checks.
- Create the localized docs tree under `docs/<locale>/`.
- Do not add explicit Mintlify redirects from `/<locale>/.../index` to
  `/<locale>/...`. Mintlify already resolves index routes, and explicit
  redirects can create self-redirect loops on the base path.
- Treat [`origin_docs/`](../origin_docs) as the only source of truth for
  translation meaning, structure, and scope.
- Preserve all required English literals and technical identifiers during
  translation.
- Review translated files manually in batches and validate them with local Mint
  preview.

## Completion standard

A locale is not complete until:

- coverage shows zero missing files against `origin_docs/`
- terminology follows the locale glossary
- prompt constraints are respected
- required metadata policy is applied
- the docs render locally

## Reference

For the detailed workflow, prompt constraints, glossary rules, and verification
steps, see
[`project-docs/LANGUAGE_TRANSLATION_REFERENCE.md`](./LANGUAGE_TRANSLATION_REFERENCE.md).
