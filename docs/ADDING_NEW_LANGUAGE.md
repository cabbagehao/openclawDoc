# Adding a New Language

This guide explains how to add a new language to the OpenClaw documentation. As an example, we will use Korean (`ko-KR`).

## 1. Update the Main Translation Go Tool

Modify `scripts/docs-i18n/prompt.go` to add specific rules for your new language:

- In `prettyLanguageLabel(lang string) string`, add a readable label for the LLM:

  ```go
   case strings.EqualFold(trimmed, "ko-KR"):
    return "Korean"
  ```

- If the language requires specific translation rules (like avoiding certain spacing, specific honorifics, etc.), create a new `promptTemplate` constant in `prompt.go` and use it in the `translationPrompt` function's `switch` block.

Translation policy:

- Use AI terminal models only for document translation and review. In this repo that means the main `scripts/docs-i18n` workflow, or direct file-by-file translation with a current AI terminal such as Codex/Gemini/Claude Code when the main tool is unavailable locally.
- Do not use generic web machine translation (for example Google Translate) for production docs. If any page was bulk machine-translated that way, treat it as temporary and retranslate it with the approved AI terminal workflow.
- Always include OpenClaw product context, core terminology, and "do not translate" rules in the model prompt, otherwise models will mis-translate product concepts like `Gateway` or `Skills`.

## 2. Create i18n Configuration Files

Create the following files in the `docs/.i18n/` directory:

- `glossary.ko-KR.json`: An array of objects `[{"source": "...", "target": "..."}]` to enforce specific terminology translations. Start with `[]` if you don't have any specific terms yet.
- `navigation.ko-KR.json`: A key-value mapping object `{"English Label": "Korean Label"}` for translating the navigation tabs and groups.

## 3. Create Helper Scripts

Copy the existing Japanese (`ja`) helper scripts and adapt them for your new language (`ko`):

- `scripts/sync-ko-navigation.mjs`: Modify it to read from `navigation.ko-KR.json`, prepend `ko-KR/` to paths, and set `language: "ko"`.
- `scripts/check-ko-coverage.mjs`: Modify it to check against the `ko-KR` directory.

## 4. Update package.json

Add shortcut commands for the new language to the `scripts` section in `package.json`:

```json
"docs:i18n:ko": "go run ./scripts/docs-i18n -mode doc -lang ko-KR -parallel 2 docs",
"docs:sync-ko-nav": "node scripts/sync-ko-navigation.mjs",
"docs:check-ko": "node scripts/check-ko-coverage.mjs docs"
```

## 5. Execute Translations

1. Run translation: `pnpm docs:i18n:ko` (Ensure you have your LLM credentials configured if required by the Go tool).
2. Sync navigation: `pnpm docs:sync-ko-nav`.
3. Preview locally: `pnpm docs:dev`.

If Go or the main translator is unavailable locally, translate file-by-file directly with an approved AI terminal model instead of introducing a generic MT fallback. Keep the same glossary/product-context rules, then continue with:

1. Sync navigation: `pnpm docs:sync-ko-nav`
2. Preview locally: `pnpm docs:dev`

## 6. Translation Pitfalls

- Do not translate internal doc paths or fragment targets. Translate visible link text, but keep route slugs stable and regenerate in-page `#fragment` targets from the localized headings.
- Re-check relative image paths after moving content under a locale directory. Paths that worked in `docs/...` can break in `docs/<locale>/...`.
- Long pages with tables, TOCs, code fences, or custom tags are the easiest to corrupt. Preserve Markdown structure first, then translate text inside that structure.
- Google-style bulk machine translation is not acceptable as a final pass. Retranslate any such content with the approved AI terminal workflow before shipping a locale.
- Run `pnpm docs:check-links`, `pnpm lint:docs`, and `pnpm format:docs` immediately after bulk translation. Catching broken links and malformed Markdown early is much cheaper than repairing a whole locale later.
