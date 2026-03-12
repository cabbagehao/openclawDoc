---
summary: "Kilo Gateway の統合 API を使用して、OpenClaw の多くのモデルにアクセスします"
read_when:
  - 多数の LLM に対して単一の API キーが必要な場合
  - OpenClaw で Kilo Gateway 経由でモデルを実行したい
title: "キロゲートウェイ"
x-i18n:
  source_hash: "acd4c29496abc1ef8d4da6c48575763dfe3b4c1319874f900532223ac3775257"
---

# キロゲートウェイ

Kilo Gateway は、単一のモジュールの背後にある多くのモデルにリクエストをルーティングする **統合 API** を提供します
エンドポイントと API キー。 OpenAI と互換性があるため、ほとんどの OpenAI SDK はベース URL を切り替えることで動作します。

## APIキーの取得

1. [app.kilo.ai](https://app.kilo.ai) に移動します。
2. サインインするかアカウントを作成します
3. API キーに移動し、新しいキーを生成します

## CLI セットアップ

```bash
openclaw onboard --kilocode-api-key <key>
```

または、環境変数を設定します。

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## 構成スニペット

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## デフォルトのモデル

デフォルトのモデルは `kilocode/kilo/auto` で、自動的に選択するスマート ルーティング モデルです。
タスクに基づいた最適な基礎モデル:

- 計画、デバッグ、オーケストレーションのタスクは Claude Opus にルーティングされます
- コード作成と探索タスクは Claude Sonnet にルーティングされます

## 利用可能なモデル

OpenClaw は、起動時に Kilo Gateway から利用可能なモデルを動的に検出します。使用する
`/models kilocode` を使用すると、アカウントで利用可能なモデルの完全なリストが表示されます。

ゲートウェイで利用可能なモデルはすべて、`kilocode/` プレフィックスを付けて使用できます。

```
kilocode/kilo/auto              (default - smart routing)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.2
kilocode/google/gemini-3-pro-preview
...and many more
```

## 注意事項

- モデル参照は `kilocode/<model-id>` (例: `kilocode/anthropic/claude-sonnet-4`) です。
- デフォルトのモデル: `kilocode/kilo/auto`
- ベース URL: `https://api.kilo.ai/api/gateway/`
- モデル/プロバイダーのオプションの詳細については、[/concepts/model-providers](/concepts/model-providers) を参照してください。
- Kilo Gateway は、API キーを含むベアラー トークンを内部で使用します。
