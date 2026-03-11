---
summary: "web_fetch 용 Firecrawl fallback (anti-bot + cached extraction)"
read_when:
  - Firecrawl 기반 웹 추출을 사용하고 싶을 때
  - Firecrawl API key 가 필요할 때
  - web_fetch 를 위한 anti-bot 추출이 필요할 때
title: "Firecrawl"
---

# Firecrawl

OpenClaw 는 `web_fetch` 의 fallback extractor 로 **Firecrawl** 을 사용할 수 있습니다. 이는 bot 우회와 캐싱을 지원하는 호스팅 콘텐츠 추출 서비스로, JS-heavy 사이트나 일반 HTTP fetch 를 막는 페이지에서 도움이 됩니다.

## API key 얻기

1. Firecrawl 계정을 만들고 API key 를 생성합니다.
2. config 에 저장하거나 gateway 환경에 `FIRECRAWL_API_KEY` 를 설정합니다.

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

- `firecrawl.enabled` 는 API key 가 있으면 기본값이 true 입니다.
- `maxAgeMs` 는 캐시 결과를 얼마나 오래된 것까지 허용할지 제어합니다(ms). 기본값은 2일입니다.

## Stealth / bot 우회

Firecrawl 은 bot 우회를 위한 **proxy mode** 매개변수(`basic`, `stealth`, `auto`)를 제공합니다.
OpenClaw 는 Firecrawl 요청에 항상 `proxy: "auto"` 와 `storeInCache: true` 를 사용합니다.
proxy 를 생략하면 Firecrawl 기본값도 `auto` 입니다. `auto` 는 basic 시도가 실패하면 stealth proxy 로 재시도하므로 basic-only scraping 보다 더 많은 credits 를 사용할 수 있습니다.

## `web_fetch` 에서 Firecrawl 을 사용하는 방식

`web_fetch` 추출 순서:

1. Readability (로컬)
2. Firecrawl (설정된 경우)
3. 기본 HTML 정리(최후의 fallback)

웹 도구 전체 설정은 [Web tools](/tools/web) 문서를 참고하세요.
