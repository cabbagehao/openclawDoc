---
summary: "Web 検索 + フェッチ ツール (Brave、Gemini、Grok、Kimi、および Perplexity プロバイダー)"
read_when:
  - web_search または web_fetch を有効にしたい
  - Brave または Perplexity Search API キーの設定が必要です
  - Google 検索の基礎を備えた Gemini を使用したい
title: "ウェブツール"
x-i18n:
  source_hash: "1903be38c22f514b117d0577b2dedcb55338b98432137635ad52b0b1a5e624e5"
---

# Webツール

OpenClaw には、次の 2 つの軽量 Web ツールが付属しています。

* `web_search` — Brave Search API、Google 検索グラウンディングを備えた Gemini、Grok、Kimi、または Perplexity Search API を使用して Web を検索します。
* `web_fetch` — HTTP フェッチ + 可読抽出 (HTML → マークダウン/テキスト)。

これらはブラウザの自動化ではありません\*\*。 JS を多用するサイトまたはログインの場合は、
[ブラウザツール](/tools/browser)。

## 仕組み

* `web_search` は、構成されたプロバイダーを呼び出し、結果を返します。
* 結果はクエリによって 15 分間キャッシュされます (構成可能)。
* `web_fetch` はプレーンな HTTP GET を実行し、読み取り可能なコンテンツを抽出します
  (HTML → マークダウン/テキスト)。 JavaScript は**実行されません**。
* `web_fetch` は (明示的に無効にしない限り) デフォルトで有効になります。

プロバイダー固有の詳細については、[Brave Search セットアップ](/brave-search) および [Perplexity Search セットアップ](/perplexity) を参照してください。

## 検索プロバイダーの選択|プロバイダー |結果の形状 |プロバイダー固有のフィルター |メモ | APIキー |

\| ------------------------- | ---------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
\| **Brave Search API** |スニペットを使用した構造化された結果 | `country`、`language`、`ui_lang`、時間 | Brave `llm-context` モードをサポート | `BRAVE_API_KEY` |
\| **ジェミニ** | AI が合成した回答 + 引用 | — | Google 検索の基礎を使用する | `GEMINI_API_KEY` |
\| **グロク** | AI が合成した回答 + 引用 | — | xAI Web ベースの応答を使用 | `XAI_API_KEY` || **君** | AI が合成した回答 + 引用 | — | Moonshot Web 検索を使用します。 `KIMI_API_KEY` / `MOONSHOT_API_KEY` |
\| **Perplexity Search API** |スニペットを使用した構造化された結果 | `country`、`language`、時間、`domain_filter` |コンテンツ抽出制御をサポートします。 OpenRouter は Sonar 互換性パスを使用します。 `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |

### 自動検出

上の表はアルファベット順です。 `provider` が明示的に設定されていない場合、ランタイム自動検出は次の順序でプロバイダーをチェックします。

1. **Brave** — `BRAVE_API_KEY` 環境変数または `tools.web.search.apiKey` 構成
2. **Gemini** — `GEMINI_API_KEY` 環境変数または `tools.web.search.gemini.apiKey` 構成
3. **Grok** — `XAI_API_KEY` 環境変数または `tools.web.search.grok.apiKey` 構成
4. **君** — `KIMI_API_KEY` / `MOONSHOT_API_KEY` 環境変数または `tools.web.search.kimi.apiKey` 構成
5. **複雑さ** — `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY`、または `tools.web.search.perplexity.apiKey` 構成

キーが見つからない場合は、Brave に戻ります (キーが見つからないというエラーが表示され、キーを構成するように求められます)。

## Web 検索の設定

`openclaw configure --section web` を使用して API キーを設定し、プロバイダーを選択します。

### 勇敢な探索1. [brave.com/search/api](https://brave.com/search/api/) で Brave Search API アカウントを作成します

2. ダッシュボードで、**検索** プランを選択し、API キーを生成します。
3. `openclaw configure --section web` を実行してキーを構成に保存するか、環境に `BRAVE_API_KEY` を設定します。

各 Brave プランには、**月額 5 ドルの無料クレジット** (更新) が含まれています。検索
プランの料金は 1,000 リクエストあたり 5 ドルなので、クレジットは月あたり 1,000 クエリをカバーします。セット
予期せぬ請求を避けるために、Brave ダッシュボードで使用制限を確認してください。を参照してください。
現在のプランについては [Brave API ポータル](https://brave.com/search/api/) と
価格設定。

### 複雑性検索

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) で Perplexity アカウントを作成します。
2. ダッシュボードで API キーを生成します
3. `openclaw configure --section web` を実行してキーを構成に保存するか、環境に `PERPLEXITY_API_KEY` を設定します。

従来の Sonar/OpenRouter との互換性を確保するには、代わりに `OPENROUTER_API_KEY` を設定するか、`sk-or-...` キーを使用して `tools.web.search.perplexity.apiKey` を構成します。 `tools.web.search.perplexity.baseUrl` または `model` を設定すると、Perplexity がチャット完了互換パスに再び組み込まれます。

詳細については、[Perplexity Search API ドキュメント](https://docs.perplexity.ai/guides/search-quickstart) を参照してください。

### キーを保管する場所

**構成経由:** `openclaw configure --section web` を実行します。プロバイダーに応じて、キーは `tools.web.search.apiKey` または `tools.web.search.perplexity.apiKey` に保存されます。**環境経由:** ゲートウェイ プロセス環境で `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY`、または `BRAVE_API_KEY` を設定します。ゲートウェイのインストールの場合は、`~/.openclaw/.env` (またはサービス環境) に配置します。 [環境変数](/help/faq#how-does-openclaw-load-environment-variables) を参照してください。

### 構成例

**勇敢な検索:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // optional if BRAVE_API_KEY is set // pragma: allowlist secret
      },
    },
  },
}
```

