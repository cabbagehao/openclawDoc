---
summary: "web_search用のBrave Search API設定"
read_when:
  - web_searchにBrave Searchを使用したい場合
  - BRAVE_API_KEYまたはプランの詳細が必要な場合
title: "Brave Search"
x-i18n:
  source_path: "brave-search.md"
  source_hash: "85737676532c43280193cc12ca9207e518d64f8ac39100be5c4f8ac312311e58"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:52:01.989Z"
---

# Brave Search API

OpenClawは`web_search`プロバイダーとしてBrave Search APIをサポートしています。

## APIキーの取得

1. [https://brave.com/search/api/](https://brave.com/search/api/)でBrave Search APIアカウントを作成します
2. ダッシュボードで**Search**プランを選択し、APIキーを生成します
3. キーを設定に保存するか、Gateway環境で`BRAVE_API_KEY`を設定します

## 設定例

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

## ツールパラメータ

| パラメータ    | 説明                                                           |
| ------------- | -------------------------------------------------------------- |
| `query`       | 検索クエリ（必須）                                             |
| `count`       | 返す結果の数（1-10、デフォルト: 5）                            |
| `country`     | 2文字のISO国コード（例: "US"、"DE"）                           |
| `language`    | 検索結果のISO 639-1言語コード（例: "en"、"de"、"fr"）          |
| `ui_lang`     | UI要素のISO言語コード                                          |
| `freshness`   | 時間フィルター: `day`（24時間）、`week`、`month`、または`year` |
| `date_after`  | この日付以降に公開された結果のみ（YYYY-MM-DD）                 |
| `date_before` | この日付以前に公開された結果のみ（YYYY-MM-DD）                 |

**例:**

```javascript
// 国と言語を指定した検索
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
```

## 注意事項

- OpenClawはBrave **Search**プランを使用します。レガシーサブスクリプション（例: 月2,000クエリの元のFreeプラン）をお持ちの場合、それは引き続き有効ですが、LLM Contextやより高いレート制限などの新機能は含まれません
- 各Braveプランには**月$5の無料クレジット**（更新）が含まれています。Searchプランは1,000リクエストあたり$5なので、クレジットで月1,000クエリをカバーします。予期しない請求を避けるため、Braveダッシュボードで使用制限を設定してください。現在のプランについては[Brave APIポータル](https://brave.com/search/api/)を参照してください
- SearchプランにはLLM Contextエンドポイントとモデル推論権が含まれています。結果を保存してモデルのトレーニングや調整を行うには、明示的な保存権を持つプランが必要です。Braveの[利用規約](https://api-dashboard.search.brave.com/terms-of-service)を参照してください
- 結果はデフォルトで15分間キャッシュされます（`cacheTtlMinutes`で設定可能）

web_search設定の詳細については[Webツール](/tools/web)を参照してください。
