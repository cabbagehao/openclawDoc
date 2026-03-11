---
summary: "ワークフロー用の JSON のみの LLM タスク (オプションのプラグイン ツール)"
read_when:
  - ワークフロー内に JSON のみの LLM ステップが必要な場合
  - 自動化にはスキーマ検証された LLM 出力が必要です
title: "LLM タスク"
x-i18n:
  source_hash: "7a951601416cfa898168b32fb6103b2b3c788b2ce1e2a0a80896beb14a6454ce"
---

# LLM タスク

`llm-task` は、JSON のみの LLM タスクを実行する **オプションのプラグイン ツール** です。
構造化された出力を返します (オプションで JSON スキーマに対して検証されます)。

これは、Lobster のようなワークフロー エンジンに最適です。単一の LLM ステップを追加できます。
ワークフローごとにカスタム OpenClaw コードを記述する必要はありません。

## プラグインを有効にする

1. プラグインを有効にします。

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. ツールをホワイトリストに登録します (`optional: true` で登録されています)。

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 構成 (オプション)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` は、`provider/model` 文字列の許可リストです。設定されている場合、任意のリクエスト
リスト外のものは拒否されます。

## ツールパラメータ

* `prompt` (文字列、必須)
* `input` (任意、オプション)
* `schema` (オブジェクト、オプションの JSON スキーマ)
* `provider` (文字列、オプション)
* `model` (文字列、オプション)
* `authProfileId` (文字列、オプション)
* `temperature` (数字、オプション)
* `maxTokens` (数字、オプション)
* `timeoutMs` (数字、オプション)

## 出力

解析された JSON を含む `details.json` を返します (および検証
`schema` (提供されている場合)。

## 例: ロブスターのワークフロー ステップ

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 安全上の注意事項- このツールは **JSON のみ**であり、JSON のみを出力するようにモデルに指示します (

コードフェンス、コメントなし)。

* この実行ではモデルに公開されるツールはありません。
* `schema` で検証しない限り、出力を信頼できないものとして扱います。
* 副作用のあるステップ (送信、投稿、実行) の前に承認を置きます。
