---
summary: "web_fetch の Firecrawl フォールバック (アンチボット + キャッシュされた抽出)"
read_when:
  - Firecrawl を利用した Web 抽出が必要な場合
  - Firecrawl API キーが必要です
  - web_fetch のアンチボット抽出が必要な場合
title: "Firecrawl"
seoTitle: "OpenClaw Firecrawl連携の使い方と取得フロー・制約ガイド"
description: "OpenClaw は、Firecrawl を web_fetch のフォールバック エクストラクターとして使用できます。ホスト型です ボットの回避とキャッシュをサポートするコンテンツ抽出サービス。プレーンな HTTP フェッチをブロックする JS を多用するサイトまたはページ。"
x-i18n:
  source_hash: "08a7ad45b41af41204e44d2b0be0f980b7184d80d2fa3977339e42a47beb2851"
---
OpenClaw は、**Firecrawl** を `web_fetch` のフォールバック エクストラクターとして使用できます。ホスト型です
ボットの回避とキャッシュをサポートするコンテンツ抽出サービス。
プレーンな HTTP フェッチをブロックする JS を多用するサイトまたはページ。

## API キーを取得する

1. Firecrawl アカウントを作成し、API キーを生成します。
2. config に保存するか、ゲートウェイ環境で `FIRECRAWL_API_KEY` を設定します。

## Firecrawl を設定する

```json5
{
  tools: {
    web: {
      fetch: {
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 172800000,
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

注:

- API キーが存在する場合、`firecrawl.enabled` はデフォルトで true になります。
- `maxAgeMs` は、キャッシュされた結果の古さ (ミリ秒) を制御します。デフォルトは 2 日です。

## ステルス/ボット回避

Firecrawl は、ボット回避のための **プロキシ モード** パラメーター (`basic`、`stealth`、または `auto`) を公開します。
OpenClaw は、Firecrawl リクエストに常に `proxy: "auto"` と `storeInCache: true` を使用します。
プロキシが省略された場合、Firecrawl はデフォルトで `auto` になります。 `auto` 基本的な試行が失敗した場合、ステルス プロキシを使用して再試行します。これにより、より多くのクレジットが使用される可能性があります。
基本のみのスクレイピングよりも。

## `web_fetch` による Firecrawl の使用方法

`web_fetch` 抽出順序:

1. 可読性 (ローカル)
2. Firecrawl (構成されている場合)
3. 基本的な HTML クリーンアップ (最後のフォールバック)

Web ツールの完全な設定については、[Web ツール](/tools/web) を参照してください。
