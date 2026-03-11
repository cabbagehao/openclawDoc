# ja-JP Claude 一括翻訳実施計画

> **Claude を使う場合:** 必須サブスキルとして `superpowers:executing-plans` を使い、この計画をタスク単位で実行してください。

**目標:** 日本語ドキュメントツリーを完成させ、すべての英語ドキュメントページに対して、安定した構造と専門的な技術日本語を備えた `docs/ja-JP/**` の対応ページを用意すること。

**アーキテクチャ:** 既存の docs-i18n 用プロンプトルールを再利用します。ただし、この環境では Go ベースの translator を実行できないため、ローカルで利用できる `claude` CLI 経由で同等のルールを適用します。欠落している `docs/ja-JP/**` ページを英語ソースツリーから直接生成し、navigation を同期しつつ、非ロケールの英語ドキュメントツリーに対して coverage を検証します。

**技術スタック:** Node.js スクリプト、Claude CLI、Markdown / MDX ドキュメント、Mintlify の `docs/docs.json`、用語集ベースの terminology 管理。

### タスク 1: 翻訳実行パスを再構築する

**ファイル:**

- 作成: `scripts/docs-i18n-claude.mjs`
- 変更: `package.json`

**ステップ 1:** 日本語翻訳用のプロンプトルールを `scripts/docs-i18n/prompt.go` から移植する。

**ステップ 2:** 明示的なタグを使って frontmatter / body の構造を保持し、モデル出力がドキュメント境界を越えないようにする。

**ステップ 3:** 変換結果を `docs/ja-JP/<relpath>` に書き出し、反復可能なスキップ判定のために source hash を記録する。

**ステップ 4:** 一括翻訳へ入る前に、欠落ページを 1 つ対象に確認用テストを行う。

### タスク 2: 不足している ja-JP ページをバッチ翻訳する

**ファイル:**

- 作成: `docs/ja-JP/**`

**ステップ 1:** 英語ソースツリーから locale directory を除外し、欠落しているページ一覧を算出する。

**ステップ 2:** rate limit による無駄な再試行を避けるため、欠落集合に対して低い並列度で新しい batch translator を実行する。

**ステップ 3:** 代表的なページを spot check し、Markdown、MDX、リンク、用語が維持されていることを確認する。

**ステップ 4:** 未翻訳のソースページがなくなるまで再実行する。

### タスク 3: 検証と navigation を修正する

**ファイル:**

- 変更: `scripts/check-ja-coverage.mjs`
- 変更: `docs/docs.json`

**ステップ 1:** coverage script で `zh-CN` と `ja-JP` だけでなく、すべての locale directory を無視するようにする。

**ステップ 2:** 翻訳済みパスがそろったら、英語側の navigation を日本語側へ同期する。

**ステップ 3:** install サブツリーとその他の主要セクションが `ja-JP` で正しく解決されることを確認する。

### タスク 4: 最終検証

**ファイル:**

- 検証: `docs/ja-JP/**`
- 検証: `docs/docs.json`

**ステップ 1:** 修正済みの ja coverage checker を実行する。

**ステップ 2:** 現在の workspace で可能であれば、ドキュメントのリンクチェックを実行する。

**ステップ 3:** 複数セクションから数ページを手動確認し、翻訳品質と書式ずれを点検する。
