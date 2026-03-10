---
summary: "GLM モデルファミリーの概要と OpenClaw での使用方法"
read_when:
  - OpenClaw で GLM モデルが必要な場合
  - モデルの命名規則と設定が必要です
title: "GLMモデル"
x-i18n:
  source_hash: "e9c1671c4234c22edddbe23efc8f8cb44541718afb7666d5da49ac4313082c4b"
---

# GLM モデル

GLM は、Z.AI プラットフォームを通じて利用できる **モデル ファミリー** (会社ではありません) です。 OpenClaw、GLMでは
モデルには、`zai` プロバイダーと `zai/glm-5` のようなモデル ID を介してアクセスします。

## CLI セットアップ

```bash
openclaw onboard --auth-choice zai-api-key
```

## 構成スニペット

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## 注意事項

- GLM のバージョンと可用性は変更される可能性があります。最新については、Z.AI のドキュメントを確認してください。
- モデル ID の例には、`glm-5`、`glm-4.7`、`glm-4.6` などがあります。
- プロバイダーの詳細については、[/providers/zai](/providers/zai) を参照してください。
