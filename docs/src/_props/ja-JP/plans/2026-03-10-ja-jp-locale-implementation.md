# ja-JP ロケール拡張実施計画

> **Claude を使う場合:** 必須サブスキルとして `superpowers:executing-plans` を使い、この計画をタスク単位で実行してください。

**目標:** `ja-JP` ロケールを拡張し、英語ドキュメントの coverage と navigation 構造を、自然で専門的な日本語で再現すること。

**アーキテクチャ:** 既存の英語ドキュメントツリーを信頼できる source of truth として扱い、各英語ページに対して `docs/ja-JP/**` を生成します。あわせて、英語 navigation を `docs/docs.json` 上で日本語ロケールへミラーリングします。リンク、code block、component tag、frontmatter 構造、製品用語を維持しつつ、本文や label は慣用的な日本語へ翻訳します。

**技術スタック:** Markdown / MDX ドキュメント、Mintlify `docs.json`、ローカルの Node / pnpm スクリプト、翻訳とレビュー用 subagent、リンクチェックと coverage 差分による限定的な検証。

### タスク 1: 翻訳ベースラインを確立する

**ファイル:**

* 作成 / 変更: `docs/ja-JP/**`
* 変更: `docs/.i18n/glossary.ja-JP.json`
* 参照: `docs/docs.json`

**ステップ 1:** `docs/ja-JP/**` に存在すべき英語ドキュメントページの一覧を作成する。

**ステップ 2:** 現在の `ja-JP` coverage gap を確認し、source file をトップレベル section ごとに分割して、書き込み競合のない並列作業ができるようにする。

**ステップ 3:** 複数 section で共通利用する製品用語や UI 用語を含む日本語 glossary を拡張する。

**ステップ 4:** 本格展開前に、1 ページ分の翻訳で構造保持ができていることを確認する。

### タスク 2: すべての英語ページを `docs/ja-JP/**` に翻訳する

**ファイル:**

* 作成: `docs/ja-JP/**`
* 参照: `docs/**/*.md`、`docs/**/*.mdx`

**ステップ 1:** 英語ソースツリーを、互いに重ならない section ownership に分割する。

**ステップ 2:** section ごとに翻訳 worker を割り当て、各 worker が自分の `docs/ja-JP/<section>/**` サブツリーだけを書き込むようにする。

**ステップ 3:** 自然言語コンテンツを翻訳しつつ、frontmatter key、内部リンク、code fence、Mintlify component、ファイル名を保持する。

**ステップ 4:** 残っているルートレベルの singleton page（`index.md`、`pi.md`、`perplexity.md`、`vps.md` など）も `docs/ja-JP/` に変換する。

### タスク 3: 英語 navigation を日本語向けにミラーリングする

**ファイル:**

* 変更: `docs/docs.json`

**ステップ 1:** 英語ロケールの navigation 構造を日本語ロケールへコピーする。

**ステップ 2:** 全ページの path を `ja-JP/...` に書き換える。

**ステップ 3:** ページ順を英語と一致させたまま、tab と group の label を簡潔で自然な日本語に翻訳する。

**ステップ 4:** 参照されているすべての `ja-JP` ページが存在することを確認する。

### タスク 4: coverage と言語品質を検証する

**ファイル:**

* 検証: `docs/ja-JP/**`
* 確認: `docs/docs.json`

**ステップ 1:** 英語ページパスと `ja-JP` ページパスを比較し、不足ファイルがあれば埋める。

**ステップ 2:** standalone workspace で実行できる document check を回す。

**ステップ 3:** 各主要 section の代表ページに対して対象言語 QA を行い、用語のずれや不自然な表現を修正する。

**ステップ 4:** coverage とリンクチェックを、結果がきれいになるまで繰り返す。
