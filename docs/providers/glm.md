---
summary: "GLM モデル ファミリーの概要と OpenClaw での使い方"
read_when:
  - OpenClaw で GLM モデルを使いたいとき
  - モデル命名規則やセットアップ方法を確認したいとき
title: "OpenClawでGLMモデルを使うZ.AIプロバイダー設定ガイド"
description: "GLM モデルを OpenClaw から使うときの参照ガイドです。Z.AI との関係、モデル命名規則、CLI でのセットアップ手順を整理しています。"
x-i18n:
  source_hash: "11d3a0189a0a8033dd4dd1c5a6d7d8de0cd0d1b629b677ed05a37562ca61d2f8"
---
GLM は **モデル ファミリー** であり、企業名ではありません。Z.AI platform から提供されており、OpenClaw では `zai` provider と `zai/glm-5` のような model ID を通じて利用します。

## CLI セットアップ

```bash
openclaw onboard --auth-choice zai-api-key
```

## 設定例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## 補足

- GLM のバージョンや利用可否は変わる可能性があります。最新情報は Z.AI のドキュメントを確認してください。
- 例として、`glm-5`、`glm-4.7`、`glm-4.6` などの model ID があります。
- provider の詳細は [/providers/zai](/providers/zai) を参照してください。
