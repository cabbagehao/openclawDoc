---
summary: "Brave, Gemini, Grok, Kimi, Perplexity를 지원하는 web_search 및 web_fetch 가이드"
description: "OpenClaw의 웹 검색과 fetch 도구 설정, provider 선택, API key 구성, fetch 제한을 설명합니다."
read_when:
  - "`web_search` 또는 `web_fetch`를 활성화하려고 할 때"
  - provider API key와 설정 경로를 확인해야 할 때
  - Google Search grounding과 함께 Gemini를 사용하려고 할 때
title: "Web Tools"
---

# Web tools

OpenClaw는 두 가지 경량 웹 도구를 제공합니다.

- `web_search` — Brave Search API, Google Search grounding이 포함된 Gemini, Grok, Kimi, 또는 Perplexity Search API를 사용해 웹을 검색합니다.
- `web_fetch` — HTTP fetch와 읽기 쉬운 콘텐츠 추출(HTML → markdown/text)을 수행합니다.

이 도구들은 browser automation이 **아닙니다**. JS 비중이 큰 사이트나 로그인 처리가 필요하면
[Browser tool](/tools/browser)을 사용하세요.

## 동작 방식

- `web_search`는 구성된 provider를 호출하고 결과를 반환합니다.
- 결과는 query별로 15분 동안 캐시됩니다(변경 가능).
- `web_fetch`는 일반 HTTP GET을 수행하고 읽기 쉬운 내용을 추출합니다
  (HTML → markdown/text). JavaScript는 **실행하지 않습니다**.
- `web_fetch`는 기본적으로 활성화되어 있습니다(명시적으로 비활성화하지 않는 한).

Provider별 세부사항은 [Brave Search setup](/brave-search)와 [Perplexity Search setup](/perplexity)를 참고하세요.

## 검색 provider 선택

| Provider                  | 결과 형태                      | Provider별 필터                              | 참고                                                                     | API key                                     |
| ------------------------- | ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| **Brave Search API**      | Snippet이 포함된 구조화된 결과 | `country`, `language`, `ui_lang`, time       | Brave `llm-context` mode 지원                                            | `BRAVE_API_KEY`                             |
| **Gemini**                | Citation이 포함된 AI 합성 답변 | —                                            | Google Search grounding 사용                                             | `GEMINI_API_KEY`                            |
| **Grok**                  | Citation이 포함된 AI 합성 답변 | —                                            | xAI의 web-grounded response 사용                                         | `XAI_API_KEY`                               |
| **Kimi**                  | Citation이 포함된 AI 합성 답변 | —                                            | Moonshot web search 사용                                                 | `KIMI_API_KEY` / `MOONSHOT_API_KEY`         |
| **Perplexity Search API** | Snippet이 포함된 구조화된 결과 | `country`, `language`, time, `domain_filter` | Content extraction 제어 지원; OpenRouter는 Sonar compatibility path 사용 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |

### Auto-detection

위 표는 알파벳 순입니다. `provider`를 명시적으로 설정하지 않으면 런타임 auto-detection은 다음 순서로 provider를 확인합니다.

1. **Brave** — `BRAVE_API_KEY` env var 또는 `tools.web.search.apiKey` config
2. **Gemini** — `GEMINI_API_KEY` env var 또는 `tools.web.search.gemini.apiKey` config
3. **Grok** — `XAI_API_KEY` env var 또는 `tools.web.search.grok.apiKey` config
4. **Kimi** — `KIMI_API_KEY` / `MOONSHOT_API_KEY` env var 또는 `tools.web.search.kimi.apiKey` config
5. **Perplexity** — `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, 또는 `tools.web.search.perplexity.apiKey` config

어떤 key도 찾지 못하면 Brave로 fallback되며, 필요한 key를 구성하라는 missing-key 오류가 표시됩니다.

Runtime SecretRef 동작:

- Web tool의 SecretRef는 gateway 시작 또는 reload 시점에 원자적으로 해석됩니다.
- auto-detect mode에서는 선택된 provider key만 해석하며, 선택되지 않은 provider의 SecretRef는 실제로 선택되기 전까지 비활성 상태로 남습니다.
- 선택된 provider의 SecretRef를 해석할 수 없고 provider env fallback도 없으면, 시작 또는 reload가 즉시 실패합니다.

## Web search 설정

API key를 설정하고 provider를 선택하려면 `openclaw configure --section web`을 사용하세요.

### Brave Search

1. [brave.com/search/api](https://brave.com/search/api/)에서 Brave Search API 계정을 생성합니다.
2. Dashboard에서 **Search** plan을 선택하고 API key를 생성합니다.
3. `openclaw configure --section web`을 실행해 key를 config에 저장하거나, environment에 `BRAVE_API_KEY`를 설정합니다.

각 Brave plan에는 매달 갱신되는 **월 $5 무료 크레딧**이 포함됩니다.
Search plan은 요청 1,000건당 $5이므로, 이 크레딧으로 월 1,000 query를 처리할 수 있습니다. 예상치 못한 비용을 피하려면 Brave dashboard에서
사용량 제한을 설정하세요. 최신 plan과 가격은
[Brave API portal](https://brave.com/search/api/)을 참고하세요.

### Perplexity Search

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)에서 Perplexity 계정을 생성합니다.
2. Dashboard에서 API key를 생성합니다.
3. `openclaw configure --section web`을 실행해 key를 config에 저장하거나, environment에 `PERPLEXITY_API_KEY`를 설정합니다.

레거시 Sonar/OpenRouter 호환을 위해서는 대신 `OPENROUTER_API_KEY`를 설정하거나, `sk-or-...` key로 `tools.web.search.perplexity.apiKey`를 구성하세요. `tools.web.search.perplexity.baseUrl` 또는 `model`을 설정해도 Perplexity를 다시 chat-completions compatibility path로 전환합니다.

자세한 내용은 [Perplexity Search API Docs](https://docs.perplexity.ai/guides/search-quickstart)를 참고하세요.

### Key 저장 위치

**Config로 저장:** `openclaw configure --section web`을 실행하면 provider별 config 경로에 key를 저장합니다.

- Brave: `tools.web.search.apiKey`
- Gemini: `tools.web.search.gemini.apiKey`
- Grok: `tools.web.search.grok.apiKey`
- Kimi: `tools.web.search.kimi.apiKey`
- Perplexity: `tools.web.search.perplexity.apiKey`

위 필드는 모두 SecretRef object도 지원합니다.

**Environment로 저장:** Gateway process environment에 provider별 env var를 설정하세요.

- Brave: `BRAVE_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Grok: `XAI_API_KEY`
- Kimi: `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`
- Perplexity: `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`

