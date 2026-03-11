---
summary: "統合モデルへのアクセスとコスト追跡のために、LiteLLM プロキシを介して OpenClaw を実行します"
read_when:
  - OpenClaw を LiteLLM プロキシ経由でルーティングしたい場合
  - LiteLLM を介したコスト追跡、ロギング、またはモデル ルーティングが必要な場合
x-i18n:
  source_hash: "269529671c60864972441606c730b5ca327546a45d3b264dbd03204c4401936f"
---

# LiteLLM

[LiteLLM](https://litellm.ai) は、100 を超えるモデル プロバイダーに統合 API を提供するオープンソース LLM ゲートウェイです。 LiteLLM を介して OpenClaw をルーティングすると、一元的なコスト追跡、ロギングが実現し、OpenClaw 構成を変更せずにバックエンドを切り替える柔軟性が得られます。

## OpenClaw で LiteLLM を使用する理由

* **コスト追跡** — OpenClaw がすべてのモデルに費やした金額を正確に確認します
* **モデル ルーティング** — 設定を変更せずに、Claude、GPT-4、Gemini、Bedrock を切り替える
* **仮想キー** — OpenClaw の使用制限のあるキーを作成する
* **ログ** — デバッグ用の完全なリクエスト/レスポンス ログ
* **フォールバック** — プライマリプロバイダーがダウンした場合の自動フェイルオーバー

## クイックスタート

### オンボーディング経由

```bash
openclaw onboard --auth-choice litellm-api-key
```

### 手動セットアップ

1. LiteLLM プロキシを開始します。

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. OpenClaw を LiteLLM に指定します。

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

それだけです。 OpenClaw は LiteLLM を介してルーティングされるようになりました。

## 構成

### 環境変数

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 設定ファイル

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 仮想キー

使用制限のある OpenClaw 専用のキーを作成します。

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

生成されたキーを `LITELLM_API_KEY` として使用します。

## モデルのルーティング

LiteLLM は、モデルリクエストをさまざまなバックエンドにルーティングできます。 LiteLLM `config.yaml` で設定します。

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw は `claude-opus-4-6` を要求し続けます — LiteLLM がルーティングを処理します。

## 使用状況の表示

LiteLLM のダッシュボードまたは API を確認します。

````bash
# Key info
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Spend logs
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```## 注意事項

- LiteLLM はデフォルトで `http://localhost:4000` で実行されます
- OpenClaw は、OpenAI 互換の `/v1/chat/completions` エンドポイント経由で接続します
- すべての OpenClaw 機能は LiteLLM を通じて機能します - 制限はありません

## も参照

- [LiteLLM ドキュメント](https://docs.litellm.ai)
- [モデルプロバイダー](/concepts/model-providers)
````
