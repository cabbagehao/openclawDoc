---
summary: "ハグ顔推論設定 (認証 + モデル選択)"
read_when:
  - OpenClaw でハグ顔推論を使用したい
  - HF トークン環境変数または CLI 認証の選択が必要です
title: "抱き合う顔（推測）"
x-i18n:
  source_hash: "e7ba5cb533f652ba9bb514ab8c5ffbd50170077ac0005555915405c109198a4f"
---

＃抱き顔（推測）

[ハグ顔推論プロバイダー](https://huggingface.co/docs/inference-providers) は、単一のルーター API を通じて OpenAI 互換のチャット完了を提供します。 1 つのトークンで多くのモデル (DeepSeek、Llama など) にアクセスできます。 OpenClaw は **OpenAI 互換エンドポイント** を使用します (チャット完了のみ)。テキストから画像への変換、埋め込み、または音声の場合は、[HF 推論クライアント](https://huggingface.co/docs/api-inference/quicktour) を直接使用します。

- プロバイダー: `huggingface`
- 認証: `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` (**推論プロバイダーへの呼び出し**を備えたきめ細かいトークン)
- API: OpenAI 互換 (`https://router.huggingface.co/v1`)
- 請求: 単一の HF トークン。 [価格設定](https://huggingface.co/docs/inference-providers/pricing) は、無料利用枠のプロバイダー料金に従います。

## クイックスタート

1. [ハグフェイス → 設定 → トークン](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) で、**推論プロバイダーへの呼び出し** 権限を持つ詳細なトークンを作成します。
2. オンボーディングを実行し、プロバイダーのドロップダウンで **Hugging Face** を選択し、プロンプトが表示されたら API キーを入力します。

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. **デフォルトの抱き顔モデル** ドロップダウンで、必要なモデルを選択します (有効なトークンがある場合、リストは推論 API からロードされます。そうでない場合は、組み込みリストが表示されます)。選択したモデルはデフォルトのモデルとして保存されます。
4. 後で設定でデフォルトのモデルを設定または変更することもできます。

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

これにより、`huggingface/deepseek-ai/DeepSeek-R1` がデフォルトのモデルとして設定されます。## 環境に関する注意事項

ゲートウェイがデーモン (launchd/systemd) として実行されている場合は、`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` であることを確認してください。
そのプロセスで利用できます (たとえば、`~/.openclaw/.env` または経由)
`env.shellEnv`)。

## モデルの検出とオンボーディングのドロップダウン

OpenClaw は、**推論エンドポイントを直接**呼び出してモデルを検出します。

```bash
GET https://router.huggingface.co/v1/models
```

(オプション: 完全なリストについては `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` または `$HF_TOKEN` を送信します。一部のエンドポイントは認証なしでサブセットを返します。) 応答は OpenAI スタイルの `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` です。

Hugging Face API キーを設定すると (オンボーディング、`HUGGINGFACE_HUB_TOKEN`、または `HF_TOKEN` 経由)、OpenClaw はこの GET を使用して、利用可能なチャット完了モデルを検出します。 **インタラクティブなオンボーディング**中、トークンを入力すると、そのリスト (またはリクエストが失敗した場合は組み込みカタログ) から入力された **デフォルトのハグ顔モデル** ドロップダウンが表示されます。実行時 (例: ゲートウェイの起動時)、キーが存在する場合、OpenClaw は再び **GET** `https://router.huggingface.co/v1/models` を呼び出してカタログを更新します。このリストは、組み込みカタログ (コンテキスト ウィンドウやコストなどのメタデータ用) とマージされます。リクエストが失敗した場合、またはキーが設定されていない場合は、組み込みカタログのみが使用されます。

## モデル名と編集可能なオプション- **API からの名前:** API が `name`、`title`、または `display_name` を返すと、モデルの表示名は **GET /v1/models** から取得されます。それ以外の場合は、モデル ID から派生します (例: `deepseek-ai/DeepSeek-R1` → 「DeepSeek R1」)

- **表示名を上書きする:** 設定でモデルごとにカスタム ラベルを設定できるため、CLI と UI で希望どおりに表示されます。

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

- **プロバイダー/ポリシーの選択:** **モデル ID** にサフィックスを追加して、ルーターがバックエンドを選択する方法を選択します。
  - **`:fastest`** - 最高のスループット (ルーター選択、プロバイダーの選択は **ロック** - インタラクティブなバックエンド ピッカーなし)。
  - **`:cheapest`** — 出力トークンあたりの最低コスト (ルーターが選択します。プロバイダーの選択は **ロック**)。
  - **`:provider`** — 特定のバックエンドを強制します (例: `:sambanova`、`:together`)。

  **:cheapest** または **:fastest** (オンボーディング モデルのドロップダウンなど) を選択すると、プロバイダーはロックされます。ルーターはコストまたは速度によって決定し、オプションの「特定のバックエンドを優先する」ステップは表示されません。これらを `models.providers.huggingface.models` に個別のエントリとして追加することも、接尾辞を付けて `model.primary` を設定することもできます。 [推論プロバイダーの設定](https://hf.co/settings/inference-providers) でデフォルトの順序を設定することもできます (サフィックスなし = その順序を使用します)。- **構成のマージ:** `models.providers.huggingface.models` (例: `models.json`) の既存のエントリは、構成がマージされるときに保持されます。したがって、そこで設定したカスタム `name`、`alias`、またはモデル オプションは保持されます。

## モデル ID と構成例

モデル参照は、`huggingface/<org>/<model>` (ハブ スタイル ID) の形式を使用します。以下のリストは **GET** `https://router.huggingface.co/v1/models` からのものです。カタログにはさらに多くの情報が含まれる可能性があります。

**ID の例 (推論エンドポイントから):**

| モデル                | 参照 (接頭辞 `huggingface/`)        |
| --------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ディープシーク R1     | `deepseek-ai/DeepSeek-R1`           |
| ディープシーク V3.2   | `deepseek-ai/DeepSeek-V3.2`         |
| クウェン3 8B          | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B 指示する   | `Qwen/Qwen2.5-7B-Instruct`          |
| クウェン3 32B         | `Qwen/Qwen3-32B`                    |
| ラマ 3.3 70B 指示する | `meta-llama/Llama-3.3-70B-Instruct` |
| ラマ 3.1 8B 命令      | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B          | `openai/gpt-oss-120b`               |
| GLM 4.7               | `zai-org/GLM-4.7`                   |
| キミK2.5              | `moonshotai/Kimi-K2.5`              | `:fastest`、`:cheapest`、または `:provider` (例: `:together`、`:sambanova`) をモデル ID に追加できます。 [推論プロバイダーの設定](https://hf.co/settings/inference-providers) でデフォルトの順序を設定します。完全なリストについては、[推論プロバイダー](https://huggingface.co/docs/inference-providers) および **GET** `https://router.huggingface.co/v1/models` を参照してください。 |

### 完全な構成例

**Qwen フォールバックを備えたプライマリ DeepSeek R1:**

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

**デフォルトとしての Qwen、:cheapest および :fastest のバリアント:**

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

**DeepSeek + Llama + GPT-OSS とエイリアス:**

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

**:provider:** を使用して特定のバックエンドを強制する

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

**ポリシー サフィックスを持つ複数の Qwen および DeepSeek モデル:**

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
