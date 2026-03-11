---
summary: "Moonshot K2와 Kimi Coding 설정(서로 다른 provider + key)"
read_when:
  - Moonshot K2(Moonshot Open Platform)와 Kimi Coding 설정 차이를 알고 싶을 때
  - 서로 다른 endpoint, key, model ref를 이해해야 할 때
  - 둘 중 하나의 설정을 복사해 붙여넣고 싶을 때
title: "Moonshot AI"
---

# Moonshot AI (Kimi)

Moonshot은 OpenAI 호환 endpoint를 갖춘 Kimi API를 제공합니다. provider를 설정하고 기본 모델을 `moonshot/kimi-k2.5`로 두거나, `kimi-coding/k2p5`로 Kimi Coding을 사용할 수 있습니다.

현재 Kimi K2 model ID:

{/_moonshot-kimi-k2-ids:start_/}

* `kimi-k2.5`
* `kimi-k2-0905-preview`
* `kimi-k2-turbo-preview`
* `kimi-k2-thinking`
* `kimi-k2-thinking-turbo`
  {/_moonshot-kimi-k2-ids:end_/}

```bash
openclaw onboard --auth-choice moonshot-api-key
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

참고: Moonshot과 Kimi Coding은 서로 다른 provider입니다. key는 호환되지 않고, endpoint도 다르며, model ref도 다릅니다. Moonshot은 `moonshot/...`, Kimi Coding은 `kimi-coding/...`를 사용합니다.

## Config snippet (Moonshot API)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-0905-preview": { alias: "Kimi K2" },
        "moonshot/kimi-k2-turbo-preview": { alias: "Kimi K2 Turbo" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-0905-preview",
            name: "Kimi K2 0905 Preview",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-turbo-preview",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: {
        "kimi-coding/k2p5": { alias: "Kimi K2.5" },
      },
    },
  },
}
```

## Notes

* Moonshot model ref는 `moonshot/<modelId>`를 사용합니다. Kimi Coding model ref는 `kimi-coding/<modelId>`입니다.
* 필요하면 `models.providers`에서 가격과 context metadata를 override하세요.
* Moonshot이 특정 모델에 대해 다른 context limit를 발표하면, 그에 맞게 `contextWindow`를 조정하세요.
* 국제 endpoint는 `https://api.moonshot.ai/v1`, 중국 endpoint는 `https://api.moonshot.cn/v1`를 사용하세요.

## Native thinking mode (Moonshot)

Moonshot Kimi는 이진 native thinking을 지원합니다.

* `thinking: { type: "enabled" }`
* `thinking: { type: "disabled" }`

model별로 `agents.defaults.models.<provider/model>.params`에서 설정하세요.

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

OpenClaw는 Moonshot에 대해 런타임 `/think` level도 다음처럼 매핑합니다.

* `/think off` -> `thinking.type=disabled`
* off가 아닌 모든 thinking level -> `thinking.type=enabled`

Moonshot thinking이 활성화되면 `tool_choice`는 `auto` 또는 `none`이어야 합니다. 호환성을 위해 OpenClaw는 맞지 않는 `tool_choice` 값을 `auto`로 정규화합니다.
