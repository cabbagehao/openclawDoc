---
summary: "Perplexity Search APIとweb_search用のSonar/OpenRouter互換性"
read_when:
  - Perplexity SearchをWeb検索に使用したい場合
  - PERPLEXITY_API_KEYまたはOPENROUTER_API_KEYのセットアップが必要な場合
title: "Perplexity Search"
---

# Perplexity Search API

OpenClawは`web_search`プロバイダーとしてPerplexity Search APIをサポートしています。
`title`、`url`、`snippet`フィールドを含む構造化された結果を返します。

互換性のため、OpenClawはレガシーのPerplexity Sonar/OpenRouterセットアップもサポートしています。
`OPENROUTER_API_KEY`を使用する場合、`tools.web.search.perplexity.apiKey`に`sk-or-...`キーを設定する場合、または`tools.web.search.perplexity.baseUrl` / `model`を設定する場合、プロバイダーはchat-completionsパスに切り替わり、構造化されたSearch API結果の代わりに引用付きのAI統合回答を返します。

## Perplexity APIキーの取得

1. [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)でPerplexityアカウントを作成
2. ダッシュボードでAPIキーを生成
3. キーを設定に保存するか、Gateway環境で`PERPLEXITY_API_KEY`を設定

## OpenRouter互換性

すでにPerplexity Sonar用にOpenRouterを使用している場合は、`provider: "perplexity"`を維持し、Gateway環境で`OPENROUTER_API_KEY`を設定するか、`tools.web.search.perplexity.apiKey`に`sk-or-...`キーを保存してください。

オプションのレガシー制御:

- `tools.web.search.perplexity.baseUrl`
- `tools.web.search.perplexity.model`

## 設定例

### ネイティブPerplexity Search API

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...",
        },
      },
    },
  },
}
```

### OpenRouter / Sonar互換性

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "<openrouter-api-key>",
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## キーの設定場所

**設定経由:** `openclaw configure --section web`を実行します。キーは
`~/.openclaw/openclaw.json`の`tools.web.search.perplexity.apiKey`に保存されます。

**環境変数経由:** Gatewayプロセス環境で`PERPLEXITY_API_KEY`または`OPENROUTER_API_KEY`を設定します。Gatewayインストールの場合は、`~/.openclaw/.env`（またはサービス環境）に配置してください。[環境変数](/help/faq#how-does-openclaw-load-environment-variables)を参照してください。

## ツールパラメータ

これらのパラメータはネイティブPerplexity Search APIパスに適用されます。

| パラメータ            | 説明                                                           |
| --------------------- | -------------------------------------------------------------- |
| `query`               | 検索クエリ（必須）                                             |
| `count`               | 返す結果の数（1-10、デフォルト: 5）                            |
| `country`             | 2文字のISO国コード（例: "US"、"DE"）                           |
| `language`            | ISO 639-1言語コード（例: "en"、"de"、"fr"）                    |
| `freshness`           | 時間フィルター: `day`（24時間）、`week`、`month`、または`year` |
| `date_after`          | この日付以降に公開された結果のみ（YYYY-MM-DD）                 |
| `date_before`         | この日付以前に公開された結果のみ（YYYY-MM-DD）                 |
| `domain_filter`       | ドメイン許可/拒否リスト配列（最大20）                          |
| `max_tokens`          | 総コンテンツ予算（デフォルト: 25000、最大: 1000000）           |
| `max_tokens_per_page` | ページごとのトークン制限（デフォルト: 2048）                   |

レガシーSonar/OpenRouter互換性パスでは、`query`と`freshness`のみがサポートされます。
`country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`などのSearch API専用フィルターは明示的なエラーを返します。

**例:**

```javascript
// 国と言語固有の検索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近の結果（過去1週間）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日付範囲検索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ドメインフィルタリング（許可リスト）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// ドメインフィルタリング（拒否リスト - プレフィックスに-を使用）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// より多くのコンテンツ抽出
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### ドメインフィルタールール

- リクエストごとに最大20ドメイン
- 同じリクエスト内で許可リストと拒否リストを混在させることはできません
- 拒否リストエントリには`-`プレフィックスを使用（例: `["-reddit.com"]`）

## 注意事項

- Perplexity Search APIは構造化されたWeb検索結果（`title`、`url`、`snippet`）を返します
- OpenRouterまたは明示的な`baseUrl` / `model`は、互換性のためにPerplexityをSonar chat completionsに切り替えます
- 結果はデフォルトで15分間キャッシュされます（`cacheTtlMinutes`で設定可能）

完全なweb_search設定については[Webツール](/tools/web)を参照してください。
詳細については[Perplexity Search APIドキュメント](https://docs.perplexity.ai/docs/search/quickstart)を参照してください。
