# 新しい言語の追加

このガイドでは、OpenClaw ドキュメントに新しい言語を追加する方法を説明します。例として、韓国語（`ko-KR`）を使用します。

## 1. 翻訳ツールに言語を登録する

言語の対応付けを追加するために、`scripts/docs-i18n/prompt.go` を修正します。

- `prettyLanguageLabel(lang string) string` に次を追加します。

  ```go
	case strings.EqualFold(trimmed, "ko-KR"):
		return "Korean"
  ```

## 2. i18n 設定ファイルを作成する

`docs/.i18n/` ディレクトリに次のファイルを作成します。

- `glossary.ko-KR.json`: 特定の用語に対する `[{"source": "...", "target": "..."}]` 形式のオブジェクト配列です。
- `navigation.ko-KR.json`: サイドバーメニュー用の `{"English Label": "Korean Label"}` 形式のマッピングオブジェクトです。

## 3. package.json を更新する

新しい言語向けの汎用的な同期コマンドとチェックコマンドを追加します。

```json
"docs:i18n:ko": "go run ./scripts/docs-i18n -mode doc -lang ko-KR -parallel 2 docs",
"docs:sync-ko-nav": "node scripts/sync-navigation.mjs --lang ko-KR --code ko",
"docs:check-ko": "node scripts/check-coverage.mjs --lang ko-KR --docs docs"
```

## 4. ワークフローを実行する

1. **翻訳**: `pnpm docs:i18n:ko`（`.md` ファイルを `docs/ko-KR/` に翻訳します）。
2. **ナビゲーション同期**: `pnpm docs:sync-ko-nav`（翻訳済みナビゲーションで `docs/docs.json` を更新します）。
3. **検証**: `pnpm docs:check-ko`（未翻訳のファイルがないことを確認します）。
4. **プレビュー**: `pnpm docs:dev`。

---

**注記**: `scripts/sync-navigation.mjs` と `scripts/check-coverage.mjs` は現在汎用化されており、適切な `--lang` と `--code` フラグを渡せば任意の言語で利用できます。

全体で 300 ページ以上あるため、十分な時間とトークンを確保したうえで、品質を保てるようにバッチ単位・セクション単位で翻訳を進めます。
