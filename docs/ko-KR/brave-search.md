---
summary: "`web_search` 기능을 위한 Brave Search API 설정 방법"
description: "OpenClaw에서 Brave Search API를 `web_search` provider로 구성하는 방법과 주요 파라미터, 요금제 관련 주의사항을 안내합니다."
read_when:
  - "`web_search` 도구에 Brave Search를 사용하고자 할 때"
  - "`BRAVE_API_KEY` 발급 또는 요금제 정보를 확인하고 싶을 때"
title: "Brave Search"
x-i18n:
  source_path: "brave-search.md"
---

# Brave Search API

OpenClaw는 웹 검색(`web_search`) 기능을 위해 Brave Search API를 지원함.

## API 키 발급 절차

1. [Brave Search API 포털](https://brave.com/search/api/)에 접속하여 계정을 생성함.
2. 대시보드에서 **Search** 요금제를 선택하고 API 키를 생성함.
3. 생성된 키를 설정 파일에 입력하거나 Gateway 환경 변수에 `BRAVE_API_KEY`로 등록함.

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

| 파라미터      | 설명                                                        |
| ------------- | ----------------------------------------------------------- |
| `query`       | 검색어 (필수)                                               |
| `count`       | 반환할 결과 수 (1~10, 기본값: 5)                            |
| `country`     | 2자리 ISO 국가 코드 (예: `"US"`, `"DE"`, `"KR"`)           |
| `language`    | 검색 결과 언어용 ISO 639-1 코드 (예: `"en"`, `"ko"`, `"fr"`) |
| `ui_lang`     | UI 요소 표시용 ISO 언어 코드                                |
| `freshness`   | 기간 필터: `day`(24시간), `week`, `month`, `year`           |
| `date_after`  | 지정된 날짜 이후의 결과만 포함 (YYYY-MM-DD)                 |
| `date_before` | 지정된 날짜 이전의 결과만 포함 (YYYY-MM-DD)                 |

**사용 예시:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 참고 사항

- OpenClaw는 Brave의 **Search** 요금제를 사용함. 월 2,000회 쿼리를 제공하던 기존 무료 요금제 사용자는 계속 이용 가능하나, LLM Context나 더 높은 Rate Limit와 같은 최신 기능은 포함되지 않을 수 있음.
- 각 Brave 요금제에는 매월 **$5의 무료 크레딧**이 포함되며 매월 갱신됨. Search 요금제는 1,000회 요청당 $5이므로 무료 크레딧으로 약 1,000회의 쿼리를 처리할 수 있음. 예상치 못한 과금을 방지하려면 Brave 대시보드에서 사용 한도를 설정할 것을 권장함. 최신 요금 정책은 [Brave API 포털](https://brave.com/search/api/)에서 확인 가능함.
- Search 요금제에는 LLM Context 엔드포인트 및 AI 추론 권한이 포함됨. 검색 결과를 저장하여 모델 학습이나 튜닝에 사용하려면 명시적인 저장 권한이 포함된 요금제가 필요함. 자세한 정보는 Brave [서비스 약관](https://api-dashboard.search.brave.com/terms-of-service)을 참조함.
- 검색 결과는 기본적으로 15분간 캐싱됨 (`cacheTtlMinutes`로 변경 가능).

전체 `web_search` 설정에 관한 내용은 [Web 도구](/tools/web) 문서를 참조함.
