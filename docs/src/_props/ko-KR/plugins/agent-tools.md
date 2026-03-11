---
summary: "플러그인에서 에이전트 도구 작성(schema, optional 도구, allowlist)"
read_when:
  - 플러그인에 새 에이전트 도구를 추가하고 싶을 때
  - 도구를 allowlist로 opt-in되게 만들어야 할 때
title: "플러그인 에이전트 도구"
x-i18n:
  source_path: "plugins/agent-tools.md"
---

# 플러그인 에이전트 도구

OpenClaw 플러그인은 에이전트 실행 중 LLM에 노출되는 **에이전트 도구**
(JSON-schema 함수)를 등록할 수 있습니다. 도구는 **필수**(항상 사용 가능)일 수도 있고
**선택적**(옵트인)일 수도 있습니다.

에이전트 도구는 메인 config의 `tools` 아래 또는 에이전트별
`agents.list[].tools` 아래에서 설정합니다. allowlist/denylist 정책이
에이전트가 어떤 도구를 호출할 수 있는지 제어합니다.

## 기본 도구

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

## 선택적 도구(옵트인)

선택적 도구는 **절대** 자동 활성화되지 않습니다. 사용자가 반드시 에이전트
allowlist에 직접 추가해야 합니다.

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

선택적 도구는 `agents.list[].tools.allow`(또는 전역 `tools.allow`)에서
활성화합니다.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "workflow_tool", // 특정 도구 이름
            "workflow", // 플러그인 id(해당 플러그인의 모든 도구 활성화)
            "group:plugins", // 모든 플러그인 도구
          ],
        },
      },
    ],
  },
}
```

도구 가용성에 영향을 주는 다른 config 항목:

* 플러그인 도구만 이름에 넣은 allowlist는 플러그인 옵트인으로 처리됩니다. core 도구나 group도 allowlist에 함께 넣지 않는 한 core 도구는 계속 활성화됩니다.
* `tools.profile` / `agents.list[].tools.profile`(기본 allowlist)
* `tools.byProvider` / `agents.list[].tools.byProvider`(provider별 허용/차단)
* `tools.sandbox.tools.*`(sandboxed 상태일 때의 sandbox 도구 정책)

## 규칙 + 팁

* 도구 이름은 core 도구 이름과 **충돌하면 안 됩니다**. 충돌하는 도구는 건너뜁니다.
* allowlist에 쓰는 플러그인 id도 core 도구 이름과 충돌하면 안 됩니다.
* 부수효과를 일으키거나 추가 바이너리/자격 증명이 필요한 도구에는 `optional: true`를 우선 고려하세요.
