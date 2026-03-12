---
summary: "web_search 向けの Perplexity Search API と Sonar / OpenRouter 互換"
description: "Perplexity Search API を web_search プロバイダーとして使うための設定方法、返却結果、接続要件を説明します。"
read_when:
  - Perplexity Search を Web 検索に使いたいとき
  - "`PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` の設定が必要なとき"
title: "Perplexity Search"
seoTitle: "OpenClawのPerplexity Search API連携の設定方法と検索利用ガイド"
---
OpenClaw は `web_search` provider として Perplexity Search API をサポートしています。返されるのは `title`、`url`、`snippet` を含む構造化結果です。

互換性のため、OpenClaw は legacy の Perplexity Sonar / OpenRouter 構成もサポートしています。`OPENROUTER_API_KEY` を使う場合、`tools.web.search.perplexity.apiKey` に `sk-or-...` 形式の key を設定した場合、または `tools.web.search.perplexity.baseUrl` / `model` を設定した場合、provider は chat-completions 経路へ切り替わり、構造化された Search API 結果ではなく、引用付きの AI 合成回答を返します。

## Perplexity API key の取得

1. [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) で Perplexity アカウントを作成する
2. dashboard で API key を生成する
3. key を config に保存するか、Gateway 環境で `PERPLEXITY_API_KEY` を設定する

## OpenRouter 互換

すでに Perplexity Sonar 用に OpenRouter を使っている場合は、`provider: "perplexity"` を維持したまま、Gateway 環境で `OPENROUTER_API_KEY` を設定するか、`tools.web.search.perplexity.apiKey` に `sk-or-...` key を保存してください。

任意の legacy 制御:

- `tools.web.search.perplexity.baseUrl`
- `tools.web.search.perplexity.model`

## 設定例

### ネイティブ Perplexity Search API

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

### OpenRouter / Sonar 互換

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

## key の設定場所

**config 経由:** `openclaw configure --section web` を実行します。key は `~/.openclaw/openclaw.json` の `tools.web.search.perplexity.apiKey` に保存されます。

**環境変数経由:** Gateway process 環境で `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` を設定します。Gateway を常駐インストールしている場合は `~/.openclaw/.env`（または service 環境）に配置してください。詳細は [Env vars](/help/faq#how-does-openclaw-load-environment-variables) を参照してください。

## ツールパラメータ

以下のパラメータは、ネイティブ Perplexity Search API 経路に適用されます。

| Parameter             | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `query`               | 検索クエリ（必須）                                   |
| `count`               | 返す結果数（1-10、デフォルト: 5）                    |
| `country`             | 2 文字の ISO 国コード（例: `"US"`、`"DE"`）          |
| `language`            | ISO 639-1 言語コード（例: `"en"`、`"de"`、`"fr"`）   |
| `freshness`           | 時間フィルタ: `day`（24h）、`week`、`month`、`year` |
| `date_after`          | この日付以降に公開された結果のみ（YYYY-MM-DD）       |
| `date_before`         | この日付以前に公開された結果のみ（YYYY-MM-DD）       |
| `domain_filter`       | ドメイン allowlist / denylist 配列（最大 20 件）     |
| `max_tokens`          | 総コンテンツ予算（デフォルト: 25000、最大: 1000000） |
| `max_tokens_per_page` | ページ単位のトークン上限（デフォルト: 2048）         |

legacy の Sonar / OpenRouter 互換経路では、`query` と `freshness` だけがサポート対象です。`country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page` など Search API 専用の filter は明示的な error を返します。

**例:**

```javascript
// 国と言語を指定した検索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近1週間の結果
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

// ドメインフィルタ（allowlist）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// ドメインフィルタ（denylist: 接頭辞に - を付ける）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// より多くのコンテンツを抽出
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### domain filter のルール

- 1 リクエストあたり最大 20 ドメイン
- 同じリクエスト内で allowlist と denylist を混在させることはできない
- denylist entry には `-` 接頭辞を付ける（例: `["-reddit.com"]`）

## 注意点

- Perplexity Search API は構造化された Web 検索結果（`title`、`url`、`snippet`）を返します
- OpenRouter または明示的な `baseUrl` / `model` を設定すると、互換性維持のため Perplexity は Sonar chat completions 経路へ切り替わります
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で変更可能）

完全な `web_search` 設定については [Web tools](/tools/web) を参照してください。詳細は [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) を参照してください。
