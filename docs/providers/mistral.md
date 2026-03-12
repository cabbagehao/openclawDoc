---
summary: "OpenClaw で Mistral モデルと Voxtral 転写を使用する"
read_when:
  - OpenClaw で Mistral モデルを使用したい
  - Mistral API キーのオンボーディングとモデル参照が必要です
title: "ミストラル"
x-i18n:
  source_hash: "4f3efe060cbaeb14e20439ade040e57d27e7d98fb9dd06e657f6a69ae808f24f"
---
OpenClaw は、テキスト/イメージ モデル ルーティング (`mistral/...`) と、
メディア理解における Voxtral を介した音声転写。
Mistral はメモリ埋め込みにも使用できます (`memorySearch.provider = "mistral"`)。

## CLI セットアップ

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## 構成スニペット (LLM プロバイダー)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## 構成スニペット (Voxtral による音声転写)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## 注意事項

- ミストラル認証は `MISTRAL_API_KEY` を使用します。
- プロバイダーのベース URL のデフォルトは `https://api.mistral.ai/v1` です。
- オンボーディングのデフォルト モデルは `mistral/mistral-large-latest` です。
- Mistral のメディアを理解するデフォルトのオーディオ モデルは `voxtral-mini-latest` です。
- メディア転写パスは `/v1/audio/transcriptions` を使用します。
- メモリ埋め込みパスは `/v1/embeddings` (デフォルト モデル: `mistral-embed`) を使用します。
