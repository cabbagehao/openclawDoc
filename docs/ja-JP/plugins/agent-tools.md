---
summary: "プラグインでエージェント ツールを作成する (スキーマ、オプション ツール、ホワイトリスト)"
read_when:
  - プラグインに新しいエージェント ツールを追加したい
  - ホワイトリスト経由でツールをオプトインする必要がある
title: "プラグインエージェントツール"
x-i18n:
  source_hash: "4479462e9d8b17b664bf6b5f424f2efc8e7bedeaabfdb6a93126e051e635c659"
---

# プラグインエージェントツール

OpenClaw プラグインは、公開されている **エージェント ツール** (JSON スキーマ関数) を登録できます
エージェントの実行中に LLM に送信されます。ツールは **必須** (常に利用可能) または
**オプション** (オプトイン)。

エージェント ツールは、メイン設定の `tools` で、またはエージェントごとに設定されます。
`agents.list[].tools`。ホワイトリスト/拒否リストポリシーは、エージェントがどのツールを使用するかを制御します。
電話することができます。

## 基本ツール

```ts
import { Type } from "@sinclair/typebox";

export default function (api) {
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({
      input: Type.String(),
    }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });
}
```

## オプションのツール (オプトイン)

オプションのツールは**決して**自動で有効になりません。ユーザーはエージェントを追加する必要があります
許可リスト。

```ts
export default function (api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a local workflow",
      parameters: {
        type: "object",
        properties: {
          pipeline: { type: "string" },
        },
        required: ["pipeline"],
      },
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

`agents.list[].tools.allow` (またはグローバル `tools.allow`) でオプションのツールを有効にします。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "workflow_tool", // specific tool name
            "workflow", // plugin id (enables all tools from that plugin)
            "group:plugins", // all plugin tools
          ],
        },
      },
    ],
  },
}
```

ツールの可用性に影響を与えるその他の設定ノブ:

- プラグイン ツールのみを指定する許可リストは、プラグイン オプトインとして扱われます。コアツールは残る
  コア ツールまたはグループも許可リストに含めない限り、有効になります。
- `tools.profile` / `agents.list[].tools.profile` (基本許可リスト)
- `tools.byProvider` / `agents.list[].tools.byProvider` (プロバイダー固有の許可/拒否)
- `tools.sandbox.tools.*` (サンドボックス化された場合のサンドボックス ツール ポリシー)

## ルールとヒント

- ツール名はコア ツール名と**衝突してはなりません**。競合するツールはスキップされます。
- ホワイトリストで使用されるプラグイン ID は、コア ツール名と衝突してはなりません。
- 副作用を引き起こすツールや追加のものが必要なツールには、`optional: true` を優先します。
  バイナリ/認証情報。
