---
summary: "web_fetch에서 Firecrawl fallback extractor를 설정하는 방법을 설명합니다."
description: "OpenClaw에서 Firecrawl API key, cache, proxy mode를 설정해 `web_fetch` fallback extraction을 쓰는 방법을 안내합니다."
read_when:
  - "Firecrawl 기반 웹 추출을 사용하고 싶을 때"
  - "Firecrawl API key가 필요할 때"
  - "`web_fetch`용 anti-bot 추출이 필요할 때"
title: "Firecrawl"
x-i18n:
  source_path: "tools/firecrawl.md"
---

# Firecrawl

OpenClaw는 `web_fetch`의 fallback extractor로 **Firecrawl**을 사용할 수 있습니다. Firecrawl은 bot 우회와 caching을 지원하는 hosted content extraction service로, JS-heavy site나 일반 HTTP fetch를 막는 페이지에서 도움이 됩니다.

## API key 얻기

1. Firecrawl 계정을 만들고 API key를 생성합니다.
2. config에 저장하거나 gateway 환경에 `FIRECRAWL_API_KEY`를 설정합니다.

## Firecrawl 설정

```json5
{
  tools: {
    web: {
      fetch: {
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 172800000,
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

메모:

- `firecrawl.enabled`는 API key가 있으면 기본값이 `true`입니다.
- Firecrawl fallback 시도는 API key(`tools.web.fetch.firecrawl.apiKey` 또는 `FIRECRAWL_API_KEY`)가 있을 때만 실행됩니다.
- `maxAgeMs`는 cache 결과를 얼마나 오래된 것까지 허용할지 제어합니다(ms). 기본값은 2일입니다.

## Stealth / bot 우회

Firecrawl은 bot 우회를 위한 **proxy mode** 매개변수(`basic`, `stealth`, `auto`)를 제공합니다.
OpenClaw는 Firecrawl 요청에 항상 `proxy: "auto"`와 `storeInCache: true`를 사용합니다.
proxy를 생략해도 Firecrawl 기본값은 `auto`입니다. `auto`는 basic 시도가 실패하면 stealth proxy로 재시도하므로 basic-only scraping보다 더 많은 credit을 사용할 수 있습니다.

## `web_fetch` 에서 Firecrawl 을 사용하는 방식

`web_fetch` 추출 순서:

1. Readability (로컬)
2. Firecrawl (설정된 경우)
3. 기본 HTML 정리(마지막 fallback)

웹 도구 전체 설정은 [Web tools](/tools/web) 문서를 참고하세요.
