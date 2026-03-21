---
title: "PDF Tool"
seoTitle: "OpenClaw PDFツールの使い方と抽出フロー・制約ガイド"
summary: "ネイティブプロバイダーのサポートと抽出フォールバックを使用して 1 つ以上の PDF ドキュメントを分析します"
read_when:
description: "pdf は 1 つ以上の PDF ドキュメントを分析し、テキストを返します。可用性、入力リファレンス、サポートされている PDF 参照を確認できます。"
x-i18n:
  source_hash: "1057349f9b2339cd79dfd1857e71b2521a75998869883609aeb399492122e0ad"
---
`pdf` は 1 つ以上の PDF ドキュメントを分析し、テキストを返します。

素早い動作:

- Anthropic および Google モデル プロバイダーのネイティブ プロバイダー モード。
- 他のプロバイダーの抽出フォールバック モード (最初にテキストを抽出し、必要に応じて画像をページングします)。
- 単一 (`pdf`) または複数 (`pdfs`) 入力をサポートし、呼び出しごとに最大 10 個の PDF をサポートします。

## 可用性

このツールは、OpenClaw がエージェントの PDF 対応モデル構成を解決できる場合にのみ登録されます。

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel` へのフォールバック
3. 利用可能な認証に基づいてベスト エフォート プロバイダーのデフォルトにフォールバックする

使用可能なモデルを解決できない場合、`pdf` ツールは公開されません。

## 入力リファレンス

- `pdf` (`string`): 1 つの PDF パスまたは URL
- `pdfs` (`string[]`): 複数の PDF パスまたは URL、合計 10 個まで
- `prompt` (`string`): 分析プロンプト、デフォルト `Analyze this PDF document.`
- `pages` (`string`): `1-5` または `1,3,7-9` のようなページ フィルター
- `model` (`string`): オプションのモデル オーバーライド (`provider/model`)
- `maxBytesMb` (`number`): PDF ごとのサイズ上限 (MB)

メモを入力します:- `pdf` と `pdfs` はロード前にマージされ、重複が排除されます。

- PDF 入力が提供されない場合、ツールはエラーになります。
- `pages` は 1 から始まるページ番号として解析され、重複排除され、並べ替えられ、構成された最大ページに固定されます。
- `maxBytesMb` のデフォルトは `agents.defaults.pdfMaxBytesMb` または `10` です。

## サポートされている PDF 参照

- ローカル ファイル パス (`~` 拡張を含む)
- `file://` URL
- `http://` および `https://` URL

参考ノート:

- 他の URI スキーム (`ftp://` など) は `unsupported_pdf_reference` で拒否されます。
- サンドボックス モードでは、リモート `http(s)` URL は拒否されます。
- ワークスペースのみのファイル ポリシーが有効になっている場合、許可されたルート以外のローカル ファイル パスは拒否されます。

## 実行モード

### ネイティブプロバイダーモード

プロバイダー `anthropic` および `google` にはネイティブ モードが使用されます。
このツールは、生の PDF バイトをプロバイダー API に直接送信します。

ネイティブ モードの制限:

- `pages` はサポートされていません。設定されている場合、ツールはエラーを返します。

### 抽出フォールバック モード

フォールバック モードは、非ネイティブ プロバイダーに使用されます。

フロー:

1. 選択したページからテキストを抽出します (最大 `agents.defaults.pdfMaxPages`、デフォルトは `20`)。
2. 抽出されたテキストの長さが `200` 文字未満の場合は、選択したページを PNG 画像にレンダリングして含めます。
3. 抽出されたコンテンツとプロンプトを選択したモデルに送信します。

フォールバックの詳細:- ページ画像の抽出には、`4,000,000` のピクセル バジェットが使用されます。
・対象機種が画像入力に対応しておらず、抽出可能なテキストがない場合はエラーとなります。

- 抽出フォールバックには `pdfjs-dist` (およびイメージ レンダリングには `@napi-rs/canvas`) が必要です。

## 構成

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

フィールドの詳細については、[構成リファレンス](/gateway/configuration-reference) を参照してください。

## 出力の詳細

このツールは、`content[0].text` でテキストを返し、`details` で構造化メタデータを返します。

共通の `details` フィールド:

- `model`: 解決されたモデル参照 (`provider/model`)
- `native`: ネイティブ プロバイダー モードの場合は `true`、フォールバックの場合は `false`
- `attempts`: 成功する前に失敗したフォールバック試行

パスフィールド:

- 単一の PDF 入力: `details.pdf`
- 複数の PDF 入力: `details.pdfs[]` と `pdf` エントリ
- サンドボックス パス書き換えメタデータ (該当する場合): `rewrittenFrom`

## エラー動作

- PDF 入力がありません: `pdf required: provide a path or URL to a PDF document` がスローされます
- PDF が多すぎます: `details.error = "too_many_pdfs"` で構造化エラーが返されます
- サポートされていない参照スキーム: `details.error = "unsupported_pdf_reference"` を返します
- `pages` を使用したネイティブ モード: 明確な `pages is not supported with native PDF providers` エラーがスローされます

## 例

単一の PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

複数の PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

ページフィルターされたフォールバックモデル:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```
