---
summary: "OpenClaw で Qianfan の統合 API を使って多数のモデルへアクセスする"
read_when:
  - 1 つの API キーで多数の LLM を使いたいとき
  - Baidu Qianfan のセットアップ手順を確認したいとき
title: "OpenClawでBaidu Qianfan統合APIを使う認証・設定ガイド"
description: "Baidu Qianfan の統合 API を OpenClaw で使う設定ガイドです。認証情報、前提条件、OpenAI 互換 endpoint の利用方法を確認できます。"
x-i18n:
  source_hash: "2ca710b422f190b65d23db51a3219f0abd67074fb385251efeca6eae095d02e0"
---
Qianfan は Baidu の MaaS プラットフォームです。単一の endpoint と API キーの背後で多数のモデルへリクエストをルーティングする**統合 API**を提供します。OpenAI 互換であるため、多くの OpenAI SDK は base URL を切り替えるだけで利用できます。

## 前提条件

1. Qianfan API へアクセス可能な Baidu Cloud アカウント
2. Qianfan Console で発行した API キー
3. システムにインストール済みの OpenClaw

## API キーの取得

1. [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) を開きます。
2. 新しいアプリケーションを作成するか、既存のアプリケーションを選択します。
3. API キーを生成します（形式: `bce-v3/ALTAK-...`）。
4. OpenClaw で使うために API キーを控えます。

## CLI セットアップ

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## 関連ドキュメント

- [OpenClaw Configuration](/gateway/configuration)
- [Model Providers](/concepts/model-providers)
- [Agent Setup](/concepts/agent)
- [Qianfan API Documentation](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
