---
summary: "web_search 기능을 위한 Perplexity Search API 설정 및 Sonar/OpenRouter 호환성 안내"
read_when:
  - 웹 검색 도구로 Perplexity Search를 사용하고자 할 때
  - `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY` 설정 방법이 궁금할 때
title: "Perplexity 검색"
x-i18n:
  source_path: "perplexity.md"
---

# Perplexity Search API

OpenClaw는 웹 검색(`web_search`) 공급자로 Perplexity Search API를 지원함.
이 기능을 사용하면 `title`, `url`, `snippet` 필드가 포함된 구조화된 검색 결과를 반환함.

기존 사용자와의 호환성을 위해 레거시 Perplexity Sonar 및 OpenRouter 설정도 지원함.
`OPENROUTER_API_KEY`를 사용하거나, `tools.web.search.perplexity.apiKey`에 `sk-or-...` 키를 저장하거나, `tools.web.search.perplexity.baseUrl` 또는 `model`을 명시적으로 설정할 경우 시스템은 Chat Completions 경로로 전환됨. 이 경우 구조화된 검색 결과 대신 AI가 생성한 답변과 인용(Citation) 정보가 반환됨.

## Perplexity API 키 발급 절차

1. [Perplexity API 설정 페이지](https://www.perplexity.ai/settings/api)에서 계정을 생성함.
2. 대시보드에서 API 키를 생성함.
3. 발급받은 키를 설정 파일에 저장하거나 Gateway 환경 변수에 `PERPLEXITY_API_KEY`로 등록함.

## OpenRouter 호환성 설정

이미 OpenRouter를 통해 Perplexity Sonar를 사용 중이라면, `provider: "perplexity"` 설정을 유지한 상태에서 Gateway 환경 변수에 `OPENROUTER_API_KEY`를 등록하거나 `tools.web.search.perplexity.apiKey`에 `sk-or-...` 키를 저장하여 연동 가능함.

추가적인 레거시 제어 옵션:

- `tools.web.search.perplexity.baseUrl`
- `tools.web.search.perplexity.model`

## 설정 예시

### 네이티브 Perplexity Search API 사용 시

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

### OpenRouter / Sonar 호환 모드 사용 시

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

## API 키 설정 방법

**설정 마법사 활용:** `openclaw configure --section web` 명령어를 실행함. 입력한 키는 `~/.openclaw/openclaw.json` 파일의 `tools.web.search.perplexity.apiKey` 경로에 저장됨.

**환경 변수 활용:** Gateway 프로세스 환경 변수에 `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`를 설정함. 서비스를 통해 실행 중인 경우 `~/.openclaw/.env` 파일이나 서비스 설정 파일에 등록함. 자세한 내용은 [환경 변수 가이드](/help/faq#how-does-openclaw-load-environment-variables)를 참조함.

## 도구 파라미터

다음 파라미터는 네이티브 Perplexity Search API 경로 사용 시 적용됨.

| 파라미터              | 설명                                                        |
| --------------------- | ----------------------------------------------------------- |
| `query`               | 검색어 (필수)                                               |
| `count`               | 반환할 결과 수 (1~10, 기본값: 5)                            |
| `country`             | 2자리 ISO 국가 코드 (예: `"US"`, `"DE"`, `"KR"`)           |
| `language`            | ISO 639-1 언어 코드 (예: `"en"`, `"ko"`, `"fr"`)           |
| `freshness`           | 기간 필터: `day`(24시간), `week`, `month`, `year`           |
| `date_after`          | 지정된 날짜 이후에 게시된 결과만 포함 (YYYY-MM-DD)          |
| `date_before`         | 지정된 날짜 이전에 게시된 결과만 포함 (YYYY-MM-DD)          |
| `domain_filter`       | 도메인 허용/차단 목록 배열 (최대 20개)                      |
| `max_tokens`          | 추출할 전체 콘텐츠 예산 (기본값: 25000, 최대: 1000000)      |
| `max_tokens_per_page` | 페이지당 토큰 제한 (기본값: 2048)                           |

레거시 Sonar/OpenRouter 호환 모드에서는 `query`와 `freshness` 파라미터만 지원됨.
Search API 전용 필터(`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) 사용 시 오류가 발생할 수 있음.

**사용 예시:**

```javascript
// 국가 및 언어별 맞춤 검색
await web_search({
  query: "신재생 에너지",
  country: "KR",
  language: "ko",
});

// 최근 1주일간의 결과 검색
await web_search({
  query: "AI 뉴스",
  freshness: "week",
});

// 특정 날짜 범위 검색
await web_search({
  query: "AI 발전 현황",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 도메인 필터링 (허용 목록)
await web_search({
  query: "기후 연구",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 도메인 필터링 (차단 목록 - 접두사 `-` 사용)
await web_search({
  query: "제품 리뷰",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 상세 콘텐츠 추출 설정
await web_search({
  query: "상세 AI 연구 결과",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 도메인 필터 규칙

- 필터당 최대 20개의 도메인을 지정할 수 있음.
- 동일한 요청 내에서 허용 목록과 차단 목록을 혼용할 수 없음.
- 차단하려는 도메인에는 `-` 접두사를 붙여야 함 (예: `["-reddit.com"]`).

## 참고 사항

- Perplexity Search API는 `title`, `url`, `snippet`으로 구성된 구조화된 검색 결과를 제공함.
- OpenRouter 또는 명시적인 `baseUrl`/`model` 설정 시 호환성을 위해 Sonar Chat Completions 방식으로 동작함.
- 검색 결과는 기본적으로 15분 동안 캐싱됨 (`cacheTtlMinutes`로 조절 가능).

전체 `web_search` 설정에 관한 내용은 [Web 도구](/tools/web) 문서를 참조함.
상세 기술 명세는 [Perplexity Search API 공식 문서](https://docs.perplexity.ai/docs/search/quickstart)를 참조함.
