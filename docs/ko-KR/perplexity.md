---
summary: "web_search용 Perplexity Search API 및 Sonar/OpenRouter 호환성"
read_when:
  - 웹 검색에 Perplexity Search를 사용하고 싶을 때
  - `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY` 설정이 필요할 때
title: "Perplexity 검색"
x-i18n:
  source_path: "perplexity.md"
---

# Perplexity Search API

OpenClaw는 `web_search` 제공업체로 Perplexity Search API를 지원합니다.
이 경로는 `title`, `url`, `snippet` 필드를 포함한 구조화된 결과를 반환합니다.

호환성을 위해 OpenClaw는 레거시 Perplexity Sonar/OpenRouter 설정도 지원합니다.
`OPENROUTER_API_KEY`를 사용하거나, `tools.web.search.perplexity.apiKey`에 `sk-or-...` 키를 저장하거나, `tools.web.search.perplexity.baseUrl` 또는 `model`을 설정하면 제공업체는 chat-completions 경로로 전환되어 구조화된 Search API 결과 대신 인용이 포함된 AI 합성 답변을 반환합니다.

## Perplexity API 키 발급하기

1. [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)에서 Perplexity 계정을 만듭니다.
2. 대시보드에서 API 키를 생성합니다.
3. 키를 설정 파일에 저장하거나 Gateway 환경에 `PERPLEXITY_API_KEY`를 설정합니다.

## OpenRouter 호환성

이미 OpenRouter로 Perplexity Sonar를 사용하고 있다면 `provider: "perplexity"`를 유지한 채 Gateway 환경에 `OPENROUTER_API_KEY`를 설정하거나, `tools.web.search.perplexity.apiKey`에 `sk-or-...` 키를 저장하면 됩니다.

선택적 레거시 제어 항목:

- `tools.web.search.perplexity.baseUrl`
- `tools.web.search.perplexity.model`

## 설정 예시

### 기본 Perplexity Search API

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...",
        },
      },
    },
  },
}
```

### OpenRouter / Sonar 호환성

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "<openrouter-api-key>",
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## 키를 설정하는 위치

**설정 파일로 지정:** `openclaw configure --section web`을 실행하세요. 키는 `~/.openclaw/openclaw.json`의 `tools.web.search.perplexity.apiKey` 아래에 저장됩니다.

**환경 변수로 지정:** Gateway 프로세스 환경에 `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`를 설정하세요. Gateway를 설치형으로 운용한다면 `~/.openclaw/.env`(또는 서비스 환경)에 넣으면 됩니다. 자세한 내용은 [환경 변수](/help/faq#how-does-openclaw-load-environment-variables)를 참고하세요.

## 도구 파라미터

다음 파라미터는 기본 Perplexity Search API 경로에 적용됩니다.

| Parameter             | Description                                       |
| --------------------- | ------------------------------------------------- |
| `query`               | 검색어(필수)                                      |
| `count`               | 반환할 결과 수(1~10, 기본값: 5)                   |
| `country`             | 2자리 ISO 국가 코드(예: `"US"`, `"DE"`)           |
| `language`            | ISO 639-1 언어 코드(예: `"en"`, `"de"`, `"fr"`)   |
| `freshness`           | 시간 필터: `day`(24시간), `week`, `month`, `year` |
| `date_after`          | 이 날짜 이후에 게시된 결과만 포함(YYYY-MM-DD)     |
| `date_before`         | 이 날짜 이전에 게시된 결과만 포함(YYYY-MM-DD)     |
| `domain_filter`       | 도메인 허용 목록/차단 목록 배열(최대 20개)        |
| `max_tokens`          | 총 콘텐츠 예산(기본값: 25000, 최대: 1000000)      |
| `max_tokens_per_page` | 페이지별 토큰 한도(기본값: 2048)                  |

레거시 Sonar/OpenRouter 호환 경로에서는 `query`와 `freshness`만 지원됩니다.
`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page` 같은 Search API 전용 필터는 명시적 오류를 반환합니다.

**예시:**

```javascript
// 국가 및 언어별 검색
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 최근 결과(지난 1주)
await web_search({
  query: "AI news",
  freshness: "week",
});

// 날짜 범위 검색
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 도메인 필터링(허용 목록)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 도메인 필터링(차단 목록 - 접두사 `-`)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 더 많은 콘텐츠 추출
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 도메인 필터 규칙

- 필터당 최대 20개 도메인만 허용됩니다.
- 한 요청 안에서 허용 목록과 차단 목록을 섞어 쓸 수 없습니다.
- 차단 목록 항목은 `-` 접두사를 사용합니다(예: `["-reddit.com"]`).

## 참고

- Perplexity Search API는 구조화된 웹 검색 결과(`title`, `url`, `snippet`)를 반환합니다.
- OpenRouter 또는 명시적 `baseUrl` / `model` 설정은 호환성을 위해 Perplexity를 다시 Sonar chat completions 경로로 전환합니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 조정 가능).

전체 `web_search` 설정은 [Web tools](/tools/web)를 참고하세요.
자세한 내용은 [Perplexity Search API 문서](https://docs.perplexity.ai/docs/search/quickstart)를 참고하세요.
