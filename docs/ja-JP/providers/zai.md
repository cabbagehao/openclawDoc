---
summary: "OpenClaw で Z.AI (GLM モデル) を使用する"
read_when:
  - OpenClaw で Z.AI / GLM モデルが必要な場合
  - 簡単な ZAI_API_KEY 設定が必要です
title: "Z.AI"
x-i18n:
  source_hash: "e3db40cb27b48179b7eaf5fb8fadaec6340f99616f199df44ffbb79372c53659"
---

# Z.AI

Z.AI は **GLM** モデル用の API プラットフォームです。 GLM 用の REST API を提供し、API キーを使用します
認証用。 Z.AI コンソールで API キーを作成します。 OpenClaw は `zai` プロバイダーを使用します
Z.AI APIキーを使用して。

## CLI セットアップ

```bash
openclaw onboard --auth-choice zai-api-key
# or non-interactive
openclaw onboard --zai-api-key "$ZAI_API_KEY"
```

## 構成スニペット

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## 注意事項

- GLM モデルは `zai/<model>` (例: `zai/glm-5`) として入手可能です。
- `tool_stream` は、Z.AI ツール呼び出しストリーミングに対してデフォルトで有効になっています。セット
  `agents.defaults.models["zai/<model>"].params.tool_stream` から `false` を無効にします。
- モデル ファミリの概要については、[/providers/glm](/providers/glm) を参照してください。
- Z.AI は API キーを使用したベアラー認証を使用します。
