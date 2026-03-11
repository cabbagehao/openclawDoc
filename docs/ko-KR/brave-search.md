---
summary: "`web_search`용 Brave Search API 설정"
read_when:
  - `web_search`에 Brave Search를 사용하고 싶을 때
  - `BRAVE_API_KEY` 또는 요금제 정보가 필요할 때
title: "Brave Search"
x-i18n:
  source_path: "brave-search.md"
---

# Brave Search API

OpenClaw는 `web_search` 제공업체로 Brave Search API를 지원합니다.

## API 키 발급

1. [https://brave.com/search/api/](https://brave.com/search/api/)에서 Brave Search API 계정을 만듭니다.
2. 대시보드에서 **Search** 요금제를 선택하고 API 키를 생성합니다.
3. 키를 설정 파일에 저장하거나 Gateway 환경에 `BRAVE_API_KEY`를 설정합니다.

## 설정 예시

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

## 도구 파라미터

| Parameter     | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| `query`       | 검색어(필수)                                                |
| `count`       | 반환할 결과 수(1~10, 기본값: 5)                             |
| `country`     | 2자리 ISO 국가 코드(예: `"US"`, `"DE"`)                     |
| `language`    | 검색 결과용 ISO 639-1 언어 코드(예: `"en"`, `"de"`, `"fr"`) |
| `ui_lang`     | UI 요소용 ISO 언어 코드                                     |
| `freshness`   | 시간 필터: `day`(24시간), `week`, `month`, `year`           |
| `date_after`  | 이 날짜 이후에 게시된 결과만 포함(YYYY-MM-DD)               |
| `date_before` | 이 날짜 이전에 게시된 결과만 포함(YYYY-MM-DD)               |

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
```

## 참고

- OpenClaw는 Brave **Search** 요금제를 사용합니다. 레거시 구독(예: 월 2,000회 쿼리를 제공하던 기존 Free 요금제)이 있다면 계속 유효하지만, LLM Context나 더 높은 rate limit 같은 최신 기능은 포함되지 않습니다.
- 각 Brave 요금제에는 매월 **$5의 무료 크레딧**이 포함됩니다(매월 갱신). Search 요금제는 1,000회 요청당 $5이므로, 무료 크레딧으로 월 1,000회 쿼리를 처리할 수 있습니다. 예상치 못한 과금이 없도록 Brave 대시보드에서 사용 한도를 설정하세요. 최신 요금제는 [Brave API 포털](https://brave.com/search/api/)을 참고하세요.
- Search 요금제에는 LLM Context 엔드포인트와 AI 추론 권한이 포함됩니다. 결과를 저장해 모델을 학습하거나 튜닝하려면 명시적인 저장 권한이 있는 요금제가 필요합니다. 자세한 내용은 Brave [서비스 약관](https://api-dashboard.search.brave.com/terms-of-service)을 참고하세요.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 조정 가능).

전체 `web_search` 설정은 [Web tools](/tools/web)를 참고하세요.
