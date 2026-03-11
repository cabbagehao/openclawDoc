---
summary: "어떤 기능이 비용을 발생시킬 수 있는지, 어떤 키가 사용되는지, 사용량을 어디서 볼 수 있는지 점검합니다"
read_when:
  - 어떤 기능이 유료 API를 호출할 수 있는지 이해하고 싶을 때
  - 키, 비용, 사용량 가시성을 점검해야 할 때
  - /status 또는 /usage 비용 표시를 설명할 때
title: "API Usage and Costs"
---

# API usage & costs

이 문서는 **API 키를 사용할 수 있는 기능**과 그 비용이 어디에 표시되는지를 정리합니다. OpenClaw 기능 중 provider 사용량이나 유료 API 호출을 발생시킬 수 있는 항목에 초점을 둡니다.

## Where costs show up (chat + CLI)

**세션별 비용 스냅샷**

* `/status`는 현재 세션의 모델, 컨텍스트 사용량, 마지막 응답 토큰 수를 표시합니다.
* 모델이 **API-key auth**를 사용하면 `/status`는 마지막 응답의 **추정 비용**도 표시합니다.

**메시지별 비용 푸터**

* `/usage full`은 모든 응답 뒤에 사용량 푸터를 붙이며, 여기에 **추정 비용**도 포함됩니다(API key 전용).
* `/usage tokens`는 토큰만 표시합니다. OAuth 흐름에서는 달러 비용을 숨깁니다.

**CLI usage windows (provider quotas)**

* `openclaw status --usage`와 `openclaw channels list`는 provider **usage windows**를 표시합니다.
  이는 메시지별 비용이 아니라 quota 스냅샷입니다.

자세한 내용과 예시는 [Token use & costs](/reference/token-use)를 참고하세요.

## How keys are discovered

OpenClaw는 다음 위치에서 자격 증명을 찾을 수 있습니다.

* **Auth profiles** (`auth-profiles.json`에 저장되며 agent별로 관리)
* **Environment variables** (`OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY` 등)
* **Config** (`models.providers.*.apiKey`, `tools.web.search.*`, `tools.web.fetch.firecrawl.*`, `memorySearch.*`, `talk.apiKey`)
* **Skills** (`skills.entries.<name>.apiKey`), 필요하면 키를 skill 프로세스 환경으로 내보낼 수 있습니다.

## Features that can spend keys

### 1) Core model responses (chat + tools)

모든 응답과 tool call은 **현재 모델 provider**(OpenAI, Anthropic 등)를 사용합니다. 이것이 사용량과 비용의 주요 원천입니다.

가격 설정은 [Models](/providers/models), 표시 방식은 [Token use & costs](/reference/token-use)를 참고하세요.

### 2) Media understanding (audio/image/video)

수신된 미디어는 응답 실행 전에 요약 또는 전사될 수 있습니다. 이 과정에서 모델/provider API를 사용합니다.

* Audio: OpenAI / Groq / Deepgram (이제 키가 있으면 **자동 활성화**)
* Image: OpenAI / Anthropic / Google
* Video: Google

[Media understanding](/nodes/media-understanding)을 참고하세요.

### 3) Memory embeddings + semantic search

semantic memory search는 원격 provider를 설정한 경우 **embedding API**를 사용합니다.

* `memorySearch.provider = "openai"` → OpenAI embeddings
* `memorySearch.provider = "gemini"` → Gemini embeddings
* `memorySearch.provider = "voyage"` → Voyage embeddings
* `memorySearch.provider = "mistral"` → Mistral embeddings
* `memorySearch.provider = "ollama"` → Ollama embeddings (로컬/자체 호스팅, 일반적으로 호스팅 API 과금 없음)
* 로컬 embeddings 실패 시 원격 provider로 선택적 fallback 가능

`memorySearch.provider = "local"`을 사용하면 로컬에만 유지할 수 있으며 API 사용도 없습니다.

[Memory](/concepts/memory)를 참고하세요.

### 4) Web search tool

`web_search`는 API key를 사용하며 provider에 따라 사용 요금이 발생할 수 있습니다.

* **Brave Search API**: `BRAVE_API_KEY` 또는 `tools.web.search.apiKey`
* **Gemini (Google Search)**: `GEMINI_API_KEY`
* **Grok (xAI)**: `XAI_API_KEY`
* **Kimi (Moonshot)**: `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`
* **Perplexity Search API**: `PERPLEXITY_API_KEY`

**Brave Search 무료 크레딧:** Brave 각 요금제에는 매월 갱신되는 무료 크레딧 $5가 포함됩니다. Search 플랜은 요청 1,000건당 $5이므로, 별도 과금 없이 월 1,000건을 처리할 수 있습니다. 예상치 못한 비용을 피하려면 Brave 대시보드에서 사용 한도를 설정하세요.

[Web tools](/tools/web)를 참고하세요.

### 5) Web fetch tool (Firecrawl)

`web_fetch`는 API key가 있으면 **Firecrawl**을 호출할 수 있습니다.

* `FIRECRAWL_API_KEY` 또는 `tools.web.fetch.firecrawl.apiKey`

Firecrawl이 설정되지 않았으면, 이 도구는 direct fetch + readability로 fallback 하며 유료 API는 사용하지 않습니다.

[Web tools](/tools/web)를 참고하세요.

### 6) Provider usage snapshots (status/health)

일부 상태 명령은 quota window나 auth health를 표시하기 위해 **provider usage endpoint**를 호출합니다. 일반적으로 호출량은 적지만 provider API를 사용합니다.

* `openclaw status --usage`
* `openclaw models status --json`

[Models CLI](/cli/models)를 참고하세요.

### 7) Compaction safeguard summarization

compaction safeguard는 세션 히스토리를 **현재 모델**로 요약할 수 있으며, 실행 시 provider API를 호출합니다.

[Session management + compaction](/reference/session-management-compaction)을 참고하세요.

### 8) Model scan / probe

`openclaw models scan`은 OpenRouter 모델을 probe할 수 있으며, probing이 활성화되어 있으면 `OPENROUTER_API_KEY`를 사용합니다.

[Models CLI](/cli/models)를 참고하세요.

### 9) Talk (speech)

Talk 모드는 설정되어 있으면 **ElevenLabs**를 호출할 수 있습니다.

* `ELEVENLABS_API_KEY` 또는 `talk.apiKey`

[Talk mode](/nodes/talk)를 참고하세요.

### 10) Skills (third-party APIs)

Skills는 `skills.entries.<name>.apiKey`에 `apiKey`를 저장할 수 있습니다. skill이 해당 키를 외부 API에 사용하면, 그 skill의 provider 정책에 따라 비용이 발생할 수 있습니다.

[Skills](/tools/skills)를 참고하세요.
