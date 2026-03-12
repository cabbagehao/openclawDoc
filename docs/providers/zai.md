---
summary: "OpenClaw で Z.AI（GLM モデル）を利用する"
read_when:
  - OpenClaw で Z.AI / GLM モデルを使いたいとき
  - "`ZAI_API_KEY` を使う簡単なセットアップを確認したいとき"
title: "OpenClawでZ.AI GLMモデルAPIを使う認証・設定ガイド"
description: "Z.AI の GLM モデルを OpenClaw で使う設定ガイドです。API キー認証、provider 設定、CLI での接続手順を確認できます。"
x-i18n:
  source_hash: "e3db40cb27b48179b7eaf5fb8fadaec6340f99616f199df44ffbb79372c53659"
---
Z.AI は **GLM** モデル向けの API プラットフォームです。GLM 用の REST API を提供し、認証には API キーを使用します。API キーは Z.AI Console で作成します。OpenClaw では `zai` provider と Z.AI API キーを使って利用します。

## CLI セットアップ

```bash
openclaw onboard --auth-choice zai-api-key
# または non-interactive
openclaw onboard --zai-api-key "$ZAI_API_KEY"
```

## 設定例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## 注意事項

- GLM モデルは `zai/<model>` 形式で利用できます（例: `zai/glm-5`）。
- Z.AI の tool-call streaming では、`tool_stream` が既定で有効です。無効にする場合は `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
- モデル ファミリの概要は [/providers/glm](/providers/glm) を参照してください。
- Z.AI では API キーを Bearer 認証として使用します。
