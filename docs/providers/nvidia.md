---
summary: "OpenClaw で NVIDIA の OpenAI 互換 API を使用する"
read_when:
  - OpenClaw で NVIDIA モデルを使用したい
  - NVIDIA_API_KEY の設定が必要です
title: "OpenClawでNVIDIA OpenAI互換APIを使う認証・設定ガイド"
description: "NVIDIA の OpenAI 互換 API を OpenClaw から使う設定ガイドです。API キー認証、対応モデル、CLI セットアップの流れを確認できます。"
x-i18n:
  source_hash: "81e7a1b6cd6821b68db9c71b864d36023b1ccfad1641bf88e2bc2957782edf8b"
---
NVIDIA は、Nemotron および NeMo モデル用の OpenAI 互換 API を `https://integrate.api.nvidia.com/v1` で提供しています。 [NVIDIA NGC](https://catalog.ngc.nvidia.com/) の API キーを使用して認証します。

## CLI セットアップ

キーを一度エクスポートしてから、オンボーディングを実行して、NVIDIA モデルを設定します。

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

それでも `--token` を渡す場合は、それがシェル履歴と `ps` 出力に記録されることを覚えておいてください。可能であれば、環境変数を使用してください。

## 構成スニペット

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## モデル ID

- `nvidia/llama-3.1-nemotron-70b-instruct` (デフォルト)
- `meta/llama-3.3-70b-instruct`
- `nvidia/mistral-nemo-minitron-8b-8k-instruct`

## 注意事項

- OpenAI 互換の `/v1` エンドポイント。 NVIDIA NGC の API キーを使用します。
- `NVIDIA_API_KEY` が設定されている場合、プロバイダーは自動的に有効になります。静的なデフォルト (131,072 トークンのコンテキスト ウィンドウ、最大トークン 4,096) を使用します。
