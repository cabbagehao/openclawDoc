---
summary: "플러그인에서 에이전트 도구 작성(schema, optional 도구, allowlist)"
description: "plugin에서 agent tools를 등록하고 `optional: true`, allowlists, plugin id opt-in을 어떻게 쓰는지 설명합니다."
read_when:
  - "plugin에 새 agent tool을 추가할 때"
  - "tool을 allowlist로 opt-in되게 만들 때"
title: "Plugin Agent Tools"
x-i18n:
  source_path: "plugins/agent-tools.md"
---

# 플러그인 에이전트 도구

OpenClaw plugins는 agent runs 중 LLM에 노출되는 **agent tools** (JSON-schema functions)를 등록할 수 있습니다. tools는 **required**(항상 사용 가능)일 수도 있고 **optional**(opt-in)일 수도 있습니다.

agent tools는 main config의 `tools` 아래 또는 agent별 `agents.list[].tools` 아래에서 설정합니다. allowlist/denylist policy가 agent가 어떤 tools를 호출할 수 있는지 제어합니다.

## Basic tool

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

## Optional tool (opt-in)

optional tools는 **절대** 자동 활성화되지 않습니다. 사용자가 agent allowlist에 직접 추가해야 합니다.

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

optional tools는 `agents.list[].tools.allow` (또는 전역 `tools.allow`)에서 활성화합니다.

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

tool availability에 영향을 주는 다른 config knobs:

- plugin tools만 이름에 넣은 allowlists는 plugin opt-ins로 처리됩니다. core tools나 groups도 allowlist에 함께 넣지 않는 한 core tools는 계속 활성화됩니다.
- `tools.profile` / `agents.list[].tools.profile` (base allowlist)
- `tools.byProvider` / `agents.list[].tools.byProvider` (provider별 allow/deny)
- `tools.sandbox.tools.*` (sandboxed일 때의 tool policy)

## Rules + tips

- tool names는 core tool names와 **충돌하면 안 됩니다**. 충돌하는 tools는 건너뜁니다.
- allowlist에 쓰는 plugin ids도 core tool names와 충돌하면 안 됩니다.
- side effects를 일으키거나 추가 binaries/credentials가 필요한 tools에는 `optional: true`를 우선 고려하세요.
