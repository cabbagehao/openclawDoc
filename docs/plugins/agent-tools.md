---
summary: "プラグインで agent tool を作成する方法（schema、optional tool、allowlist）"
read_when:
  - プラグインに新しい agent tool を追加したいとき
  - allowlist 経由でツールを opt-in にしたいとき
title: "プラグイン エージェント ツール"
seoTitle: "OpenClawのエージェントツール用プラグインの設定方法と利用ガイド"
description: "OpenClaw のプラグインは、エージェント実行時に LLM へ公開される agent tool（JSON Schema ベースの関数）を登録できます。ツールは required（常に利用可能）にも optional（opt-in）にもできます。"
x-i18n:
  source_hash: "4479462e9d8b17b664bf6b5f424f2efc8e7bedeaabfdb6a93126e051e635c659"
---
OpenClaw のプラグインは、エージェント実行時に LLM へ公開される **agent tool**（JSON Schema ベースの関数）を登録できます。ツールは **required**（常に利用可能）にも **optional**（opt-in）にもできます。

agent tool は、メイン設定の `tools`、またはエージェントごとの `agents.list[].tools` で制御します。どのツールをエージェントが呼び出せるかは、allowlist / denylist ポリシーによって決まります。

## 基本的なツール

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

## Optional tool（opt-in）

optional tool は **自動では有効になりません**。利用者がエージェントの allowlist へ明示的に追加する必要があります。

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

optional tool は `agents.list[].tools.allow`（またはグローバルの `tools.allow`）で有効化します。

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

ツールの可用性に影響する他の設定項目:

- プラグイン ツールだけを列挙した allowlist は、plugin opt-in として扱われます。core tool を制限したい場合は、allowlist に core tool または group も含めてください。
- `tools.profile` / `agents.list[].tools.profile`（基本 allowlist）
- `tools.byProvider` / `agents.list[].tools.byProvider`（provider ごとの allow / deny）
- `tools.sandbox.tools.*`（サンドボックス実行時のツール ポリシー）

## ルールとヒント

- ツール名は core tool 名と **衝突してはいけません**。衝突したツールはスキップされます。
- allowlist で使う plugin id も、core tool 名と衝突してはいけません。
- 副作用を持つツールや、追加のバイナリ / 認証情報を必要とするツールでは、`optional: true` を優先してください。
