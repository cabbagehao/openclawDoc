# 新しい言語の追加

このガイドでは、OpenClaw ドキュメントに新しい言語を追加する方法を説明します。例として、韓国語（`ko-KR`）を使用します。

## 1. メイン翻訳 Go ツールの更新

`scripts/docs-i18n/prompt.go` を修正して、新しい言語の特定のルールを追加します：

- `prettyLanguageLabel(lang string) string` に、LLM 用の読みやすいラベルを追加します：

  ```go
   case strings.EqualFold(trimmed, "ko-KR"):
    return "Korean"
  ```

- 言語が特定の翻訳ルール（特定のスペーシングの回避、特定の敬語など）を必要とする場合は、`prompt.go` に新しい `promptTemplate` 定数を作成し、`translationPrompt` 関数の `switch` ブロックで使用します。

## 2. i18n 設定ファイルの作成

`docs/.i18n/` ディレクトリに以下のファイルを作成します：

- `glossary.ko-KR.json`：特定の用語の翻訳を強制するためのオブジェクトの配列 `[{"source": "...", "target": "..."}]`。特定の用語がまだない場合は `[]` から始めます。
- `navigation.ko-KR.json`：ナビゲーションタブとグループを翻訳するためのキーと値のマッピングオブジェクト `{"English Label": "Korean Label"}`。

## 3. ヘルパースクリプトの作成

既存の日本語（`ja`）ヘルパースクリプトをコピーして、新しい言語（`ko`）用に調整します：

- `scripts/sync-ko-navigation.mjs`：`navigation.ko-KR.json` から読み取り、パスに `ko-KR/` を前置し、`language: "ko"` を設定するように修正します。
- `scripts/check-ko-coverage.mjs`：`ko-KR` ディレクトリに対してチェックするように修正します。

## 4. package.json の更新

`package.json` の `scripts` セクションに新しい言語のショートカットコマンドを追加します：

```json
"docs:i18n:ko": "go run ./scripts/docs-i18n -mode doc -lang ko-KR -parallel 2 docs",
"docs:sync-ko-nav": "node scripts/sync-ko-navigation.mjs",
"docs:check-ko": "node scripts/check-ko-coverage.mjs docs"
```

## 5. 翻訳の実行

1. 翻訳を実行：`pnpm docs:i18n:ko`（Go ツールで必要な場合は、LLM 認証情報が設定されていることを確認してください）。
2. ナビゲーションを同期：`pnpm docs:sync-ko-nav`。
3. ローカルでプレビュー：`pnpm docs:dev`。
