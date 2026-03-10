# Adding a New Language

This guide explains how to add a new language to the OpenClaw documentation. As an example, we will use Korean (`ko-KR`).

## 1. Register the Language in the Translation Tool
Modify `scripts/docs-i18n/prompt.go` to add the language mapping:
- In `prettyLanguageLabel(lang string) string`, add:
  ```go
  	case strings.EqualFold(trimmed, "ko-KR"):
  		return "Korean"
  ```

## 2. Create i18n Configuration Files
Create the following files in the `docs/.i18n/` directory:
- `glossary.ko-KR.json`: An array of objects `[{"source": "...", "target": "..."}]` for specific terminology.
- `navigation.ko-KR.json`: A mapping object `{"English Label": "Korean Label"}` for the sidebar menu.

## 3. Update package.json
Add the generic sync and check commands for the new language:
```json
"docs:i18n:ko": "go run ./scripts/docs-i18n -mode doc -lang ko-KR -parallel 2 docs",
"docs:sync-ko-nav": "node scripts/sync-navigation.mjs --lang ko-KR --code ko",
"docs:check-ko": "node scripts/check-coverage.mjs --lang ko-KR --docs docs"
```

## 4. Execute Workflow
1. **Translate**: `pnpm docs:i18n:ko` (Translates `.md` files to `docs/ko-KR/`).
2. **Sync Nav**: `pnpm docs:sync-ko-nav` (Updates `docs/docs.json` with translated navigation).
3. **Verify**: `pnpm docs:check-ko` (Ensures no files were missed).
4. **Preview**: `pnpm docs:dev`.

---

**Note**: The scripts `scripts/sync-navigation.mjs` and `scripts/check-coverage.mjs` are now generic and can be used for any language by passing the appropriate `--lang` and `--code` flags.
