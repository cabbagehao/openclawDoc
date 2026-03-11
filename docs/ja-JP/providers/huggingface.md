---
summary: "Hugging Face Inference の設定（認証とモデル選択）"
read_when:
  - OpenClaw で Hugging Face Inference を使いたいとき
  - HF token の環境変数や CLI 認証方法を確認したいとき
title: "Hugging Face（Inference）"
x-i18n:
  source_hash: "e7ba5cb533f652ba9bb514ab8c5ffbd50170077ac0005555915405c109198a4f"
---

# Hugging Face（Inference）

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) は、単一の router API を通じて OpenAI 互換の chat completions を提供します。1 つの token で DeepSeek、Llama など多数のモデルへアクセスできます。OpenClaw は **OpenAI 互換 endpoint** を利用します（chat completions のみ）。text-to-image、embeddings、speech を使いたい場合は、[HF inference clients](https://huggingface.co/docs/api-inference/quicktour) を直接利用してください。

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`（**Make calls to Inference Providers** 権限を持つ fine-grained token）
- API: OpenAI-compatible（`https://router.huggingface.co/v1`）
- Billing: 単一の HF token。料金は [pricing](https://huggingface.co/docs/inference-providers/pricing) に従い、無料枠もあります。

## Quick start

1. [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) で fine-grained token を作成し、**Make calls to Inference Providers** 権限を付けます。
2. onboarding を実行し、provider のドロップダウンで **Hugging Face** を選び、求められたら API key を入力します。

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. **Default Hugging Face model** ドロップダウンで使いたいモデルを選びます。token が有効であれば Inference API から一覧を取得し、失敗した場合は組み込みリストを表示します。選択したモデルは既定モデルとして保存されます。
4. 後から設定で既定モデルを変更することもできます。

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## 非対話モードの例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

これにより、`huggingface/deepseek-ai/DeepSeek-R1` が既定モデルとして設定されます。

## 環境変数に関する注意

ゲートウェイを daemon（launchd / systemd）として動かす場合は、`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` がそのプロセスから参照できるようにしてください。たとえば `~/.openclaw/.env` や `env.shellEnv` を使用します。

## モデル検出と onboarding のドロップダウン

OpenClaw は **Inference endpoint を直接** 呼び出してモデルを検出します。

```bash
GET https://router.huggingface.co/v1/models
```

（必要に応じて `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` または `$HF_TOKEN` を付けると完全な一覧を取得できます。認証なしでは一部だけ返す endpoint もあります。）response は OpenAI 形式の `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` です。

Hugging Face API key を設定すると（onboarding、`HUGGINGFACE_HUB_TOKEN`、`HF_TOKEN` のいずれか）、OpenClaw はこの GET を使って利用可能な chat-completion model を検出します。**対話式 onboarding** では token 入力後に **Default Hugging Face model** ドロップダウンが表示され、この一覧、または request が失敗した場合は組み込み catalog から選択できます。実行時（例: ゲートウェイ起動時）も、key があれば OpenClaw は再度 **GET** `https://router.huggingface.co/v1/models` を呼び出して catalog を更新します。この一覧は、context window や cost などの metadata を持つ組み込み catalog とマージされます。request に失敗した場合、または key が無い場合は、組み込み catalog のみを使用します。

## モデル名と編集可能なオプション

- **API 由来の名前:** API が `name`、`title`、`display_name` を返す場合、モデル表示名は **GET /v1/models** から取得します。そうでなければ model id から派生します（例: `deepseek-ai/DeepSeek-R1` → `DeepSeek R1`）。
- **表示名の上書き:** 設定で model ごとのカスタム label を指定できます。CLI や UI にその名前で表示されます。

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **provider / policy の選択:** **model id** に suffix を付けると、router が backend を選ぶ方法を指定できます。
  - **`:fastest`** — 最大スループット（router が選択。provider は **固定** され、対話式 backend picker は出ません）
  - **`:cheapest`** — 出力 token あたり最低コスト（router が選択。provider は **固定**）
  - **`:provider`** — 特定 backend を強制（例: `:sambanova`、`:together`）

  **`:cheapest`** や **`:fastest`** を選ぶと、provider は router がコストまたは速度で決めます。そのため、追加の「特定 backend を優先する」手順は表示されません。これらは `models.providers.huggingface.models` に個別エントリとして追加することも、suffix 付きで `model.primary` に設定することもできます。既定の順序は [Inference Provider settings](https://hf.co/settings/inference-providers) で設定できます（suffix を付けない場合は、その順序を使います）。

- **設定のマージ:** `models.providers.huggingface.models`（例: `models.json`）に既存のエントリがある場合、設定マージ時も保持されます。そこに定義した `name`、`alias`、各種 model option も維持されます。

## モデル ID と設定例

model ref は `huggingface/<org>/<model>` の形式を使います（Hub スタイル ID）。以下の一覧は **GET** `https://router.huggingface.co/v1/models` から取得した例であり、実際の catalog にはさらに多くのモデルが含まれる場合があります。

**例となる ID（inference endpoint より）:**

| Model                  | Ref（`huggingface/` を前置）      |
| ---------------------- | --------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`         |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`       |
| Qwen3 8B               | `Qwen/Qwen3-8B`                   |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`        |
| Qwen3 32B              | `Qwen/Qwen3-32B`                  |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct` |
| GPT-OSS 120B           | `openai/gpt-oss-120b`             |
| GLM 4.7                | `zai-org/GLM-4.7`                 |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`            |

model id には `:fastest`、`:cheapest`、`:provider`（例: `:together`、`:sambanova`）を追加できます。完全な一覧は [Inference Providers](https://huggingface.co/docs/inference-providers) と **GET** `https://router.huggingface.co/v1/models` を参照してください。

### 完全な設定例

**Primary を DeepSeek R1、fallback を Qwen にする場合:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen を既定にし、`:cheapest` と `:fastest` の派生を持たせる場合:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS を alias 付きで使う場合:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**`:provider` で特定 backend を強制する場合:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1:together" },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1:together": { alias: "DeepSeek R1 (Together)" },
      },
    },
  },
}
```

**複数の Qwen / DeepSeek モデルに policy suffix を付ける場合:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