Gateway 설치의 경우 `~/.openclaw/.env`(또는 service environment)에 넣으면 됩니다. [Env vars](/help/faq#how-does-openclaw-load-environment-variables)를 참고하세요.

### Config 예시

**Brave Search:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // optional if BRAVE_API_KEY is set // pragma: allowlist secret
      },
    },
  },
}
```

**Brave LLM Context mode:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // optional if BRAVE_API_KEY is set // pragma: allowlist secret
        brave: {
          mode: "llm-context",
        },
      },
    },
  },
}
```

`llm-context`는 일반 Brave snippet 대신 grounding용으로 추출된 page chunk를 반환합니다.
이 mode에서는 `country`와 `language` / `search_lang`는 계속 동작하지만, `ui_lang`,
`freshness`, `date_after`, `date_before`는 거부됩니다.

**Perplexity Search:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...", // optional if PERPLEXITY_API_KEY is set
        },
      },
    },
  },
}
```

**Perplexity via OpenRouter / Sonar compatibility:**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "<openrouter-api-key>", // optional if OPENROUTER_API_KEY is set
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## Gemini 사용하기 (Google Search grounding)

Gemini model은 내장 [Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)을 지원하며,
live Google Search 결과를 citation과 함께 바탕으로 한 AI 합성 답변을 반환합니다.

### Gemini API key 받기

1. [Google AI Studio](https://aistudio.google.com/apikey)로 이동합니다.
2. API key를 생성합니다.
3. Gateway environment에 `GEMINI_API_KEY`를 설정하거나, `tools.web.search.gemini.apiKey`를 구성합니다.

### Gemini search 설정

```json5
{
  tools: {
    web: {
      search: {
        provider: "gemini",
        gemini: {
          // API key (optional if GEMINI_API_KEY is set)
          apiKey: "AIza...",
          // Model (defaults to "gemini-2.5-flash")
          model: "gemini-2.5-flash",
        },
      },
    },
  },
}
```

**Environment 대안:** Gateway environment에 `GEMINI_API_KEY`를 설정하세요.
Gateway 설치의 경우 `~/.openclaw/.env`에 넣으면 됩니다.

### 참고

- Gemini grounding의 citation URL은 Google redirect URL에서 직접 URL로 자동 해석됩니다.
- Redirect 해석은 최종 citation URL을 반환하기 전에 SSRF guard 경로(HEAD + redirect 검사 + http/https validation)를 사용합니다.
- Redirect 해석은 엄격한 SSRF 기본값을 사용하므로, private/internal 대상으로의 redirect는 차단됩니다.
- 기본 model(`gemini-2.5-flash`)은 빠르고 비용 효율적입니다.
  Grounding을 지원하는 어떤 Gemini model이든 사용할 수 있습니다.

## web_search

구성된 provider를 사용해 web을 검색합니다.

### 요구 사항

- `tools.web.search.enabled`가 `false`가 아니어야 합니다(기본값: enabled)
- 선택한 provider의 API key:
  - **Brave**: `BRAVE_API_KEY` 또는 `tools.web.search.apiKey`
  - **Gemini**: `GEMINI_API_KEY` 또는 `tools.web.search.gemini.apiKey`
  - **Grok**: `XAI_API_KEY` 또는 `tools.web.search.grok.apiKey`
  - **Kimi**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, 또는 `tools.web.search.kimi.apiKey`
  - **Perplexity**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, 또는 `tools.web.search.perplexity.apiKey`
- 위 provider key 필드는 모두 SecretRef object를 지원합니다.

### Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // optional if BRAVE_API_KEY is set
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### Tool parameter

별도 표기가 없는 한 모든 parameter는 Brave와 native Perplexity Search API에서 동작합니다.

Perplexity의 OpenRouter / Sonar compatibility path는 `query`와 `freshness`만 지원합니다.
`tools.web.search.perplexity.baseUrl` / `model`을 설정하거나, `OPENROUTER_API_KEY`를 사용하거나, `sk-or-...` key를 구성하면 Search API 전용 필터는 명시적 오류를 반환합니다.

| Parameter             | 설명                                            |
| --------------------- | ----------------------------------------------- |
| `query`               | 검색 query (필수)                               |
| `count`               | 반환할 결과 수 (1-10, 기본값: 5)                |
| `country`             | 2글자 ISO 국가 코드 (예: `"US"`, `"DE"`)        |
| `language`            | ISO 639-1 언어 코드 (예: `"en"`, `"de"`)        |
| `freshness`           | 시간 필터: `day`, `week`, `month`, 또는 `year`  |
| `date_after`          | 이 날짜 이후 결과 (YYYY-MM-DD)                  |
| `date_before`         | 이 날짜 이전 결과 (YYYY-MM-DD)                  |
| `ui_lang`             | UI 언어 코드 (Brave만)                          |
| `domain_filter`       | Domain allowlist/denylist 배열 (Perplexity만)   |
| `max_tokens`          | 총 content budget, 기본값 25000 (Perplexity만)  |
| `max_tokens_per_page` | 페이지별 token 제한, 기본값 2048 (Perplexity만) |

**예시:**

```javascript
// German-specific search
await web_search({
  query: "TV online schauen",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "TMBG interview",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Exclude domains (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction (Perplexity only)
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

Brave `llm-context` mode가 활성화되면 `ui_lang`, `freshness`, `date_after`,
`date_before`는 지원되지 않습니다. 해당 필터가 필요하면 Brave `web` mode를 사용하세요.

## web_fetch

URL을 fetch하고 읽기 쉬운 content를 추출합니다.

### web_fetch 요구 사항

- `tools.web.fetch.enabled`가 `false`가 아니어야 합니다(기본값: enabled)
- 선택적 Firecrawl fallback: `tools.web.fetch.firecrawl.apiKey` 또는 `FIRECRAWL_API_KEY`를 설정하세요.
- `tools.web.fetch.firecrawl.apiKey`는 SecretRef object를 지원합니다.

### web_fetch config

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        readability: true,
        firecrawl: {
          enabled: true,
          apiKey: "FIRECRAWL_API_KEY_HERE", // optional if FIRECRAWL_API_KEY is set
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 86400000, // ms (1 day)
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

### web_fetch tool parameter

- `url` (필수, http/https만)
- `extractMode` (`markdown` | `text`)
- `maxChars` (긴 페이지를 잘라냄)

참고:

- `web_fetch`는 먼저 Readability(main-content extraction)를 사용하고, 그다음 Firecrawl(구성된 경우)을 사용합니다. 둘 다 실패하면 도구는 오류를 반환합니다.
- Firecrawl 요청은 기본적으로 bot-circumvention mode를 사용하며 결과를 캐시합니다.
- Firecrawl SecretRef는 Firecrawl이 활성 상태일 때만 해석됩니다 (`tools.web.fetch.enabled !== false` 이고 `tools.web.fetch.firecrawl.enabled !== false`).
- Firecrawl이 활성 상태인데 SecretRef를 해석할 수 없고 `FIRECRAWL_API_KEY` fallback도 없으면, 시작 또는 reload가 즉시 실패합니다.
- `web_fetch`는 기본적으로 Chrome과 유사한 User-Agent와 `Accept-Language`를 보냅니다. 필요하면 `userAgent`를 override하세요.
- `web_fetch`는 private/internal hostname을 차단하고 redirect도 다시 검사합니다(`maxRedirects`로 제한).
- `maxChars`는 `tools.web.fetch.maxCharsCap`을 넘지 못하도록 clamp됩니다.
- `web_fetch`는 파싱 전에 다운로드한 응답 body 크기를 `tools.web.fetch.maxResponseBytes`로 제한합니다. 응답이 너무 크면 잘라내고 경고를 포함합니다.
- `web_fetch`는 best-effort extraction이며, 일부 사이트는 browser tool이 필요합니다.
- Key 설정과 service 세부사항은 [Firecrawl](/tools/firecrawl)을 참고하세요.
- 반복 fetch를 줄이기 위해 응답은 캐시됩니다(기본값 15분).
- Tool profile/allowlist를 사용한다면 `web_search`/`web_fetch` 또는 `group:web`를 추가하세요.
- API key가 없으면 `web_search`는 docs 링크가 포함된 짧은 setup 힌트를 반환합니다.