**Brave LLM コンテキスト モード:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // optional if BRAVE_API_KEY is set // pragma: allowlist secret
        brave: {
          mode: "llm-context",
        },
      },
    },
  },
}
```

`llm-context` は、標準の Brave スニペットの代わりに、グラウンディング用に抽出されたページ チャンクを返します。
このモードでは、`country` および `language` / `search_lang` は引き続き機能しますが、`ui_lang`
`freshness`、`date_after`、および `date_before` は拒否されます。

**複雑な検索:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...", // optional if PERPLEXITY_API_KEY is set
        },
      },
    },
  },
}
```

**OpenRouter / Sonar 互換性による複雑性:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "<openrouter-api-key>", // optional if OPENROUTER_API_KEY is set
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## Gemini の使用 (Google 検索のグラウンディング)

Gemini モデルは、組み込みの [Google 検索グラウンディング](https://ai.google.dev/gemini-api/docs/grounding) をサポートしています。
これは、引用付きのライブ Google 検索結果に裏付けられた AI 合成回答を返します。

### Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/apikey) に移動します。
2. APIキーを作成する
3. ゲートウェイ環境で `GEMINI_API_KEY` を設定するか、`tools.web.search.gemini.apiKey` を構成します

### Gemini 検索のセットアップ

```json5
{
  tools: {
    web: {
      search: {
        provider: "gemini",
        gemini: {
          // API key (optional if GEMINI_API_KEY is set)
          apiKey: "AIza...",
          // Model (defaults to "gemini-2.5-flash")
          model: "gemini-2.5-flash",
        },
      },
    },
  },
}
```

**代替環境:** ゲートウェイ環境で `GEMINI_API_KEY` を設定します。
ゲートウェイのインストールの場合は、`~/.openclaw/.env` に配置します。

### 注記- Gemini グラウンディングからの引用 URL は、Google の URL から自動的に解決されます

URL をダイレクト URL にリダイレクトします。

* リダイレクト解決では、最終的な引用 URL を返す前に SSRF ガード パス (HEAD + リダイレクト チェック + http/https 検証) を使用します。
* リダイレクト解決では厳密な SSRF デフォルトが使用されるため、プライベート/内部ターゲットへのリダイレクトはブロックされます。
* デフォルトのモデル (`gemini-2.5-flash`) は高速でコスト効率が高くなります。
  アースをサポートするすべての Gemini モデルを使用できます。

## ウェブ検索

設定したプロバイダーを使用して Web を検索します。

### 要件

* `tools.web.search.enabled` は `false` であってはなりません (デフォルト: 有効)
* 選択したプロバイダーの API キー:
  * **勇敢**: `BRAVE_API_KEY` または `tools.web.search.apiKey`
  * **双子座**: `GEMINI_API_KEY` または `tools.web.search.gemini.apiKey`
  * **Grok**: `XAI_API_KEY` または `tools.web.search.grok.apiKey`
  * **キミ**: `KIMI_API_KEY`、`MOONSHOT_API_KEY`、または `tools.web.search.kimi.apiKey`
  * **困惑**: `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY`、または `tools.web.search.perplexity.apiKey`

### 構成

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // optional if BRAVE_API_KEY is set
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### ツールパラメータ

注記がない限り、すべてのパラメーターは Brave およびネイティブ Perplexity Search API で機能します。

Perplexity の OpenRouter / Sonar 互換パスは、`query` および `freshness` のみをサポートします。
`tools.web.search.perplexity.baseUrl` / `model` を設定するか、`OPENROUTER_API_KEY` を使用するか、`sk-or-...` キーを構成すると、検索 API のみのフィルターは明示的なエラーを返します。|パラメータ |説明 |
\| --------------------- | ----------------------------------------------------- |
\| `query` |検索クエリ (必須) |
\| `count` |返される結果 (1-10、デフォルト: 5) |
\| `country` | 2 文字の ISO 国コード (例: "US"、"DE") |
\| `language` | ISO 639-1 言語コード (例: "en"、"de") |
\| `freshness` |時間フィルター: `day`、`week`、`month`、または `year` |
\| `date_after` |この日付 (YYYY-MM-DD) 以降の結果 |
\| `date_before` |この日付より前の結果 (YYYY-MM-DD) |
\| `ui_lang` | UI 言語コード (Brave のみ) |
\| `domain_filter` |ドメイン許可リスト/拒否リスト配列 (Perplexity のみ) |
\| `max_tokens` |総コンテンツ予算、デフォルト 25000 (Perplexity のみ) |
\| `max_tokens_per_page` |ページごとのトークン制限、デフォルトは 2048 (Perplexity のみ) |

**例:**

```javascript
// German-specific search
await web_search({
  query: "TV online schauen",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "TMBG interview",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Exclude domains (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction (Perplexity only)
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

Brave `llm-context` モードが有効な場合、`ui_lang`、`freshness`、`date_after`、および
`date_before` はサポートされていません。これらのフィルターには Brave `web` モードを使用してください。

## web\_fetchURL を取得し、読み取り可能なコンテンツを抽出します

### web\_fetch の要件

* `tools.web.fetch.enabled` は `false` であってはなりません (デフォルト: 有効)
* オプションの Firecrawl フォールバック: `tools.web.fetch.firecrawl.apiKey` または `FIRECRAWL_API_KEY` を設定します。

### web\_fetch 構成

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        readability: true,
        firecrawl: {
          enabled: true,
          apiKey: "FIRECRAWL_API_KEY_HERE", // optional if FIRECRAWL_API_KEY is set
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 86400000, // ms (1 day)
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

### web\_fetch ツールのパラメータ

* `url` (必須、http/https のみ)
* `extractMode` (`markdown` | `text`)
* `maxChars` (長いページを切り詰める)

注:- `web_fetch` は、最初に可読性 (メインコンテンツの抽出) を使用し、次に Firecrawl (構成されている場合) を使用します。両方とも失敗した場合、ツールはエラーを返します。

* Firecrawl リクエストはボット回避モードを使用し、デフォルトで結果をキャッシュします。
* `web_fetch` は、デフォルトで Chrome のようなユーザー エージェントと `Accept-Language` を送信します。必要に応じて `userAgent` をオーバーライドします。
* `web_fetch` はプライベート/内部ホスト名をブロックし、リダイレクトを再チェックします (`maxRedirects` で制限)。
* `maxChars` は `tools.web.fetch.maxCharsCap` にクランプされます。
* `web_fetch` は、解析する前に、ダウンロードされた応答本文のサイズを `tools.web.fetch.maxResponseBytes` に制限します。サイズが大きすぎる応答は切り詰められ、警告が含まれます。
* `web_fetch` はベストエフォート抽出です。一部のサイトではブラウザ ツールが必要です。
* キーのセットアップとサービスの詳細については、[Firecrawl](/tools/firecrawl) を参照してください。
* 繰り返しの取得を減らすために、応答はキャッシュされます (デフォルトは 15 分)。
* ツール プロファイル/ホワイトリストを使用する場合は、`web_search`/`web_fetch` または `group:web` を追加します。
* API キーが見つからない場合、`web_search` はドキュメント リンクを含む短いセットアップ ヒントを返します。
