---
summary: "Qianfan の統合 API を使用して OpenClaw の多くのモデルにアクセス"
read_when:
  - 多数の LLM に対して単一の API キーが必要な場合
  - Baidu Qianfan セットアップ ガイドが必要です
title: "銭帆"
x-i18n:
  source_hash: "2ca710b422f190b65d23db51a3219f0abd67074fb385251efeca6eae095d02e0"
---

# Qianfan プロバイダーガイド

Qianfan は Baidu の MaaS プラットフォームであり、単一のモデルの背後にある多くのモデルにリクエストをルーティングする **統合 API** を提供します。
エンドポイントと API キー。 OpenAI と互換性があるため、ほとんどの OpenAI SDK はベース URL を切り替えることで動作します。

## 前提条件

1. Qianfan API にアクセスできる Baidu Cloud アカウント
2. Qianfan コンソールからの API キー
3. OpenClaw がシステムにインストールされている

## API キーの取得

1. [Qianfan コンソール](https://console.bce.baidu.com/qianfan/ais/console/apiKey) にアクセスします。
2. 新しいアプリケーションを作成するか、既存のアプリケーションを選択します
3. API キーを生成します (形式: `bce-v3/ALTAK-...`)
4. OpenClaw で使用する API キーをコピーします。

## CLI セットアップ

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## 関連ドキュメント

- [OpenClaw 構成](/gateway/configuration)
- [モデルプロバイダー](/concepts/model-providers)
- [エージェントのセットアップ](/concepts/agent)
- [Qianfan API ドキュメント](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
