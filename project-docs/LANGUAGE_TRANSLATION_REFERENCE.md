# Language Translation Reference

This document contains the implementation details for adding and maintaining a
documentation locale.

## Source of truth

- `origin_docs/` is the only source of truth for meaning, structure, and scope.
- Localized files live under `docs/<locale>/`.
- Translation work must preserve frontmatter keys, links, code fences, MDX
  components, route paths, and file paths from the English source.

## 1. Register the language in the translation tool

Update [`scripts/docs-i18n/prompt.go`](../scripts/docs-i18n/prompt.go).

Add the locale label to `prettyLanguageLabel(lang string)`:

```go
case strings.EqualFold(trimmed, "xx-YY"):
	return "Example Language"
```

If the new language needs language-specific style rules beyond the generic
prompt, add a dedicated prompt template and route it from `translationPrompt`.
If not, the generic template is sufficient.

## 2. Add locale i18n assets

Create the locale files in [`docs/.i18n/`](../docs/.i18n/):

- `glossary.xx-YY.json`
- `navigation.xx-YY.json`

Glossary entries use this format:

```json
[
  { "source": "OpenClaw", "target": "OpenClaw" },
  { "source": "Quick start", "target": "Quick Start in Target Language" }
]
```

Navigation entries use this format:

```json
{
  "Getting Started": "Localized Label",
  "Providers": "Localized Label"
}
```

The glossary is prompt guidance, not a deterministic rewrite pass. That means
it improves consistency, but each translated file still requires manual review.

## 3. Carry forward prompt and glossary constraints

The locale workflow must preserve the constraints already encoded in
[`scripts/docs-i18n/prompt.go`](../scripts/docs-i18n/prompt.go) and
[`docs/.i18n/README.md`](../docs/.i18n/README.md).

### Terms that must stay in English

Keep product names in English:

- `OpenClaw`
- `Pi`
- `WhatsApp`
- `Telegram`
- `Discord`
- `iMessage`
- `Slack`
- `Microsoft Teams`
- `Google Chat`
- `Signal`

Keep these terms in English unless there is a documented locale-specific
exception:

- `Skills`
- `local loopback`
- `Tailscale`

### Technical content that must not be translated

Do not translate:

- code spans and code blocks
- config keys
- CLI flags
- environment variables
- URLs and anchors
- placeholders such as `__OC_I18N_####__`
- route paths
- literal identifiers such as `provider/model`

Keep Markdown structure, YAML structure, HTML tags, and attributes intact.
Do not remove, reorder, or summarize content.

### Glossary expectations

Before large translation batches, prepare a locale glossary for:

- product and feature names with approved localized labels
- technical terms with standardized translations
- terms that must remain in English

For Korean, for example,
[`docs/.i18n/glossary.ko-KR.json`](../docs/.i18n/glossary.ko-KR.json) keeps
terms such as `provider`, `model`, `agent`, and `node` consistent with the
repo’s documentation style.

## 4. Update package scripts

Add locale-specific commands to [`package.json`](../package.json):

```json
"docs:i18n:xx": "go run ./scripts/docs-i18n -mode doc -lang xx-YY -parallel 2 docs",
"docs:sync-xx-nav": "node scripts/sync-navigation.mjs --lang xx-YY --code xx",
"docs:check-xx": "node scripts/check-coverage.mjs --lang xx-YY --docs docs"
```

## 5. Run the workflow

1. Translate docs with `pnpm docs:i18n:xx`.
2. Sync navigation with `pnpm docs:sync-xx-nav`.
3. Verify file coverage with `pnpm docs:check-xx`.
4. Start the local preview with `pnpm docs:dev`.

For large locales, translate in batches and run Mintlify after each completed
batch instead of waiting until the end.

## 6. Review requirements

Each localized file is only complete when it has been reviewed against
`origin_docs/<same-path>` and all of the following are true:

- meaning matches the English source
- terminology follows the locale glossary
- required English literals are preserved
- frontmatter remains valid
- any locale-specific `description` or metadata policy is satisfied
- the page renders in local Mintlify preview

## Notes

- [`scripts/sync-navigation.mjs`](../scripts/sync-navigation.mjs) and
  [`scripts/check-coverage.mjs`](../scripts/check-coverage.mjs) are generic and
  can be reused for any locale with the correct flags.
- The repository has hundreds of pages, so plan translation work in small,
  reviewable batches instead of doing one uncontrolled pass.
