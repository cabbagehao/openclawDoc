---
summary: "web_search 向けの Brave Search API 設定"
read_when:
  - web_search で Brave Search を使いたい場合
  - "`BRAVE_API_KEY` またはプランの詳細を確認したい場合"
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

OpenClaw は、`web_search` のプロバイダーとして Brave Search API をサポートしています。

## APIキーの取得

1. [https://brave.com/search/api/](https://brave.com/search/api/) で Brave Search API のアカウントを作成します
2. ダッシュボードで **Search** プランを選択し、API キーを生成します
3. キーを設定に保存するか、ゲートウェイ環境で `BRAVE_API_KEY` を設定します

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

| パラメータ         | 説明                                               |
| ------------- | ------------------------------------------------ |
| `query`       | 検索クエリ（必須）                                        |
| `count`       | 返される結果数（1〜10、デフォルトは 5）                           |
| `country`     | 2 文字の ISO 国コード（例: `"US"`、`"DE"`）                 |
| `language`    | 検索結果に使う ISO 639-1 言語コード（例: `"en"`、`"de"`、`"fr"`） |
| `ui_lang`     | UI 要素に使う ISO 言語コード                               |
| `freshness`   | 期間フィルター: `day`（24 時間）、`week`、`month`、`year`      |
| `date_after`  | この日付以降に公開された結果のみを返します（YYYY-MM-DD）                |
| `date_before` | この日付以前に公開された結果のみを返します（YYYY-MM-DD）                |

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

* OpenClaw では Brave の **Search** プランを使用します。レガシー契約（例: 月 2,000 クエリの旧 Free プラン）がある場合は引き続き利用できますが、LLM Context やより高いレート制限などの新機能は含まれません。
* Brave の各プランには、毎月更新される **5 ドル分の無料クレジット** が含まれます。Search プランは 1,000 リクエストあたり 5 ドルのため、このクレジットで月 1,000 クエリをまかなえます。想定外の課金を避けるため、Brave のダッシュボードで利用上限を設定してください。現行プランについては [Brave API ポータル](https://brave.com/search/api/) を参照してください。
* Search プランには LLM Context エンドポイントと AI 推論の利用権が含まれます。結果を保存してモデルの学習や調整に使う場合は、明示的に保存権が付与されたプランが必要です。詳しくは Brave の [利用規約](https://api-dashboard.search.brave.com/terms-of-service) を参照してください。
* 結果はデフォルトで 15 分間キャッシュされます。`cacheTtlMinutes` で変更できます。

web\_search の設定全体については [Web ツール](/tools/web) を参照してください。
